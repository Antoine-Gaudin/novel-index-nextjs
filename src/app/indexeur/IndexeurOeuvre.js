"use client";

import React, { useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";

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
  const [preview, setPreview] = useState(null);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" || type === "radio" ? checked : value,
    });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];

    if (file) {
      setFormData({
        ...formData,
        couverture: file,
      });

      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
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
      const response = await axios.post(
        `https://novel-index-strapi.onrender.com/api/oeuvres`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${jwt}`,
            "Content-Type": "application/json",
          },
        }
      );

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
          const uploadResponse = await axios.post(
            "https://novel-index-strapi.onrender.com/api/upload",
            uploadData,
            {
              headers: {
                Authorization: `Bearer ${jwt}`,
              },
            }
          );
          console.log("Upload réussi :", uploadResponse.data);
        } catch (error) {
          console.warn(
            "Erreur lors de l'upload :",
            error.response?.data || error.message
          );
          // Masquer l'erreur et continuer
          setMessage(
            "Œuvre ajoutée avec succès, mais une erreur mineure s'est produite lors de l'upload de la couverture."
          );
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
      console.error(
        "Erreur lors de l'ajout :",
        error.response?.data || error.message
      );
      setMessage("Erreur lors de l'ajout de l'œuvre.");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
      className="w-full max-w-4xl mx-auto bg-gray-900 p-8 rounded-2xl shadow-2xl text-white"
    >
      <h1 className="text-3xl font-bold mb-6 text-center">
        📚 Ajouter une œuvre
      </h1>

      {message && (
        <p className="mb-4 text-center text-yellow-400 font-medium">
          {message}
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* 1. Infos principales */}
        <fieldset className="border border-gray-700 p-6 rounded-xl">
          <legend className="text-lg font-semibold px-2 text-indigo-400">
            Informations principales
          </legend>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
            {/* Titre */}
            <div>
              <label htmlFor="titre" className="block text-sm font-medium mb-1">
                Titre *
              </label>
              <input
                type="text"
                id="titre"
                name="titre"
                required
                value={formData.titre}
                onChange={handleChange}
                className="bg-gray-800 border border-gray-600 rounded-lg p-2 w-full"
              />
            </div>

            {/* Titre alternatif */}
            <div>
              <label
                htmlFor="titrealt"
                className="block text-sm font-medium mb-1"
              >
                Titre alternatif
              </label>
              <input
                type="text"
                id="titrealt"
                name="titrealt"
                value={formData.titrealt}
                onChange={handleChange}
                className="bg-gray-800 border border-gray-600 rounded-lg p-2 w-full"
              />
            </div>

            {/* Auteur */}
            <div>
              <label
                htmlFor="auteur"
                className="block text-sm font-medium mb-1"
              >
                Auteur *
              </label>
              <input
                type="text"
                id="auteur"
                name="auteur"
                required
                value={formData.auteur}
                onChange={handleChange}
                className="bg-gray-800 border border-gray-600 rounded-lg p-2 w-full"
              />
            </div>

            {/* Traduction */}
            <div>
              <label
                htmlFor="traduction"
                className="block text-sm font-medium mb-1"
              >
                Traduction
              </label>
              <input
                type="text"
                id="traduction"
                name="traduction"
                value={formData.traduction}
                onChange={handleChange}
                className="bg-gray-800 border border-gray-600 rounded-lg p-2 w-full"
              />
            </div>
          </div>
        </fieldset>

        {/* 2. Détails */}
        <fieldset className="border border-gray-700 p-6 rounded-xl">
          <legend className="text-lg font-semibold px-2 text-indigo-400">
            Détails de l'œuvre
          </legend>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
            <div>
              <label
                htmlFor="synopsis"
                className="block text-sm font-medium mb-1"
              >
                Synopsis
              </label>
              <textarea
                id="synopsis"
                name="synopsis"
                value={formData.synopsis}
                onChange={handleChange}
                rows="4"
                className="bg-gray-800 border border-gray-600 rounded-lg p-2 w-full"
              ></textarea>
            </div>

            <div>
              <label htmlFor="annee" className="block text-sm font-medium mb-1">
                Année
              </label>
              <input
                type="number"
                id="annee"
                name="annee"
                value={formData.annee}
                onChange={handleChange}
                className="bg-gray-800 border border-gray-600 rounded-lg p-2 w-full"
              />
            </div>

            <div>
              <label htmlFor="etat" className="block text-sm font-medium mb-1">
                État
              </label>
              <select
                id="etat"
                name="etat"
                value={formData.etat}
                onChange={handleChange}
                className="bg-gray-800 border border-gray-600 rounded-lg p-2 w-full"
              >
                <option value="">-- Sélectionnez --</option>
                <option value="En cours">En cours</option>
                <option value="Terminé">Terminé</option>
                <option value="Abandonné">Abandonné</option>
                <option value="Libre">Libre</option>
                <option value="En pause">En pause</option>
                <option value="En attente">En attente</option>
              </select>
            </div>

            <div>
              <label htmlFor="type" className="block text-sm font-medium mb-1">
                Type
              </label>
              <select
                id="type"
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="bg-gray-800 border border-gray-600 rounded-lg p-2 w-full"
              >
                <option value="">-- Sélectionnez --</option>
                <option value="Light novel">Light novel</option>
                <option value="Web novel">Web novel</option>
                <option value="Scan">Scan</option>
                <option value="Webtoon">Webtoon</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="categorie"
                className="block text-sm font-medium mb-1"
              >
                Catégorie
              </label>
              <select
                id="categorie"
                name="categorie"
                value={formData.categorie}
                onChange={handleChange}
                className="bg-gray-800 border border-gray-600 rounded-lg p-2 w-full"
              >
                <option value="">-- Sélectionnez --</option>
                <option value="Shonen">Shonen</option>
                <option value="Seinen">Seinen</option>
                <option value="Shojo">Shojo</option>
                <option value="Isekai">Isekai</option>
              </select>
            </div>
          </div>
        </fieldset>

        {/* 3. Autres infos */}
        <fieldset className="border border-gray-700 p-6 rounded-xl">
          <legend className="text-lg font-semibold px-2 text-indigo-400">
            Autres informations
          </legend>
          <div className="space-y-6 mt-4">
            {/* Licence */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Œuvre licenciée en France ?
              </label>
              <div className="flex items-center space-x-4">
                <span className="text-sm">Non</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="licence"
                    checked={formData.licence === true}
                    onChange={(e) =>
                      handleChange({
                        target: { name: "licence", value: e.target.checked },
                      })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-600 peer-checked:bg-green-500 rounded-full transition-all"></div>
                  <div className="absolute w-4 h-4 bg-white rounded-full shadow left-1 top-1 transition-transform peer-checked:translate-x-full"></div>
                </label>
                <span className="text-sm">Oui</span>
              </div>
            </div>

            {/* Langage */}
            <div>
              <label
                htmlFor="langage"
                className="block text-sm font-medium mb-1"
              >
                Langage
              </label>
              <input
                type="text"
                id="langage"
                name="langage"
                value={formData.langage || "Français"}
                onChange={handleChange}
                className="bg-gray-800 border border-gray-600 rounded-lg p-2 w-full"
              />
            </div>

            <div>
              <label
                htmlFor="couverture"
                className="block text-sm font-semibold mb-2"
              >
                🖼️ Couverture
              </label>

              <div className="relative border-2 border-dashed border-gray-600 bg-gray-800 rounded-xl p-6 flex flex-col items-center justify-center hover:border-indigo-500 transition-all duration-200">
                {preview ? (
                  <img
                    src={preview}
                    alt="Prévisualisation"
                    className="w-full h-auto object-cover rounded-lg"
                  />
                ) : (
                  <>
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
                      Glissez-déposez une image ou cliquez pour choisir un
                      fichier
                    </p>
                  </>
                )}

                <input
                  type="file"
                  id="couverture"
                  name="couverture"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  accept="image/*"
                />
              </div>
            </div>
          </div>
        </fieldset>

        <button
          type="submit"
          className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 rounded-lg font-bold text-white mt-4 transition"
        >
          ✅ Ajouter l'œuvre
        </button>
      </form>
    </motion.div>
  );
};

export default IndexeurOeuvre;
