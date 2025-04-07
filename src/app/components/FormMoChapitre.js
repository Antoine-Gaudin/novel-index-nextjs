"use client";

import React from "react";

const FormMoChapitre = ({
  chapitres,
  setChapitres,
  searchTerm,
  setSearchTerm,
  bulkTome,
  setBulkTome,
  showAllUrls,
  setShowAllUrls,
  showUrls,
  toggleUrl,
  filteredChapitres,
  handleChapitreChange,
  handleSaveChapitres,
  statusMessage,
  progress,
}) => {
  return (
    <div className="w-full bg-gray-900 p-6 rounded-2xl shadow-2xl text-white">
      <h3 className="text-2xl font-bold mb-6 text-center">
        📘 Modifier les chapitres
      </h3>

      {/* Recherche */}
      <div className="mb-6">
        <label htmlFor="search" className="block text-sm font-medium mb-1">
          🔍 Rechercher un chapitre
        </label>
        <input
          type="text"
          id="search"
          placeholder="Titre ou ordre ex: 2.26 pour afficher les chapitres qui vont de l'ordre 2 à 26"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full p-2 bg-gray-800 border border-gray-600 rounded-lg"
        />
      </div>

      {/* Attribution tome */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <input
          type="text"
          placeholder="Entrer un tome (ex: Tome 1)"
          value={bulkTome}
          onChange={(e) => setBulkTome(e.target.value)}
          className="w-full sm:w-1/2 p-2 bg-gray-800 border border-gray-600 rounded-lg"
        />
        <button
          onClick={() => {
            const updateList =
              filteredChapitres.length > 0 ? filteredChapitres : [];

            updateList.forEach((chapitre) => {
              const globalIndex = chapitres.findIndex(
                (c) => c.documentId === chapitre.documentId
              );
              if (globalIndex !== -1) {
                handleChapitreChange(globalIndex, "tome", bulkTome);
              }
            });

            setBulkTome("");
          }}
          className="w-full sm:w-auto px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-white font-bold"
        >
          Attribuer à tous les chapitres filtrés
        </button>
      </div>

      {/* Bouton afficher tous les URL */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <button
          onClick={() => setShowAllUrls((prev) => !prev)}
          className="w-full sm:w-auto px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-white font-bold"
        >
          {showAllUrls ? "Masquer tous les URL" : "Afficher tous les URL"}
        </button>
      </div>


      <button
  onClick={() => {
    const reset = chapitres.map((chap, index) => ({
      ...chap,
      order: index + 1,
    }));
    setChapitres(reset);
  }}
  className="w-full mt-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 rounded-lg text-white font-bold transition"
>
  🔄 Réinitialiser les ordres (1, 2, 3…)
</button>




      {/* Bouton save */}
      <button
        onClick={handleSaveChapitres}
        className="mt-6 w-full py-3 bg-green-600 hover:bg-green-700 rounded-lg font-bold text-white transition"
      >
        💾 Enregistrer les chapitres
      </button>

      {/* Messages */}
      {statusMessage && (
        <p className="mt-2 text-sm text-center text-indigo-400">
          {statusMessage}
        </p>
      )}

      {/* Progress bar */}
      {progress > 0 && (
        <div className="w-full bg-gray-700 rounded-full h-4 mt-2 overflow-hidden">
          <div
            className="bg-green-500 h-full transition-all duration-200 ease-in-out"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      )}
      {/* Liste des chapitres */}
      <ul className="space-y-6 mt-4">
        {filteredChapitres.map((chapitre, index) => (
          <li
            key={chapitre.id}
            className="bg-gray-800 rounded-xl p-6 shadow-md space-y-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Titre</label>
                <input
                  type="text"
                  value={chapitre.titre}
                  onChange={(e) =>
                    handleChapitreChange(index, "titre", e.target.value)
                  }
                  className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Ordre</label>
                <input
                  type="number"
                  value={chapitre.order}
                  onChange={(e) =>
                    handleChapitreChange(index, "order", e.target.value)
                  }
                  className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Tome</label>
                <input
                  type="text"
                  value={chapitre.tome || ""}
                  onChange={(e) =>
                    handleChapitreChange(index, "tome", e.target.value)
                  }
                  className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg"
                />
              </div>

              <div className="flex items-end">
                <button
                  onClick={() => toggleUrl(index)}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg font-bold text-white transition"
                >
                  {showUrls[index] ? "Masquer URL" : "Afficher URL"}
                </button>
              </div>
            </div>

            {(showUrls[index] || showAllUrls) && (
              <div>
                <label className="block text-sm font-medium mb-1">URL</label>
                <input
                  type="text"
                  value={chapitre.url}
                  onChange={(e) =>
                    handleChapitreChange(index, "url", e.target.value)
                  }
                  className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg"
                />
              </div>
            )}
          </li>
        ))}
      </ul>


    </div>
  );
};

export default FormMoChapitre;
