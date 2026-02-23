import Link from "next/link";
import { FiBook, FiUsers, FiCompass, FiArrowRight, FiBookOpen, FiEye, FiHeart, FiTag, FiSearch, FiPlusCircle, FiShare2 } from "react-icons/fi";
import HeroSection from "./components/HeroSection";
import SortieJours from "./components/SortieJours";
import SortieHier from "./components/SortieHier";
import SortieOeuvre from "./components/SortieOeuvre";
import KanveoBanner from "./components/KanveoBanner";
import CtaInscription from "./components/CtaInscription";

// ✅ Metadata SSR — rendue côté serveur pour le SEO
export const metadata = {
  title: "Novel-Index - Plateforme d'indexation de traductions",
  description:
    "Trad-Index - Plateforme d'indexation collaborative redirigeant les utilisateurs vers les sites traducteurs. Découvrez des webnovels, light novels, manhwa et manga traduits en français.",
  keywords: [
    "traductions",
    "webnovels",
    "light novels",
    "manhwa",
    "manga",
    "français",
    "index",
    "trad-index",
    "webtoons",
    "scans",
    "novel-index",
  ],
  alternates: {
    canonical: "https://www.novel-index.com",
  },
  openGraph: {
    title: "Novel-Index - Plateforme d'indexation de traductions",
    description:
      "Plateforme d'indexation collaborative. Découvrez des webnovels, light novels, manhwa et manga traduits en français.",
    url: "https://www.novel-index.com",
    siteName: "Novel-Index",
    images: [
      { url: "https://www.novel-index.com/logo.png", alt: "Novel-Index" },
    ],
    locale: "fr_FR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Novel-Index - Plateforme d'indexation de traductions",
    description:
      "Plateforme d'indexation collaborative. Découvrez des webnovels, light novels, manhwa et manga traduits en français.",
    images: ["https://www.novel-index.com/logo.png"],
  },
};

export default function Home() {
  return (
    <div>
      {/* Hero — client component (stats, animations, recherche) */}
      <HeroSection />

      {/* Sections sorties — client components */}
      <div id="sorties-jour">
        <SortieJours />
      </div>

      {/* Publicité Kanveo — déplacée après les sorties du jour */}
      <KanveoBanner format="banner" className="py-6 px-4" delay={1200} />

      <SortieHier />
      <SortieOeuvre />

      {/* ========== BLOC 1 — Qu'est-ce que Novel-Index ? ========== */}
      {/* ✅ Contenu statique rendu côté serveur pour le SEO */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-900" aria-labelledby="about-heading">
        <div className="max-w-4xl mx-auto">
          <h2 id="about-heading" className="text-3xl sm:text-4xl font-bold text-white mb-6 text-center">
            Qu&apos;est-ce que Novel-Index ?
          </h2>
          <div className="space-y-4 text-gray-300 text-lg leading-relaxed">
            <p>
              <strong className="text-white">Novel-Index</strong> est la plateforme collaborative francophone de référence pour découvrir et suivre vos <strong className="text-indigo-400">Light Novels</strong>, <strong className="text-indigo-400">Web Novels</strong>, <strong className="text-indigo-400">Manga</strong>, <strong className="text-indigo-400">Manhwa</strong> et <strong className="text-indigo-400">Webtoons</strong> traduits en français.
            </p>
            <p>
              Notre mission est simple : <strong className="text-white">centraliser toutes les traductions françaises</strong> disponibles en un seul endroit. Plutôt que de chercher sur des dizaines de sites différents, Novel-Index vous redirige directement vers les <strong className="text-white">teams de traduction</strong> qui publient les chapitres.
            </p>
            <p>
              Nous ne stockons aucun contenu traduit. Novel-Index est un <strong className="text-white">index collaboratif</strong> : chaque team de traduction peut référencer ses œuvres et ses chapitres, et les lecteurs retrouvent tout au même endroit. C&apos;est un pont entre les lecteurs francophones et les traducteurs passionnés.
            </p>
            <p>
              Que vous cherchiez le dernier chapitre de votre <strong className="text-indigo-400">novel fantaisie</strong> préféré, une nouvelle <strong className="text-indigo-400">série romance</strong> à découvrir, ou les dernières sorties de <strong className="text-indigo-400">scans action</strong>, Novel-Index vous permet de tout suivre en temps réel grâce à son système d&apos;abonnements et de notifications.
            </p>
          </div>
        </div>
      </section>

      {/* ========== BLOC 2 — Accès rapide par catégorie ========== */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-950" aria-labelledby="categories-heading">
        <div className="max-w-6xl mx-auto">
          <h2 id="categories-heading" className="text-3xl sm:text-4xl font-bold text-white mb-3 text-center">
            Explorez par catégorie
          </h2>
          <p className="text-gray-300 text-center mb-10 max-w-2xl mx-auto">
            Naviguez dans notre catalogue par type d&apos;œuvre ou par genre. Des milliers de titres traduits en français vous attendent.
          </p>

          {/* Types d'œuvres */}
          <h3 className="text-xl font-semibold text-white mb-4">Par type d&apos;œuvre</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mb-10">
            {[
              { label: "Light Novels", href: "/Oeuvres?type=Light+Novel", icon: <FiBook className="text-indigo-400" /> },
              { label: "Web Novels", href: "/Oeuvres?type=Web+Novel", icon: <FiBookOpen className="text-blue-400" /> },
              { label: "Manga", href: "/Oeuvres?type=Manga", icon: <FiEye className="text-pink-400" /> },
              { label: "Manhwa", href: "/Oeuvres?type=Manhwa", icon: <FiHeart className="text-red-400" /> },
              { label: "Webtoons", href: "/Oeuvres?type=Webtoon", icon: <FiCompass className="text-green-400" /> },
            ].map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="flex items-center gap-3 bg-gray-800/60 hover:bg-gray-700/80 border border-gray-700 hover:border-indigo-500 rounded-xl px-4 py-3 transition group"
              >
                <span className="text-xl">{item.icon}</span>
                <span className="text-white font-medium group-hover:text-indigo-300 transition">{item.label}</span>
              </Link>
            ))}
          </div>

          {/* Genres populaires */}
          <h3 className="text-xl font-semibold text-white mb-4">Genres populaires</h3>
          <div className="flex flex-wrap gap-2 mb-8">
            {[
              "Action", "Aventure", "Comédie", "Drame", "Fantaisie", "Horreur",
              "Isekai", "Mystère", "Romance", "Sci-Fi", "Slice of Life", "Thriller",
              "Surnaturel", "Arts Martiaux", "Mecha", "Historique"
            ].map((genre) => (
              <Link
                key={genre}
                href={`/tags-genres/genres/${genre.toLowerCase().replace(/ /g, "-")}`}
                className="bg-gray-800/60 hover:bg-indigo-600/30 border border-gray-700 hover:border-indigo-500 text-gray-300 hover:text-white px-4 py-2 rounded-full text-sm font-medium transition"
              >
                <FiTag className="inline mr-1.5 text-xs" />
                {genre}
              </Link>
            ))}
          </div>

          {/* Lien vers toutes les teams */}
          <div className="text-center mt-6">
            <Link
              href="/Teams"
              className="inline-flex items-center gap-2 text-indigo-400 hover:text-indigo-300 font-medium transition"
            >
              <FiUsers className="text-lg" />
              Découvrir toutes les teams de traduction
              <FiArrowRight />
            </Link>
          </div>
        </div>
      </section>

      {/* ========== BLOC 3 — Comment ça marche ? ========== */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-900" aria-labelledby="how-heading">
        <div className="max-w-5xl mx-auto">
          <h2 id="how-heading" className="text-3xl sm:text-4xl font-bold text-white mb-3 text-center">
            Comment ça marche ?
          </h2>
          <p className="text-gray-300 text-center mb-12 max-w-2xl mx-auto">
            Novel-Index est gratuit et ouvert à tous. En 3 étapes, accédez à des milliers de chapitres traduits en français.
          </p>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Étape 1 */}
            <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6 text-center">
              <div className="w-14 h-14 bg-indigo-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiSearch className="text-indigo-400 text-2xl" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">1. Recherchez</h3>
              <p className="text-gray-300">
                Trouvez une œuvre par son titre, son genre, son auteur ou sa team de traduction. Utilisez les filtres pour affiner vos résultats.
              </p>
            </div>

            {/* Étape 2 */}
            <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6 text-center">
              <div className="w-14 h-14 bg-green-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiPlusCircle className="text-green-400 text-2xl" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">2. Abonnez-vous</h3>
              <p className="text-gray-300">
                Créez un compte gratuit et abonnez-vous à vos œuvres préférées. Vous serez notifié à chaque nouveau chapitre disponible.
              </p>
            </div>

            {/* Étape 3 */}
            <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6 text-center">
              <div className="w-14 h-14 bg-pink-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiShare2 className="text-pink-400 text-2xl" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">3. Lisez</h3>
              <p className="text-gray-300">
                Cliquez sur un chapitre et vous êtes redirigé directement vers le site de la team de traduction. Simple, rapide, gratuit.
              </p>
            </div>
          </div>

          {/* CTA final — conditionnel (masqué si connecté) */}
          <CtaInscription />
        </div>
      </section>
    </div>
  );
}
