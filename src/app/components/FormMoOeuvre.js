"use client";

import React from "react";

const FormMoOeuvre = ({
  oeuvre,
  oeuvreData,
  originalData = {},
  preview,
  feedback,
  loading,
  saving,
  handleOeuvreChange,
  handleFileChange,
  handleSaveOeuvre,
}) => {
  // Detecte si un champ a ete modifie
  const isModified = (field) => {
    if (!originalData || Object.keys(originalData).length === 0) return false;
    return oeuvreData[field] !== originalData[field];
  };

  const fieldClass = (field) =>
    `bg-gray-800 border rounded-lg p-2 w-full transition ${
      isModified(field)
        ? "border-indigo-400 ring-1 ring-indigo-400/30"
        : "border-gray-600"
    }`;

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="w-8 h-8 border-[3px] border-indigo-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-full bg-gray-900 p-6 rounded-2xl shadow-2xl text-white">
      <h3 className="text-xl font-bold mb-6 text-center">
        Modifier l'oeuvre :{" "}
        <span className="text-indigo-400">{oeuvre.titre}</span>
      </h3>

      {/* Feedback unifie */}
      {feedback && (
        <div
          className={`mb-4 p-3 rounded-lg text-sm font-medium transition-all ${
            feedback.type === "success"
              ? "bg-green-600/20 text-green-400 border border-green-600/30"
              : "bg-red-600/20 text-red-400 border border-red-600/30"
          }`}
        >
          {feedback.message}
        </div>
      )}

      <form className="space-y-8">
        {/* 1. Infos principales */}
        <fieldset className="border border-gray-700 p-6 rounded-xl">
          <legend className="text-lg font-semibold px-2 text-indigo-400">
            Informations principales
          </legend>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
            {["titre", "titrealt", "auteur", "traduction"].map((field) => (
              <div key={field}>
                <label
                  htmlFor={`oeuvre-${field}`}
                  className="block text-sm font-medium mb-1"
                >
                  {field.charAt(0).toUpperCase() + field.slice(1)}
                  {isModified(field) && (
                    <span className="ml-2 text-xs text-indigo-400">
                      modifie
                    </span>
                  )}
                </label>
                <input
                  type="text"
                  id={`oeuvre-${field}`}
                  name={field}
                  required={field === "titre" || field === "auteur"}
                  value={oeuvreData[field] || ""}
                  onChange={handleOeuvreChange}
                  disabled={saving}
                  className={fieldClass(field)}
                />
              </div>
            ))}
          </div>
        </fieldset>

        {/* 2. Details */}
        <fieldset className="border border-gray-700 p-6 rounded-xl">
          <legend className="text-lg font-semibold px-2 text-indigo-400">
            Details de l'oeuvre
          </legend>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
            <div className="md:col-span-2">
              <label
                htmlFor="oeuvre-synopsis"
                className="block text-sm font-medium mb-1"
              >
                Synopsis
                {isModified("synopsis") && (
                  <span className="ml-2 text-xs text-indigo-400">modifie</span>
                )}
              </label>
              <textarea
                id="oeuvre-synopsis"
                name="synopsis"
                rows="4"
                value={oeuvreData.synopsis || ""}
                onChange={handleOeuvreChange}
                disabled={saving}
                className={fieldClass("synopsis")}
              />
            </div>

            {["annee", "etat", "type", "categorie"].map((field) => (
              <div key={field}>
                <label
                  htmlFor={`oeuvre-${field}`}
                  className="block text-sm font-medium mb-1"
                >
                  {field.charAt(0).toUpperCase() + field.slice(1)}
                  {isModified(field) && (
                    <span className="ml-2 text-xs text-indigo-400">
                      modifie
                    </span>
                  )}
                </label>
                {["etat", "type", "categorie"].includes(field) ? (
                  <select
                    id={`oeuvre-${field}`}
                    name={field}
                    value={oeuvreData[field] || ""}
                    onChange={handleOeuvreChange}
                    disabled={saving}
                    className={fieldClass(field)}
                  >
                    <option value="">-- Selectionnez --</option>
                    {field === "etat" &&
                      [
                        "En cours",
                        "Termine",
                        "Abandonne",
                        "Libre",
                        "En pause",
                        "En attente",
                      ].map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    {field === "type" &&
                      ["Light novel", "Web novel", "Scan", "Webtoon"].map(
                        (opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        )
                      )}
                    {field === "categorie" &&
                      ["Shonen", "Seinen", "Shojo", "Isekai"].map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                  </select>
                ) : (
                  <input
                    type="number"
                    id={`oeuvre-${field}`}
                    name={field}
                    value={oeuvreData[field] || ""}
                    onChange={handleOeuvreChange}
                    disabled={saving}
                    className={fieldClass(field)}
                  />
                )}
              </div>
            ))}
          </div>
        </fieldset>

        {/* 3. Autres infos */}
        <fieldset className="border border-gray-700 p-6 rounded-xl space-y-6">
          <legend className="text-lg font-semibold px-2 text-indigo-400">
            Autres informations
          </legend>

          {/* Licence */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Oeuvre licenciee en France ?
              {isModified("licence") && (
                <span className="ml-2 text-xs text-indigo-400">modifie</span>
              )}
            </label>
            <div className="flex items-center space-x-4">
              <span className="text-sm">Non</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  name="licence"
                  checked={oeuvreData.licence === true}
                  onChange={handleOeuvreChange}
                  disabled={saving}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-600 peer-checked:bg-green-500 rounded-full transition-all" />
                <div className="absolute w-4 h-4 bg-white rounded-full shadow left-1 top-1 transition-transform peer-checked:translate-x-full" />
              </label>
              <span className="text-sm">Oui</span>
            </div>
          </div>

          {/* Langage */}
          <div>
            <label
              htmlFor="oeuvre-langage"
              className="block text-sm font-medium mb-1"
            >
              Langage
              {isModified("langage") && (
                <span className="ml-2 text-xs text-indigo-400">modifie</span>
              )}
            </label>
            <input
              type="text"
              id="oeuvre-langage"
              name="langage"
              value={oeuvreData.langage || "Francais"}
              onChange={handleOeuvreChange}
              disabled={saving}
              className={fieldClass("langage")}
            />
          </div>

          {/* Couverture */}
          <div>
            <label
              htmlFor="oeuvre-couverture"
              className="block text-sm font-semibold mb-2"
            >
              Couverture
            </label>

            <div className="relative border-2 border-dashed border-gray-600 bg-gray-800 rounded-xl p-6 flex flex-col items-center justify-center hover:border-indigo-500 transition-all duration-200">
              {preview ? (
                <img
                  src={preview}
                  alt="Previsualisation"
                  className="max-w-full max-h-64 object-contain rounded-lg"
                />
              ) : (
                <>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-10 w-10 text-indigo-400 mb-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 16V4m0 0L3 8m4-4l4 4M21 12v8a2 2 0 01-2 2H5a2 2 0 01-2-2v-8"
                    />
                  </svg>
                  <p className="text-sm text-gray-400 mb-1 text-center">
                    Glissez-deposez une image ou cliquez pour choisir un fichier
                  </p>
                </>
              )}

              <input
                type="file"
                id="oeuvre-couverture"
                name="couverture"
                onChange={handleFileChange}
                disabled={saving}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                accept="image/*"
              />
            </div>
          </div>
        </fieldset>

        <button
          type="button"
          onClick={handleSaveOeuvre}
          disabled={saving}
          className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-bold text-white transition mt-2 flex items-center justify-center gap-2"
        >
          {saving ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Enregistrement...
            </>
          ) : (
            "Enregistrer les modifications"
          )}
        </button>
      </form>
    </div>
  );
};

export default FormMoOeuvre;
