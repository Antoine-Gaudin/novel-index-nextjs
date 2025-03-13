"use client";

import React, { useState } from "react";
import Genre from "./Genre";
import Tag from "./Tag";
import axios from "axios";

const TagsGenre = () => {
  const [activeSection, setActiveSection] = useState(null);
  const [searchTerm, setSearchTerm] = useState(""); // Recherche pour les œuvres
  const [oeuvres, setOeuvres] = useState([]); // Liste des œuvres trouvées
  const [selectedOeuvre, setSelectedOeuvre] = useState(null); // Œuvre sélectionnée
  const [message, setMessage] = useState(null); // Message d'erreur ou d'information

  // Recherche des œuvres
  const handleSearch = async (e) => {
    e.preventDefault();

    try {
      const jwt = localStorage.getItem("jwt");
      if (!jwt) {
        setMessage("Vous devez être connecté pour effectuer cette recherche.");
        return;
      }

      const response = await axios.get(
        `http://localhost:1337/api/oeuvres?filters[titre][$contains]=${searchTerm}`,
        {
          headers: { Authorization: `Bearer ${jwt}` },
        }
      );

      setOeuvres(response.data.data || []);
      setMessage(null);
    } catch (error) {
      console.error("Erreur lors de la recherche des œuvres :", error.response?.data || error.message);
      setMessage("Erreur lors de la recherche des œuvres.");
    }
  };

  // Sélectionner une œuvre
  const handleSelectOeuvre = (oeuvre) => {
    setSelectedOeuvre(oeuvre);
    setActiveSection(null); // Réinitialiser la section active
  };

  // Rendu du contenu
  const renderContent = () => {
    if (!selectedOeuvre) {
      return (
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
          {message && <p className="mt-4 text-yellow-400">{message}</p>}

          {/* Liste des œuvres trouvées */}
          {oeuvres.length > 0 && (
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
                    Sélectionner
                  </button>
                </li>
              ))}
            </ul>
          )}
        </form>
      );
    }

    // Si une œuvre est sélectionnée, afficher les sections Tags et Genres
    switch (activeSection) {
      case "Genre":
        return <Genre selectedOeuvre={selectedOeuvre} />;
      case "Tag":
        return <Tag selectedOeuvre={selectedOeuvre} />;
      default:
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-700 p-4 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-2">Modifier les Genres</h2>
              <button
                className="mt-4 w-full py-2 bg-indigo-600 hover:bg-indigo-700 rounded text-white"
                onClick={() => setActiveSection("Genre")}
              >
                Modifier Genres
              </button>
            </div>

            <div className="bg-gray-700 p-4 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-2">Modifier les Tags</h2>
              <button
                className="mt-4 w-full py-2 bg-indigo-600 hover:bg-indigo-700 rounded text-white"
                onClick={() => setActiveSection("Tag")}
              >
                Modifier Tags
              </button>
            </div>
          </div>
        );
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 text-center">Tags & Genres</h1>
      {selectedOeuvre && (
        <button
          onClick={() => {
            setSelectedOeuvre(null); // Réinitialiser l'œuvre sélectionnée
            setActiveSection(null); // Réinitialiser la section active
          }}
          className="mb-4 py-2 px-4 bg-gray-700 hover:bg-gray-600 rounded text-white"
        >
          Retour à la recherche
        </button>
      )}
      {renderContent()}
    </div>
  );
};

export default TagsGenre;
