// ✅ SSR Metadata pour la page Oeuvres
// Le canonical et les rel=prev/next sont gérés par generateMetadata dans page.js
// (besoin d'accéder à searchParams.page)
export const metadata = {
  title: "Catalogue webnovels, light novels & manhwa traduits FR | Novel-Index",
  description: "Découvrez le catalogue complet de webnovels, light novels, manhwa et manga traduits en français : recherche par genre, tag, langue, statut et équipe de traduction.",
  openGraph: {
    title: "Catalogue webnovels, light novels & manhwa traduits FR | Novel-Index",
    description: "Le catalogue complet de webnovels, light novels, manhwa et manga traduits en français, par genre, langue et statut.",
    url: "https://www.novel-index.com/Oeuvres",
    siteName: "Novel-Index",
    images: [{ url: "https://www.novel-index.com/logo.png", alt: "Novel-Index" }],
    locale: "fr_FR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Catalogue webnovels, light novels & manhwa traduits FR | Novel-Index",
    description: "Le catalogue complet de webnovels, light novels, manhwa et manga traduits en français.",
    images: ["https://www.novel-index.com/logo.png"],
  },
};

export default function OeuvresLayout({ children }) {
  return children;
}
