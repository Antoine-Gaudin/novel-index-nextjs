"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";

const MoTeams = ({ user }) => {
  const [searchTerm, setSearchTerm] = useState(""); // Terme de recherche
  const [teams, setTeams] = useState([]); // Liste des teams trouvées
  const [selectedTeam, setSelectedTeam] = useState(null); // Team sélectionnée
  const [teamData, setTeamData] = useState({}); // Données de la team
  const [message, setMessage] = useState(null); // Message de feedback

  const excludedFields = ["id", "documentId", "createdAt", "updatedAt", "publishedAt"]; // Champs à exclure

  // Recherche des teams
  const handleSearch = async (e) => {
    e.preventDefault();

    try {
      const jwt = localStorage.getItem("jwt");

      if (!jwt) {
        setMessage("Vous devez être connecté pour effectuer cette recherche.");
        return;
      }

      const response = await axios.get(
        `https://novel-index-strapi.onrender.com/api/teams?filters[titre][$contains]=${searchTerm}`,
        {
          headers: { Authorization: `Bearer ${jwt}` },
        }
      );

      setTeams(response.data.data || []); // Charger les résultats
      setMessage(null); // Réinitialiser le message
    } catch (error) {
      console.error("Erreur lors de la recherche :", error.response?.data || error.message);
      setMessage("Erreur lors de la recherche des teams.");
    }
  };

  // Récupérer les détails d'une team
  const handleSelectTeam = async (team) => {
    setSelectedTeam(team);

    try {
      const jwt = localStorage.getItem("jwt");

      if (!jwt) {
        setMessage("Vous devez être connecté pour récupérer les détails de la team.");
        return;
      }

      const response = await axios.get(
        `https://novel-index-strapi.onrender.com/api/teams/${team.documentId}`,
        {
          headers: { Authorization: `Bearer ${jwt}` },
        }
      );

      setTeamData(response.data.data || {});
      setMessage(null); // Réinitialiser le message
    } catch (error) {
      console.error("Erreur lors de la récupération de la team :", error.response?.data || error.message);
      setMessage("Erreur lors de la récupération de la team.");
    }
  };

  // Gérer les changements dans le formulaire
  const handleTeamChange = (e) => {
    const { name, value, type, checked } = e.target;
    const updatedValue = type === "checkbox" ? checked : value; // Gérer les booléens
    setTeamData({ ...teamData, [name]: updatedValue });
  };

  // Enregistrer les modifications
  const handleSaveTeam = async () => {
    try {
      const jwt = localStorage.getItem("jwt");

      // Filtrer les données pour exclure les champs non modifiables
      const filteredTeamData = Object.keys(teamData)
        .filter((key) => !excludedFields.includes(key))
        .reduce((obj, key) => {
          obj[key] = teamData[key];
          return obj;
        }, {});

      console.log("Données filtrées à sauvegarder :", filteredTeamData);

      await axios.put(
        `https://novel-index-strapi.onrender.com/api/teams/${selectedTeam.documentId}`,
        { data: filteredTeamData },
        {
          headers: { Authorization: `Bearer ${jwt}` },
        }
      );

      setMessage("Les informations de la team ont été mises à jour.");
    } catch (error) {
      console.error("Erreur lors de la mise à jour de la team :", error.response?.data || error.message);
      setMessage("Erreur lors de la mise à jour de la team.");
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto bg-gray-800 p-6 rounded-lg shadow-lg text-white space-y-6">
      <h2 className="text-2xl font-bold mb-4">Modifier les Teams</h2>

      {/* Barre de recherche */}
      <form onSubmit={handleSearch} className="space-y-4">
        <div>
          <label htmlFor="searchTerm" className="block text-sm font-medium">
            Recherche d'une team
          </label>
          <input
            type="text"
            id="searchTerm"
            name="searchTerm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="mt-1 block w-full p-2 bg-gray-700 border border-gray-600 rounded-lg"
            placeholder="Recherchez une team par titre..."
          />
        </div>
        <button
          type="submit"
          className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-white font-bold"
        >
          Rechercher
        </button>
      </form>

      {/* Liste des teams trouvées */}
      {teams.length > 0 && (
        <div>
          <h3 className="text-xl font-bold mb-2">Teams trouvées :</h3>
          <ul className="space-y-2">
            {teams.map((team) => (
              <li
                key={team.documentId}
                className="p-2 bg-gray-700 rounded-lg flex justify-between items-center"
              >
                <span>{team.titre}</span>
                <button
                  onClick={() => handleSelectTeam(team)}
                  className="px-4 py-1 bg-green-600 hover:bg-green-700 rounded-lg text-white font-bold"
                >
                  Modifier
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Formulaire de modification */}
      {selectedTeam && (
        <div>
          <h3 className="text-xl font-bold mb-4">Modifier la team : {selectedTeam.titre}</h3>
          <form className="space-y-4">
            {Object.keys(teamData).map(
              (key) =>
                !excludedFields.includes(key) && (
                  <div key={key}>
                    <label htmlFor={key} className="block text-sm font-medium">
                      {key.charAt(0).toUpperCase() + key.slice(1)}
                    </label>
                    {key === "etat" ? (
                      <input
                        type="checkbox"
                        id={key}
                        name={key}
                        checked={teamData[key] || false}
                        onChange={handleTeamChange}
                        className="mt-1 h-5 w-5"
                      />
                    ) : (
                      <input
                        type="text"
                        id={key}
                        name={key}
                        value={teamData[key] || ""}
                        onChange={handleTeamChange}
                        className="mt-1 block w-full p-2 bg-gray-700 border border-gray-600 rounded-lg"
                      />
                    )}
                  </div>
                )
            )}
          </form>
          <button
            onClick={handleSaveTeam}
            className="mt-4 w-full py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-bold"
          >
            Enregistrer les modifications
          </button>
        </div>
      )}

      {/* Message d'information */}
      {message && <p className="mt-4 text-center text-yellow-400">{message}</p>}
    </div>
  );
};

export default MoTeams;
