"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import FicheOeuvre from "./FicheOeuvre";
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
  const [cardsPerSlide, setCardsPerSlide] = useState(8);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    const checkScreenSize = () => {
      setCardsPerSlide(window.innerWidth < 740 ? 4 : 8);
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  useEffect(() => {
    const fetchOeuvresDuJour = async () => {
      setLoading(true);
      setError(null);

      try {
        const today = new Date().toISOString().split("T")[0];

        const response = await fetch(
          `${apiUrl}/api/oeuvres?filters[createdAt][$gte]=${today}T00:00:00&sort=createdAt:desc&populate=couverture`
        );
        const data = await response.json();

        if (!response.ok) throw new Error("Erreur lors de la récupération des œuvres.");

        const enriched = data.data.map((oeuvre) => ({
          ...oeuvre,
          couverture: oeuvre.couverture?.url || null,
          type: oeuvre.type || "Type inconnu",
          traduction: oeuvre.traduction || "Catégorie inconnue",
          createdAt: oeuvre.createdAt || new Date().toISOString(),
        }));

        setOeuvres(enriched);
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

  const filteredOeuvres = oeuvres.filter((oeuvre) => {
    if (selectedType === "Tout") return true;
    if (selectedType === "Novel") return ["Light novel", "Web novel"].includes(oeuvre.type);
    if (selectedType === "Scan/Webtoon") return ["Scan", "Webtoon"].includes(oeuvre.type);
    return false;
  });

  return (
    <div className="bg-gray-900 text-white p-[1rem]">
      <h2 className="text-3xl font-bold mb-6">Nouvelles Œuvres du Jour</h2>

      {error && <p className="text-red-500">{error}</p>}
      {oeuvres.length > 0 && (
        <p className="mb-4 text-indigo-400 text-sm font-medium">
          🎉 Il y a <span className="font-bold">{oeuvres.length}</span>{" "}
          œuvre{oeuvres.length > 1 ? "s" : ""} publié
          {oeuvres.length > 1 ? "es" : "e"} aujourd’hui
        </p>
      )}

      <div className="flex space-x-4 mb-6">
        {["Tout", "Novel", "Scan/Webtoon"].map((type) => (
          <button
            key={type}
            className={`px-4 py-2 rounded-md ${
              selectedType === type
                ? "bg-indigo-600"
                : "bg-gray-600 hover:bg-gray-700"
            } text-white`}
            onClick={() => setSelectedType(type)}
          >
            {type}
          </button>
        ))}
      </div>

      {!loading && !error && filteredOeuvres.length > 0 && (
        <Swiper
          slidesPerView={1}
          spaceBetween={10}
          pagination={{ clickable: true }}
          navigation={true}
          modules={[Pagination, Navigation]}
          className="mySwiper"
        >
          {Array.from(
            { length: Math.ceil(filteredOeuvres.length / cardsPerSlide) },
            (_, index) => (
              <SwiperSlide key={index}>
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {filteredOeuvres
                    .slice(index * cardsPerSlide, (index + 1) * cardsPerSlide)
                    .map((oeuvre, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5, delay: idx * 0.05 }}
                        className="relative bg-gray-800 rounded-lg shadow-lg overflow-hidden cursor-pointer"
                        onClick={() => handleOeuvreClick(oeuvre)}
                      >
                        {oeuvre.couverture ? (
                          <div
                            className="h-48 sm:h-64 bg-cover bg-center"
                            style={{
                              backgroundImage: `url(${oeuvre.couverture})`,
                            }}
                          ></div>
                        ) : (
                          <div className="h-48 sm:h-64 bg-gray-700 flex items-center justify-center text-gray-400">
                            Pas de couverture
                          </div>
                        )}
                        <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black via-gray-900 opacity-90 px-3 py-2">
                          <div className="flex flex-wrap gap-1 mb-1">
                            <span className="bg-black bg-opacity-70 text-white px-2 py-0.5 text-xs sm:text-sm rounded">
                              {oeuvre.type}
                            </span>
                            <span className="bg-black bg-opacity-70 text-white px-2 py-0.5 text-xs sm:text-sm rounded">
                              {oeuvre.traduction}
                            </span>
                          </div>
                          <p className="font-bold text-sm sm:text-base md:text-lg text-white truncate">
                            {oeuvre.titre || "Titre non disponible"}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                </div>
              </SwiperSlide>
            )
          )}
        </Swiper>
      )}

      {selectedData && (
        <FicheOeuvre oeuvre={selectedData} onClose={closeFicheOeuvre} />
      )}
    </div>
  );
};

export default SortieOeuvre;
