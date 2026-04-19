import { notFound } from "next/navigation";
import { slugify } from "@/utils/slugify";
import JsonLd from "../../components/JsonLd";
import OeuvreClient from "./OeuvreClient";

const STRAPI = process.env.NEXT_PUBLIC_API_URL;
const SITE_URL = "https://www.novel-index.com";

async function fetchOeuvre(documentId) {
  try {
    const res = await fetch(
      `${STRAPI}/api/oeuvres/${documentId}?populate[0]=couverture&populate[1]=tags&populate[2]=genres&populate[3]=chapitres&populate[4]=achatlivres`,
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data.data || null;
  } catch {
    return null;
  }
}

function stripHtml(str) {
  if (!str) return "";
  return str.replace(/<[^>]*>/g, "").replace(/\\r\\n|\\n|\\r/g, " ").trim();
}

function extractDocumentId(rawSegment) {
  const firstHyphen = rawSegment.indexOf("-");
  return firstHyphen > 0 ? rawSegment.substring(0, firstHyphen) : rawSegment;
}

export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  const rawSegment = resolvedParams["documentId]-[slug"];
  const documentId = extractDocumentId(rawSegment);
  const oeuvre = await fetchOeuvre(documentId);

  if (!oeuvre) {
    return { title: "Œuvre introuvable - Novel-Index" };
  }

  const title = `${oeuvre.titre} - Novel-Index`;
  const rawSynopsis = stripHtml(oeuvre.synopsis);
  const description = rawSynopsis
    ? rawSynopsis.slice(0, 160) + (rawSynopsis.length > 160 ? "..." : "")
    : `Découvrez ${oeuvre.titre} sur Novel-Index — traduction française, chapitres, genres et informations.`;
  const image = oeuvre.couverture?.url;
  const url = `${SITE_URL}/oeuvre/${documentId}-${slugify(oeuvre.titre)}`;

  return {
    title,
    description,
    keywords: [
      oeuvre.titre,
      oeuvre.titrealt,
      oeuvre.type,
      oeuvre.auteur,
      ...(oeuvre.genres || []).map((g) => g.titre),
      "traduction française",
      "novel-index",
    ].filter(Boolean),
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: oeuvre.titre,
      description,
      url,
      siteName: "Novel-Index",
      images: image ? [{ url: image, alt: oeuvre.titre }] : [],
      locale: "fr_FR",
      type: "article",
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title: oeuvre.titre,
      description,
      images: image ? [image] : [],
    },
  };
}

export default async function OeuvrePage({ params }) {
  const resolvedParams = await params;
  const rawSegment = resolvedParams["documentId]-[slug"];
  const documentId = extractDocumentId(rawSegment);
  const oeuvre = await fetchOeuvre(documentId);

  if (!oeuvre) {
    notFound();
  }

  const chapitres = (oeuvre.chapitres || []).sort((a, b) => a.order - b.order);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Book",
    name: oeuvre.titre,
    alternateName: oeuvre.titrealt || undefined,
    author: oeuvre.auteur
      ? { "@type": "Person", name: oeuvre.auteur }
      : undefined,
    image: oeuvre.couverture?.url,
    description: stripHtml(oeuvre.synopsis)?.slice(0, 500),
    genre: (oeuvre.genres || []).map((g) => g.titre),
    inLanguage:
      oeuvre.langage === "Francais"
        ? "fr"
        : oeuvre.langage === "Anglais"
          ? "en"
          : "fr",
    url: `${SITE_URL}/oeuvre/${documentId}-${slugify(oeuvre.titre)}`,
    numberOfPages: chapitres.length > 0 ? chapitres.length : undefined,
    keywords: (oeuvre.tags || []).map((t) => t.titre).join(", ") || undefined,
  };

  return (
    <>
      <JsonLd data={jsonLd} />
      <OeuvreClient
        initialOeuvre={oeuvre}
        initialChapitres={chapitres}
        documentId={documentId}
      />
    </>
  );
}
