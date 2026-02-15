"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import MoOeuvre from "../Modification/MoOeuvre";
import MoChapitre from "../Modification/MoChapitre";
import MoTeams from "../Modification/MoTeams";

const STRAPI_URL = "https://novel-index-strapi.onrender.com";

const IndexeurModification = ({ user }) => {
  const [searchType, setSearchType] = useState("oeuvre");
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [activeTab, setActiveTab] = useState("oeuvre");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const debounceRef = useRef(null);

  // Recherche debounce
  useEffect(() => {
    if (!searchTerm.trim()) {
      setResults([]);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const jwt = localStorage.getItem("jwt");
        if (!jwt) return;

        const endpoint =
          searchType === "oeuvre"
            ? `${STRAPI_URL}/api/oeuvres?populate=couverture&filters[titre][$containsi]=${encodeURIComponent(searchTerm)}&pagination[pageSize]=50`
            : `${STRAPI_URL}/api/teams?populate=couverture&filters[titre][$containsi]=${encodeURIComponent(searchTerm)}&pagination[pageSize]=50`;

        const response = await axios.get(endpoint, {
          headers: { Authorization: `Bearer ${jwt}` },
        });

        setResults(response.data.data || []);
      } catch (error) {
        console.error("Erreur recherche:", error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchTerm, searchType]);

  // Avertissement modifications non sauvegardees
  useEffect(() => {
    const handler = (e) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [hasUnsavedChanges]);

  // Escape pour revenir
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape" && selectedItem) {
        handleClose();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [selectedItem, hasUnsavedChanges]);

  const confirmIfDirty = useCallback(() => {
    if (hasUnsavedChanges) {
      return window.confirm(
        "Vous avez des modifications non sauvegardées. Voulez-vous continuer ?"
      );
    }
    return true;
  }, [hasUnsavedChanges]);

  const handleSelectItem = (item) => {
    if (!confirmIfDirty()) return;
    setSelectedItem(item);
    setActiveTab("oeuvre");
    setHasUnsavedChanges(false);
  };

  const handleClose = () => {
    if (!confirmIfDirty()) return;
    setSelectedItem(null);
    setHasUnsavedChanges(false);
  };

  const handleTypeChange = (type) => {
    if (!confirmIfDirty()) return;
    setSearchType(type);
    setResults([]);
    setSearchTerm("");
    setSelectedItem(null);
    setHasUnsavedChanges(false);
  };

  return (
    <div className="w-full max-w-5xl mx-auto bg-gray-900 p-6 sm:p-8 rounded-2xl text-white">
      <h1 className="text-2xl sm:text-3xl font-bold text-center mb-6">
        Modification des Donnees
      </h1>

      {/* Barre de recherche unifiee */}
      <div className="flex gap-2 sm:gap-3 mb-6">
        <select
          value={searchType}
          onChange={(e) => handleTypeChange(e.target.value)}
          className="bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm font-medium shrink-0"
        >
          <option value="oeuvre">Oeuvres</option>
          <option value="team">Teams</option>
        </select>

        <div className="flex-1 relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={
              searchType === "oeuvre"
                ? "Rechercher une oeuvre par titre..."
                : "Rechercher une team par titre..."
            }
            className="w-full p-2 bg-gray-800 border border-gray-600 rounded-lg pr-10"
          />
          {loading && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>
      </div>

      {/* Resultats de recherche */}
      {results.length > 0 && !selectedItem && (
        <div className="mb-6">
          <p className="text-sm text-gray-400 mb-3">
            {results.length} resultat{results.length > 1 ? "s" : ""}
          </p>

          {searchType === "oeuvre" ? (
            <ul className="grid sm:grid-cols-2 gap-3">
              {results.map((item) => (
                <li
                  key={item.documentId}
                  onClick={() => handleSelectItem(item)}
                  className="bg-gray-800 rounded-xl overflow-hidden flex items-center cursor-pointer hover:bg-gray-700/80 transition group"
                >
                  {item.couverture?.url ? (
                    <img
                      src={item.couverture.url}
                      alt={`Couverture de ${item.titre}`}
                      className="w-16 h-[5.5rem] object-cover shrink-0"
                    />
                  ) : (
                    <div className="w-16 h-[5.5rem] bg-gray-700 flex items-center justify-center text-xs text-gray-500 shrink-0">
                      N/A
                    </div>
                  )}
                  <div className="px-4 py-2 min-w-0">
                    <span className="font-semibold text-sm group-hover:text-indigo-300 transition truncate block">
                      {item.titre}
                    </span>
                    {item.auteur && (
                      <span className="text-xs text-gray-400">{item.auteur}</span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <ul className="grid sm:grid-cols-2 gap-3">
              {results.map((item) => (
                <li
                  key={item.documentId}
                  onClick={() => handleSelectItem(item)}
                  className="bg-gray-800 rounded-xl overflow-hidden flex items-center cursor-pointer hover:bg-gray-700/80 transition group"
                >
                  {item.couverture?.url ? (
                    <img
                      src={item.couverture.url}
                      alt={`Logo de ${item.titre}`}
                      className="w-16 h-16 object-cover shrink-0"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-gray-700 flex items-center justify-center text-xs text-gray-500 shrink-0">
                      N/A
                    </div>
                  )}
                  <div className="px-4 py-2 min-w-0">
                    <span className="font-semibold text-sm group-hover:text-indigo-300 transition truncate block">
                      {item.titre}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Etat vide */}
      {searchTerm.trim() && !loading && results.length === 0 && !selectedItem && (
        <p className="text-center text-gray-500 py-8">Aucun resultat trouve.</p>
      )}

      {/* Zone d'edition inline */}
      {selectedItem && (
        <div className="mt-2">
          {/* En-tete avec retour */}
          <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-700">
            <button
              onClick={handleClose}
              className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm transition shrink-0"
            >
              &larr; Retour
            </button>
            <h2 className="text-lg sm:text-xl font-bold truncate">
              {selectedItem.titre}
            </h2>
            {hasUnsavedChanges && (
              <span className="ml-auto text-xs bg-amber-600/20 text-amber-400 px-2 py-1 rounded-full shrink-0">
                Non sauvegarde
              </span>
            )}
          </div>

          {searchType === "oeuvre" ? (
            <>
              {/* Sous-onglets oeuvre / chapitres */}
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => setActiveTab("oeuvre")}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                    activeTab === "oeuvre"
                      ? "bg-indigo-600 text-white"
                      : "bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700"
                  }`}
                >
                  Modifier l'oeuvre
                </button>
                <button
                  onClick={() => setActiveTab("chapitres")}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                    activeTab === "chapitres"
                      ? "bg-indigo-600 text-white"
                      : "bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700"
                  }`}
                >
                  Modifier les chapitres
                </button>
              </div>

              {activeTab === "oeuvre" ? (
                <MoOeuvre
                  user={user}
                  oeuvre={selectedItem}
                  onDirty={setHasUnsavedChanges}
                />
              ) : (
                <MoChapitre
                  user={user}
                  oeuvre={selectedItem}
                  onDirty={setHasUnsavedChanges}
                />
              )}
            </>
          ) : (
            <MoTeams
              user={user}
              team={selectedItem}
              onDirty={setHasUnsavedChanges}
            />
          )}
        </div>
      )}

      {/* Hint clavier */}
      {selectedItem && (
        <p className="text-xs text-gray-600 text-center mt-4">
          Echap pour revenir &middot; Ctrl+S pour sauvegarder
        </p>
      )}
    </div>
  );
};

export default IndexeurModification;
