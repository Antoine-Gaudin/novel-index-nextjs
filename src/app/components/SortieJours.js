"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import FicheOeuvre from "./FicheOeuvre";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";

const SortieJours = () => {
  const [oeuvres, setOeuvres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedData, setSelectedData] = useState(null);
  const [selectedType, setSelectedType] = useState("Tout");
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const [cardsPerSlide, setCardsPerSlide] = useState(8);

  useEffect(() => {
    const checkScreenSize = () => {
      setCardsPerSlide(window.innerWidth < 740 ? 4 : 8);
    };
  
    checkScreenSize(); // run at mount
    window.addEventListener("resize", checkScreenSize);
  
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);
  



  useEffect(() => {
    const fetchOeuvresMisesAJour = async () => {
      setLoading(true);
      setError(null);
      setOeuvres([]);

      const today = new Date().toISOString().split("T")[0];
      const fetched = {};
      const pageSize = 100;
      let page = 0;
      let hasMore = true;

      try {
        // 🔁 Paginer les oeuvres avec chapitres mis à jour
        while (hasMore) {
          const res = await fetch(
            `${apiUrl}/api/oeuvres?fields[0]=documentId&fields[1]=titre&pagination[start]=${
              page * pageSize
            }&pagination[limit]=${pageSize}&populate[chapitres][filters][updatedAt][$gte]=${today}T00:00:00`
          );
          const data = await res.json();
          const oeuvresData = data?.data || [];

          if (oeuvresData.length === 0) {
            hasMore = false;
            break;
          }

          for (const oeuvre of oeuvresData) {
            const docId = oeuvre.documentId || oeuvre.id;
            const chapitres = oeuvre.chapitres || oeuvre?.chapitres?.data || [];

            if (chapitres.length > 0 && !fetched[docId]) {
              try {
                const enrichRes = await fetch(
                  `${apiUrl}/api/oeuvres/${docId}?populate=couverture`
                );
                const enrichJson = await enrichRes.json();

                const lastUpdatedChapitre = chapitres
                .map((c) => new Date(c.updatedAt))
                .sort((a, b) => b - a)[0]; // plus récent en premier
              
              const enriched = {
                documentId: docId,
                titre: oeuvre.titre || "Sans titre",
                couverture: enrichJson.data?.couverture?.url || null,
                type: enrichJson.data?.type || "Type inconnu",
                traduction: enrichJson.data?.traduction || "Catégorie inconnue",
                updatedAt: enrichJson.data?.updatedAt || new Date().toISOString(),
                lastChapitreUpdate: lastUpdatedChapitre?.toISOString() || null, // 👈 nouveau champ
              };
              

                fetched[docId] = true;
                setOeuvres((prev) => [...prev, enriched]);
                await new Promise((r) => setTimeout(r, 0));
              } catch (e) {
                console.error("Erreur enrichissement :", e);
              }
            }
          }

          page++;
        }

        // ➕ Ajouter les achats
        const achatRes = await fetch(
          `${apiUrl}/api/Achatlivres?filters[updatedAt][$gte]=${today}T00:00:00&populate=oeuvres`
        );
        const achatJson = await achatRes.json();
        const achats = achatJson?.data || [];

        for (const achat of achats) {
          const oeuvre = achat.oeuvres?.[0];
          if (!oeuvre || fetched[oeuvre.documentId]) continue;

          try {
            const enrichRes = await fetch(
              `${apiUrl}/api/oeuvres/${oeuvre.documentId}?populate=couverture`
            );
            const enrichJson = await enrichRes.json();

            const enriched = {
              ...oeuvre,
              couverture: enrichJson.data?.couverture?.url || null,
              type: enrichJson.data?.type || "Type inconnu",
              traduction: enrichJson.data?.traduction || "Catégorie inconnue",
              updatedAt: enrichJson.data?.updatedAt || new Date().toISOString(), // 👈 Ajout ici aussi
            };

            fetched[oeuvre.documentId] = true;
            setOeuvres((prev) => [...prev, enriched]);
            await new Promise((r) => setTimeout(r, 0));
          } catch (err) {
            console.error("Erreur enrichissement achat :", err);
          }
        }
      } catch (err) {
        console.error("Erreur :", err);
        setError("Erreur lors de la récupération des œuvres.");
      } finally {
        setLoading(false);
      }
    };

    fetchOeuvresMisesAJour();
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

  const sortedOeuvres = [...oeuvres].sort((a, b) => {
    const dateA = new Date(a.lastChapitreUpdate || a.updatedAt);
    const dateB = new Date(b.lastChapitreUpdate || b.updatedAt);
    return dateB - dateA;
  });
  
  
  const filteredOeuvres = sortedOeuvres.filter((oeuvre) => {
    if (selectedType === "Tout") return true;
    if (selectedType === "Novel")
      return ["Light novel", "Web novel"].includes(oeuvre.type);
    if (selectedType === "Scan/Webtoon")
      return ["Scan", "Webtoon"].includes(oeuvre.type);
    return false;
  });

  const getTimeAgo = (dateString) => {
    if (!dateString) return "-";
    const updated = new Date(dateString);
    const now = new Date();
    const diffMs = now - updated;
    const diffMins = Math.floor(diffMs / (1000 * 60));
  
    if (diffMins < 60) return `${diffMins} min`;
    const diffHours = Math.floor(diffMins / 60);
    return `${diffHours}h`;
  };
  
  

  return (
    <div className="bg-gray-900 text-white p-[1rem]">
      <h2 className="text-3xl font-bold mb-6">Sorties du jour</h2>

      {error && <p className="text-red-500">{error}</p>}
      
      {oeuvres.length > 0 && (
  <p className="mb-4 text-indigo-400 text-sm font-medium">
    🎉 Il y a <span className="font-bold">{oeuvres.length}</span> œuvre{oeuvres.length > 1 ? "s" : ""} mise{oeuvres.length > 1 ? "s" : ""} à jour aujourd’hui
  </p>
)}
      <div className="flex space-x-4 mb-6">
        <button
          className={`px-4 py-2 rounded-md ${
            selectedType === "Tout"
              ? "bg-indigo-600"
              : "bg-gray-600 hover:bg-gray-700"
          } text-white`}
          onClick={() => setSelectedType("Tout")}
        >
          Tout
        </button>
        <button
          className={`px-4 py-2 rounded-md ${
            selectedType === "Novel"
              ? "bg-indigo-600"
              : "bg-gray-600 hover:bg-gray-700"
          } text-white`}
          onClick={() => setSelectedType("Novel")}
        >
          Novel
        </button>
        <button
          className={`px-4 py-2 rounded-md ${
            selectedType === "Scan/Webtoon"
              ? "bg-indigo-600"
              : "bg-gray-600 hover:bg-gray-700"
          } text-white`}
          onClick={() => setSelectedType("Scan/Webtoon")}
        >
          Scan/Webtoon
        </button>
      </div>



      {oeuvres.length > 0 && (
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
      style={{ backgroundImage: `url(${oeuvre.couverture})` }}
    ></div>
  ) : (
    <div className="h-48 sm:h-64 bg-gray-700 flex items-center justify-center text-gray-400">
      Pas de couverture
    </div>
  )}
  <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black via-gray-900 opacity-90 px-3 py-2">
    <div className="flex flex-wrap gap-1 mb-1">
      <span className="bg-black bg-opacity-70 text-white px-2 py-0.5 text-xs sm:text-sm rounded">
        {oeuvre.type || "Type inconnu"}
      </span>
      <span className="bg-black bg-opacity-70 text-white px-2 py-0.5 text-xs sm:text-sm rounded">
        {oeuvre.traduction || "Traduction inconnue"}
      </span>
      <span className="bg-black bg-opacity-70 text-white px-2 py-0.5 text-xs sm:text-sm rounded">
  {getTimeAgo(oeuvre.lastChapitreUpdate)}
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

export default SortieJours;
