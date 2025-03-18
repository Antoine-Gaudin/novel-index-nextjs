"use client";

import { useState, useEffect } from "react";
import FicheOeuvre from "./FicheOeuvre"; // Import du composant FicheOeuvre
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";

const SortieOeuvre = () => {
  const [oeuvres, setOeuvres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedData, setSelectedData] = useState(null);
  const [selectedType, setSelectedType] = useState("Tout");

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    const fetchOeuvresDuJour = async () => {
      setLoading(true);
      setError(null);

      try {
        const today = new Date().toISOString().split("T")[0];

        // Récupérer les œuvres créées aujourd'hui
        const response = await fetch(
          `${apiUrl}/api/oeuvres?filters[createdAt][$gte]=${today}T00:00:00&sort=createdAt:desc&populate=couverture`
        );
        const data = await response.json();

        if (!response.ok) {
          throw new Error("Erreur lors de la récupération des œuvres.");
        }

        setOeuvres(data.data);
      } catch (err) {
        setError("Impossible de récupérer les sorties du jour.");
        console.error("Erreur lors du fetch :", err);
      } finally {
        setLoading(false);
      }
    };

    fetchOeuvresDuJour();
  }, []);

  const handleOeuvreClick = (oeuvre) => {
    setSelectedData(oeuvre);
  };

  const closeFicheOeuvre = () => {
    setSelectedData(null);
  };

  const handleTypeChange = (type) => {
    setSelectedType(type);
  };

  // Filtrer les œuvres en fonction du type sélectionné
  const filteredOeuvres = oeuvres.filter((oeuvre) => {
    if (selectedType === "Tout") return true;
    if (selectedType === "Novel") return ["Light novel", "Web novel"].includes(oeuvre.type);
    if (selectedType === "Scan/Webtoon") return ["Scan", "Webtoon"].includes(oeuvre.type);
    return false;
  });

 /* // **Ne rien afficher si aucune œuvre n'est disponible**
  if (!loading && !error && filteredOeuvres.length === 0) {
    return null;
  }*/

  return (
    <div className="bg-gray-900 text-white p-8">
      <h2 className="text-3xl font-bold mb-6">Nouvelles Œuvres du Jour</h2>

      {loading && <p>Chargement des nouvelles œuvres...</p>}
      {error && <p className="text-red-500">{error}</p>}

      {/* Boutons de filtre */}
      <div className="flex space-x-4 mb-6">
        <button
          className={`px-4 py-2 rounded-md ${
            selectedType === "Tout" ? "bg-indigo-600" : "bg-gray-600 hover:bg-gray-700"
          } text-white`}
          onClick={() => setSelectedType("Tout")}
        >
          Tout
        </button>
        <button
          className={`px-4 py-2 rounded-md ${
            selectedType === "Novel" ? "bg-indigo-600" : "bg-gray-600 hover:bg-gray-700"
          } text-white`}
          onClick={() => setSelectedType("Novel")}
        >
          Novel
        </button>
        <button
          className={`px-4 py-2 rounded-md ${
            selectedType === "Scan/Webtoon" ? "bg-indigo-600" : "bg-gray-600 hover:bg-gray-700"
          } text-white`}
          onClick={() => setSelectedType("Scan/Webtoon")}
        >
          Scan/Webtoon
        </button>
      </div>

      {/* Slider Swiper.js */}
      {!loading && !error && filteredOeuvres.length > 0 && (
        <Swiper
          slidesPerView={1}
          spaceBetween={10}
          pagination={{ clickable: true }}
          navigation={true}
          modules={[Pagination, Navigation]}
          className="mySwiper"
        >
          {Array.from({ length: Math.ceil(filteredOeuvres.length / 8) }, (_, index) => (
            <SwiperSlide key={index}>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {filteredOeuvres
                  .slice(index * 8, (index + 1) * 8)
                  .map((oeuvre, idx) => (
                    <div
                      key={idx}
                      className="relative bg-gray-800 rounded-lg shadow-lg overflow-hidden cursor-pointer"
                      onClick={() => handleOeuvreClick(oeuvre)}
                    >
                      {oeuvre.couverture?.url ? (
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
      {selectedData && <FicheOeuvre oeuvre={selectedData} onClose={closeFicheOeuvre} />}
    </div>
  );
};

export default SortieOeuvre;
