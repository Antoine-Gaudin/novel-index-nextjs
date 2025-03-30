"use client";

import React, { useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";

const RemonterInfo = ({ user }) => {
  const [formData, setFormData] = useState({
    titre: "",
    contenu: "",
    signalement: false, // Par défaut non signalé
    origine: "Remonter une information (chapitre)", // Origine automatique
  });

  const [message, setMessage] = useState(null);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const jwt = localStorage.getItem("jwt");

      if (!jwt) {
        setMessage("Vous devez être connecté pour soumettre une information.");
        return;
      }

      console.log("Début de la soumission...");
      console.log("Utilisateur :", user);
      console.log("Données du formulaire :", formData);

      const payload = {
        data: {
          titre: formData.titre,
          contenu: formData.contenu,
          signalement: formData.signalement,
          origine: formData.origine,
        },
      };

      console.log("Payload envoyé :", payload);

      const response = await axios.post("https://novel-index-strapi.onrender.com/api/administrations", payload, {
        headers: {
          Authorization: `Bearer ${jwt}`,
          "Content-Type": "application/json",
        },
      });

      console.log("Réponse API :", response.data);
      setMessage("Information remontée avec succès !");
      setFormData({
        titre: "",
        contenu: "",
        signalement: false,
        origine: "Remonter une information (chapitre)",
      }); // Réinitialisation du formulaire
    } catch (error) {
      console.error("Erreur lors de la soumission :", error.response?.data || error.message);
      setMessage("Erreur lors de la soumission de l'information.");
    }
  };


  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full max-w-2xl mx-auto bg-gray-800 p-6 rounded-xl shadow-xl text-white space-y-8"
    >
      <h1 className="text-3xl font-bold text-center">📢 Remonter une information</h1>
  
      {message && (
        <p className="text-center text-yellow-400 text-sm">{message}</p>
      )}
  
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 📝 Titre */}
        <div>
          <label htmlFor="titre" className="block text-sm font-semibold mb-1">
            Titre de l'information
          </label>
          <input
            type="text"
            id="titre"
            name="titre"
            value={formData.titre}
            onChange={handleChange}
            className="block w-full p-2 bg-gray-700 border border-gray-600 rounded-lg"
            placeholder="Entrez un titre clair"
            required
          />
        </div>
  
        {/* 📄 Contenu */}
        <div>
          <label htmlFor="contenu" className="block text-sm font-semibold mb-1">
            Contenu
          </label>
          <textarea
            id="contenu"
            name="contenu"
            value={formData.contenu}
            onChange={handleChange}
            rows={8}
            className="block w-full p-2 bg-gray-700 border border-gray-600 rounded-lg"
            placeholder="Décrivez précisément le problème ou l'information à transmettre"
            required
          />
        </div>
  
        {/* 🚨 Signalement Urgent */}
        <div className="flex items-center space-x-3">
          <input
            type="checkbox"
            id="signalement"
            name="signalement"
            checked={formData.signalement}
            onChange={handleChange}
            className="h-5 w-5 text-indigo-600"
          />
          <label htmlFor="signalement" className="text-sm">
            Marquer comme signalement urgent 🚨
          </label>
        </div>
  
        {/* 📤 Soumettre */}
        <button
          type="submit"
          className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-white font-bold transition"
        >
          Soumettre l'information
        </button>
      </form>
    </motion.div>
  );
  
};

export default RemonterInfo;
