import TeamsClient from "./TeamsClient";
import { slugify } from "@/utils/slugify";

const STRAPI = process.env.NEXT_PUBLIC_API_URL;
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.novel-index.com";

export const revalidate = 600;

async function fetchTeams() {
  try {
    const res = await fetch(
      `${STRAPI}/api/teams` +
        `?populate[couverture][fields][0]=url` +
        `&populate[couverture][fields][1]=formats` +
        `&populate[oeuvres][fields][0]=id` +
        `&populate[oeuvres][fields][1]=type` +
        `&populate[oeuvres][fields][2]=updatedAt` +
        `&populate[teamliens][fields][0]=id` +
        `&sort=titre:asc` +
        `&pagination[limit]=200`,
      { next: { revalidate: 600 } },
    );
    if (!res.ok) return [];
    const data = await res.json();
    return data.data || [];
  } catch {
    return [];
  }
}

export async function generateMetadata() {
  const teams = await fetchTeams();
  const total = teams.length;
  const actives = teams.filter((t) => t.etat === true).length;
  const totalOeuvres = teams.reduce(
    (acc, t) => acc + (t.oeuvres?.length || 0),
    0,
  );
  const description =
    `Annuaire des ${total} équipes de traduction de webnovels et light novels en français : ` +
    `${actives} teams actives, ${totalOeuvres} œuvres traduites. ` +
    `Découvrez les groupes francophones qui traduisent vos romans asiatiques préférés sur Novel-Index.`;
  return {
    title: `Équipes de traduction de webnovels et light novels en français | Novel-Index`,
    description: description.slice(0, 158),
    alternates: { canonical: `${SITE_URL}/Teams` },
    openGraph: {
      title: `Teams de traduction française — Novel-Index`,
      description: description.slice(0, 158),
      url: `${SITE_URL}/Teams`,
      siteName: "Novel-Index",
      locale: "fr_FR",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `Teams de traduction française`,
      description: description.slice(0, 158),
    },
  };
}

export default async function TeamsPage() {
  const allTeams = await fetchTeams();

  const total = allTeams.length;
  const actives = allTeams.filter((t) => t.etat === true).length;
  const inactives = total - actives;
  const totalOeuvres = allTeams.reduce(
    (acc, t) => acc + (t.oeuvres?.length || 0),
    0,
  );

  // Top teams par nombre d'œuvres (cross-linking + ItemList SEO)
  const topTeams = [...allTeams]
    .filter((t) => t.etat === true)
    .sort((a, b) => (b.oeuvres?.length || 0) - (a.oeuvres?.length || 0))
    .slice(0, 10);

  // Répartition par type d'œuvre (contenu sémantique)
  const formatCounts = {};
  for (const t of allTeams) {
    for (const o of t.oeuvres || []) {
      const k = o.type || "Autre";
      formatCounts[k] = (formatCounts[k] || 0) + 1;
    }
  }
  const formatList = Object.entries(formatCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  // Date de mise à jour la plus récente (dateModified)
  let lastModified = null;
  for (const t of allTeams) {
    for (const o of t.oeuvres || []) {
      if (o.updatedAt && (!lastModified || o.updatedAt > lastModified)) {
        lastModified = o.updatedAt;
      }
    }
  }

  const stats = { total, actives, inactives, oeuvres: totalOeuvres };

  // JSON-LD CollectionPage
  const collectionJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Équipes de traduction de webnovels en français",
    description: `Annuaire de ${total} teams de traduction françaises (${actives} actives) totalisant ${totalOeuvres} œuvres.`,
    url: `${SITE_URL}/Teams`,
    inLanguage: "fr-FR",
    isPartOf: { "@type": "WebSite", name: "Novel-Index", url: SITE_URL },
    ...(lastModified ? { dateModified: lastModified } : {}),
  };

  // ItemList top teams (cross-linking SEO)
  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Teams de traduction françaises les plus actives",
    numberOfItems: topTeams.length,
    itemListElement: topTeams.map((t, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `${SITE_URL}/Teams/${t.documentId}-${slugify(t.titre || "")}`,
      name: t.titre,
    })),
  };

  // BreadcrumbList
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Accueil", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Teams", item: `${SITE_URL}/Teams` },
    ],
  };

  // FAQ JSON-LD (rich result FAQ)
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "Qu'est-ce qu'une team de traduction de webnovels ?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Une team de traduction est un groupe de bénévoles francophones qui traduisent gratuitement des webnovels, light novels et romans web asiatiques (chinois, coréens, japonais) vers le français, chapitre par chapitre.",
        },
      },
      {
        "@type": "Question",
        name: "Combien y a-t-il de teams de traduction sur Novel-Index ?",
        acceptedAnswer: {
          "@type": "Answer",
          text: `Novel-Index recense ${total} teams de traduction françaises, dont ${actives} sont actuellement actives et publient régulièrement de nouveaux chapitres. Au total, elles traduisent ${totalOeuvres} œuvres.`,
        },
      },
      {
        "@type": "Question",
        name: "Comment soutenir une team de traduction ?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Vous pouvez soutenir une team via leur Discord, Patreon, ou en partageant leurs traductions. La plupart des teams listent leurs liens officiels (site, Discord, réseaux sociaux) sur leur page Novel-Index.",
        },
      },
      {
        "@type": "Question",
        name: "Comment savoir si une team est encore active ?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Sur Novel-Index, chaque team a un badge \"Active\" ou \"Inactive\". Les teams actives publient régulièrement, les teams inactives ont mis leurs projets en pause ou les ont abandonnés.",
        },
      },
    ],
  };

  return (
    <>
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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <TeamsClient
        initialTeams={allTeams}
        stats={stats}
        topTeams={topTeams}
        formatList={formatList}
        lastModified={lastModified}
      />
    </>
  );
}
