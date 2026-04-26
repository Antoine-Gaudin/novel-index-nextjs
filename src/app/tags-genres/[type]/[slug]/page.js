/* eslint-disable unicode-bom */
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { slugify } from "@/utils/slugify";
import { auteurSlug } from "@/utils/auteurSlug";
import {
  FiArrowLeft,
  FiBook,
  FiBookOpen,
  FiCalendar,
  FiTag,
  FiUser,
  FiTrendingUp,
  FiHash,
  FiClock,
} from "react-icons/fi";

const STRAPI = process.env.NEXT_PUBLIC_API_URL;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.novel-index.com";

export const revalidate = 3600;

function timeAgo(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "—";
  const now = new Date();
  const diffMs = now - d;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays <= 0) return "aujourd’hui";
  if (diffDays === 1) return "hier";
  if (diffDays < 30) return `il y a ${diffDays} jours`;
  const months = Math.floor(diffDays / 30);
  if (months < 12) return months === 1 ? "il y a 1 mois" : `il y a ${months} mois`;
  const years = Math.floor(months / 12);
  return years === 1 ? "il y a 1 an" : `il y a ${years} ans`;
}

async function fetchTagOrGenre(type, slug) {
  const resource = type === "tag" ? "tags" : "genres";
  const url =
    `${STRAPI}/api/${resource}` +
    `?populate[oeuvres][populate][couverture][fields][0]=url` +
    `&populate[oeuvres][populate][chapitres][fields][0]=id` +
    `&populate[oeuvres][fields][0]=titre` +
    `&populate[oeuvres][fields][1]=documentId` +
    `&populate[oeuvres][fields][2]=auteur` +
    `&populate[oeuvres][fields][3]=type` +
    `&populate[oeuvres][fields][4]=etat` +
    `&populate[oeuvres][fields][5]=updatedAt` +
    `&populate[oeuvres][fields][6]=traduction` +
    `&populate[oeuvres][fields][7]=annee` +
    `&populate[oeuvres][fields][8]=categorie` +
    `&pagination[limit]=200`;

  try {
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    const json = await res.json();
    const items = json.data || [];
    const matched = items.find((it) => slugify(it.titre || "") === slug);
    return matched || null;
  } catch {
    return null;
  }
}

async function fetchSiblings(type, currentSlug, limit = 12) {
  const resource = type === "tag" ? "tags" : "genres";
  const url =
    `${STRAPI}/api/${resource}` +
    `?populate[oeuvres][fields][0]=id` +
    `&pagination[limit]=200`;
  try {
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    const json = await res.json();
    const items = (json.data || [])
      .filter((it) => slugify(it.titre || "") !== currentSlug)
      .map((it) => ({
        titre: it.titre,
        count: (it.oeuvres || []).length,
      }))
      .sort(() => Math.random() - 0.5)
      .slice(0, limit);
    return items;
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }) {
  const { type, slug } = await params;
  if (type !== "tag" && type !== "genre") return {};
  const item = await fetchTagOrGenre(type, slug);
  if (!item) {
    return {
      title: "Introuvable | Novel-Index",
      robots: { index: false, follow: false },
    };
  }
  const oeuvres = item.oeuvres || [];
  const titre = item.titre;
  const sample = oeuvres
    .slice(0, 3)
    .map((o) => o.titre)
    .filter(Boolean)
    .join(", ");
  const baseDesc =
    item.description && typeof item.description === "string"
      ? item.description.replace(/\s+/g, " ").trim().slice(0, 110)
      : "";
  const desc =
    `${oeuvres.length} romans ${type === "tag" ? "avec le tag" : "du genre"} ${titre} traduits en français` +
    (sample ? ` : ${sample}…` : ".") +
    (baseDesc ? ` ${baseDesc}` : "");
  const canonical = `${SITE_URL}/tags-genres/${type}/${slug}`;
  return {
    title: `Romans ${titre} — ${oeuvres.length} œuvre(s) traduite(s) en français | Novel-Index`,
    description: desc.slice(0, 158),
    alternates: { canonical },
    openGraph: {
      title: `Romans ${titre} — ${oeuvres.length} œuvre(s) traduite(s)`,
      description: desc.slice(0, 158),
      url: canonical,
      type: "website",
      siteName: "Novel-Index",
    },
    twitter: {
      card: "summary",
      title: `Romans ${titre} — ${oeuvres.length} œuvres`,
      description: desc.slice(0, 158),
    },
  };
}

export default async function TagGenrePage({ params }) {
  const { type, slug } = await params;
  if (type !== "tag" && type !== "genre") notFound();

  const item = await fetchTagOrGenre(type, slug);
  if (!item) notFound();

  const titre = item.titre;
  const oeuvres = item.oeuvres || [];
  const totalChapitres = oeuvres.reduce(
    (sum, o) => sum + (o.chapitres ? o.chapitres.length : 0),
    0,
  );
  const enCours = oeuvres.filter(
    (o) => (o.etat || "").toLowerCase().includes("cours"),
  ).length;
  const lastUpdate = oeuvres
    .map((o) => o.updatedAt)
    .filter(Boolean)
    .sort()
    .pop();

  const auteursSet = new Map();
  oeuvres.forEach((o) => {
    if (o.auteur && !auteursSet.has(o.auteur)) {
      auteursSet.set(o.auteur, true);
    }
  });
  const auteurs = Array.from(auteursSet.keys());

  const formats = Array.from(
    new Set(oeuvres.map((o) => o.type).filter(Boolean)),
  );

  const recents = [...oeuvres]
    .filter((o) => o.updatedAt)
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
    .slice(0, 6);

  const topChapitres = [...oeuvres]
    .map((o) => ({ ...o, chCount: o.chapitres ? o.chapitres.length : 0 }))
    .sort((a, b) => b.chCount - a.chCount)
    .slice(0, 6);

  const siblings = await fetchSiblings(type, slug, 12);

  const accent =
    type === "tag"
      ? {
          icon: "text-purple-300",
          iconStrong: "text-purple-400",
          chipBg: "bg-purple-500/10",
          chipBorder: "border-purple-400/25",
          chipText: "text-purple-200",
          chipHoverBg: "hover:bg-purple-500/20",
          chipHoverBorder: "hover:border-purple-400/50",
          chipHoverText: "hover:text-purple-100",
          titleSpan: "text-purple-300",
          label: "Tag",
          labelOther: "tag",
        }
      : {
          icon: "text-indigo-300",
          iconStrong: "text-indigo-400",
          chipBg: "bg-indigo-500/10",
          chipBorder: "border-indigo-400/25",
          chipText: "text-indigo-200",
          chipHoverBg: "hover:bg-indigo-500/20",
          chipHoverBorder: "hover:border-indigo-400/50",
          chipHoverText: "hover:text-indigo-100",
          titleSpan: "text-indigo-300",
          label: "Genre",
          labelOther: "genre",
        };

  const canonical = `${SITE_URL}/tags-genres/${type}/${slug}`;

  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: oeuvres.slice(0, 50).map((o, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `${SITE_URL}/oeuvre/${o.documentId}-${slugify(o.titre || "")}`,
      name: o.titre,
    })),
  };

  const collectionJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `Romans ${titre}`,
    description: `Liste des œuvres ${type === "tag" ? "avec le tag" : "du genre"} ${titre}, traduites en français.`,
    url: canonical,
    inLanguage: "fr-FR",
    isPartOf: { "@type": "WebSite", name: "Novel-Index", url: SITE_URL },
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Accueil", item: SITE_URL },
      {
        "@type": "ListItem",
        position: 2,
        name: type === "tag" ? "Tags" : "Genres",
        item: `${SITE_URL}/tags-genres/${type}`,
      },
      { "@type": "ListItem", position: 3, name: titre, item: canonical },
    ],
  };

  return (
    <main className="bg-gray-900 text-white min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {/* Fil d'Ariane */}
        <nav
          aria-label="Fil d’Ariane"
          className="text-sm text-gray-400 flex items-center gap-2 flex-wrap"
        >
          <Link href="/" className="hover:text-white transition-colors">
            Accueil
          </Link>
          <span>›</span>
          <Link
            href={`/tags-genres/${type}`}
            className="hover:text-white transition-colors"
          >
            {type === "tag" ? "Tags" : "Genres"}
          </Link>
          <span>›</span>
          <span className="text-gray-200">{titre}</span>
        </nav>

        {/* Bouton retour */}
        <Link
          href={`/tags-genres/${type}`}
          className="inline-flex items-center gap-2 text-sm text-gray-300 hover:text-white transition-colors"
        >
          <FiArrowLeft />
          {type === "tag" ? "Tous les tags" : "Tous les genres"}
        </Link>

        {/* Header glass */}
        <header className="bg-gray-800/40 backdrop-blur-md rounded-xl p-6 border border-gray-700/30">
          <div
            className={`inline-flex items-center gap-2 text-xs uppercase tracking-wider ${accent.iconStrong} mb-3`}
          >
            {type === "tag" ? <FiTag /> : <FiBook />}
            <span>{accent.label}</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-3">
            Romans <span className={accent.titleSpan}>{titre}</span> traduits en français
          </h1>
          <p className="text-gray-300 leading-relaxed mb-6 max-w-3xl">
            {item.description && typeof item.description === "string" ? (
              <>{item.description.replace(/\s+/g, " ").trim()} </>
            ) : null}
            Retrouvez sur cette page les{" "}
            <strong className="text-white">{oeuvres.length} œuvres</strong>{" "}
            {type === "tag" ? "associées au tag" : "appartenant au genre"}{" "}
            <strong className="text-white">{titre}</strong> indexées sur Novel-Index, soit{" "}
            <strong className="text-white">{totalChapitres} chapitres</strong> traduits en
            français par <strong className="text-white">{auteurs.length} équipes</strong> de
            traduction. Romans web (web novels), light novels et autres formats asiatiques
            (chinois, coréens, japonais) {type === "tag" ? "marqués" : "du genre"} {titre}.
          </p>

          {/* Mini-stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-gray-900/40 rounded-lg p-3 border border-gray-700/30">
              <div className="text-xs text-gray-400 flex items-center gap-1.5">
                <FiBookOpen className="text-indigo-300" /> Œuvres
              </div>
              <div className="text-2xl font-bold text-white">{oeuvres.length}</div>
            </div>
            <div className="bg-gray-900/40 rounded-lg p-3 border border-gray-700/30">
              <div className="text-xs text-gray-400 flex items-center gap-1.5">
                <FiHash className="text-amber-300" /> Chapitres
              </div>
              <div className="text-2xl font-bold text-white">{totalChapitres}</div>
            </div>
            <div className="bg-gray-900/40 rounded-lg p-3 border border-gray-700/30">
              <div className="text-xs text-gray-400 flex items-center gap-1.5">
                <FiTrendingUp className="text-emerald-300" /> En cours
              </div>
              <div className="text-2xl font-bold text-white">{enCours}</div>
            </div>
            <div className="bg-gray-900/40 rounded-lg p-3 border border-gray-700/30">
              <div className="text-xs text-gray-400 flex items-center gap-1.5">
                <FiClock className="text-purple-300" /> Dernière maj
              </div>
              <div className="text-sm font-semibold text-white">{timeAgo(lastUpdate)}</div>
            </div>
          </div>

          {formats.length > 0 && (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="text-xs text-gray-400">Formats :</span>
              {formats.map((f) => (
                <span
                  key={f}
                  className="px-2.5 py-1 text-xs rounded-full bg-gray-900/60 border border-gray-700/40 text-gray-200"
                >
                  {f}
                </span>
              ))}
            </div>
          )}
        </header>

        {/* Récemment mis à jour */}
        {recents.length > 0 && (
          <section className="bg-gray-800/40 backdrop-blur-md rounded-xl p-5 border border-gray-700/30">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <FiClock className="text-emerald-400" />
              Récemment mis à jour
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {recents.map((o) => (
                <Link
                  key={o.documentId}
                  href={`/oeuvre/${o.documentId}-${slugify(o.titre || "")}`}
                  className="bg-gray-900/40 rounded-lg p-3 border border-gray-700/30 hover:border-emerald-400/40 hover:bg-gray-900/60 transition-colors flex items-center justify-between gap-3"
                >
                  <span className="flex items-center gap-2 min-w-0">
                    <FiBookOpen className="text-emerald-300 flex-shrink-0" />
                    <span className="truncate text-sm text-gray-100">{o.titre}</span>
                  </span>
                  <span className="text-xs text-gray-400 flex-shrink-0">
                    {timeAgo(o.updatedAt)}
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Toutes les œuvres */}
        {oeuvres.length > 0 && (
          <section className="bg-gray-800/40 backdrop-blur-md rounded-xl p-5 border border-gray-700/30">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <FiBookOpen className={accent.iconStrong} />
              Toutes les œuvres ({oeuvres.length})
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {oeuvres.map((o) => {
                const chCount = o.chapitres ? o.chapitres.length : 0;
                const cover = o.couverture?.url;
                return (
                  <Link
                    key={o.documentId}
                    href={`/oeuvre/${o.documentId}-${slugify(o.titre || "")}`}
                    className="group bg-gray-900/40 rounded-lg overflow-hidden border border-gray-700/30 hover:border-gray-500/50 transition-all"
                    title={`${o.titre} — ${o.auteur || "Auteur inconnu"} (${chCount} chapitres)`}
                  >
                    <div className="relative aspect-[2/3] bg-gray-800 overflow-hidden">
                      {cover ? (
                        <Image
                          src={cover}
                          alt={`Couverture de ${o.titre} — roman ${titre} traduit en français`}
                          fill
                          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 20vw"
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs">
                          Sans couverture
                        </div>
                      )}
                      <div className="absolute top-2 left-2 flex flex-col gap-1">
                        {chCount > 0 && (
                          <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-black/70 text-amber-200 border border-amber-400/30">
                            {chCount} ch.
                          </span>
                        )}
                        {o.type && (
                          <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-black/70 text-gray-200 border border-gray-500/40">
                            {o.type}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="p-2.5 space-y-1">
                      <h3 className="text-sm font-semibold text-white line-clamp-2 group-hover:text-indigo-200 transition-colors">
                        {o.titre}
                      </h3>
                      {o.auteur && (
                        <p className="text-xs text-gray-400 flex items-center gap-1 truncate">
                          <FiUser className="flex-shrink-0" />
                          <span className="truncate">{o.auteur}</span>
                        </p>
                      )}
                      <div className="flex items-center justify-between text-[11px] text-gray-500">
                        {o.annee && (
                          <span className="flex items-center gap-1">
                            <FiCalendar /> {o.annee}
                          </span>
                        )}
                        {o.etat && <span>{o.etat}</span>}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* Top chapitres */}
        {topChapitres.length > 0 && topChapitres[0].chCount > 0 && (
          <section className="bg-gray-800/40 backdrop-blur-md rounded-xl p-5 border border-gray-700/30">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <FiTrendingUp className="text-amber-400" />
              Les plus avancées en traduction
            </h2>
            <ol className="space-y-2">
              {topChapitres.map((o, i) => (
                <li key={o.documentId}>
                  <Link
                    href={`/oeuvre/${o.documentId}-${slugify(o.titre || "")}`}
                    className="bg-gray-900/40 rounded-lg p-3 border border-gray-700/30 hover:border-amber-400/40 hover:bg-gray-900/60 transition-colors flex items-center gap-3"
                  >
                    <span className="text-amber-300 font-bold text-lg w-6 text-center flex-shrink-0">
                      {i + 1}
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="block text-sm text-white truncate">{o.titre}</span>
                      {o.auteur && (
                        <span className="block text-xs text-gray-400 truncate">{o.auteur}</span>
                      )}
                    </span>
                    <span className="text-sm text-amber-200 font-semibold flex-shrink-0">
                      {o.chCount} ch.
                    </span>
                  </Link>
                </li>
              ))}
            </ol>
          </section>
        )}

        {/* Auteurs */}
        {auteurs.length > 0 && (
          <section className="bg-gray-800/40 backdrop-blur-md rounded-xl p-5 border border-gray-700/30">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <FiUser className={accent.iconStrong} />
              {type === "tag"
                ? "Auteurs explorant cette thématique"
                : `Auteurs du genre ${titre}`}
            </h2>
            <div className="flex flex-wrap gap-2">
              {auteurs.slice(0, 50).map((name) => (
                <Link
                  key={name}
                  href={`/auteur/${auteurSlug(name)}`}
                  className="px-3 py-1.5 text-sm rounded-full bg-gray-900/60 border border-gray-700/40 text-gray-200 hover:bg-gray-900 hover:border-gray-500/60 hover:text-white transition-colors"
                  title={`Voir toutes les œuvres de ${name}`}
                >
                  {name}
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Siblings — cross-link */}
        {siblings.length > 0 && (
          <section className="bg-gray-800/40 backdrop-blur-md rounded-xl p-5 border border-gray-700/30">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              {type === "tag" ? (
                <FiTag className={accent.iconStrong} />
              ) : (
                <FiBook className={accent.iconStrong} />
              )}
              {type === "tag"
                ? "Autres thématiques à découvrir"
                : "Autres genres à découvrir"}
            </h2>
            <div className="flex flex-wrap gap-2">
              {siblings.map((s) => (
                <Link
                  key={s.titre}
                  href={`/tags-genres/${type}/${slugify(s.titre)}`}
                  className={`px-3 py-1.5 text-sm rounded-full ${accent.chipBg} ${accent.chipBorder} ${accent.chipText} ${accent.chipHoverBg} ${accent.chipHoverBorder} ${accent.chipHoverText} border transition-colors inline-flex items-center gap-1.5`}
                  title={`${s.titre} — ${s.count} œuvre(s)`}
                >
                  <span>{s.titre}</span>
                  <span className="text-xs opacity-70">({s.count})</span>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
