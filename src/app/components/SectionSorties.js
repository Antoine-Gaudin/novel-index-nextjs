"use client";

import { useState, useEffect } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";
import OeuvreCard from "./OeuvreCard";
import FicheOeuvre from "./FicheOeuvre";

const SkeletonCard = () => (
  <div className="relative bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-lg overflow-hidden animate-pulse border border-gray-700/30">
    <div className="h-48 sm:h-64 bg-gray-700/50" />
    <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black via-gray-900/95 to-transparent px-3 py-3 space-y-2">
      <div className="flex gap-1.5">
        <div className="h-5 w-14 bg-indigo-600/30 rounded-full" />
        <div className="h-5 w-16 bg-purple-600/30 rounded-full" />
      </div>
      <div className="h-5 w-3/4 bg-gray-600/50 rounded" />
    </div>
  </div>
);

const SectionSorties = ({
  titre,
  oeuvres,
  loading,
  error,
  showTimeAgo = false,
  emptyMessage = "Aucune sortie pour le moment.",
  countLabel = null,
  accentColor = "indigo",
}) => {
  const [selectedType, setSelectedType] = useState("Tout");
  const [selectedData, setSelectedData] = useState(null);
  const [cardsPerSlide, setCardsPerSlide] = useState(8);

  useEffect(() => {
    const checkScreenSize = () => {
      setCardsPerSlide(window.innerWidth < 740 ? 4 : 8);
    };
    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  const filteredOeuvres = oeuvres.filter((oeuvre) => {
    if (selectedType === "Tout") return true;
    if (selectedType === "Novel")
      return ["Light novel", "Web novel"].includes(oeuvre.type);
    if (selectedType === "Scan/Webtoon")
      return ["Scan", "Webtoon"].includes(oeuvre.type);
    return false;
  });

  const accentClasses = {
    indigo: { active: "bg-indigo-600", border: "border-l-indigo-500" },
    amber: { active: "bg-amber-600", border: "border-l-amber-500" },
    emerald: { active: "bg-emerald-600", border: "border-l-emerald-500" },
  };
  const accent = accentClasses[accentColor] || accentClasses.indigo;

  return (
    <section className="bg-gray-900 text-white p-4" aria-labelledby={`section-${accentColor}`}>
      <h2 id={`section-${accentColor}`} className={`text-3xl font-bold mb-6 border-l-4 pl-4 ${accent.border}`}>{titre}</h2>

      {error && <p className="text-red-500">{error}</p>}

      {!loading && !error && oeuvres.length > 0 && countLabel && (
        <p className="mb-4 text-indigo-400 text-sm font-medium">
          {countLabel(oeuvres.length)}
        </p>
      )}

      <div className="flex space-x-4 mb-6">
        {["Tout", "Novel", "Scan/Webtoon"].map((type) => (
          <button
            key={type}
            className={`px-4 py-2 rounded-md ${
              selectedType === type
                ? accent.active
                : "bg-gray-600 hover:bg-gray-700"
            } text-white`}
            aria-pressed={selectedType === type}
            onClick={() => setSelectedType(type)}
          >
            {type}
          </button>
        ))}
      </div>

      {/* Skeleton loading */}
      {loading && (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      )}

      {/* Etat vide */}
      {!loading && !error && oeuvres.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg">{emptyMessage}</p>
        </div>
      )}

      {/* Grille Swiper */}
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
                      <OeuvreCard
                        key={oeuvre.documentId || idx}
                        oeuvre={oeuvre}
                        index={idx}
                        onClick={setSelectedData}
                        showTimeAgo={showTimeAgo}
                      />
                    ))}
                </div>
              </SwiperSlide>
            )
          )}
        </Swiper>
      )}

      {/* Filtre vide après filtrage */}
      {!loading && !error && oeuvres.length > 0 && filteredOeuvres.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p>Aucune œuvre dans cette catégorie.</p>
        </div>
      )}

      {selectedData && (
        <FicheOeuvre
          oeuvre={selectedData}
          onClose={() => setSelectedData(null)}
        />
      )}
    </section>
  );
};

export default SectionSorties;
