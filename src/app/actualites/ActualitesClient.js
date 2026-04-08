"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  FiHome, FiChevronRight, FiChevronLeft, FiCalendar, FiUser,
  FiX, FiZap, FiArrowRight,
  FiStar, FiBell, FiBarChart2,
  FiPlusCircle, FiActivity, FiFileText, FiExternalLink, FiLoader,
} from "react-icons/fi";
import CoverBackground from "@/app/components/CoverBackground";

const API = process.env.NEXT_PUBLIC_API_URL;

const CAT_LABELS = {
  actualite: "Actualité",
  guide: "Guide",
  analyse: "Analyse",
  interview: "Interview",
  annonce: "Annonce",
};
const CATEGORIES_KEYS = ["actualite", "guide", "analyse", "interview", "annonce"];
const CAT_COLORS = {
  actualite: "text-blue-400 bg-blue-500/10 border-blue-500/20",
  guide: "text-purple-400 bg-purple-500/10 border-purple-500/20",
  analyse: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
  interview: "text-green-400 bg-green-500/10 border-green-500/20",
  annonce: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
  externe: "text-orange-400 bg-orange-500/10 border-orange-500/20",
};

// ══════════════════════════════════════
// HELPERS
// ══════════════════════════════════════

const SYSTEM_ARTICLE_COVERS = {
  "sorties-": "/images/articles/sorties-jour.svg",
  "recap-semaine-": "/images/articles/recap-semaine.svg",
  "bilan-": "/images/articles/recap-mois.svg",
  "nouvelles-oeuvres-": "/images/articles/nouvelles-oeuvres.svg",
};

function getSystemCover(slug) {
  if (!slug) return null;
  for (const [prefix, src] of Object.entries(SYSTEM_ARTICLE_COVERS)) {
    if (slug.startsWith(prefix)) return src;
  }
  return null;
}

function coverUrl(url) {
  if (!url) return null;
  return url.startsWith("http") ? url : `${API}${url}`;
}

function formatDate(dateStr) {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "numeric", month: "long", year: "numeric",
  });
}

async function fetchArticles(page = 1, pageSize = 12, categorie = "") {
  const params = new URLSearchParams();
  params.set("populate[0]", "couverture");
  params.set("populate[1]", "auteur");
  params.set("populate[2]", "tags");
  params.set("pagination[page]", page);
  params.set("pagination[pageSize]", pageSize);
  params.set("sort", "publishedAt:desc");
  params.set("status", "published");
  if (categorie) params.set("filters[categorie][$eq]", categorie);

  const res = await fetch(`${API}/api/articles?${params}`);
  if (!res.ok) return { data: [], meta: { pagination: { total: 0, pageCount: 0 } } };
  return res.json();
}

async function fetchFeatured() {
  const params = new URLSearchParams();
  params.set("filters[mise_en_avant][$eq]", "true");
  params.set("populate[0]", "couverture");
  params.set("populate[1]", "auteur");
  params.set("sort", "publishedAt:desc");
  params.set("pagination[limit]", "1");
  params.set("status", "published");

  const res = await fetch(`${API}/api/articles?${params}`);
  if (!res.ok) return null;
  const data = await res.json();
  return data.data?.[0] || null;
}

async function fetchLatestBySlugPrefix(prefix) {
  const params = new URLSearchParams();
  params.set("filters[slug][$startsWith]", prefix);
  params.set("sort", "publishedAt:desc");
  params.set("pagination[limit]", "1");
  params.set("fields[0]", "titre");
  params.set("fields[1]", "slug");
  params.set("fields[2]", "extrait");
  params.set("fields[3]", "publishedAt");
  params.set("status", "published");

  const res = await fetch(`${API}/api/articles?${params}`);
  if (!res.ok) return null;
  const data = await res.json();
  return data.data?.[0] || null;
}

async function fetchRSS() {
  try {
    const res = await fetch("/api/rss");
    if (!res.ok) return [];
    const data = await res.json();
    return data.items || [];
  } catch {
    return [];
  }
}

// ══════════════════════════════════════
// COMPOSANTS
// ══════════════════════════════════════

function useReveal(threshold = 0.12) {
  const ref = useRef(null);
  const [v, setV] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setV(true); obs.disconnect(); } }, { threshold });
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, v };
}

function Reveal({ children, className = "", delay = 0, direction = "up" }) {
  const { ref, v } = useReveal();
  const t = { up: "translateY(30px)", left: "translateX(-30px)", right: "translateX(30px)", scale: "scale(0.97)" };
  return (
    <div ref={ref} className={className} style={{
      opacity: v ? 1 : 0, transform: v ? "none" : t[direction],
      transition: `opacity 0.7s cubic-bezier(0.16,1,0.3,1) ${delay}ms, transform 0.7s cubic-bezier(0.16,1,0.3,1) ${delay}ms`,
    }}>{children}</div>
  );
}

function GlowCard({ children, className = "", href, glow = "rgba(99,102,241,0.1)" }) {
  const r = useRef(null);
  const [g, setG] = useState({ x: 50, y: 50 });
  const hm = useCallback((e) => {
    const b = r.current?.getBoundingClientRect();
    if (!b) return;
    setG({ x: ((e.clientX - b.left) / b.width) * 100, y: ((e.clientY - b.top) / b.height) * 100 });
  }, []);
  const Tag = href ? Link : "div";
  return (
    <Tag ref={r} onMouseMove={hm} className={`relative group ${className}`}
      style={{ background: `radial-gradient(500px circle at ${g.x}% ${g.y}%, ${glow}, transparent 70%)` }}
      {...(href ? { href } : {})}
    >{children}</Tag>
  );
}

// ══════════════════════════════════════
// PAGE
// ══════════════════════════════════════

export default function ActualitesClient({
  initialArticles = [],
  initialPagination = { page: 1, pageCount: 1, total: 0 },
  initialFeatured = null,
  initialRecaps = { jour: null, semaine: null, mois: null, nouvelles: null },
}) {
  const [articles, setArticles] = useState(initialArticles);
  const [rssItems, setRssItems] = useState([]);
  const [featured, setFeatured] = useState(initialFeatured);
  const [recaps, setRecaps] = useState(initialRecaps);
  const [pagination, setPagination] = useState(initialPagination);
  const [categorie, setCategorie] = useState("");
  const [loading, setLoading] = useState(false);
  const [filtersSticky, setFiltersSticky] = useState(false);
  const filtersRef = useRef(null);

  // Sticky filters
  useEffect(() => {
    const h = () => {
      if (filtersRef.current) setFiltersSticky(filtersRef.current.getBoundingClientRect().top <= 56);
    };
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);

  // Fetch RSS côté client uniquement (route API interne)
  useEffect(() => {
    fetchRSS().then(setRssItems);
  }, []);

  // Changement de filtre ou page
  async function loadPage(page, cat) {
    setLoading(true);
    const res = await fetchArticles(page, 12, cat);
    setArticles(res.data || []);
    setPagination({
      page: res.meta?.pagination?.page || 1,
      pageCount: res.meta?.pagination?.pageCount || 1,
      total: res.meta?.pagination?.total || 0,
    });
    setLoading(false);
    window.scrollTo({ top: filtersRef.current?.offsetTop - 80, behavior: "smooth" });
  }

  function handleCategorie(cat) {
    const newCat = categorie === cat ? "" : cat;
    setCategorie(newCat);
    loadPage(1, newCat === "externe" ? "" : newCat);
  }

  // Mélanger articles internes + RSS si pas de filtre catégorie ou filtre "externe"
  const showRSS = !categorie || categorie === "externe";
  const showInternal = categorie !== "externe";

  let displayItems = [];
  if (showInternal) {
    // Exclure l'article featured de la grille
    const featuredId = featured?.documentId || featured?.id;
    displayItems = articles.filter((a) => (a.documentId || a.id) !== featuredId);
  }

  // Fusionner articles + RSS par date décroissante
  if (showRSS && rssItems.length > 0) {
    if (categorie === "externe") {
      displayItems = rssItems.map((r) => ({ ...r, externe: true }));
    } else {
      const rssWithFlag = rssItems.map((r) => ({ ...r, externe: true }));
      displayItems = [...displayItems, ...rssWithFlag].sort((a, b) => {
        const dateA = a.publishedAt ? new Date(a.publishedAt).getTime() : (a._ts || 0);
        const dateB = b.publishedAt ? new Date(b.publishedAt).getTime() : (b._ts || 0);
        return dateB - dateA;
      });
    }
  }

  return (
    <div className="relative bg-gray-900 text-white min-h-screen">

      {/* ═══════════════════════════════════════
          HERO
          ═══════════════════════════════════════ */}
      <section className="relative h-[45vh] min-h-[320px] overflow-hidden">
        <CoverBackground />
        <div className="absolute inset-0 z-[1] bg-gradient-to-b from-black/40 via-gray-900/20 to-gray-900" />
        <div className="absolute inset-0 z-10 flex flex-col justify-end">
          <nav aria-label="Fil d'Ariane" className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 mb-auto pt-20">
            <ol className="flex items-center gap-2 text-sm text-gray-400">
              <li><Link href="/" className="hover:text-white transition-colors flex items-center gap-1"><FiHome className="text-xs" /> Accueil</Link></li>
              <li><FiChevronRight className="text-xs" /></li>
              <li className="text-white font-medium">Actualités</li>
            </ol>
          </nav>
          <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pb-10">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white flex items-center gap-3 mb-3">
              <FiFileText className="text-indigo-400" />
              Actualités
            </h1>
            <p className="text-gray-300 text-sm md:text-base max-w-2xl">
              Le pouls de la traduction francophone — sorties quotidiennes, récaps hebdo, bilans mensuels et toute l&apos;actu des novels, manga et webtoons.
            </p>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          INTRO
          ═══════════════════════════════════════ */}
      <section className="bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-4">
          <Reveal>
            <p className="text-gray-400 leading-relaxed">
              Chaque jour, des dizaines de chapitres de <strong className="text-white">web novels</strong>, <strong className="text-white">light novels</strong>, <strong className="text-white">manga</strong> et <strong className="text-white">webtoons</strong> sont traduits en français par des teams passionnées. Cette page centralise tout au même endroit : les sorties du jour, les récaps de la semaine et du mois, les nouvelles séries ajoutées, et une veille sur l&apos;actualité manga et novel en français.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          RÉCAPS — Bandeaux-liens
          ═══════════════════════════════════════ */}
      <section className="bg-gray-900 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">

          {/* Sorties d'hier */}
          {recaps.jour && (
            <Reveal>
              <GlowCard
                href={`/actualites/${recaps.jour.slug}`}
                glow="rgba(234,179,8,0.08)"
                className="block rounded-2xl overflow-hidden border border-gray-800 hover:border-yellow-500/30 transition-all"
              >
                <div className="p-5 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="w-10 h-10 rounded-xl bg-yellow-500/15 flex items-center justify-center">
                        <FiZap className="text-lg text-yellow-400" />
                      </div>
                      <div>
                        <p className="text-xs font-bold uppercase tracking-widest text-yellow-400">Sorties d&apos;hier</p>
                        <p className="text-sm text-gray-500">{formatDate(recaps.jour.publishedAt)}</p>
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-400 line-clamp-1">{recaps.jour.extrait || recaps.jour.titre}</p>
                    </div>
                    <span className="shrink-0 flex items-center gap-2 text-sm font-medium text-yellow-400 group-hover:text-yellow-300 transition-colors">
                      Lire le récap <FiArrowRight className="group-hover:translate-x-1 transition-transform" />
                    </span>
                  </div>
                </div>
              </GlowCard>
            </Reveal>
          )}

          {/* Récap semaine / mois / nouvelles oeuvres */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {recaps.semaine && (
              <Reveal delay={100}>
                <GlowCard
                  href={`/actualites/${recaps.semaine.slug}`}
                  glow="rgba(99,102,241,0.08)"
                  className="block rounded-2xl overflow-hidden border border-gray-800 hover:border-indigo-500/30 transition-all h-full"
                >
                  <div className="p-5">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-9 h-9 rounded-lg bg-indigo-500/15 flex items-center justify-center">
                        <FiBarChart2 className="text-indigo-400" />
                      </div>
                      <div>
                        <p className="text-xs font-bold uppercase tracking-widest text-indigo-400">Récap semaine</p>
                        <p className="text-[11px] text-gray-500">{formatDate(recaps.semaine.publishedAt)}</p>
                      </div>
                    </div>
                    <p className="text-gray-400 text-sm leading-relaxed mb-4 line-clamp-2">
                      {recaps.semaine.extrait || recaps.semaine.titre}
                    </p>
                    <div className="flex items-center justify-end">
                      <span className="flex items-center gap-1.5 text-xs font-medium text-indigo-400 group-hover:text-indigo-300 transition-colors">
                        Lire l&apos;article <FiArrowRight className="text-[10px] group-hover:translate-x-1 transition-transform" />
                      </span>
                    </div>
                  </div>
                </GlowCard>
              </Reveal>
            )}

            {recaps.mois && (
              <Reveal delay={200}>
                <GlowCard
                  href={`/actualites/${recaps.mois.slug}`}
                  glow="rgba(168,85,247,0.08)"
                  className="block rounded-2xl overflow-hidden border border-gray-800 hover:border-purple-500/30 transition-all h-full"
                >
                  <div className="p-5">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-9 h-9 rounded-lg bg-purple-500/15 flex items-center justify-center">
                        <FiActivity className="text-purple-400" />
                      </div>
                      <div>
                        <p className="text-xs font-bold uppercase tracking-widest text-purple-400">Bilan du mois</p>
                        <p className="text-[11px] text-gray-500">{formatDate(recaps.mois.publishedAt)}</p>
                      </div>
                    </div>
                    <p className="text-gray-400 text-sm leading-relaxed mb-4 line-clamp-2">
                      {recaps.mois.extrait || recaps.mois.titre}
                    </p>
                    <div className="flex items-center justify-end">
                      <span className="flex items-center gap-1.5 text-xs font-medium text-purple-400 group-hover:text-purple-300 transition-colors">
                        Lire l&apos;article <FiArrowRight className="text-[10px] group-hover:translate-x-1 transition-transform" />
                      </span>
                    </div>
                  </div>
                </GlowCard>
              </Reveal>
            )}

            {recaps.nouvelles && (
              <Reveal delay={300}>
                <GlowCard
                  href={`/actualites/${recaps.nouvelles.slug}`}
                  glow="rgba(34,197,94,0.08)"
                  className="block rounded-2xl overflow-hidden border border-gray-800 hover:border-green-500/30 transition-all h-full"
                >
                  <div className="p-5">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-9 h-9 rounded-lg bg-green-500/15 flex items-center justify-center">
                        <FiPlusCircle className="text-green-400" />
                      </div>
                      <div>
                        <p className="text-xs font-bold uppercase tracking-widest text-green-400">Nouvelles oeuvres</p>
                        <p className="text-[11px] text-gray-500">{formatDate(recaps.nouvelles.publishedAt)}</p>
                      </div>
                    </div>
                    <p className="text-gray-400 text-sm leading-relaxed mb-4 line-clamp-2">
                      {recaps.nouvelles.extrait || recaps.nouvelles.titre}
                    </p>
                    <div className="flex items-center justify-end">
                      <span className="flex items-center gap-1.5 text-xs font-medium text-green-400 group-hover:text-green-300 transition-colors">
                        Voir l&apos;article <FiArrowRight className="text-[10px] group-hover:translate-x-1 transition-transform" />
                      </span>
                    </div>
                  </div>
                </GlowCard>
              </Reveal>
            )}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          TEXTE TRANSITION
          ═══════════════════════════════════════ */}
      {rssItems.length > 0 && (
        <section className="bg-gray-900 border-t border-gray-800/40">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Reveal>
              <p className="text-gray-400 leading-relaxed">
                On relaie aussi l&apos;actualité manga, anime et novel depuis d&apos;autres sites francophones. Ces articles sont identifiés par le badge <span className="inline-flex items-center gap-1 text-orange-400 text-xs font-semibold"><FiExternalLink className="text-[10px]" /> Lien externe</span> et s&apos;ouvrent dans un nouvel onglet — vous restez informé sans quitter Novel-Index.
              </p>
            </Reveal>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════
          ARTICLE À LA UNE
          ═══════════════════════════════════════ */}
      {featured && (
        <section className="bg-gray-900 py-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Reveal>
              <GlowCard
                href={`/actualites/${featured.slug}`}
                glow="rgba(99,102,241,0.08)"
                className="block rounded-2xl overflow-hidden border border-gray-800 hover:border-indigo-500/30 transition-all"
              >
                <div className="flex flex-col lg:flex-row">
                  <div className="relative w-full lg:w-1/2 h-56 sm:h-64 lg:h-auto lg:min-h-[320px] overflow-hidden">
                    {coverUrl(featured.couverture?.url) ? (
                      <Image src={coverUrl(featured.couverture.url)} alt={featured.titre} fill className="object-cover group-hover:scale-105 transition-transform duration-700" />
                    ) : getSystemCover(featured.slug) ? (
                      <Image src={getSystemCover(featured.slug)} alt={featured.titre} fill className="object-cover group-hover:scale-105 transition-transform duration-700" />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/40 to-purple-900/40" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent to-gray-900/30 hidden lg:block" />
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-900/60 to-transparent lg:hidden" />
                    <div className="absolute top-4 left-4">
                      <span className="inline-flex items-center gap-1.5 bg-indigo-600 text-white text-[11px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full shadow-lg shadow-indigo-600/20">
                        <FiStar className="text-xs" /> À la une
                      </span>
                    </div>
                  </div>

                  <div className="flex-1 p-6 sm:p-8 lg:p-10 flex flex-col justify-center bg-gray-900/80">
                    {featured.categorie && (
                      <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider px-3 py-1 rounded-full w-fit mb-4 border ${CAT_COLORS[featured.categorie] || CAT_COLORS.actualite}`}>
                        {CAT_LABELS[featured.categorie] || featured.categorie}
                      </span>
                    )}
                    <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3 leading-tight group-hover:text-indigo-300 transition-colors">
                      {featured.titre}
                    </h2>
                    {featured.extrait && (
                      <p className="text-gray-400 leading-relaxed mb-5 line-clamp-3">{featured.extrait}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1.5"><FiCalendar className="text-xs" /> {formatDate(featured.publishedAt)}</span>
                      {featured.auteur?.username && (
                        <span className="flex items-center gap-1.5"><FiUser className="text-xs" /> {featured.auteur.username}</span>
                      )}
                    </div>
                  </div>
                </div>
              </GlowCard>
            </Reveal>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════
          FILTRES STICKY
          ═══════════════════════════════════════ */}
      <div ref={filtersRef} className="bg-gray-900 border-t border-gray-800/40 pt-6">
        <div className={`${filtersSticky ? "fixed top-14 left-0 right-0 z-40 bg-gray-900/95 backdrop-blur-md border-b border-gray-800/60 shadow-lg shadow-black/20" : ""} transition-all`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center gap-3">
              <h2 className="text-sm font-bold text-white shrink-0">Articles</h2>
              <div className="w-px h-5 bg-gray-800" />
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  onClick={() => handleCategorie("")}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${!categorie ? "bg-indigo-600 text-white" : "text-gray-500 hover:text-white hover:bg-gray-800/60"}`}
                >Toutes</button>
                {CATEGORIES_KEYS.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => handleCategorie(cat)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${categorie === cat ? "bg-indigo-600 text-white" : "text-gray-500 hover:text-white hover:bg-gray-800/60"}`}
                  >{CAT_LABELS[cat]}</button>
                ))}
                {rssItems.length > 0 && (
                  <button
                    onClick={() => handleCategorie("externe")}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${categorie === "externe" ? "bg-orange-600 text-white" : "text-gray-500 hover:text-white hover:bg-gray-800/60"}`}
                  >Lien externe</button>
                )}
              </div>
              {categorie && (
                <button onClick={() => handleCategorie("")} className="text-gray-600 hover:text-white transition-colors ml-1">
                  <FiX className="text-sm" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════
          GRILLE ARTICLES
          ═══════════════════════════════════════ */}
      <section className="bg-gray-900 pt-4 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="flex justify-center py-20">
              <FiLoader className="text-3xl text-indigo-400 animate-spin" />
            </div>
          ) : displayItems.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-gray-500 text-lg">Aucun article dans cette catégorie.</p>
              <button onClick={() => handleCategorie("")} className="mt-3 text-sm text-indigo-400 hover:text-indigo-300 transition-colors">
                Voir toutes les actualités
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {displayItems.map((art, i) => (
                <Reveal key={art.slug || art.url || art.documentId || i} delay={i * 70}>
                  {art.externe ? (
                    /* ── CARD EXTERNE (RSS) ── */
                    <a
                      href={art.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group block rounded-xl overflow-hidden border border-orange-500/15 hover:border-orange-500/40 transition-all h-full bg-gray-900/80"
                    >
                      {art.cover && (
                        <div className="relative w-full h-40 overflow-hidden">
                          <img src={art.cover} alt={art.titre} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          <div className="absolute inset-0 bg-gradient-to-t from-gray-900/60 to-transparent" />
                          <div className="absolute top-2.5 left-2.5">
                            <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border text-orange-400 bg-orange-500/10 border-orange-500/20 backdrop-blur-sm">
                              <FiExternalLink className="text-[9px]" /> Lien externe
                            </span>
                          </div>
                          {art.source && (
                            <div className="absolute top-2.5 right-2.5">
                              <span className="text-[10px] text-gray-300 bg-black/40 backdrop-blur-sm px-2 py-0.5 rounded-full">{art.source}</span>
                            </div>
                          )}
                        </div>
                      )}
                      <div className="p-4 flex flex-col">
                        {!art.cover && (
                          <div className="flex items-center justify-between mb-3">
                            <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border text-orange-400 bg-orange-500/10 border-orange-500/20">
                              <FiExternalLink className="text-[9px]" /> Lien externe
                            </span>
                            {art.source && <span className="text-[10px] text-gray-600">{art.source}</span>}
                          </div>
                        )}
                        <h3 className="text-sm text-white font-semibold leading-snug group-hover:text-orange-300 transition-colors line-clamp-2 mb-1.5">
                          {art.titre}
                        </h3>
                        {art.extrait && <p className="text-xs text-gray-500 line-clamp-2 mb-2.5">{art.extrait}</p>}
                        <div className="flex items-center justify-between mt-auto">
                          <div className="flex items-center gap-3 text-[11px] text-gray-600">
                            {art.date && <span className="flex items-center gap-1"><FiCalendar className="text-[9px]" /> {art.date}</span>}
                            {art.auteur && <span className="flex items-center gap-1"><FiUser className="text-[9px]" /> {art.auteur}</span>}
                          </div>
                          <span className="flex items-center gap-1.5 text-xs text-orange-400 group-hover:text-orange-300 transition-colors shrink-0">
                            Lire <FiExternalLink className="text-[10px]" />
                          </span>
                        </div>
                      </div>
                    </a>
                  ) : (
                    /* ── CARD INTERNE (Article Strapi) ── */
                    <GlowCard href={`/actualites/${art.slug}`} className="block rounded-xl overflow-hidden border border-gray-800/50 hover:border-indigo-500/30 transition-all h-full">
                      <div className="relative w-full h-40 overflow-hidden">
                        {coverUrl(art.couverture?.url) ? (
                          <Image src={coverUrl(art.couverture.url)} alt={art.titre} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                        ) : getSystemCover(art.slug) ? (
                          <Image src={getSystemCover(art.slug)} alt={art.titre} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900" />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-gray-900/60 to-transparent" />
                        {art.categorie && (
                          <div className="absolute top-2.5 left-2.5">
                            <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border ${CAT_COLORS[art.categorie] || CAT_COLORS.actualite}`}>
                              {CAT_LABELS[art.categorie] || art.categorie}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="p-4 bg-gray-900/80">
                        <h3 className="text-sm text-white font-semibold leading-snug group-hover:text-indigo-300 transition-colors line-clamp-2 mb-1.5">
                          {art.titre}
                        </h3>
                        {art.extrait && <p className="text-xs text-gray-500 line-clamp-2 mb-2.5">{art.extrait}</p>}
                        <div className="flex items-center gap-3 text-[11px] text-gray-600">
                          <span className="flex items-center gap-1"><FiCalendar className="text-[9px]" /> {formatDate(art.publishedAt)}</span>
                          {art.auteur?.username && <span className="flex items-center gap-1"><FiUser className="text-[9px]" /> {art.auteur.username}</span>}
                        </div>
                      </div>
                    </GlowCard>
                  )}
                </Reveal>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ═══════════════════════════════════════
          BLOC SEO + CTA + PAGINATION
          ═══════════════════════════════════════ */}
      <section className="bg-gray-950 border-t border-gray-800/40 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <Reveal>
            <div className="max-w-4xl mb-10">
              <h2 className="text-lg font-bold text-white mb-3">Toute l&apos;actu des traductions françaises au même endroit</h2>
              <div className="space-y-3 text-sm text-gray-500 leading-relaxed">
                <p>
                  Novel-Index centralise <strong className="text-gray-300">toutes les sorties de chapitres traduits en français</strong> — web novels chinois, light novels japonais, manhwa coréens et webtoons. Le système référence automatiquement les publications des teams de traduction actives pour que vous n&apos;ayez plus à chercher sur des dizaines de sites différents.
                </p>
                <p>
                  Les récapitulatifs quotidiens, hebdomadaires et mensuels sont générés à partir des données réelles de la plateforme. L&apos;actualité externe (sorties manga, adaptations anime, événements) est agrégée depuis des sources francophones pour <strong className="text-gray-300">tout regrouper sur une seule page</strong>.
                </p>
              </div>
            </div>
          </Reveal>

          <Reveal>
            <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-indigo-600/10 to-purple-600/5 border border-indigo-500/20 mb-10">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
                <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 flex items-center justify-center shrink-0">
                  <FiBell className="text-xl text-indigo-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-white mb-1">Ne ratez aucun chapitre</h3>
                  <p className="text-sm text-gray-400">
                    Abonnez-vous à vos séries pour être notifié à chaque nouveau chapitre traduit. Gratuit et instantané.
                  </p>
                </div>
                <Link href="/Inscription" className="shrink-0 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-all hover:shadow-lg hover:shadow-indigo-600/20 hover:-translate-y-0.5">
                  Créer un compte
                </Link>
              </div>
            </div>
          </Reveal>

          {/* Pagination */}
          {pagination.pageCount > 1 && categorie !== "externe" && (
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => pagination.page > 1 && loadPage(pagination.page - 1, categorie)}
                disabled={pagination.page <= 1}
                className={`flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${pagination.page <= 1 ? "bg-gray-800/60 border border-gray-700 text-gray-500 opacity-40 cursor-not-allowed" : "bg-gray-800/60 border border-gray-700 text-gray-300 hover:text-white hover:border-indigo-500"}`}
              >
                <FiChevronLeft /> Préc.
              </button>
              {Array.from({ length: Math.min(pagination.pageCount, 7) }, (_, i) => {
                const p = i + 1;
                return (
                  <button
                    key={p}
                    onClick={() => loadPage(p, categorie)}
                    className={`w-9 h-9 rounded-lg text-sm font-medium transition-all ${p === pagination.page ? "bg-indigo-600 text-white" : "bg-gray-800/60 border border-gray-700 text-gray-400 hover:text-white hover:border-indigo-500/50"}`}
                  >{p}</button>
                );
              })}
              <button
                onClick={() => pagination.page < pagination.pageCount && loadPage(pagination.page + 1, categorie)}
                disabled={pagination.page >= pagination.pageCount}
                className={`flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${pagination.page >= pagination.pageCount ? "bg-gray-800/60 border border-gray-700 text-gray-500 opacity-40 cursor-not-allowed" : "bg-gray-800/60 border border-gray-700 text-gray-300 hover:text-white hover:border-indigo-500"}`}
              >
                Suiv. <FiChevronRight />
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
