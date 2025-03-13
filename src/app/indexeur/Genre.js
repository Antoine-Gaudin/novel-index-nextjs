"use client";

import React, { useState } from "react";
import axios from "axios";

const Genre = ({ selectedOeuvre }) => {
  const [genres, setGenres] = useState([]);
  const [newGenre, setNewGenre] = useState("");
  const [message, setMessage] = useState(null);

  const fetchGenres = async () => {
    try {
      const jwt = localStorage.getItem("jwt");

      const response = await axios.get(
        `https://novel-index-strapi.onrender.com/api/oeuvres/${selectedOeuvre.documentId}?populate=genres`,
        {
          headers: { Authorization: `Bearer ${jwt}` },
        }
      );

      setGenres(response.data.data.genres || []);
      setMessage(null);
    } catch (error) {
      console.error("Erreur lors de la récupération des genres :", error.response?.data || error.message);
      setMessage("Erreur lors de la récupération des genres.");
    }
  };

  const handleAddGenre = async () => {
    try {
      const jwt = localStorage.getItem("jwt");

      console.log("Données envoyées pour le genre :", {
        titre: newGenre,
        oeuvre: [selectedOeuvre.documentId],
      });

      const response = await axios.post(
        "https://novel-index-strapi.onrender.com/api/genres",
        {
          data: {
            titre: newGenre,
            oeuvre: [selectedOeuvre.documentId], // Format tableau
          },
        },
        {
          headers: { Authorization: `Bearer ${jwt}` },
        }
      );

      console.log("Réponse de l'ajout du genre :", response.data);
      setGenres((prevGenres) => [...prevGenres, response.data.data]);
      setNewGenre("");
      setMessage("Genre ajouté avec succès !");
    } catch (error) {
      console.error("Erreur lors de l'ajout du genre :", error.response?.data || error.message);
      setMessage("Erreur lors de l'ajout du genre.");
    }
  };

  return (
    <div>
      <h3 className="text-xl font-bold mb-4">Genres pour l'œuvre : {selectedOeuvre.titre}</h3>
      <ul className="space-y-2">
        {genres.map((genre) => (
          <li key={genre.id} className="bg-gray-700 p-2 rounded-lg">
            {genre.titre}
          </li>
        ))}
      </ul>
      <div className="mt-4">
        <input
          type="text"
          placeholder="Ajouter un nouveau genre"
          value={newGenre}
          onChange={(e) => setNewGenre(e.target.value)}
          className="p-2 bg-gray-700 border border-gray-600 rounded-lg w-full"
        />
        <button
          onClick={handleAddGenre}
          className="mt-2 py-2 px-4 bg-blue-600 hover:bg-blue-700 rounded-lg text-white"
        >
          Ajouter
        </button>
      </div>
      {message && <p className="mt-4 text-yellow-400">{message}</p>}
    </div>
  );
};

export default Genre;
