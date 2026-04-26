import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { slugify } from "@/utils/slugify";
import { auteurSlug } from "@/utils/auteurSlug";
import CoverBackground from "@/app/components/CoverBackground";
import TaxonomyChip from "@/app/components/TaxonomyChip";
import TeamCatalogClient from "./TeamCatalogClient";
import ShareTeamButton from "./ShareTeamButton";
import {
  FiUsers,
  FiBook,
  FiExternalLink,
  FiArrowLeft,
  FiCheckCircle,
  FiClock,
  FiGlobe,
  FiMail,
  FiMessageCircle,
  FiCalendar,
  FiUser,
  FiHome,
  FiChevronRight,
  FiHelpCircle,
  FiLayers,
  FiTrendingUp,
  FiTag,
  FiRss,
  FiAward,
  FiZap,
} from "react-icons/fi";
import {
  FaDiscord,
  FaTwitter,
  FaFacebook,
  FaInstagram,
  FaPatreon,
  FaTiktok,
  FaYoutube,
} from "react-icons/fa";

const STRAPI = process.env.NEXT_PUBLIC_API_URL;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.novel-index.com";

export const revalidate = 3600;

// SSG des top teams au build
export async function generateStaticParams() {
  try {
    const res = await fetch(
      `${STRAPI}/api/teams` +
        `?populate[oeuvres][fields][0]=id` +
        `&filters[etat][$eq]=true` +
        `&pagination[limit]=200`,
      { next: { revalidate: 3600 } },
    );
    if (!res.ok) return [];
    const data = await res.json();
    const teams = data.data || [];
    return teams
      .sort((a, b) => (b.oeuvres?.length || 0) - (a.oeuvres?.length || 0))
      .slice(0, 50)
      .map((t) => ({
        "documentId]-[slug": `${t.documentId}-${slugify(t.titre || "")}`,
      }));
  } catch {
    return [];
  }
}

function getCoverUrl(obj) {
  if (!obj) return null;
  if (typeof obj === "string") return obj;
  return obj.formats?.medium?.url || obj.formats?.small?.url || obj.url || null;
}

function getLinkIcon(url, titre) {
  const u = (url || "").toLowerCase();
  const t = (titre || "").toLowerCase();
  if (u.includes("discord") || t.includes("discord"))
    return <FaDiscord className="text-indigo-400" />;
  if (u.includes("twitter") || u.includes("x.com") || t.includes("twitter"))
    return <FaTwitter className="text-blue-400" />;
  if (u.includes("facebook") || t.includes("facebook"))
    return <FaFacebook className="text-blue-500" />;
  if (u.includes("instagram") || t.includes("instagram"))
    return <FaInstagram className="text-pink-400" />;
  if (u.includes("patreon") || t.includes("patreon"))
    return <FaPatreon className="text-orange-400" />;
  if (u.includes("tiktok") || t.includes("tiktok"))
    return <FaTiktok className="text-gray-200" />;
  if (u.includes("youtube") || t.includes("youtube"))
    return <FaYoutube className="text-red-400" />;
  if (t.includes("mail") || t.includes("contact") || u.startsWith("mailto:"))
    return <FiMail className="text-gray-300" />;
  return <FiGlobe className="text-gray-300" />;
}

function isExternalSocial(url) {
  const u = (url || "").toLowerCase();
  return /(discord|twitter|x\.com|facebook|instagram|patreon|tiktok|youtube)/.test(u);
}

function extractDocAndSlug(resolvedParams) {
  const raw =
    resolvedParams?.["documentId]-[slug"] ||
    resolvedParams?.documentId ||
    Object.values(resolvedParams || {})[0] ||
    "";
  if (!raw) return { documentId: "", slug: "" };
  const idx = raw.indexOf("-");
  if (idx === -1) return { documentId: raw, slug: "" };
  return { documentId: raw.slice(0, idx), slug: raw.slice(idx + 1) };
}

async function fetchTeam(documentId) {
  try {
    const res = await fetch(
      `${STRAPI}/api/teams/${documentId}` +
        `?populate[couverture][fields][0]=url` +
        `&populate[couverture][fields][1]=formats` +
        `&populate[oeuvres][populate][couverture][fields][0]=url` +
        `&populate[oeuvres][populate][couverture][fields][1]=formats` +
        `&populate[oeuvres][populate][genres][fields][0]=titre` +
        `&populate[oeuvres][populate][tags][fields][0]=titre` +
        `&populate[oeuvres][fields][0]=titre` +
        `&populate[oeuvres][fields][1]=documentId` +
        `&populate[oeuvres][fields][2]=auteur` +
        `&populate[oeuvres][fields][3]=type` +
        `&populate[oeuvres][fields][4]=etat` +
        `&populate[oeuvres][fields][5]=annee` +
        `&populate[oeuvres][fields][6]=updatedAt` +
        `&populate[oeuvres][fields][7]=traduction` +
        `&populate[oeuvres][sort]=updatedAt:desc` +
        `&populate[teamliens][fields][0]=titre` +
        `&populate[teamliens][fields][1]=url`,
      { next: { revalidate: 3600 } },
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data.data || null;
  } catch {
    return null;
  }
}

async function fetchSimilarTeams(currentDocumentId, dominantGenres = [], limit = 8) {
  try {
    const params = new URLSearchParams();
    params.append("populate[couverture][fields][0]", "url");
    params.append("populate[couverture][fields][1]", "formats");
    params.append("populate[oeuvres][fields][0]", "id");
    params.append("filters[documentId][$ne]", currentDocumentId);
    params.append("filters[etat][$eq]", "true");
    if (dominantGenres.length > 0) {
      dominantGenres.slice(0, 3).forEach((g, i) => {
        params.append(`filters[oeuvres][genres][titre][$in][${i}]`, g);
      });
    }
    params.append("pagination[limit]", "20");
    const res = await fetch(`${STRAPI}/api/teams?${params.toString()}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    const items = data.data || [];
    return items.sort(() => Math.random() - 0.5).slice(0, limit);
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  const { documentId } = extractDocAndSlug(resolvedParams);
  const team = await fetchTeam(documentId);
  if (!team) {
    return {
      title: "Team introuvable | Novel-Index",
      robots: { index: false, follow: false },
    };
  }
  const titre = team.titre;
  const oeuvres = team.oeuvres || [];
  const oeuvresCount = oeuvres.length;
  const sample = oeuvres.slice(0, 3).map((o) => o.titre).filter(Boolean).join(", ");
  const baseDesc = team.description
    ? team.description.replace(/\s+/g, " ").trim().slice(0, 100)
    : "";
  const description =
    `Team ${titre} — équipe de traduction française` +
    (oeuvresCount ? ` de ${oeuvresCount} œuvre(s)` : "") +
    (sample ? ` (${sample}…)` : ".") +
    (baseDesc ? ` ${baseDesc}` : "");
  const canonical = `${SITE_URL}/Teams/${documentId}-${slugify(titre || "")}`;
  const coverUrl = getCoverUrl(team.couverture);
  return {
    title: `${titre} — Team de traduction (${oeuvresCount} œuvres) | Novel-Index`,
    description: description.slice(0, 158),
    alternates: {
      canonical,
      types: { "application/rss+xml": `${SITE_URL}/api/teams/${documentId}/rss` },
    },
    openGraph: {
      title: `${titre} — Team de traduction française`,
      description: description.slice(0, 158),
      url: canonical,
      siteName: "Novel-Index",
      images: coverUrl ? [{ url: coverUrl, alt: titre }] : [],
      locale: "fr_FR",
      type: "profile",
    },
    twitter: {
      card: "summary_large_image",
      title: `${titre} — Team de traduction`,
      description: description.slice(0, 158),
      images: coverUrl ? [coverUrl] : [],
    },
  };
}

function formatDateFr(iso) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatMonthYearFr(iso) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("fr-FR", {
    month: "long",
    year: "numeric",
  });
}

function yearsBetween(iso) {
  if (!iso) return 0;
  const diff = Date.now() - new Date(iso).getTime();
  return Math.max(0, Math.floor(diff / (365.25 * 24 * 3600 * 1000)));
}

export default async function TeamPage({ params }) {
  const resolvedParams = await params;
  const { documentId, slug } = extractDocAndSlug(resolvedParams);
  if (!documentId) notFound();
  const team = await fetchTeam(documentId);
  if (!team) notFound();

  const expectedSlug = slugify(team.titre || "");
  if (expectedSlug && slug !== expectedSlug) {
    redirect(`/Teams/${documentId}-${expectedSlug}`);
  }

  const titre = team.titre;
  const isActive = team.etat === true;
  const coverUrl = getCoverUrl(team.couverture);
  const oeuvres = team.oeuvres || [];
  const liens = team.teamliens || [];

  // Stats par type
  const typeCounts = {};
  for (const o of oeuvres) {
    const k = o.type || "Autre";
    typeCounts[k] = (typeCounts[k] || 0) + 1;
  }
  const typeList = Object.entries(typeCounts).sort((a, b) => b[1] - a[1]);

  // Stats par état
  const etatCounts = {};
  for (const o of oeuvres) {
    const k = o.etat || "Non précisé";
    etatCounts[k] = (etatCounts[k] || 0) + 1;
  }
  const etatList = Object.entries(etatCounts).sort((a, b) => b[1] - a[1]);

  // Genres dominants
  const genreCounts = {};
  for (const o of oeuvres) {
    for (const g of o.genres || []) {
      if (g.titre) genreCounts[g.titre] = (genreCounts[g.titre] || 0) + 1;
    }
  }
  const dominantGenres = Object.entries(genreCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  // Tags dominants
  const tagCounts = {};
  for (const o of oeuvres) {
    for (const t of o.tags || []) {
      if (t.titre) tagCounts[t.titre] = (tagCounts[t.titre] || 0) + 1;
    }
  }
  const dominantTags = Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  // Auteurs uniques
  const auteurCounts = {};
  for (const o of oeuvres) {
    if (o.auteur) auteurCounts[o.auteur] = (auteurCounts[o.auteur] || 0) + 1;
  }
  const auteursList = Object.entries(auteurCounts).sort((a, b) => b[1] - a[1]);

  // Dernières mises à jour (déjà triées par updatedAt:desc côté API)
  const recentUpdates = oeuvres.slice(0, 5);
  const lastUpdate = oeuvres[0]?.updatedAt || null;
  const lastUpdateFr = formatDateFr(lastUpdate);

  // Fréquence : œuvres mises à jour dans les 30 derniers jours
  const thirtyDaysAgo = Date.now() - 30 * 24 * 3600 * 1000;
  const recentlyUpdatedCount = oeuvres.filter(
    (o) => o.updatedAt && new Date(o.updatedAt).getTime() > thirtyDaysAgo,
  ).length;
  const isHot = isActive && recentlyUpdatedCount >= 5;

  // Active depuis (createdAt de la team)
  const foundingDate = team.createdAt || team.publishedAt || null;
  const foundingMonthFr = formatMonthYearFr(foundingDate);
  const foundingYearsAgo = yearsBetween(foundingDate);

  // Description usable ?
  const desc = (team.description || "").trim();
  const hasRichDescription = desc.length >= 100;

  // Spécialité éditoriale auto
  const specialty = (() => {
    if (typeList.length === 0) return null;
    const topType = typeList[0];
    if (topType[1] / oeuvres.length >= 0.6) {
      const topGenre = dominantGenres[0];
      if (topGenre && topGenre[1] / oeuvres.length >= 0.4) {
        return `Spécialiste du ${topType[0]} ${topGenre[0].toLowerCase()}`;
      }
      return `Spécialiste du ${topType[0]}`;
    }
    return null;
  })();

  const similarTeams = await fetchSimilarTeams(
    documentId,
    dominantGenres.map(([g]) => g),
    8,
  );

  const canonical = `${SITE_URL}/Teams/${documentId}-${expectedSlug}`;
  const rssUrl = `${SITE_URL}/api/teams/${documentId}/rss`;
  const sampleTitres = oeuvres
    .slice(0, 3)
    .map((o) => o.titre)
    .filter(Boolean)
    .join(", ");

  // JSON-LD Organization enrichi
  const orgJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: titre,
    description:
      desc.slice(0, 500) || `Équipe de traduction française ${titre}.`,
    url: canonical,
    ...(coverUrl ? { logo: coverUrl, image: coverUrl } : {}),
    ...(foundingDate ? { foundingDate: foundingDate.slice(0, 10) } : {}),
    ...(dominantGenres.length > 0
      ? { knowsAbout: dominantGenres.map(([g]) => g) }
      : {}),
    sameAs: liens.map((l) => l.url).filter(Boolean),
    subjectOf: { "@type": "WebPage", url: `${SITE_URL}/Teams` },
  };

  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `Œuvres traduites par ${titre}`,
    numberOfItems: oeuvres.length,
    itemListElement: oeuvres.slice(0, 50).map((o, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `${SITE_URL}/oeuvre/${o.documentId}-${slugify(o.titre || "")}`,
      name: o.titre,
    })),
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Accueil", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Teams", item: `${SITE_URL}/Teams` },
      { "@type": "ListItem", position: 3, name: titre, item: canonical },
    ],
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: `Que traduit la team ${titre} ?`,
        acceptedAnswer: {
          "@type": "Answer",
          text:
            oeuvres.length > 0
              ? `La team ${titre} traduit ${oeuvres.length} œuvre(s) en français${sampleTitres ? `, notamment ${sampleTitres}` : ""}.`
              : `La team ${titre} n'a aucune œuvre référencée pour le moment sur Novel-Index.`,
        },
      },
      {
        "@type": "Question",
        name: `La team ${titre} est-elle encore active ?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: isActive
            ? `Oui, ${titre} est actuellement active${recentlyUpdatedCount > 0 ? ` (${recentlyUpdatedCount} œuvre(s) mise(s) à jour ces 30 derniers jours)` : ""}${lastUpdateFr ? `, dernière mise à jour le ${lastUpdateFr}` : ""}.`
            : `${titre} est actuellement marquée comme inactive sur Novel-Index. Ses projets sont en pause ou ont été abandonnés.`,
        },
      },
      ...(liens.length > 0
        ? [
            {
              "@type": "Question",
              name: `Où suivre la team ${titre} ?`,
              acceptedAnswer: {
                "@type": "Answer",
                text: `Vous pouvez suivre la team ${titre} via ses ${liens.length} lien(s) officiel(s) : ${liens.map((l) => l.titre).filter(Boolean).join(", ")}. Un flux RSS des mises à jour est également disponible.`,
              },
            },
          ]
        : [
            {
              "@type": "Question",
              name: `Où suivre la team ${titre} ?`,
              acceptedAnswer: {
                "@type": "Answer",
                text: `Aucun lien officiel n'est renseigné pour ${titre}. Vous pouvez suivre les mises à jour de son catalogue via le flux RSS de sa page Novel-Index.`,
              },
            },
          ]),
    ],
  };

  return (
    <div className="bg-gray-900 text-white min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
      />
      {oeuvres.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
        />
      )}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <div className="relative">
        <div className="absolute inset-x-0 top-0 h-[900px] overflow-hidden">
          <CoverBackground />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-transparent z-[5]"></div>
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-gray-900/20 to-gray-900/60 z-[6]"></div>
          <div className="absolute bottom-0 left-0 right-0 h-96 bg-gradient-to-t from-gray-900 via-gray-900/95 to-transparent z-[7]"></div>
        </div>

        <div className="relative z-20 pt-8">
          {/* Breadcrumb + actions */}
          <div className="max-w-6xl mx-auto px-4 mb-6 flex flex-wrap items-center gap-3 justify-between">
            <nav
              aria-label="Fil d'Ariane"
              className="flex items-center text-sm text-gray-300 gap-2 bg-gray-800/40 backdrop-blur-md px-4 py-2 rounded-xl w-fit border border-gray-700/30 shadow-lg"
            >
              <Link href="/" className="hover:text-white transition flex items-center gap-1">
                <FiHome className="w-4 h-4" /> Accueil
              </Link>
              <FiChevronRight className="text-gray-500" />
              <Link href="/Teams" className="hover:text-white transition">
                Teams
              </Link>
              <FiChevronRight className="text-gray-500" />
              <span className="text-white truncate max-w-[200px]">{titre}</span>
            </nav>
            <div className="flex items-center gap-2">
              <a
                href={rssUrl}
                title={`Flux RSS des mises à jour de ${titre}`}
                aria-label="Flux RSS"
                className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-800/40 backdrop-blur-md hover:bg-gray-800/60 border border-gray-700/40 rounded-lg text-sm text-gray-200 transition-colors"
              >
                <FiRss className="text-orange-300" /> RSS
              </a>
              <ShareTeamButton
                url={canonical}
                title={`${titre} — Team de traduction`}
                text={`Découvrez la team ${titre} et ses ${oeuvres.length} œuvre(s) traduites en français.`}
              />
            </div>
          </div>

          <div className="max-w-6xl mx-auto px-4 space-y-8">
            {/* Hero team */}
            <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
              {coverUrl ? (
                <div className="relative group flex-shrink-0">
                  <div className="absolute -inset-4 bg-gradient-to-b from-indigo-500/30 to-purple-500/30 rounded-2xl blur-3xl opacity-60 group-hover:opacity-80 transition-opacity"></div>
                  <Image
                    src={coverUrl}
                    alt={`Logo de la team ${titre} — équipe de traduction française`}
                    width={256}
                    height={256}
                    className="relative w-48 h-48 md:w-64 md:h-64 object-cover rounded-2xl shadow-2xl shadow-black/70 ring-1 ring-white/10 group-hover:scale-105 transition-transform duration-300"
                    priority
                  />
                  <span
                    className={`absolute -top-2 -right-2 px-3 py-1 rounded-full text-xs font-bold shadow-lg border ${
                      isActive
                        ? "bg-emerald-500 text-white border-emerald-300"
                        : "bg-gray-700 text-gray-200 border-gray-500"
                    }`}
                  >
                    {isActive ? "Active" : "Inactive"}
                  </span>
                </div>
              ) : (
                <div className="w-48 h-48 md:w-64 md:h-64 bg-gray-700/50 backdrop-blur flex items-center justify-center rounded-2xl text-gray-400 flex-shrink-0 border border-gray-600/30">
                  <FiUsers className="text-6xl text-gray-500" />
                </div>
              )}

              <div className="flex-1 min-w-0 text-center md:text-left">
                <div className="flex flex-wrap items-center gap-2 justify-center md:justify-start mb-3">
                  <span className="inline-flex items-center gap-2 text-xs uppercase tracking-wider text-indigo-300 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-400/30">
                    <FiUsers />
                    Team de traduction française
                  </span>
                  {isHot && (
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-orange-200 bg-orange-500/15 px-3 py-1 rounded-full border border-orange-400/40">
                      <FiZap className="text-orange-300" />
                      Très active
                    </span>
                  )}
                  {specialty && (
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-200 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-400/30">
                      <FiAward className="text-amber-300" />
                      {specialty}
                    </span>
                  )}
                </div>

                <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-3 text-white">
                  {titre}
                </h1>

                <p className="text-gray-300 leading-relaxed max-w-2xl mb-5">
                  {desc ? (
                    <>
                      {desc.replace(/\s+/g, " ").trim().slice(0, 220)}
                      {desc.length > 220 ? "… " : " "}
                    </>
                  ) : null}
                  Cette équipe propose{" "}
                  <strong className="text-white">{oeuvres.length} œuvre(s)</strong> traduite(s)
                  en français, compte{" "}
                  <strong className="text-white">{liens.length} lien(s)</strong> officiel(s)
                  {foundingMonthFr && (
                    <>
                      {" "}
                      et est référencée depuis{" "}
                      <strong className="text-white">{foundingMonthFr}</strong>
                      {foundingYearsAgo > 0 && ` (${foundingYearsAgo} an${foundingYearsAgo > 1 ? "s" : ""})`}
                    </>
                  )}
                  .
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-xl mx-auto md:mx-0">
                  <div className="bg-gray-800/40 backdrop-blur-md rounded-lg p-3 border border-gray-700/30">
                    <div className="text-xs text-gray-400 flex items-center gap-1.5">
                      <FiBook className="text-amber-300" /> Œuvres
                    </div>
                    <div className="text-2xl font-bold text-white">{oeuvres.length}</div>
                  </div>
                  <div className="bg-gray-800/40 backdrop-blur-md rounded-lg p-3 border border-gray-700/30">
                    <div className="text-xs text-gray-400 flex items-center gap-1.5">
                      <FiZap className="text-orange-300" /> 30 j
                    </div>
                    <div className="text-2xl font-bold text-white">{recentlyUpdatedCount}</div>
                  </div>
                  <div className="bg-gray-800/40 backdrop-blur-md rounded-lg p-3 border border-gray-700/30">
                    <div className="text-xs text-gray-400 flex items-center gap-1.5">
                      <FiExternalLink className="text-indigo-300" /> Liens
                    </div>
                    <div className="text-2xl font-bold text-white">{liens.length}</div>
                  </div>
                  <div className="bg-gray-800/40 backdrop-blur-md rounded-lg p-3 border border-gray-700/30">
                    <div className="text-xs text-gray-400 flex items-center gap-1.5">
                      {isActive ? (
                        <FiCheckCircle className="text-emerald-300" />
                      ) : (
                        <FiClock className="text-gray-300" />
                      )}{" "}
                      Statut
                    </div>
                    <div className="text-sm font-semibold text-white pt-1.5">
                      {isActive ? "Active" : "En pause"}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Dernières mises à jour */}
            {recentUpdates.length > 0 && (
              <section className="bg-gray-800/40 backdrop-blur-md rounded-xl p-5 border border-gray-700/30">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <FiZap className="text-orange-400" />
                  Dernières mises à jour de {titre}
                </h2>
                <ul className="space-y-2">
                  {recentUpdates.map((o) => {
                    const oCover = getCoverUrl(o.couverture);
                    return (
                      <li key={o.documentId || o.id}>
                        <Link
                          href={`/oeuvre/${o.documentId}-${slugify(o.titre || "")}`}
                          title={o.titre}
                          className="group flex items-center gap-3 bg-gray-900/40 hover:bg-gray-900/60 rounded-lg p-2.5 border border-gray-700/30 hover:border-orange-400/40 transition-colors"
                        >
                          <div className="w-10 h-14 rounded-md overflow-hidden bg-gray-800 flex-shrink-0 relative">
                            {oCover ? (
                              <Image
                                src={oCover}
                                alt={`Couverture de ${o.titre}`}
                                fill
                                sizes="40px"
                                className="object-cover"
                              />
                            ) : null}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-semibold text-white truncate group-hover:text-orange-200">
                              {o.titre}
                            </div>
                            <div className="text-[11px] text-gray-400 flex flex-wrap items-center gap-2">
                              {o.auteur && <span>{o.auteur}</span>}
                              {o.type && <span>· {o.type}</span>}
                              {o.updatedAt && (
                                <span className="text-gray-500">
                                  · MàJ le {formatDateFr(o.updatedAt)}
                                </span>
                              )}
                            </div>
                          </div>
                          <FiChevronRight className="text-gray-500 group-hover:text-orange-300 flex-shrink-0" />
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </section>
            )}

            {/* Répartition catalogue */}
            {oeuvres.length > 0 && (typeList.length > 0 || etatList.length > 0) && (
              <section className="bg-gray-800/40 backdrop-blur-md rounded-xl p-5 border border-gray-700/30">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <FiLayers className="text-purple-400" />
                  Répartition du catalogue
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {typeList.length > 0 && (
                    <div>
                      <h3 className="text-sm uppercase tracking-wider text-gray-400 mb-2">
                        Par format
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {typeList.map(([type, count]) => (
                          <span
                            key={type}
                            className="px-3 py-1.5 bg-purple-500/10 text-purple-200 border border-purple-400/30 rounded-full text-sm flex items-center gap-2"
                          >
                            <strong className="text-white">{count}</strong> {type}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {etatList.length > 0 && (
                    <div>
                      <h3 className="text-sm uppercase tracking-wider text-gray-400 mb-2">
                        Par état de traduction
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {etatList.map(([etat, count]) => (
                          <span
                            key={etat}
                            className="px-3 py-1.5 bg-emerald-500/10 text-emerald-200 border border-emerald-400/30 rounded-full text-sm flex items-center gap-2"
                          >
                            <strong className="text-white">{count}</strong> {etat}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* Genres / tags dominants — cross-linking */}
            {(dominantGenres.length > 0 || dominantTags.length > 0) && (
              <section className="bg-gray-800/40 backdrop-blur-md rounded-xl p-5 border border-gray-700/30">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <FiTag className="text-pink-400" />
                  Univers éditorial de {titre}
                </h2>
                {dominantGenres.length > 0 && (
                  <div className="mb-4">
                    <h3 className="text-sm uppercase tracking-wider text-gray-400 mb-2">
                      Genres les plus traduits
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {dominantGenres.map(([g, count]) => (
                        <TaxonomyChip
                          key={g}
                          type="genre"
                          label={g}
                          count={count}
                          title={`Voir le genre ${g}`}
                        />
                      ))}
                    </div>
                  </div>
                )}
                {dominantTags.length > 0 && (
                  <div>
                    <h3 className="text-sm uppercase tracking-wider text-gray-400 mb-2">
                      Tags récurrents
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {dominantTags.map(([t, count]) => (
                        <TaxonomyChip
                          key={t}
                          type="tag"
                          label={t}
                          count={count}
                          size="sm"
                          title={`Voir le tag ${t}`}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </section>
            )}

            {/* Auteurs traduits */}
            {auteursList.length > 0 && (
              <section className="bg-gray-800/40 backdrop-blur-md rounded-xl p-5 border border-gray-700/30">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <FiUser className="text-blue-400" />
                  Auteurs traduits par {titre} ({auteursList.length})
                </h2>
                <div className="flex flex-wrap gap-2">
                  {auteursList.slice(0, 24).map(([a, count]) => (
                    <Link
                      key={a}
                      href={`/auteur/${auteurSlug(a)}`}
                      title={`Voir l'auteur ${a}`}
                      className="px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-200 border border-blue-400/30 hover:border-blue-300/60 rounded-full text-sm flex items-center gap-2 transition-colors"
                    >
                      {a} {count > 1 && <span className="text-xs text-blue-300/70">({count})</span>}
                    </Link>
                  ))}
                  {auteursList.length > 24 && (
                    <span className="px-3 py-1.5 text-xs text-gray-500 self-center">
                      + {auteursList.length - 24} autres
                    </span>
                  )}
                </div>
              </section>
            )}

            {/* Grid principal */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                {hasRichDescription && (
                  <section className="bg-gray-800/40 backdrop-blur-md rounded-xl p-5 border border-gray-700/30">
                    <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                      <FiMessageCircle className="text-indigo-400" />À propos de {titre}
                    </h2>
                    <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">
                      {desc}
                    </p>
                  </section>
                )}

                <section className="bg-gray-800/40 backdrop-blur-md rounded-xl p-5 border border-gray-700/30">
                  <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <FiBook className="text-amber-400" />
                    Catalogue de {titre} ({oeuvres.length})
                  </h2>

                  {oeuvres.length > 0 ? (
                    <TeamCatalogClient oeuvres={oeuvres} teamTitre={titre} />
                  ) : (
                    <p className="text-gray-500 text-sm py-4">
                      Aucune œuvre référencée pour cette team pour le moment.
                    </p>
                  )}
                </section>

                {/* FAQ visible */}
                <section className="bg-gray-800/40 backdrop-blur-md rounded-xl p-5 border border-gray-700/30">
                  <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <FiHelpCircle className="text-emerald-400" />
                    Questions fréquentes
                  </h2>
                  <div className="space-y-3">
                    <details className="group bg-gray-900/40 rounded-lg p-4 border border-gray-700/30">
                      <summary className="cursor-pointer font-semibold text-white flex items-center justify-between">
                        Que traduit la team {titre}&nbsp;?
                        <FiChevronRight className="group-open:rotate-90 transition-transform text-gray-400" />
                      </summary>
                      <p className="text-gray-300 text-sm mt-3 leading-relaxed">
                        {oeuvres.length > 0 ? (
                          <>
                            La team <strong>{titre}</strong> traduit{" "}
                            <strong>{oeuvres.length} œuvre(s)</strong> en français
                            {sampleTitres ? (
                              <>
                                , notamment <em>{sampleTitres}</em>
                              </>
                            ) : null}
                            .
                          </>
                        ) : (
                          <>
                            Aucune œuvre n&apos;est actuellement référencée pour la team{" "}
                            <strong>{titre}</strong> sur Novel-Index.
                          </>
                        )}
                      </p>
                    </details>
                    <details className="group bg-gray-900/40 rounded-lg p-4 border border-gray-700/30">
                      <summary className="cursor-pointer font-semibold text-white flex items-center justify-between">
                        La team {titre} est-elle encore active&nbsp;?
                        <FiChevronRight className="group-open:rotate-90 transition-transform text-gray-400" />
                      </summary>
                      <p className="text-gray-300 text-sm mt-3 leading-relaxed">
                        {isActive ? (
                          <>
                            Oui, <strong>{titre}</strong> est actuellement{" "}
                            <strong className="text-emerald-300">active</strong>
                            {recentlyUpdatedCount > 0 && (
                              <>
                                {" "}
                                avec{" "}
                                <strong>{recentlyUpdatedCount} œuvre(s)</strong> mise(s) à
                                jour ces 30 derniers jours
                              </>
                            )}
                            {lastUpdateFr && (
                              <>
                                . Dernière mise à jour le <strong>{lastUpdateFr}</strong>
                              </>
                            )}
                            .
                          </>
                        ) : (
                          <>
                            <strong>{titre}</strong> est actuellement marquée comme{" "}
                            <strong>inactive</strong> sur Novel-Index. Ses projets sont en
                            pause ou ont été abandonnés.
                          </>
                        )}
                      </p>
                    </details>
                    <details className="group bg-gray-900/40 rounded-lg p-4 border border-gray-700/30">
                      <summary className="cursor-pointer font-semibold text-white flex items-center justify-between">
                        Où suivre la team {titre}&nbsp;?
                        <FiChevronRight className="group-open:rotate-90 transition-transform text-gray-400" />
                      </summary>
                      <p className="text-gray-300 text-sm mt-3 leading-relaxed">
                        {liens.length > 0 ? (
                          <>
                            Vous pouvez suivre <strong>{titre}</strong> via ses{" "}
                            <strong>{liens.length} lien(s) officiel(s)</strong>{" "}
                            dans la colonne de droite&nbsp;:{" "}
                            {liens.map((l) => l.titre).filter(Boolean).join(", ")}.
                          </>
                        ) : (
                          <>
                            Aucun lien officiel n&apos;est renseigné pour cette team.
                          </>
                        )}{" "}
                        Vous pouvez aussi suivre les <strong>mises à jour de son catalogue</strong>{" "}
                        via le{" "}
                        <a href={rssUrl} className="text-orange-300 hover:underline">
                          flux RSS
                        </a>
                        .
                      </p>
                    </details>
                  </div>
                </section>
              </div>

              <aside className="space-y-6">
                <section className="bg-gray-800/40 backdrop-blur-md rounded-xl p-5 border border-gray-700/30">
                  <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <FiExternalLink className="text-indigo-400" />
                    Liens officiels
                  </h2>

                  {liens.length > 0 ? (
                    <ul className="space-y-2">
                      {liens.map((lien, i) => (
                        <li key={i}>
                          <a
                            href={lien.url}
                            target="_blank"
                            rel={
                              isExternalSocial(lien.url)
                                ? "noopener noreferrer nofollow"
                                : "noopener noreferrer"
                            }
                            title={`${lien.titre} — ${titre}`}
                            className="flex items-center gap-3 p-3 bg-gray-900/40 hover:bg-gray-900/60 rounded-lg border border-gray-700/30 hover:border-indigo-400/40 transition-colors group"
                          >
                            <span className="text-xl flex-shrink-0">
                              {getLinkIcon(lien.url, lien.titre)}
                            </span>
                            <span className="flex-1 truncate text-sm text-gray-200 group-hover:text-white transition-colors">
                              {lien.titre}
                            </span>
                            <FiExternalLink className="text-gray-500 group-hover:text-indigo-300 flex-shrink-0" />
                          </a>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="text-sm space-y-3">
                      <p className="text-gray-400">
                        Aucun lien officiel n&apos;a été renseigné pour cette team.
                      </p>
                      <p className="text-gray-500 text-xs">
                        Vous gérez <strong className="text-gray-300">{titre}</strong>&nbsp;?
                        Contactez Novel-Index pour ajouter votre site, Discord ou réseaux
                        sociaux à cette page.
                      </p>
                      <a
                        href={rssUrl}
                        className="inline-flex items-center gap-2 px-3 py-1.5 bg-orange-500/15 hover:bg-orange-500/25 text-orange-200 border border-orange-400/30 rounded-lg text-xs font-semibold transition-colors"
                      >
                        <FiRss /> Flux RSS des mises à jour
                      </a>
                    </div>
                  )}
                </section>

                <section className="bg-gray-800/40 backdrop-blur-md rounded-xl p-5 border border-gray-700/30">
                  <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <FiTrendingUp className="text-amber-400" />
                    Informations
                  </h2>
                  <dl className="space-y-2 text-sm">
                    <div className="flex justify-between gap-2">
                      <dt className="text-gray-400">Statut</dt>
                      <dd className={isActive ? "text-emerald-300" : "text-gray-300"}>
                        {isActive ? "Active" : "Inactive"}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt className="text-gray-400">Œuvres traduites</dt>
                      <dd className="text-white font-semibold">{oeuvres.length}</dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt className="text-gray-400">Auteurs uniques</dt>
                      <dd className="text-white font-semibold">{auteursList.length}</dd>
                    </div>
                    {typeList.length > 0 && (
                      <div className="flex justify-between gap-2">
                        <dt className="text-gray-400">Formats traduits</dt>
                        <dd className="text-white font-semibold">{typeList.length}</dd>
                      </div>
                    )}
                    <div className="flex justify-between gap-2">
                      <dt className="text-gray-400">Liens officiels</dt>
                      <dd className="text-white font-semibold">{liens.length}</dd>
                    </div>
                    {foundingMonthFr && (
                      <div className="flex justify-between gap-2">
                        <dt className="text-gray-400">Référencée depuis</dt>
                        <dd className="text-white font-semibold capitalize">
                          {foundingMonthFr}
                        </dd>
                      </div>
                    )}
                    {lastUpdateFr && (
                      <div className="flex justify-between gap-2">
                        <dt className="text-gray-400">Dernière MàJ</dt>
                        <dd className="text-white font-semibold">{lastUpdateFr}</dd>
                      </div>
                    )}
                    <div className="flex justify-between gap-2 pt-2 border-t border-gray-700/30">
                      <dt className="text-gray-400">Flux RSS</dt>
                      <dd>
                        <a
                          href={rssUrl}
                          className="text-orange-300 hover:text-orange-200 font-semibold inline-flex items-center gap-1"
                        >
                          <FiRss /> S&apos;abonner
                        </a>
                      </dd>
                    </div>
                  </dl>
                </section>

                <Link
                  href="/Teams"
                  className="lg:hidden flex items-center justify-center gap-2 w-full px-4 py-3 bg-gray-800/40 backdrop-blur-md hover:bg-gray-800/60 border border-gray-700/30 rounded-lg transition-colors"
                >
                  <FiArrowLeft /> Toutes les teams
                </Link>
              </aside>
            </div>

            {/* Teams similaires */}
            {similarTeams.length > 0 && (
              <section className="bg-gray-800/40 backdrop-blur-md rounded-xl p-5 border border-gray-700/30">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <FiUsers className="text-purple-400" />
                  {dominantGenres.length > 0
                    ? `Teams similaires à ${titre}`
                    : "Autres teams actives à découvrir"}
                </h2>
                {dominantGenres.length > 0 && (
                  <p className="text-sm text-gray-400 mb-4">
                    Sélection basée sur les genres communs&nbsp;:{" "}
                    {dominantGenres
                      .slice(0, 3)
                      .map(([g]) => g)
                      .join(", ")}
                    .
                  </p>
                )}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {similarTeams.map((t) => {
                    const tCover = getCoverUrl(t.couverture);
                    const tCount = t.oeuvres?.length || 0;
                    return (
                      <Link
                        key={t.documentId}
                        href={`/Teams/${t.documentId}-${slugify(t.titre || "")}`}
                        title={`${t.titre} — ${tCount} œuvre(s)`}
                        className="group bg-gray-900/40 rounded-lg p-3 border border-gray-700/30 hover:border-purple-400/40 hover:bg-gray-900/60 transition-colors flex items-center gap-3"
                      >
                        <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-800 flex-shrink-0 relative">
                          {tCover ? (
                            <Image
                              src={tCover}
                              alt={`Logo ${t.titre}`}
                              fill
                              sizes="48px"
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <FiUsers className="text-gray-600" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-semibold text-white truncate group-hover:text-purple-200">
                            {t.titre}
                          </div>
                          <div className="text-xs text-gray-400">
                            {tCount} œuvre{tCount > 1 ? "s" : ""}
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
                <div className="mt-4 text-center">
                  <Link
                    href="/Teams"
                    className="inline-flex items-center gap-2 text-sm text-indigo-300 hover:text-indigo-200 transition-colors"
                  >
                    Voir toutes les teams <FiChevronRight />
                  </Link>
                </div>
              </section>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
