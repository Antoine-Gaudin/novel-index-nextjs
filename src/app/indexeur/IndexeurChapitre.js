"use client";

import { useState } from "react";
import axios from "axios";
import OneChapitre from "../addchapter/OneChapitre";
import PlusieursChapitre from "../addchapter/PlusieurChapitre";
import InfoChapitre from "../addchapter/InfoChapitre";
import RemonterInfo from "../addchapter/RemonterInfo";

const actionTabs = [
  { key: "OneChapitre", label: "Un chapitre" },
  { key: "PlusieursChapitre", label: "Plusieurs" },
  { key: "InfoChapitre", label: "Infos" },
  { key: "RemonterInfo", label: "Signaler" },
];

const IndexeurChapitre = ({ user }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedOeuvre, setSelectedOeuvre] = useState(null);
  const [activeSection, setActiveSection] = useState("OneChapitre");
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  const handleSearch = async () => {
    if (searchTerm.trim() === "") return;

    setLoading(true);
    try {
      const jwt = localStorage.getItem("jwt");
      const response = await axios.get(
        `${apiUrl}/api/oeuvres?populate=couverture&filters[titre][$containsi]=${searchTerm}`,
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
        return null;
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto bg-gray-900 p-8 rounded-2xl text-white">
      <h1 className="text-3xl font-bold mb-6 text-center">
        Indexer des Chapitres
      </h1>

      {/* Barre de recherche (toujours visible) */}
      <div className="flex mb-6">
        <input
          type="text"
          placeholder="Rechercher une oeuvre par son titre..."
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
          {loading ? "..." : "Rechercher"}
        </button>
      </div>

      {/* Resultats de recherche */}
      {!selectedOeuvre && (
        <div className="space-y-3">
          {results.length > 0
            ? results.map((oeuvre) => (
                <div
                  key={oeuvre.id}
                  onClick={() => {
                    setSelectedOeuvre(oeuvre);
                    setActiveSection("OneChapitre");
                  }}
                  className="flex items-center bg-gray-800 p-4 rounded-xl shadow hover:bg-gray-700 cursor-pointer transition"
                >
                  {oeuvre.couverture?.url ? (
                    <img
                      src={oeuvre.couverture.url}
                      alt={oeuvre.titre}
                      className="w-16 h-20 rounded-lg object-cover mr-4"
                    />
                  ) : (
                    <div className="w-16 h-20 bg-gray-600 rounded-lg mr-4 flex items-center justify-center text-gray-400 text-xs">
                      Pas d&apos;image
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
            : !loading && (
                <p className="text-center text-gray-500">
                  Recherchez une oeuvre pour commencer.
                </p>
              )}
        </div>
      )}

      {/* Oeuvre selectionnee : tabs d'actions + contenu */}
      {selectedOeuvre && (
        <>
          {/* En-tete oeuvre selectionnee */}
          <div className="flex items-center justify-between bg-gray-800 p-4 rounded-xl mb-4">
            <div className="flex items-center gap-3">
              {selectedOeuvre.couverture?.url && (
                <img
                  src={selectedOeuvre.couverture.url}
                  alt={selectedOeuvre.titre}
                  className="w-10 h-14 rounded object-cover"
                />
              )}
              <h2 className="text-lg font-bold">{selectedOeuvre.titre}</h2>
            </div>
            <button
              onClick={() => {
                setSelectedOeuvre(null);
                setActiveSection("OneChapitre");
              }}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm transition"
            >
              Changer
            </button>
          </div>

          {/* Tabs d'actions */}
          <div className="flex gap-2 mb-6 bg-gray-800/50 p-1.5 rounded-lg">
            {actionTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveSection(tab.key)}
                className={`flex-1 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                  activeSection === tab.key
                    ? "bg-indigo-600 text-white shadow"
                    : "text-gray-400 hover:text-white hover:bg-gray-700/50"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Contenu de l'action */}
          {renderContent()}
        </>
      )}
    </div>
  );
};

export default IndexeurChapitre;
