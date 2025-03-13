"use client";

import React, { useState } from "react";
import axios from "axios";

const OneChapitre = ({ user, oeuvre }) => {
  const [formData, setFormData] = useState({
    titre: "",
    tome: "",
    url: "",
    order: "",
  });

  const [message, setMessage] = useState(null);

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

      console.log("Début de la soumission...");
      console.log("Utilisateur :", user);
      console.log("Œuvre :", oeuvre);
      console.log("Données du formulaire :", formData);

      // Contrôle du nom de domaine uniquement si nomdomaine est défini
      if (oeuvre.nomdomaine) {
        const urlParts = formData.url.split('/'); // Découper l'URL en parties
        const extractedDomain = `${urlParts[0]}//${urlParts[2]}`; // Reconstruire jusqu'au troisième "/"

        if (extractedDomain !== oeuvre.nomdomaine) {
          setMessage(
            `L'URL du chapitre ne correspond pas au nom de domaine attendu : ${oeuvre.nomdomaine}`
          );
          return;
        }
        console.log("Nom de domaine validé :", extractedDomain);
      } else {
        console.log("Aucun contrôle sur le nom de domaine car nomdomaine est null.");
      }

      // Vérification si l'URL existe déjà
      const urlCheckResponse = await axios.get(
        `http://localhost:1337/api/chapitres?filters[url][$eq]=${formData.url}`,
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
        `http://localhost:1337/api/oeuvres/${oeuvre.documentId}?populate=chapitres`,
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
          currentChapitre.order > maxChapitre.order ? currentChapitre : maxChapitre
        );

        nouvelOrdre = parseInt(dernierChapitre.order, 10) + 1; // Conversion explicite en entier avant d'ajouter 1
      }

      console.log("Dernier chapitre :", dernierChapitre);
      console.log("Nouvel ordre calculé :", nouvelOrdre);

      // Préparation du payload
      const payload = {
        data: {
          titre: formData.titre,
          tome: formData.tome,
          url: formData.url,
          order: nouvelOrdre, // Order calculé automatiquement
          oeuvres: [oeuvre.documentId], // Lien avec l'œuvre
          users_permissions_users: [user.documentId], // Lien avec l'utilisateur
        },
      };

      console.log("Payload envoyé :", payload);

      // Envoi des données à l'API
      const response = await axios.post("http://localhost:1337/api/chapitres", payload, {
        headers: {
          Authorization: `Bearer ${jwt}`,
          "Content-Type": "application/json",
        },
      });

      console.log("Réponse API :", response.data);
      setMessage("Chapitre ajouté avec succès !");
      setFormData({ titre: "", tome: "", url: "", order: "" });
    } catch (error) {
      console.error("Erreur lors de l'ajout :", error.response?.data || error.message);
      setMessage("Erreur lors de l'ajout du chapitre.");
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto bg-gray-800 p-6 rounded-lg shadow-lg text-white">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Ajouter un chapitre</h1>
      </div>

      {message && <p className="mb-4 text-center text-yellow-400">{message}</p>}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Titre */}
        <div>
          <label htmlFor="titre" className="block text-sm font-medium">
            Titre du chapitre
          </label>
          <input
            type="text"
            id="titre"
            name="titre"
            value={formData.titre}
            onChange={handleChange}
            className="mt-1 block w-full p-2 bg-gray-700 border border-gray-600 rounded-lg"
            required
          />
        </div>

        {/* Tome */}
        <div>
          <label htmlFor="tome" className="block text-sm font-medium">
            Tome
          </label>
          <input
            type="text"
            id="tome"
            name="tome"
            value={formData.tome}
            onChange={handleChange}
            className="mt-1 block w-full p-2 bg-gray-700 border border-gray-600 rounded-lg"
          />
        </div>

        {/* URL */}
        <div>
          <label htmlFor="url" className="block text-sm font-medium">
            URL du chapitre
          </label>
          <input
            type="text"
            id="url"
            name="url"
            value={formData.url}
            onChange={handleChange}
            className="mt-1 block w-full p-2 bg-gray-700 border border-gray-600 rounded-lg"
            required
          />
        </div>

        {/* Order */}
        <div>
          <label htmlFor="order" className="block text-sm font-medium">
            Ordre du chapitre (géré automatiquement)
          </label>
          <input
            type="number"
            id="order"
            name="order"
            value={formData.order}
            readOnly
            className="mt-1 block w-full p-2 bg-gray-700 border border-gray-600 rounded-lg"
          />
        </div>

        {/* Bouton Soumettre */}
        <button
          type="submit"
          className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-white font-bold"
        >
          Ajouter le chapitre
        </button>
      </form>
    </div>
  );
};

export default OneChapitre;
