import { NextResponse } from "next/server";

const STRAPI = process.env.NEXT_PUBLIC_API_URL;
const REVALIDATE = 300; // 5 minutes

// Cache ISR au niveau de la route (Next 15)
export const revalidate = 300;

function coverOf(o) {
  if (!o?.couverture) return null;
  const c = Array.isArray(o.couverture) ? o.couverture[0] : o.couverture;
  return c?.url || null;
}

export async function GET() {
  try {
    if (!STRAPI) {
      return NextResponse.json({ oeuvres: [] }, { status: 200 });
    }

    // 1) Chapitres récents → ids uniques d'œuvres
    const chapRes = await fetch(
      `${STRAPI}/api/chapitres?sort=createdAt:desc&pagination[limit]=40&populate[oeuvres][fields][0]=documentId&fields[0]=createdAt`,
      { next: { revalidate: REVALIDATE } }
    );
    if (!chapRes.ok) {
      return NextResponse.json({ oeuvres: [] }, { status: 200 });
    }
    const chapData = await chapRes.json();
    const seen = new Set();
    const oeuvreIds = [];
    for (const ch of chapData.data || []) {
      const oe = Array.isArray(ch.oeuvres) ? ch.oeuvres[0] : ch.oeuvres;
      if (oe?.documentId && !seen.has(oe.documentId)) {
        seen.add(oe.documentId);
        oeuvreIds.push(oe.documentId);
        if (oeuvreIds.length >= 6) break;
      }
    }
    if (oeuvreIds.length === 0) {
      return NextResponse.json({ oeuvres: [] }, { status: 200 });
    }

    // 2) En parallèle : œuvres complètes + counts par œuvre
    const filters = oeuvreIds.map((id, i) => `filters[documentId][$in][${i}]=${id}`).join("&");
    const oeuvresPromise = fetch(
      `${STRAPI}/api/oeuvres?${filters}&populate[couverture]=true&populate[genres][fields][0]=titre`,
      { next: { revalidate: REVALIDATE } }
    ).then((r) => (r.ok ? r.json() : { data: [] }));

    const countsPromise = Promise.all(
      oeuvreIds.map((id) =>
        fetch(
          `${STRAPI}/api/chapitres?filters[oeuvres][documentId][$eq]=${id}&pagination[limit]=1&pagination[withCount]=true`,
          { next: { revalidate: REVALIDATE } }
        )
          .then((r) => (r.ok ? r.json() : null))
          .then((d) => [id, d?.meta?.pagination?.total || 0])
          .catch(() => [id, 0])
      )
    );

    const [oData, counts] = await Promise.all([oeuvresPromise, countsPromise]);
    const countMap = new Map(counts);
    const map = new Map((oData.data || []).map((o) => [o.documentId, o]));

    const ordered = oeuvreIds
      .map((id) => map.get(id))
      .filter(Boolean)
      .map((o) => ({
        documentId: o.documentId,
        titre: o.titre,
        type: o.type || "Type inconnu",
        synopsis: o.synopsis || "",
        traduction: o.traduction || null,
        etat: o.etat || null,
        couverture: coverOf(o),
        genres: (o.genres || []).map((g) => g.titre).filter(Boolean).slice(0, 4),
        chapitresCount: countMap.get(o.documentId) || 0,
      }));

    return NextResponse.json(
      { oeuvres: ordered },
      {
        status: 200,
        headers: {
          // Cache CDN/proxy : 5 min frais, 1 h en stale-while-revalidate
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600",
        },
      }
    );
  } catch (e) {
    return NextResponse.json({ oeuvres: [], error: e.message }, { status: 200 });
  }
}
