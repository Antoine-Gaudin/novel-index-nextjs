"use client";

import { useState, useEffect } from "react";
import FicheOeuvre from "./FicheOeuvre"; // Import du composant FicheOeuvre
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";

const OeuvresParTeam = () => {
  const [team, setTeam] = useState(null);
  const [oeuvres, setOeuvres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedData, setSelectedData] = useState(null);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    const fetchRandomTeam = async () => {
      setLoading(true);
      setError(null);

      try {

        // Récupérer toutes les teams avec leurs œuvres
        const response = await fetch(`${apiUrl}/api/teams?populate=oeuvres.couverture`);
        const data = await response.json();

        if (!response.ok || !data.data.length) {
          throw new Error("Aucune équipe trouvée avec des œuvres.");
        }

        // Filtrer les teams qui ont au moins 4 œuvres
        const teamsWithEnoughOeuvres = data.data.filter(team => team.oeuvres.length >= 4);

        if (teamsWithEnoughOeuvres.length === 0) {
          setLoading(false);
          return;
        }

        // Sélectionner une team aléatoire
        const randomTeam = teamsWithEnoughOeuvres[Math.floor(Math.random() * teamsWithEnoughOeuvres.length)];
        

        setTeam(randomTeam);
        setOeuvres(randomTeam.oeuvres);
      } catch (err) {
        setError("Impossible de récupérer une équipe avec des œuvres.");
      } finally {
        setLoading(false);
      }
    };

    fetchRandomTeam();
  }, []);

  const handleOeuvreClick = (oeuvre) => {
    setSelectedData(oeuvre);
  };

  const closeFicheOeuvre = () => {
    setSelectedData(null);
  };

  // **Ne rien afficher si aucune team n'a été trouvée ou a moins de 4 œuvres**
  if (!loading && !error && (!team || oeuvres.length < 4)) {
    return null;
  }

  return (
    <div className="bg-gray-900 text-white p-8">

      {!loading && !error && team && (
        <>
          <h2 className="text-3xl font-bold mb-6">Œuvres de l'équipe {team.titre}</h2>
          <p className="mb-4 text-gray-400">{team.description}</p>

          {/* Slider Swiper.js */}
          <Swiper
            slidesPerView={1}
            spaceBetween={10}
            pagination={{ clickable: true }}
            navigation={true}
            modules={[Pagination, Navigation]}
            className="mySwiper"
          >
            {Array.from({ length: Math.ceil(oeuvres.length / 8) }, (_, index) => (
              <SwiperSlide key={index}>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {oeuvres
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

          {/* Fiche Œuvre (Pop-up) */}
          {selectedData && <FicheOeuvre oeuvre={selectedData} onClose={closeFicheOeuvre} />}
        </>
      )}
    </div>
  );
};

export default OeuvresParTeam;
