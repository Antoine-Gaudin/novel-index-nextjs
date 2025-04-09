"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";

const AjoutTagGenre = ({ selectedOeuvre }) => {
  const [type, setType] = useState("Tag"); // "Tag" ou "Genre"
  const [valeur, setValeur] = useState("");
  const [message, setMessage] = useState(null);
  const [tags, setTags] = useState([]);
  const [genres, setGenres] = useState([]);

  const jwt = typeof window !== "undefined" ? localStorage.getItem("jwt") : null;

  useEffect(() => {
    if (!selectedOeuvre?.documentId || !jwt) return;

    const fetchData = async () => {
      try {
        const res = await axios.get(
          `https://novel-index-strapi.onrender.com/api/oeuvres/${selectedOeuvre.documentId}?populate[tags]=*&populate[genres]=*`,
          {
            headers: { Authorization: `Bearer ${jwt}` },
          }
        );
        setTags(res.data.data.tags || []);
        setGenres(res.data.data.genres || []);
      } catch (error) {
        console.error("Erreur lors de la récupération des données :", error);
        setMessage("Erreur de chargement des tags/genres.");
      }
    };

    fetchData();
  }, [selectedOeuvre]);

  const handleAdd = async () => {
    if (!valeur.trim()) return;
    const endpoint = type === "Tag" ? "tags" : "genres";

    try {
      const res = await axios.post(
        `https://novel-index-strapi.onrender.com/api/${endpoint}`,
        {
          data: {
            titre: valeur,
            oeuvres: [selectedOeuvre.documentId],
          },
        },
        {
          headers: { Authorization: `Bearer ${jwt}` },
        }
      );

      if (type === "Tag") setTags((prev) => [...prev, res.data.data]);
      else setGenres((prev) => [...prev, res.data.data]);

      setValeur("");
      setMessage(`${type} ajouté avec succès !`);
    } catch (err) {
      console.error(`Erreur lors de l'ajout du ${type.toLowerCase()} :`, err);
      setMessage(`Erreur lors de l'ajout du ${type.toLowerCase()}.`);
    }
  };

  return (
    <div className="bg-gray-700 p-4 rounded-lg shadow-md space-y-4">
      <h2 className="text-xl font-semibold">Gérer les Tags & Genres</h2>

      {/* Choix du type */}
      <div>
        <label className="block mb-1">Type à ajouter</label>
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="w-full p-2 rounded bg-gray-800 text-white"
        >
          <option value="Tag">Tag</option>
          <option value="Genre">Genre</option>
        </select>
      </div>

      {/* Champ d'ajout */}
      <input
        type="text"
        placeholder={`Ajouter un ${type.toLowerCase()}`}
        value={valeur}
        onChange={(e) => setValeur(e.target.value)}
        className="w-full p-2 rounded bg-gray-800 text-white"
      />
      <button
        onClick={handleAdd}
        className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 rounded text-white"
      >
        Ajouter
      </button>
      {message && <p className="text-yellow-400">{message}</p>}

      {/* Affichage */}
      <div className="grid grid-cols-2 gap-4 mt-6">
        <div>
          <h3 className="text-lg font-bold mb-2">Tags existants</h3>
          <ul className="space-y-1">
            {tags.map((tag) => (
              <li key={tag.id} className="bg-gray-600 px-2 py-1 rounded text-sm">
                {tag.titre}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="text-lg font-bold mb-2">Genres existants</h3>
          <ul className="space-y-1">
            {genres.map((genre) => (
              <li key={genre.id} className="bg-gray-600 px-2 py-1 rounded text-sm">
                {genre.titre}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AjoutTagGenre;
