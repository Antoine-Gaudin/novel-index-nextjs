"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import FiltreOeuvres from "@/app/components/FiltreOeuvres";
import FicheOeuvre from "@/app/components/FicheOeuvre";
import OeuvreCard from "@/app/components/OeuvreCard";
import KanveoBanner from "@/app/components/KanveoBanner";
import { slugify } from "@/utils/slugify";
import { useAuth } from "@/contexts/AuthContext";
import { FiChevronLeft, FiChevronRight, FiSearch, FiBook, FiGrid, FiFilter, FiStar, FiClock, FiTrendingUp, FiCalendar, FiRefreshCw, FiSettings, FiPlus, FiX, FiCheck, FiAlertCircle, FiArrowUp } from "react-icons/fi";

export default function CatalogueClient({ initialOeuvres = [], initialTotal = 0, initialPage = 0 }) {
  const [oeuvres, setOeuvres] = useState(initialOeuvres);
  const [page, setPage] = useState(initialPage);
  const [loading, setLoading] = useState(initialOeuvres.length === 0);
  const [queryFiltres, setQueryFiltres] = useState("");
  const [totalOeuvres, setTotalOeuvres] = useState(initialTotal);
  const [selectedOeuvre, setSelectedOeuvre] = useState(null);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState("");
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  const isAdmin = user?.admin === true;
  const pageSize = 12;
  const [pageJump, setPageJump] = useState("");
  const [pageJumpError, setPageJumpError] = useState("");
  const [filtrerNouveautes, setFiltrerNouveautes] = useState(false);
  const isFirstRender = useRef(true);
  const catalogueRef = useRef(null);

  // Nouvelles données pour les sections enrichies
  const [featuredOeuvres, setFeaturedOeuvres] = useState([]);
  const [featuredIndex, setFeaturedIndex] = useState(0);
  const [dernieresMaj, setDernieresMaj] = useState([]);
  const [nouveautes, setNouveautes] = useState([]);
  const [stats, setStats] = useState({ chapitres: 0, teams: 0 });
  const [loadingExtras, setLoadingExtras] = useState(true);
  const [isHoveringCarousel, setIsHoveringCarousel] = useState(false);
  
  // Admin - gestion des coups de cœur
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [allOeuvresForPicker, setAllOeuvresForPicker] = useState([]);
  const [adminSearch, setAdminSearch] = useState("");
  const [loadingAdminSearch, setLoadingAdminSearch] = useState(false);

  // Fetch les données supplémentaires une seule fois
  useEffect(() => {
    const fetchExtras = async () => {
      setLoadingExtras(true);
      try {
        // Fetch en parallèle
        const [
          featuredRes,
          dernieresMajRes,
          nouveautesRes,
          chapitresRes,
          teamsRes
        ] = await Promise.all([
          // Œuvres mises en avant avec couverture et synopsis
          fetch(`${apiUrl}/api/oeuvres?populate[0]=couverture&populate[1]=genres&pagination[limit]=30&filters[couverture][url][$notNull]=true`),
          // Dernières mises à jour
          fetch(`${apiUrl}/api/oeuvres?populate=couverture&sort=updatedAt:desc&pagination[limit]=6`),
          // Nouveautés du mois
          fetch(`${apiUrl}/api/oeuvres?populate=couverture&sort=createdAt:desc&pagination[limit]=6&filters[createdAt][$gte]=${new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()}`),
          // Stats
          fetch(`${apiUrl}/api/chapitres?pagination[limit]=1`),
          fetch(`${apiUrl}/api/teams?pagination[limit]=1`)
        ]);

        const [featuredData, dernieresMajData, nouveautesData, chapitresData, teamsData] = await Promise.all([
          featuredRes.json(),
          dernieresMajRes.json(),
          nouveautesRes.json(),
          chapitresRes.json(),
          teamsRes.json()
        ]);

        // Sélectionner 5 oeuvres avec couverture pour la section mise en avant
        const oeuvresAvecCouverture = (featuredData.data || []).filter(o => o.couverture?.url && o.synopsis);
        setAllOeuvresForPicker(oeuvresAvecCouverture); // Garder pour le picker admin
        
        if (oeuvresAvecCouverture.length > 0) {
          // F1: Vérifier le localStorage pour les sélections admin
          try {
            const savedFeatured = localStorage.getItem('novel-index-featured');
            if (savedFeatured) {
              const savedIds = JSON.parse(savedFeatured);
              if (Array.isArray(savedIds) && savedIds.length > 0) {
                const savedOeuvres = savedIds
                  .map(id => oeuvresAvecCouverture.find(o => o.documentId === id))
                  .filter(Boolean);
                if (savedOeuvres.length >= 3) {
                  setFeaturedOeuvres(savedOeuvres);
                  setDernieresMaj(dernieresMajData.data || []);
                  setNouveautes(nouveautesData.data || []);
                  setStats({
                    chapitres: chapitresData.meta?.pagination?.total || 0,
                    teams: teamsData.meta?.pagination?.total || 0
                  });
                  setLoadingExtras(false);
                  return;
                }
              }
            }
          } catch {}
          
          // Mélanger et prendre 5 (basé sur le jour pour varier)
          const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 1)) / (24 * 60 * 60 * 1000));
          const shuffled = [...oeuvresAvecCouverture].sort((a, b) => {
            const hashA = (a.documentId.charCodeAt(0) + dayOfYear) % 100;
            const hashB = (b.documentId.charCodeAt(0) + dayOfYear) % 100;
            return hashA - hashB;
          });
          setFeaturedOeuvres(shuffled.slice(0, 5));
        }

        setDernieresMaj(dernieresMajData.data || []);
        setNouveautes(nouveautesData.data || []);
        setStats({
          chapitres: chapitresData.meta?.pagination?.total || 0,
          teams: teamsData.meta?.pagination?.total || 0
        });
      } catch (error) {
        console.error("Erreur chargement extras:", error);
      } finally {
        setLoadingExtras(false);
      }
    };

    fetchExtras();
  }, [apiUrl]);

  // F1: Admin - Sauvegarder la sélection dans localStorage
  const saveFeaturedToStorage = useCallback((oeuvresList) => {
    try {
      localStorage.setItem('novel-index-featured', JSON.stringify(oeuvresList.map(o => o.documentId)));
    } catch {}
  }, []);

  // Admin: Relancer la sélection aléatoire
  const handleRefreshFeatured = () => {
    if (allOeuvresForPicker.length === 0) return;
    const shuffled = [...allOeuvresForPicker].sort(() => Math.random() - 0.5);
    const newFeatured = shuffled.slice(0, 5);
    setFeaturedOeuvres(newFeatured);
    setFeaturedIndex(0);
    saveFeaturedToStorage(newFeatured);
  };

  // Admin: Ajouter une oeuvre à la sélection
  const handleAddToFeatured = (oeuvre) => {
    if (featuredOeuvres.find(o => o.documentId === oeuvre.documentId)) return;
    let newFeatured;
    if (featuredOeuvres.length >= 5) {
      newFeatured = [...featuredOeuvres.slice(0, 4), oeuvre];
    } else {
      newFeatured = [...featuredOeuvres, oeuvre];
    }
    setFeaturedOeuvres(newFeatured);
    setAdminSearch("");
    saveFeaturedToStorage(newFeatured);
  };

  // Admin: Retirer une oeuvre de la sélection
  const handleRemoveFromFeatured = (documentId) => {
    const newFeatured = featuredOeuvres.filter(o => o.documentId !== documentId);
    setFeaturedOeuvres(newFeatured);
    saveFeaturedToStorage(newFeatured);
  };

  // Admin: Recherche d'oeuvres
  const filteredOeuvresForPicker = adminSearch.length >= 2
    ? allOeuvresForPicker.filter(o => 
        o.titre.toLowerCase().includes(adminSearch.toLowerCase()) &&
        !featuredOeuvres.find(f => f.documentId === o.documentId)
      ).slice(0, 10)
    : [];

  // F5: Auto-rotation avec pause au hover
  useEffect(() => {
    if (featuredOeuvres.length === 0 || isHoveringCarousel) return;
    const interval = setInterval(() => {
      setFeaturedIndex((prev) => (prev + 1) % featuredOeuvres.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [featuredOeuvres.length, isHoveringCarousel]);

  // E4: Navigation clavier pour le carousel
  const handleCarouselKeyDown = useCallback((e) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      setFeaturedIndex((prev) => (prev + 1) % featuredOeuvres.length);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      setFeaturedIndex((prev) => (prev - 1 + featuredOeuvres.length) % featuredOeuvres.length);
    }
  }, [featuredOeuvres.length]);

  const fetchOeuvres = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const start = page * pageSize;
      let url = `${apiUrl}/api/oeuvres?populate=couverture&pagination[start]=${start}&pagination[limit]=${pageSize}`;
      if (queryFiltres) url += `&${queryFiltres}`;
      if (sortBy) url += `&sort=${sortBy}`;

      const res = await fetch(url);

      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      const data = await res.json();
      setTotalOeuvres(data.meta?.pagination?.total || 0);
      setOeuvres(data.data || []);
    } catch (err) {
      console.error("Erreur lors du chargement des œuvres :", err);
      setError("Impossible de charger les œuvres. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  }, [page, apiUrl, queryFiltres, sortBy]);

  // Skip initial fetch if we have SSR data
  useEffect(() => {
    if (isFirstRender.current && initialOeuvres.length > 0 && !queryFiltres && !sortBy) {
      isFirstRender.current = false;
      return;
    }
    isFirstRender.current = false;
    fetchOeuvres();
  }, [fetchOeuvres, queryFiltres, sortBy, initialOeuvres.length]);

  // S2: Sync pagination with URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (page > 0) {
      params.set('page', String(page + 1));
    } else {
      params.delete('page');
    }
    const newUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
    window.history.replaceState(null, '', newUrl);
  }, [page, pathname]);

  // F3: Scroll to catalogue on page change
  useEffect(() => {
    if (!isFirstRender.current && catalogueRef.current) {
      catalogueRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [page]);

  const handleOeuvreClick = (oeuvre) => {
    setSelectedOeuvre(oeuvre);
  };

  const handleClosePreview = () => {
    setSelectedOeuvre(null);
  };

  const handleFilterChange = useCallback((filtres) => {
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
      filtres.tags.forEach((tag, i) => {
        params.push(`filters[tags][titre][$in][${i}]=${encodeURIComponent(tag)}`);
      });
    }
    if (filtres.genres.length > 0) {
      filtres.genres.forEach((genre, i) => {
        params.push(`filters[genres][titre][$in][${i}]=${encodeURIComponent(genre)}`);
      });
    }


  // ➕ filtre nouveauté du mois
 if (filtres.nouveautes) {
    const now = new Date();
    const premierDuMois = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    params.push(`filters[createdAt][$gte]=${encodeURIComponent(premierDuMois)}`);
  }

    setQueryFiltres(params.join("&"));
    setPage(0); // reset à la première page si on change les filtres
  }, []);

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
    <>
      {/* Stats rapides */}
      <div className="relative z-10 pt-4 pb-8 flex flex-col items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex gap-6 mt-2"
        >
          <div className="text-center">
            <div className="text-2xl md:text-3xl font-bold text-indigo-400">
              {totalOeuvres.toLocaleString()}
            </div>
            <div className="text-xs text-gray-400">Œuvres</div>
          </div>
          <div className="text-center">
            <div className="text-2xl md:text-3xl font-bold text-green-400">
              {stats.chapitres.toLocaleString()}
            </div>
            <div className="text-xs text-gray-400">Chapitres</div>
          </div>
          <div className="text-center">
            <div className="text-2xl md:text-3xl font-bold text-pink-400">
              {stats.teams}
            </div>
            <div className="text-xs text-gray-400">Teams</div>
          </div>
        </motion.div>
      </div>

      {/* SECTION COUPS DE CŒUR - PRÉSENTATION EXCEPTIONNELLE */}
      {!loadingExtras && featuredOeuvres.length > 0 && (
        <div className="relative z-20 -mt-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Hero Spotlight - Oeuvre principale */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900"
            onMouseEnter={() => setIsHoveringCarousel(true)}
            onMouseLeave={() => setIsHoveringCarousel(false)}
            onKeyDown={handleCarouselKeyDown}
            tabIndex={0}
            role="region"
            aria-label="Coups de cœur - utilisez les flèches gauche/droite pour naviguer"
          >
            {/* Background Image avec effet blur */}
            <div className="absolute inset-0">
              <AnimatePresence mode="wait">
                <motion.div
                  key={featuredIndex}
                  initial={{ opacity: 0, scale: 1.1 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.8 }}
                  className="absolute inset-0"
                >
                  {featuredOeuvres[featuredIndex]?.couverture?.url && (
                    <Image
                      src={featuredOeuvres[featuredIndex].couverture.url}
                      alt=""
                      fill
                      sizes="100vw"
                      className="object-cover blur-2xl opacity-15 scale-110"
                      priority
                    />
                  )}
                </motion.div>
              </AnimatePresence>
              <div className="absolute inset-0 bg-gradient-to-r from-gray-900 via-gray-900/90 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-gray-900/50" />
            </div>

            {/* Contenu principal */}
            <div className="relative z-10 flex flex-col lg:flex-row items-center gap-8 p-6 md:p-10 lg:p-12 min-h-[400px] lg:min-h-[450px]">
              
              {/* Couverture avec effet 3D */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={featuredIndex}
                  initial={{ opacity: 0, x: -50, rotateY: -15 }}
                  animate={{ opacity: 1, x: 0, rotateY: 0 }}
                  exit={{ opacity: 0, x: 50 }}
                  transition={{ duration: 0.5 }}
                  className="flex-shrink-0"
                >
                  <Link 
                    href={`/oeuvre/${featuredOeuvres[featuredIndex]?.documentId}-${slugify(featuredOeuvres[featuredIndex]?.titre || '')}`}
                    className="block group"
                  >
                    <div className="relative">
                      {/* Effet glow */}
                      <div className="absolute -inset-4 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-2xl blur-xl opacity-30 group-hover:opacity-50 transition-opacity duration-500" />
                      
                      {/* Couverture */}
                      <div className="relative w-48 h-72 md:w-56 md:h-80 lg:w-64 lg:h-96 rounded-xl overflow-hidden shadow-2xl transform group-hover:scale-[1.02] transition-transform duration-500 ring-2 ring-white/10">
                        {featuredOeuvres[featuredIndex]?.couverture?.url ? (
                          <Image
                            src={featuredOeuvres[featuredIndex].couverture.url}
                            alt={featuredOeuvres[featuredIndex].titre}
                            fill
                            sizes="(max-width: 768px) 192px, (max-width: 1024px) 224px, 256px"
                            className="object-cover"
                            priority
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                            <FiBook className="text-5xl text-gray-600" />
                          </div>
                        )}
                        
                        {/* Badge numéro */}
                        <div className="absolute top-3 left-3">
                          <span className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black text-xs font-black px-3 py-1.5 rounded-full shadow-lg">
                            #{featuredIndex + 1} COUP DE CŒUR
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              </AnimatePresence>

              {/* Infos oeuvre */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={featuredIndex}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -30 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  className="flex-1 text-center lg:text-left"
                >
                  {/* Titre de section */}
                  <div className="flex items-center justify-center lg:justify-start gap-2 mb-4">
                    <FiStar className="text-yellow-400 text-xl" />
                    <h2 className="text-sm font-medium text-yellow-400 uppercase tracking-wider">
                      Notre sélection
                    </h2>
                  </div>
                  
                  {/* Titre oeuvre */}
                  <Link 
                    href={`/oeuvre/${featuredOeuvres[featuredIndex]?.documentId}-${slugify(featuredOeuvres[featuredIndex]?.titre || '')}`}
                    className="block group"
                  >
                    <h3 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-indigo-400 group-hover:to-pink-400 transition-all duration-300 line-clamp-2">
                      {featuredOeuvres[featuredIndex]?.titre}
                    </h3>
                  </Link>
                  
                  {/* Métadonnées */}
                  <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 mb-5">
                    <span className="px-3 py-1 bg-indigo-500/20 text-indigo-300 rounded-full text-sm font-medium">
                      {featuredOeuvres[featuredIndex]?.type || "Novel"}
                    </span>
                    {featuredOeuvres[featuredIndex]?.categorie && (
                      <span className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-sm font-medium">
                        {featuredOeuvres[featuredIndex].categorie}
                      </span>
                    )}
                    {featuredOeuvres[featuredIndex]?.etat && (
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        featuredOeuvres[featuredIndex].etat === "En cours" 
                          ? "bg-green-500/20 text-green-300" 
                          : "bg-blue-500/20 text-blue-300"
                      }`}>
                        {featuredOeuvres[featuredIndex].etat}
                      </span>
                    )}
                  </div>

                  {/* Genres */}
                  {featuredOeuvres[featuredIndex]?.genres?.length > 0 && (
                    <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2 mb-5">
                      {featuredOeuvres[featuredIndex].genres.slice(0, 4).map((genre) => (
                        <span 
                          key={genre.documentId || genre.id} 
                          className="px-2 py-0.5 bg-gray-800/80 text-gray-300 rounded text-xs border border-gray-700"
                        >
                          {genre.titre}
                        </span>
                      ))}
                    </div>
                  )}
                  
                  {/* Synopsis */}
                  <p className="text-gray-300 text-base md:text-lg leading-relaxed mb-6 line-clamp-4 max-w-2xl mx-auto lg:mx-0">
                    {featuredOeuvres[featuredIndex]?.synopsis 
                      ? featuredOeuvres[featuredIndex].synopsis.replace(/<[^>]*>/g, '').substring(0, 280) + '...'
                      : "Découvrez cette œuvre exceptionnelle sélectionnée par notre équipe."
                    }
                  </p>
                  
                  {/* CTA */}
                  <Link 
                    href={`/oeuvre/${featuredOeuvres[featuredIndex]?.documentId}-${slugify(featuredOeuvres[featuredIndex]?.titre || '')}`}
                    className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold px-8 py-3 rounded-full shadow-lg hover:shadow-indigo-500/30 transition-all duration-300 transform hover:scale-105"
                  >
                    <FiBook className="text-lg" />
                    Découvrir cette œuvre
                    <FiChevronRight className="text-lg" />
                  </Link>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Navigation carousel */}
            <div className="relative z-10 flex items-center justify-center gap-3 pb-6">
              {featuredOeuvres.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setFeaturedIndex(idx)}
                  className={`transition-all duration-300 ${
                    idx === featuredIndex 
                      ? 'w-10 h-3 bg-gradient-to-r from-indigo-400 to-purple-400 rounded-full shadow-lg shadow-indigo-500/30' 
                      : 'w-3 h-3 bg-gray-600 hover:bg-gray-500 rounded-full'
                  }`}
                  aria-label={`Voir œuvre ${idx + 1}`}
                />
              ))}
            </div>
          </motion.div>

          {/* Miniatures des 5 œuvres mises en avant */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FiStar className="text-yellow-400" />
                <span className="text-sm font-medium text-gray-400">Les 5 coups de cœur</span>
              </div>
              
              {/* U6: Contrôles Admin - cachés sur mobile */}
              {isAdmin && (
                <div className="hidden md:flex items-center gap-2">
                  <button
                    onClick={handleRefreshFeatured}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/40 border border-indigo-500/30 rounded-full text-xs text-indigo-300 transition-all"
                    title="Relancer la sélection aléatoire"
                  >
                    <FiRefreshCw className="text-sm" />
                    Relancer
                  </button>
                  <button
                    onClick={() => setShowAdminPanel(!showAdminPanel)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-full text-xs transition-all ${
                      showAdminPanel 
                        ? 'bg-yellow-500/30 border-yellow-500/50 text-yellow-300' 
                        : 'bg-gray-700/50 hover:bg-gray-700 border-gray-600 text-gray-300'
                    }`}
                    title="Gérer les coups de cœur"
                  >
                    <FiSettings className="text-sm" />
                    Gérer
                  </button>
                </div>
              )}
            </div>
            
            {/* Panel Admin - Sélection manuelle */}
            {isAdmin && showAdminPanel && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-4 p-4 bg-gray-800/80 rounded-xl border border-yellow-500/30"
              >
                <div className="flex items-center gap-2 mb-3">
                  <FiSettings className="text-yellow-400" />
                  <span className="text-sm font-medium text-yellow-300">Gestion des coups de cœur</span>
                </div>
                
                {/* Liste des oeuvres sélectionnées avec bouton supprimer */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {featuredOeuvres.map((oeuvre, idx) => (
                    <div 
                      key={oeuvre.documentId}
                      className="flex items-center gap-2 bg-gray-700/50 rounded-lg px-3 py-1.5 text-sm"
                    >
                      <span className="text-indigo-400 font-bold">#{idx + 1}</span>
                      <span className="text-gray-200 max-w-[150px] truncate">{oeuvre.titre}</span>
                      <button
                        onClick={() => handleRemoveFromFeatured(oeuvre.documentId)}
                        className="text-red-400 hover:text-red-300 transition-colors"
                        title="Retirer"
                      >
                        <FiX />
                      </button>
                    </div>
                  ))}
                  {featuredOeuvres.length < 5 && (
                    <span className="text-gray-500 text-sm italic px-2 py-1.5">
                      {5 - featuredOeuvres.length} emplacement(s) disponible(s)
                    </span>
                  )}
                </div>

                {/* Recherche pour ajouter */}
                <div className="relative">
                  <div className="flex items-center gap-2">
                    <FiSearch className="text-gray-400" />
                    <input
                      type="text"
                      value={adminSearch}
                      onChange={(e) => setAdminSearch(e.target.value)}
                      placeholder="Rechercher une œuvre à ajouter..."
                      className="flex-1 bg-gray-700/50 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  
                  {/* Résultats de recherche */}
                  {filteredOeuvresForPicker.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-gray-800 border border-gray-700 rounded-xl shadow-xl z-50 max-h-60 overflow-y-auto">
                      {filteredOeuvresForPicker.map((oeuvre) => (
                        <button
                          key={oeuvre.documentId}
                          onClick={() => handleAddToFeatured(oeuvre)}
                          className="w-full flex items-center gap-3 p-3 hover:bg-gray-700/50 transition-colors text-left"
                        >
                          <div className="w-10 h-14 rounded overflow-hidden flex-shrink-0 bg-gray-700">
                            {oeuvre.couverture?.url && (
                              <Image
                                src={oeuvre.couverture.url}
                                alt={oeuvre.titre}
                                width={40}
                                height={56}
                                className="w-full h-full object-cover"
                              />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{oeuvre.titre}</p>
                            <p className="text-xs text-gray-500">{oeuvre.type || "Novel"}</p>
                          </div>
                          <FiPlus className="text-green-400 flex-shrink-0" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
            
            <div className="grid grid-cols-5 gap-3">
              {featuredOeuvres.map((oeuvre, idx) => (
                <div
                  key={oeuvre.documentId}
                  onClick={() => setFeaturedIndex(idx)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && setFeaturedIndex(idx)}
                  className={`group relative aspect-[3/4] rounded-xl overflow-hidden transition-all duration-300 cursor-pointer ${
                    idx === featuredIndex 
                      ? 'ring-2 ring-indigo-400 ring-offset-2 ring-offset-gray-900 scale-105 shadow-xl shadow-indigo-500/20' 
                      : 'opacity-60 hover:opacity-100 hover:scale-[1.02]'
                  }`}
                >
                  {oeuvre.couverture?.url ? (
                    <Image
                      src={oeuvre.couverture.url}
                      alt={oeuvre.titre}
                      fill
                      sizes="(max-width: 640px) 20vw, 150px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                      <FiBook className="text-gray-600" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-2">
                    <p className="text-[10px] sm:text-xs font-medium truncate">{oeuvre.titre}</p>
                  </div>
                  <div className="absolute top-2 left-2">
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      idx === featuredIndex 
                        ? 'bg-indigo-500 text-white' 
                        : 'bg-black/50 text-gray-300'
                    }`}>
                      #{idx + 1}
                    </span>
                  </div>
                  
                  {/* Bouton supprimer pour admin */}
                  {isAdmin && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveFromFeatured(oeuvre.documentId);
                      }}
                      className="absolute top-2 right-2 w-6 h-6 bg-red-500/80 hover:bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
                      title="Retirer ce coup de cœur"
                    >
                      <FiX className="text-white text-xs" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      )}

      {/* Sections enrichies */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        
        {/* Dernières mises à jour */}
        {!loadingExtras && dernieresMaj.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-10"
          >
            <div className="flex items-center gap-2 mb-4">
              <FiClock className="text-green-400" />
              <h2 className="text-lg font-bold">Dernières mises à jour</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
              {dernieresMaj.slice(0, 6).map((oeuvre) => (
                <Link
                  key={oeuvre.documentId}
                  href={`/oeuvre/${oeuvre.documentId}-${slugify(oeuvre.titre)}`}
                  className="group bg-gray-800/50 rounded-xl overflow-hidden hover:bg-gray-800 transition-all border border-gray-700/50 hover:border-green-500/30"
                >
                  <div className="flex flex-col items-center gap-2 p-3">
                    <div className="w-16 h-20 rounded-lg overflow-hidden flex-shrink-0">
                      {oeuvre.couverture?.url ? (
                        <Image
                          src={oeuvre.couverture.url}
                          alt={oeuvre.titre}
                          width={64}
                          height={80}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-700 flex items-center justify-center">
                          <FiBook className="text-gray-500" />
                        </div>
                      )}
                    </div>
                    <div className="text-center min-w-0 w-full">
                      <p className="font-medium text-xs truncate group-hover:text-green-400 transition-colors">
                        {oeuvre.titre}
                      </p>
                      <p className="text-[10px] text-gray-500">{oeuvre.type || "Novel"}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </motion.div>
        )}

        {/* Nouveautés du mois */}
        {!loadingExtras && nouveautes.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-10"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FiCalendar className="text-purple-400" />
                <h2 className="text-lg font-bold">Nouveautés du mois</h2>
                <span className="bg-purple-500/20 text-purple-400 text-xs px-2 py-0.5 rounded-full">
                  {nouveautes.length} nouveaux
                </span>
              </div>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
              {nouveautes.map((oeuvre) => (
                <Link
                  key={oeuvre.documentId}
                  href={`/oeuvre/${oeuvre.documentId}-${slugify(oeuvre.titre)}`}
                  className="group"
                >
                  <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-gray-800 border border-gray-700/50 hover:border-purple-500/50 transition-all">
                    {oeuvre.couverture?.url ? (
                      <Image
                        src={oeuvre.couverture.url}
                        alt={oeuvre.titre}
                        fill
                        sizes="(max-width: 640px) 33vw, (max-width: 768px) 16vw, 150px"
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <FiBook className="text-2xl text-gray-600" />
                      </div>
                    )}
                    <div className="absolute top-2 left-2">
                      <span className="bg-purple-500 text-white text-[10px] font-bold px-2 py-0.5 rounded">
                        NEW
                      </span>
                    </div>
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent p-2">
                      <p className="text-xs font-medium truncate">{oeuvre.titre}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </motion.div>
        )}

        {/* Séparateur visuel */}
        <div className="border-t border-gray-800 my-8" />

        {/* Publicité Kanveo */}
        <KanveoBanner format="banner" className="mb-8" />

        {/* Titre section catalogue */}
        <div ref={catalogueRef} className="flex items-center gap-3 mb-6 scroll-mt-20">
          <FiGrid className="text-indigo-400 text-xl" />
          <h2 className="text-xl font-bold">Toutes les œuvres</h2>
        </div>

        {/* Filtres */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <FiltreOeuvres onFilterChange={handleFilterChange} />
        </motion.div>

        {/* Indicateur de résultats + E7: tri */}
        {!loading && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
            <p className="text-gray-400 text-sm">
              Affichage de <span className="text-white font-medium">{oeuvres.length}</span> œuvres 
              sur <span className="text-white font-medium">{totalOeuvres.toLocaleString()}</span>
            </p>
            <div className="flex items-center gap-3">
              <select
                value={sortBy}
                onChange={(e) => { setSortBy(e.target.value); setPage(0); }}
                className="bg-gray-800 border border-gray-700 text-gray-300 text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:border-indigo-500 transition-colors"
                aria-label="Trier par"
              >
                <option value="">Trier par : Pertinence</option>
                <option value="titre:asc">Titre (A–Z)</option>
                <option value="titre:desc">Titre (Z–A)</option>
                <option value="updatedAt:desc">Mise à jour récente</option>
                <option value="createdAt:desc">Nouveautés</option>
              </select>
              <p className="text-gray-500 text-sm hidden sm:block">
                Page {page + 1} / {totalPages}
              </p>
            </div>
          </div>
        )}

        {/* E5: Pagination compacte en haut */}
        {totalPages > 1 && !loading && (
          <div className="flex items-center justify-center gap-2 mb-6">
            <button
              disabled={page === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-lg text-white text-sm disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <FiChevronLeft className="inline" />
            </button>
            <span className="text-gray-400 text-sm">Page {page + 1} / {totalPages}</span>
            <button
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-lg text-white text-sm disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <FiChevronRight className="inline" />
            </button>
          </div>
        )}

        {/* F4: État d'erreur */}
        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-3 p-4 mb-6 bg-red-900/20 border border-red-500/30 rounded-xl text-red-300"
          >
            <FiAlertCircle className="text-xl flex-shrink-0" />
            <p className="text-sm">{error}</p>
            <button
              onClick={() => { setError(null); fetchOeuvres(); }}
              className="ml-auto px-3 py-1 bg-red-600/30 hover:bg-red-600/50 rounded-lg text-xs transition-colors"
            >
              Réessayer
            </button>
          </motion.div>
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
                  onChange={(e) => { setPageJump(e.target.value); setPageJumpError(""); }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      const val = parseInt(pageJump);
                      if (!isNaN(val) && val >= 1 && val <= totalPages) {
                        setPage(val - 1);
                        setPageJump("");
                        setPageJumpError("");
                      } else {
                        setPageJumpError(`Numéro entre 1 et ${totalPages}`);
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
                      setPageJumpError("");
                    } else {
                      setPageJumpError(`Numéro entre 1 et ${totalPages}`);
                    }
                  }}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm rounded-lg transition-colors"
                >
                  <FiSearch className="inline" />
                </button>
                {pageJumpError && (
                  <span className="text-red-400 text-xs">{pageJumpError}</span>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Popup de prévisualisation */}
      {selectedOeuvre && (
        <FicheOeuvre oeuvre={selectedOeuvre} onClose={handleClosePreview} />
      )}
    </>
  );
}
