import CatalogueClient from "./CatalogueClient";
import Image from "next/image";
import Link from "next/link";
import {
  FiHome,
  FiChevronRight,
  FiGrid,
  FiTag,
  FiCompass,
  FiHash,
  FiUser,
  FiUsers,
  FiFileText,
  FiArrowRight,
  FiCheckCircle,
  FiBook,
  FiZap,
  FiAlertTriangle,
  FiHeart,
} from "react-icons/fi";
import CoverBackground from "@/app/components/CoverBackground";
import JsonLd from "@/app/components/JsonLd";
import TaxonomyChip from "@/app/components/TaxonomyChip";
import { slugify } from "@/utils/slugify";
import { auteurSlug } from "@/utils/auteurSlug";

const SITE_URL = "https://www.novel-index.com";
const PAGE_SIZE = 12;

// Section A — Carrousels par genre populaire (top 4, basés sur les counts réels)
const SHOWCASE_GENRES = [
  { titre: "Fantastique", accent: "cyan" },
  { titre: "Aventure", accent: "cyan" },
  { titre: "Action", accent: "cyan" },
  { titre: "Drame", accent: "cyan" },
];

// Section B — 4 univers thématiques préfabriqués (combinaisons tags/genres)
const UNIVERS = [
  {
    slug: "cultivation-wuxia",
    titre: "Cultivation & Wuxia",
    description: "Arts martiaux, qi, immortalité — le souffle des romans chinois",
    accent: "amber", // amber-500 / orange-600
    filterType: "genres",
    filterValues: ["Wuxia", "Xianxia", "Arts Martiaux"],
    cta: { type: "genre", slug: "wuxia", label: "Découvrir" },
  },
  {
    slug: "isekai-renaissance",
    titre: "Isekai & Renaissance",
    description: "Transportés dans un autre monde, réincarnés, doués d'une seconde chance",
    accent: "violet",
    filterType: "tags",
    filterValues: ["Transporté dans un autre monde", "Réincarné dans un autre monde"],
    cta: { type: "tag", slug: "transporte-dans-un-autre-monde", label: "Découvrir" },
  },
  {
    slug: "apocalypse-survie",
    titre: "Apocalypse & Survie",
    description: "Mondes ravagés, chasseurs, monstres — le quotidien après la fin",
    accent: "red",
    filterType: "tags",
    filterValues: ["Apocalypse"],
    cta: { type: "tag", slug: "apocalypse", label: "Découvrir" },
  },
  {
    slug: "romance-academie",
    titre: "Romance & Académie",
    description: "Premiers émois, amitiés d'enfance, années lycée et fac",
    accent: "fuchsia",
    filterType: "tags",
    filterValues: ["Académie", "Ami d'enfance"],
    cta: { type: "tag", slug: "academie", label: "Découvrir" },
  },
];

async function fetchSSR(url) {
  try {
    const res = await fetch(url, { next: { revalidate: 1800 } });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata({ searchParams }) {
  const sp = await searchParams;
  const rawPage = parseInt(sp?.page);
  const currentPage = !isNaN(rawPage) && rawPage > 1 ? rawPage : 1;
  const canonical =
    currentPage === 1
      ? `${SITE_URL}/Oeuvres`
      : `${SITE_URL}/Oeuvres?page=${currentPage}`;
  return {
    alternates: { canonical },
    // Pagination signals — Google ignore officiellement rel=prev/next mais Bing
    // les utilise toujours, et ils servent aussi à clarifier la structure.
    other: {
      ...(currentPage > 1 && {
        "page-prev":
          currentPage === 2
            ? `${SITE_URL}/Oeuvres`
            : `${SITE_URL}/Oeuvres?page=${currentPage - 1}`,
      }),
    },
  };
}

export default async function OeuvresPage({ searchParams }) {
  const sp = await searchParams;
  const rawPage = parseInt(sp?.page);
  const initialPage = !isNaN(rawPage) && rawPage > 1 ? rawPage - 1 : 0;
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const start = initialPage * PAGE_SIZE;
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

  // Helper pour construire les filtres $in (encodage URL des valeurs)
  const buildInFilter = (relation, values) =>
    values
      .map((v, i) => `filters[${relation}][titre][$in][${i}]=${encodeURIComponent(v)}`)
      .join("&");

  // SSR: toutes les données en parallèle
  const [
    oeuvresRes,
    featuredRes,
    dernieresMajRes,
    nouveautesRes,
    chapitresRes,
    teamsCountRes,
    genresRes,
    tagsRes,
    auteursAggRes,
    teamsListRes,
    articlesRes,
    ...showcaseAndUniversRes
  ] = await Promise.all([
    fetchSSR(`${apiUrl}/api/oeuvres?populate[couverture][fields][0]=url&populate[genres][fields][0]=titre&pagination[start]=${start}&pagination[limit]=${PAGE_SIZE}`),
    fetchSSR(`${apiUrl}/api/oeuvres?populate[0]=couverture&populate[1]=genres&pagination[limit]=10&filters[couverture][url][$notNull]=true`),
    fetchSSR(`${apiUrl}/api/oeuvres?populate=couverture&sort=updatedAt:desc&pagination[limit]=6`),
    fetchSSR(`${apiUrl}/api/oeuvres?populate=couverture&sort=createdAt:desc&pagination[limit]=6&filters[createdAt][$gte]=${monthStart}`),
    fetchSSR(`${apiUrl}/api/chapitres?pagination[limit]=1`),
    fetchSSR(`${apiUrl}/api/teams?pagination[limit]=1`),
    fetchSSR(`${apiUrl}/api/genres?populate[oeuvres][fields][0]=id&pagination[limit]=100&fields[0]=titre`),
    fetchSSR(`${apiUrl}/api/tags?populate[oeuvres][fields][0]=id&pagination[limit]=200&fields[0]=titre`),
    // Sprint 2: agrégation auteurs (juste le champ, on agrège côté serveur)
    fetchSSR(`${apiUrl}/api/oeuvres?fields[0]=auteur&pagination[limit]=200`),
    // Sprint 2: teams actives avec leurs œuvres pour scoring
    fetchSSR(`${apiUrl}/api/teams?populate[couverture][fields][0]=url&populate[oeuvres][fields][0]=updatedAt&fields[0]=titre&fields[1]=documentId&fields[2]=etat&pagination[limit]=200`),
    // Sprint 2: derniers articles publiés
    fetchSSR(`${apiUrl}/api/articles?populate[couverture][fields][0]=url&fields[0]=titre&fields[1]=slug&fields[2]=publishedAt&fields[3]=extrait&sort=publishedAt:desc&pagination[limit]=4`),
    // Sprint A : top 4 genres × 8 œuvres récentes — pour les carrousels par genre
    ...SHOWCASE_GENRES.map((g) =>
      fetchSSR(
        `${apiUrl}/api/oeuvres?filters[genres][titre][$eq]=${encodeURIComponent(g.titre)}` +
        `&sort=updatedAt:desc&pagination[limit]=8` +
        `&populate[couverture][fields][0]=url` +
        `&populate[genres][fields][0]=titre` +
        `&fields[0]=titre&fields[1]=documentId&fields[2]=type&fields[3]=etat&fields[4]=auteur&fields[5]=updatedAt`
      )
    ),
    // Sprint B : 4 univers × 4 œuvres — pour les cards thématiques
    ...UNIVERS.map((u) =>
      fetchSSR(
        `${apiUrl}/api/oeuvres?${buildInFilter(u.filterType, u.filterValues)}` +
        `&sort=updatedAt:desc&pagination[limit]=4` +
        `&populate[couverture][fields][0]=url` +
        `&fields[0]=titre&fields[1]=documentId`
      )
    ),
  ]);

  // Agrégation Sprint A — pairer chaque genre avec ses 8 œuvres
  const showcaseGenres = SHOWCASE_GENRES.map((g, i) => {
    const res = showcaseAndUniversRes[i];
    return {
      ...g,
      oeuvres: res?.data || [],
      total: res?.meta?.pagination?.total || 0,
    };
  }).filter((g) => g.oeuvres.length > 0);

  // Agrégation Sprint B — pairer chaque univers avec ses 4 œuvres + total
  const universCards = UNIVERS.map((u, i) => {
    const res = showcaseAndUniversRes[SHOWCASE_GENRES.length + i];
    return {
      ...u,
      oeuvres: res?.data || [],
      total: res?.meta?.pagination?.total || 0,
    };
  }).filter((u) => u.oeuvres.length > 0);

  // Dédoublonne par titre (la base contient parfois des doublons éditoriaux,
  // ex. 2 tags "Nobles" id 114 + id 224 → on additionne leurs counts).
  const aggregateByTitre = (rows) => {
    const m = new Map();
    for (const r of rows) {
      if (!r?.titre) continue;
      const count = (r.oeuvres || []).length;
      if (count === 0) continue;
      const prev = m.get(r.titre);
      m.set(r.titre, prev ? prev + count : count);
    }
    return [...m.entries()].map(([titre, count]) => ({ titre, count }));
  };

  // Top genres par nombre d'œuvres (dédoublonnés par titre)
  const topGenres = aggregateByTitre(genresRes?.data || [])
    .sort((a, b) => b.count - a.count)
    .slice(0, 16);

  // Tags populaires (top 30, dédoublonnés)
  const topTags = aggregateByTitre(tagsRes?.data || [])
    .sort((a, b) => b.count - a.count)
    .slice(0, 30);

  // Top auteurs — agrégation depuis le champ string `auteur` des œuvres
  const auteurCounts = new Map();
  for (const o of auteursAggRes?.data || []) {
    const a = (o.auteur || "").trim();
    if (!a) continue;
    auteurCounts.set(a, (auteurCounts.get(a) || 0) + 1);
  }
  const topAuteurs = [...auteurCounts.entries()]
    .map(([titre, count]) => ({ titre, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 12);

  // Top teams — actives + tri par nombre d'œuvres + activité récente
  const topTeams = (teamsListRes?.data || [])
    .filter((t) => t.titre && t.documentId && t.etat === true)
    .map((t) => {
      const oeuvresList = t.oeuvres || [];
      const dates = oeuvresList.map((o) => o.updatedAt).filter(Boolean);
      const lastActive = dates.length
        ? Math.max(...dates.map((d) => new Date(d).getTime()))
        : 0;
      return {
        titre: t.titre,
        documentId: t.documentId,
        coverUrl: t.couverture?.url || null,
        oeuvresCount: oeuvresList.length,
        lastActive,
      };
    })
    // Score : nb œuvres pondéré + bonus activité récente
    .sort((a, b) => b.oeuvresCount - a.oeuvresCount || b.lastActive - a.lastActive)
    .slice(0, 8);

  // Articles récents
  const recentArticles = (articlesRes?.data || [])
    .filter((a) => a.titre && a.slug)
    .slice(0, 4);

  const initialOeuvres = oeuvresRes?.data || [];
  const initialTotal = oeuvresRes?.meta?.pagination?.total || 0;
  const totalPages = Math.max(1, Math.ceil(initialTotal / PAGE_SIZE));
  const currentPage = initialPage + 1;

  const featuredCandidates = (featuredRes?.data || []).filter(
    (o) => o.couverture?.url && o.synopsis,
  );

  // Shuffle déterministe par jour — même algo que CatalogueClient avant refactor.
  // Permet d'avoir la sélection rendue côté SERVEUR (indexable Googlebot) tout
  // en variant chaque jour. Le client peut toujours override via localStorage admin.
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 1)) /
      (24 * 60 * 60 * 1000),
  );
  const initialFeatured = [...featuredCandidates]
    .sort((a, b) => {
      const hashA = (a.documentId.charCodeAt(0) + dayOfYear) % 100;
      const hashB = (b.documentId.charCodeAt(0) + dayOfYear) % 100;
      return hashA - hashB;
    })
    .slice(0, 5);

  const initialExtras = {
    featuredCandidates,
    initialFeatured,
    dernieresMaj: dernieresMajRes?.data || [],
    nouveautes: nouveautesRes?.data || [],
    stats: {
      chapitres: chapitresRes?.meta?.pagination?.total || 0,
      teams: teamsCountRes?.meta?.pagination?.total || 0,
    },
  };

  // JSON-LD dynamique avec les vraies données SSR
  const collectionPageJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name:
      currentPage === 1
        ? "Catalogue des œuvres - Novel-Index"
        : `Catalogue des œuvres - Page ${currentPage} - Novel-Index`,
    description:
      "Catalogue complet des œuvres indexées sur Novel-Index : webnovels, light novels, manhwa, manga et plus encore, classés par genre, langue et statut.",
    url:
      currentPage === 1
        ? `${SITE_URL}/Oeuvres`
        : `${SITE_URL}/Oeuvres?page=${currentPage}`,
    inLanguage: "fr-FR",
    isPartOf: {
      "@type": "WebSite",
      name: "Novel-Index",
      url: SITE_URL,
    },
    mainEntity: {
      "@type": "ItemList",
      name: "Œuvres indexées",
      description:
        "Liste des webnovels, light novels, manhwa et manga traduits en français",
      itemListOrder: "https://schema.org/ItemListOrderDescending",
      numberOfItems: initialTotal,
      itemListElement: initialOeuvres.map((o, i) => ({
        "@type": "ListItem",
        position: start + i + 1,
        url: `${SITE_URL}/oeuvre/${o.documentId}-${slugify(o.titre || "")}`,
        name: o.titre,
      })),
    },
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Accueil",
          item: SITE_URL,
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Catalogue des œuvres",
          item: `${SITE_URL}/Oeuvres`,
        },
      ],
    },
  };

  return (
    <div className="relative bg-gray-900 text-white min-h-screen">
      <JsonLd data={collectionPageJsonLd} />

      {/* Background hero — positionné depuis le vrai top de la page */}
      <div className="absolute inset-x-0 top-0 h-[700px] overflow-hidden pointer-events-none">
        <CoverBackground />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-transparent z-[5]" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-gray-900/20 to-gray-900/60 z-[6]" />
        <div className="absolute bottom-0 left-0 right-0 h-96 bg-gradient-to-t from-gray-900 via-gray-900/95 to-transparent z-[7]" />
      </div>

      {/* S7: Breadcrumb visible (SSR) */}
      <nav
        aria-label="Fil d'Ariane"
        className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-2"
      >
        <ol className="flex items-center gap-2 text-sm text-gray-400">
          <li>
            <Link
              href="/"
              className="hover:text-white transition-colors flex items-center gap-1"
            >
              <FiHome className="text-xs" /> Accueil
            </Link>
          </li>
          <li>
            <FiChevronRight className="text-xs" />
          </li>
          <li className="text-white font-medium">Catalogue des œuvres</li>
        </ol>
      </nav>

      {/* S1: Titre principal rendu côté serveur pour le SEO */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 text-center pt-4 pb-2">
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white flex items-center justify-center gap-3">
          <FiGrid className="text-indigo-400" />
          Catalogue de webnovels, light novels & manhwa
        </h1>
        <p className="text-gray-300 text-sm md:text-base max-w-xl mx-auto mt-3">
          Explorez notre collection de {initialTotal.toLocaleString()} œuvres
          traduites en français : webnovels, light novels, manhwa, manga
          et plus encore.
        </p>
      </div>

      <CatalogueClient
        initialOeuvres={initialOeuvres}
        initialTotal={initialTotal}
        initialPage={initialPage}
        initialExtras={initialExtras}
        totalPages={totalPages}
      />

      {/* ═══ Sprint A — Top par genre populaire (carrousels horizontaux) ═══
          Pour chaque genre populaire (top 4), une rangée de 8 œuvres triées par
          mise à jour récente. Tout SSR donc Googlebot voit toutes les œuvres
          regroupées par genre = signal sémantique fort pour le maillage interne. */}
      {showcaseGenres.length > 0 && (
        <section
          className="relative py-16 px-4 sm:px-6 lg:px-8 overflow-hidden"
          aria-labelledby="showcase-genres-heading"
        >
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-cyan-600/[0.025] rounded-full blur-[120px] pointer-events-none" />

          <div className="max-w-7xl mx-auto relative">
            <div className="flex items-center justify-between mb-2">
              <h2
                id="showcase-genres-heading"
                className="text-3xl sm:text-4xl font-black text-white tracking-tight"
              >
                Top par genre
              </h2>
              <Link
                href="/tags-genres/genre"
                className="hidden sm:flex items-center gap-1.5 text-cyan-400/60 hover:text-cyan-300 text-sm font-medium transition-colors"
              >
                Tous les genres <FiArrowRight className="text-xs" />
              </Link>
            </div>
            <p className="text-white/35 mb-10 max-w-2xl">
              Découvrez les œuvres les plus récemment mises à jour dans chaque
              grand genre du catalogue.
            </p>

            <div className="space-y-12">
              {showcaseGenres.map((genre) => (
                <div key={genre.titre}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-white/80 flex items-center gap-2">
                      <div className="w-1 h-5 rounded-full bg-gradient-to-b from-cyan-400 to-sky-500" />
                      {genre.titre}
                      <span className="bg-cyan-500/15 text-cyan-300 px-2.5 py-0.5 rounded-full text-xs font-bold border border-cyan-500/20 ml-1">
                        {genre.total}
                      </span>
                    </h3>
                    <Link
                      href={`/tags-genres/genre/${slugify(genre.titre)}`}
                      className="text-cyan-400/70 hover:text-cyan-300 text-sm font-medium transition-colors flex items-center gap-1.5"
                    >
                      Voir tout <FiArrowRight className="text-xs" />
                    </Link>
                  </div>

                  {/* Rangée scrollable horizontale (scroll-snap, scrollbar masquée) */}
                  <div className="scrollbar-hide flex gap-3 overflow-x-auto pb-3 -mx-4 px-4 sm:mx-0 sm:px-0 snap-x snap-mandatory scroll-smooth">
                    {genre.oeuvres.map((o) => {
                      const cover = o.couverture?.url;
                      const url = `/oeuvre/${o.documentId}-${slugify(o.titre || "")}`;
                      return (
                        <Link
                          key={o.documentId}
                          href={url}
                          className="group relative flex-shrink-0 w-[140px] sm:w-[160px] snap-start"
                          title={o.titre}
                        >
                          <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-white/[0.04] border border-white/[0.06] group-hover:border-cyan-500/30 transition-all duration-300">
                            {cover ? (
                              <Image
                                src={cover}
                                alt={o.titre}
                                fill
                                sizes="160px"
                                className="object-cover group-hover:scale-105 transition-transform duration-500"
                              />
                            ) : (
                              <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                                <FiBook className="text-2xl text-white/10" />
                              </div>
                            )}
                            {o.type && (
                              <span className="absolute top-2 left-2 bg-black/70 backdrop-blur-sm text-white/80 text-[10px] font-semibold px-2 py-0.5 rounded-md">
                                {o.type}
                              </span>
                            )}
                          </div>
                          <p className="mt-2 text-sm text-white/80 font-medium line-clamp-2 group-hover:text-cyan-200 transition-colors">
                            {o.titre}
                          </p>
                          {o.auteur && (
                            <p className="text-xs text-white/35 truncate mt-0.5">
                              {o.auteur}
                            </p>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ═══ Sprint B — Univers à découvrir (4 cards thématiques) ═══
          Mappings tag/genre éditoriaux. Chaque card = un univers éditorial avec
          mini-couvertures empilées + CTA vers la page genre/tag correspondante. */}
      {universCards.length > 0 && (
        <section
          className="relative py-16 px-4 sm:px-6 lg:px-8 overflow-hidden"
          aria-labelledby="univers-heading"
        >
          <div className="absolute top-0 left-0 w-[400px] h-[400px] bg-amber-600/[0.02] rounded-full blur-[120px] pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-[400px] h-[300px] bg-violet-600/[0.02] rounded-full blur-[120px] pointer-events-none" />

          <div className="max-w-7xl mx-auto relative">
            <h2
              id="univers-heading"
              className="text-3xl sm:text-4xl font-black text-white mb-3 text-center tracking-tight"
            >
              Plongez dans un univers
            </h2>
            <p className="text-white/35 text-center mb-12 max-w-2xl mx-auto">
              Quatre saveurs distinctes du catalogue. Choisissez votre prochaine
              aventure parmi des univers thématiques curated.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {universCards.map((u) => {
                const accentMap = {
                  amber: { glow: "from-amber-500/30 via-orange-500/15 to-amber-500/30", border: "group-hover:border-amber-500/30", text: "group-hover:text-amber-200", chipBg: "bg-amber-500/15 text-amber-300 border-amber-500/20", icon: "from-amber-500 to-orange-600", shadow: "shadow-amber-500/20" },
                  violet: { glow: "from-violet-500/30 via-purple-500/15 to-violet-500/30", border: "group-hover:border-violet-500/30", text: "group-hover:text-violet-200", chipBg: "bg-violet-500/15 text-violet-300 border-violet-500/20", icon: "from-violet-500 to-purple-600", shadow: "shadow-violet-500/20" },
                  red: { glow: "from-red-500/30 via-orange-500/15 to-red-500/30", border: "group-hover:border-red-500/30", text: "group-hover:text-red-200", chipBg: "bg-red-500/15 text-red-300 border-red-500/20", icon: "from-red-500 to-orange-600", shadow: "shadow-red-500/20" },
                  fuchsia: { glow: "from-fuchsia-500/30 via-pink-500/15 to-fuchsia-500/30", border: "group-hover:border-fuchsia-500/30", text: "group-hover:text-fuchsia-200", chipBg: "bg-fuchsia-500/15 text-fuchsia-300 border-fuchsia-500/20", icon: "from-fuchsia-500 to-pink-600", shadow: "shadow-fuchsia-500/20" },
                };
                const a = accentMap[u.accent] || accentMap.amber;
                const ctaHref = u.cta.type === "tag"
                  ? `/tags-genres/tag/${u.cta.slug}`
                  : `/tags-genres/genre/${u.cta.slug}`;
                const iconMap = {
                  "cultivation-wuxia": FiZap,
                  "isekai-renaissance": FiCompass,
                  "apocalypse-survie": FiAlertTriangle,
                  "romance-academie": FiHeart,
                };
                const Icon = iconMap[u.slug] || FiBook;

                return (
                  <Link
                    key={u.slug}
                    href={ctaHref}
                    className="group relative block"
                    title={`${u.total} œuvres dans cet univers`}
                  >
                    <div className={`absolute -inset-[1px] rounded-2xl bg-gradient-to-r ${a.glow.replace('/30', '/0').replace('/15', '/0').replace('/30', '/0')} group-hover:bg-gradient-to-r group-hover:${a.glow} transition-all duration-500`} style={{ background: `linear-gradient(to right, transparent, transparent, transparent)` }} />
                    <div className={`relative h-full flex flex-col bg-white/[0.02] border border-white/[0.06] ${a.border} rounded-2xl p-5 transition-all duration-300 overflow-hidden`}>
                      {/* Icône */}
                      <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${a.icon} flex items-center justify-center shadow-lg ${a.shadow} mb-4`}>
                        <Icon className="text-white text-lg" />
                      </div>

                      {/* Titre + description */}
                      <h3 className={`text-base font-black text-white mb-2 leading-tight transition-colors ${a.text}`}>
                        {u.titre}
                      </h3>
                      <p className="text-white/40 text-xs leading-relaxed mb-4 line-clamp-3 flex-1">
                        {u.description}
                      </p>

                      {/* Mini-couvertures empilées (max 4) */}
                      {u.oeuvres.length > 0 && (
                        <div className="flex -space-x-3 mb-4">
                          {u.oeuvres.slice(0, 4).map((o) => (
                            <div
                              key={o.documentId}
                              className="relative w-12 h-16 rounded-md overflow-hidden ring-2 ring-gray-900 bg-white/[0.04] flex-shrink-0"
                            >
                              {o.couverture?.url ? (
                                <Image
                                  src={o.couverture.url}
                                  alt={o.titre}
                                  fill
                                  sizes="48px"
                                  className="object-cover"
                                />
                              ) : (
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <FiBook className="text-white/20 text-xs" />
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Footer : count + CTA */}
                      <div className="flex items-center justify-between">
                        <span className={`${a.chipBg} border px-2.5 py-0.5 rounded-full text-xs font-bold`}>
                          {u.total} œuvres
                        </span>
                        <span className={`text-white/40 text-xs font-medium flex items-center gap-1 transition-colors ${a.text}`}>
                          {u.cta.label} <FiArrowRight className="text-[10px]" />
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ═══ Explorer par genre & tag — SSR pour SEO + maillage interne ═══ */}
      {(topGenres.length > 0 || topTags.length > 0) && (
        <section
          className="relative py-20 px-4 sm:px-6 lg:px-8 overflow-hidden"
          aria-labelledby="explore-heading"
        >
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-purple-600/[0.025] rounded-full blur-[120px] pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[300px] bg-indigo-600/[0.025] rounded-full blur-[120px] pointer-events-none" />

          <div className="max-w-6xl mx-auto relative">
            <h2
              id="explore-heading"
              className="text-3xl sm:text-4xl font-black text-white mb-3 text-center tracking-tight"
            >
              Explorez le catalogue
            </h2>
            <p className="text-white/35 text-center mb-12 max-w-2xl mx-auto">
              Trouvez votre prochaine lecture en parcourant nos genres et tags.
              Chaque univers regroupe des dizaines d&apos;œuvres traduites en français.
            </p>

            {/* ─── Genres ─── */}
            {topGenres.length > 0 && (
              <>
                <h3 className="text-lg font-bold text-white/70 mb-4 flex items-center gap-2">
                  <div className="w-1 h-5 rounded-full bg-gradient-to-b from-indigo-500 to-purple-600" />
                  Genres populaires
                </h3>
                <div className="flex flex-wrap gap-2 mb-12">
                  {topGenres.map((genre) => (
                    <TaxonomyChip
                      key={genre.titre}
                      type="genre"
                      label={genre.titre}
                      count={genre.count}
                      size="lg"
                    />
                  ))}
                </div>
                <div className="text-center -mt-6 mb-12">
                  <Link
                    href="/tags-genres/genre"
                    className="inline-flex items-center gap-2 text-indigo-400/70 hover:text-indigo-300 font-medium text-sm transition-colors"
                  >
                    Voir tous les genres <FiChevronRight />
                  </Link>
                </div>
              </>
            )}

            {/* ─── Tags ─── */}
            {topTags.length > 0 && (
              <>
                <h3 className="text-lg font-bold text-white/70 mb-4 flex items-center gap-2">
                  <div className="w-1 h-5 rounded-full bg-gradient-to-b from-pink-500 to-rose-600" />
                  Tags populaires
                </h3>
                <div className="flex flex-wrap gap-2 mb-6">
                  {topTags.map((tag) => (
                    <TaxonomyChip
                      key={tag.titre}
                      type="tag"
                      label={tag.titre}
                      count={tag.count}
                      size="md"
                      title={`${tag.count} œuvre${tag.count > 1 ? "s" : ""}`}
                    />
                  ))}
                </div>
                <div className="text-center mt-6">
                  <Link
                    href="/tags-genres/tag"
                    className="inline-flex items-center gap-2 text-pink-400/70 hover:text-pink-300 font-medium text-sm transition-colors"
                  >
                    Voir tous les tags <FiChevronRight />
                  </Link>
                </div>
              </>
            )}
          </div>
        </section>
      )}

      {/* ═══ Sprint 2 — Acteurs de l'écosystème : auteurs, teams, actualités ═══ */}
      {(topAuteurs.length > 0 || topTeams.length > 0 || recentArticles.length > 0) && (
        <section
          className="relative py-20 px-4 sm:px-6 lg:px-8 overflow-hidden"
          aria-labelledby="ecosystem-heading"
        >
          <div className="absolute top-0 left-0 w-[400px] h-[400px] bg-emerald-600/[0.025] rounded-full blur-[120px] pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-[400px] h-[300px] bg-amber-600/[0.025] rounded-full blur-[120px] pointer-events-none" />

          <div className="max-w-6xl mx-auto relative">
            <h2
              id="ecosystem-heading"
              className="text-3xl sm:text-4xl font-black text-white mb-3 text-center tracking-tight"
            >
              L&apos;écosystème Novel-Index
            </h2>
            <p className="text-white/35 text-center mb-12 max-w-2xl mx-auto">
              Derrière chaque œuvre traduite, des auteurs talentueux et des équipes
              de traduction passionnées. Suivez l&apos;actualité du catalogue.
            </p>

            {/* ─── Auteurs prolifiques ─── */}
            {topAuteurs.length > 0 && (
              <div className="mb-14">
                <h3 className="text-lg font-bold text-white/70 mb-4 flex items-center gap-2">
                  <div className="w-1 h-5 rounded-full bg-gradient-to-b from-emerald-500 to-teal-600" />
                  Auteurs prolifiques
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {topAuteurs.map((auteur) => (
                    <Link
                      key={auteur.titre}
                      href={`/auteur/${auteurSlug(auteur.titre)}`}
                      className="group flex items-center justify-between gap-3 bg-white/[0.025] hover:bg-white/[0.05] border border-white/[0.06] hover:border-emerald-500/30 rounded-xl px-4 py-3.5 transition-all duration-300"
                    >
                      <span className="flex items-center gap-2 min-w-0">
                        <FiUser className="text-emerald-400 flex-shrink-0 group-hover:scale-110 transition-transform duration-300" />
                        <span className="text-white/70 font-medium group-hover:text-white transition-colors truncate">
                          {auteur.titre}
                        </span>
                      </span>
                      <span className="bg-emerald-500/15 text-emerald-300 px-2 py-0.5 rounded-full text-xs font-bold border border-emerald-500/20 flex-shrink-0">
                        {auteur.count}
                      </span>
                    </Link>
                  ))}
                </div>
                <div className="text-center mt-6">
                  <Link
                    href="/auteur"
                    className="inline-flex items-center gap-2 text-emerald-400/70 hover:text-emerald-300 font-medium text-sm transition-colors"
                  >
                    Voir tous les auteurs <FiChevronRight />
                  </Link>
                </div>
              </div>
            )}

            {/* ─── Teams actives ─── */}
            {topTeams.length > 0 && (
              <div className="mb-14">
                <h3 className="text-lg font-bold text-white/70 mb-4 flex items-center gap-2">
                  <div className="w-1 h-5 rounded-full bg-gradient-to-b from-amber-500 to-orange-600" />
                  Équipes de traduction actives
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {topTeams.map((team) => (
                    <Link
                      key={team.documentId}
                      href={`/Teams/${team.documentId}-${slugify(team.titre)}`}
                      className="group flex items-center gap-3 bg-white/[0.025] hover:bg-white/[0.05] border border-white/[0.06] hover:border-amber-500/30 rounded-xl p-3 transition-all duration-300"
                    >
                      <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-white/[0.04] border border-white/[0.06] flex items-center justify-center">
                        {team.coverUrl ? (
                          <Image
                            src={team.coverUrl}
                            alt={`Logo ${team.titre}`}
                            width={48}
                            height={48}
                            className="object-cover w-full h-full"
                          />
                        ) : (
                          <FiUsers className="text-amber-400 text-lg" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white/80 font-medium text-sm group-hover:text-white transition-colors truncate flex items-center gap-1.5">
                          {team.titre}
                          <FiCheckCircle className="text-emerald-400 text-[11px] flex-shrink-0" title="Équipe active" />
                        </p>
                        <p className="text-white/40 text-xs">
                          {team.oeuvresCount} œuvre{team.oeuvresCount > 1 ? "s" : ""}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
                <div className="text-center mt-6">
                  <Link
                    href="/Teams"
                    className="inline-flex items-center gap-2 text-amber-400/70 hover:text-amber-300 font-medium text-sm transition-colors"
                  >
                    Voir toutes les équipes <FiChevronRight />
                  </Link>
                </div>
              </div>
            )}

            {/* ─── Actualités du catalogue ─── */}
            {recentArticles.length > 0 && (
              <div>
                <h3 className="text-lg font-bold text-white/70 mb-4 flex items-center gap-2">
                  <div className="w-1 h-5 rounded-full bg-gradient-to-b from-indigo-500 to-blue-600" />
                  Actualités du catalogue
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {recentArticles.map((article) => {
                    const desc = (article.extrait || "")
                      .replace(/<[^>]*>/g, "")
                      .replace(/\s+/g, " ")
                      .trim()
                      .slice(0, 90);
                    const date = article.publishedAt
                      ? new Date(article.publishedAt).toLocaleDateString("fr-FR", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })
                      : null;
                    return (
                      <Link
                        key={article.slug}
                        href={`/actualites/${article.slug}`}
                        className="group flex flex-col bg-white/[0.025] hover:bg-white/[0.05] border border-white/[0.06] hover:border-indigo-500/30 rounded-xl overflow-hidden transition-all duration-300"
                      >
                        <div className="relative aspect-[16/9] bg-white/[0.04] overflow-hidden">
                          {article.couverture?.url ? (
                            <Image
                              src={article.couverture.url}
                              alt={article.titre}
                              fill
                              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                              className="object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <FiFileText className="text-3xl text-white/20" />
                            </div>
                          )}
                        </div>
                        <div className="p-3 flex-1 flex flex-col">
                          {date && (
                            <p className="text-white/35 text-[11px] uppercase tracking-wider mb-1.5">
                              {date}
                            </p>
                          )}
                          <h4 className="text-white/85 font-semibold text-sm leading-snug mb-1.5 line-clamp-2 group-hover:text-indigo-300 transition-colors">
                            {article.titre}
                          </h4>
                          {desc && (
                            <p className="text-white/40 text-xs leading-relaxed line-clamp-2">
                              {desc}…
                            </p>
                          )}
                        </div>
                      </Link>
                    );
                  })}
                </div>
                <div className="text-center mt-6">
                  <Link
                    href="/actualites"
                    className="inline-flex items-center gap-2 text-indigo-400/70 hover:text-indigo-300 font-medium text-sm transition-colors"
                  >
                    Voir toutes les actualités <FiArrowRight />
                  </Link>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ═══ Sprint 3 — Bloc éditorial SEO : densification contenu + maillage longue traîne ═══ */}
      <section
        className="relative py-20 px-4 sm:px-6 lg:px-8 overflow-hidden"
        aria-labelledby="about-catalog-heading"
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-600/[0.02] rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-3xl mx-auto relative">
          <h2
            id="about-catalog-heading"
            className="text-3xl sm:text-4xl font-black text-white mb-8 text-center tracking-tight"
          >
            À propos du{" "}
            <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              catalogue Novel-Index
            </span>
          </h2>

          <div className="space-y-5 text-white/50 text-lg leading-relaxed">
            <p>
              Le catalogue de{" "}
              <Link href="/" className="text-indigo-400 hover:text-indigo-300 underline-offset-2 hover:underline transition-colors">
                Novel-Index
              </Link>{" "}
              regroupe l&apos;intégralité des œuvres asiatiques traduites en
              français par les{" "}
              <Link href="/Teams" className="text-indigo-400 hover:text-indigo-300 underline-offset-2 hover:underline transition-colors">
                équipes de traduction
              </Link>{" "}
              de la communauté : <strong className="text-white/80">webnovels</strong>{" "}
              chinois, coréens et japonais, <strong className="text-white/80">light novels</strong>,{" "}
              <strong className="text-white/80">manhwa</strong>,{" "}
              <strong className="text-white/80">manga</strong> et webtoons.
              {initialTotal > 0 && (
                <>
                  {" "}À ce jour, <strong className="text-white/80">{initialTotal.toLocaleString()} œuvres</strong>{" "}
                  sont indexées et accessibles ici.
                </>
              )}
            </p>

            <p>
              Un <strong className="text-indigo-400">webnovel</strong> est un
              roman publié en ligne directement par son auteur, le plus souvent
              chapitre par chapitre sur des plateformes asiatiques. Les{" "}
              <strong className="text-indigo-400">light novels</strong> sont des
              romans japonais courts, illustrés, souvent à l&apos;origine
              d&apos;adaptations en anime ou en manga. Un{" "}
              <strong className="text-indigo-400">manhwa</strong> désigne une
              bande dessinée coréenne, généralement publiée verticalement pour
              le format mobile, tandis qu&apos;un{" "}
              <strong className="text-indigo-400">manga</strong> est l&apos;équivalent
              japonais, traditionnellement lu de droite à gauche.
            </p>

            <p>
              Vous cherchez un univers précis ? Explorez nos genres les plus
              populaires comme{" "}
              <Link href="/tags-genres/genre/romance" className="text-pink-400 hover:text-pink-300 underline-offset-2 hover:underline transition-colors">
                romance
              </Link>
              ,{" "}
              <Link href="/tags-genres/genre/action" className="text-pink-400 hover:text-pink-300 underline-offset-2 hover:underline transition-colors">
                action
              </Link>
              ,{" "}
              <Link href="/tags-genres/genre/fantastique" className="text-pink-400 hover:text-pink-300 underline-offset-2 hover:underline transition-colors">
                fantastique
              </Link>{" "}
              ou{" "}
              <Link href="/tags-genres/genre/aventure" className="text-pink-400 hover:text-pink-300 underline-offset-2 hover:underline transition-colors">
                aventure
              </Link>
              , ou plongez dans des thématiques précises comme les œuvres
              taguées{" "}
              <Link href="/tags-genres/tag/transporte-dans-un-autre-monde" className="text-pink-400 hover:text-pink-300 underline-offset-2 hover:underline transition-colors">
                transporté dans un autre monde
              </Link>
              ,{" "}
              <Link href="/tags-genres/tag/magie" className="text-pink-400 hover:text-pink-300 underline-offset-2 hover:underline transition-colors">
                magie
              </Link>{" "}
              ou{" "}
              <Link href="/tags-genres/tag/arts-martiaux" className="text-pink-400 hover:text-pink-300 underline-offset-2 hover:underline transition-colors">
                arts martiaux
              </Link>
              . Vous pouvez aussi parcourir les œuvres{" "}
              <Link href="/auteur" className="text-emerald-400 hover:text-emerald-300 underline-offset-2 hover:underline transition-colors">
                par auteur
              </Link>
              .
            </p>

            <p>
              Novel-Index ne stocke aucun chapitre traduit : nous{" "}
              <strong className="text-white/80">redirigeons les lecteurs</strong>{" "}
              vers les sites des teams qui font le travail de traduction. Notre
              rôle est de centraliser, organiser et rendre découvrables ces
              traductions souvent éparpillées. Pour suivre les nouveautés,
              consultez nos{" "}
              <Link href="/actualites" className="text-indigo-400 hover:text-indigo-300 underline-offset-2 hover:underline transition-colors">
                actualités
              </Link>{" "}
              régulièrement mises à jour avec les sorties du jour, les bilans
              hebdomadaires et les nouvelles œuvres ajoutées au catalogue.
            </p>
          </div>
        </div>
      </section>

      {/* Pagination SSR crawlable — invisible (sr-only) car le client a sa propre UI,
          mais les <a href> permettent à Googlebot de découvrir toutes les pages.
          Sans ça, ~97% du catalogue est invisible aux crawlers via cette page. */}
      {totalPages > 1 && (
        <nav
          aria-label="Pagination du catalogue (crawl)"
          className="sr-only"
        >
          <ul>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <li key={p}>
                <a href={p === 1 ? "/Oeuvres" : `/Oeuvres?page=${p}`}>
                  Page {p}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </div>
  );
}
