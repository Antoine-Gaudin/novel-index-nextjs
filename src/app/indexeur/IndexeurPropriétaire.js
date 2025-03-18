"use client";

import React, { useState } from "react";
import axios from "axios";

const Proprietaire = ({ user }) => {
  const [siteName, setSiteName] = useState("");
  const [siteUrl, setSiteUrl] = useState("");
  const [oeuvresAssociees, setOeuvresAssociees] = useState([]);
  const [localValidation, setLocalValidation] = useState({});
  const [message, setMessage] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const jwt = localStorage.getItem("jwt");
      if (!jwt) {
        setMessage("Vous devez être connecté pour effectuer cette action.");
        return;
      }

      setMessage("Recherche des œuvres associées...");
      const domain = new URL(siteUrl).origin;

      // Requête pour récupérer les œuvres
      const oeuvresResponse = await axios.get(
        `http://localhost:1337/api/oeuvres?filters[nomdomaine][$containsi]=${domain}`,
        {
          headers: { Authorization: `Bearer ${jwt}` },
        }
      );

      const oeuvres = oeuvresResponse.data.data || [];

      if (oeuvres.length === 0) {
        // Si aucune œuvre par `nomdomaine`, on cherche via les chapitres
        const chapitresResponse = await axios.get(
          `http://localhost:1337/api/chapitres?populate=oeuvres`,
          {
            headers: { Authorization: `Bearer ${jwt}` },
          }
        );

        const chapitres = chapitresResponse.data.data || [];
        const chapitresAssocies = chapitres.filter((chapitre) =>
          chapitre.url.startsWith(domain)
        );

        const oeuvreDocumentIds = [
          ...new Set(
            chapitresAssocies.map(
              (chapitre) => chapitre.oeuvres[0]?.documentId
            )
          ),
        ];

        const oeuvresFromChapitres = await Promise.all(
          oeuvreDocumentIds.map(async (documentId) => {
            const response = await axios.get(
              `http://localhost:1337/api/oeuvres/${documentId}`,
              {
                headers: { Authorization: `Bearer ${jwt}` },
              }
            );
            return response.data.data;
          })
        );

        setOeuvresAssociees(oeuvresFromChapitres);
        setLocalValidation(
          oeuvresFromChapitres.reduce(
            (acc, oeuvre) => ({
              ...acc,
              [oeuvre.documentId]: "false",
            }),
            {}
          )
        );
      } else {
        setOeuvresAssociees(oeuvres);
        setLocalValidation(
          oeuvres.reduce(
            (acc, oeuvre) => ({
              ...acc,
              [oeuvre.documentId]: "false",
            }),
            {}
          )
        );
      }

      setMessage(null);
    } catch (error) {
      console.error("Erreur lors de la recherche :", error.response?.data || error.message);
      setMessage("Erreur lors de la recherche des œuvres ou chapitres.");
    }
  };

  const handleValidationChange = (documentId, isChecked) => {
    setLocalValidation((prevState) => ({
      ...prevState,
      [documentId]: isChecked ? "true" : "false",
    }));
  };

  const handleSave = async () => {
    try {
      const jwt = localStorage.getItem("jwt");
      const oeuvreValideData = oeuvresAssociees
        .map((oeuvre) => {
          const boolValue = localValidation[oeuvre.documentId];
          return `${oeuvre.titre}; ${oeuvre.nomdomaine || siteUrl}; ${boolValue}`;
        })
        .join("\n");

      const payload = {
        sitename: siteName,
        urlsite: siteUrl,
        utilisateur: user.username,
        join: "",
        bullInfo: "",
        oeuvresvalide: oeuvreValideData,
      };

      console.log("Données envoyées :", payload);

      const response = await axios.post(
        "https://novel-index-strapi.onrender.com/api/proprietaires",
        { data: payload },
        {
          headers: { Authorization: `Bearer ${jwt}` },
        }
      );

      setMessage("Les informations ont été soumises avec succès. En Attentes de la validation Administrateur");
      console.log("Réponse du serveur :", response.data);
    } catch (error) {
      console.error("Erreur lors de l'envoi des données :", error.response?.data || error.message);
      setMessage("Erreur lors de l'envoi des données.");
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto bg-gray-800 p-6 rounded-lg shadow-lg text-white space-y-6">
      <h2 className="text-2xl font-bold mb-4">Propriétaire d'un Site</h2>

      {/* Formulaire pour le nom et l'URL du site */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="siteName" className="block text-sm font-medium">
            Nom du Site
          </label>
          <input
            type="text"
            id="siteName"
            value={siteName}
            onChange={(e) => setSiteName(e.target.value)}
            className="mt-1 block w-full p-2 bg-gray-700 border border-gray-600 rounded-lg"
            placeholder="Exemple : MonSite"
            required
          />
        </div>
        <div>
          <label htmlFor="siteUrl" className="block text-sm font-medium">
            URL du Site
          </label>
          <input
            type="url"
            id="siteUrl"
            value={siteUrl}
            onChange={(e) => setSiteUrl(e.target.value)}
            className="mt-1 block w-full p-2 bg-gray-700 border border-gray-600 rounded-lg"
            placeholder="Exemple : https://www.monsite.com"
            required
          />
        </div>
        <button
          type="submit"
          className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-white font-bold"
        >
          Vérifier les œuvres associées
        </button>
      </form>

      {message && <p className="mt-4 text-center text-yellow-400">{message}</p>}

      {oeuvresAssociees.length > 0 && (
        <div>
          <h3 className="text-xl font-bold mb-2">Œuvres associées :</h3>
          <ul className="space-y-2">
            {oeuvresAssociees.map((oeuvre) => (
              <li
                key={oeuvre.documentId}
                className="p-4 bg-gray-700 rounded-lg shadow flex justify-between items-center"
              >
                <div>
                  <p className="font-semibold">Titre : {oeuvre.titre}</p>
                  <p className="text-sm text-gray-400">Domaine : {oeuvre.nomdomaine || siteUrl}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <label className="text-sm font-medium">Validation :</label>
                  <input
                    type="checkbox"
                    checked={localValidation[oeuvre.documentId] === "true"}
                    onChange={(e) =>
                      handleValidationChange(oeuvre.documentId, e.target.checked)
                    }
                    className="h-5 w-5"
                  />
                </div>
              </li>
            ))}
          </ul>
          <button
            onClick={handleSave}
            className="mt-4 w-full py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-bold"
          >
            Enregistrer les données
          </button>
        </div>
      )}
    </div>
  );
};

export default Proprietaire;
