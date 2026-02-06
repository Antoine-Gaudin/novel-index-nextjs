// ✅ Metadata SSR pour la page profil
export const metadata = {
  title: "Mon Profil | Novel-Index",
  description: "Gérez votre profil, vos abonnements et vos préférences sur Novel-Index.",
  alternates: {
    canonical: "https://www.novel-index.com/Profil",
  },
  robots: {
    index: false, // Page privée, pas d'indexation
    follow: true,
  },
};

export default function ProfilLayout({ children }) {
  return children;
}
