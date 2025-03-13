"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";

const MoChapitre = ({ user, oeuvre }) => {
  const [chapitres, setChapitres] = useState([]);
  const [message, setMessage] = useState(null);
  const [showUrls, setShowUrls] = useState({});

  useEffect(() => {
    const fetchChapitres = async () => {
      try {
        const jwt = localStorage.getItem("jwt");
        const response = await axios.get(
          `http://localhost:1337/api/oeuvres/${oeuvre.documentId}?populate=chapitres`,
          {
            headers: { Authorization: `Bearer ${jwt}` },
          }
        );
        setChapitres(response.data.data.chapitres || []);
      } catch (error) {
        console.error("Erreur lors de la récupération des chapitres :", error.response?.data || error.message);
        setMessage("Erreur lors de la récupération des chapitres.");
      }
    };

    fetchChapitres();
  }, [oeuvre]);

  const handleChapitreChange = (index, field, value) => {
    const updatedChapitres = [...chapitres];
    updatedChapitres[index][field] = value;
    setChapitres(updatedChapitres);
  };

  const toggleUrl = (index) => {
    setShowUrls((prevState) => ({
      ...prevState,
      [index]: !prevState[index],
    }));
  };

  const handleSaveChapitres = async () => {
    try {
      const jwt = localStorage.getItem("jwt");
  
      for (const chapitre of chapitres) {
        // Filtrer les champs inutiles
        const filteredChapitre = Object.keys(chapitre)
          .filter((key) => !["id", "documentId", "createdAt", "updatedAt"].includes(key)) // Exclure les champs spécifiques
          .reduce((obj, key) => {
            obj[key] = chapitre[key];
            return obj;
          }, {});
  
        console.log("Filtered chapitre data:", filteredChapitre);
  
        await axios.put(
          `http://localhost:1337/api/chapitres/${chapitre.documentId}`, // On utilise `documentId` pour identifier le chapitre
          { data: filteredChapitre }, // Envoyer uniquement les champs pertinents
          {
            headers: { Authorization: `Bearer ${jwt}` },
          }
        );
      }
  
      setMessage("Les chapitres ont été mis à jour.");
    } catch (error) {
      console.error("Erreur lors de la mise à jour des chapitres :", error.response?.data || error.message);
      setMessage("Erreur lors de la mise à jour des chapitres.");
    }
  };
  

  return (
    <div>
      <h3 className="text-xl font-bold mb-4">Modifier les chapitres</h3>
      <ul className="space-y-2">
        {chapitres.map((chapitre, index) => (
          <li
            key={chapitre.id}
            className="flex justify-between items-center bg-gray-700 p-4 rounded-lg"
          >
            <div>
              <label className="block text-sm font-medium">Titre</label>
              <input
                type="text"
                value={chapitre.titre}
                onChange={(e) => handleChapitreChange(index, "titre", e.target.value)}
                className="mt-1 block w-full p-2 bg-gray-600 border border-gray-500 rounded-lg"
              />
            </div>
            <div className="ml-4">
              <label className="block text-sm font-medium">Ordre</label>
              <input
                type="number"
                value={chapitre.order}
                onChange={(e) => handleChapitreChange(index, "order", e.target.value)}
                className="mt-1 block w-24 p-2 bg-gray-600 border border-gray-500 rounded-lg"
              />
            </div>
            <button
              onClick={() => toggleUrl(index)}
              className="ml-4 py-2 px-4 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-white font-bold"
            >
              Voir URL
            </button>
            {showUrls[index] && (
              <div className="ml-4">
                <label className="block text-sm font-medium">URL</label>
                <input
                  type="text"
                  value={chapitre.url}
                  onChange={(e) => handleChapitreChange(index, "url", e.target.value)}
                  className="mt-1 block w-full p-2 bg-gray-600 border border-gray-500 rounded-lg"
                />
              </div>
            )}
          </li>
        ))}
      </ul>
      <button
        onClick={handleSaveChapitres}
        className="mt-4 w-full py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-bold"
      >
        Enregistrer les modifications des chapitres
      </button>

      {message && <p className="mt-4 text-center text-yellow-400">{message}</p>}
    </div>
  );
};

export default MoChapitre;
