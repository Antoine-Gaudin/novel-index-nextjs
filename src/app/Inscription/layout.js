// ✅ Metadata SSR pour la page d'inscription
export const metadata = {
  title: "Inscription | Novel-Index",
  description: "Créez votre compte Novel-Index pour suivre vos œuvres préférées, gérer vos abonnements et rejoindre la communauté.",
  robots: {
    index: false, // Pas besoin d'indexer la page d'inscription
    follow: true,
  },
};

export default function InscriptionLayout({ children }) {
  return children;
}
