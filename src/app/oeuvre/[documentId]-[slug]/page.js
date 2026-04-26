import { notFound, permanentRedirect } from "next/navigation";
import { slugify } from "@/utils/slugify";
import OeuvreClient from "./OeuvreClient";

const STRAPI = process.env.NEXT_PUBLIC_API_URL;

async function fetchOeuvre(documentId) {
  try {
    const res = await fetch(
      `${STRAPI}/api/oeuvres/${documentId}?populate[0]=couverture&populate[1]=tags&populate[2]=genres&populate[3]=chapitres&populate[4]=achatlivres`,
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data.data || null;
  } catch {
    return null;
  }
}

async function fetchTeam(traduction) {
  if (!traduction) return null;
  try {
    const res = await fetch(
      `${STRAPI}/api/teams?filters[titre][$eqi]=${encodeURIComponent(traduction)}&populate=couverture&pagination[limit]=1`,
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data.data?.[0] || null;
  } catch {
    return null;
  }
}

async function fetchSimilar(genres, currentDocumentId) {
  if (!genres?.length) return [];
  try {
    const titres = genres.slice(0, 3).map((g) => encodeURIComponent(g.titre)).join(",");
    const res = await fetch(
      `${STRAPI}/api/oeuvres?populate=couverture&filters[genres][titre][$in]=${titres}&filters[documentId][$ne]=${currentDocumentId}&pagination[limit]=6`,
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return (data.data || []).filter((o) => o.documentId !== currentDocumentId).slice(0, 5);
  } catch {
    return [];
  }
}

async function fetchSubscribersCount(documentId) {
  try {
    const res = await fetch(
      `${STRAPI}/api/checkoeuvretimes?filters[oeuvres][documentId][$eq]=${documentId}&pagination[limit]=1`,
      { next: { revalidate: 600 } }
    );
    if (!res.ok) return 0;
    const data = await res.json();
    return data.meta?.pagination?.total || 0;
  } catch {
    return 0;
  }
}

async function fetchByType(type, currentDocumentId) {
  if (!type) return [];
  try {
    const res = await fetch(
      `${STRAPI}/api/oeuvres?populate=couverture&filters[type][$eq]=${encodeURIComponent(type)}&filters[documentId][$ne]=${currentDocumentId}&pagination[limit]=10&sort=updatedAt:desc`,
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return (data.data || [])
      .filter((o) => o.documentId !== currentDocumentId)
      .slice(0, 6);
  } catch {
    return [];
  }
}

async function fetchByGenre(genreTitre, currentDocumentId) {
  if (!genreTitre) return [];
  try {
    const res = await fetch(
      `${STRAPI}/api/oeuvres?populate=couverture&filters[genres][titre][$eqi]=${encodeURIComponent(genreTitre)}&filters[documentId][$ne]=${currentDocumentId}&pagination[limit]=12&sort=updatedAt:desc`,
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return (data.data || []).filter((o) => o.documentId !== currentDocumentId);
  } catch {
    return [];
  }
}

async function fetchByTag(tagTitre, currentDocumentId) {
  if (!tagTitre) return [];
  try {
    const res = await fetch(
      `${STRAPI}/api/oeuvres?populate=couverture&filters[tags][titre][$eqi]=${encodeURIComponent(tagTitre)}&filters[documentId][$ne]=${currentDocumentId}&pagination[limit]=12&sort=updatedAt:desc`,
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return (data.data || []).filter((o) => o.documentId !== currentDocumentId);
  } catch {
    return [];
  }
}

async function fetchByAuthor(auteur, currentDocumentId) {
  if (!auteur) return [];
  try {
    const res = await fetch(
      `${STRAPI}/api/oeuvres?populate=couverture&filters[auteur][$eqi]=${encodeURIComponent(auteur)}&filters[documentId][$ne]=${currentDocumentId}&pagination[limit]=12&sort=updatedAt:desc`,
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return (data.data || []).filter((o) => o.documentId !== currentDocumentId);
  } catch {
    return [];
  }
}

async function fetchByTeam(traduction, currentDocumentId) {
  if (!traduction) return [];
  try {
    const res = await fetch(
      `${STRAPI}/api/oeuvres?populate=couverture&filters[traduction][$eqi]=${encodeURIComponent(traduction)}&filters[documentId][$ne]=${currentDocumentId}&pagination[limit]=12&sort=updatedAt:desc`,
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return (data.data || []).filter((o) => o.documentId !== currentDocumentId);
  } catch {
    return [];
  }
}

// Cherche un auteur dont une œuvre partage le plus de tags avec la nôtre.
// Retourne { auteur, oeuvres: [] } — toutes les œuvres de cet auteur (avec score).
async function fetchSimilarAuthor(tags, currentDocumentId, currentAuteur) {
  if (!tags?.length) return null;
  try {
    const tagTitres = tags.slice(0, 8).map((t) => encodeURIComponent(t.titre));
    const filterParts = tagTitres.map((t) => `filters[tags][titre][$in]=${t}`).join("&");
    const res = await fetch(
      `${STRAPI}/api/oeuvres?populate[couverture]=true&populate[tags][fields][0]=titre&populate[genres][fields][0]=titre&${filterParts}&filters[documentId][$ne]=${currentDocumentId}&pagination[limit]=80`,
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const list = data.data || [];

    const ourTagSet = new Set((tags || []).map((t) => (t.titre || "").toLowerCase()));
    const currentAuthorLc = (currentAuteur || "").toLowerCase().trim();

    // Score par œuvre = nb de tags communs
    const scored = list
      .filter((o) => o.auteur && o.auteur.toLowerCase().trim() !== currentAuthorLc)
      .map((o) => {
        const oTags = (o.tags || []).map((t) => (t.titre || "").toLowerCase());
        const matched = oTags.filter((t) => ourTagSet.has(t));
        return { oeuvre: o, score: matched.length, matchedTags: matched };
      })
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score);

    if (!scored.length) return null;

    // Auteur = celui de la meilleure œuvre
    const topAuteur = scored[0].oeuvre.auteur;
    const topAuteurLc = topAuteur.toLowerCase().trim();

    // Toutes les œuvres de cet auteur dans la liste, conservant le meilleur score par doc
    const byAuthor = scored.filter(
      (x) => x.oeuvre.auteur && x.oeuvre.auteur.toLowerCase().trim() === topAuteurLc
    );

    return {
      auteur: topAuteur,
      bestScore: scored[0].score,
      bestMatchedTags: scored[0].matchedTags,
      oeuvres: byAuthor.slice(0, 6).map((x) => ({ ...x.oeuvre, _matchedTags: x.matchedTags, _score: x.score })),
    };
  } catch {
    return null;
  }
}

function extractDocumentId(rawSegment) {
  const firstHyphen = rawSegment.indexOf("-");
  return firstHyphen > 0 ? rawSegment.substring(0, firstHyphen) : rawSegment;
}

export default async function OeuvrePage({ params }) {
  const resolvedParams = await params;
  const rawSegment = resolvedParams["documentId]-[slug"];
  const documentId = extractDocumentId(rawSegment);
  const raw = await fetchOeuvre(documentId);

  if (!raw) {
    notFound();
  }

  const oeuvre = {
    ...raw,
    titre: (raw.titre || "").trim(),
    titrealt: (raw.titrealt || "").trim() || raw.titrealt,
    auteur: (raw.auteur || "").trim() || raw.auteur,
  };

  // Redirection 308 si le slug de l'URL ne correspond pas au slug canonique
  const canonicalSlug = slugify(oeuvre.titre);
  if (canonicalSlug && rawSegment !== `${documentId}-${canonicalSlug}`) {
    permanentRedirect(`/oeuvre/${documentId}-${canonicalSlug}`);
  }

  const chapitres = (oeuvre.chapitres || []).sort((a, b) => a.order - b.order);

  // Choix des taxonomies « pivots » : premier genre / premier tag de l'œuvre
  const primaryGenre = oeuvre.genres?.[0]?.titre || null;
  const primaryTag = oeuvre.tags?.[0]?.titre || null;

  const [
    team,
    similar,
    subscribers,
    byTypeRaw,
    byGenreRaw,
    byTagRaw,
    byAuthorRaw,
    byTeamRaw,
    similarAuthorRaw,
  ] = await Promise.all([
    fetchTeam(oeuvre.traduction),
    fetchSimilar(oeuvre.genres, oeuvre.documentId),
    fetchSubscribersCount(oeuvre.documentId),
    fetchByType(oeuvre.type, oeuvre.documentId),
    fetchByGenre(primaryGenre, oeuvre.documentId),
    fetchByTag(primaryTag, oeuvre.documentId),
    fetchByAuthor(oeuvre.auteur, oeuvre.documentId),
    fetchByTeam(oeuvre.traduction, oeuvre.documentId),
    fetchSimilarAuthor(oeuvre.tags, oeuvre.documentId, oeuvre.auteur),
  ]);

  // Cascade d'exclusion : auteur > team > genre > tag > type > similaires.
  // Chaque bloc retire les œuvres déjà affichées au-dessus pour éviter les doublons.
  const used = new Set([oeuvre.documentId]);
  const take = (list, n = 6) => {
    const out = [];
    for (const o of list) {
      if (used.has(o.documentId)) continue;
      out.push(o);
      used.add(o.documentId);
      if (out.length >= n) break;
    }
    return out;
  };

  const byAuthor = take(byAuthorRaw, 6);
  const byTeam = take(byTeamRaw, 6);
  const byGenre = take(byGenreRaw, 6);
  const byTag = take(byTagRaw, 6);
  const byType = take(byTypeRaw, 6);
  const similarFiltered = take(similar, 6);

  // Auteur similaire : on ne pioche que des œuvres pas déjà affichées
  let similarAuthor = null;
  if (similarAuthorRaw && similarAuthorRaw.oeuvres?.length) {
    const filteredOeuvres = similarAuthorRaw.oeuvres.filter((o) => !used.has(o.documentId));
    if (filteredOeuvres.length > 0) {
      filteredOeuvres.forEach((o) => used.add(o.documentId));
      similarAuthor = { ...similarAuthorRaw, oeuvres: filteredOeuvres.slice(0, 6) };
    }
  }

  return (
    <OeuvreClient
      initialOeuvre={oeuvre}
      initialChapitres={chapitres}
      documentId={documentId}
      initialTeam={team}
      initialSimilar={similarFiltered}
      initialSubscribers={subscribers}
      initialByType={byType}
      initialByGenre={byGenre}
      initialByTag={byTag}
      initialByAuthor={byAuthor}
      initialByTeam={byTeam}
      initialSimilarAuthor={similarAuthor}
      primaryGenre={primaryGenre}
      primaryTag={primaryTag}
    />
  );
}
