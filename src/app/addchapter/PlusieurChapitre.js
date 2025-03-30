"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import ConstructeurUrl from "./ConstructeurUrl";
import { motion } from "framer-motion";


const PlusieursChapitre = ({ user, oeuvre }) => {
  const [chapitres, setChapitres] = useState("");
  const [message, setMessage] = useState(null);
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showConstructeur, setShowConstructeur] = useState(false);
  const [dernierOrder, setDernierOrder] = useState(0);


  const handleChange = (e) => {
    setChapitres(e.target.value);
  };


  useEffect(() => {
    const fetchLastOrder = async () => {
      try {
        const jwt = localStorage.getItem("jwt");
  
        if (!jwt || !oeuvre?.documentId) {
          console.log("❌ Pas de JWT ou documentId !");
          return;
        }
  
        const res = await axios.get(
          `https://novel-index-strapi.onrender.com/api/oeuvres/${oeuvre.documentId}?populate=chapitres`,
          {
            headers: { Authorization: `Bearer ${jwt}` },
          }
        );
  
        const chapitres = res.data.data.chapitres || [];
  
        console.log("📚 Chapitres récupérés :", chapitres);
  
        if (chapitres.length === 0) {
          console.log("ℹ️ Aucun chapitre existant. Order = 1");
          return;
        }
  
        const dernierChapitre = chapitres.reduce((maxChapitre, currentChapitre) => {
          const maxOrder = parseInt(maxChapitre.order || 0, 10);
          const currOrder = parseInt(currentChapitre.order || 0, 10);
          return currOrder > maxOrder ? currentChapitre : maxChapitre;
        });
  
        const foundOrder = parseInt(dernierChapitre.order, 10);
        setDernierOrder(foundOrder);
        console.log("✅ Dernier chapitre :", dernierChapitre);
        console.log("📈 Dernier order :", foundOrder);
      } catch (error) {
        console.error("❌ Erreur dans le fetch de dernier order :", error.message);
      }
    };
  
    fetchLastOrder();
  }, [oeuvre?.documentId]);
  
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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full max-w-4xl mx-auto bg-gray-900 p-6 rounded-xl shadow-lg text-white space-y-10"
    >
      <h1 className="text-3xl font-bold text-center mb-4">📚 Ajouter plusieurs chapitres</h1>
  
      {message && (
        <p className="text-yellow-400 whitespace-pre-line text-center bg-gray-800 p-3 rounded-lg border border-yellow-500">
          {message}
        </p>
      )}
  
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Zone de saisie des chapitres */}
        <div>
          <label htmlFor="chapitres" className="block text-sm font-semibold mb-1">
            Liste des chapitres
          </label>
          <textarea
            id="chapitres"
            name="chapitres"
            value={chapitres}
            onChange={handleChange}
            rows={10}
            className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-sm resize-none placeholder-gray-500"
            placeholder={`Chapitre 1 ; Tome 1 ; https://exemple.com\nChapitre 2 ; https://exemple.com`}
            required
          />
          <p className="text-xs text-gray-400 mt-1">
            ➕ Une ligne par chapitre, séparé par un point-virgule. Le tome est optionnel.
          </p>
        </div>
  
        {/* Barre de progression */}
        {loading && (
          <div className="w-full bg-gray-700 rounded-lg overflow-hidden shadow-inner">
            <motion.div
              className="h-4 bg-blue-500 text-xs font-semibold text-center text-white"
              style={{ width: `${progress}%` }}
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ ease: "easeOut", duration: 0.5 }}
            >
              {progress}%
            </motion.div>
          </div>
        )}
  
        {/* Bouton de validation */}
        <button
          type="submit"
          className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 rounded-lg font-bold transition"
          disabled={loading}
        >
          {loading ? "⏳ Ajout en cours..." : "✅ Ajouter les chapitres"}
        </button>
      </form>
  
      {/* Bouton toggle pour le constructeur d'URL */}
      <motion.button
        onClick={() => setShowConstructeur(!showConstructeur)}
        className="w-full py-3 bg-green-600 hover:bg-green-700 rounded-lg text-white font-bold transition"
        whileTap={{ scale: 0.97 }}
      >
        {showConstructeur ? "🛠️ Cacher le Constructeur d'URL" : "🛠️ Afficher le Constructeur d'URL"}
      </motion.button>
  
      {/* Affichage conditionnel du constructeur */}
      {showConstructeur && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <ConstructeurUrl user={user} oeuvre={oeuvre} />
        </motion.div>
      )}
    </motion.div>
  );
  
};

export default PlusieursChapitre;
