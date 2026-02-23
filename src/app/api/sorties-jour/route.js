import { NextResponse } from "next/server";

// Cache cette route pendant 5 minutes pour éviter la surcharge
export const revalidate = 300;

const STRAPI = process.env.NEXT_PUBLIC_API_URL;
const PAGE_SIZE = 100;
const MAX_PAGES = 10;

export async function GET() {
  const today = new Date().toISOString().split("T")[0];
  const fetched = {};
  const results = [];

  try {
    // 1. Oeuvres avec chapitres mis à jour aujourd'hui
    let page = 0;
    let hasMore = true;

    while (hasMore && page < MAX_PAGES) {
      const url =
        `${STRAPI}/api/oeuvres` +
        `?populate[couverture]=true` +
        `&pagination[start]=${page * PAGE_SIZE}` +
        `&pagination[limit]=${PAGE_SIZE}` +
        `&populate[chapitres][filters][updatedAt][$gte]=${today}T00:00:00`;

      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) break;

      const data = await res.json();
      const oeuvres = data?.data || [];

      if (oeuvres.length === 0) { hasMore = false; break; }

      for (const oeuvre of oeuvres) {
        const docId = oeuvre.documentId || oeuvre.id;
        const chapitres = oeuvre.chapitres || [];

        if (chapitres.length > 0 && !fetched[docId]) {
          const lastChapitreUpdate = chapitres
            .map((c) => new Date(c.updatedAt))
            .sort((a, b) => b - a)[0]
            ?.toISOString() || null;

          results.push({
            documentId: docId,
            titre: oeuvre.titre || "Sans titre",
            couverture: oeuvre.couverture?.url || null,
            type: oeuvre.type || null,
            traduction: oeuvre.traduction || null,
            updatedAt: oeuvre.updatedAt,
            lastChapitreUpdate,
            source: "chapitre",
            chapitresCount: chapitres.length,
          });
          fetched[docId] = true;
        }
      }

      page++;
    }

    // 2. Achatlivres mis à jour aujourd'hui
    const achatRes = await fetch(
      `${STRAPI}/api/Achatlivres` +
        `?filters[updatedAt][$gte]=${today}T00:00:00` +
        `&populate[oeuvres][populate]=couverture`,
      { cache: "no-store" }
    );

    if (achatRes.ok) {
      const achatJson = await achatRes.json();
      for (const achat of achatJson?.data || []) {
        const oeuvre = achat.oeuvres?.[0];
        if (!oeuvre || fetched[oeuvre.documentId]) continue;

        results.push({
          documentId: oeuvre.documentId,
          titre: oeuvre.titre || "Sans titre",
          couverture: oeuvre.couverture?.url || null,
          type: oeuvre.type || null,
          traduction: oeuvre.traduction || null,
          updatedAt: oeuvre.updatedAt,
          lastChapitreUpdate: null,
          source: "achat",
          chapitresCount: 0,
        });
        fetched[oeuvre.documentId] = true;
      }
    }

    // 3. Tri par date la plus récente
    results.sort((a, b) => {
      const dateA = new Date(a.lastChapitreUpdate || a.updatedAt);
      const dateB = new Date(b.lastChapitreUpdate || b.updatedAt);
      return dateB - dateA;
    });

    return NextResponse.json({
      date: today,
      count: results.length,
      data: results,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}
