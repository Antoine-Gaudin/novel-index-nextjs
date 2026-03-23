const fetch = require('node-fetch');

// Fonction de slugification unifiée (identique à src/utils/slugify.js)
function slugify(str) {
  if (!str) return "";

  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;

async function getOeuvresRoutes() {
  const response = await fetch(`${apiBaseUrl}/api/oeuvres`);
  const jsonResponse = await response.json();
  const oeuvres = jsonResponse.data || [];

  if (!Array.isArray(oeuvres)) {
    throw new Error("L'API oeuvres ne retourne pas un tableau !");
  }

  return oeuvres.map((oeuvre) => ({
    loc: `/oeuvre/${oeuvre.documentId}-${slugify(oeuvre.titre)}`,
    changefreq: "daily",
    priority: 0.8,
  }));
}

async function getTagsRoutes() {
  const response = await fetch(`${apiBaseUrl}/api/tags`);
  const jsonResponse = await response.json();
  const tags = jsonResponse.data || [];

  return tags.map((tag) => ({
    loc: `/tags-genres/tag/${slugify(tag.titre)}`,
    changefreq: "weekly",
    priority: 0.6,
  }));
}

async function getGenresRoutes() {
  const response = await fetch(`${apiBaseUrl}/api/genres`);
  const jsonResponse = await response.json();
  const genres = jsonResponse.data || [];

  return genres.map((genre) => ({
    loc: `/tags-genres/genre/${slugify(genre.titre)}`,
    changefreq: "weekly",
    priority: 0.6,
  }));
}

async function getArticlesRoutes() {
  const PAGE_SIZE = 100;
  const results = [];
  let page = 0;
  let hasMore = true;

  while (hasMore && page < 20) {
    const response = await fetch(
      `${apiBaseUrl}/api/articles?fields[0]=slug&fields[1]=updatedAt&status=published&pagination[start]=${page * PAGE_SIZE}&pagination[limit]=${PAGE_SIZE}&sort=publishedAt:desc`
    );
    const jsonResponse = await response.json();
    const articles = jsonResponse.data || [];
    if (articles.length === 0) { hasMore = false; break; }

    for (const art of articles) {
      if (art.slug) {
        results.push({
          loc: `/actualites/${art.slug}`,
          lastmod: art.updatedAt || undefined,
          changefreq: "weekly",
          priority: 0.7,
        });
      }
    }
    page++;
  }
  return results;
}

/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://www.novel-index.com',
  generateRobotsTxt: true,
  additionalPaths: async (config) => {
    const [oeuvres, tags, genres, articles] = await Promise.all([
      getOeuvresRoutes(),
      getTagsRoutes(),
      getGenresRoutes(),
      getArticlesRoutes(),
    ]);

    // Pages statiques supplémentaires
    const staticPages = [
      { loc: "/tags-genres/tag", changefreq: "weekly", priority: 0.7 },
      { loc: "/tags-genres/genre", changefreq: "weekly", priority: 0.7 },
      { loc: "/actualites", changefreq: "daily", priority: 0.8 },
      { loc: "/sitemap", changefreq: "weekly", priority: 0.3 },
    ];

    const allRoutes = [...staticPages, ...oeuvres, ...tags, ...genres, ...articles];
    console.log(`Sitemap: ${oeuvres.length} oeuvres, ${tags.length} tags, ${genres.length} genres, ${articles.length} articles`);

    return allRoutes;
  },
};
