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
    const fetchSorties = async () => {
      try {
        const res = await fetch("/data/sorties-du-jour.json");
        const data = await res.json();
        setOeuvres(data);
      } catch (err) {
        console.error("Erreur JSON:", err);
        setError("Erreur lors du chargement des sorties du jour.");
      } finally {
        setLoading(false);
      }
    };
  
    fetchSorties();
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
                    backgroundImage: `url(${oeuvre.couverture.url})`,
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
