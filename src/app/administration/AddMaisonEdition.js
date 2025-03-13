"use client";

import React, { useState } from "react";
import axios from "axios";

const AddMaisonEdition = () => {
  const [formData, setFormData] = useState({
    titre: "",
    description: "",
    url: "",
    logo: null, // Fichier de logo
    oeuvres: [], // Liste des œuvres liées
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [oeuvreResults, setOeuvreResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  // Gérer les champs du formulaire
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Gérer le fichier (logo)
  const handleFileChange = (e) => {
    setFormData({ ...formData, logo: e.target.files[0] });
  };

  // Rechercher des œuvres existantes
  const handleSearchOeuvres = async () => {
    if (searchTerm.trim() === "") return; // Ne rien faire si le champ est vide

    setLoading(true);
    try {
      const jwt = localStorage.getItem("jwt");
      const response = await axios.get(
        `http://localhost:1337/api/oeuvres?filters[titre][$contains]=${searchTerm}`,
        {
          headers: {
            Authorization: `Bearer ${jwt}`,
          },
        }
      );
      setOeuvreResults(response.data.data || []);
    } catch (error) {
      console.error("Erreur lors de la recherche des œuvres :", error);
    } finally {
      setLoading(false);
    }
  };

  // Ajouter une œuvre à la liste
  const handleAddOeuvre = (oeuvre) => {
    if (!formData.oeuvres.some((o) => o.documentId === oeuvre.documentId)) {
      setFormData({
        ...formData,
        oeuvres: [...formData.oeuvres, oeuvre],
      });
    }
  };

  // Retirer une œuvre de la liste
  const handleRemoveOeuvre = (documentId) => {
    setFormData({
      ...formData,
      oeuvres: formData.oeuvres.filter((o) => o.documentId !== documentId),
    });
  };

  // Soumettre le formulaire
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const jwt = localStorage.getItem("jwt");

      if (!jwt) {
        setMessage("Vous devez être connecté pour effectuer cette action.");
        return;
      }

      // Étape 1 : Envoi des données textuelles
      const payload = {
        data: {
          titre: formData.titre,
          description: formData.description,
          url: formData.url,
          oeuvres: formData.oeuvres.map((o) => o.documentId), // Liens avec les œuvres
        },
      };

      console.log("Payload JSON :", payload);

      const response = await axios.post("http://localhost:1337/api/editions", payload, {
        headers: {
          Authorization: `Bearer ${jwt}`,
          "Content-Type": "application/json",
        },
      });

      const newEditionId = response.data?.data?.id; // ID de la nouvelle maison d'édition

      console.log("Nouvelle maison d'édition créée, ID :", newEditionId);

      // Étape 2 : Upload du fichier logo (si présent)
      if (formData.logo && newEditionId) {
        const uploadData = new FormData();
        uploadData.append("files", formData.logo); // Ajout du fichier
        uploadData.append("ref", "api::edition.edition"); // Référence à l'entité Strapi
        uploadData.append("refId", newEditionId); // ID de l'entité associée
        uploadData.append("field", "logo"); // Champ cible dans l'entité

        console.log("Début de l'upload du fichier logo...");

        try {
          const uploadResponse = await axios.post("http://localhost:1337/api/upload", uploadData, {
            headers: {
              Authorization: `Bearer ${jwt}`,
            },
          });

          console.log("Upload du fichier réussi :", uploadResponse.data);
        } catch (error) {
          console.warn(
            "Erreur lors de l'upload du fichier logo :",
            error.response?.data || error.message
          );
          setMessage(
            "Maison d'édition ajoutée, mais une erreur s'est produite lors de l'upload du logo."
          );
        }
      }

      setMessage("Maison d'édition ajoutée avec succès !");
      setFormData({
        titre: "",
        description: "",
        url: "",
        logo: null,
        oeuvres: [],
      });
      setOeuvreResults([]);
    } catch (error) {
      console.error("Erreur lors de l'ajout :", error.response?.data || error.message);
      setMessage("Erreur lors de l'ajout de la maison d'édition.");
    }
  };
  

  return (
    <div className="w-full max-w-3xl mx-auto bg-gray-800 p-6 rounded-lg shadow-lg text-white">
      <h1 className="text-2xl font-bold mb-6 text-center">Ajouter une maison d'édition</h1>
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
            rows={6}
            className="mt-1 block w-full p-2 bg-gray-700 border border-gray-600 rounded-lg"
            required
          />
        </div>

        {/* URL */}
        <div>
          <label htmlFor="url" className="block text-sm font-medium">
            URL
          </label>
          <input
            type="url"
            id="url"
            name="url"
            value={formData.url}
            onChange={handleInputChange}
            className="mt-1 block w-full p-2 bg-gray-700 border border-gray-600 rounded-lg"
            required
          />
        </div>

        {/* Logo */}
        <div>
          <label htmlFor="logo" className="block text-sm font-medium">
            Logo
          </label>
          <input
            type="file"
            id="logo"
            name="logo"
            onChange={handleFileChange}
            className="mt-1 block w-full text-gray-400"
          />
        </div>

        {/* Recherche des œuvres */}
        <div>
          <label htmlFor="oeuvre-search" className="block text-sm font-medium">
            Rechercher une œuvre
          </label>
          <div className="flex mt-1">
            <input
              type="text"
              id="oeuvre-search"
              name="oeuvre-search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-grow p-2 bg-gray-700 border border-gray-600 rounded-l-lg text-white"
              placeholder="Recherchez une œuvre par son titre"
            />
            <button
              type="button"
              onClick={handleSearchOeuvres}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-r-lg text-white"
              disabled={loading}
            >
              {loading ? "Recherche..." : "Rechercher"}
            </button>
          </div>
          {oeuvreResults.length > 0 && (
            <ul className="mt-4 bg-gray-700 p-4 rounded-lg space-y-2">
              {oeuvreResults.map((oeuvre) => (
                <li
                  key={oeuvre.documentId}
                  className="flex justify-between items-center p-2 bg-gray-800 rounded"
                >
                  <span>{oeuvre.titre}</span>
                  <button
                    type="button"
                    onClick={() => handleAddOeuvre(oeuvre)}
                    className="px-2 py-1 bg-green-600 hover:bg-green-700 text-white rounded"
                  >
                    Ajouter
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Œuvres sélectionnées */}
        <div>
          <label className="block text-sm font-medium">Œuvres sélectionnées</label>
          <ul className="mt-2 space-y-2">
            {formData.oeuvres.map((oeuvre) => (
              <li
                key={oeuvre.documentId}
                className="flex justify-between items-center p-2 bg-gray-700 rounded"
              >
                <span>{oeuvre.titre}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveOeuvre(oeuvre.documentId)}
                  className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded"
                >
                  Retirer
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Bouton soumettre */}
        <button
          type="submit"
          className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-white font-bold"
        >
          Ajouter la maison d'édition
        </button>
      </form>
    </div>
  );
};

export default AddMaisonEdition;
