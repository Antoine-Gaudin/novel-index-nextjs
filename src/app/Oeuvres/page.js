"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import FiltreOeuvres from "@/app/components/FiltreOeuvres";
import FicheOeuvre from "@/app/components/FicheOeuvre";
import CoverBackground from "@/app/components/CoverBackground";
import OeuvreCard from "@/app/components/OeuvreCard";
import { slugify } from "@/utils/slugify";
import { FiChevronLeft, FiChevronRight, FiSearch, FiBook, FiGrid, FiFilter } from "react-icons/fi";

export default function Oeuvres() {
  const [oeuvres, setOeuvres] = useState([]);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [queryFiltres, setQueryFiltres] = useState("");
  const [totalOeuvres, setTotalOeuvres] = useState(0);
  const [selectedOeuvre, setSelectedOeuvre] = useState(null);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const router = useRouter();
  const pageSize = 12;
  const [pageJump, setPageJump] = useState("");
  const [filtrerNouveautes, setFiltrerNouveautes] = useState(false);

  const fetchOeuvres = async () => {
    setLoading(true);
    try {
      const start = page * pageSize;

      const res = await fetch(
        `${apiUrl}/api/oeuvres?populate=couverture&pagination[start]=${start}&pagination[limit]=${pageSize}&${queryFiltres}`
      );

      const data = await res.json();
      const results = data.data || [];

      const total = data.meta?.pagination?.total || 0;
      setTotalOeuvres(total);

      // 🔥 Correction ici : on remplace l'empilement par un set direct
      setOeuvres(results);
    } catch (error) {
      console.error("Erreur lors du chargement des œuvres :", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOeuvres();
  }, [queryFiltres, page]);

  const handleOeuvreClick = (oeuvre) => {
    setSelectedOeuvre(oeuvre);
  };

  const handleClosePreview = () => {
    setSelectedOeuvre(null);
  };

  const handleFilterChange = (filtres) => {
    const params = [];

    if (filtres.categorie)
      params.push(`filters[categorie][$eq]=${encodeURIComponent(filtres.categorie)}`);
    if (filtres.langage)
      params.push(`filters[langage][$eq]=${encodeURIComponent(filtres.langage)}`);
    if (filtres.etat)
      params.push(`filters[etat][$eq]=${encodeURIComponent(filtres.etat)}`);
    if (filtres.type)
      params.push(`filters[type][$eq]=${encodeURIComponent(filtres.type)}`);
    if (filtres.annee)
      params.push(`filters[annee][$eq]=${encodeURIComponent(filtres.annee)}`);
    if (filtres.licence !== "")
      params.push(`filters[licence][$eq]=${filtres.licence}`);
    if (filtres.traduction)
      params.push(`filters[traduction][$containsi]=${encodeURIComponent(filtres.traduction)}`);
    if (filtres.tags.length > 0) {
      params.push(`filters[tags][titre][$in]=${filtres.tags.map(encodeURIComponent).join(",")}`);
    }
    if (filtres.genres.length > 0) {
      params.push(`filters[genres][titre][$in]=${filtres.genres.map(encodeURIComponent).join(",")}`);
    }


  // ➕ filtre nouveauté du mois
 if (filtres.nouveautes) {
    const now = new Date();
    const premierDuMois = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    params.push(`filters[createdAt][$gte]=${encodeURIComponent(premierDuMois)}`);
  }

    setQueryFiltres(params.join("&"));
    setPage(0); // reset à la première page si on change les filtres
  };

  const totalPages = Math.ceil(totalOeuvres / pageSize);

  // Skeleton loader component
  const SkeletonCard = () => (
    <div className="bg-gray-800/50 rounded-xl overflow-hidden animate-pulse">
      <div className="h-48 sm:h-64 bg-gray-700/50" />
      <div className="p-3 space-y-2">
        <div className="flex gap-2">
          <div className="h-5 w-16 bg-gray-700/50 rounded" />
          <div className="h-5 w-20 bg-gray-700/50 rounded" />
        </div>
        <div className="h-6 w-3/4 bg-gray-700/50 rounded" />
      </div>
    </div>
  );

  return (
    <div className="bg-gray-900 text-white min-h-screen">
      {/* Header avec CoverBackground */}
      <div className="relative h-64 md:h-72 overflow-hidden">
        <CoverBackground />
        {/* Dégradés */}
        <div className="absolute inset-0 bg-gradient-to-b from-gray-900/80 via-gray-900/60 to-gray-900 z-10" />
        
        {/* Contenu Header */}
        <div className="relative z-20 h-full flex flex-col items-center justify-center px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <div className="flex items-center justify-center gap-3 mb-3">
              <FiGrid className="text-indigo-400 text-3xl md:text-4xl" />
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white">
                Catalogue
              </h1>
            </div>
            <p className="text-gray-300 text-sm md:text-base max-w-xl">
              Explorez notre collection de {totalOeuvres.toLocaleString()} œuvres
            </p>
          </motion.div>
          
          {/* Stats rapides */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex gap-6 mt-6"
          >
            <div className="text-center">
              <div className="text-2xl md:text-3xl font-bold text-indigo-400">
                {totalOeuvres.toLocaleString()}
              </div>
              <div className="text-xs text-gray-400">Œuvres</div>
            </div>
            <div className="text-center">
              <div className="text-2xl md:text-3xl font-bold text-purple-400">
                {totalPages}
              </div>
              <div className="text-xs text-gray-400">Pages</div>
            </div>
            <div className="text-center">
              <div className="text-2xl md:text-3xl font-bold text-pink-400">
                {page + 1}
              </div>
              <div className="text-xs text-gray-400">Page actuelle</div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filtres */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <FiltreOeuvres onFilterChange={handleFilterChange} />
        </motion.div>

        {/* Indicateur de résultats */}
        {!loading && (
          <div className="flex items-center justify-between mb-6">
            <p className="text-gray-400 text-sm">
              Affichage de <span className="text-white font-medium">{oeuvres.length}</span> œuvres 
              sur <span className="text-white font-medium">{totalOeuvres.toLocaleString()}</span>
            </p>
            <p className="text-gray-500 text-sm">
              Page {page + 1} / {totalPages}
            </p>
          </div>
        )}

        {/* Grille des œuvres */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {[...Array(12)].map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : oeuvres.length === 0 ? (
          /* État vide */
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-20"
          >
            <div className="w-24 h-24 bg-gray-800 rounded-full flex items-center justify-center mb-6">
              <FiBook className="text-4xl text-gray-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-300 mb-2">
              Aucune œuvre trouvée
            </h3>
            <p className="text-gray-500 text-center max-w-md">
              Essayez de modifier vos filtres ou d'élargir vos critères de recherche pour découvrir plus d'œuvres.
            </p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            <AnimatePresence mode="popLayout">
              {oeuvres.map((oeuvre, index) => (
                <OeuvreCard
                  key={oeuvre.id}
                  oeuvre={oeuvre}
                  index={index}
                  onClick={handleOeuvreClick}
                />
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Pagination moderne */}
        {totalOeuvres > 0 && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-12"
          >
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700/30 p-4 md:p-6">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                {/* Bouton Précédent */}
                <button
                  disabled={page === 0}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-700/50 hover:bg-gray-700 rounded-xl text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  <FiChevronLeft className="text-lg" />
                  <span className="hidden sm:inline">Précédent</span>
                </button>

                {/* Pages numérotées */}
                <div className="flex flex-wrap items-center justify-center gap-1 md:gap-2">
                  {(() => {
                    const pages = [];
                    const maxVisiblePages = 5;
                    let startPage = Math.max(0, page - Math.floor(maxVisiblePages / 2));
                    let endPage = Math.min(totalPages - 1, startPage + maxVisiblePages - 1);
                    
                    if (endPage - startPage < maxVisiblePages - 1) {
                      startPage = Math.max(0, endPage - maxVisiblePages + 1);
                    }

                    // Première page
                    if (startPage > 0) {
                      pages.push(
                        <button
                          key="first"
                          onClick={() => setPage(0)}
                          className="w-10 h-10 rounded-lg bg-gray-700/50 hover:bg-gray-700 text-white text-sm transition-all"
                        >
                          1
                        </button>
                      );
                      if (startPage > 1) {
                        pages.push(
                          <span key="start-ellipsis" className="px-1 text-gray-500">...</span>
                        );
                      }
                    }

                    // Pages du milieu
                    for (let i = startPage; i <= endPage; i++) {
                      pages.push(
                        <button
                          key={i}
                          onClick={() => setPage(i)}
                          className={`w-10 h-10 rounded-lg text-sm font-medium transition-all ${
                            i === page
                              ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/30"
                              : "bg-gray-700/50 hover:bg-gray-700 text-white"
                          }`}
                        >
                          {i + 1}
                        </button>
                      );
                    }

                    // Dernière page
                    if (endPage < totalPages - 1) {
                      if (endPage < totalPages - 2) {
                        pages.push(
                          <span key="end-ellipsis" className="px-1 text-gray-500">...</span>
                        );
                      }
                      pages.push(
                        <button
                          key="last"
                          onClick={() => setPage(totalPages - 1)}
                          className="w-10 h-10 rounded-lg bg-gray-700/50 hover:bg-gray-700 text-white text-sm transition-all"
                        >
                          {totalPages}
                        </button>
                      );
                    }

                    return pages;
                  })()}
                </div>

                {/* Bouton Suivant */}
                <button
                  disabled={(page + 1) * pageSize >= totalOeuvres}
                  onClick={() => setPage((p) => p + 1)}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-700/50 hover:bg-gray-700 rounded-xl text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  <span className="hidden sm:inline">Suivant</span>
                  <FiChevronRight className="text-lg" />
                </button>
              </div>

              {/* Saut de page intégré */}
              <div className="flex items-center justify-center gap-2 mt-4 pt-4 border-t border-gray-700/30">
                <span className="text-gray-400 text-sm">Aller à la page</span>
                <input
                  type="number"
                  placeholder="#"
                  min={1}
                  max={totalPages}
                  value={pageJump}
                  onChange={(e) => setPageJump(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      const val = parseInt(pageJump);
                      if (!isNaN(val) && val >= 1 && val <= totalPages) {
                        setPage(val - 1);
                        setPageJump("");
                      }
                    }
                  }}
                  className="w-16 px-2 py-1.5 rounded-lg bg-gray-700/50 text-white text-center text-sm border border-gray-600/30 focus:border-indigo-500 focus:outline-none transition-colors"
                />
                <button
                  onClick={() => {
                    const val = parseInt(pageJump);
                    if (!isNaN(val) && val >= 1 && val <= totalPages) {
                      setPage(val - 1);
                      setPageJump("");
                    }
                  }}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm rounded-lg transition-colors"
                >
                  <FiSearch className="inline" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Popup de prévisualisation */}
      {selectedOeuvre && (
        <FicheOeuvre oeuvre={selectedOeuvre} onClose={handleClosePreview} />
      )}
    </div>
  );
}
