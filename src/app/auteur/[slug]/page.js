import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { slugify } from "@/utils/slugify";
import { auteurSlug } from "@/utils/auteurSlug";
import TaxonomyChip from "@/app/components/TaxonomyChip";
import { FiBook, FiTag, FiArrowLeft, FiUser, FiGlobe, FiLayers, FiHash, FiFileText } from "react-icons/fi";

const STRAPI = process.env.NEXT_PUBLIC_API_URL;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://novel-index.com";

// Récupère tous les couples (auteur, titre, documentId) pour résoudre le slug
async function fetchAllAuteurs() {
  const all = [];
  let page = 1;
  const pageSize = 100;
  // Limite de sécurité : 50 pages = 5000 œuvres
  while (page <= 50) {
    try {
      const res = await fetch(
        `${STRAPI}/api/oeuvres?fields[0]=auteur&pagination[pageSize]=${pageSize}&pagination[page]=${page}`,
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

async function resolveAuteurName(slug) {
  const all = await fetchAllAuteurs();
  const seen = new Map();
  for (const o of all) {
    const auteur = (o.auteur || "").trim();
    if (!auteur) continue;
    const s = auteurSlug(auteur);
    if (!s) continue;
    if (!seen.has(s)) seen.set(s, auteur);
  }
  // slug venant de l'URL est déjà décodé par Next ; on tente match direct,
  // puis fallback sur la version décodée du slug stocké (pour CJK encodés).
  if (seen.has(slug)) return seen.get(slug);
  for (const [k, v] of seen) {
    try {
      if (decodeURIComponent(k) === slug) return v;
    } catch {}
  }
  return null;
}

async function fetchOeuvresByAuteur(auteurName) {
  const all = [];
  let page = 1;
  const pageSize = 100;
  while (page <= 10) {
    try {
      const res = await fetch(
        `${STRAPI}/api/oeuvres?filters[auteur][$containsi]=${encodeURIComponent(auteurName)}&populate[couverture]=true&populate[genres][fields][0]=titre&populate[tags][fields][0]=titre&populate[chapitres][fields][0]=id&pagination[pageSize]=${pageSize}&pagination[page]=${page}`,
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
  // Filtre strict sur le nom trimé (insensible à la casse) pour éviter les faux positifs
  // de $containsi (ex: "Mad Snail" vs "Mad Snail Jr.")
  const target = auteurName.trim().toLowerCase();
  return all.filter((o) => (o.auteur || "").trim().toLowerCase() === target);
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const auteur = await resolveAuteurName(slug);
  if (!auteur) {
    return {
      title: "Auteur introuvable | Novel-Index",
      robots: { index: false, follow: false },
    };
  }
  const oeuvres = await fetchOeuvresByAuteur(auteur);
  const count = oeuvres.length;
  const titres = oeuvres.slice(0, 3).map((o) => o.titre).filter(Boolean).join(", ");
  const desc = `Découvrez les ${count} œuvre${count > 1 ? "s" : ""} de ${auteur} traduite${count > 1 ? "s" : ""} en français et indexée${count > 1 ? "s" : ""} sur Novel-Index${titres ? ` : ${titres}` : ""}.`;
  const url = `${SITE_URL}/auteur/${slug}`;
  return {
    title: `${auteur} — Œuvres traduites en français | Novel-Index`,
    description: desc.slice(0, 160),
    alternates: { canonical: url },
    openGraph: {
      title: `${auteur} — Œuvres traduites en français`,
      description: desc.slice(0, 200),
      url,
      type: "profile",
    },
    twitter: {
      card: "summary_large_image",
      title: `${auteur} — Œuvres traduites en français`,
      description: desc.slice(0, 200),
    },
  };
}

export default async function AuteurPage({ params }) {
  const { slug } = await params;
  const auteur = await resolveAuteurName(slug);
  if (!auteur) notFound();

  // Redirection canonique si le slug ne correspond pas exactement
  const canonicalSlug = auteurSlug(auteur);
  if (canonicalSlug && slug !== canonicalSlug) {
    let decoded = canonicalSlug;
    try { decoded = decodeURIComponent(canonicalSlug); } catch {}
    if (slug !== decoded) {
      const { permanentRedirect } = await import("next/navigation");
      permanentRedirect(`/auteur/${canonicalSlug}`);
    }
  }

  const oeuvres = await fetchOeuvresByAuteur(auteur);
  if (!oeuvres.length) notFound();

  // Agrégation genres + tags
  const genresMap = new Map();
  const tagsMap = new Map();
  let totalChapitres = 0;
  let lastUpdate = null;

  for (const o of oeuvres) {
    for (const g of o.genres || []) {
      if (g?.titre) genresMap.set(g.titre.toLowerCase(), g.titre);
    }
    for (const t of o.tags || []) {
      if (t?.titre) tagsMap.set(t.titre.toLowerCase(), t.titre);
    }
    totalChapitres += (o.chapitres || []).length;
    const u = o.updatedAt ? new Date(o.updatedAt) : null;
    if (u && (!lastUpdate || u > lastUpdate)) lastUpdate = u;
  }

  const genres = [...genresMap.values()].sort();
  const tags = [...tagsMap.values()].sort();
  const count = oeuvres.length;

  // Helper français : énumération avec virgules + "et" final
  const frJoin = (arr) => {
    if (arr.length === 0) return "";
    if (arr.length === 1) return arr[0];
    if (arr.length === 2) return `${arr[0]} et ${arr[1]}`;
    return `${arr.slice(0, -1).join(", ")} et ${arr[arr.length - 1]}`;
  };

  // Construction d'une présentation narrative de l'auteur
  // basée uniquement sur les données disponibles (titres, genres, tags).
  const titres = oeuvres.map((o) => o.titre).filter(Boolean);
  const types = [...new Set(oeuvres.map((o) => o.type).filter(Boolean))];

  // Hash déterministe simple sur le nom : permet de varier les formulations
  // sans changer entre deux rendus du même auteur.
  const seed = [...auteur].reduce((a, c) => a + c.charCodeAt(0), 0);
  const pick = (arr) => arr[seed % arr.length];
  const pick2 = (arr) => arr[(seed >> 1) % arr.length];
  const pick3 = (arr) => arr[(seed >> 2) % arr.length];

  // ── Phrase 1 — accroche ────────────────────────────────────────────
  let accroche;
  if (count === 1) {
    const variants = [
      `${auteur} est l'auteur derrière «\u00a0${titres[0]}\u00a0», une œuvre traduite en français et indexée sur Novel-Index.`,
      `Plume singulière dans le paysage des traductions francophones, ${auteur} signe «\u00a0${titres[0]}\u00a0», référencé sur Novel-Index.`,
      `${auteur} fait partie des auteurs étrangers dont l'œuvre — «\u00a0${titres[0]}\u00a0» — bénéficie d'une traduction française accessible sur Novel-Index.`,
    ];
    accroche = pick(variants);
  } else {
    const sample = frJoin(titres.slice(0, 3).map((t) => `«\u00a0${t}\u00a0»`));
    const reste = titres.length > 3 ? `, parmi d'autres titres recensés sur Novel-Index` : ``;
    const variants = [
      `${auteur} compte ${count} œuvres traduites en français sur Novel-Index, parmi lesquelles ${sample}${reste}.`,
      `Auteur prolifique dont ${count} œuvres ont déjà fait l'objet d'une traduction française, ${auteur} est notamment à l'origine de ${sample}${reste}.`,
      `Avec ${count} titres référencés et traduits en français, ${auteur} occupe une place reconnaissable dans le catalogue Novel-Index, à travers ${sample}${reste}.`,
    ];
    accroche = pick(variants);
  }

  // ── Phrase 2 — périmètre d'écriture (genres) ──────────────────────
  let perimetre = "";
  if (genres.length > 0) {
    const lowered = genres.map((g) => g.toLowerCase());
    if (genres.length === 1) {
      const variants = [
        `Son écriture s'inscrit pleinement dans le registre ${lowered[0]}, qu'il décline avec une identité propre.`,
        `Le ${lowered[0]} constitue le terrain de jeu privilégié de ses récits.`,
        `Spécialiste du ${lowered[0]}, il y développe une voix reconnaissable au fil de ses pages.`,
      ];
      perimetre = pick2(variants);
    } else if (genres.length <= 4) {
      const list = frJoin(lowered);
      const variants = [
        `Son univers narratif se construit à la croisée de plusieurs genres — ${list} — qu'il fait dialoguer avec aisance.`,
        `Entre ${list}, son écriture refuse les cases et tisse des récits aux registres entrelacés.`,
        `Le périmètre de ses œuvres mêle ${list}, offrant une lecture aux atmosphères variées.`,
      ];
      perimetre = pick2(variants);
    } else {
      const head = frJoin(lowered.slice(0, 4));
      const reste = genres.length - 4;
      const variants = [
        `Son périmètre embrasse un large spectre de genres — ${head} et ${reste} autre${reste > 1 ? "s" : ""} — révélant une plume polyvalente, à l'aise dans des registres très différents.`,
        `Difficile d'enfermer ${auteur} dans une étiquette : ses récits naviguent entre ${head}, et explorent jusqu'à ${genres.length} registres distincts au total.`,
        `${genres.length} genres traversent sa bibliographie — du ${lowered[0]} au ${lowered[genres.length - 1]}, en passant par ${frJoin(lowered.slice(1, 4))} — signe d'une création protéiforme.`,
      ];
      perimetre = pick2(variants);
    }
  }

  // ── Phrase 3 — thématiques récurrentes (tags) ─────────────────────
  let thematiques = "";
  if (tags.length > 0) {
    const lowered = tags.map((t) => t.toLowerCase());
    if (tags.length <= 3) {
      const variants = [
        `On y retrouve des motifs récurrents tels que ${frJoin(lowered)}, qui colorent l'ensemble de son œuvre.`,
        `Ses récits reviennent volontiers sur ${frJoin(lowered)}, marqueurs identifiables de son écriture.`,
        `${frJoin(lowered)} : autant de thématiques que l'on croise au fil de ses pages.`,
      ];
      thematiques = pick3(variants);
    } else {
      const sample = frJoin(lowered.slice(0, 5));
      const reste = tags.length - 5;
      const variants = [
        `Parmi les thématiques marquantes : ${sample}${reste > 0 ? `, et ${reste} autre${reste > 1 ? "s" : ""} qui dessinent un imaginaire dense` : ``}.`,
        `Ses récits brassent ${sample}${reste > 0 ? `, sans compter ${reste} thématique${reste > 1 ? "s" : ""} supplémentaire${reste > 1 ? "s" : ""}` : ``} — un éventail révélateur de la richesse de son univers.`,
        `Les lectrices et lecteurs y croiseront ${sample}${reste > 0 ? `, et bien d'autres motifs (${reste} au total)` : ``}, autant de portes d'entrée vers ses œuvres.`,
      ];
      thematiques = pick3(variants);
    }
  }

  // ── Phrase 4 — format / volume ────────────────────────────────────
  let format = "";
  if (totalChapitres > 0) {
    const pluralCh = totalChapitres > 1 ? "s" : "";
    const typeLabel = types.length === 1 ? types[0].toLowerCase() : null;
    if (count === 1) {
      const variants = [
        `${totalChapitres} chapitre${pluralCh} sont actuellement disponibles en français${typeLabel ? `, sous format ${typeLabel}` : ``}.`,
        `Côté lecture, ${totalChapitres} chapitre${pluralCh}${typeLabel ? ` de ${typeLabel}` : ``} attend${pluralCh ? "ent" : ""} déjà les francophones.`,
        `Le titre cumule ${totalChapitres} chapitre${pluralCh} traduit${pluralCh}${typeLabel ? ` (${typeLabel})` : ``}, prêts à être découverts.`,
      ];
      format = pick(variants);
    } else {
      const variants = [
        `Au total, ce sont ${totalChapitres} chapitre${pluralCh}${typeLabel ? ` de ${typeLabel}` : ``} qui sont disponibles en français sur Novel-Index.`,
        `L'ensemble représente ${totalChapitres} chapitre${pluralCh}${typeLabel ? ` (${typeLabel})` : ``} accessibles aux lecteurs francophones.`,
        `${totalChapitres} chapitre${pluralCh}${typeLabel ? ` de ${typeLabel}` : ``}, répartis sur ${count} œuvres, composent sa bibliographie traduite à ce jour.`,
      ];
      format = pick(variants);
    }
  }

  // ── Phrase 5 — invitation finale ──────────────────────────────────
  const invitations = [
    `Découvrez ci-dessous ${count > 1 ? "ses œuvres" : "son œuvre"} et plongez dans son univers.`,
    `${count > 1 ? "Les fiches détaillées" : "La fiche détaillée"} ci-dessous vous permett${count > 1 ? "ent" : ""} d'explorer chaque titre, chapitre par chapitre.`,
    `Parcourez la bibliographie complète plus bas pour entrer dans son univers.`,
  ];
  const invitation = pick2(invitations);

  const presentation = [accroche, perimetre, thematiques, format, invitation].filter(Boolean);

  // JSON-LD : Person + ItemList
  const personLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: auteur,
    url: `${SITE_URL}/auteur/${canonicalSlug}`,
    description: `Auteur dont les œuvres sont traduites en français sur Novel-Index.`,
  };

  const itemListLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `Œuvres de ${auteur}`,
    numberOfItems: count,
    itemListElement: oeuvres.map((o, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `${SITE_URL}/oeuvre/${o.documentId}-${slugify(o.titre || "")}`,
      name: o.titre,
    })),
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Accueil", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Auteurs", item: `${SITE_URL}/auteur` },
      { "@type": "ListItem", position: 3, name: auteur, item: `${SITE_URL}/auteur/${canonicalSlug}` },
    ],
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 text-gray-100">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Fil d'Ariane */}
        <nav className="mb-6 text-sm text-white/60" aria-label="Fil d'Ariane">
          <Link href="/" className="hover:text-indigo-300">Accueil</Link>
          <span className="mx-2">/</span>
          <Link href="/auteur" className="hover:text-indigo-300">Auteurs</Link>
          <span className="mx-2">/</span>
          <span className="text-white">{auteur}</span>
        </nav>

        {/* Hero */}
        <header className="mb-10">
          <div className="flex items-start gap-4">
            <div className="shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-indigo-500/15 border border-indigo-400/30 flex items-center justify-center">
              <FiUser className="w-7 h-7 sm:w-8 sm:h-8 text-indigo-300" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs uppercase tracking-wider text-indigo-300/80 mb-1 flex items-center gap-1.5">
                <FiGlobe className="w-3.5 h-3.5" /> Auteur — traductions françaises
              </p>
              <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2 break-words">
                {auteur}
              </h1>
              <p className="text-white/65 text-sm sm:text-base">
                {count} œuvre{count > 1 ? "s" : ""} traduite{count > 1 ? "s" : ""} en français
                {totalChapitres > 0 && (
                  <> · {totalChapitres} chapitre{totalChapitres > 1 ? "s" : ""} indexé{totalChapitres > 1 ? "s" : ""}</>
                )}
              </p>
            </div>
          </div>
        </header>

        {/* Présentation narrative */}
        <section className="mb-10 p-6 rounded-xl bg-gray-900/60 border border-white/[0.06]">
          <h2 className="text-base font-semibold text-indigo-300/90 mb-4 flex items-center gap-2 uppercase tracking-wider text-xs">
            <FiUser className="w-3.5 h-3.5" /> Présentation
          </h2>
          <div className="space-y-3 text-white/80 leading-relaxed text-sm sm:text-base">
            {presentation.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        </section>

        {/* En bref — stats visuelles + univers */}
        <section className="mb-10 grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Carte stats */}
          <div className="lg:col-span-1 p-5 rounded-xl bg-gradient-to-br from-indigo-900/30 to-gray-900/60 border border-indigo-400/15">
            <h2 className="text-xs font-semibold text-indigo-300/90 mb-4 flex items-center gap-2 uppercase tracking-wider">
              <FiLayers className="w-3.5 h-3.5" /> En bref
            </h2>
            <dl className="space-y-3">
              <div className="flex items-baseline justify-between gap-3">
                <dt className="text-white/60 text-sm flex items-center gap-2">
                  <FiBook className="w-3.5 h-3.5 text-indigo-400/70" /> Œuvres
                </dt>
                <dd className="text-2xl font-bold text-white tabular-nums">{count}</dd>
              </div>
              <div className="flex items-baseline justify-between gap-3">
                <dt className="text-white/60 text-sm flex items-center gap-2">
                  <FiFileText className="w-3.5 h-3.5 text-indigo-400/70" /> Chapitres
                </dt>
                <dd className="text-2xl font-bold text-white tabular-nums">{totalChapitres}</dd>
              </div>
              <div className="flex items-baseline justify-between gap-3">
                <dt className="text-white/60 text-sm flex items-center gap-2">
                  <FiBook className="w-3.5 h-3.5 text-indigo-400/70" /> Genres
                </dt>
                <dd className="text-2xl font-bold text-white tabular-nums">{genres.length}</dd>
              </div>
              <div className="flex items-baseline justify-between gap-3">
                <dt className="text-white/60 text-sm flex items-center gap-2">
                  <FiHash className="w-3.5 h-3.5 text-indigo-400/70" /> Thématiques
                </dt>
                <dd className="text-2xl font-bold text-white tabular-nums">{tags.length}</dd>
              </div>
              {types.length > 0 && (
                <div className="pt-3 border-t border-white/[0.06]">
                  <dt className="text-white/60 text-xs uppercase tracking-wider mb-2">
                    Format{types.length > 1 ? "s" : ""}
                  </dt>
                  <dd className="flex flex-wrap gap-1.5">
                    {types.map((t) => (
                      <span
                        key={t}
                        className="inline-block px-2 py-0.5 rounded-full bg-indigo-500/15 border border-indigo-400/30 text-indigo-200 text-xs"
                      >
                        {t}
                      </span>
                    ))}
                  </dd>
                </div>
              )}
              {lastUpdate && (
                <div className="pt-3 border-t border-white/[0.06]">
                  <dt className="text-white/60 text-xs uppercase tracking-wider mb-1">
                    Dernière mise à jour
                  </dt>
                  <dd className="text-white/85 text-sm">
                    {lastUpdate.toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </dd>
                </div>
              )}
            </dl>
          </div>

          {/* Carte univers (genres + tags compacts) */}
          <div className="lg:col-span-2 p-5 rounded-xl bg-gray-900/60 border border-white/[0.06]">
            <h2 className="text-xs font-semibold text-indigo-300/90 mb-4 flex items-center gap-2 uppercase tracking-wider">
              <FiGlobe className="w-3.5 h-3.5" /> Univers narratif
            </h2>

            {genres.length > 0 && (
              <div className="mb-5">
                <h3 className="text-white/65 text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <FiBook className="w-3 h-3 text-indigo-400/60" /> Genres explorés
                </h3>
                <ul className="flex flex-wrap gap-1.5">
                  {genres.map((g) => (
                    <li key={g}>
                      <TaxonomyChip
                        type="genre"
                        label={g}
                        size="sm"
                        title={`Découvrir toutes les œuvres du genre ${g} sur Novel-Index`}
                      />
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {tags.length > 0 && (
              <div>
                <h3 className="text-white/65 text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <FiTag className="w-3 h-3 text-purple-400/60" /> Thématiques récurrentes
                </h3>
                <ul className="flex flex-wrap gap-1.5">
                  {tags.slice(0, 30).map((t) => (
                    <li key={t}>
                      <TaxonomyChip
                        type="tag"
                        label={t}
                        size="sm"
                        title={`Découvrir toutes les œuvres avec la thématique ${t} sur Novel-Index`}
                      />
                    </li>
                  ))}
                  {tags.length > 30 && (
                    <li>
                      <span className="inline-block px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-white/50 text-xs">
                        +{tags.length - 30} autres
                      </span>
                    </li>
                  )}
                </ul>
              </div>
            )}

            {genres.length === 0 && tags.length === 0 && (
              <p className="text-white/50 text-sm italic">
                Les genres et thématiques de cet auteur seront ajoutés au fur et à mesure de l'enrichissement du catalogue.
              </p>
            )}
          </div>
        </section>

        {/* Liste textuelle des œuvres (SEO + accessibilité) */}
        <section className="mb-10 p-6 rounded-xl bg-gray-900/60 border border-white/[0.06]">
          <h2 className="text-base font-semibold text-indigo-300/90 mb-4 flex items-center gap-2 uppercase tracking-wider text-xs">
            <FiBook className="w-3.5 h-3.5" /> Bibliographie traduite
          </h2>
          <p className="text-white/70 text-sm mb-3">
            {count === 1
              ? "Œuvre disponible en français :"
              : `Liste des ${count} œuvres disponibles en français :`}
          </p>
          <ul className="list-disc list-inside space-y-1.5 text-white/80 text-sm sm:text-base marker:text-indigo-400/60">
            {oeuvres.map((o) => {
              const href = `/oeuvre/${o.documentId}-${slugify(o.titre || "")}`;
              const chapCount = (o.chapitres || []).length;
              return (
                <li key={o.documentId}>
                  <Link
                    href={href}
                    className="text-indigo-300 hover:text-indigo-200 underline-offset-4 hover:underline transition-colors"
                    title={`Lire ${o.titre}${o.type ? ` (${o.type})` : ""} traduit en français sur Novel-Index`}
                  >
                    {o.titre}
                  </Link>
                  {o.type && (
                    <span className="text-white/50 text-xs sm:text-sm"> — {o.type}</span>
                  )}
                  {chapCount > 0 && (
                    <span className="text-white/50 text-xs sm:text-sm">
                      {" "}({chapCount} chapitre{chapCount > 1 ? "s" : ""})
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </section>

        {/* Liste des œuvres */}
        <section>
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-5">
            Œuvres de {auteur}
          </h2>
          <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
            {oeuvres.map((o) => {
              const cover =
                typeof o.couverture === "string"
                  ? o.couverture
                  : o.couverture?.url || null;
              const href = `/oeuvre/${o.documentId}-${slugify(o.titre || "")}`;
              const chapCount = (o.chapitres || []).length;
              return (
                <li key={o.documentId}>
                  <Link
                    href={href}
                    className="group block rounded-xl overflow-hidden bg-gray-900/60 border border-white/[0.06] hover:border-indigo-400/40 transition-colors"
                    title={`Découvrir ${o.titre}${o.type ? ` — ${o.type}` : ""} par ${auteur}`}
                  >
                    <div className="relative aspect-[2/3] bg-gray-800">
                      {cover ? (
                        <Image
                          src={cover}
                          alt={`Couverture de ${o.titre}${o.type ? ` (${o.type})` : ""} par ${auteur}`}
                          fill
                          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-white/30">
                          <FiBook className="w-10 h-10" />
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      <h3 className="text-sm sm:text-base font-semibold text-white line-clamp-2 group-hover:text-indigo-300 transition-colors">
                        {o.titre}
                      </h3>
                      {chapCount > 0 && (
                        <p className="mt-1 text-xs text-white/55">
                          {chapCount} chapitre{chapCount > 1 ? "s" : ""}
                        </p>
                      )}
                      {o.type && (
                        <p className="mt-0.5 text-xs text-indigo-300/80">{o.type}</p>
                      )}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>

        {/* Retour */}
        <div className="mt-12">
          <Link
            href="/Oeuvres"
            className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-indigo-300 transition-colors"
          >
            <FiArrowLeft /> Voir toutes les œuvres
          </Link>
        </div>
      </div>
    </main>
  );
}
