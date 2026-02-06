"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import SortieJours from "./components/SortieJours";
import SortieHier from "./components/SortieHier";
import SortieOeuvre from "./components/SortieOeuvre";
import CoverBackground from "./components/CoverBackground";
import SearchModal from "./components/SearchModal";

export default function Home() {
  const router = useRouter();
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
            <button
              onClick={() => router.push("/Oeuvres")}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-lg text-lg font-semibold transition shadow-lg hover:shadow-indigo-500/25"
            >
              Explorer le catalogue
            </button>
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

      {/* Modal de recherche */}
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </div>
  );
}
