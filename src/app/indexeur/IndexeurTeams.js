"use client";

import React, { useState } from "react";
import axios from "axios";

const IndexeurTeams = ({ user }) => {
  const [formData, setFormData] = useState({
    titre: "",
    description: "",
    etat: false,
    couverture: null, // Pour un fichier média
    teamliens: [], // Liens associés (Teamliens)
    users_permissions_user: user.documentId, // Relation avec l'utilisateur
  });

  const [newLien, setNewLien] = useState({ titre: "", url: "" }); // Nouveau lien à ajouter
  const [message, setMessage] = useState(null);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleFileChange = (e) => {
    setFormData({ ...formData, couverture: e.target.files[0] });
  };

  const handleNewLienChange = (e) => {
    const { name, value } = e.target;
    setNewLien({ ...newLien, [name]: value });
  };

  const handleAddLien = () => {
    if (newLien.titre && newLien.url) {
      setFormData({
        ...formData,
        teamliens: [...formData.teamliens, newLien],
      });
      setNewLien({ titre: "", url: "" });
    } else {
      alert("Veuillez remplir le titre et l'URL du lien.");
    }
  };

  const handleRemoveLien = (index) => {
    const updatedLiens = formData.teamliens.filter((_, i) => i !== index);
    setFormData({ ...formData, teamliens: updatedLiens });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const jwt = localStorage.getItem("jwt");

      if (!jwt) {
        setMessage("Vous devez être connecté pour ajouter une team.");
        return;
      }

      // Construction du payload pour Strapi
      const teamPayload = {
        data: {
          titre: formData.titre,
          description: formData.description,
          etat: formData.etat,
          users_permissions_user: formData.users_permissions_user, // Relation utilisateur
        },
      };

      console.log("Payload envoyé pour la team :", teamPayload);

      // Création de la team
      const response = await axios.post("http://localhost:1337/api/teams", teamPayload, {
        headers: {
          Authorization: `Bearer ${jwt}`,
          "Content-Type": "application/json",
        },
      });

      const teamDocumentId = response.data.data.documentId; // Récupérer le documentId de la team créée
      console.log("Team créée avec documentId :", teamDocumentId);

      // Envoi de la couverture si elle existe
      if (formData.couverture) {
        const coverData = new FormData();
        coverData.append("files", formData.couverture);
        coverData.append("ref", "team"); // Nom de la collection
        coverData.append("refId", teamDocumentId); // documentId de la team
        coverData.append("field", "couverture");

        try {
          await axios.post("http://localhost:1337/api/upload", coverData, {
            headers: {
              Authorization: `Bearer ${jwt}`,
              "Content-Type": "multipart/form-data",
            },
          });

          console.log("Couverture ajoutée avec succès.");
        } catch (uploadError) {
          if (uploadError.response?.status === 500) {
            console.warn("Erreur mineure 500 ignorée pour l'ajout de la couverture.");
          } else {
            throw uploadError; // Propager les autres erreurs
          }
        }
      }

      // Création des liens associés (Teamliens)
      for (const lien of formData.teamliens) {
        const teamLienPayload = {
          data: {
            titre: lien.titre,
            url: lien.url,
            teams: [teamDocumentId], // Relation avec la team créée
          },
        };

        console.log("Payload envoyé pour le teamlien :", teamLienPayload);

        await axios.post("http://localhost:1337/api/teamliens", teamLienPayload, {
          headers: {
            Authorization: `Bearer ${jwt}`,
            "Content-Type": "application/json",
          },
        });
      }

      setMessage("Team ajoutée avec succès !");
      setFormData({
        titre: "",
        description: "",
        etat: false,
        couverture: null,
        teamliens: [],
        users_permissions_user: user.documentId,
      });
    } catch (error) {
      console.error("Erreur lors de l'ajout :", error.response?.data || error.message);
      setMessage("Erreur lors de l'ajout de la team.");
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto bg-gray-800 p-6 rounded-lg shadow-lg text-white">
      <h1 className="text-2xl font-bold mb-6 text-center">Ajouter une Team</h1>
      {message && <p className="mb-4 text-center text-yellow-400">{message}</p>}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Titre */}
        <div>
          <label htmlFor="titre" className="block text-sm font-medium">
            Titre
          </label>
          <input
            type="text"
            id="titre"
            name="titre"
            value={formData.titre}
            onChange={handleInputChange}
            className="mt-1 block w-full p-2 bg-gray-700 border border-gray-600 rounded-lg"
            required
          />
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            rows={4}
            className="mt-1 block w-full p-2 bg-gray-700 border border-gray-600 rounded-lg"
          />
        </div>

        {/* État */}
        <div>
          <label htmlFor="etat" className="inline-flex items-center">
            <input
              type="checkbox"
              id="etat"
              name="etat"
              checked={formData.etat}
              onChange={handleInputChange}
              className="mr-2"
            />
            Actif ?
          </label>
        </div>

        {/* Couverture */}
        <div>
          <label htmlFor="couverture" className="block text-sm font-medium">
            Couverture
          </label>
          <input
            type="file"
            id="couverture"
            name="couverture"
            onChange={handleFileChange}
            className="mt-1 block w-full text-gray-300 bg-gray-700 border border-gray-600 rounded-lg"
          />
        </div>

        {/* Ajout des liens associés */}
        <div>
          <h2 className="text-lg font-bold mb-2">Liens associés</h2>
          <div className="flex items-center space-x-4">
            <input
              type="text"
              name="titre"
              value={newLien.titre}
              onChange={handleNewLienChange}
              placeholder="Titre du lien"
              className="flex-1 p-2 bg-gray-700 border border-gray-600 rounded-lg"
            />
            <input
              type="text"
              name="url"
              value={newLien.url}
              onChange={handleNewLienChange}
              placeholder="URL"
              className="flex-1 p-2 bg-gray-700 border border-gray-600 rounded-lg"
            />
            <button
              type="button"
              onClick={handleAddLien}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-white font-bold"
            >
              Ajouter
            </button>
          </div>
          <ul className="mt-4 space-y-2">
            {formData.teamliens.map((lien, index) => (
              <li
                key={index}
                className="flex items-center justify-between p-2 bg-gray-700 rounded-lg"
              >
                <span>
                  {lien.titre} - {lien.url}
                </span>
                <button
                  type="button"
                  onClick={() => handleRemoveLien(index)}
                  className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded-lg text-white font-bold"
                >
                  Supprimer
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Soumettre */}
        <button
          type="submit"
          className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-white font-bold"
        >
          Ajouter la Team
        </button>
      </form>
    </div>
  );
};

export default IndexeurTeams;
