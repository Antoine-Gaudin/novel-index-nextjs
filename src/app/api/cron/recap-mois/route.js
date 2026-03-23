import { NextResponse } from "next/server";
import {
  getLastMonthInfo,
  fetchSortiesForDate,
  buildStats,
  generateText,
  slugify,
  coverUrl,
  checkArticleExists,
  createArticleInStrapi,
} from "@/lib/cron-helpers";

const STRAPI = process.env.NEXT_PUBLIC_API_URL;

const TYPE_LABELS = {
  "web-novel": "Web novels",
  "light-novel": "Light novels",
  "manga": "Mangas",
  "webtoon": "Webtoons",
};

const TEAM_COLORS = [
  "from-amber-600 to-orange-600",
  "from-orange-600 to-red-600",
  "from-red-600 to-pink-600",
  "from-pink-600 to-purple-600",
  "from-purple-600 to-indigo-600",
  "from-indigo-600 to-blue-600",
];

function slugifyTitle(titre) {
  return (titre || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function formatDateShort(dateISO) {
  const d = new Date(dateISO + "T12:00:00");
  return `${d.getDate()} ${["jan.", "fév.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."][d.getMonth()]}`;
}

// Fetch articles Strapi publiés dans le mois (hors auto-générés)
async function fetchStrapiArticles(startISO, endISO) {
  try {
    const params = new URLSearchParams();
    params.set("filters[publishedAt][$gte]", `${startISO}T00:00:00`);
    params.set("filters[publishedAt][$lte]", `${endISO}T23:59:59`);
    params.set("fields[0]", "titre");
    params.set("fields[1]", "slug");
    params.set("fields[2]", "extrait");
    params.set("fields[3]", "publishedAt");
    params.set("fields[4]", "categorie");
    params.set("populate[couverture]", "true");
    params.set("sort", "publishedAt:desc");
    params.set("pagination[limit]", "20");
    params.set("status", "published");

    const res = await fetch(`${STRAPI}/api/articles?${params}`);
    if (!res.ok) return [];
    const data = await res.json();

    return (data.data || [])
      .filter((a) => {
        const slug = a.slug || "";
        return !slug.startsWith("sorties-") && !slug.startsWith("recap-") && !slug.startsWith("bilan-") && !slug.startsWith("nouvelles-oeuvres-");
      })
      .map((a) => ({
        titre: a.titre,
        source: "Novel-Index",
        date: formatDateShort(a.publishedAt?.split("T")[0] || startISO),
        href: `/actualites/${a.slug}`,
        cover: coverUrl(a.couverture?.url) || "",
        externe: false,
      }));
  } catch (err) {
    console.error("fetchStrapiArticles error:", err);
    return [];
  }
}

// Fetch articles RSS
async function fetchRSSArticles() {
  try {
    const res = await fetch(`${STRAPI ? "http://localhost:3000" : ""}/api/rss`);
    if (!res.ok) return [];
    const data = await res.json();

    return (data.items || []).slice(0, 5).map((item) => ({
      titre: item.titre || "Sans titre",
      source: item.source || "Externe",
      date: item.date || "",
      href: item.url || "#",
      cover: item.cover || "",
      externe: true,
    }));
  } catch (err) {
    console.error("fetchRSSArticles error:", err);
    return [];
  }
}

// Fetch community stats
async function fetchCommunaute(year, month) {
  try {
    const res = await fetch(`${STRAPI}/api/users?fields[0]=id&fields[1]=createdAt`);
    if (!res.ok) return null;
    const users = await res.json();
    const nouveaux = users.filter((u) => {
      const d = new Date(u.createdAt);
      return d.getMonth() === month - 1 && d.getFullYear() === year;
    }).length;
    return { nouveauxInscrits: nouveaux, totalMembres: users.length };
  } catch {
    return null;
  }
}

export async function GET() {
  try {
    const { year, month, daysInMonth, label: moisLabel } = getLastMonthInfo();
    const titre = `Bilan de ${moisLabel}`;
    const slug = `bilan-${slugify(moisLabel)}`;

    if (await checkArticleExists(slug)) {
      return NextResponse.json({ message: "Article déjà existant", slug });
    }

    // Fetch sorties jour par jour
    const dailyMap = {};
    const allSorties = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const iso = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const sorties = await fetchSortiesForDate(iso);
      dailyMap[day] = {
        chapitres: sorties.reduce((s, o) => s + o.chapitresCount, 0),
        series: sorties.length,
      };
      allSorties.push(...sorties);
    }

    if (allSorties.length === 0) {
      return NextResponse.json({ message: "Aucune sortie ce mois", moisLabel });
    }

    // Merge par oeuvre
    const merged = {};
    allSorties.forEach((o) => {
      if (!merged[o.documentId]) {
        merged[o.documentId] = { ...o };
      } else {
        merged[o.documentId].chapitresCount += o.chapitresCount;
      }
    });
    const mergedList = Object.values(merged);
    const totalStats = buildStats(mergedList);
    const { totalChapitres, totalSeries, teamsList, top5, byType } = totalStats;

    // Weekly stats
    const weeklyStats = [];
    let weekStart = 1;
    let weekNum = 1;
    while (weekStart <= daysInMonth) {
      const weekEnd = Math.min(weekStart + 6, daysInMonth);
      let wChapitres = 0;
      for (let d = weekStart; d <= weekEnd; d++) {
        wChapitres += dailyMap[d]?.chapitres || 0;
      }
      weeklyStats.push({ label: `S${weekNum}`, chapitres: wChapitres });
      weekStart = weekEnd + 1;
      weekNum++;
    }

    // Top 5 formaté
    const sorted = [...mergedList].sort((a, b) => b.chapitresCount - a.chapitresCount);
    const top5Formatted = sorted.slice(0, 5).map((o, i) => ({
      rang: i + 1,
      titre: o.titre,
      team: o.teams[0]?.nom || "—",
      type: TYPE_LABELS[o.type] || o.type,
      chapitres: o.chapitresCount,
      cover: coverUrl(o.couverture) || "",
      href: `/oeuvre/${o.documentId}-${slugifyTitle(o.titre)}`,
    }));

    // Categories
    const categories = Object.entries(byType).map(([type, oeuvres]) => ({
      label: TYPE_LABELS[type] || type,
      count: oeuvres.length,
      chapitres: oeuvres.reduce((s, o) => s + (o.chapitresCount || 0), 0),
    }));

    // Teams formatées
    const teamsFormatted = teamsList.slice(0, 10).map((t, i) => ({
      nom: t.nom,
      initial: t.nom.charAt(0).toUpperCase(),
      href: `/Teams/${t.id}-${slugifyTitle(t.nom)}`,
      oeuvresCount: t.oeuvresCount,
      chapitresCount: t.chapitresCount,
      color: TEAM_COLORS[i % TEAM_COLORS.length],
    }));

    // Fetch articles + RSS + communauté en parallèle
    const startISO = `${year}-${String(month).padStart(2, "0")}-01`;
    const endISO = `${year}-${String(month).padStart(2, "0")}-${String(daysInMonth).padStart(2, "0")}`;

    const [strapiArticles, rssArticles, communaute] = await Promise.all([
      fetchStrapiArticles(startISO, endISO),
      fetchRSSArticles(),
      fetchCommunaute(year, month),
    ]);
    const articles = [...strapiArticles, ...rssArticles];

    // Génération IA avec fallback
    const top1 = top5[0] || {};
    const top1Team = top1.teams?.[0]?.nom || "—";
    const teamsResume = teamsList.slice(0, 5).map((t) => `${t.nom} (${t.chapitresCount} chap.)`).join(", ");

    const [introAI, analyseAI, teamsAI, conclusionAI] = await Promise.all([
      generateText(
        `Écris un paragraphe (3-4 phrases) pour introduire le bilan du mois de ${moisLabel} sur Novel-Index. ` +
        `Total : ${totalChapitres} chapitres, ${totalSeries} séries, ${teamsList.length} teams. ` +
        `Fais un bilan engageant de ce mois de traduction.`
      ),
      generateText(
        `Écris 2-3 phrases d'analyse sur le mois de ${moisLabel}. ` +
        `Top 1 : "${top1.titre}" (${top1.chapitresCount} chap.). ` +
        `Commente les tendances de traduction du mois.`
      ),
      generateText(
        `Écris 2-3 phrases sur les teams de traduction les plus actives en ${moisLabel}. ` +
        `Top teams : ${teamsResume}. Mets en valeur leur contribution.`
      ),
      generateText(
        `Écris 2 phrases de conclusion pour le bilan mensuel de ${moisLabel}. ` +
        `${totalChapitres} chapitres au total. Invite à suivre le mois prochain.`
      ),
    ]);

    const intro = introAI || `Le mois de ${moisLabel} a été riche en traductions avec ${totalChapitres} chapitres publiés sur ${totalSeries} séries, grâce au travail de ${teamsList.length} team${teamsList.length > 1 ? "s" : ""}. Un mois qui confirme la vitalité de la communauté francophone de Novel-Index.`;
    const analyse = analyseAI || `"${top1.titre}" domine le classement du mois avec ${top1.chapitresCount} chapitres publiés par ${top1Team}.${top5[1] ? ` "${top5[1].titre}" suit avec ${top5[1].chapitresCount} chapitres.` : ""} Les tendances restent portées par les web novels.`;
    const teams = teamsAI || `${teamsList.length} teams ont contribué ce mois-ci. ${teamsResume}. Leur travail régulier permet à la communauté francophone d'accéder à un catalogue toujours plus riche.`;
    const conclusion = conclusionAI || `C'est tout pour le bilan de ${moisLabel}. ${totalChapitres} chapitres traduits par ${teamsList.length} teams — rendez-vous le mois prochain pour un nouveau bilan.`;

    // Construction du JSON pour le template
    const templateData = {
      _type: "recap-mois",
      article: {
        titre: `Bilan de ${moisLabel}`,
        sousTitre: `${totalChapitres} chapitres traduits sur ${totalSeries} séries`,
        moisLabel,
        stats: { chapitres: totalChapitres, series: totalSeries, teams: teamsList.length },
      },
      weeklyStats,
      top5: top5Formatted,
      categories,
      teams: teamsFormatted,
      articles,
      communaute,
      aiTexts: { intro, analyse, teams, conclusion },
    };

    const contenu = JSON.stringify(templateData);
    const extrait = `${totalChapitres} chapitres sur ${totalSeries} séries — bilan complet de ${moisLabel}.`;

    const result = await createArticleInStrapi({
      titre,
      slug,
      contenu,
      extrait,
      categorie: "actualite",
      oeuvresDocIds: top5.slice(0, 5).map((o) => o.documentId),
    });

    return NextResponse.json({
      success: true,
      slug,
      titre,
      stats: { chapitres: totalChapitres, series: totalSeries, teams: teamsList.length },
      articleId: result.data?.documentId || result.data?.id,
    });
  } catch (err) {
    console.error("Cron recap-mois error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
