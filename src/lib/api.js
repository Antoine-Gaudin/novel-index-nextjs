import { cache } from "react";
import { slugify } from "@/utils/slugify";

const STRAPI = process.env.NEXT_PUBLIC_API_URL;
const SITE_URL = "https://www.novel-index.com";

// ═══════════════════════════════════════════
// ARTICLES (Strapi Content Type)
// ═══════════════════════════════════════════

export const getArticles = cache(async ({
  page = 1,
  pageSize = 25,
  categorie,
  type_contenu,
  mise_en_avant,
  sort = "publishedAt:desc"
} = {}) => {
  try {
    const params = new URLSearchParams();
    params.set("populate[0]", "couverture");
    params.set("populate[1]", "oeuvres_liees");
    params.set("populate[2]", "oeuvres_liees.couverture");
    params.set("populate[3]", "tags");
    params.set("populate[4]", "auteur");
    params.set("pagination[page]", page);
    params.set("pagination[pageSize]", pageSize);
    params.set("sort", sort);
    params.set("status", "published");

    if (categorie) params.set("filters[categorie][$eq]", categorie);
    if (type_contenu) params.set("filters[type_contenu][$eq]", type_contenu);
    if (mise_en_avant !== undefined) params.set("filters[mise_en_avant][$eq]", mise_en_avant);

    const res = await fetch(`${STRAPI}/api/articles?${params}`, {
      next: { revalidate: 900 }, // 15 min
    });

    if (!res.ok) return { data: [], meta: { pagination: { total: 0 } } };
    return await res.json();
  } catch {
    return { data: [], meta: { pagination: { total: 0 } } };
  }
});

export const getAdjacentArticles = cache(async (currentPublishedAt) => {
  try {
    const [prevRes, nextRes] = await Promise.all([
      fetch(`${STRAPI}/api/articles?filters[publishedAt][$lt]=${currentPublishedAt}&sort=publishedAt:desc&pagination[limit]=1&fields[0]=titre&fields[1]=slug&status=published`, {
        next: { revalidate: 3600 },
      }),
      fetch(`${STRAPI}/api/articles?filters[publishedAt][$gt]=${currentPublishedAt}&sort=publishedAt:asc&pagination[limit]=1&fields[0]=titre&fields[1]=slug&status=published`, {
        next: { revalidate: 3600 },
      }),
    ]);

    const prev = prevRes.ok ? (await prevRes.json()).data?.[0] || null : null;
    const next = nextRes.ok ? (await nextRes.json()).data?.[0] || null : null;
    return { prev, next };
  } catch {
    return { prev: null, next: null };
  }
});

export const getArticleBySlug = cache(async (slug) => {
  try {
    const params = new URLSearchParams();
    params.set("filters[slug][$eq]", slug);
    params.set("populate[0]", "couverture");
    params.set("populate[1]", "oeuvres_liees");
    params.set("populate[2]", "oeuvres_liees.couverture");
    params.set("populate[3]", "oeuvres_liees.genres");
    params.set("populate[4]", "tags");
    params.set("populate[5]", "auteur");
    params.set("status", "published");

    const res = await fetch(`${STRAPI}/api/articles?${params}`, {
      next: { revalidate: 3600 },
    });

    if (!res.ok) return null;
    const data = await res.json();
    return data.data?.[0] || null;
  } catch {
    return null;
  }
});

// ═══════════════════════════════════════════
// SORTIES — Données programmatiques
// ═══════════════════════════════════════════

export const getSortiesForDate = cache(async (dateISO) => {
  try {
    const PAGE_SIZE = 100;
    const MAX_PAGES = 10;
    const fetched = {};
    const results = [];

    let page = 0;
    let hasMore = true;

    while (hasMore && page < MAX_PAGES) {
      const url =
        `${STRAPI}/api/oeuvres` +
        `?populate[couverture]=true` +
        `&pagination[start]=${page * PAGE_SIZE}` +
        `&pagination[limit]=${PAGE_SIZE}` +
        `&populate[chapitres][filters][updatedAt][$gte]=${dateISO}T00:00:00` +
        `&populate[chapitres][filters][updatedAt][$lte]=${dateISO}T23:59:59`;

      const res = await fetch(url, { next: { revalidate: 3600 } });
      if (!res.ok) break;

      const data = await res.json();
      const oeuvres = data?.data || [];
      if (oeuvres.length === 0) { hasMore = false; break; }

      for (const oeuvre of oeuvres) {
        const docId = oeuvre.documentId || oeuvre.id;
        const chapitres = oeuvre.chapitres || [];

        if (chapitres.length > 0 && !fetched[docId]) {
          results.push({
            documentId: docId,
            titre: oeuvre.titre || "Sans titre",
            couverture: oeuvre.couverture?.url || null,
            type: oeuvre.type || null,
            traduction: oeuvre.traduction || null,
            updatedAt: oeuvre.updatedAt,
            chapitresCount: chapitres.length,
          });
          fetched[docId] = true;
        }
      }
      page++;
    }

    return results;
  } catch {
    return [];
  }
});

export async function getSortiesForWeek(startDate) {
  const results = [];
  const start = new Date(startDate);

  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const dateISO = d.toISOString().split("T")[0];
    const sorties = await getSortiesForDate(dateISO);
    results.push({ date: dateISO, sorties });
  }

  return results;
}

export async function getSortiesForMonth(year, month) {
  const results = [];
  const daysInMonth = new Date(year, month, 0).getDate();

  for (let day = 1; day <= daysInMonth; day++) {
    const dateISO = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    // Ne pas fetch le futur
    if (new Date(dateISO) > new Date()) break;
    const sorties = await getSortiesForDate(dateISO);
    results.push({ date: dateISO, sorties });
  }

  return results;
}

// ═══════════════════════════════════════════
// TRENDING — Oeuvres populaires
// ═══════════════════════════════════════════

export const getTrendingOeuvres = cache(async (limit = 20) => {
  try {
    const res = await fetch(
      `${STRAPI}/api/checkoeuvretimes?sort=count:desc&pagination[limit]=${limit}&populate[oeuvre][populate]=couverture`,
      { next: { revalidate: 1800 } } // 30 min
    );

    if (!res.ok) return [];
    const data = await res.json();
    return (data.data || []).map((item) => ({
      ...item.oeuvre,
      subscriptionCount: item.count,
    })).filter(Boolean);
  } catch {
    return [];
  }
});

// ═══════════════════════════════════════════
// OEUVRES POPULAIRES (pour pages univers)
// ═══════════════════════════════════════════

export const getOeuvreBySlug = cache(async (slug) => {
  try {
    // Chercher par documentId ou slug dans le titre
    const res = await fetch(
      `${STRAPI}/api/oeuvres?filters[documentId][$eq]=${slug}&populate[0]=couverture&populate[1]=genres&populate[2]=tags&populate[3]=chapitres`,
      { next: { revalidate: 3600 } }
    );

    if (!res.ok) return null;
    const data = await res.json();
    return data.data?.[0] || null;
  } catch {
    return null;
  }
});

// ═══════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════

export function getWeekBounds(weekSlug) {
  // Format: "2026-s11" → semaine 11 de 2026
  const [yearStr, weekStr] = weekSlug.split("-s");
  const year = parseInt(yearStr);
  const week = parseInt(weekStr);

  // Trouver le lundi de la semaine ISO
  const jan4 = new Date(year, 0, 4);
  const dayOfWeek = jan4.getDay() || 7;
  const monday = new Date(jan4);
  monday.setDate(jan4.getDate() - dayOfWeek + 1 + (week - 1) * 7);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  return { monday, sunday, year, week };
}

export function getCurrentWeekSlug() {
  const now = new Date();
  const jan4 = new Date(now.getFullYear(), 0, 4);
  const dayOfYear = Math.floor((now - new Date(now.getFullYear(), 0, 1)) / 86400000) + 1;
  const dayOfWeek = jan4.getDay() || 7;
  const weekNumber = Math.ceil((dayOfYear + dayOfWeek - 1) / 7);
  return `${now.getFullYear()}-s${String(weekNumber).padStart(2, "0")}`;
}

export function formatDateFR(dateStr) {
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function formatMonthFR(year, month) {
  return new Date(year, month - 1).toLocaleDateString("fr-FR", {
    month: "long",
    year: "numeric",
  });
}

const MOIS_FR = [
  "", "janvier", "fevrier", "mars", "avril", "mai", "juin",
  "juillet", "aout", "septembre", "octobre", "novembre", "decembre"
];

export function getMonthSlug(year, month) {
  return `${year}-${MOIS_FR[month]}`;
}

export function parseMonthSlug(slug) {
  const parts = slug.split("-");
  const year = parseInt(parts[0]);
  const monthName = parts.slice(1).join("-");
  const month = MOIS_FR.indexOf(monthName);
  return { year, month };
}

export { SITE_URL, STRAPI, slugify };
