import { cache } from "react";
import { slugify } from "@/utils/slugify";
import JsonLd from "@/app/components/JsonLd";

// Dédupliqué entre generateMetadata et le layout body
const getTagsOrGenres = cache(async (type) => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const res = await fetch(
    `${apiUrl}/api/${type === "tag" ? "tags" : "genres"}`,
    { next: { revalidate: 3600 } }
  );
  if (!res.ok) return [];
  const data = await res.json();
  return data.data || [];
});

// ✅ SSR Metadata pour tags-genres/[type]/[slug]
export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  const { type, slug } = resolvedParams;
  
  try {
    const items = await getTagsOrGenres(type);
    
    if (items.length === 0) {
      return {
        title: `${type === "tag" ? "Tag" : "Genre"} | Novel-Index`,
        description: "Découvrez les œuvres par tag et genre sur Novel-Index.",
      };
    }
    
    const matched = items.find((item) => slugify(item.titre) === slug);
    
    if (!matched) {
      return {
        title: `${type === "tag" ? "Tag" : "Genre"} introuvable | Novel-Index`,
        description: "Ce tag ou genre n'existe pas.",
      };
    }
    
    const titre = matched.titre;
    const isTag = type === "tag";
    
    const fullTitle = `${titre} - ${isTag ? "Tag" : "Genre"} | Novel-Index`;
    const desc = `Découvrez toutes les œuvres avec le ${isTag ? "tag" : "genre"} "${titre}" sur Novel-Index.`;
    const canonicalUrl = `https://www.novel-index.com/tags-genres/${type}/${slug}`;

    return {
      title: fullTitle,
      description: desc,
      alternates: {
        canonical: canonicalUrl,
      },
      openGraph: {
        title: fullTitle,
        description: desc,
        url: canonicalUrl,
        siteName: "Novel-Index",
        locale: "fr_FR",
        type: "website",
      },
      twitter: {
        card: "summary",
        title: fullTitle,
        description: desc,
      },
    };
  } catch (error) {
    console.error("[Metadata] Erreur tags-genres:", error);
    return {
      title: "Novel-Index",
      description: "Plateforme d'indexation collaborative.",
    };
  }
}

export default async function TagGenreSlugLayout({ children, params }) {
  const resolvedParams = await params;
  const { type, slug } = resolvedParams;
  
  let itemTitle = slug; // Fallback au slug si pas de données
  
  try {
    const items = await getTagsOrGenres(type);
    const matched = items.find((item) => slugify(item.titre) === slug);
    if (matched) {
      itemTitle = matched.titre;
    }
  } catch (error) {
    console.error("[TagGenreSlugLayout] Erreur récupération données:", error);
  }
  
  const isTag = type === "tag";
  const typeLabel = isTag ? "Tags" : "Genres";
  
  // JSON-LD pour BreadcrumbList
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Accueil",
        "item": "https://www.novel-index.com"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": typeLabel,
        "item": `https://www.novel-index.com/tags-genres/${type}`
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": itemTitle,
        "item": `https://www.novel-index.com/tags-genres/${type}/${slug}`
      }
    ]
  };

  return (
    <>
      <JsonLd data={breadcrumbJsonLd} />
      {children}
    </>
  );
}
