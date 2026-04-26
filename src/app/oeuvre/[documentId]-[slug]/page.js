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

  const [team, similar, subscribers] = await Promise.all([
    fetchTeam(oeuvre.traduction),
    fetchSimilar(oeuvre.genres, oeuvre.documentId),
    fetchSubscribersCount(oeuvre.documentId),
  ]);

  // Excluons aussi les œuvres déjà présentes dans similar pour éviter les doublons
  const similarIds = new Set(similar.map((o) => o.documentId));
  const byTypeRaw = await fetchByType(oeuvre.type, oeuvre.documentId);
  const byType = byTypeRaw.filter((o) => !similarIds.has(o.documentId)).slice(0, 6);

  return (
    <OeuvreClient
      initialOeuvre={oeuvre}
      initialChapitres={chapitres}
      documentId={documentId}
      initialTeam={team}
      initialSimilar={similar}
      initialSubscribers={subscribers}
      initialByType={byType}
    />
  );
}
