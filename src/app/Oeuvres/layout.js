import JsonLd from "@/app/components/JsonLd";

// ✅ SSR Metadata pour la page Oeuvres
export const metadata = {
  title: "Toutes les œuvres disponibles | Novel-Index",
  description: "Découvrez toutes les œuvres indexées sur Novel-Index : webnovels, light novels, manhwa, manga et plus encore, classés par genre, langue et statut.",
  alternates: {
    canonical: "https://www.novel-index.com/Oeuvres",
  },
  openGraph: {
    title: "Toutes les œuvres disponibles | Novel-Index",
    description: "Découvrez toutes les œuvres indexées sur Novel-Index : webnovels, light novels, manhwa, manga et plus encore.",
    url: "https://www.novel-index.com/Oeuvres",
    siteName: "Novel-Index",
    images: [{ url: "https://www.novel-index.com/logo.png", alt: "Novel-Index" }],
    locale: "fr_FR",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Toutes les œuvres disponibles | Novel-Index",
    description: "Découvrez toutes les œuvres indexées sur Novel-Index : webnovels, light novels, manhwa, manga et plus encore.",
  },
};

export default function OeuvresLayout({ children }) {
  const collectionPageJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": "Catalogue des œuvres - Novel-Index",
    "description": "Catalogue complet des œuvres indexées sur Novel-Index : webnovels, light novels, manhwa, manga et plus encore, classés par genre, langue et statut.",
    "url": "https://www.novel-index.com/Oeuvres",
    "inLanguage": "fr-FR",
    "isPartOf": {
      "@type": "WebSite",
      "name": "Novel-Index",
      "url": "https://www.novel-index.com"
    },
    "mainEntity": {
      "@type": "ItemList",
      "name": "Œuvres indexées",
      "description": "Liste des webnovels, light novels, manhwa et manga traduits en français",
      "itemListOrder": "https://schema.org/ItemListUnordered",
      "numberOfItems": "1000+"
    },
    "breadcrumb": {
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
          "name": "Catalogue des œuvres",
          "item": "https://www.novel-index.com/Oeuvres"
        }
      ]
    }
  };

  return (
    <>
      <JsonLd data={collectionPageJsonLd} />
      {children}
    </>
  );
}
