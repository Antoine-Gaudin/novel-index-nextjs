"use client";

import React, { useState } from "react";
import axios from "axios";
import ConstructeurUrl from "./ConstructeurUrl";

const PlusieursChapitre = ({ user, oeuvre }) => {
  const [chapitres, setChapitres] = useState("");
  const [message, setMessage] = useState(null);
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showConstructeur, setShowConstructeur] = useState(false);

  const handleChange = (e) => {
    setChapitres(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setProgress(0);
    setMessage(null);

    try {
      const jwt = localStorage.getItem("jwt");

      if (!jwt) {
        setMessage("Vous devez être connecté pour ajouter des chapitres.");
        setLoading(false);
        return;
      }

      const lignes = chapitres
        .split("\n")
        .map((ligne) => ligne.trim())
        .filter((ligne) => ligne);

      if (lignes.length === 0) {
        setMessage("Aucun chapitre n'a été saisi.");
        setLoading(false);
        return;
      }

      // Récupération des chapitres existants
      const oeuvreResponse = await axios.get(
        `https://novel-index-strapi.onrender.com/api/oeuvres/${oeuvre.documentId}?populate=chapitres`,
        {
          headers: { Authorization: `Bearer ${jwt}` },
        }
      );

      const chapitresExistants = oeuvreResponse.data.data.chapitres || [];
      const urlsExistantes = chapitresExistants.map((chapitre) => chapitre.url);

      let dernierOrder = 0;
      if (chapitresExistants.length > 0) {
        const dernierChapitre = chapitresExistants.reduce((maxChapitre, currentChapitre) =>
          currentChapitre.order > maxChapitre.order ? currentChapitre : maxChapitre
        );
        dernierOrder = parseInt(dernierChapitre.order, 10);
      }

      const payloads = [];
      const errors = [];

      lignes.forEach((ligne, index) => {
        const parts = ligne.split(";").map((part) => part.trim());

        if (parts.length < 2 || parts.length > 3) {
          errors.push(`Format invalide à la ligne ${index + 1}: "${ligne}".`);
          return;
        }

        const [titre, tomeOrUrl, url] = parts;
        const tome = parts.length === 3 ? tomeOrUrl : "";
        const finalUrl = parts.length === 3 ? url : tomeOrUrl;

        if (urlsExistantes.includes(finalUrl)) {
          errors.push(`L'URL "${finalUrl}" à la ligne ${index + 1} est déjà attribuée.`);
          return;
        }

        payloads.push({
          data: {
            titre,
            tome,
            url: finalUrl,
            order: dernierOrder + payloads.length + 1,
            oeuvres: [oeuvre.documentId],
            users_permissions_users: [user.documentId],
          },
        });
      });

      let successCount = 0;

      for (let i = 0; i < payloads.length; i++) {
        await axios.post("https://novel-index-strapi.onrender.com/api/chapitres", payloads[i], {
          headers: {
            Authorization: `Bearer ${jwt}`,
            "Content-Type": "application/json",
          },
        });

        successCount++;

        // 🔹 Mise à jour de la progression
        setProgress(((successCount / payloads.length) * 100).toFixed(0));

        // 🔹 Pause toutes les 100 requêtes
        if (successCount % 80 === 0) {
          await new Promise((resolve) => setTimeout(resolve, 5000)); // Pause de 2 secondes
        }
      }

      let successMessage = `${successCount} chapitres ajoutés avec succès !`;
      if (errors.length > 0) {
        successMessage += ` Certaines erreurs ont été détectées :\n${errors.join("\n")}`;
      }

      setMessage(successMessage);
      setChapitres(""); // Réinitialiser le textarea
    } catch (error) {
      console.error("Erreur lors de l'ajout :", error.response?.data || error.message);
      setMessage("Erreur lors de l'ajout des chapitres. Vérifiez le format des lignes.");
    }

    setLoading(false);
  };

  return (
    <div className="w-full max-w-4xl mx-auto bg-gray-800 p-6 rounded-lg shadow-lg text-white space-y-12">
      <h1 className="text-2xl font-bold mb-6 text-center">Ajouter plusieurs chapitres</h1>
      {message && <p className="mb-4 text-center text-yellow-400 whitespace-pre-line">{message}</p>}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="chapitres" className="block text-sm font-medium">
            Chapitres (une ligne par chapitre : "titre ; tome ; url" ou "titre ; url")
          </label>
          <textarea
            id="chapitres"
            name="chapitres"
            value={chapitres}
            onChange={handleChange}
            rows={10}
            className="mt-1 block w-full p-2 bg-gray-700 border border-gray-600 rounded-lg
             whitespace-nowrap overflow-auto resize-none"
            placeholder={`Exemples de format :\nChapitre 1 ; Tome 1 ; https://example.com\nChapitre 2 ; https://example.com`}
            required
          />
        </div>

        {/* Barre de progression */}
        {loading && (
          <div className="w-full bg-gray-600 rounded-lg overflow-hidden">
            <div
              className="h-4 bg-blue-500 text-xs font-bold text-center text-white transition-all duration-500"
              style={{ width: `${progress}%` }}
            >
              {progress}%
            </div>
          </div>
        )}

        <button
          type="submit"
          className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-white font-bold"
          disabled={loading}
        >
          {loading ? "Ajout en cours..." : "Ajouter les chapitres"}
        </button>
      </form>

      <button
        onClick={() => setShowConstructeur(!showConstructeur)}
        className="w-full py-3 bg-green-600 hover:bg-green-700 rounded-lg text-white font-bold"
      >
        {showConstructeur ? "Cacher le Constructeur d'URL" : "Afficher le Constructeur d'URL"}
      </button>

      {showConstructeur && <ConstructeurUrl user={user} oeuvre={oeuvre} />}
    </div>
  );
};

export default PlusieursChapitre;
