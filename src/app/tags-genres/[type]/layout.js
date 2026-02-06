import JsonLd from "@/app/components/JsonLd";

// ✅ SSR Metadata pour tags-genres/[type]
export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  const type = resolvedParams?.type;
  
  const isTag = type === "tag";
  const title = isTag ? "Tous les tags" : "Tous les genres";
  const description = isTag 
    ? "Découvrez tous les tags disponibles sur Novel-Index pour filtrer vos œuvres préférées."
    : "Découvrez tous les genres disponibles sur Novel-Index : action, romance, fantasy, isekai et bien plus encore.";
  
  return {
    title: `${title} | Novel-Index`,
    description,
    alternates: {
      canonical: `https://www.novel-index.com/tags-genres/${type}`,
    },
    openGraph: {
      title: `${title} | Novel-Index`,
      description,
      url: `https://www.novel-index.com/tags-genres/${type}`,
      siteName: "Novel-Index",
      locale: "fr_FR",
      type: "website",
    },
    twitter: {
      card: "summary",
      title: `${title} | Novel-Index`,
      description,
    },
  };
}

export default async function TagsGenresTypeLayout({ children, params }) {
  const resolvedParams = await params;
  const type = resolvedParams?.type;
  
  const isTag = type === "tag";
  const title = isTag ? "Tags" : "Genres";
  
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
        "name": title,
        "item": `https://www.novel-index.com/tags-genres/${type}`
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
