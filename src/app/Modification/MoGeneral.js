"use client";

import React, { useState } from "react";
import axios from "axios";
import MoOeuvre from "./MoOeuvre";
import MoChapitre from "./MoChapitre";

const MoGeneral = ({ user }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [oeuvres, setOeuvres] = useState([]);
  const [selectedOeuvre, setSelectedOeuvre] = useState(null);
  const [activeSection, setActiveSection] = useState(null); // Gère le contenu affiché (oeuvre ou chapitre)
  const [message, setMessage] = useState(null);

  const handleSearch = async (e) => {
    e.preventDefault();

    try {
      const jwt = localStorage.getItem("jwt");
      if (!jwt) {
        setMessage("Vous devez être connecté pour effectuer cette recherche.");
        return;
      }

      const response = await axios.get(
        `https://novel-index-strapi.onrender.com/api/oeuvres?populate=couverture&filters[titre][$containsi]=${searchTerm}`,
        {
          headers: { Authorization: `Bearer ${jwt}` },
        }
      );

      setOeuvres(response.data.data || []);
      setMessage(null);
    } catch (error) {
      console.error("Erreur lors de la recherche :", error.response?.data || error.message);
      setMessage("Erreur lors de la recherche des œuvres.");
    }
  };

  const handleSelectOeuvre = async (oeuvre) => {
    setSelectedOeuvre(oeuvre);
    setActiveSection("oeuvre"); // Par défaut, afficher la section "Modifier l'œuvre"
  };

  const renderContent = () => {
    if (activeSection === "oeuvre") {
      return <MoOeuvre user={user} oeuvre={selectedOeuvre} />;
    } else if (activeSection === "chapitres") {
      return <MoChapitre user={user} oeuvre={selectedOeuvre} />;
    } else {
      return (
        <p className="text-gray-300">
          Veuillez sélectionner une section à modifier.
        </p>
      );
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto bg-gray-800 p-6 rounded-lg shadow-lg text-white space-y-6">
      <h2 className="text-2xl font-bold mb-4">Modifier Œuvres et Chapitres</h2>
  
      {/* Barre de recherche */}
      <form onSubmit={handleSearch} className="space-y-4">
        <div>
          <label htmlFor="searchTerm" className="block text-sm font-medium">
            Recherche d'une œuvre
          </label>
          <input
            type="text"
            id="searchTerm"
            name="searchTerm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="mt-1 block w-full p-2 bg-gray-700 border border-gray-600 rounded-lg"
            placeholder="Recherchez une œuvre par titre..."
          />
        </div>
        <button
          type="submit"
          className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-white font-bold"
        >
          Rechercher
        </button>
      </form>
  
      {/* Liste des œuvres trouvées */}
      {oeuvres.length > 0 && (
        <div>
          <h3 className="text-xl font-bold mb-2">Œuvres trouvées :</h3>
          <ul className="grid md:grid-cols-2 gap-4">
            {oeuvres.map((oeuvre) => {
              const couvertureUrl = oeuvre?.couverture?.url;
  
              return (
                <li
                  key={oeuvre.documentId}
                  className="bg-gray-700 rounded-xl overflow-hidden flex items-center shadow-md transition hover:scale-[1.01]"
                >
                  {/* Image de couverture */}
                  {couvertureUrl ? (
                    <img
                      src={couvertureUrl}
                      alt={`Couverture de ${oeuvre.titre}`}
                      className="w-20 h-28 object-cover"
                    />
                  ) : (
                    <div className="w-20 h-28 bg-gray-600 flex items-center justify-center text-sm text-gray-300">
                      N/A
                    </div>
                  )}
  
                  {/* Texte & action */}
                  <div className="flex-1 px-4 py-2 flex flex-col justify-between">
                    <span className="text-lg font-semibold text-white">{oeuvre.titre}</span>
  
                    <button
                      onClick={() => handleSelectOeuvre(oeuvre)}
                      className="mt-2 self-start px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-md font-semibold"
                    >
                      Modifier
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
  
      {/* Modale affichée si une œuvre est sélectionnée */}
      {selectedOeuvre && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-gray-800 w-full max-w-3xl p-6 rounded-xl relative shadow-xl animate-fade-in">
            {/* Bouton fermer */}
            <button
              onClick={() => setSelectedOeuvre(null)}
              className="absolute top-3 right-4 text-white text-2xl hover:text-red-400"
              aria-label="Fermer"
            >
              &times;
            </button>
  
            {/* Navigation onglets */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setActiveSection("oeuvre")}
                className={`px-4 py-2 rounded-lg font-bold ${
                  activeSection === "oeuvre"
                    ? "bg-indigo-600"
                    : "bg-gray-700 hover:bg-gray-600"
                }`}
              >
                Modifier l'œuvre
              </button>
              <button
                onClick={() => setActiveSection("chapitres")}
                className={`px-4 py-2 rounded-lg font-bold ${
                  activeSection === "chapitres"
                    ? "bg-indigo-600"
                    : "bg-gray-700 hover:bg-gray-600"
                }`}
              >
                Modifier les chapitres
              </button>
            </div>
  
            {/* Contenu dynamique */}
            <div className=" rounded-lg max-h-[70vh] overflow-y-auto">
              {renderContent()}
            </div>
          </div>
        </div>
      )}
  
      {/* Message d'information */}
      {message && <p className="mt-4 text-center text-yellow-400">{message}</p>}
    </div>
  );
  
};

export default MoGeneral;
