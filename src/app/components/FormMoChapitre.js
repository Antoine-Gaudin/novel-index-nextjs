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
  selectedIds,
  toggleSelect,
  toggleSelectAll,
  filteredChapitres,
  modifiedChapitreIds,
  handleChapitreChange,
  handleSaveChapitres,
  feedback,
  statusMessage,
  progress,
  loading,
}) => {
  const allVisibleSelected =
    filteredChapitres.length > 0 &&
    filteredChapitres.every((c) => selectedIds.has(c.documentId));

  const hasSelection = selectedIds.size > 0;

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="w-8 h-8 border-[3px] border-indigo-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-full bg-gray-900 p-4 sm:p-6 rounded-2xl shadow-2xl text-white">
      <h3 className="text-xl font-bold mb-4 text-center">
        Modifier les chapitres
        <span className="ml-2 text-sm font-normal text-gray-400">
          ({chapitres.length} total)
        </span>
      </h3>

      {/* Feedback unifie */}
      {feedback && (
        <div
          className={`mb-4 p-3 rounded-lg text-sm font-medium ${
            feedback.type === "success"
              ? "bg-green-600/20 text-green-400 border border-green-600/30"
              : feedback.type === "error"
              ? "bg-red-600/20 text-red-400 border border-red-600/30"
              : "bg-blue-600/20 text-blue-400 border border-blue-600/30"
          }`}
        >
          {feedback.message}
        </div>
      )}

      {/* Toolbar consolidee sticky */}
      <div className="sticky top-0 z-10 bg-gray-900 pb-4 space-y-3 border-b border-gray-700 mb-4">
        {/* Ligne 1 : Recherche */}
        <div>
          <input
            type="text"
            placeholder="Rechercher par titre ou plage d'ordres (ex: 2.26)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-2 bg-gray-800 border border-gray-600 rounded-lg text-sm"
          />
        </div>

        {/* Ligne 2 : Actions bulk */}
        <div className="flex flex-wrap gap-2 items-center">
          <input
            type="text"
            placeholder="Tome (ex: Tome 1)"
            value={bulkTome}
            onChange={(e) => setBulkTome(e.target.value)}
            className="w-40 p-2 bg-gray-800 border border-gray-600 rounded-lg text-sm"
          />
          <button
            onClick={() => {
              const targets = hasSelection
                ? filteredChapitres.filter((c) =>
                    selectedIds.has(c.documentId)
                  )
                : filteredChapitres;

              targets.forEach((chapitre) => {
                handleChapitreChange(chapitre.documentId, "tome", bulkTome);
              });
              setBulkTome("");
            }}
            disabled={!bulkTome.trim()}
            className="px-3 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 rounded-lg text-white text-sm font-medium transition"
          >
            {hasSelection
              ? `Attribuer aux ${selectedIds.size} selectionnes`
              : "Attribuer aux filtres"}
          </button>

          <div className="flex-1" />

          <button
            onClick={() => setShowAllUrls((prev) => !prev)}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
              showAllUrls
                ? "bg-indigo-600 text-white"
                : "bg-gray-700 text-gray-300 hover:bg-gray-600"
            }`}
          >
            {showAllUrls ? "Masquer URLs" : "Afficher URLs"}
          </button>

          <button
            onClick={() => {
              const reset = chapitres.map((chap, index) => ({
                ...chap,
                order: index + 1,
              }));
              setChapitres(reset);
            }}
            className="px-3 py-2 bg-amber-600 hover:bg-amber-700 rounded-lg text-white text-sm font-medium transition"
          >
            Reset ordres
          </button>
        </div>

        {/* Barre de selection */}
        {hasSelection && (
          <div className="flex items-center gap-2 text-sm text-indigo-300 bg-indigo-600/10 border border-indigo-600/30 rounded-lg px-3 py-2">
            <span className="font-medium">
              {selectedIds.size} chapitre{selectedIds.size > 1 ? "s" : ""}{" "}
              selectionne{selectedIds.size > 1 ? "s" : ""}
            </span>
            <button
              onClick={() => toggleSelectAll(filteredChapitres)}
              className="ml-auto text-xs text-indigo-400 hover:text-indigo-300 underline"
            >
              Tout deselectionner
            </button>
          </div>
        )}

        {/* Progress bar */}
        {progress > 0 && (
          <div className="space-y-1">
            <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
              <div
                className="bg-green-500 h-full transition-all duration-200 ease-in-out"
                style={{ width: `${progress}%` }}
              />
            </div>
            {statusMessage && (
              <p className="text-xs text-gray-400 text-center">
                {statusMessage}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Tableau compact de chapitres */}
      {filteredChapitres.length === 0 ? (
        <p className="text-center text-gray-500 py-8">
          {searchTerm ? "Aucun chapitre correspondant." : "Aucun chapitre."}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-700 text-gray-400 text-left">
                <th className="p-2 w-8">
                  <input
                    type="checkbox"
                    checked={allVisibleSelected}
                    onChange={() => toggleSelectAll(filteredChapitres)}
                    className="rounded bg-gray-700 border-gray-600"
                  />
                </th>
                <th className="p-2">Titre</th>
                <th className="p-2 w-20">Ordre</th>
                <th className="p-2 w-28">Tome</th>
                <th className="p-2 w-16 text-center">URL</th>
              </tr>
            </thead>
            <tbody>
              {filteredChapitres.map((chapitre) => {
                const isModified = modifiedChapitreIds.has(
                  chapitre.documentId
                );
                const isSelected = selectedIds.has(chapitre.documentId);
                const urlVisible =
                  showUrls[chapitre.documentId] || showAllUrls;

                return (
                  <React.Fragment key={chapitre.documentId}>
                    <tr
                      className={`border-b border-gray-800/50 transition ${
                        isSelected
                          ? "bg-indigo-600/10"
                          : isModified
                          ? "bg-amber-600/5"
                          : "hover:bg-gray-800/30"
                      }`}
                    >
                      <td className="p-2">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelect(chapitre.documentId)}
                          className="rounded bg-gray-700 border-gray-600"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          value={chapitre.titre || ""}
                          onChange={(e) =>
                            handleChapitreChange(
                              chapitre.documentId,
                              "titre",
                              e.target.value
                            )
                          }
                          className="bg-transparent w-full p-1 border border-transparent hover:border-gray-600 focus:border-indigo-500 focus:outline-none rounded text-sm transition"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          value={chapitre.order ?? ""}
                          onChange={(e) =>
                            handleChapitreChange(
                              chapitre.documentId,
                              "order",
                              e.target.value
                            )
                          }
                          className="bg-transparent w-full p-1 border border-transparent hover:border-gray-600 focus:border-indigo-500 focus:outline-none rounded text-sm transition"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          value={chapitre.tome || ""}
                          onChange={(e) =>
                            handleChapitreChange(
                              chapitre.documentId,
                              "tome",
                              e.target.value
                            )
                          }
                          className="bg-transparent w-full p-1 border border-transparent hover:border-gray-600 focus:border-indigo-500 focus:outline-none rounded text-sm transition"
                        />
                      </td>
                      <td className="p-2 text-center">
                        <button
                          onClick={() => toggleUrl(chapitre.documentId)}
                          className={`text-xs px-2 py-1 rounded transition ${
                            urlVisible
                              ? "bg-indigo-600 text-white"
                              : "bg-gray-700 text-gray-400 hover:text-white"
                          }`}
                        >
                          {urlVisible ? "[-]" : "[+]"}
                        </button>
                      </td>
                    </tr>

                    {/* Ligne URL expandable */}
                    {urlVisible && (
                      <tr className="border-b border-gray-800/30 bg-gray-800/20">
                        <td className="p-1" />
                        <td colSpan="4" className="p-2">
                          <input
                            type="text"
                            value={chapitre.url || ""}
                            onChange={(e) =>
                              handleChapitreChange(
                                chapitre.documentId,
                                "url",
                                e.target.value
                              )
                            }
                            placeholder="URL du chapitre"
                            className="w-full p-1.5 bg-gray-700 border border-gray-600 focus:border-indigo-500 focus:outline-none rounded text-xs transition"
                          />
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Bouton save sticky en bas */}
      <div className="sticky bottom-0 bg-gray-900 pt-4 mt-4 border-t border-gray-700">
        <button
          onClick={handleSaveChapitres}
          className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 rounded-lg font-bold text-white transition flex items-center justify-center gap-2"
        >
          {progress > 0 ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Enregistrement en cours...
            </>
          ) : (
            `Enregistrer ${modifiedChapitreIds.size > 0 ? `(${modifiedChapitreIds.size} modifie${modifiedChapitreIds.size > 1 ? "s" : ""})` : "les chapitres"}`
          )}
        </button>
      </div>
    </div>
  );
};

export default FormMoChapitre;
