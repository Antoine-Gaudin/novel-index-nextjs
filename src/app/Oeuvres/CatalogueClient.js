"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import dynamic from "next/dynamic";
import FiltreOeuvres from "@/app/components/FiltreOeuvres";
const FicheOeuvre = dynamic(() => import("@/app/components/FicheOeuvre"), { ssr: false });
import OeuvreCard from "@/app/components/OeuvreCard";
import AdBanner from "@/app/components/AdBanner";
import TaxonomyChip from "@/app/components/TaxonomyChip";
import { slugify } from "@/utils/slugify";
import { useAuth } from "@/contexts/AuthContext";
import { FiChevronLeft, FiChevronRight, FiSearch, FiBook, FiGrid, FiFilter, FiStar, FiClock, FiTrendingUp, FiCalendar, FiRefreshCw, FiSettings, FiPlus, FiX, FiCheck, FiAlertCircle, FiArrowUp, FiHeart, FiUser } from "react-icons/fi";

export default function CatalogueClient({ initialOeuvres = [], initialTotal = 0, initialPage = 0, initialExtras = null, totalPages: initialTotalPages = 1 }) {
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
  // featuredOeuvres : initialisé depuis le SSR (initialFeatured) pour que la section
  // soit indexable Googlebot. Le useEffect ci-dessous override avec la sélection
  // admin si présente dans localStorage.
  const [featuredOeuvres, setFeaturedOeuvres] = useState(initialExtras?.initialFeatured || []);
  const [dernieresMaj, setDernieresMaj] = useState(initialExtras?.dernieresMaj || []);
  const [nouveautes, setNouveautes] = useState(initialExtras?.nouveautes || []);
  const [stats, setStats] = useState(initialExtras?.stats || { chapitres: 0, teams: 0 });
  const [loadingExtras, setLoadingExtras] = useState(false);
  
  // Admin - gestion des coups de cœur
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [allOeuvresForPicker, setAllOeuvresForPicker] = useState([]);
  const [adminSearch, setAdminSearch] = useState("");
  const [loadingAdminSearch, setLoadingAdminSearch] = useState(false);

  // Override de la sélection SSR par le choix admin localStorage si présent.
  // (Le shuffle quotidien par défaut est déjà fait en SSR dans page.js → indexable.)
  useEffect(() => {
    const candidates = initialExtras?.featuredCandidates || [];
    setAllOeuvresForPicker(candidates);

    if (candidates.length === 0) return;

    try {
      const savedFeatured = localStorage.getItem('novel-index-featured');
      if (!savedFeatured) return;
      const savedIds = JSON.parse(savedFeatured);
      if (!Array.isArray(savedIds) || savedIds.length === 0) return;
      const savedOeuvres = savedIds
        .map((id) => candidates.find((o) => o.documentId === id))
        .filter(Boolean);
      if (savedOeuvres.length >= 3) {
        setFeaturedOeuvres(savedOeuvres);
      }
    } catch {}
  }, [initialExtras]);

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

  const fetchOeuvres = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const start = page * pageSize;
      let url = `${apiUrl}/api/oeuvres?populate[couverture][fields][0]=url&populate[genres][fields][0]=titre&pagination[start]=${start}&pagination[limit]=${pageSize}`;
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

  const totalPages = Math.max(initialTotalPages, Math.ceil(totalOeuvres / pageSize));

  // href crawlable pour la pagination — vraie URL ?page=N que Googlebot peut suivre.
  // Le onClick reste pour le comportement SPA (pas de full reload).
  const pageHref = useCallback(
    (p) => (p <= 1 ? pathname : `${pathname}?page=${p}`),
    [pathname]
  );

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

      {/* ═══ NOTRE SÉLECTION — Pattern home (Featured + Grid), accent rose/pink ═══
          z-10 obligatoire : la section démarre dans la zone des 700px du CoverBackground
          (hero) en haut de la page. Sans z-10 elle se retrouve derrière les couvertures. */}
      {!loadingExtras && featuredOeuvres.length > 0 && (
        <section className="relative z-10 py-8 px-4 sm:px-6 lg:px-8">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-rose-600/[0.04] rounded-full blur-[120px] pointer-events-none" />

          <div className="max-w-7xl mx-auto relative">
            {/* Header */}
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center shadow-lg shadow-rose-500/20">
                <FiHeart className="text-white text-[15px]" />
              </div>
              <h2 className="text-xl font-black text-white tracking-tight">Notre sélection</h2>
              <span className="bg-rose-500/15 text-rose-300 px-3 py-1 rounded-full font-bold text-xs border border-rose-500/20">
                {featuredOeuvres.length}
              </span>

              {isAdmin && (
                <div className="ml-auto hidden md:flex items-center gap-2">
                  <button
                    onClick={handleRefreshFeatured}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white/[0.025] hover:bg-white/[0.05] border border-white/[0.06] hover:border-rose-500/30 rounded-full text-xs text-white/60 hover:text-white transition-all"
                    title="Relancer la sélection aléatoire"
                  >
                    <FiRefreshCw className="text-sm" />
                    Relancer
                  </button>
                  <button
                    onClick={() => setShowAdminPanel(!showAdminPanel)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-full text-xs transition-all ${
                      showAdminPanel
                        ? 'bg-rose-500/20 border-rose-500/40 text-rose-200'
                        : 'bg-white/[0.025] hover:bg-white/[0.05] border-white/[0.06] hover:border-rose-500/30 text-white/60 hover:text-white'
                    }`}
                    title="Gérer les coups de cœur"
                  >
                    <FiSettings className="text-sm" />
                    Gérer
                  </button>
                </div>
              )}
            </div>
            <p className="text-white/35 text-sm mb-6">
              Une curation d&apos;œuvres à découvrir, sélectionnées pour leur qualité et leur potentiel.
            </p>

            {/* Panneau Admin dépliable */}
            <AnimatePresence>
              {isAdmin && showAdminPanel && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-6 overflow-hidden"
                >
                  <div className="p-4 bg-white/[0.025] border border-rose-500/20 rounded-xl">
                    <div className="flex items-center gap-2 mb-3">
                      <FiSettings className="text-rose-400" />
                      <span className="text-sm font-medium text-rose-200">Gestion de la sélection</span>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-4">
                      {featuredOeuvres.map((oeuvre, idx) => (
                        <div
                          key={oeuvre.documentId}
                          className="flex items-center gap-2 bg-white/[0.04] border border-white/[0.06] rounded-lg px-3 py-1.5 text-sm"
                        >
                          <span className="text-rose-400 font-bold">#{idx + 1}</span>
                          <span className="text-white/80 max-w-[150px] truncate">{oeuvre.titre}</span>
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
                        <span className="text-white/40 text-sm italic px-2 py-1.5">
                          {5 - featuredOeuvres.length} emplacement(s) disponible(s)
                        </span>
                      )}
                    </div>

                    <div className="relative">
                      <div className="flex items-center gap-2">
                        <FiSearch className="text-white/40" />
                        <input
                          type="text"
                          value={adminSearch}
                          onChange={(e) => setAdminSearch(e.target.value)}
                          placeholder="Rechercher une œuvre à ajouter..."
                          className="flex-1 bg-white/[0.025] border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-rose-500/50"
                        />
                      </div>

                      {filteredOeuvresForPicker.length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-gray-900 border border-white/[0.08] rounded-xl shadow-xl z-50 max-h-60 overflow-y-auto">
                          {filteredOeuvresForPicker.map((oeuvre) => (
                            <button
                              key={oeuvre.documentId}
                              onClick={() => handleAddToFeatured(oeuvre)}
                              className="w-full flex items-center gap-3 p-3 hover:bg-white/[0.04] transition-colors text-left"
                            >
                              <div className="w-10 h-14 rounded overflow-hidden flex-shrink-0 bg-white/[0.04]">
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
                                <p className="font-medium text-sm truncate text-white/80">{oeuvre.titre}</p>
                                <p className="text-xs text-white/40">{oeuvre.type || "Novel"}</p>
                              </div>
                              <FiPlus className="text-rose-400 flex-shrink-0" />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Featured — Grande carte horizontale (œuvre #1) */}
            {(() => {
              const featured = featuredOeuvres[0];
              if (!featured) return null;
              const cover = featured.couverture?.url;
              const url = `/oeuvre/${featured.documentId}-${slugify(featured.titre || '')}`;
              const cleanSyno = (featured.synopsis || '').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();

              return (
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4 }}
                  className="group relative mb-6"
                >
                  <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-r from-rose-500/0 via-pink-500/0 to-rose-500/0 group-hover:from-rose-500/30 group-hover:via-pink-500/15 group-hover:to-rose-500/30 transition-all duration-500" />
                  <div className="relative flex flex-col sm:flex-row bg-white/[0.02] border border-white/[0.06] group-hover:border-rose-500/20 rounded-2xl overflow-hidden transition-all duration-300">
                    {/* Cover */}
                    <Link
                      href={url}
                      className="block relative sm:w-[220px] md:w-[260px] flex-shrink-0 aspect-[2/3] sm:aspect-auto sm:min-h-[280px]"
                    >
                      {cover ? (
                        <Image
                          src={cover}
                          alt={featured.titre}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-700"
                          sizes="260px"
                        />
                      ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                          <FiBook className="text-4xl text-white/10" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#111827] hidden sm:block" />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#111827] to-transparent sm:hidden" />
                    </Link>

                    {/* Info */}
                    <div className="flex-1 p-5 sm:p-7 flex flex-col justify-center relative">
                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        <span className="bg-rose-500/15 text-rose-300 border border-rose-500/20 px-2.5 py-0.5 text-[11px] rounded-lg font-semibold uppercase tracking-wider">
                          Sélection
                        </span>
                        {featured.type && (
                          <span className="bg-white/[0.06] text-white/60 px-2.5 py-0.5 text-[11px] rounded-lg font-medium">{featured.type}</span>
                        )}
                        {featured.etat && (
                          <span className="bg-white/[0.06] text-white/50 px-2.5 py-0.5 text-[11px] rounded-lg font-medium">{featured.etat}</span>
                        )}
                      </div>
                      <Link href={url} className="block">
                        <h3 className="text-xl sm:text-2xl font-black text-white mb-2 group-hover:text-rose-200 transition-colors leading-tight">
                          {featured.titre}
                        </h3>
                      </Link>
                      {featured.auteur && (
                        <p className="text-white/30 text-xs mb-3 flex items-center gap-1.5">
                          <FiUser className="text-[10px]" />{featured.auteur}
                        </p>
                      )}
                      {cleanSyno && (
                        <p className="text-white/40 text-sm leading-relaxed mb-4 line-clamp-3">{cleanSyno}</p>
                      )}
                      {featured.genres?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {featured.genres.slice(0, 4).map((g) => (
                            <TaxonomyChip
                              key={g.documentId || g.id || g.titre}
                              type="genre"
                              label={g.titre}
                              size="sm"
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })()}

            {/* Grille — 4 autres sélections */}
            {featuredOeuvres.length > 1 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {featuredOeuvres.slice(1, 5).map((oeuvre, i) => {
                  const cover = oeuvre.couverture?.url;
                  const url = `/oeuvre/${oeuvre.documentId}-${slugify(oeuvre.titre || '')}`;
                  const cleanSyno = (oeuvre.synopsis || '').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();

                  return (
                    <motion.div
                      key={oeuvre.documentId}
                      initial={{ opacity: 0, y: 12 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.3, delay: Math.min(i * 0.06, 0.3) }}
                      className="group relative"
                    >
                      <div className="absolute -inset-[1px] rounded-xl bg-gradient-to-b from-rose-500/0 to-rose-500/0 group-hover:from-rose-500/20 group-hover:to-pink-500/10 transition-all duration-500" />
                      <div className="relative flex gap-4 bg-white/[0.02] border border-white/[0.06] group-hover:border-rose-500/20 rounded-xl p-3.5 transition-all duration-300 h-full">
                        <Link
                          href={url}
                          className="relative flex-shrink-0 w-[80px] sm:w-[90px] aspect-[2/3] rounded-lg overflow-hidden bg-gray-900 block"
                        >
                          {cover ? (
                            <Image
                              src={cover}
                              alt={oeuvre.titre}
                              fill
                              className="object-cover group-hover:scale-105 transition-transform duration-500"
                              sizes="90px"
                            />
                          ) : (
                            <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                              <FiBook className="text-xl text-white/10" />
                            </div>
                          )}
                        </Link>

                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                          <div className="flex items-center gap-2 mb-1.5">
                            {oeuvre.type && (
                              <span className="bg-white/[0.06] text-white/50 px-2 py-0.5 text-[10px] rounded-md font-semibold">{oeuvre.type}</span>
                            )}
                            {oeuvre.etat && (
                              <span className="text-white/30 text-[10px]">{oeuvre.etat}</span>
                            )}
                          </div>
                          <Link href={url} className="block">
                            <h4 className="font-bold text-sm text-white truncate group-hover:text-rose-200 transition-colors mb-1">{oeuvre.titre}</h4>
                          </Link>
                          {oeuvre.auteur && (
                            <p className="text-white/25 text-[11px] mb-1.5 truncate">{oeuvre.auteur}</p>
                          )}
                          {cleanSyno && (
                            <p className="text-white/30 text-xs leading-relaxed line-clamp-2">{cleanSyno}</p>
                          )}
                          {oeuvre.genres?.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {oeuvre.genres.slice(0, 3).map((g) => (
                                <TaxonomyChip
                                  key={g.documentId || g.id || g.titre}
                                  type="genre"
                                  label={g.titre}
                                  size="sm"
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
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

        {/* Publicité — 50/50 Kanveo / Make Your List */}
        <AdBanner format="banner" className="mb-8" />

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
            {page === 0 ? (
              <span className="px-3 py-1.5 bg-gray-800 rounded-lg text-white text-sm opacity-40 cursor-not-allowed">
                <FiChevronLeft className="inline" />
              </span>
            ) : (
              <Link
                href={pageHref(page)}
                onClick={(e) => { e.preventDefault(); setPage((p) => Math.max(0, p - 1)); }}
                className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-lg text-white text-sm transition-all"
                aria-label="Page précédente"
              >
                <FiChevronLeft className="inline" />
              </Link>
            )}
            <span className="text-gray-400 text-sm">Page {page + 1} / {totalPages}</span>
            {page >= totalPages - 1 ? (
              <span className="px-3 py-1.5 bg-gray-800 rounded-lg text-white text-sm opacity-40 cursor-not-allowed">
                <FiChevronRight className="inline" />
              </span>
            ) : (
              <Link
                href={pageHref(page + 2)}
                onClick={(e) => { e.preventDefault(); setPage((p) => p + 1); }}
                className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-lg text-white text-sm transition-all"
                aria-label="Page suivante"
              >
                <FiChevronRight className="inline" />
              </Link>
            )}
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
                {page === 0 ? (
                  <span className="flex items-center gap-2 px-4 py-2 bg-gray-700/50 rounded-xl text-white opacity-40 cursor-not-allowed">
                    <FiChevronLeft className="text-lg" />
                    <span className="hidden sm:inline">Précédent</span>
                  </span>
                ) : (
                  <Link
                    href={pageHref(page)}
                    onClick={(e) => { e.preventDefault(); setPage((p) => Math.max(0, p - 1)); }}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-700/50 hover:bg-gray-700 rounded-xl text-white transition-all"
                    aria-label="Page précédente"
                  >
                    <FiChevronLeft className="text-lg" />
                    <span className="hidden sm:inline">Précédent</span>
                  </Link>
                )}

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
                        <Link
                          key="first"
                          href={pageHref(1)}
                          onClick={(e) => { e.preventDefault(); setPage(0); }}
                          className="w-10 h-10 flex items-center justify-center rounded-lg bg-gray-700/50 hover:bg-gray-700 text-white text-sm transition-all"
                          aria-label="Page 1"
                        >
                          1
                        </Link>
                      );
                      if (startPage > 1) {
                        pages.push(
                          <span key="start-ellipsis" className="px-1 text-gray-500">...</span>
                        );
                      }
                    }

                    // Pages du milieu
                    for (let i = startPage; i <= endPage; i++) {
                      const isCurrent = i === page;
                      pages.push(
                        <Link
                          key={i}
                          href={pageHref(i + 1)}
                          onClick={(e) => { e.preventDefault(); setPage(i); }}
                          aria-label={`Page ${i + 1}`}
                          aria-current={isCurrent ? "page" : undefined}
                          className={`w-10 h-10 flex items-center justify-center rounded-lg text-sm font-medium transition-all ${
                            isCurrent
                              ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/30"
                              : "bg-gray-700/50 hover:bg-gray-700 text-white"
                          }`}
                        >
                          {i + 1}
                        </Link>
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
                        <Link
                          key="last"
                          href={pageHref(totalPages)}
                          onClick={(e) => { e.preventDefault(); setPage(totalPages - 1); }}
                          className="w-10 h-10 flex items-center justify-center rounded-lg bg-gray-700/50 hover:bg-gray-700 text-white text-sm transition-all"
                          aria-label={`Page ${totalPages}`}
                        >
                          {totalPages}
                        </Link>
                      );
                    }

                    return pages;
                  })()}
                </div>

                {/* Bouton Suivant */}
                {(page + 1) * pageSize >= totalOeuvres ? (
                  <span className="flex items-center gap-2 px-4 py-2 bg-gray-700/50 rounded-xl text-white opacity-40 cursor-not-allowed">
                    <span className="hidden sm:inline">Suivant</span>
                    <FiChevronRight className="text-lg" />
                  </span>
                ) : (
                  <Link
                    href={pageHref(page + 2)}
                    onClick={(e) => { e.preventDefault(); setPage((p) => p + 1); }}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-700/50 hover:bg-gray-700 rounded-xl text-white transition-all"
                    aria-label="Page suivante"
                  >
                    <span className="hidden sm:inline">Suivant</span>
                    <FiChevronRight className="text-lg" />
                  </Link>
                )}
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
