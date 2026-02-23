import { cache } from "react";
import { slugify } from "@/utils/slugify";
import JsonLd from "@/app/components/JsonLd";

// Dédupliquer le fetch oeuvre entre generateMetadata et OeuvreLayout
const getOeuvre = cache(async (id) => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const fetchUrl = `${apiUrl}/api/oeuvres/${id}?populate[0]=couverture&populate[1]=tags&populate[2]=genres`;
  const res = await fetch(fetchUrl, { next: { revalidate: 3600 } });
  if (!res.ok) return null;
  const data = await res.json();
  return data.data || null;
});

// ✅ SSR Metadata - Génération côté serveur
export async function generateMetadata({ params }) {
  try {
    const resolvedParams = await params;
    
    // Next.js avec le dossier [documentId]-[slug] renvoie le segment complet
    const fullSegment = resolvedParams?.['documentId]-[slug'] || 
                        resolvedParams?.documentId || 
                        Object.values(resolvedParams || {})[0];
    
    if (!fullSegment || typeof fullSegment !== 'string') {
      return {
        title: "Novel-Index",
        description: "Plateforme d'indexation collaborative.",
      };
    }
    
    // Extraire le documentId (partie avant le premier tiret)
    const id = fullSegment.split("-")[0];
    
    const oeuvre = await getOeuvre(id);

    if (!oeuvre) {
      return {
        title: "Œuvre introuvable | Novel-Index",
        description: "Cette œuvre n'existe pas ou a été supprimée.",
      };
    }

    const slug = slugify(oeuvre.titre);
    const canonicalUrl = `https://www.novel-index.com/oeuvre/${oeuvre.documentId}-${slug}`;
    const typeLabel = oeuvre.type ? ` - ${oeuvre.type}` : "";
    const rawDesc = oeuvre.synopsis || "Découvrez cette œuvre sur Novel-Index.";
    const description = rawDesc.length > 155 ? rawDesc.substring(0, 152) + "..." : rawDesc;
    const imageUrl = oeuvre.couverture?.url || "https://www.novel-index.com/logo.png";

    return {
      title: `${oeuvre.titre}${typeLabel} | Novel-Index`,
      description,
      alternates: {
        canonical: canonicalUrl,
      },
      openGraph: {
        title: `${oeuvre.titre}${typeLabel} | Novel-Index`,
        description,
        url: canonicalUrl,
        siteName: "Novel-Index",
        images: [{ url: imageUrl, alt: oeuvre.titre }],
        locale: "fr_FR",
        type: "article",
      },
      twitter: {
        card: "summary_large_image",
        title: `${oeuvre.titre}${typeLabel} | Novel-Index`,
        description,
        images: [imageUrl],
      },
    };
  } catch (error) {
    console.error("[Metadata] Erreur generateMetadata:", error);
    return {
      title: "Novel-Index",
      description: "Plateforme d'indexation collaborative.",
    };
  }
}

export default async function OeuvreLayout({ children, params }) {
  // Récupérer les données de l'œuvre pour le JSON-LD
  try {
    const resolvedParams = await params;
    const fullSegment = resolvedParams?.['documentId]-[slug'] || 
                        resolvedParams?.documentId || 
                        Object.values(resolvedParams || {})[0];
    
    if (fullSegment && typeof fullSegment === 'string') {
      const id = fullSegment.split("-")[0];
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      
      // Utilise le cache dédupliqué — même fetch que generateMetadata
      const oeuvre = await getOeuvre(id);
        
        if (oeuvre) {
          const slug = slugify(oeuvre.titre);
          const canonicalUrl = `https://www.novel-index.com/oeuvre/${oeuvre.documentId}-${slug}`;
          
          // Construire l'URL de l'image de couverture
          const imageUrl = oeuvre.couverture?.url
            ? (oeuvre.couverture.url.startsWith('http') ? oeuvre.couverture.url : `${apiUrl}${oeuvre.couverture.url}`)
            : "https://www.novel-index.com/logo.png";

          // Récupérer les commentaires pour le JSON-LD Review
          let reviews = [];
          try {
            const commentsRes = await fetch(
              `${apiUrl}/api/commentaires?filters[oeuvres][documentId]=${oeuvre.documentId}&populate=users_permissions_users`,
              { next: { revalidate: 3600 } }
            );
            if (commentsRes.ok) {
              const commentsData = await commentsRes.json();
              reviews = commentsData.data?.slice(0, 10).map((comment) => ({
                "@type": "Review",
                "author": {
                  "@type": "Person",
                  "name": comment.users_permissions_users?.[0]?.username || "Utilisateur"
                },
                "reviewBody": comment.commentaire,
                "datePublished": comment.createdAt
              })) || [];
            }
          } catch (error) {
            console.error("[OeuvreLayout] Erreur récupération commentaires:", error);
          }

          // JSON-LD pour Book/CreativeWork
          const bookJsonLd = {
            "@context": "https://schema.org",
            "@type": oeuvre.type === "Roman" ? "Book" : "CreativeWork",
            "name": oeuvre.titre,
            "description": oeuvre.synopsis || `Découvrez ${oeuvre.titre} sur Novel-Index`,
            "url": canonicalUrl,
            "image": imageUrl,
            "inLanguage": "fr",
            "genre": oeuvre.genres?.map(g => g.titre).join(", ") || undefined,
            "keywords": oeuvre.tags?.map(t => t.titre).join(", ") || undefined,
            "workExample": oeuvre.statut ? {
              "@type": "Book",
              "bookFormat": "https://schema.org/EBook",
              "inLanguage": "fr"
            } : undefined,
            "datePublished": oeuvre.createdAt,
            "dateModified": oeuvre.updatedAt,
            "publisher": {
              "@type": "Organization",
              "name": "Novel-Index",
              "url": "https://www.novel-index.com"
            },
            // Ajouter les reviews s'il y en a
            "review": reviews.length > 0 ? reviews : undefined
          };

          // Nettoyer les propriétés undefined
          Object.keys(bookJsonLd).forEach(key => 
            bookJsonLd[key] === undefined && delete bookJsonLd[key]
          );

          // JSON-LD pour BreadcrumbList (fil d'Ariane)
          const breadcrumbJsonLd = {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
              {
                "@type": "ListItem",
                "position": 1,
                "name": "Accueil",
                "item": "https://www.novel-index.com"
              },
              {
                "@type": "ListItem",
                "position": 2,
                "name": "Œuvres",
                "item": "https://www.novel-index.com/Oeuvres"
              },
              {
                "@type": "ListItem",
                "position": 3,
                "name": oeuvre.titre,
                "item": canonicalUrl
              }
            ]
          };

          return (
            <>
              <JsonLd data={bookJsonLd} />
              <JsonLd data={breadcrumbJsonLd} />
              {children}
            </>
          );
        }
    }
  } catch (error) {
    console.error("[OeuvreLayout] Erreur lors de la génération du JSON-LD:", error);
  }

  // Fallback si erreur ou pas de données
  return children;
}