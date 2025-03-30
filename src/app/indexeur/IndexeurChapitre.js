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
    if (searchTerm.trim() === "") return;

    setLoading(true);
    try {
      const jwt = localStorage.getItem("jwt");
      const response = await axios.get(
        `https://novel-index-strapi.onrender.com/api/oeuvres?populate=couverture&filters[titre][$containsi]=${searchTerm}`,
        {
          headers: { Authorization: `Bearer ${jwt}` },
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
    if (e.key === "Enter") handleSearch();
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            {[
              {
                key: "OneChapitre",
                label: "➕ Ajouter un chapitre",
              },
              {
                key: "PlusieursChapitre",
                label: "📚 Ajouter plusieurs chapitres",
              },
              {
                key: "InfoChapitre",
                label: "ℹ️ Infos chapitre",
              },
              {
                key: "RemonterInfo",
                label: "🚩 Remonter une information",
              },
            ].map((btn) => (
              <button
                key={btn.key}
                onClick={() => setActiveSection(btn.key)}
                className="bg-indigo-600 hover:bg-indigo-700 transition text-white rounded-xl p-4 shadow text-lg font-medium"
              >
                {btn.label}
              </button>
            ))}
          </div>
        );
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto bg-gray-900 p-8 rounded-2xl text-white">
      <h1 className="text-3xl font-bold mb-8 text-center">📘 Indexer des Chapitres</h1>

      {!selectedOeuvre && (
        <>
          {/* Barre de recherche */}
          <div className="flex mb-6">
            <input
              type="text"
              placeholder="🔍 Rechercher une œuvre par son titre..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-grow p-3 bg-gray-800 border border-gray-700 rounded-l-xl focus:outline-none text-sm"
            />
            <button
              onClick={handleSearch}
              disabled={loading}
              className="px-5 py-3 bg-indigo-600 hover:bg-indigo-700 transition rounded-r-xl font-semibold"
            >
              {loading ? "Recherche..." : "Rechercher"}
            </button>
          </div>

          {/* Résultats de recherche */}
          <div className="space-y-4">
            {results.length > 0 ? (
              results.map((oeuvre) => (
                <div
                  key={oeuvre.id}
                  onClick={() => setSelectedOeuvre(oeuvre)}
                  className="flex items-center bg-gray-800 p-4 rounded-xl shadow hover:bg-gray-700 cursor-pointer transition"
                >
                  {oeuvre.couverture?.url ? (
                    <img
                      src={oeuvre.couverture.url}
                      alt={oeuvre.titre}
                      className="w-16 h-20 rounded-lg object-cover mr-4"
                    />
                  ) : (
                    <div className="w-16 h-20 bg-gray-600 rounded-lg mr-4 flex items-center justify-center text-gray-400">
                      📄
                    </div>
                  )}
                  <div>
                    <h2 className="text-lg font-semibold">{oeuvre.titre}</h2>
                    <p className="text-sm text-gray-400">
                      {oeuvre.titrealt || "Pas de titre alternatif"}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500">
                {loading ? "Recherche en cours..." : "Aucun résultat trouvé."}
              </p>
            )}
          </div>
        </>
      )}

      {selectedOeuvre && (
        <>
          <h2 className="text-2xl font-bold mb-6 text-center">
            {selectedOeuvre.titre}
          </h2>

          {renderContent()}

          <div className="mt-8 text-center">
            <button
              onClick={() => {
                setSelectedOeuvre(null);
                setActiveSection("default");
              }}
              className="px-6 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition"
            >
              ⬅️ Retour à la recherche
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default IndexeurChapitre;
