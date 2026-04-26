import { notFound } from "next/navigation";
import Link from "next/link";
import { slugify } from "@/utils/slugify";
import { FiArrowLeft, FiBook, FiTag, FiBookOpen, FiHash } from "react-icons/fi";

const STRAPI = process.env.NEXT_PUBLIC_API_URL;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.novel-index.com";

export const revalidate = 3600;

async function fetchAll(type) {
  const collection = type === "tag" ? "tags" : "genres";
  const all = [];
  let page = 1;
  const pageSize = 100;
  while (page <= 20) {
    try {
      const res = await fetch(
        `${STRAPI}/api/${collection}?populate[oeuvres][fields][0]=id&pagination[pageSize]=${pageSize}&pagination[page]=${page}`,
        { next: { revalidate: 3600 } }
      );
      if (!res.ok) break;
      const data = await res.json();
      const items = data.data || [];
      all.push(...items);
      const total = data.meta?.pagination?.total || 0;
      if (page * pageSize >= total) break;
      page++;
    } catch {
      break;
    }
  }
  return all
    .map((it) => ({
      id: it.id,
      titre: it.titre,
      slug: slugify(it.titre || ""),
      description: it.description || null,
      count: (it.oeuvres || []).length,
    }))
    .filter((it) => it.titre && it.slug)
    .sort((a, b) =>
      a.titre.localeCompare(b.titre, "fr", { sensitivity: "base" })
    );
}

function groupByLetter(items) {
  const groups = new Map();
  for (const it of items) {
    const first = it.titre.charAt(0).toUpperCase();
    const stripped = first.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const letter = /^[A-Z]$/.test(stripped) ? stripped : "#";
    if (!groups.has(letter)) groups.set(letter, []);
    groups.get(letter).push(it);
  }
  const ordered = new Map();
  const letters = Array.from(groups.keys()).filter((l) => l !== "#").sort();
  for (const l of letters) ordered.set(l, groups.get(l));
  if (groups.has("#")) ordered.set("#", groups.get("#"));
  return ordered;
}

export async function generateMetadata({ params }) {
  const { type } = await params;
  if (type !== "tag" && type !== "genre") {
    return { title: "Introuvable | Novel-Index", robots: { index: false } };
  }
  const items = await fetchAll(type);
  const isTag = type === "tag";
  const total = items.length;
  const top = items
    .slice()
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
    .map((i) => i.titre)
    .join(", ");
  const url = `${SITE_URL}/tags-genres/${type}`;
  const baseTitle = isTag
    ? `Tous les tags (${total}) — Thématiques de romans asiatiques traduits en français`
    : `Tous les genres (${total}) — Romans asiatiques traduits en français`;
  const desc = isTag
    ? `Index complet des ${total} thématiques de romans asiatiques (chinois, coréens, japonais) traduits en français sur Novel-Index. Top : ${top}.`
    : `Index complet des ${total} genres de romans asiatiques (chinois, coréens, japonais) traduits en français sur Novel-Index. Top : ${top}.`;
  return {
    title: `${baseTitle} | Novel-Index`,
    description: desc.slice(0, 160),
    alternates: { canonical: url },
    openGraph: {
      title: baseTitle,
      description: desc.slice(0, 200),
      url,
      siteName: "Novel-Index",
      locale: "fr_FR",
      type: "website",
    },
    twitter: {
      card: "summary",
      title: baseTitle,
      description: desc.slice(0, 200),
    },
  };
}

export default async function TagsGenresIndexPage({ params }) {
  const { type } = await params;
  if (type !== "tag" && type !== "genre") notFound();

  const isTag = type === "tag";
  const items = await fetchAll(type);
  const total = items.length;
  const totalOeuvres = items.reduce((s, i) => s + i.count, 0);
  const groups = groupByLetter(items);
  const letters = Array.from(groups.keys());

  // Top 12 par nombre d'œuvres
  const top = [...items].sort((a, b) => b.count - a.count).slice(0, 12);

  const url = `${SITE_URL}/tags-genres/${type}`;
  const itemListLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: isTag ? "Tous les tags Novel-Index" : "Tous les genres Novel-Index",
    numberOfItems: total,
    itemListElement: top.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `${SITE_URL}/tags-genres/${type}/${it.slug}`,
      name: it.titre,
    })),
  };
  const collectionLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: isTag ? "Tous les tags" : "Tous les genres",
    description: `Index complet des ${total} ${isTag ? "thématiques" : "genres"} de romans asiatiques traduits en français.`,
    url,
    isPartOf: { "@type": "WebSite", name: "Novel-Index", url: SITE_URL },
  };

  return (
    <main className="bg-gray-900 text-white min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListLd) }}
      />

      <div className="max-w-6xl mx-auto px-4 pt-8">
        <nav aria-label="Fil d'Ariane" className="flex items-center text-sm text-gray-300 mb-6">
          <ol className="flex items-center gap-2 flex-wrap">
            <li>
              <Link
                href="/"
                className="text-gray-400 hover:text-white transition-colors"
                title="Retour à l'accueil de Novel-Index"
              >
                Accueil
              </Link>
            </li>
            <li className="text-gray-600">/</li>
            <li className="text-white font-medium" aria-current="page">
              {isTag ? "Tags" : "Genres"}
            </li>
          </ol>
        </nav>

        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors mb-6"
          title="Retour à l'accueil"
        >
          <FiArrowLeft className="w-3.5 h-3.5" /> Accueil
        </Link>
      </div>

      <div className="max-w-6xl mx-auto px-4">
        <section className="bg-gray-800/40 backdrop-blur-md rounded-xl p-5 border border-gray-700/30 mb-8">
          <h1 className="text-2xl md:text-3xl font-bold mb-3 flex items-center gap-2">
            {isTag ? (
              <FiTag className="w-6 h-6 text-purple-400" />
            ) : (
              <FiBook className="w-6 h-6 text-indigo-400" />
            )}
            Tous les {isTag ? "tags" : "genres"}
          </h1>
          <p className="text-gray-300 leading-relaxed max-w-3xl">
            Explorez les{" "}
            <strong className="text-white">{total} {isTag ? "thématiques" : "genres"}</strong>{" "}
            recensées sur Novel-Index pour classer les romans asiatiques (chinois, coréens, japonais)
            traduits en français, soit{" "}
            <strong className="text-white">{totalOeuvres} référencement{totalOeuvres > 1 ? "s" : ""}</strong>{" "}
            au total. Cliquez sur {isTag ? "une thématique" : "un genre"} pour découvrir toutes les œuvres
            qui {isTag ? "y sont rattachées" : "en font partie"}, leurs auteurs et les équipes qui les traduisent.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-5">
            <div className="bg-gray-900/40 rounded-lg p-3 border border-gray-700/30">
              <p className="text-xs text-gray-400 mb-1 flex items-center gap-1">
                {isTag ? <FiTag className="w-3.5 h-3.5" /> : <FiBook className="w-3.5 h-3.5" />}
                {isTag ? "Tags" : "Genres"}
              </p>
              <p className="text-lg font-semibold text-white">{total}</p>
            </div>
            <div className="bg-gray-900/40 rounded-lg p-3 border border-gray-700/30">
              <p className="text-xs text-gray-400 mb-1 flex items-center gap-1">
                <FiBookOpen className="w-3.5 h-3.5" /> Œuvres rattachées
              </p>
              <p className="text-lg font-semibold text-white">{totalOeuvres}</p>
            </div>
            <div className="bg-gray-900/40 rounded-lg p-3 border border-gray-700/30">
              <p className="text-xs text-gray-400 mb-1 flex items-center gap-1">
                <FiHash className="w-3.5 h-3.5" /> Lettres
              </p>
              <p className="text-lg font-semibold text-white">{letters.length}</p>
            </div>
          </div>
        </section>
      </div>

      {/* Top */}
      {top.length > 0 && top[0].count > 0 && (
        <div className="max-w-6xl mx-auto px-4 mb-8">
          <section className="bg-gray-800/40 backdrop-blur-md rounded-xl p-5 border border-gray-700/30">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <FiBookOpen className={`w-5 h-5 ${isTag ? "text-purple-400" : "text-indigo-400"}`} />
              {isTag ? "Thématiques les plus présentes" : "Genres les plus représentés"}
            </h2>
            <ul className="flex flex-wrap gap-1.5">
              {top.filter((t) => t.count > 0).map((it) => (
                <li key={it.id}>
                  <Link
                    href={`/tags-genres/${type}/${it.slug}`}
                    title={`${it.count} œuvre${it.count > 1 ? "s" : ""} ${isTag ? "avec la thématique" : "du genre"} ${it.titre}`}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full ${isTag ? "bg-purple-500/10 border-purple-400/25 text-purple-200 hover:bg-purple-500/20 hover:border-purple-400/50 hover:text-purple-100" : "bg-indigo-500/10 border-indigo-400/25 text-indigo-200 hover:bg-indigo-500/20 hover:border-indigo-400/50 hover:text-indigo-100"} border text-xs transition-colors`}
                  >
                    {it.titre}
                    <span className={isTag ? "text-purple-300/70" : "text-indigo-300/70"}>×{it.count}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </div>
      )}

      {/* Nav alphabétique sticky */}
      {letters.length > 1 && (
        <div className="sticky top-0 z-20 bg-gray-900/90 backdrop-blur-md border-y border-gray-700/30 mb-8">
          <nav aria-label="Navigation alphabétique" className="max-w-6xl mx-auto px-4 py-3">
            <ul className="flex flex-wrap gap-1.5">
              {letters.map((l) => (
                <li key={l}>
                  <a
                    href={`#lettre-${l}`}
                    className={`inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gray-800/60 border border-gray-700/50 text-sm font-semibold text-gray-300 hover:text-white transition-colors ${isTag ? "hover:bg-purple-500/20 hover:border-purple-400/50" : "hover:bg-indigo-500/20 hover:border-indigo-400/50"}`}
                    title={`Aller aux ${isTag ? "tags" : "genres"} commençant par ${l}`}
                  >
                    {l}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 pb-12 space-y-6">
        {Array.from(groups.entries()).map(([letter, list]) => (
          <section
            key={letter}
            id={`lettre-${letter}`}
            className="bg-gray-800/40 backdrop-blur-md rounded-xl p-5 border border-gray-700/30 scroll-mt-24"
          >
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <span className={`inline-flex items-center justify-center w-9 h-9 rounded-lg ${isTag ? "bg-purple-500/15 border-purple-400/30 text-purple-300" : "bg-indigo-500/15 border-indigo-400/30 text-indigo-300"} border font-bold`}>
                {letter}
              </span>
              <span className="text-white">{isTag ? "Tags" : "Genres"} en {letter}</span>
              <span className="text-gray-400 text-sm font-normal">({list.length})</span>
            </h2>
            <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {list.map((it) => (
                <li key={it.id}>
                  <Link
                    href={`/tags-genres/${type}/${it.slug}`}
                    title={`${it.count} œuvre${it.count > 1 ? "s" : ""} ${isTag ? "avec la thématique" : "du genre"} ${it.titre}${it.description ? ` — ${it.description.slice(0, 80)}` : ""}`}
                    className={`group flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg bg-gray-900/40 hover:bg-gray-900/70 border border-gray-700/30 ${isTag ? "hover:border-purple-400/50" : "hover:border-indigo-400/50"} transition-colors`}
                  >
                    <span className="flex items-center gap-2 min-w-0">
                      {isTag ? (
                        <FiTag className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
                      ) : (
                        <FiBook className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                      )}
                      <span className="truncate text-sm text-gray-200 group-hover:text-white">
                        {it.titre}
                      </span>
                    </span>
                    <span className={`inline-flex items-center gap-1 text-xs ${isTag ? "text-gray-400 group-hover:text-purple-300" : "text-gray-400 group-hover:text-indigo-300"} flex-shrink-0`}>
                      <FiBookOpen className="w-3 h-3" />
                      {it.count}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}

        {total === 0 && (
          <section className="bg-gray-800/40 backdrop-blur-md rounded-xl p-10 border border-gray-700/30 text-center text-gray-400">
            <p>Aucun {isTag ? "tag" : "genre"} référencé pour le moment.</p>
          </section>
        )}
      </div>
    </main>
  );
}
