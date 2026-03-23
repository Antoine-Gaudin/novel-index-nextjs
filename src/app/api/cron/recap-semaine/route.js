import { NextResponse } from "next/server";
import {
  getLastWeekBounds,
  formatDateFR,
  getISOWeekNumber,
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
  "from-emerald-600 to-teal-600",
  "from-teal-600 to-cyan-600",
  "from-green-600 to-emerald-600",
  "from-cyan-600 to-blue-600",
  "from-blue-600 to-indigo-600",
  "from-indigo-600 to-purple-600",
];

const JOURS_FR_SHORT = ["dim.", "lun.", "mar.", "mer.", "jeu.", "ven.", "sam."];
const JOURS_FR_FULL = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];

function slugifyTitle(titre) {
  return (titre || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function formatDateShort(dateISO) {
  const d = new Date(dateISO + "T12:00:00");
  return `${d.getDate()} ${["jan.", "fév.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."][d.getMonth()]}`;
}

// Fetch articles Strapi publiés dans la période (hors auto-générés)
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
        // Exclure les articles auto-générés (sorties-*, recap-*, nouvelles-oeuvres-*)
        const slug = a.slug || "";
        return !slug.startsWith("sorties-") && !slug.startsWith("recap-") && !slug.startsWith("nouvelles-oeuvres-");
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
    // Utiliser la route RSS interne
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

export async function GET() {
  try {
    const { start, end } = getLastWeekBounds();
    const weekNum = getISOWeekNumber(start);
    const year = new Date(start + "T12:00:00").getFullYear();
    const weekLabel = `Semaine ${weekNum}`;
    const startFR = formatDateFR(start);
    const endFR = formatDateFR(end);
    const dateRangeShort = `${new Date(start + "T12:00:00").getDate()} – ${new Date(end + "T12:00:00").getDate()} ${endFR.split(" ").slice(2).join(" ")}`;
    const titre = `Récap ${weekLabel} — ${startFR.split(" ").slice(1).join(" ")} au ${endFR}`;
    const slug = `recap-semaine-${weekNum}-${year}`;

    if (await checkArticleExists(slug)) {
      return NextResponse.json({ message: "Article déjà existant", slug });
    }

    // Fetch sorties jour par jour en parallèle
    const startDate = new Date(start + "T12:00:00");
    const dayPromises = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);
      const iso = d.toISOString().split("T")[0];
      dayPromises.push(
        fetchSortiesForDate(iso).then((sorties) => ({
          iso,
          day: d.getDay(),
          sorties,
          chapitres: sorties.reduce((s, o) => s + o.chapitresCount, 0),
          series: sorties.length,
        }))
      );
    }

    const daysData = await Promise.all(dayPromises);

    const allSorties = daysData.flatMap((d) => d.sorties);
    if (allSorties.length === 0) {
      return NextResponse.json({ message: "Aucune sortie cette semaine", start, end });
    }

    // Merge par oeuvre (additionner les chapitres sur la semaine)
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
    const { totalChapitres, totalSeries, teamsList, top5 } = totalStats;

    // Daily stats pour le graphique
    const dailyStats = daysData.map((d) => ({
      jour: JOURS_FR_FULL[d.day],
      date: formatDateShort(d.iso),
      chapitres: d.chapitres,
      series: d.series,
    }));

    const bestDay = dailyStats.reduce((best, d) => d.chapitres > best.chapitres ? d : best, dailyStats[0]);

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

    // Teams formatées
    const teamsFormatted = teamsList.map((t, i) => ({
      nom: t.nom,
      initial: t.nom.charAt(0).toUpperCase(),
      href: `/Teams/${t.id}-${slugifyTitle(t.nom)}`,
      oeuvresCount: t.oeuvresCount,
      chapitresCount: t.chapitresCount,
      color: TEAM_COLORS[i % TEAM_COLORS.length],
    }));

    // Fetch articles Strapi + RSS en parallèle
    const [strapiArticles, rssArticles] = await Promise.all([
      fetchStrapiArticles(start, end),
      fetchRSSArticles(),
    ]);
    const articles = [...strapiArticles, ...rssArticles];

    // Génération IA avec fallback
    const top1 = top5[0] || {};
    const top1Team = top1.teams?.[0]?.nom || "—";
    const teamsResume = teamsList.slice(0, 5).map((t) => `${t.nom} (${t.chapitresCount} chap.)`).join(", ");

    const [introAI, analyseAI, conclusionAI] = await Promise.all([
      generateText(
        `Écris un paragraphe (3-4 phrases) pour introduire le récap de la ${weekLabel} sur Novel-Index. ` +
        `Total : ${totalChapitres} chapitres, ${totalSeries} séries, ${teamsList.length} teams. ` +
        `Meilleur jour : ${bestDay.jour} avec ${bestDay.chapitres} chapitres. Sois naturel.`
      ),
      generateText(
        `Écris 2-3 phrases d'analyse sur la ${weekLabel}. ` +
        `Top 1 : "${top1.titre}" (${top1.chapitresCount} chap.). ` +
        `Teams les plus actives : ${teamsResume}. Commente les tendances.`
      ),
      generateText(
        `Écris 2 phrases de conclusion pour le récap hebdomadaire. ` +
        `${totalChapitres} chapitres cette semaine. Invite à suivre la semaine prochaine.`
      ),
    ]);

    const intro = introAI || `La ${weekLabel} a vu la publication de ${totalChapitres} chapitres sur ${totalSeries} séries, grâce au travail de ${teamsList.length} team${teamsList.length > 1 ? "s" : ""} de traduction. Le ${bestDay.jour.toLowerCase()} a été le jour le plus actif avec ${bestDay.chapitres} chapitres. Un rythme soutenu pour la communauté francophone de Novel-Index.`;
    const analyse = analyseAI || `"${top1.titre}" domine le classement de la semaine avec ${top1.chapitresCount} chapitres publiés par ${top1Team}.${top5[1] ? ` "${top5[1].titre}" suit avec ${top5[1].chapitresCount} chapitres.` : ""} Côté teams, ${teamsResume}.`;
    const conclusion = conclusionAI || `C'est tout pour le récap de la ${weekLabel}. ${totalChapitres} chapitres traduits, c'est le bilan de ces sept jours. Rendez-vous la semaine prochaine pour un nouveau récap, et d'ici là, bonne lecture.`;

    // Construction du JSON
    const templateData = {
      _type: "recap-semaine",
      article: {
        titre: `Récap ${weekLabel}`,
        sousTitre: `${totalChapitres} chapitres traduits du ${dateRangeShort}`,
        weekLabel,
        dateRange: dateRangeShort,
        stats: { chapitres: totalChapitres, series: totalSeries, teams: teamsList.length },
      },
      dailyStats,
      top5: top5Formatted,
      teams: teamsFormatted,
      articles,
      aiTexts: { intro, analyse, conclusion },
    };

    const contenu = JSON.stringify(templateData);
    const extrait = `${totalChapitres} chapitres sur ${totalSeries} séries — récap de la ${weekLabel}.`;

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
    console.error("Cron recap-semaine error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
