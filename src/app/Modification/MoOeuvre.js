"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";

const MoOeuvre = ({ user, oeuvre }) => {
  const [oeuvreData, setOeuvreData] = useState({});
  const [message, setMessage] = useState(null);

  const excludedFields = [
    "publishedAt",
    "updatedAt",
    "createdAt",
    "id",
    "documentId",
    "chapitres",
  ];

  useEffect(() => {
    console.log("useEffect triggered - Fetching œuvre data for:", oeuvre);

    const fetchOeuvre = async () => {
      try {
        const jwt = localStorage.getItem("jwt");
        console.log("JWT retrieved:", jwt);

        const response = await axios.get(
          `https://novel-index-strapi.onrender.com/api/oeuvres/${oeuvre.documentId}`,
          {
            headers: { Authorization: `Bearer ${jwt}` },
          }
        );

        console.log("API response for œuvre:", response.data);
        setOeuvreData(response.data.data || {});
      } catch (error) {
        console.error("Erreur lors de la récupération de l'œuvre :", error.response?.data || error.message);
        setMessage("Erreur lors de la récupération de l'œuvre.");
      }
    };

    fetchOeuvre();
  }, [oeuvre]);

  const handleOeuvreChange = (e) => {
    const { name, value } = e.target;
    console.log("Field changed:", { name, value });
    setOeuvreData({ ...oeuvreData, [name]: value });
  };

  const handleSaveOeuvre = async () => {
    try {
      console.log("Saving œuvre data:", oeuvreData);
  
      const jwt = localStorage.getItem("jwt");
      console.log("JWT for save:", jwt);
  
      // Filtrer les champs non modifiables
      const filteredOeuvreData = Object.keys(oeuvreData)
        .filter((key) => !excludedFields.includes(key)) // Exclure les champs inutiles
        .reduce((obj, key) => {
          obj[key] = oeuvreData[key];
          return obj;
        }, {});
  
      console.log("Filtered œuvre data:", filteredOeuvreData);
  
      await axios.put(
        `https://novel-index-strapi.onrender.com/api/oeuvres/${oeuvre.documentId}`,
        { data: filteredOeuvreData }, // Envoyer uniquement les données filtrées
        {
          headers: { Authorization: `Bearer ${jwt}` },
        }
      );
  
      setMessage("Les informations de l'œuvre ont été mises à jour.");
    } catch (error) {
      console.error("Erreur lors de la mise à jour de l'œuvre :", error.response?.data || error.message);
      setMessage("Erreur lors de la mise à jour de l'œuvre.");
    }
  };
  

  return (
    <div>
      <h3 className="text-xl font-bold mb-4">Modifier l'œuvre : {oeuvre.titre}</h3>
      <form className="space-y-4">
        {Object.keys(oeuvreData).map(
          (key) =>
            !excludedFields.includes(key) && (
              <div key={key}>
                <label htmlFor={key} className="block text-sm font-medium">
                  {key.charAt(0).toUpperCase() + key.slice(1)}
                </label>
                {key === "etat" ? (
                  <select
                    id={key}
                    name={key}
                    value={oeuvreData[key] || ""}
                    onChange={handleOeuvreChange}
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
                ) : key === "type" ? (
                  <select
                    id={key}
                    name={key}
                    value={oeuvreData[key] || ""}
                    onChange={handleOeuvreChange}
                    className="mt-1 block w-full p-2 bg-gray-700 border border-gray-600 rounded-lg"
                  >
                    <option value="">-- Sélectionnez un type --</option>
                    <option value="Light novel">Light novel</option>
                    <option value="Web novel">Web novel</option>
                    <option value="Scan">Scan</option>
                    <option value="Webtoon">Webtoon</option>
                  </select>
                ) : key === "categorie" ? (
                  <select
                    id={key}
                    name={key}
                    value={oeuvreData[key] || ""}
                    onChange={handleOeuvreChange}
                    className="mt-1 block w-full p-2 bg-gray-700 border border-gray-600 rounded-lg"
                  >
                    <option value="">-- Sélectionnez une catégorie --</option>
                    <option value="Shonen">Shonen</option>
                    <option value="Seinen">Seinen</option>
                    <option value="Shojo">Shojo</option>
                    <option value="Isekai">Isekai</option>
                  </select>
                ) : key === "licence" ? (
                  <input
                    type="checkbox"
                    id={key}
                    name={key}
                    checked={oeuvreData[key] || false}
                    onChange={handleOeuvreChange}
                    className="mt-1 h-5 w-5"
                  />
                ) : (
                  <input
                    type="text"
                    id={key}
                    name={key}
                    value={oeuvreData[key] || ""}
                    onChange={handleOeuvreChange}
                    className="mt-1 block w-full p-2 bg-gray-700 border border-gray-600 rounded-lg"
                  />
                )}
              </div>
            )
        )}
      </form>
      <button
        onClick={handleSaveOeuvre}
        className="mt-4 w-full py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-bold"
      >
        Enregistrer les modifications
      </button>
      {message && <p className="mt-4 text-center text-yellow-400">{message}</p>}
    </div>
  );
};

export default MoOeuvre;
