// ✅ Metadata SSR pour la page d'accueil
export const metadata = {
  title: "Novel-Index - Plateforme d'indexation de traductions",
  description: "Trad-Index - Plateforme d'indexation collaborative redirigeant les utilisateurs vers les sites traducteurs. Découvrez des webnovels, light novels, manhwa et manga traduits en français.",
  keywords: ["traductions", "webnovels", "light novels", "manhwa", "manga", "français", "index", "trad-index"],
  alternates: {
    canonical: "https://www.novel-index.com",
  },
  openGraph: {
    title: "Novel-Index - Plateforme d'indexation de traductions",
    description: "Plateforme d'indexation collaborative. Découvrez des webnovels, light novels, manhwa et manga traduits en français.",
    url: "https://www.novel-index.com",
    siteName: "Novel-Index",
    images: [{ url: "https://www.novel-index.com/logo.png", alt: "Novel-Index" }],
    locale: "fr_FR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Novel-Index - Plateforme d'indexation de traductions",
    description: "Plateforme d'indexation collaborative. Découvrez des webnovels, light novels, manhwa et manga traduits en français.",
    images: ["https://www.novel-index.com/logo.png"],
  },
};

export default function HomeLayout({ children }) {
  return children;
}
