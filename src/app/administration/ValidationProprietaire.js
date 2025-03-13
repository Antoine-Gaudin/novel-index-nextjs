"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";

const ValidationProprietaire = () => {
  const [proprietaires, setProprietaires] = useState([]);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    const fetchProprietaires = async () => {
      try {
        const jwt = localStorage.getItem("jwt");

        const response = await axios.get("https://novel-index-strapi.onrender.com/api/proprietaires", {
          headers: {
            Authorization: `Bearer ${jwt}`,
          },
        });

        // Filtrer les propriétaires pour exclure ceux ayant validationAdmin = true
        const proprietairesFiltrés = response.data.data.filter(
          (proprietaire) => !proprietaire.validationAdmin
        );

        setProprietaires(proprietairesFiltrés || []);
      } catch (error) {
        console.error("Erreur lors de la récupération des propriétaires :", error.response || error.message);
        setMessage("Erreur lors de la récupération des propriétaires.");
      }
    };

    fetchProprietaires();
  }, []);

  const handleCheckboxChange = (documentId, field, value) => {
    setProprietaires((prev) =>
      prev.map((proprietaire) =>
        proprietaire.documentId === documentId
          ? { ...proprietaire, [field]: value }
          : proprietaire
      )
    );
  };

  const handleTextareaChange = (documentId, value) => {
    setProprietaires((prev) =>
      prev.map((proprietaire) =>
        proprietaire.documentId === documentId
          ? { ...proprietaire, bullInfo: value }
          : proprietaire
      )
    );
  };

  const handleSubmit = async () => {
    try {
      const jwt = localStorage.getItem("jwt");

      await Promise.all(
        proprietaires.map((proprietaire) => {
          const dataToSend = {
            data: {
              infovalidation: proprietaire.infovalidation,
              validationAdmin: proprietaire.validationAdmin,
              bullInfo: proprietaire.bullInfo,
            },
          };
          const apiUrl = `https://novel-index-strapi.onrender.com/api/proprietaires/${proprietaire.documentId}`;
          const headers = { Authorization: `Bearer ${jwt}` };

          return axios.put(apiUrl, dataToSend, { headers });
        })
      );

      setMessage("Modifications enregistrées avec succès !");
    } catch (error) {
      console.error("Erreur lors de l'envoi des données :", error.response || error.message);
      setMessage("Erreur lors de l'enregistrement des modifications.");
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto bg-gray-800 p-6 rounded-lg shadow-lg text-white">
      <h1 className="text-2xl font-bold mb-6 text-center">Validation des Propriétaires</h1>
      {message && <p className="mb-4 text-center text-yellow-400">{message}</p>}
      {proprietaires.length > 0 ? (
        <ul className="space-y-6">
          {proprietaires.map((proprietaire) => (
            <li key={proprietaire.documentId} className="p-4 bg-gray-700 rounded-lg shadow-md space-y-4">
              <div>
                <h2 className="text-lg font-bold">Demandeur : {proprietaire.utilisateur}</h2>
                <p className="text-sm text-gray-400">Nom du domaine : {proprietaire.urlsite}</p>
                <p className="text-sm text-gray-400">
                  Nom du site : {proprietaire.sitename || "Non spécifié"}
                </p>
              </div>

              <div>
                <h3 className="font-semibold">Œuvres validées :</h3>
                <textarea
                  value={proprietaire.oeuvresvalide || ""}
                  readOnly
                  className="w-full p-2 bg-gray-900 text-gray-300 border border-gray-600 rounded-lg mt-2"
                  rows={4}
                />
              </div>

              <div className="flex items-center space-x-6">
                <div>
                  <label htmlFor={`infovalidation-${proprietaire.documentId}`} className="block text-sm">
                    Validation Info
                  </label>
                  <input
                    type="checkbox"
                    id={`infovalidation-${proprietaire.documentId}`}
                    checked={proprietaire.infovalidation || false}
                    onChange={(e) =>
                      handleCheckboxChange(proprietaire.documentId, "infovalidation", e.target.checked)
                    }
                    className="h-5 w-5 mt-1"
                  />
                </div>

                <div>
                  <label htmlFor={`validationAdmin-${proprietaire.documentId}`} className="block text-sm">
                    Validation Admin
                  </label>
                  <input
                    type="checkbox"
                    id={`validationAdmin-${proprietaire.documentId}`}
                    checked={proprietaire.validationAdmin || false}
                    onChange={(e) =>
                      handleCheckboxChange(proprietaire.documentId, "validationAdmin", e.target.checked)
                    }
                    className="h-5 w-5 mt-1"
                  />
                </div>
              </div>

              <div>
                <label htmlFor={`bullInfo-${proprietaire.documentId}`} className="block text-sm font-medium">
                  Informations supplémentaires :
                </label>
                <textarea
                  id={`bullInfo-${proprietaire.documentId}`}
                  value={proprietaire.bullInfo || ""}
                  onChange={(e) => handleTextareaChange(proprietaire.documentId, e.target.value)}
                  className="w-full p-2 bg-gray-900 text-gray-300 border border-gray-600 rounded-lg mt-2"
                  rows={2}
                />
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-center text-gray-400">Aucune demande de propriétaire trouvée.</p>
      )}
      <div className="text-center mt-6">
        <button
          onClick={handleSubmit}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg shadow-md"
        >
          Enregistrer les modifications
        </button>
      </div>
    </div>
  );
};

export default ValidationProprietaire;
