import { notFound } from "next/navigation";
import JsonLd from "../../components/JsonLd";
import ArticleClient from "./ArticleClient";

const API = process.env.NEXT_PUBLIC_API_URL;
const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://www.novel-index.com";

// ── Fetch article depuis Strapi (réutilisé par generateMetadata + page) ──

async function fetchArticle(slug) {
  const params = new URLSearchParams();
  params.set("filters[slug][$eq]", slug);
  params.set("populate[0]", "couverture");
  params.set("populate[1]", "oeuvres_liees");
  params.set("populate[2]", "oeuvres_liees.couverture");
  params.set("populate[3]", "tags");
  params.set("populate[4]", "auteur");
  params.set("status", "published");

  try {
    const res = await fetch(`${API}/api/articles?${params}`, { next: { revalidate: 300 } });
    if (!res.ok) return null;
    const data = await res.json();
    return data.data?.[0] || null;
  } catch {
    return null;
  }
}

async function fetchAdjacent(publishedAt) {
  if (!publishedAt) return { prev: null, next: null };
  try {
    const [prevRes, nextRes] = await Promise.all([
      fetch(`${API}/api/articles?filters[publishedAt][$lt]=${publishedAt}&sort=publishedAt:desc&pagination[limit]=1&fields[0]=titre&fields[1]=slug&status=published`, { next: { revalidate: 300 } }),
      fetch(`${API}/api/articles?filters[publishedAt][$gt]=${publishedAt}&sort=publishedAt:asc&pagination[limit]=1&fields[0]=titre&fields[1]=slug&status=published`, { next: { revalidate: 300 } }),
    ]);
    const prev = prevRes.ok ? (await prevRes.json()).data?.[0] || null : null;
    const next = nextRes.ok ? (await nextRes.json()).data?.[0] || null : null;
    return { prev, next };
  } catch {
    return { prev: null, next: null };
  }
}

// ── Helpers SEO ──

function coverUrl(url) {
  if (!url) return null;
  return url.startsWith("http") ? url : `${API}${url}`;
}

function buildDescription(article, templateData) {
  if (article.extrait) return article.extrait;

  if (templateData) {
    const sub = templateData.article?.sousTitre || "";
    const mois = templateData.article?.moisLabel || "";
    switch (templateData._type) {
      case "sorties":
        return `Sorties du ${templateData.article?.date || ""} sur Novel-Index. ${sub}. Découvrez les derniers chapitres traduits en français.`;
      case "recap-semaine":
        return `Récap ${templateData.article?.weekLabel || ""} sur Novel-Index. ${sub}. Toutes les traductions de la semaine en un coup d'oeil.`;
      case "recap-mois":
        return `Bilan de ${mois} sur Novel-Index. ${sub}. Le résumé complet du mois de traductions françaises.`;
      case "nouvelles-oeuvres":
        return `${templateData.totalOeuvres || ""} nouvelles oeuvres ajoutées en ${mois} sur Novel-Index. Web novels, light novels, mangas et webtoons traduits en français.`;
    }
  }

  // Fallback : extraire du contenu texte
  if (article.contenu) {
    const text = article.contenu.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
    return text.length > 160 ? text.slice(0, 157) + "..." : text;
  }

  return `${article.titre} — Article sur Novel-Index, plateforme d'indexation de traductions françaises.`;
}

function buildKeywords(article, tags) {
  const base = ["Novel-Index", "traductions françaises", "web novel", "light novel", "manga", "webtoon"];
  if (tags && tags.length > 0) {
    tags.forEach((t) => { if (t.titre) base.push(t.titre); });
  }
  if (article.categorie) base.push(article.categorie);
  return base;
}

// ── generateMetadata (SSR) ──

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const article = await fetchArticle(slug);
  if (!article) return { title: "Article introuvable — Novel-Index" };

  let templateData = null;
  if (article.contenu && article.contenu.trim().startsWith("{")) {
    try {
      const parsed = JSON.parse(article.contenu);
      if (["sorties", "recap-semaine", "recap-mois", "nouvelles-oeuvres"].includes(parsed._type)) {
        templateData = parsed;
      }
    } catch { /* pas du JSON */ }
  }

  const titre = article.titre;
  const description = buildDescription(article, templateData);
  const tags = article.tags || [];
  const keywords = buildKeywords(article, tags);
  const image = coverUrl(article.couverture?.url) || `${SITE}/logo.png`;
  const url = `${SITE}/actualites/${slug}`;

  // Titre avec tags si présents
  const tagSuffix = tags.length > 0 ? ` — ${tags.slice(0, 3).map((t) => t.titre).join(", ")}` : "";
  const fullTitle = `${titre}${tagSuffix} | Novel-Index`;

  return {
    title: fullTitle,
    description,
    keywords,
    alternates: { canonical: url },
    openGraph: {
      title: fullTitle,
      description,
      url,
      siteName: "Novel-Index",
      images: [{ url: image, alt: titre, width: 1200, height: 630 }],
      locale: "fr_FR",
      type: "article",
      publishedTime: article.publishedAt || undefined,
      modifiedTime: article.updatedAt || undefined,
      authors: article.auteur?.username ? [article.auteur.username] : undefined,
      tags: tags.map((t) => t.titre),
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [image],
      creator: "@Index_Novel",
    },
  };
}

// ── JSON-LD schemas ──

function buildArticleJsonLd(article, slug, templateData) {
  const image = coverUrl(article.couverture?.url) || `${SITE}/logo.png`;
  const url = `${SITE}/actualites/${slug}`;
  const description = buildDescription(article, templateData);

  return {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    "headline": article.titre,
    "description": description,
    "url": url,
    "image": image,
    "datePublished": article.publishedAt || article.createdAt,
    "dateModified": article.updatedAt || article.publishedAt || article.createdAt,
    "author": {
      "@type": "Organization",
      "name": article.auteur?.username || "Novel-Index",
      "url": SITE,
    },
    "publisher": {
      "@type": "Organization",
      "name": "Novel-Index",
      "url": SITE,
      "logo": { "@type": "ImageObject", "url": `${SITE}/logo.png` },
    },
    "mainEntityOfPage": { "@type": "WebPage", "@id": url },
    "inLanguage": "fr-FR",
    ...(article.tags && article.tags.length > 0 ? { "keywords": article.tags.map((t) => t.titre).join(", ") } : {}),
    ...(article.categorie ? { "articleSection": article.categorie } : {}),
  };
}

function buildBreadcrumbJsonLd(article, slug) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Accueil", "item": SITE },
      { "@type": "ListItem", "position": 2, "name": "Actualités", "item": `${SITE}/actualites` },
      { "@type": "ListItem", "position": 3, "name": article.titre, "item": `${SITE}/actualites/${slug}` },
    ],
  };
}

// ── Page (Server Component) ──

export default async function ArticlePage({ params }) {
  const { slug } = await params;
  const article = await fetchArticle(slug);

  if (!article) notFound();

  // Détecter article auto-généré (JSON structuré)
  let templateData = null;
  if (article.contenu && article.contenu.trim().startsWith("{")) {
    try {
      const parsed = JSON.parse(article.contenu);
      if (["sorties", "recap-semaine", "recap-mois", "nouvelles-oeuvres"].includes(parsed._type)) {
        templateData = parsed;
      }
    } catch { /* pas du JSON */ }
  }

  const adjacent = await fetchAdjacent(article.publishedAt);

  return (
    <>
      <JsonLd data={buildArticleJsonLd(article, slug, templateData)} />
      <JsonLd data={buildBreadcrumbJsonLd(article, slug)} />
      <ArticleClient
        article={article}
        templateData={templateData}
        adjacent={adjacent}
        apiUrl={API}
      />
    </>
  );
}
