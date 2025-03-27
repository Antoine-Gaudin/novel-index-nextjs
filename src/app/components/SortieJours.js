"use client";

import { useState, useEffect } from "react";
import FicheOeuvre from "./FicheOeuvre"; // Import du composant FicheOeuvre
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";

const SortieJours = () => {
  const [oeuvres, setOeuvres] = useState([]); // Liste des œuvres mises à jour aujourd'hui
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedData, setSelectedData] = useState(null); // Données sélectionnées pour le pop-up
  const [selectedType, setSelectedType] = useState("Tout"); // Type sélectionné pour le filtrage

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    const fetchOeuvresMisesAJour = async () => {
      setLoading(true);
      setError(null);

      try {
        const today = new Date().toISOString().split("T")[0];

        // Étape 1 : Récupérer les chapitres et achats mis à jour aujourd'hui
        const chapitreResponse = await fetch(
          `${apiUrl}/api/chapitres?filters[updatedAt][$gte]=${today}T00:00:00&populate=oeuvres`
        );
        const chapitreData = await chapitreResponse.json();

        const achatResponse = await fetch(
          `${apiUrl}/api/Achatlivres?filters[updatedAt][$gte]=${today}T00:00:00&populate=oeuvres`
        );
        const achatData = await achatResponse.json();
  

        // Combiner les œuvres des deux requêtes
        const allOeuvres = [
          ...chapitreData.data.map((chapitre) => ({
            ...chapitre.oeuvres?.[0],
            typeSource: "chapitre",
            sourceData: chapitre, // Inclure les données du chapitre
          })),
          ...achatData.data.map((achat) => ({
            ...achat.oeuvres?.[0],
            typeSource: "achatlivre",
            sourceData: achat, // Inclure les données de l'achat
          })),
        ]
          .filter(Boolean) // Éliminer les valeurs nulles
          .reduce((acc, oeuvre) => {
            // Éviter les doublons en utilisant `documentId` comme clé unique
            if (!acc.some((o) => o.documentId === oeuvre.documentId)) {
              acc.push(oeuvre);
            }
            return acc;
          }, []);


          const fetched = {};
          const oeuvresAvecCouv = await Promise.all(
            allOeuvres.map(async (oeuvre) => {
              if (fetched[oeuvre.documentId]) return fetched[oeuvre.documentId];
          
              try {
                const res = await fetch(`${apiUrl}/api/oeuvres/${oeuvre.documentId}?populate=couverture`);
                const data = await res.json();
                const enriched = {
                  ...oeuvre,
                  couverture: data.data?.couverture?.url || null,
                  type: data.data?.type || "Type inconnu",
                  traduction: data.data?.traduction || "Catégorie inconnue",
                };
                fetched[oeuvre.documentId] = enriched;
                return enriched;
              } catch (err) {
                console.error("Erreur fetch :", err);
                return { ...oeuvre, couverture: null };
              }
            })
          );
          

        setOeuvres(oeuvresAvecCouv);
      } catch (err) {
        console.error("Erreur lors de la récupération des œuvres mises à jour :", err);
        setError("Une erreur est survenue lors de la récupération des œuvres mises à jour.");
      } finally {
        setLoading(false);
      }
    };

    fetchOeuvresMisesAJour();
  }, []);

  // Gestion du clic pour ouvrir le pop-up
  const handleOeuvreClick = (oeuvre) => {
    setSelectedData(oeuvre);
  };

  // Gestion de la fermeture du pop-up
  const closeFicheOeuvre = () => {
    setSelectedData(null);
  };

  const handleTypeChange = (type) => {
    setSelectedType(type);
  };
  
  const filteredOeuvres = oeuvres.filter((oeuvre) => {
    if (selectedType === "Tout") return true; // Affiche tout
    if (selectedType === "Novel") return ["Light novel", "Web novel"].includes(oeuvre.type);
    if (selectedType === "Scan/Webtoon") return ["Scan", "Webtoon"].includes(oeuvre.type);
    return false; // Aucun autre type n'est affiché
  });
  
  return (
    <div className="bg-gray-900 text-white p-8">
      <h2 className="text-3xl font-bold mb-6">Sorties du jour</h2>

      
      {error && <p className="text-red-500">{error}</p>}


<div className="flex space-x-4 mb-6">
  <button
    className={`px-4 py-2 rounded-md ${selectedType === "Tout" ? "bg-indigo-600" : "bg-gray-600 hover:bg-gray-700"} text-white`}
    onClick={() => setSelectedType("Tout")}
  >
    Tout
  </button>
  <button
    className={`px-4 py-2 rounded-md ${selectedType === "Novel" ? "bg-indigo-600" : "bg-gray-600 hover:bg-gray-700"} text-white`}
    onClick={() => setSelectedType("Novel")}
  >
    Novel
  </button>
  <button
    className={`px-4 py-2 rounded-md ${selectedType === "Scan/Webtoon" ? "bg-indigo-600" : "bg-gray-600 hover:bg-gray-700"} text-white`}
    onClick={() => setSelectedType("Scan/Webtoon")}
  >
    Scan/Webtoon
  </button>
</div>

{loading && <p>Chargement des œuvres mises à jour...</p>}

      {!loading && !error && oeuvres.length === 0 && (
        <p className="text-gray-400">Aucune mise à jour aujourd'hui.</p>
      )}

      {!loading && !error && oeuvres.length > 0 && (
        
<Swiper
  slidesPerView={1} // 1 slide actif à la fois
  spaceBetween={10} // Espacement entre les slides
  pagination={{ clickable: true }} // Pagination interactive
  navigation={true} // Flèches de navigation
  modules={[Pagination, Navigation]} // Activation des modules
  className="mySwiper"
>
  {Array.from({ length: Math.ceil(filteredOeuvres.length / 8) }, (_, index) => (
    <SwiperSlide key={index}>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {filteredOeuvres
          .slice(index * 8, (index + 1) * 8) // 8 éléments par slide
          .map((oeuvre, idx) => (
            <div
              key={idx}
              className="relative bg-gray-800 rounded-lg shadow-lg overflow-hidden cursor-pointer"
              onClick={() => handleOeuvreClick(oeuvre)}
            >
              {oeuvre.couverture ? (
                <div
                  className="h-64 bg-cover bg-center"
                  style={{
                    backgroundImage: `url(${oeuvre.couverture})`,
                  }}
                ></div>
              ) : (
                <div className="h-64 bg-gray-700 flex items-center justify-center text-gray-400">
                  Pas de couverture
                </div>
              )}
              <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black via-gray-900 opacity-90 px-4 py-2">
                <div className="flex space-x-2 mb-2">
                  <span className="bg-black bg-opacity-70 text-white px-3 py-1 text-sm rounded-md">
                    {oeuvre.type || "Type inconnu"}
                  </span>
                  <span className="bg-black bg-opacity-70 text-white px-3 py-1 text-sm rounded-md">
                    {oeuvre.traduction || "Traduction inconnue"}
                  </span>
                </div>
                <p className="font-bold text-lg text-white">
                  {oeuvre.titre || "Titre non disponible"}
                </p>
              </div>
            </div>
          ))}
      </div>
    </SwiperSlide>
  ))}
</Swiper>

      )}

      {/* Fiche Œuvre (Pop-up) */}
      {selectedData && (
        <FicheOeuvre
          oeuvre={selectedData} // Passe les informations de l'œuvre
          onClose={closeFicheOeuvre} // Passe la fonction de fermeture
        />
      )}
    </div>
  );
};

export default SortieJours;
