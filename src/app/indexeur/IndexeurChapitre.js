"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import axios from "axios";
import OneChapitre from "../addchapter/OneChapitre";
import PlusieursChapitre from "../addchapter/PlusieurChapitre";
import InfoChapitre from "../addchapter/InfoChapitre";
import RemonterInfo from "../addchapter/RemonterInfo";

const IndexeurChapitre = ({ user }) => {
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedOeuvre, setSelectedOeuvre] = useState(null);
  const [activeSection, setActiveSection] = useState("default");

  useEffect(() => {
    console.log("Utilisateur reçu :", user);
  }, [user]);

  const handleSearch = async () => {
    if (searchTerm.trim() === "") {
      console.log("Recherche ignorée : champ vide.");
      return;
    }

    setLoading(true);
    try {
      const jwt = localStorage.getItem("jwt") || Cookies.get("jwt");
      const response = await axios.get(
        `https://novel-index-strapi.onrender.com/api/oeuvres?populate=couverture&filters[titre][$containsi]=${searchTerm}`,
        {
          headers: {
            Authorization: `Bearer ${jwt}`,
          },
        }
      );

      setResults(response.data.data || []);
    } catch (error) {
      console.error("Erreur lors de la recherche :", error);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const renderContent = () => {
    switch (activeSection) {
      case "OneChapitre":
        return <OneChapitre user={user} oeuvre={selectedOeuvre} />;
      case "PlusieursChapitre":
        return <PlusieursChapitre user={user} oeuvre={selectedOeuvre} />;
      case "InfoChapitre":
        return <InfoChapitre user={user} oeuvre={selectedOeuvre} />;
      case "RemonterInfo":
        return <RemonterInfo user={user} oeuvre={selectedOeuvre} />;
      default:
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              onClick={() => setActiveSection("OneChapitre")}
              className="p-4 bg-indigo-600 text-white rounded-lg shadow hover:bg-indigo-700"
            >
              Ajouter un chapitre
            </button>
            <button
              onClick={() => setActiveSection("PlusieursChapitre")}
              className="p-4 bg-indigo-600 text-white rounded-lg shadow hover:bg-indigo-700"
            >
              Ajouter plusieurs chapitres
            </button>
            <button
              onClick={() => setActiveSection("InfoChapitre")}
              className="p-4 bg-indigo-600 text-white rounded-lg shadow hover:bg-indigo-700"
            >
              Info Chapitre
            </button>
            <button
              onClick={() => setActiveSection("RemonterInfo")}
              className="p-4 bg-indigo-600 text-white rounded-lg shadow hover:bg-indigo-700"
            >
              Remonter une information
            </button>
          </div>
        );
    }
  };

  return (
    <div className="w-full max-w-4xl bg-gray-800 p-6 rounded-lg shadow-lg">
      <h1 className="text-3xl font-bold mb-6 text-center">Indexer des Chapitres</h1>

      {!selectedOeuvre && (
        <>
          {/* Barre de recherche */}
          <div className="flex items-center mb-6">
            <input
              type="text"
              placeholder="Recherchez une œuvre par son titre pour ajouter ou gérer ses chapitres"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleKeyDown} // Déclenche la recherche en appuyant sur Entrée
              className="flex-grow p-2 bg-gray-700 text-white border border-gray-600 rounded-l-lg focus:outline-none"
            />
            <button
              onClick={handleSearch}
              className="px-4 py-2 bg-indigo-600 text-white rounded-r-lg hover:bg-indigo-700"
              disabled={loading}
            >
              {loading ? "Recherche..." : "Rechercher"}
            </button>
          </div>

          {/* Résultats */}
          <div className="space-y-4">
            {results.length > 0 ? (
              results.map((oeuvre) => (
                <div
                  key={oeuvre.id}
                  className="flex items-center bg-gray-700 p-4 rounded-lg shadow-md cursor-pointer hover:bg-gray-600 transition"
                  onClick={() => setSelectedOeuvre(oeuvre)}
                >
                  {oeuvre.couverture?.url ? (
                    <img
                      src={`${oeuvre.couverture.url}`}
                      alt={oeuvre.titre}
                      className="w-16 h-16 rounded-lg mr-4 object-cover"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-gray-600 rounded-lg mr-4"></div>
                  )}
                  <div>
                    <h2 className="text-lg font-semibold text-white">{oeuvre.titre}</h2>
                    <p className="text-sm text-gray-400">
                      {oeuvre.titrealt || "Pas de titre alternatif"}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-400">
                {loading ? "Recherche en cours..." : "Aucun résultat trouvé."}
              </p>
            )}
          </div>
        </>
      )}

      {/* Afficher les options pour l'œuvre sélectionnée */}
      {selectedOeuvre && (
        <>
          <h2 className="text-2xl font-bold text-white mb-4 text-center">
            {selectedOeuvre.titre}
          </h2>
          {renderContent()}
          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setSelectedOeuvre(null);
                setActiveSection("default");
              }}
              className="p-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              Retour à la recherche
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default IndexeurChapitre;
