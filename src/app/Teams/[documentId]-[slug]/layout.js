import JsonLd from "../../components/JsonLd";

// Génère les métadonnées dynamiques pour chaque team
export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  const fullParam = resolvedParams["documentId-slug"];
  const documentId = fullParam?.split("-")[0];
  
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/teams/${documentId}?populate=couverture`,
      { next: { revalidate: 3600 } }
    );
    
    if (!res.ok) {
      return {
        title: "Team non trouvée | Novel-Index",
        description: "Cette équipe de traduction n'existe pas ou a été supprimée.",
      };
    }

    const data = await res.json();
    const team = data.data;

    // Support des différents formats de couverture
    const coverUrl = typeof team.couverture === "string"
      ? team.couverture
      : team.couverture?.formats?.medium?.url || team.couverture?.formats?.small?.url || team.couverture?.url;

    return {
      title: `${team.titre} | Teams | Novel-Index`,
      description: team.description?.slice(0, 160) || `Découvrez l'équipe de traduction ${team.titre} sur Novel-Index.`,
      keywords: [team.titre, "team", "traduction", "webnovels", "light novels"],
      openGraph: {
        title: `${team.titre} | Novel-Index`,
        description: team.description?.slice(0, 160) || `Équipe de traduction ${team.titre}`,
        url: `https://www.novel-index.com/Teams/${fullParam}`,
        siteName: "Novel-Index",
        images: coverUrl ? [{ url: coverUrl, alt: team.titre }] : [],
        locale: "fr_FR",
        type: "profile",
      },
      twitter: {
        card: "summary_large_image",
        title: `${team.titre} | Novel-Index`,
        description: team.description?.slice(0, 160) || `Équipe de traduction ${team.titre}`,
        images: coverUrl ? [coverUrl] : [],
      },
      alternates: {
        canonical: `https://www.novel-index.com/Teams/${fullParam}`,
      },
    };
  } catch (error) {
    return {
      title: "Team | Novel-Index",
      description: "Découvrez cette équipe de traduction sur Novel-Index.",
    };
  }
}

export default async function TeamLayout({ children, params }) {
  const resolvedParams = await params;
  const fullParam = resolvedParams["documentId-slug"];
  const documentId = fullParam?.split("-")[0];
  
  let teamJsonLd = null;
  
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/teams/${documentId}?populate[0]=couverture&populate[1]=oeuvres&populate[2]=teamliens`,
      { next: { revalidate: 3600 } }
    );
    
    if (res.ok) {
      const data = await res.json();
      const team = data.data;

      // Support des différents formats de couverture
      const coverUrl = typeof team.couverture === "string"
        ? team.couverture
        : team.couverture?.formats?.medium?.url || team.couverture?.formats?.small?.url || team.couverture?.url;

      teamJsonLd = {
        "@context": "https://schema.org",
        "@type": "Organization",
        "name": team.titre,
        "description": team.description || `Équipe de traduction ${team.titre}`,
        "url": `https://www.novel-index.com/Teams/${fullParam}`,
        "logo": coverUrl || undefined,
        "sameAs": team.teamliens?.map(l => l.url).filter(Boolean) || [],
        "numberOfEmployees": {
          "@type": "QuantitativeValue",
          "name": "Œuvres traduites",
          "value": team.oeuvres?.length || 0
        }
      };
    }
  } catch (error) {
    console.error("Erreur lors de la génération du JSON-LD:", error);
  }

  return (
    <>
      {teamJsonLd && <JsonLd data={teamJsonLd} />}
      {children}
    </>
  );
}
