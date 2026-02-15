"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { FiBook, FiUsers, FiCompass, FiArrowRight, FiBookOpen, FiEye, FiHeart, FiTag, FiSearch, FiCheckCircle, FiPlusCircle, FiShare2 } from "react-icons/fi";
import SortieJours from "./components/SortieJours";
import SortieHier from "./components/SortieHier";
import SortieOeuvre from "./components/SortieOeuvre";
import CoverBackground from "./components/CoverBackground";
import SearchModal from "./components/SearchModal";

export default function Home() {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [stats, setStats] = useState({ oeuvres: 0, chapitres: 0, teams: 0 });
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  // Charger les stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [oeuvresRes, chapitresRes, teamsRes] = await Promise.all([
          fetch(`${apiUrl}/api/oeuvres?pagination[limit]=1`),
          fetch(`${apiUrl}/api/chapitres?pagination[limit]=1`),
          fetch(`${apiUrl}/api/teams?pagination[limit]=1`),
        ]);
        const [oeuvresData, chapitresData, teamsData] = await Promise.all([
          oeuvresRes.json(),
          chapitresRes.json(),
          teamsRes.json(),
        ]);
        setStats({
          oeuvres: oeuvresData.meta?.pagination?.total || 0,
          chapitres: chapitresData.meta?.pagination?.total || 0,
          teams: teamsData.meta?.pagination?.total || 0,
        });
      } catch (err) {
        console.error("Erreur chargement stats:", err);
      }
    };
    fetchStats();
  }, [apiUrl]);

  const scrollToSorties = () => {
    document.getElementById("sorties-jour")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div>
      {/* Hero Header avec CoverBackground */}
      <div className="relative h-[75vh] w-full overflow-hidden">
        {/* Background couvertures */}
        <CoverBackground />

        {/* Content */}
        <div className="absolute inset-0 z-10 flex flex-col justify-center items-center text-center text-white px-4">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-4xl sm:text-5xl md:text-6xl font-bold mb-4"
          >
            Novel-Index
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg md:text-xl text-gray-200 mb-6 max-w-2xl"
          >
            La plateforme collaborative d'indexation de Light Novels, Web Novels, Scans et Webtoons
          </motion.p>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="flex flex-wrap justify-center gap-4 sm:gap-8 mb-8"
          >
            <div className="text-center">
              <p className="text-3xl sm:text-4xl font-bold text-indigo-400">{stats.oeuvres.toLocaleString()}+</p>
              <p className="text-sm text-gray-400">Œuvres</p>
            </div>
            <div className="text-center">
              <p className="text-3xl sm:text-4xl font-bold text-green-400">{stats.chapitres.toLocaleString()}+</p>
              <p className="text-sm text-gray-400">Chapitres</p>
            </div>
            <div className="text-center">
              <p className="text-3xl sm:text-4xl font-bold text-pink-400">{stats.teams.toLocaleString()}+</p>
              <p className="text-sm text-gray-400">Teams</p>
            </div>
          </motion.div>

          {/* Barre de recherche - ouvre le modal */}
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            onClick={() => setIsSearchOpen(true)}
            className="w-full max-w-xl mb-6"
          >
            <div className="relative flex items-center w-full px-5 py-4 rounded-full bg-gray-800/80 backdrop-blur-sm border border-gray-600 text-gray-400 hover:border-indigo-500 hover:bg-gray-800 transition cursor-text">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span>Rechercher une œuvre, un auteur, un traducteur...</span>
            </div>
          </motion.button>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.8 }}
            className="flex flex-wrap justify-center gap-4"
          >
            <Link
              href="/Oeuvres"
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-lg text-lg font-semibold transition shadow-lg hover:shadow-indigo-500/25"
            >
              Explorer le catalogue
            </Link>
            <button
              onClick={scrollToSorties}
              className="bg-gray-700/80 hover:bg-gray-600 text-white px-6 py-3 rounded-lg text-lg font-medium transition backdrop-blur-sm"
            >
              Sorties du jour ↓
            </button>
          </motion.div>
        </div>

        {/* Dégradé en bas du Hero Header */}
        <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-b from-transparent to-gray-900 z-20"></div>
      </div>

      {/* Sections */}
      <div id="sorties-jour">
        <SortieJours />
      </div>
      <SortieHier />
      <SortieOeuvre />

      {/* ========== BLOC 1 — Qu'est-ce que Novel-Index ? ========== */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-900">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6 text-center">
            Qu'est-ce que Novel-Index ?
          </h2>
          <div className="space-y-4 text-gray-300 text-lg leading-relaxed">
            <p>
              <strong className="text-white">Novel-Index</strong> est la plateforme collaborative francophone de référence pour découvrir et suivre vos <strong className="text-indigo-400">Light Novels</strong>, <strong className="text-indigo-400">Web Novels</strong>, <strong className="text-indigo-400">Manga</strong>, <strong className="text-indigo-400">Manhwa</strong> et <strong className="text-indigo-400">Webtoons</strong> traduits en français.
            </p>
            <p>
              Notre mission est simple : <strong className="text-white">centraliser toutes les traductions françaises</strong> disponibles en un seul endroit. Plutôt que de chercher sur des dizaines de sites différents, Novel-Index vous redirige directement vers les <strong className="text-white">teams de traduction</strong> qui publient les chapitres.
            </p>
            <p>
              Nous ne stockons aucun contenu traduit. Novel-Index est un <strong className="text-white">index collaboratif</strong> : chaque team de traduction peut référencer ses œuvres et ses chapitres, et les lecteurs retrouvent tout au même endroit. C'est un pont entre les lecteurs francophones et les traducteurs passionnés.
            </p>
            <p>
              Que vous cherchiez le dernier chapitre de votre <strong className="text-indigo-400">novel fantaisie</strong> préféré, une nouvelle <strong className="text-indigo-400">série romance</strong> à découvrir, ou les dernières sorties de <strong className="text-indigo-400">scans action</strong>, Novel-Index vous permet de tout suivre en temps réel grâce à son système d'abonnements et de notifications.
            </p>
          </div>
        </div>
      </section>

      {/* ========== BLOC 2 — Accès rapide par catégorie ========== */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-950">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3 text-center">
            Explorez par catégorie
          </h2>
          <p className="text-gray-400 text-center mb-10 max-w-2xl mx-auto">
            Naviguez dans notre catalogue par type d'œuvre ou par genre. Des milliers de titres traduits en français vous attendent.
          </p>

          {/* Types d'œuvres */}
          <h3 className="text-xl font-semibold text-white mb-4">Par type d'œuvre</h3>
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
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-900">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3 text-center">
            Comment ça marche ?
          </h2>
          <p className="text-gray-400 text-center mb-12 max-w-2xl mx-auto">
            Novel-Index est gratuit et ouvert à tous. En 3 étapes, accédez à des milliers de chapitres traduits en français.
          </p>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Étape 1 */}
            <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6 text-center">
              <div className="w-14 h-14 bg-indigo-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiSearch className="text-indigo-400 text-2xl" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">1. Recherchez</h3>
              <p className="text-gray-400">
                Trouvez une œuvre par son titre, son genre, son auteur ou sa team de traduction. Utilisez les filtres pour affiner vos résultats.
              </p>
            </div>

            {/* Étape 2 */}
            <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6 text-center">
              <div className="w-14 h-14 bg-green-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiPlusCircle className="text-green-400 text-2xl" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">2. Abonnez-vous</h3>
              <p className="text-gray-400">
                Créez un compte gratuit et abonnez-vous à vos œuvres préférées. Vous serez notifié à chaque nouveau chapitre disponible.
              </p>
            </div>

            {/* Étape 3 */}
            <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6 text-center">
              <div className="w-14 h-14 bg-pink-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiShare2 className="text-pink-400 text-2xl" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">3. Lisez</h3>
              <p className="text-gray-400">
                Cliquez sur un chapitre et vous êtes redirigé directement vers le site de la team de traduction. Simple, rapide, gratuit.
              </p>
            </div>
          </div>

          {/* CTA final */}
          <div className="text-center mt-12">
            <Link
              href="/Inscription"
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-lg text-lg font-semibold transition shadow-lg hover:shadow-indigo-500/25"
            >
              Créer un compte gratuit
              <FiArrowRight />
            </Link>
          </div>
        </div>
      </section>

      {/* Modal de recherche */}
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </div>
  );
}
