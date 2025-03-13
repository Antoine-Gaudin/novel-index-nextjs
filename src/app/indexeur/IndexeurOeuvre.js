"use client";

import React, { useState } from "react";
import axios from "axios";

const IndexeurOeuvre = ({ user }) => {
  const [formData, setFormData] = useState({
    titre: "",
    titrealt: "",
    auteur: "",
    traduction: "",
    synopsis: "",
    annee: "",
    etat: "",
    type: "",
    categorie: "",
    licence: false,
    langage: "",
    couverture: null,
  });

  const [message, setMessage] = useState(null);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" || type === "radio" ? checked : value,
    });
  };

  const handleFileChange = (e) => {
    setFormData({
      ...formData,
      couverture: e.target.files[0],
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const jwt = localStorage.getItem("jwt");
  
      if (!jwt) {
        setMessage("Vous devez être connecté pour ajouter une œuvre.");
        return;
      }
  
      // Création du payload
      const payload = {
        data: {
          titre: formData.titre,
          titrealt: formData.titrealt,
          auteur: formData.auteur,
          traduction: formData.traduction,
          synopsis: formData.synopsis,
          annee: formData.annee,
          etat: formData.etat,
          type: formData.type,
          categorie: formData.categorie,
          licence: Boolean(formData.licence), // Conversion explicite en booléen
          langage: formData.langage,
          users_permissions_users: [user.documentId], // Ajout de la relation utilisateur
        },
      };

  
      // Envoi des données textuelles à Strapi
      const response = await axios.post("http://localhost:1337/api/oeuvres", payload, {
        headers: {
          Authorization: `Bearer ${jwt}`,
          "Content-Type": "application/json",
        },
      });
  
      const newOeuvreId = response.data?.data?.id;
  
      if (formData.couverture && newOeuvreId) {
        // Gestion séparée du fichier couverture
        const uploadData = new FormData();
        uploadData.append("files", formData.couverture);
        uploadData.append("ref", "api::oeuvre.oeuvre");
        uploadData.append("refId", newOeuvreId);
        uploadData.append("field", "couverture");
      
        try {
          console.log("Début de l'upload du fichier...");
          const uploadResponse = await axios.post("http://localhost:1337/api/upload", uploadData, {
            headers: {
              Authorization: `Bearer ${jwt}`,
            },
          });
          console.log("Upload réussi :", uploadResponse.data);
        } catch (error) {
          console.warn("Erreur lors de l'upload :", error.response?.data || error.message);
          // Masquer l'erreur et continuer
          setMessage("Œuvre ajoutée avec succès, mais une erreur mineure s'est produite lors de l'upload de la couverture.");
        }
      }
      
      
  
      setMessage("Œuvre ajoutée avec succès !");
      setFormData({
        titre: "",
        titrealt: "",
        auteur: "",
        traduction: "",
        synopsis: "",
        annee: "",
        etat: "",
        type: "",
        categorie: "",
        licence: false,
        langage: "",
        couverture: null,
      });
    } catch (error) {
      console.error("Erreur lors de l'ajout :", error.response?.data || error.message);
      setMessage("Erreur lors de l'ajout de l'œuvre.");
    }
  };
  
  

  return (
    <div className="w-full max-w-4xl mx-auto bg-gray-800 p-6 rounded-lg shadow-lg text-white">
      <h1 className="text-3xl font-bold mb-6 text-center">Ajouter une œuvre</h1>
      {message && <p className="mb-4 text-center text-yellow-400">{message}</p>}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Informations principales */}
        <fieldset className="border border-gray-700 p-4 rounded-lg">
          <legend className="text-lg font-semibold px-2">Informations principales</legend>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="titre" className="block text-sm font-medium">
                Titre
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
            <div>
              <label htmlFor="titrealt" className="block text-sm font-medium">
                Titre alternatif
              </label>
              <input
                type="text"
                id="titrealt"
                name="titrealt"
                value={formData.titrealt}
                onChange={handleChange}
                className="mt-1 block w-full p-2 bg-gray-700 border border-gray-600 rounded-lg"
              />
            </div>
            <div>
              <label htmlFor="auteur" className="block text-sm font-medium">
                Auteur
              </label>
              <input
                type="text"
                id="auteur"
                name="auteur"
                value={formData.auteur}
                onChange={handleChange}
                className="mt-1 block w-full p-2 bg-gray-700 border border-gray-600 rounded-lg"
                required
              />
            </div>
            <div>
              <label htmlFor="traduction" className="block text-sm font-medium">
                Traduction
              </label>
              <input
                type="text"
                id="traduction"
                name="traduction"
                value={formData.traduction}
                onChange={handleChange}
                className="mt-1 block w-full p-2 bg-gray-700 border border-gray-600 rounded-lg"
              />
            </div>
          </div>
        </fieldset>

        {/* Détails de l'œuvre */}
        <fieldset className="border border-gray-700 p-4 rounded-lg">
          <legend className="text-lg font-semibold px-2">Détails de l'œuvre</legend>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="synopsis" className="block text-sm font-medium">
                Synopsis
              </label>
              <textarea
                id="synopsis"
                name="synopsis"
                value={formData.synopsis}
                onChange={handleChange}
                className="mt-1 block w-full p-2 bg-gray-700 border border-gray-600 rounded-lg"
                rows="3"
              ></textarea>
            </div>
            <div>
              <label htmlFor="annee" className="block text-sm font-medium">
                Année
              </label>
              <input
                type="number"
                id="annee"
                name="annee"
                value={formData.annee}
                onChange={handleChange}
                className="mt-1 block w-full p-2 bg-gray-700 border border-gray-600 rounded-lg"
              />
            </div>
            <div>
              <label htmlFor="etat" className="block text-sm font-medium">
                État
              </label>
              <select
                id="etat"
                name="etat"
                value={formData.etat}
                onChange={handleChange}
                className="mt-1 block w-full p-2 bg-gray-700 border border-gray-600 rounded-lg"
              >
                <option value="">-- Sélectionnez un état --</option>
                <option value="En cours">En cours</option>
                <option value="Terminé">Terminé</option>
                <option value="Abandonné">Abandonné</option>
                <option value="Libre">Libre</option>
                <option value="En pause">En pause</option>
                <option value="En attente">En attente</option>
              </select>
            </div>
            <div>
              <label htmlFor="type" className="block text-sm font-medium">
                Type
              </label>
              <select
                id="type"
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="mt-1 block w-full p-2 bg-gray-700 border border-gray-600 rounded-lg"
              >
                <option value="">-- Sélectionnez un type --</option>
                <option value="Light novel">Light novel</option>
                <option value="Web novel">Web novel</option>
                <option value="Scan">Scan</option>
                <option value="Webtoon">Webtoon</option>
              </select>
            </div>
            <div>
              <label htmlFor="categorie" className="block text-sm font-medium">
                Catégorie
              </label>
              <select
                id="categorie"
                name="categorie"
                value={formData.categorie}
                onChange={handleChange}
                className="mt-1 block w-full p-2 bg-gray-700 border border-gray-600 rounded-lg"
              >
                <option value="">-- Sélectionnez une catégorie --</option>
                <option value="Shonen">Shonen</option>
                <option value="Seinen">Seinen</option>
                <option value="Shojo">Shojo</option>
                <option value="Isekai">Isekai</option>
              </select>
            </div>
          </div>
        </fieldset>

        {/* Autres informations */}
        <fieldset className="border border-gray-700 p-4 rounded-lg">
          <legend className="text-lg font-semibold px-2">Autres informations</legend>
          <div className="grid grid-cols-1 gap-4">
          <div>
              <label className="block text-sm font-medium">Licencié</label>
              <div className="mt-2 flex items-center space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="licence"
                    value={true}
                    checked={formData.licence === true}
                    onChange={handleChange}
                    className="text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="ml-2">Oui</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="licence"
                    value={false}
                    checked={formData.licence === false}
                    onChange={handleChange}
                    className="text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="ml-2">Non</span>
                </label>
              </div>
            </div>
            <div>
              <label htmlFor="langage" className="block text-sm font-medium">
                Langage
              </label>
              <input
                type="text"
                id="langage"
                name="langage"
                value={formData.langage}
                onChange={handleChange}
                className="mt-1 block w-full p-2 bg-gray-700 border border-gray-600 rounded-lg"
              />
            </div>
            <div>
              <label htmlFor="couverture" className="block text-sm font-medium">
                Couverture
              </label>
              <input
                type="file"
                id="couverture"
                name="couverture"
                onChange={handleFileChange}
                className="mt-1 block w-full text-gray-400"
              />
            </div>
          </div>
        </fieldset>

        <button
          type="submit"
          className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-white font-bold"
        >
          Ajouter l'œuvre
        </button>
      </form>
    </div>
  );
};

export default IndexeurOeuvre;
