"use client";

import React, { useState } from "react";
import axios from "axios";
import ConstructeurUrl from "./ConstructeurUrl";

const PlusieursChapitre = ({ user, oeuvre }) => {
  const [chapitres, setChapitres] = useState("");
  const [message, setMessage] = useState(null);
  const [showConstructeur, setShowConstructeur] = useState(false);

  const handleChange = (e) => {
    setChapitres(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const jwt = localStorage.getItem("jwt");

      if (!jwt) {
        setMessage("Vous devez être connecté pour ajouter des chapitres.");
        return;
      }

      const lignes = chapitres
        .split("\n")
        .map((ligne) => ligne.trim())
        .filter((ligne) => ligne);

      if (lignes.length === 0) {
        setMessage("Aucun chapitre n'a été saisi.");
        return;
      }

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
          errors.push(
            `Format invalide à la ligne ${index + 1}: "${ligne}". Utilisez "titre ; tome ; url" ou "titre ; url".`
          );
          return;
        }

        const [titre, tomeOrUrl, url] = parts;
        const tome = parts.length === 3 ? tomeOrUrl : "";
        const finalUrl = parts.length === 3 ? url : tomeOrUrl;

        // Contrôle de l'URL déjà attribuée
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

      for (const payload of payloads) {
        await axios.post("https://novel-index-strapi.onrender.com/api/chapitres", payload, {
          headers: {
            Authorization: `Bearer ${jwt}`,
            "Content-Type": "application/json",
          },
        });
      }

      let successMessage = `${payloads.length} chapitres ajoutés avec succès !`;
      if (errors.length > 0) {
        successMessage += ` Cependant, certaines erreurs ont été détectées :\n${errors.join(
          "\n"
        )}`;
      }
      setMessage(successMessage);
      setChapitres(""); // Réinitialiser le textarea
    } catch (error) {
      console.error("Erreur lors de l'ajout :", error.response?.data || error.message);
      setMessage("Erreur lors de l'ajout des chapitres. Vérifiez le format des lignes.");
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto bg-gray-800 p-6 rounded-lg shadow-lg text-white space-y-12">
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
            className="mt-1 block w-full p-2 bg-gray-700 border border-gray-600 rounded-lg"
            placeholder={`Exemples :\nChapitre 1 ; Tome 1 ; https://example.com\nChapitre 2 ; https://example.com`}
            required
          />
        </div>

        <button
          type="submit"
          className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-white font-bold"
        >
          Ajouter les chapitres
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
