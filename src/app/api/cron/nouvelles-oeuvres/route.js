import { NextResponse } from "next/server";
import {
  getLastMonthInfo,
  generateText,
  slugify,
  checkArticleExists,
  createArticleInStrapi,
  coverUrl,
} from "@/lib/cron-helpers";

const STRAPI = process.env.NEXT_PUBLIC_API_URL;

const TYPE_ICONS = {
  "web-novel": "💻",
  "light-novel": "📖",
  "manga": "📚",
  "webtoon": "🎨",
};
const TYPE_LABELS_MAP = {
  "web-novel": "Web novels",
  "light-novel": "Light novels",
  "manga": "Mangas",
  "webtoon": "Webtoons",
};

/**
 * Fetch toutes les nouvelles oeuvres du mois avec les relations complètes
 * (couverture, teams + teamliens, genres, chapitres, users_permissions_users)
 */
async function fetchFullOeuvresForMonth(year, month) {
  const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
  const daysInMonth = new Date(year, month, 0).getDate();
  const endDate = `${year}-${String(month).padStart(2, "0")}-${String(daysInMonth).padStart(2, "0")}`;

  const PAGE_SIZE = 100;
  const results = [];
  let page = 0;
  let hasMore = true;

  while (hasMore && page < 10) {
    const url =
      `${STRAPI}/api/oeuvres` +
      `?populate[couverture]=true` +
      `&populate[teams][populate][0]=teamliens` +
      `&populate[genres]=true` +
      `&populate[chapitres][fields][0]=titre` +
      `&populate[users_permissions_users]=true` +
      `&filters[createdAt][$gte]=${startDate}T00:00:00` +
      `&filters[createdAt][$lte]=${endDate}T23:59:59` +
      `&pagination[start]=${page * PAGE_SIZE}` +
      `&pagination[limit]=${PAGE_SIZE}` +
      `&sort=createdAt:desc`;

    const res = await fetch(url);
    if (!res.ok) break;
    const data = await res.json();
    const oeuvres = data?.data || [];
    if (oeuvres.length === 0) { hasMore = false; break; }

    for (const o of oeuvres) {
      const team = (o.teams || [])[0];
      const teamName = team?.titre || team?.nom || "—";
      const teamUrl = (team?.teamliens || [])[0]?.url || null;
      const indexeurUser = (o.users_permissions_users || [])[0];
      const indexeurName = indexeurUser?.username || indexeurUser?.email || null;
      const indexeurDocId = indexeurUser?.documentId || indexeurUser?.id || null;

      results.push({
        documentId: o.documentId || o.id,
        titre: o.titre || "Sans titre",
        type: o.type || "web-novel",
        cover: coverUrl(o.couverture?.url) || "",
        team: teamName,
        teamUrl,
        auteur: o.auteur || null,
        indexeur: indexeurName,
        indexeurDocId,
        genres: (o.genres || []).map((g) => g.titre).filter(Boolean),
        synopsis: o.synopsis || "",
        chapitres: (o.chapitres || []).length,
        href: `/oeuvre/${o.documentId || o.id}-${slugify(o.titre || "")}`,
        createdAt: o.createdAt,
      });
    }
    page++;
  }

  return results;
}

/**
 * Pour chaque indexeur unique, fetch le nombre total d'oeuvres indexées sur la plateforme
 */
async function fetchIndexeurTotals(oeuvres) {
  const uniqueIndexeurs = [...new Set(oeuvres.map((o) => o.indexeurDocId).filter(Boolean))];
  const totals = {};

  await Promise.all(
    uniqueIndexeurs.map(async (docId) => {
      try {
        const res = await fetch(
          `${STRAPI}/api/oeuvres?filters[users_permissions_users][documentId][$eq]=${docId}&pagination[limit]=1&pagination[withCount]=true`
        );
        if (res.ok) {
          const data = await res.json();
          totals[docId] = data?.meta?.pagination?.total || 0;
        }
      } catch { /* ignore */ }
    })
  );

  return totals;
}

/**
 * Génère le texte de remerciement pour chaque oeuvre (indexeur + team)
 */
function buildTexteRemerciement(oeuvre) {
  let t = "";
  if (oeuvre.indexeur) {
    t += `Merci à ${oeuvre.indexeur}`;
    if (oeuvre.indexeurTotal > 1) t += ` (${oeuvre.indexeurTotal} oeuvres indexées sur Novel-Index)`;
    t += ` pour l'ajout de cette série. `;
  }
  if (oeuvre.team && oeuvre.team !== "—") {
    t += `Un grand merci à la team ${oeuvre.team} pour leur travail de traduction.`;
    if (oeuvre.teamUrl) {
      t += ` N'hésitez pas à visiter leur site pour découvrir l'ensemble de leur catalogue.`;
    }
  }
  return t.trim() || null;
}

export async function GET() {
  try {
    const { year, month, label: moisLabel } = getLastMonthInfo();
    const titre = `Nouvelles oeuvres — ${moisLabel}`;
    const slug = `nouvelles-oeuvres-${slugify(moisLabel)}`;

    if (await checkArticleExists(slug)) {
      return NextResponse.json({ message: "Article déjà existant", slug });
    }

    // 1. Fetch toutes les oeuvres du mois avec relations complètes
    const oeuvres = await fetchFullOeuvresForMonth(year, month);

    if (oeuvres.length === 0) {
      return NextResponse.json({ message: "Aucune nouvelle oeuvre ce mois", moisLabel });
    }

    // 2. Fetch les totaux d'indexation par indexeur
    const indexeurTotals = await fetchIndexeurTotals(oeuvres);

    // 3. Injecter indexeurTotal + texte de remerciement
    oeuvres.forEach((o) => {
      o.indexeurTotal = o.indexeurDocId ? (indexeurTotals[o.indexeurDocId] || 0) : 0;
      o.texte = buildTexteRemerciement(o);
    });

    // 4. Répartition par type
    const byTypeCount = {};
    oeuvres.forEach((o) => {
      const t = o.type || "web-novel";
      if (!byTypeCount[t]) byTypeCount[t] = 0;
      byTypeCount[t]++;
    });
    const typesResume = Object.entries(byTypeCount).map(([t, c]) => `${c} ${t}`).join(", ");

    const byType = Object.entries(byTypeCount).map(([type, count]) => ({
      type,
      label: TYPE_LABELS_MAP[type] || type,
      icon: TYPE_ICONS[type] || "📄",
      count,
    }));

    // 5. Générer les textes IA (intro + conclusion)
    const [intro, conclusion] = await Promise.all([
      generateText(
        `Écris un paragraphe (3-4 phrases) pour présenter les nouvelles oeuvres ajoutées sur Novel-Index en ${moisLabel}. ` +
        `${oeuvres.length} nouvelles oeuvres : ${typesResume}. ` +
        `Donne envie de les découvrir. Rappelle que Novel-Index indexe les traductions françaises.`
      ),
      generateText(
        `Écris 2 phrases de conclusion après avoir listé les ${oeuvres.length} nouvelles oeuvres de ${moisLabel}. ` +
        `Invite les lecteurs à parcourir le catalogue et à suivre les prochains ajouts.`
      ),
    ]);

    // 6. JSON structuré pour le template
    const templateData = {
      _type: "nouvelles-oeuvres",
      article: {
        titre,
        sousTitre: `${oeuvres.length} nouvelles oeuvres ajoutées ce mois`,
        moisLabel,
      },
      totalOeuvres: oeuvres.length,
      byType,
      oeuvres,
      aiTexts: { intro, conclusion },
    };

    const contenu = JSON.stringify(templateData);
    const extrait = `${oeuvres.length} nouvelles oeuvres ajoutées sur Novel-Index en ${moisLabel}.`;

    const oeuvresDocIds = oeuvres.slice(0, 20).map((o) => o.documentId);
    const result = await createArticleInStrapi({
      titre,
      slug,
      contenu,
      extrait,
      categorie: "annonce",
      oeuvresDocIds,
    });

    return NextResponse.json({
      success: true,
      slug,
      titre,
      total: oeuvres.length,
      articleId: result.data?.documentId || result.data?.id,
    });
  } catch (err) {
    console.error("Cron nouvelles-oeuvres error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
