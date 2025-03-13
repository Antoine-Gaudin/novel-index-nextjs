"use client";

import React, { useState } from "react";
import axios from "axios";

const Tag = ({ selectedOeuvre }) => {
  const [tags, setTags] = useState([]);
  const [newTag, setNewTag] = useState("");
  const [message, setMessage] = useState(null);

  const fetchTags = async () => {
    try {
      const jwt = localStorage.getItem("jwt");

      const response = await axios.get(
        `http://localhost:1337/api/oeuvres/${selectedOeuvre.documentId}?populate=tags`,
        {
          headers: { Authorization: `Bearer ${jwt}` },
        }
      );

      setTags(response.data.data.tags || []);
      setMessage(null);
    } catch (error) {
      console.error("Erreur lors de la récupération des tags :", error.response?.data || error.message);
      setMessage("Erreur lors de la récupération des tags.");
    }
  };

  const handleAddTag = async () => {
    try {
      const jwt = localStorage.getItem("jwt");

      console.log("Données envoyées pour le tag :", {
        titre: newTag,
        oeuvres: [selectedOeuvre.documentId],
      });

      const response = await axios.post(
        "http://localhost:1337/api/tags",
        {
          data: {
            titre: newTag,
            oeuvres: [selectedOeuvre.documentId],
          },
        },
        {
          headers: { Authorization: `Bearer ${jwt}` },
        }
      );

      console.log("Réponse de l'ajout du tag :", response.data);
      setTags((prevTags) => [...prevTags, response.data.data]);
      setNewTag("");
      setMessage("Tag ajouté avec succès !");
    } catch (error) {
      console.error("Erreur lors de l'ajout du tag :", error.response?.data || error.message);
      setMessage("Erreur lors de l'ajout du tag.");
    }
  };

  return (
    <div>
      <h3 className="text-xl font-bold mb-4">Tags pour l'œuvre : {selectedOeuvre.titre}</h3>
      <ul className="space-y-2">
        {tags.map((tag) => (
          <li key={tag.id} className="bg-gray-700 p-2 rounded-lg">
            {tag.titre}
          </li>
        ))}
      </ul>
      <div className="mt-4">
        <input
          type="text"
          placeholder="Ajouter un nouveau tag"
          value={newTag}
          onChange={(e) => setNewTag(e.target.value)}
          className="p-2 bg-gray-700 border border-gray-600 rounded-lg w-full"
        />
        <button
          onClick={handleAddTag}
          className="mt-2 py-2 px-4 bg-blue-600 hover:bg-blue-700 rounded-lg text-white"
        >
          Ajouter
        </button>
      </div>
      {message && <p className="mt-4 text-yellow-400">{message}</p>}
    </div>
  );
};

export default Tag;
