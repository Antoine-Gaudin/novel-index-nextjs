"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
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
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="mt-8 p-6 bg-gray-800 rounded-xl shadow-lg space-y-6"
    >
      <h2 className="text-2xl font-bold text-white text-center">🛠️ Constructeur d'URL</h2>
  
      {/* Début / Fin */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="startTitle" className="block text-sm font-semibold mb-1">
            Titre de début
          </label>
          <input
            type="number"
            id="startTitle"
            value={startTitle}
            onChange={(e) => setStartTitle(e.target.value)}
            className="w-full p-2 bg-gray-900 border border-gray-700 rounded-lg"
            placeholder="1"
            required
          />
        </div>
  
        <div>
          <label htmlFor="endTitle" className="block text-sm font-semibold mb-1">
            Titre de fin
          </label>
          <input
            type="number"
            id="endTitle"
            value={endTitle}
            onChange={(e) => setEndTitle(e.target.value)}
            className="w-full p-2 bg-gray-900 border border-gray-700 rounded-lg"
            placeholder="10"
            required
          />
        </div>
      </div>
  
      {/* Pattern URL */}
      <div>
        <label htmlFor="urlPattern" className="block text-sm font-semibold mb-1">
          Modèle d'URL <span className="text-gray-400">(utilisez <code>{`{n}`}</code>)</span>
        </label>
        <input
          type="text"
          id="urlPattern"
          value={urlPattern}
          onChange={(e) => setUrlPattern(e.target.value)}
          className="w-full p-2 bg-gray-900 border border-gray-700 rounded-lg"
          placeholder="https://trad-index.com/nomOeuvre/Chapitre/{n}"
          required
        />
      </div>
  
      {/* Tome (optionnel) */}
      <div>
        <label htmlFor="tome" className="block text-sm font-semibold mb-1">
          Tome <span className="text-gray-400">(optionnel)</span>
        </label>
        <input
          type="text"
          id="tome"
          value={tome}
          onChange={(e) => setTome(e.target.value)}
          className="w-full p-2 bg-gray-900 border border-gray-700 rounded-lg"
          placeholder="Tome 1"
        />
      </div>
  
      {/* Générer */}
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={handleGenerate}
        className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-white font-bold transition"
      >
        Générer les chapitres
      </motion.button>
  
      {/* Résultat généré */}
      {generatedChapters && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-4"
        >
          <div>
            <label htmlFor="generatedChapters" className="block text-sm font-semibold mb-1">
              Chapitres générés
            </label>
            <textarea
              id="generatedChapters"
              value={generatedChapters}
              readOnly
              rows={10}
              className="w-full p-3 bg-gray-900 border border-gray-700 rounded-lg text-sm text-white"
            />
          </div>
  
          <button
            onClick={handleCopy}
            className="w-full py-3 bg-green-600 hover:bg-green-700 rounded-lg text-white font-bold"
          >
            Copier les chapitres
          </button>
  
          {copyMessage && (
            <p className="text-center text-yellow-400 text-sm">{copyMessage}</p>
          )}
        </motion.div>
      )}
    </motion.div>
  );
  
};

export default ConstructeurUrl;
