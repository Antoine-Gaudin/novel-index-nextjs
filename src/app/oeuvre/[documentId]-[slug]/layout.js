import { cache } from "react";
import { slugify } from "@/utils/slugify";
import { auteurSlug } from "@/utils/auteurSlug";
import JsonLd from "@/app/components/JsonLd";

const SITE_URL = "https://www.novel-index.com";
const FALLBACK_IMAGE = `${SITE_URL}/logo.png`;

// Dédupliqué via React cache pour éviter les doubles fetchs entre generateMetadata et le rendu du layout.
const getOeuvre = cache(async (id) => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const url = `${apiUrl}/api/oeuvres/${id}?populate[0]=couverture&populate[1]=tags&populate[2]=genres&populate[3]=chapitres&populate[4]=achatlivres`;
  const res = await fetch(url, { next: { revalidate: 3600 } });
  if (!res.ok) return null;
  const data = await res.json();
  return data.data || null;
});

function stripHtml(str) {
  if (!str) return "";
  return str
    .replace(/<[^>]*>/g, " ")
    .replace(/\r?\n/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getSegment(resolvedParams) {
  return (
    resolvedParams?.["documentId]-[slug"] ||
    resolvedParams?.documentId ||
    Object.values(resolvedParams || {})[0] ||
    null
  );
}

// Doit rester aligné avec buildFaq() côté client dans OeuvreClient.js
function buildFaqItems({ titre, auteur, traduction, etat, totalCh, genres, licence, annee }) {
  const items = [];

  items.push({
    q: `Combien de chapitres compte ${titre} ?`,
    a:
      totalCh > 0
        ? `${titre} compte actuellement ${totalCh} chapitre${totalCh > 1 ? "s" : ""} disponible${totalCh > 1 ? "s" : ""} en français sur Novel-Index.`
        : `Aucun chapitre de ${titre} n'est encore disponible en français.`,
  });

  items.push({
    q: `Qui est l'auteur de ${titre} ?`,
    a: auteur
      ? `${titre} a été écrit par ${auteur}.`
      : `L'auteur original de ${titre} n'est pas renseigné sur Novel-Index pour le moment.`,
  });

  items.push({
    q: `Qui traduit ${titre} en français ?`,
    a: traduction
      ? `La traduction française de ${titre} est assurée par ${traduction}.`
      : `Aucune équipe de traduction n'est référencée pour ${titre}.`,
  });

  if (etat) {
    items.push({
      q: `Quel est le statut de ${titre} ?`,
      a: `${titre} est actuellement ${etat.toLowerCase()}.`,
    });
  }

  if (genres?.length > 0) {
    items.push({
      q: `Quels sont les genres de ${titre} ?`,
      a: `${titre} relève des genres suivants : ${genres.map((g) => g.titre).join(", ")}.`,
    });
  }

  items.push({
    q: `${titre} est-elle une œuvre licenciée ?`,
    a: licence
      ? `Oui, ${titre} a été officiellement licenciée. La traduction amateur n'est plus disponible — vous pouvez retrouver l'édition officielle chez l'éditeur.`
      : `Non, ${titre} n'a pas été officiellement licenciée à ce jour.`,
  });

  items.push({
    q: `Où peut-on lire ${titre} en français ?`,
    a: licence
      ? `${titre} étant licenciée, nous vous invitons à acquérir l'édition officielle pour la lire.`
      : `Vous pouvez lire ${titre} directement depuis Novel-Index : cliquez sur un chapitre dans la liste de cette page pour être redirigé vers le site du traducteur.`,
  });

  if (annee) {
    items.push({
      q: `Quand ${titre} a-t-elle été publiée ?`,
      a: `${titre} a été publiée pour la première fois en ${annee}.`,
    });
  }

  return items;
}

export async function generateMetadata({ params }) {
  try {
    const resolvedParams = await params;
    const fullSegment = getSegment(resolvedParams);
    if (!fullSegment || typeof fullSegment !== "string") {
      return { title: "Novel-Index", description: "Plateforme d'indexation collaborative." };
    }

    const id = fullSegment.split("-")[0];
    const oeuvre = await getOeuvre(id);

    if (!oeuvre) {
      return {
        title: "Œuvre introuvable - Novel-Index",
        description: "Cette œuvre n'existe pas ou a été supprimée.",
      };
    }

    const titre = (oeuvre.titre || "").trim();
    const typeLabel = oeuvre.type ? ` - ${oeuvre.type}` : "";
    const cleanSynopsis = stripHtml(oeuvre.synopsis);
    const description = cleanSynopsis
      ? cleanSynopsis.length > 155
        ? cleanSynopsis.slice(0, 152) + "..."
        : cleanSynopsis
      : `Découvrez ${titre} sur Novel-Index — traduction française, chapitres, genres et informations.`;

    const slug = slugify(titre);
    const canonicalUrl = `${SITE_URL}/oeuvre/${oeuvre.documentId}-${slug}`;
    const cover = oeuvre.couverture;
    const imageUrl = cover?.url || FALLBACK_IMAGE;
    const imageWidth = cover?.width || 800;
    const imageHeight = cover?.height || 1200;

    const keywords = [
      titre,
      (oeuvre.titrealt || "").trim() || null,
      oeuvre.type,
      (oeuvre.auteur || "").trim() || null,
      ...(oeuvre.genres || []).map((g) => g.titre),
      ...(oeuvre.tags || []).slice(0, 8).map((t) => t.titre),
      "traduction française",
      "novel-index",
    ].filter(Boolean);

    return {
      title: `${titre}${typeLabel} - Novel-Index`,
      description,
      keywords,
      alternates: { canonical: canonicalUrl },
      openGraph: {
        title: `${titre}${typeLabel} | Novel-Index`,
        description,
        url: canonicalUrl,
        siteName: "Novel-Index",
        images: [
          {
            url: imageUrl,
            alt: titre,
            width: imageWidth,
            height: imageHeight,
          },
        ],
        locale: "fr_FR",
        type: "article",
      },
      twitter: {
        card: "summary_large_image",
        title: `${titre}${typeLabel} | Novel-Index`,
        description,
        images: [imageUrl],
      },
    };
  } catch (error) {
    console.error("[Metadata] Erreur generateMetadata:", error);
    return { title: "Novel-Index", description: "Plateforme d'indexation collaborative." };
  }
}

export default async function OeuvreLayout({ children, params }) {
  try {
    const resolvedParams = await params;
    const fullSegment = getSegment(resolvedParams);

    if (fullSegment && typeof fullSegment === "string") {
      const id = fullSegment.split("-")[0];
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;

      const oeuvre = await getOeuvre(id);

      if (oeuvre) {
        const titre = (oeuvre.titre || "").trim();
        const slug = slugify(titre);
        const canonicalUrl = `${SITE_URL}/oeuvre/${oeuvre.documentId}-${slug}`;

        const imageUrl = oeuvre.couverture?.url
          ? oeuvre.couverture.url.startsWith("http")
            ? oeuvre.couverture.url
            : `${apiUrl}${oeuvre.couverture.url}`
          : FALLBACK_IMAGE;

        const cleanSynopsis = stripHtml(oeuvre.synopsis);

        // Reviews à partir des commentaires (cache 1h)
        let reviews = [];
        try {
          const commentsRes = await fetch(
            `${apiUrl}/api/commentaires?filters[oeuvres][documentId]=${oeuvre.documentId}&populate=users_permissions_users&pagination[limit]=10`,
            { next: { revalidate: 3600 } }
          );
          if (commentsRes.ok) {
            const commentsData = await commentsRes.json();
            reviews =
              commentsData.data?.map((comment) => ({
                "@type": "Review",
                author: {
                  "@type": "Person",
                  name: comment.users_permissions_users?.[0]?.username || "Utilisateur",
                },
                reviewBody: comment.commentaire,
                datePublished: comment.createdAt,
              })) || [];
          }
        } catch (error) {
          console.error("[OeuvreLayout] Erreur récupération commentaires:", error);
        }

        const bookJsonLd = {
          "@context": "https://schema.org",
          "@type": "Book",
          name: titre,
          alternateName: (oeuvre.titrealt || "").trim() || undefined,
          description: cleanSynopsis || `Découvrez ${titre} sur Novel-Index`,
          url: canonicalUrl,
          image: imageUrl,
          inLanguage: "fr",
          author: oeuvre.auteur
            ? {
                "@type": "Person",
                name: (oeuvre.auteur || "").trim(),
                url: `${SITE_URL}/auteur/${auteurSlug((oeuvre.auteur || "").trim())}`,
              }
            : undefined,
          genre: oeuvre.genres?.length ? oeuvre.genres.map((g) => g.titre).join(", ") : undefined,
          keywords: oeuvre.tags?.length ? oeuvre.tags.map((t) => t.titre).join(", ") : undefined,
          datePublished: oeuvre.createdAt,
          dateModified: oeuvre.updatedAt,
          publisher: {
            "@type": "Organization",
            name: "Novel-Index",
            url: SITE_URL,
          },
          review: reviews.length > 0 ? reviews : undefined,
        };

        Object.keys(bookJsonLd).forEach(
          (key) => bookJsonLd[key] === undefined && delete bookJsonLd[key]
        );

        const breadcrumbJsonLd = {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Accueil", item: SITE_URL },
            { "@type": "ListItem", position: 2, name: "Œuvres", item: `${SITE_URL}/Oeuvres` },
            { "@type": "ListItem", position: 3, name: titre, item: canonicalUrl },
          ],
        };

        const totalCh = oeuvre.licence
          ? oeuvre.achatlivres?.length || 0
          : oeuvre.chapitres?.length || 0;

        const faqItems = buildFaqItems({
          titre,
          auteur: (oeuvre.auteur || "").trim(),
          traduction: (oeuvre.traduction || "").trim(),
          etat: oeuvre.etat,
          totalCh,
          genres: oeuvre.genres,
          licence: oeuvre.licence,
          annee: oeuvre.annee,
        });

        const faqJsonLd = {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faqItems.map((item) => ({
            "@type": "Question",
            name: item.q,
            acceptedAnswer: {
              "@type": "Answer",
              text: item.a,
            },
          })),
        };

        return (
          <>
            <JsonLd data={bookJsonLd} />
            <JsonLd data={breadcrumbJsonLd} />
            <JsonLd data={faqJsonLd} />
            {children}
          </>
        );
      }
    }
  } catch (error) {
    console.error("[OeuvreLayout] Erreur lors de la génération du JSON-LD:", error);
  }

  return children;
}
