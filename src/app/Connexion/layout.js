// ✅ Metadata SSR pour la page de connexion
export const metadata = {
  title: "Connexion & Inscription | Novel-Index",
  description: "Connectez-vous ou créez votre compte Novel-Index pour gérer vos abonnements, catégories et participer à la communauté.",
  alternates: {
    canonical: "https://www.novel-index.com/Connexion",
  },
  robots: {
    index: false, // Pas besoin d'indexer la page de connexion
    follow: true,
  },
};

export default function ConnexionLayout({ children }) {
  return children;
}
