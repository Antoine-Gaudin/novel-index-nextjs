"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import { motion } from "framer-motion";
const OneChapitre = ({ user, oeuvre }) => {
  const [formData, setFormData] = useState({
    titre: "",
    tome: "",
    url: "",
    order: "",
  });

  const [message, setMessage] = useState(null);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const jwt = localStorage.getItem("jwt");
        if (!jwt || !oeuvre?.documentId) return;
  
        const res = await axios.get(
          `https://novel-index-strapi.onrender.com/api/oeuvres/${oeuvre.documentId}?populate=chapitres`,
          {
            headers: { Authorization: `Bearer ${jwt}` },
          }
        );
  
        const chapitres = res.data.data.chapitres || [];
        console.log("Tous les chapitres récupérés :", chapitres);
  
        let nouvelOrdre = 1;
  
        if (chapitres.length > 0) {
          const dernier = chapitres.reduce((max, c) => {
            const maxOrder = parseInt(max.order, 10);
            const currentOrder = parseInt(c.order, 10);
            return currentOrder > maxOrder ? c : max;
          });
  
          console.log("Dernier chapitre détecté :", dernier);
          nouvelOrdre = parseInt(dernier.order, 10) + 1;
        }
  
        setFormData((prev) => ({
          ...prev,
          order: nouvelOrdre,
        }));
      } catch (err) {
        console.error("Erreur récupération ordre :", err);
      }
    };
  
    fetchOrder();
  }, [oeuvre?.documentId]);
  

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const jwt = localStorage.getItem("jwt");

      if (!jwt) {
        setMessage("Vous devez être connecté pour ajouter un chapitre.");
        return;
      }

      // Contrôle du nom de domaine uniquement si nomdomaine est défini
      if (oeuvre.nomdomaine) {
        const urlParts = formData.url.split("/"); // Découper l'URL en parties
        const extractedDomain = `${urlParts[0]}//${urlParts[2]}`; // Reconstruire jusqu'au troisième "/"

        if (extractedDomain !== oeuvre.nomdomaine) {
          setMessage(
            `L'URL du chapitre ne correspond pas au nom de domaine attendu : ${oeuvre.nomdomaine}`
          );
          return;
        }
        console.log("Nom de domaine validé :", extractedDomain);
      } else {
        console.log(
          "Aucun contrôle sur le nom de domaine car nomdomaine est null."
        );
      }

      // Vérification si l'URL existe déjà
      const urlCheckResponse = await axios.get(
        `https://novel-index-strapi.onrender.com/api/chapitres?filters[url][$eq]=${formData.url}`,
        {
          headers: { Authorization: `Bearer ${jwt}` },
        }
      );

      if (urlCheckResponse.data.data.length > 0) {
        setMessage("L'URL existe déjà. Veuillez en utiliser une autre.");
        return;
      }

      console.log("URL validée, aucune duplication détectée.");

      // Récupération des chapitres de l'œuvre
      console.log("Récupération des chapitres de l'œuvre :", oeuvre.documentId);

      const oeuvreResponse = await axios.get(
        `https://novel-index-strapi.onrender.com/api/oeuvres/${oeuvre.documentId}?populate=chapitres`,
        {
          headers: { Authorization: `Bearer ${jwt}` },
        }
      );

      const chapitres = oeuvreResponse.data.data.chapitres;
      console.log("Chapitres récupérés :", chapitres);

      // Calcul de l'ordre basé sur le dernier chapitre
      let nouvelOrdre = 1; // Par défaut, si aucun chapitre
      let dernierChapitre = null;

      if (chapitres.length > 0) {
        dernierChapitre = chapitres.reduce((maxChapitre, currentChapitre) =>
          currentChapitre.order > maxChapitre.order
            ? currentChapitre
            : maxChapitre
        );

        nouvelOrdre = parseInt(dernierChapitre.order, 10) + 1; // Conversion explicite en entier avant d'ajouter 1
      }

      setFormData((prev) => ({
        ...prev,
        order: nouvelOrdre,
      }));

      console.log("Dernier chapitre :", dernierChapitre);
      console.log("Nouvel ordre calculé :", nouvelOrdre);

      // Préparation du payload
      const payload = {
        data: {
          titre: formData.titre,
          tome: formData.tome,
          url: formData.url,
          order: formData.order, // Order calculé automatiquement
          oeuvres: [oeuvre.documentId], // Lien avec l'œuvre
          users_permissions_users: [user.documentId], // Lien avec l'utilisateur
        },
      };

      console.log("Payload envoyé :", payload);

      // Envoi des données à l'API
      const response = await axios.post(
        "https://novel-index-strapi.onrender.com/api/chapitres",
        payload,
        {
          headers: {
            Authorization: `Bearer ${jwt}`,
            "Content-Type": "application/json",
          },
        }
      );

      console.log("Réponse API :", response.data);
      setMessage("Chapitre ajouté avec succès !");
      setFormData({ titre: "", tome: "", url: "", order: formData.order + 1 });
    } catch (error) {
      console.error(
        "Erreur lors de l'ajout :",
        error.response?.data || error.message
      );
      setMessage("Erreur lors de l'ajout du chapitre.");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-2xl mx-auto bg-gray-900 p-6 rounded-xl text-white"
    >
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">📘 Ajouter un chapitre</h1>
      </div>

      {message && <p className="mb-4 text-center text-yellow-400">{message}</p>}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 📝 Titre */}
        <div>
          <label htmlFor="titre" className="block text-sm font-semibold mb-1">
            Titre du chapitre
          </label>
          <input
            type="text"
            id="titre"
            name="titre"
            value={formData.titre}
            onChange={handleChange}
            className="block w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-sm"
            required
          />
        </div>

        {/* 📚 Tome */}
        <div>
          <label htmlFor="tome" className="block text-sm font-semibold mb-1">
            Tome (optionnel)
          </label>
          <input
            type="text"
            id="tome"
            name="tome"
            value={formData.tome}
            onChange={handleChange}
            className="block w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-sm"
          />
        </div>

        {/* 🔗 URL */}
        <div>
          <label htmlFor="url" className="block text-sm font-semibold mb-1">
            URL du chapitre
          </label>
          <input
            type="text"
            id="url"
            name="url"
            value={formData.url}
            onChange={handleChange}
            className="block w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-sm"
            required
          />
        </div>

        <div>
          <label htmlFor="order" className="block text-sm font-semibold mb-1">
            Ordre du chapitre
          </label>
          <input
            type="number"
            id="order"
            name="order"
            value={formData.order}
            onChange={handleChange}
            className="block w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white"
          />
        </div>

        {/* ✅ Soumettre */}
        <button
          type="submit"
          className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 rounded-lg font-bold text-white text-sm transition"
        >
          ➕ Ajouter le chapitre
        </button>
      </form>
    </motion.div>
  );
};

export default OneChapitre;
