"use client";

import React from "react";

const FormMoOeuvre = ({
  oeuvre,
  oeuvreData,
  preview,
  message,
  handleOeuvreChange,
  handleFileChange,
  handleSaveOeuvre,
}) => {
  return (
    <div className="w-full bg-gray-900 p-6 rounded-2xl shadow-2xl text-white">
      <h3 className="text-2xl font-bold mb-6 text-center">
        ✏️ Modifier l'œuvre :{" "}
        <span className="text-indigo-400">{oeuvre.titre}</span>
      </h3>

      {message && (
        <p className="mb-4 text-center text-yellow-400 font-medium">
          {message}
        </p>
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
                  htmlFor={field}
                  className="block text-sm font-medium mb-1"
                >
                  {field.charAt(0).toUpperCase() + field.slice(1)}
                </label>
                <input
                  type="text"
                  id={field}
                  name={field}
                  required={field === "titre" || field === "auteur"}
                  value={oeuvreData[field] || ""}
                  onChange={handleOeuvreChange}
                  className="bg-gray-800 border border-gray-600 rounded-lg p-2 w-full"
                />
              </div>
            ))}
          </div>
        </fieldset>

        {/* 2. Détails */}
        <fieldset className="border border-gray-700 p-6 rounded-xl">
          <legend className="text-lg font-semibold px-2 text-indigo-400">
            Détails de l'œuvre
          </legend>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
            <div className="md:col-span-2">
              <label
                htmlFor="synopsis"
                className="block text-sm font-medium mb-1"
              >
                Synopsis
              </label>
              <textarea
                id="synopsis"
                name="synopsis"
                rows="4"
                value={oeuvreData.synopsis || ""}
                onChange={handleOeuvreChange}
                className="bg-gray-800 border border-gray-600 rounded-lg p-2 w-full"
              ></textarea>
            </div>

            {["annee", "etat", "type", "categorie"].map((field) => (
              <div key={field}>
                <label
                  htmlFor={field}
                  className="block text-sm font-medium mb-1"
                >
                  {field.charAt(0).toUpperCase() + field.slice(1)}
                </label>
                {["etat", "type", "categorie"].includes(field) ? (
                  <select
                    id={field}
                    name={field}
                    value={oeuvreData[field] || ""}
                    onChange={handleOeuvreChange}
                    className="bg-gray-800 border border-gray-600 rounded-lg p-2 w-full"
                  >
                    <option value="">-- Sélectionnez --</option>
                    {field === "etat" &&
                      [
                        "En cours",
                        "Terminé",
                        "Abandonné",
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
                    id={field}
                    name={field}
                    value={oeuvreData[field] || ""}
                    onChange={handleOeuvreChange}
                    className="bg-gray-800 border border-gray-600 rounded-lg p-2 w-full"
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
              Œuvre licenciée en France ?
            </label>
            <div className="flex items-center space-x-4">
              <span className="text-sm">Non</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  name="licence"
                  checked={oeuvreData.licence === true}
                  onChange={handleOeuvreChange}
                  className="sr-only peer"
                />

                <div className="w-11 h-6 bg-gray-600 peer-checked:bg-green-500 rounded-full transition-all"></div>
                <div className="absolute w-4 h-4 bg-white rounded-full shadow left-1 top-1 transition-transform peer-checked:translate-x-full"></div>
              </label>
              <span className="text-sm">Oui</span>
            </div>
          </div>

          {/* Langage */}
          <div>
            <label htmlFor="langage" className="block text-sm font-medium mb-1">
              Langage
            </label>
            <input
              type="text"
              id="langage"
              name="langage"
              value={oeuvreData.langage || "Français"}
              onChange={handleOeuvreChange}
              className="bg-gray-800 border border-gray-600 rounded-lg p-2 w-full"
            />
          </div>

          {/* Couverture */}
          <div>
            <label
              htmlFor="couverture"
              className="block text-sm font-semibold mb-2"
            >
              🖼️ Couverture
            </label>

            <div className="relative border-2 border-dashed border-gray-600 bg-gray-800 rounded-xl p-6 flex flex-col items-center justify-center hover:border-indigo-500 transition-all duration-200">
              {preview ? (
                <img
                  src={preview}
                  alt="Prévisualisation"
                  className="w-full h-auto object-cover rounded-lg"
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
                    Glissez-déposez une image ou cliquez pour choisir un fichier
                  </p>
                </>
              )}

              <input
                type="file"
                id="couverture"
                name="couverture"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                accept="image/*"
              />
            </div>
          </div>
        </fieldset>

        <button
          type="button"
          onClick={handleSaveOeuvre}
          className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 rounded-lg font-bold text-white transition mt-2"
        >
          💾 Enregistrer les modifications
        </button>
      </form>
    </div>
  );
};

export default FormMoOeuvre;
