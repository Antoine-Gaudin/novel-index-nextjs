"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { slugify } from "@/utils/slugify";

export default function OeuvresParTagOuGenre() {
  const { type, slug } = useParams();
  const [titre, setTitre] = useState("");
  const [oeuvres, setOeuvres] = useState([]);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    const fetchAndMatch = async () => {
      try {
        const res = await fetch(
          `${apiUrl}/api/${type === "tag" ? "tags" : "genres"}?populate[oeuvres][populate][0]=couverture`
        );
        const data = await res.json();
        const items = data.data || [];

        const matched = items.find((item) => slugify(item.titre) === slug);

        if (!matched) {
          setTitre("Introuvable");
          setOeuvres([]);
          return;
        }

        setTitre(matched.titre);
        setOeuvres(matched.oeuvres || []);
      } catch (err) {
        console.error("Erreur chargement œuvres :", err);
      }
    };

    fetchAndMatch();
  }, [type, slug]);

  const getTimeAgo = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    if (isNaN(diff)) return "inconnu";
    if (diff === 0) return "aujourd'hui";
    if (diff === 1) return "il y a 1 jour";
    return `il y a ${diff} jours`;
  };

  return (
    <div className="bg-gray-900 text-white p-6 min-h-screen">
      <h1 className="text-3xl font-bold mb-6">
        Œuvres avec le {type === "tag" ? "tag" : "genre"} : {titre}
      </h1>

      {oeuvres.length === 0 ? (
        <p className="text-gray-400">Aucune œuvre trouvée.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {oeuvres.map((oeuvre, idx) => (
            <motion.div
              key={oeuvre.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: idx * 0.05 }}
              className="relative bg-gray-800 rounded-lg shadow-lg overflow-hidden cursor-pointer"
              onClick={() => window.open(`/oeuvre/${oeuvre.documentId}`, "_blank")}
            >
              {oeuvre.couverture?.url ? (
                <div
                  className="h-48 sm:h-64 bg-cover bg-center"
                  style={{ backgroundImage: `url(${oeuvre.couverture.url})` }}
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
                  {oeuvre.lastChapitreUpdate && (
                    <span className="bg-black bg-opacity-70 text-white px-2 py-0.5 text-xs sm:text-sm rounded">
                      {getTimeAgo(oeuvre.lastChapitreUpdate)}
                    </span>
                  )}
                </div>
                <p className="font-bold text-sm sm:text-base md:text-lg text-white truncate">
                  {oeuvre.titre || "Titre non disponible"}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
