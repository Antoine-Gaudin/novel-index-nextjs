"use client";

import React, { useState } from "react";
import axios from "axios";

const AddAchatLivre = () => {
  const [formData, setFormData] = useState({
    titre: "",
    url: "",
    order: "",
    oeuvres: [],
    editions: [],
  });
  const [searchOeuvreTerm, setSearchOeuvreTerm] = useState("");
  const [searchEditionTerm, setSearchEditionTerm] = useState("");
  const [oeuvreResults, setOeuvreResults] = useState([]);
  const [editionResults, setEditionResults] = useState([]);
  const [loadingOeuvre, setLoadingOeuvre] = useState(false);
  const [loadingEdition, setLoadingEdition] = useState(false);
  const [message, setMessage] = useState(null);

  // Gestion des champs de texte
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Recherche des œuvres
  const handleSearchOeuvres = async () => {
    if (searchOeuvreTerm.trim() === "") return; // Ne rien faire si le champ est vide

    setLoadingOeuvre(true);
    try {
      const jwt = localStorage.getItem("jwt");
      const response = await axios.get(
        `http://localhost:1337/api/oeuvres?filters[titre][$contains]=${searchOeuvreTerm}`,
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
      setLoadingOeuvre(false);
    }
  };

  // Recherche des maisons d'édition
  const handleSearchEditions = async () => {
    if (searchEditionTerm.trim() === "") return; // Ne rien faire si le champ est vide

    setLoadingEdition(true);
    try {
      const jwt = localStorage.getItem("jwt");
      const response = await axios.get(
        `http://localhost:1337/api/editions?filters[titre][$contains]=${searchEditionTerm}`,
        {
          headers: {
            Authorization: `Bearer ${jwt}`,
          },
        }
      );
      setEditionResults(response.data.data || []);
    } catch (error) {
      console.error("Erreur lors de la recherche des éditions :", error);
    } finally {
      setLoadingEdition(false);
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

  // Ajouter une maison d'édition à la liste
  const handleAddEdition = (edition) => {
    if (!formData.editions.some((e) => e.documentId === edition.documentId)) {
      setFormData({
        ...formData,
        editions: [...formData.editions, edition],
      });
    }
  };

  // Retirer une maison d'édition de la liste
  const handleRemoveEdition = (documentId) => {
    setFormData({
      ...formData,
      editions: formData.editions.filter((e) => e.documentId !== documentId),
    });
  };

  // Soumission du formulaire
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const jwt = localStorage.getItem("jwt");

      if (!jwt) {
        setMessage("Vous devez être connecté pour effectuer cette action.");
        return;
      }

      // Création du payload
      const payload = {
        data: {
          titre: formData.titre,
          url: formData.url,
          order: formData.order,
          oeuvres: formData.oeuvres.map((o) => o.documentId),
          editions: formData.editions.map((e) => e.documentId),
        },
      };

      console.log("Payload :", payload);

      // Envoi des données à Strapi
      const response = await axios.post("http://localhost:1337/api/achatlivres", payload, {
        headers: {
          Authorization: `Bearer ${jwt}`,
          "Content-Type": "application/json",
        },
      });

      console.log("Réponse du serveur :", response.data);

      setMessage("Achat de livre ajouté avec succès !");
      setFormData({
        titre: "",
        url: "",
        order: "",
        oeuvres: [],
        editions: [],
      });
      setOeuvreResults([]);
      setEditionResults([]);
    } catch (error) {
      console.error("Erreur lors de l'ajout :", error.response?.data || error.message);
      setMessage("Erreur lors de l'ajout de l'achat de livre.");
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto bg-gray-800 p-6 rounded-lg shadow-lg text-white space-y-12">
      <h1 className="text-2xl font-bold mb-6 text-center">Ajouter un achat de livre</h1>
      {message && <p className="mb-4 text-center text-yellow-400">{message}</p>}

      <form onSubmit={handleSubmit} className="space-y-6">
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

        <div>
          <label htmlFor="url" className="block text-sm font-medium">
            URL
          </label>
          <input
            type="text"
            id="url"
            name="url"
            value={formData.url}
            onChange={handleInputChange}
            className="mt-1 block w-full p-2 bg-gray-700 border border-gray-600 rounded-lg"
          />
        </div>

        <div>
          <label htmlFor="order" className="block text-sm font-medium">
            Ordre
          </label>
          <input
            type="number"
            id="order"
            name="order"
            value={formData.order}
            onChange={handleInputChange}
            className="mt-1 block w-full p-2 bg-gray-700 border border-gray-600 rounded-lg"
            required
          />
        </div>

        {/* Recherche des œuvres */}
        <div>
          <label htmlFor="searchOeuvre" className="block text-sm font-medium">
            Rechercher une œuvre
          </label>
          <div className="flex items-center space-x-2">
            <input
              type="text"
              id="searchOeuvre"
              value={searchOeuvreTerm}
              onChange={(e) => setSearchOeuvreTerm(e.target.value)}
              className="flex-grow p-2 bg-gray-700 border border-gray-600 rounded-lg"
              placeholder="Rechercher une œuvre..."
            />
            <button
              type="button"
              onClick={handleSearchOeuvres}
              className="p-2 bg-indigo-600 rounded-lg hover:bg-indigo-700"
            >
              Rechercher
            </button>
          </div>

          <ul className="mt-4 space-y-2">
            {oeuvreResults.map((oeuvre) => (
              <li
                key={oeuvre.documentId}
                className="p-2 bg-gray-700 rounded-lg flex justify-between items-center"
              >
                <span>{oeuvre.titre}</span>
                <button
                  type="button"
                  onClick={() => handleAddOeuvre(oeuvre)}
                  className="text-sm text-green-400"
                >
                  Ajouter
                </button>
              </li>
            ))}
          </ul>

          {/* Liste des œuvres sélectionnées */}
          <ul className="mt-4 space-y-2">
            {formData.oeuvres.map((oeuvre) => (
              <li
                key={oeuvre.documentId}
                className="p-2 bg-gray-700 rounded-lg flex justify-between items-center"
              >
                <span>{oeuvre.titre}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveOeuvre(oeuvre.documentId)}
                  className="text-sm text-red-400"
                >
                  Retirer
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Recherche des éditions */}
        <div>
          <label htmlFor="searchEdition" className="block text-sm font-medium">
            Rechercher une maison d'édition
          </label>
          <div className="flex items-center space-x-2">
            <input
              type="text"
              id="searchEdition"
              value={searchEditionTerm}
              onChange={(e) => setSearchEditionTerm(e.target.value)}
              className="flex-grow p-2 bg-gray-700 border border-gray-600 rounded-lg"
              placeholder="Rechercher une maison d'édition..."
            />
            <button
              type="button"
              onClick={handleSearchEditions}
              className="p-2 bg-indigo-600 rounded-lg hover:bg-indigo-700"
            >
              Rechercher
            </button>
          </div>

          <ul className="mt-4 space-y-2">
            {editionResults.map((edition) => (
              <li
                key={edition.documentId}
                className="p-2 bg-gray-700 rounded-lg flex justify-between items-center"
              >
                <span>{edition.titre}</span>
                <button
                  type="button"
                  onClick={() => handleAddEdition(edition)}
                  className="text-sm text-green-400"
                >
                  Ajouter
                </button>
              </li>
            ))}
          </ul>

          {/* Liste des éditions sélectionnées */}
          <ul className="mt-4 space-y-2">
            {formData.editions.map((edition) => (
              <li
                key={edition.documentId}
                className="p-2 bg-gray-700 rounded-lg flex justify-between items-center"
              >
                <span>{edition.titre}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveEdition(edition.documentId)}
                  className="text-sm text-red-400"
                >
                  Retirer
                </button>
              </li>
            ))}
          </ul>
        </div>

        <button
          type="submit"
          className="w-full py-3 bg-green-600 hover:bg-green-700 rounded-lg text-white font-bold"
        >
          Ajouter l'achat de livre
        </button>
      </form>
    </div>
  );
};

export default AddAchatLivre;
