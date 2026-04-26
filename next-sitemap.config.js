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

// Slug spécifique aux auteurs : fallback URL-encoding pour les noms 100% non-latin
function auteurSlug(name) {
  if (!name) return "";
  const trimmed = name.trim();
  if (!trimmed) return "";
  const s = slugify(trimmed);
  if (s) return s;
  return encodeURIComponent(trimmed.toLowerCase());
}

const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;

async function getOeuvresRoutes() {
  // Pagination pour ne pas dépasser la limite par défaut de Strapi (25)
  const PAGE_SIZE = 100;
  const results = [];
  let page = 0;
  let hasMore = true;

  while (hasMore && page < 50) {
    const response = await fetch(
      `${apiBaseUrl}/api/oeuvres?fields[0]=documentId&fields[1]=titre&fields[2]=updatedAt&populate[chapitres][fields][0]=publishedAt&populate[chapitres][sort]=publishedAt:desc&populate[chapitres][pagination][limit]=1&populate[achatlivres][fields][0]=publishedAt&populate[achatlivres][sort]=publishedAt:desc&populate[achatlivres][pagination][limit]=1&pagination[start]=${page * PAGE_SIZE}&pagination[limit]=${PAGE_SIZE}`
    );
    const jsonResponse = await response.json();
    const oeuvres = jsonResponse.data || [];
    if (oeuvres.length === 0) { hasMore = false; break; }

    for (const oeuvre of oeuvres) {
      // Date la plus récente entre : dernier chapitre, dernier achatlivre, updatedAt de l'œuvre
      const lastChapterDate = oeuvre.chapitres?.[0]?.publishedAt || null;
      const lastAchatDate = oeuvre.achatlivres?.[0]?.publishedAt || null;
      const candidates = [lastChapterDate, lastAchatDate, oeuvre.updatedAt].filter(Boolean);
      const lastmod = candidates.length > 0
        ? new Date(Math.max(...candidates.map(d => new Date(d).getTime()))).toISOString()
        : undefined;

      results.push({
        loc: `/oeuvre/${oeuvre.documentId}-${slugify(oeuvre.titre)}`,
        lastmod,
        changefreq: "daily",
        priority: 0.8,
      });
    }
    page++;
  }
  return results;
}

async function getTagsRoutes() {
  const response = await fetch(
    `${apiBaseUrl}/api/tags?populate[oeuvres][fields][0]=updatedAt&pagination[limit]=200`
  );
  const jsonResponse = await response.json();
  const tags = jsonResponse.data || [];

  return tags
    .filter((t) => t.titre)
    .map((tag) => {
      const oeuvres = tag.oeuvres || [];
      const dates = oeuvres.map((o) => o.updatedAt).filter(Boolean);
      const lastmod = dates.length
        ? new Date(Math.max(...dates.map((d) => new Date(d).getTime()))).toISOString()
        : undefined;
      const count = oeuvres.length;
      const priority = count >= 20 ? 0.7 : count >= 5 ? 0.6 : 0.5;
      return {
        loc: `/tags-genres/tag/${slugify(tag.titre)}`,
        lastmod,
        changefreq: "weekly",
        priority,
      };
    });
}

async function getGenresRoutes() {
  const response = await fetch(
    `${apiBaseUrl}/api/genres?populate[oeuvres][fields][0]=updatedAt&pagination[limit]=200`
  );
  const jsonResponse = await response.json();
  const genres = jsonResponse.data || [];

  return genres
    .filter((g) => g.titre)
    .map((genre) => {
      const oeuvres = genre.oeuvres || [];
      const dates = oeuvres.map((o) => o.updatedAt).filter(Boolean);
      const lastmod = dates.length
        ? new Date(Math.max(...dates.map((d) => new Date(d).getTime()))).toISOString()
        : undefined;
      const count = oeuvres.length;
      const priority = count >= 20 ? 0.7 : count >= 5 ? 0.6 : 0.5;
      return {
        loc: `/tags-genres/genre/${slugify(genre.titre)}`,
        lastmod,
        changefreq: "weekly",
        priority,
      };
    });
}

async function getAuteursRoutes() {
  const PAGE_SIZE = 100;
  const seen = new Map(); // slug -> { name, lastmod }
  let page = 0;
  let hasMore = true;

  while (hasMore && page < 50) {
    const response = await fetch(
      `${apiBaseUrl}/api/oeuvres?fields[0]=auteur&fields[1]=updatedAt&pagination[start]=${page * PAGE_SIZE}&pagination[limit]=${PAGE_SIZE}`
    );
    const jsonResponse = await response.json();
    const oeuvres = jsonResponse.data || [];
    if (oeuvres.length === 0) { hasMore = false; break; }

    for (const o of oeuvres) {
      const auteur = (o.auteur || "").trim();
      if (!auteur) continue;
      const slug = auteurSlug(auteur);
      if (!slug) continue;
      const updated = o.updatedAt ? new Date(o.updatedAt) : null;
      const existing = seen.get(slug);
      if (!existing) {
        seen.set(slug, { name: auteur, lastmod: updated });
      } else if (updated && (!existing.lastmod || updated > existing.lastmod)) {
        existing.lastmod = updated;
      }
    }
    page++;
  }

  return [...seen.entries()].map(([slug, { lastmod }]) => ({
    loc: `/auteur/${slug}`,
    lastmod: lastmod ? lastmod.toISOString() : undefined,
    changefreq: "weekly",
    priority: 0.6,
  }));
}

async function getTeamsRoutes() {
  const response = await fetch(
    `${apiBaseUrl}/api/teams?fields[0]=documentId&fields[1]=titre&fields[2]=updatedAt&fields[3]=etat&populate[oeuvres][fields][0]=updatedAt&pagination[limit]=200`
  );
  const jsonResponse = await response.json();
  const teams = jsonResponse.data || [];

  const staticIndex = [{ loc: "/Teams", changefreq: "daily", priority: 0.8 }];

  const routes = teams
    .filter((t) => t.titre && t.documentId)
    .map((team) => {
      const oeuvres = team.oeuvres || [];
      const oeuvresDates = oeuvres.map((o) => o.updatedAt).filter(Boolean);
      const allDates = [team.updatedAt, ...oeuvresDates].filter(Boolean);
      const lastmod = allDates.length
        ? new Date(Math.max(...allDates.map((d) => new Date(d).getTime()))).toISOString()
        : undefined;
      const count = oeuvres.length;
      const isActive = team.etat === true;
      const priority = isActive
        ? count >= 20
          ? 0.7
          : count >= 5
            ? 0.6
            : 0.5
        : 0.4;
      return {
        loc: `/Teams/${team.documentId}-${slugify(team.titre)}`,
        lastmod,
        changefreq: "weekly",
        priority,
      };
    });

  return [...staticIndex, ...routes];
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
    const [oeuvres, tags, genres, articles, auteurs, teams] = await Promise.all([
      getOeuvresRoutes(),
      getTagsRoutes(),
      getGenresRoutes(),
      getArticlesRoutes(),
      getAuteursRoutes(),
      getTeamsRoutes(),
    ]);

    // Pages statiques supplémentaires
    const staticPages = [
      { loc: "/tags-genres/tag", changefreq: "weekly", priority: 0.7 },
      { loc: "/tags-genres/genre", changefreq: "weekly", priority: 0.7 },
      { loc: "/auteur", changefreq: "weekly", priority: 0.7 },
      { loc: "/actualites", changefreq: "daily", priority: 0.8 },
      { loc: "/sitemap", changefreq: "weekly", priority: 0.3 },
    ];

    const allRoutes = [...staticPages, ...oeuvres, ...tags, ...genres, ...articles, ...auteurs, ...teams];
    console.log(`Sitemap: ${oeuvres.length} oeuvres, ${tags.length} tags, ${genres.length} genres, ${articles.length} articles, ${auteurs.length} auteurs, ${teams.length} teams (incluant /Teams)`);

    return allRoutes;
  },
};
