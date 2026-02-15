import JsonLd from "../components/JsonLd";

export const metadata = {
  title: "Teams de Traduction | Novel-Index",
  description: "Découvrez toutes les équipes de traduction référencées sur Novel-Index. Webnovels, light novels, manhwa et manga traduits en français.",
  keywords: ["teams", "équipes", "traduction", "traducteurs", "webnovels", "light novels", "manhwa", "manga"],
  openGraph: {
    title: "Teams de Traduction | Novel-Index",
    description: "Découvrez toutes les équipes de traduction référencées sur Novel-Index.",
    url: "https://www.novel-index.com/Teams",
    siteName: "Novel-Index",
    locale: "fr_FR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Teams de Traduction | Novel-Index",
    description: "Découvrez toutes les équipes de traduction référencées sur Novel-Index.",
  },
  alternates: {
    canonical: "https://www.novel-index.com/Teams",
  },
};

export default function TeamsLayout({ children }) {
  const teamsListJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": "Teams de Traduction",
    "description": "Liste des équipes de traduction de webnovels, light novels, manhwa et manga en français",
    "url": "https://www.novel-index.com/Teams",
    "isPartOf": {
      "@type": "WebSite",
      "name": "Novel-Index",
      "url": "https://www.novel-index.com"
    }
  };

  return (
    <>
      <JsonLd data={teamsListJsonLd} />
      {children}
    </>
  );
}
