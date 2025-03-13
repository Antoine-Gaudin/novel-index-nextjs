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
        `https://novel-index-strapi.onrender.com/api/oeuvres?filters[titre][$contains]=${searchTerm}`,
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
          <ul className="space-y-2">
            {oeuvres.map((oeuvre) => (
              <li
                key={oeuvre.documentId}
                className="p-2 bg-gray-700 rounded-lg flex justify-between items-center"
              >
                <span>{oeuvre.titre}</span>
                <button
                  onClick={() => handleSelectOeuvre(oeuvre)}
                  className="px-4 py-1 bg-green-600 hover:bg-green-700 rounded-lg text-white font-bold"
                >
                  Modifier
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Zones dynamiques : Modifier l'œuvre ou les chapitres */}
      {selectedOeuvre && (
        <div className="space-y-4">
          <div className="flex justify-between">
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

          {/* Affichage du contenu */}
          <div className="mt-4 p-4 bg-gray-700 rounded-lg shadow-lg">
            {renderContent()}
          </div>
        </div>
      )}

      {/* Message d'information */}
      {message && <p className="mt-4 text-center text-yellow-400">{message}</p>}
    </div>
  );
};

export default MoGeneral;
