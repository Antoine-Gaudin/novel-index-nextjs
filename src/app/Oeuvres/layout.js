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
  return children;
}
