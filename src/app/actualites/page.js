import ActualitesClient from "./ActualitesClient";

const API = process.env.NEXT_PUBLIC_API_URL;

export const metadata = {
  title: "Actualités - Novel-Index",
  description:
    "Retrouvez toutes les actualités de Novel-Index : annonces, mises à jour, événements et guides autour des light novels, web novels, manga et manhwa traduits en français.",
  alternates: {
    canonical: "https://www.novel-index.com/actualites",
  },
  openGraph: {
    title: "Actualités - Novel-Index",
    description:
      "Retrouvez toutes les actualités de Novel-Index : annonces, mises à jour, événements et guides.",
    url: "https://www.novel-index.com/actualites",
    siteName: "Novel-Index",
    locale: "fr_FR",
    type: "website",
  },
};

// ── SSR fetches ──

async function fetchArticlesSSR() {
  try {
    const params = new URLSearchParams();
    params.set("populate[0]", "couverture");
    params.set("populate[1]", "auteur");
    params.set("populate[2]", "tags");
    params.set("pagination[page]", "1");
    params.set("pagination[pageSize]", "12");
    params.set("sort", "publishedAt:desc");
    params.set("status", "published");

    const res = await fetch(`${API}/api/articles?${params}`, { next: { revalidate: 300 } });
    if (!res.ok) return { data: [], meta: { pagination: { total: 0, pageCount: 0, page: 1 } } };
    return res.json();
  } catch {
    return { data: [], meta: { pagination: { total: 0, pageCount: 0, page: 1 } } };
  }
}

async function fetchFeaturedSSR() {
  try {
    const params = new URLSearchParams();
    params.set("filters[mise_en_avant][$eq]", "true");
    params.set("populate[0]", "couverture");
    params.set("populate[1]", "auteur");
    params.set("sort", "publishedAt:desc");
    params.set("pagination[limit]", "1");
    params.set("status", "published");

    const res = await fetch(`${API}/api/articles?${params}`, { next: { revalidate: 300 } });
    if (!res.ok) return null;
    const data = await res.json();
    return data.data?.[0] || null;
  } catch {
    return null;
  }
}

async function fetchLatestBySlugPrefixSSR(prefix) {
  try {
    const params = new URLSearchParams();
    params.set("filters[slug][$startsWith]", prefix);
    params.set("sort", "publishedAt:desc");
    params.set("pagination[limit]", "1");
    params.set("fields[0]", "titre");
    params.set("fields[1]", "slug");
    params.set("fields[2]", "extrait");
    params.set("fields[3]", "publishedAt");
    params.set("status", "published");

    const res = await fetch(`${API}/api/articles?${params}`, { next: { revalidate: 300 } });
    if (!res.ok) return null;
    const data = await res.json();
    return data.data?.[0] || null;
  } catch {
    return null;
  }
}

export default async function ActualitesPage() {
  const [articlesRes, featured, jour, semaine, mois, nouvelles] = await Promise.all([
    fetchArticlesSSR(),
    fetchFeaturedSSR(),
    fetchLatestBySlugPrefixSSR("sorties-"),
    fetchLatestBySlugPrefixSSR("recap-semaine-"),
    fetchLatestBySlugPrefixSSR("bilan-"),
    fetchLatestBySlugPrefixSSR("nouvelles-oeuvres-"),
  ]);

  return (
    <ActualitesClient
      initialArticles={articlesRes.data || []}
      initialPagination={{
        page: articlesRes.meta?.pagination?.page || 1,
        pageCount: articlesRes.meta?.pagination?.pageCount || 1,
        total: articlesRes.meta?.pagination?.total || 0,
      }}
      initialFeatured={featured}
      initialRecaps={{ jour, semaine, mois, nouvelles }}
    />
  );
}
