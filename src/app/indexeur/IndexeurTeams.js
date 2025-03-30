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
      const response = await axios.post("https://novel-index-strapi.onrender.com/api/teams", teamPayload, {
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
          await axios.post("https://novel-index-strapi.onrender.com/api/upload", coverData, {
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

        await axios.post("https://novel-index-strapi.onrender.com/api/teamliens", teamLienPayload, {
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
    <div className="w-full max-w-4xl mx-auto bg-gray-900 p-8 rounded-2xl text-white space-y-6">
      <h1 className="text-3xl font-bold text-center mb-2">👥 Ajouter une Team</h1>
  
      {message && (
        <p className="text-center text-yellow-400 font-medium mb-4">{message}</p>
      )}
  
      <form onSubmit={handleSubmit} className="space-y-6">
  
        {/* 📝 Informations générales */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="titre" className="block text-sm font-semibold mb-1">
              Titre de la Team
            </label>
            <input
              type="text"
              id="titre"
              name="titre"
              value={formData.titre}
              onChange={handleInputChange}
              className="w-full p-2 bg-gray-800 border border-gray-700 rounded-lg"
              required
            />
          </div>
  
          <div className="flex items-center mt-6">
            <input
              type="checkbox"
              id="etat"
              name="etat"
              checked={formData.etat}
              onChange={handleInputChange}
              className="mr-2"
            />
            <label htmlFor="etat" className="text-sm text-gray-300">
              Cette team est elle active ?
            </label>
          </div>
        </div>
  
        {/* 🖋️ Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-semibold mb-1">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            rows={4}
            className="w-full p-2 bg-gray-800 border border-gray-700 rounded-lg"
          />
        </div>
  
        <div>
  <label htmlFor="couverture" className="block text-sm font-semibold mb-2">
    🖼️ Image de couverture
  </label>

  <div className="relative border-2 border-dashed border-gray-600 bg-gray-800 rounded-xl p-6 flex flex-col items-center justify-center hover:border-indigo-500 transition-all duration-200">
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
      Glissez-déposez une image ou cliquez pour sélectionner un fichier
    </p>
    <input
      type="file"
      id="couverture"
      name="couverture"
      onChange={handleFileChange}
      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
    />
  </div>
</div>

  
        {/* 🔗 Liens associés */}
        <div>
          <h2 className="text-lg font-bold mb-2">🔗 Liens associés</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input
              type="text"
              name="titre"
              value={newLien.titre}
              onChange={handleNewLienChange}
              placeholder="Titre du lien"
              className="p-2 bg-gray-800 border border-gray-700 rounded-lg"
            />
            <input
              type="text"
              name="url"
              value={newLien.url}
              onChange={handleNewLienChange}
              placeholder="URL"
              className="p-2 bg-gray-800 border border-gray-700 rounded-lg"
            />
            <button
              type="button"
              onClick={handleAddLien}
              className="bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg px-4 py-2"
            >
              ➕ Ajouter
            </button>
          </div>
  
          {/* Liste des liens */}
          <ul className="mt-4 space-y-2">
            {formData.teamliens.map((lien, index) => (
              <li
                key={index}
                className="flex justify-between items-center bg-gray-800 p-3 rounded-lg"
              >
                <span className="text-sm">
                  <span className="font-semibold">{lien.titre}</span> —{" "}
                  <a
                    href={lien.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-400 hover:underline"
                  >
                    {lien.url}
                  </a>
                </span>
                <button
                  type="button"
                  onClick={() => handleRemoveLien(index)}
                  className="bg-red-600 hover:bg-red-700 text-white font-bold px-3 py-1 rounded"
                >
                  Supprimer
                </button>
              </li>
            ))}
          </ul>
        </div>
  
        {/* ✅ Soumission */}
        <button
          type="submit"
          className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-white font-bold text-lg"
        >
          ✅ Ajouter la Team
        </button>
      </form>
    </div>
  );
  
};

export default IndexeurTeams;
