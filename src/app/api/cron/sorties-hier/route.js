import { NextResponse } from "next/server";
import {
  getYesterdayISO,
  formatDateFR,
  fetchSortiesForDate,
  buildStats,
  generateText,
  slugify,
  coverUrl,
  checkArticleExists,
  createArticleInStrapi,
} from "@/lib/cron-helpers";

const TYPE_LABELS = {
  "web-novel": "Web novels",
  "light-novel": "Light novels",
  "manga": "Mangas",
  "webtoon": "Webtoons",
};

const TEAM_COLORS = [
  "from-blue-600 to-cyan-600",
  "from-indigo-600 to-purple-600",
  "from-green-600 to-emerald-600",
  "from-orange-600 to-red-600",
  "from-pink-600 to-rose-600",
  "from-teal-600 to-cyan-600",
];

function slugifyTitle(titre) {
  return (titre || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export async function GET() {
  try {
    const dateISO = getYesterdayISO();
    const dateFR = formatDateFR(dateISO);
    const titre = `Sorties du ${dateFR}`;
    const slug = `sorties-${slugify(dateFR)}`;

    if (await checkArticleExists(slug)) {
      return NextResponse.json({ message: "Article déjà existant", slug });
    }

    // Fetch sorties du jour
    const sorties = await fetchSortiesForDate(dateISO);
    if (sorties.length === 0) {
      return NextResponse.json({ message: "Aucune sortie hier", dateISO });
    }

    const stats = buildStats(sorties);
    const { totalChapitres, totalSeries, teamsList, top5, byType } = stats;
    const top1 = top5[0] || {};
    const teamsResume = teamsList.slice(0, 5).map((t) => `${t.nom} (${t.chapitresCount} chap.)`).join(", ");

    // Fetch semaine (7 jours en parallèle)
    const weekDays = [];
    const JOURS_FR = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
    const baseDate = new Date(dateISO + "T12:00:00");
    const weekPromises = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(baseDate);
      d.setDate(baseDate.getDate() - i);
      const iso = d.toISOString().split("T")[0];
      weekPromises.push(
        fetchSortiesForDate(iso).then((s) => ({
          jour: JOURS_FR[d.getDay()],
          count: s.reduce((sum, o) => sum + o.chapitresCount, 0),
          active: i === 0,
        }))
      );
    }
    const weekData = await Promise.all(weekPromises);

    // Génération IA en parallèle
    const top1Team = top1.teams?.[0]?.nom || "—";
    const [introAI, podiumAI, podiumDetailAI, teamsEditorialAI, coupDeCoeur1AI, coupDeCoeur2AI, conclusion1AI, conclusion2AI] = await Promise.all([
      generateText(
        `Écris un paragraphe (3-4 phrases) pour introduire les sorties d'hier sur Novel-Index. ` +
        `Données : ${totalChapitres} chapitres, ${totalSeries} séries, ${teamsList.length} teams. ` +
        `Date : ${dateFR}. Sois naturel, comme si tu parlais à des lecteurs passionnés.`
      ),
      generateText(
        `Écris 2 phrases pour présenter le podium des séries les plus actives hier. ` +
        `Top 1 : "${top1.titre}" (${top1.chapitresCount} chapitres, team ${top1Team}). Donne envie.`
      ),
      generateText(
        `Écris 2-3 phrases qui commentent le podium. Top 1 : "${top1.titre}" (${top1.chapitresCount} chap. par ${top1Team}). ` +
        `${top5[1] ? `Top 2 : "${top5[1].titre}" (${top5[1].chapitresCount} chap.)` : ""}. ` +
        `${top5[2] ? `Top 3 : "${top5[2].titre}" (${top5[2].chapitresCount} chap.)` : ""}.`
      ),
      generateText(
        `Écris un paragraphe (3-4 phrases) sur les teams de traduction actives hier. ` +
        `Teams : ${teamsResume}. Total : ${teamsList.length} teams. Mets en valeur leur travail.`
      ),
      generateText(
        `Écris 3-4 phrases pour présenter "${top1.titre}" comme coup de coeur. ` +
        `Traduit par ${top1Team}. ${top1.chapitresCount} nouveaux chapitres. Donne envie sans spoiler.`
      ),
      generateText(
        `Écris 2-3 phrases qui complètent la présentation de "${top1.titre}". ` +
        `Invite à voir la fiche sur Novel-Index.`
      ),
      generateText(
        `Écris 3-4 phrases de conclusion pour le récap des sorties. ` +
        `${totalChapitres} chapitres sur ${totalSeries} séries par ${teamsList.length} teams. Remercie les teams.`
      ),
      generateText(
        `Écris 2 phrases invitant à revenir demain et à s'inscrire sur Novel-Index. Amical, pas commercial.`
      ),
    ]);

    // Fallback si l'IA est indisponible (rate limit, erreur, etc.)
    const intro = introAI || `Le ${dateFR}, ${totalChapitres} nouveaux chapitres ont été publiés sur ${totalSeries} séries différentes grâce au travail de ${teamsList.length} team${teamsList.length > 1 ? "s" : ""} de traduction. Une journée bien remplie pour la communauté francophone de Novel-Index.`;
    const podium = podiumAI || `Voici le podium des séries les plus actives de la journée. En tête, "${top1.titre}" avec ${top1.chapitresCount} nouveaux chapitres.`;
    const podiumDetail = podiumDetailAI || `"${top1.titre}" domine le classement avec ${top1.chapitresCount} chapitres publiés par ${top1Team}.${top5[1] ? ` "${top5[1].titre}" suit avec ${top5[1].chapitresCount} chapitres.` : ""}${top5[2] ? ` "${top5[2].titre}" complète le podium avec ${top5[2].chapitresCount} chapitres.` : ""}`;
    const teamsEditorial = teamsEditorialAI || `${teamsList.length} team${teamsList.length > 1 ? "s" : ""} de traduction ${teamsList.length > 1 ? "ont contribué" : "a contribué"} aux sorties du jour. ${teamsResume}. Sans leur travail, aucun de ces chapitres ne serait disponible en français.`;
    const coupDeCoeur1 = coupDeCoeur1AI || `Notre coup de coeur du jour : "${top1.titre}", traduit par ${top1Team}. Avec ${top1.chapitresCount} nouveaux chapitres publiés aujourd'hui, c'est la série la plus active de la journée.`;
    const coupDeCoeur2 = coupDeCoeur2AI || `Retrouvez la fiche complète de "${top1.titre}" sur Novel-Index pour accéder à tous les chapitres traduits en français.`;
    const conclusion1 = conclusion1AI || `C'est tout pour les sorties du ${dateFR}. ${totalChapitres} chapitres sur ${totalSeries} séries, c'est le bilan de cette journée. Un grand merci aux teams de traduction qui rendent tout cela possible.`;
    const conclusion2 = conclusion2AI || `Rendez-vous demain pour les prochaines sorties. Et si ce n'est pas encore fait, créez votre compte sur Novel-Index pour suivre vos séries préférées.`;

    // Construction top3 au format template
    const sorted = [...sorties].sort((a, b) => b.chapitresCount - a.chapitresCount);
    const top3 = sorted.slice(0, 3).map((o, i) => ({
      rang: i + 1,
      titre: o.titre,
      team: o.teams[0]?.nom || "—",
      type: TYPE_LABELS[o.type] || o.type,
      chapitres: o.chapitresCount,
      cover: coverUrl(o.couverture) || "",
      href: `/oeuvre/${o.documentId}-${slugifyTitle(o.titre)}`,
    }));

    // Catégories par type
    const categories = Object.entries(byType).map(([type, oeuvres]) => ({
      label: TYPE_LABELS[type] || type,
      icon: { "web-novel": "💻", "light-novel": "📖", "manga": "📚", "webtoon": "🎨" }[type] || "📄",
      count: oeuvres.length,
      oeuvres: oeuvres.map((o) => ({
        titre: o.titre,
        team: o.teams[0]?.nom || "—",
        chapitres: o.chapitresCount,
        genre: o.genres.slice(0, 3).join(" · "),
        cover: coverUrl(o.couverture) || "",
        href: `/oeuvre/${o.documentId}-${slugifyTitle(o.titre)}`,
      })),
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

    // Données JSON complètes pour le template
    const templateData = {
      _type: "sorties",
      article: {
        titre: `Sorties du ${dateFR}`,
        sousTitre: `${totalChapitres} nouveaux chapitres sur ${totalSeries} séries`,
        date: dateFR,
        stats: { chapitres: totalChapitres, series: totalSeries, teams: teamsList.length },
      },
      top3,
      categories,
      teams: teamsFormatted,
      weekData,
      aiTexts: { intro, podium, podiumDetail, teamsEditorial, coupDeCoeur1, coupDeCoeur2, conclusion1, conclusion2 },
    };

    const contenu = JSON.stringify(templateData);
    const extrait = `${totalChapitres} nouveaux chapitres sur ${totalSeries} séries — récap des sorties du ${dateFR}.`;

    const oeuvresDocIds = sorties.slice(0, 20).map((o) => o.documentId);
    const result = await createArticleInStrapi({
      titre,
      slug,
      contenu,
      extrait,
      categorie: "actualite",
      oeuvresDocIds,
      mise_en_avant: true,
    });

    return NextResponse.json({
      success: true,
      slug,
      titre,
      stats: { chapitres: totalChapitres, series: totalSeries, teams: teamsList.length },
      articleId: result.data?.documentId || result.data?.id,
    });
  } catch (err) {
    console.error("Cron sorties-hier error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
