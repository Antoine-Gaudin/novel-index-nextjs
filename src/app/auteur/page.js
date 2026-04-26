import Link from "next/link";
import { auteurSlug } from "@/utils/auteurSlug";
import { FiUser, FiBook, FiArrowLeft, FiSearch } from "react-icons/fi";

const STRAPI = process.env.NEXT_PUBLIC_API_URL;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://novel-index.com";

async function fetchAllOeuvres() {
  const all = [];
  let page = 1;
  const pageSize = 100;
  while (page <= 50) {
    try {
      const res = await fetch(
        `${STRAPI}/api/oeuvres?fields[0]=auteur&fields[1]=titre&pagination[pageSize]=${pageSize}&pagination[page]=${page}`,
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
  return all;
}

function buildAuteursIndex(oeuvres) {
  const map = new Map();
  for (const o of oeuvres) {
    const auteur = (o.auteur || "").trim();
    if (!auteur) continue;
    const slug = auteurSlug(auteur);
    if (!slug) continue;
    if (!map.has(slug)) {
      map.set(slug, { name: auteur, slug, count: 0, titres: [] });
    }
    const entry = map.get(slug);
    entry.count += 1;
    if (o.titre && entry.titres.length < 3) entry.titres.push(o.titre);
  }
  return Array.from(map.values()).sort((a, b) =>
    a.name.localeCompare(b.name, "fr", { sensitivity: "base" })
  );
}

function groupByLetter(auteurs) {
  const groups = new Map();
  for (const a of auteurs) {
    const first = a.name.charAt(0).toUpperCase();
    // Lettres latines uniquement, sinon "#"
    const letter = /^[A-Z]$/.test(
      first.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    )
      ? first.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      : "#";
    if (!groups.has(letter)) groups.set(letter, []);
    groups.get(letter).push(a);
  }
  // Ordre : A-Z puis #
  const ordered = new Map();
  const letters = Array.from(groups.keys())
    .filter((l) => l !== "#")
    .sort();
  for (const l of letters) ordered.set(l, groups.get(l));
  if (groups.has("#")) ordered.set("#", groups.get("#"));
  return ordered;
}

export async function generateMetadata() {
  const oeuvres = await fetchAllOeuvres();
  const auteurs = buildAuteursIndex(oeuvres);
  const total = auteurs.length;
  const totalOeuvres = oeuvres.length;
  const url = `${SITE_URL}/auteur`;
  const desc = `Index complet des ${total} auteurs de romans asiatiques traduits en français référencés sur Novel-Index. Parcourez ${totalOeuvres} œuvres classées par auteur de A à Z.`;
  return {
    title: `Tous les auteurs (${total}) — Romans asiatiques traduits en français | Novel-Index`,
    description: desc.slice(0, 160),
    alternates: { canonical: url },
    openGraph: {
      title: `Tous les auteurs de romans asiatiques traduits — Novel-Index`,
      description: desc.slice(0, 200),
      url,
      type: "website",
    },
    twitter: {
      card: "summary",
      title: `Tous les auteurs — Novel-Index`,
      description: desc.slice(0, 200),
    },
  };
}

export default async function AuteursIndexPage() {
  const oeuvres = await fetchAllOeuvres();
  const auteurs = buildAuteursIndex(oeuvres);
  const groups = groupByLetter(auteurs);
  const total = auteurs.length;
  const totalOeuvres = oeuvres.length;
  const letters = Array.from(groups.keys());

  // JSON-LD : CollectionPage + ItemList des auteurs (limité aux 100 plus prolifiques pour rester lisible)
  const top = [...auteurs].sort((a, b) => b.count - a.count).slice(0, 100);
  const itemListLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Auteurs de romans asiatiques traduits en français",
    numberOfItems: total,
    itemListElement: top.map((a, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `${SITE_URL}/auteur/${a.slug}`,
      name: a.name,
    })),
  };
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Accueil", item: `${SITE_URL}/` },
      { "@type": "ListItem", position: 2, name: "Auteurs", item: `${SITE_URL}/auteur` },
    ],
  };
  const collectionLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Tous les auteurs",
    description: `Index de ${total} auteurs de romans asiatiques traduits en français.`,
    url: `${SITE_URL}/auteur`,
    isPartOf: { "@type": "WebSite", name: "Novel-Index", url: SITE_URL },
  };

  return (
    <main className="min-h-screen bg-gray-900 text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />

      <div className="max-w-6xl mx-auto px-4 pt-8">
        {/* Fil d'Ariane */}
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
              Auteurs
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

      {/* En-tête principal — carte glass comme sur la page œuvre */}
      <div className="max-w-6xl mx-auto px-4">
        <section className="bg-gray-800/40 backdrop-blur-md rounded-xl p-5 border border-gray-700/30 mb-8">
          <h1 className="text-2xl md:text-3xl font-bold mb-3 flex items-center gap-2">
            <FiUser className="w-6 h-6 text-indigo-400" />
            Tous les auteurs
          </h1>
          <p className="text-gray-300 leading-relaxed max-w-3xl">
            Retrouvez l&apos;ensemble des <strong className="text-white">{total} auteurs</strong> de
            romans asiatiques (chinois, coréens, japonais) traduits en français
            et référencés sur Novel-Index, soit{" "}
            <strong className="text-white">{totalOeuvres} œuvres</strong> indexées au total. Cliquez
            sur un nom pour découvrir sa bibliographie complète, les genres
            qu&apos;il explore et les équipes qui traduisent ses romans.
          </p>

          {/* Mini-stats inline */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-5">
            <div className="bg-gray-900/40 rounded-lg p-3 border border-gray-700/30">
              <p className="text-xs text-gray-400 mb-1 flex items-center gap-1">
                <FiUser className="w-3.5 h-3.5" /> Auteurs
              </p>
              <p className="text-lg font-semibold text-white">{total}</p>
            </div>
            <div className="bg-gray-900/40 rounded-lg p-3 border border-gray-700/30">
              <p className="text-xs text-gray-400 mb-1 flex items-center gap-1">
                <FiBook className="w-3.5 h-3.5" /> Œuvres
              </p>
              <p className="text-lg font-semibold text-white">{totalOeuvres}</p>
            </div>
            <div className="bg-gray-900/40 rounded-lg p-3 border border-gray-700/30">
              <p className="text-xs text-gray-400 mb-1 flex items-center gap-1">
                <FiSearch className="w-3.5 h-3.5" /> Lettres
              </p>
              <p className="text-lg font-semibold text-white">{letters.length}</p>
            </div>
          </div>
        </section>
      </div>

      {/* Navigation alphabétique sticky */}
      {letters.length > 1 && (
        <div className="sticky top-0 z-20 bg-gray-900/90 backdrop-blur-md border-y border-gray-700/30 mb-8">
          <nav
            aria-label="Navigation alphabétique"
            className="max-w-6xl mx-auto px-4 py-3"
          >
            <ul className="flex flex-wrap gap-1.5">
              {letters.map((l) => (
                <li key={l}>
                  <a
                    href={`#lettre-${l}`}
                    className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gray-800/60 hover:bg-indigo-500/20 border border-gray-700/50 hover:border-indigo-400/50 text-sm font-semibold text-gray-300 hover:text-white transition-colors"
                    title={`Aller aux auteurs commençant par ${l}`}
                  >
                    {l}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      )}

      {/* Sections par lettre */}
      <div className="max-w-6xl mx-auto px-4 pb-12 space-y-6">
        {Array.from(groups.entries()).map(([letter, list]) => (
          <section
            key={letter}
            id={`lettre-${letter}`}
            className="bg-gray-800/40 backdrop-blur-md rounded-xl p-5 border border-gray-700/30 scroll-mt-24"
          >
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-indigo-500/15 border border-indigo-400/30 text-indigo-300 font-bold">
                {letter}
              </span>
              <span className="text-white">Auteurs en {letter}</span>
              <span className="text-gray-400 text-sm font-normal">
                ({list.length})
              </span>
            </h2>
            <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {list.map((a) => (
                <li key={a.slug}>
                  <Link
                    href={`/auteur/${a.slug}`}
                    title={`Voir les ${a.count} œuvre${a.count > 1 ? "s" : ""} de ${a.name}${a.titres.length ? ` (${a.titres.join(", ")})` : ""} traduites en français`}
                    className="group flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg bg-gray-900/40 hover:bg-gray-900/70 border border-gray-700/30 hover:border-indigo-400/50 transition-colors"
                  >
                    <span className="flex items-center gap-2 min-w-0">
                      <FiUser className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                      <span className="truncate text-sm text-gray-200 group-hover:text-white">
                        {a.name}
                      </span>
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs text-gray-400 group-hover:text-indigo-300 flex-shrink-0">
                      <FiBook className="w-3 h-3" />
                      {a.count}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}

        {total === 0 && (
          <div className="bg-gray-800/40 backdrop-blur-md rounded-xl p-10 border border-gray-700/30 flex flex-col items-center justify-center text-gray-400">
            <FiSearch className="w-12 h-12 mb-3" />
            <p>Aucun auteur référencé pour le moment.</p>
          </div>
        )}
      </div>
    </main>
  );
}
