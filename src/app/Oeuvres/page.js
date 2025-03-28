"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation"; // Import du router pour la redirection

export default function Oeuvres() {
  const [oeuvres, setOeuvres] = useState([]);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const router = useRouter(); // Initialisation du router

  useEffect(() => {
    const fetchOeuvresProgressif = async () => {
      const pageSize = 30;
      let page = 0;
      let hasMore = true;
  
      while (hasMore) {
        try {
          const res = await fetch(`${apiUrl}/api/oeuvres?populate=couverture&pagination[start]=${page * pageSize}&pagination[limit]=${pageSize}`);
          const data = await res.json();
          const results = data.data || [];
  
          if (results.length === 0) {
            hasMore = false;
            break;
          }
  
          for (const oeuvre of results) {
            setOeuvres(prev => [...prev, oeuvre]);
            await new Promise((r) => setTimeout(r, 0)); // Forcer le re-render à chaque ajout
          }
  
          page++;
        } catch (error) {
          console.error("Erreur lors du chargement progressif :", error);
          hasMore = false;
        }
      }
    };
  
    setOeuvres([]); // vide d'abord
    fetchOeuvresProgressif();
  }, []);
  


  const handleOeuvreClick = (oeuvre) => {
    const slug = oeuvre.titre
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-") // Remplace les caractères spéciaux par "-"
      .replace(/^-+|-+$/g, ""); // Supprime les tirets en trop
  
    router.push(`/oeuvre/${oeuvre.documentId}-${slug}`); // ✅ Nouvelle URL
  };
  

  return (
    <div className="bg-gray-900 text-white p-8 min-h-screen">
      <h2 className="text-3xl font-bold mb-6">Liste des œuvres</h2>
      {oeuvres.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {oeuvres.map((oeuvre) => (
            <div
              key={oeuvre.id}
              className="relative bg-gray-800 rounded-lg shadow-lg overflow-hidden cursor-pointer"
              onClick={() => handleOeuvreClick(oeuvre)} // Redirection au clic
            >
              {/* Image de couverture */}
              {oeuvre.couverture?.url ? (
                <div
                  className="h-64 bg-cover bg-center"
                  style={{
                    backgroundImage: `url('${oeuvre.couverture.url}')`,
                  }}
                ></div>
              ) : (
                <div className="h-64 bg-gray-700 flex items-center justify-center text-gray-400">
                  Pas de couverture
                </div>
              )}

              {/* Type, Catégorie et Titre */}
              <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black via-gray-900 opacity-90 px-4 py-2">
                <div className="flex space-x-2 mb-2">
                  <span className="bg-black bg-opacity-70 text-white px-3 py-1 text-sm rounded-md">
                    {oeuvre.type || "Type non spécifié"}
                  </span>
                  <span className="bg-black bg-opacity-70 text-white px-3 py-1 text-sm rounded-md">
                    {oeuvre.categorie || "Catégorie non spécifiée"}
                  </span>
                </div>
                <p className="font-bold text-lg text-white">
                  {oeuvre.titre || "Titre non disponible"}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-400">Aucune œuvre disponible pour le moment.</p>
      )}
    </div>
  );
}
