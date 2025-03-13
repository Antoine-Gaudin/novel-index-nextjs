"use client";

import React, { useState } from "react";

const ConstructeurUrl = ({ user, oeuvre }) => {
  const [startTitle, setStartTitle] = useState("");
  const [endTitle, setEndTitle] = useState("");
  const [urlPattern, setUrlPattern] = useState("");
  const [tome, setTome] = useState(""); // Champ optionnel pour le tome
  const [generatedChapters, setGeneratedChapters] = useState(""); // Zone pour afficher les chapitres générés
  const [copyMessage, setCopyMessage] = useState(""); // Message après copie

  const handleGenerate = () => {
    const startNumber = parseInt(startTitle, 10);
    const endNumber = parseInt(endTitle, 10);

    if (isNaN(startNumber) || isNaN(endNumber) || startNumber > endNumber) {
      alert(
        "Le titre de début et le titre de fin doivent être des nombres valides, et le début doit être inférieur ou égal à la fin."
      );
      return;
    }

    if (!urlPattern.includes("{n}")) {
      alert("Le modèle d'URL doit inclure la variable {n} pour générer les URLs.");
      return;
    }

    // Générer les chapitres
    const chapters = [];
    for (let i = startNumber; i <= endNumber; i++) {
      const generatedUrl = urlPattern.replace("{n}", i); // Remplace {n} dans le modèle par le numéro courant
      if (tome) {
        chapters.push(`Chapitre ${i} ; ${tome} ; ${generatedUrl}`);
      } else {
        chapters.push(`Chapitre ${i} ; ${generatedUrl}`);
      }
    }

    // Mettre les chapitres générés dans la zone d'affichage
    setGeneratedChapters(chapters.join("\n"));
  };

  const handleCopy = () => {
    if (generatedChapters) {
      navigator.clipboard.writeText(generatedChapters).then(() => {
        setCopyMessage("Chapitres copiés dans le presse-papier !");
        setTimeout(() => setCopyMessage(""), 2000); // Réinitialiser le message après 2 secondes
      });
    }
  };

  return (
    <div className="mt-6 p-4 bg-gray-700 rounded-lg shadow-lg">
      <h2 className="text-xl font-bold mb-4">Constructeur d'URL</h2>
      <div className="space-y-4">
        {/* Champ pour le titre de début */}
        <div>
          <label htmlFor="startTitle" className="block text-sm font-medium">
            Titre de début
          </label>
          <input
            type="number"
            id="startTitle"
            value={startTitle}
            onChange={(e) => setStartTitle(e.target.value)}
            className="mt-1 block w-full p-2 bg-gray-800 border border-gray-600 rounded-lg"
            placeholder="1"
            required
          />
        </div>

        {/* Champ pour le titre de fin */}
        <div>
          <label htmlFor="endTitle" className="block text-sm font-medium">
            Titre de fin
          </label>
          <input
            type="number"
            id="endTitle"
            value={endTitle}
            onChange={(e) => setEndTitle(e.target.value)}
            className="mt-1 block w-full p-2 bg-gray-800 border border-gray-600 rounded-lg"
            placeholder="10"
            required
          />
        </div>

        {/* Champ pour le modèle d'URL */}
        <div>
          <label htmlFor="urlPattern" className="block text-sm font-medium">
            Modèle d'URL (utilisez <code>{`{n}`}</code> pour la partie variable)
          </label>
          <input
            type="text"
            id="urlPattern"
            value={urlPattern}
            onChange={(e) => setUrlPattern(e.target.value)}
            className="mt-1 block w-full p-2 bg-gray-800 border border-gray-600 rounded-lg"
            placeholder="https://trad-index.com/nomOeuvre/Chapitre/{n}"
            required
          />
        </div>

        {/* Champ pour le tome (optionnel) */}
        <div>
          <label htmlFor="tome" className="block text-sm font-medium">
            Tome (optionnel)
          </label>
          <input
            type="text"
            id="tome"
            value={tome}
            onChange={(e) => setTome(e.target.value)}
            className="mt-1 block w-full p-2 bg-gray-800 border border-gray-600 rounded-lg"
            placeholder="Tome 1"
          />
        </div>

        {/* Bouton pour générer les chapitres */}
        <button
          onClick={handleGenerate}
          className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-white font-bold"
        >
          Générer les chapitres
        </button>

        {/* Zone pour afficher les chapitres générés */}
        {generatedChapters && (
          <div className="mt-6">
            <label htmlFor="generatedChapters" className="block text-sm font-medium">
              Chapitres générés
            </label>
            <textarea
              id="generatedChapters"
              value={generatedChapters}
              readOnly
              rows={10}
              className="mt-1 block w-full p-2 bg-gray-800 border border-gray-600 rounded-lg"
            />

            {/* Bouton pour copier le contenu */}
            <button
              onClick={handleCopy}
              className="w-full py-3 mt-3 bg-green-600 hover:bg-green-700 rounded-lg text-white font-bold"
            >
              Copier les chapitres
            </button>
            {copyMessage && (
              <p className="mt-2 text-center text-yellow-400">{copyMessage}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ConstructeurUrl;
