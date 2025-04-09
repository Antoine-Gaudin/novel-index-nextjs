"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";

const TagGenreSearch = ({ type, selectedOeuvre, alreadyLinked, onSuccess }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState(null);
  const [message, setMessage] = useState(null);

  const jwt = typeof window !== "undefined" ? localStorage.getItem("jwt") : null;

  useEffect(() => {
    if (searchTerm.length < 2) {
      setResults([]);
      return;
    }

    const fetchData = async () => {
      try {
        const res = await axios.get(
          `https://novel-index-strapi.onrender.com/api/${type.toLowerCase()}s?filters[titre][$containsi]=${searchTerm}&populate=oeuvres`,
          {
            headers: { Authorization: `Bearer ${jwt}` },
          }
        );
        const all = res.data.data || [];
        const filtered = all
        .filter((item) => !alreadyLinked.find((a) => a.documentId === item.documentId))
        .map((item) => ({
          ...item,
          documentId: item.documentId || item.id, // fallback
        }));
      

        setResults(filtered);
      } catch (err) {
        console.error("Erreur de recherche :", err);
      }
    };

    fetchData();
  }, [searchTerm]);

  const handleAdd = async () => {
    if (!selected) return;

    try {
      const updatedDocIds = [...new Set([...(selected.oeuvres?.map((o) => o.documentId) || []), selectedOeuvre.documentId])];

      await axios.put(
        `https://novel-index-strapi.onrender.com/api/${type.toLowerCase()}s/${selected.documentId}`,
        {
          data: {
            oeuvres: updatedDocIds,
          },
        },
        {
          headers: { Authorization: `Bearer ${jwt}` },
        }
      );
      

      setMessage(`${type} lié avec succès à l’œuvre.`);
      setSearchTerm("");
      setSelected(null);
      setResults([]);
      onSuccess(); // refresh depuis le parent
    } catch (err) {
      console.error("Erreur de liaison :", err);
      setMessage("Erreur lors de la liaison.");
    }
  };

  return (
    <div className="bg-gray-800 p-4 rounded-lg space-y-2">
      <h3 className="font-bold text-white mb-1">Ajouter un {type} existant</h3>

      <input
        type="text"
        placeholder={`Rechercher un ${type.toLowerCase()}...`}
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full p-2 bg-gray-700 text-white rounded"
      />

      {results.length > 0 && (
        <ul className="bg-gray-700 rounded p-2 space-y-1 max-h-48 overflow-y-auto">
          {results.map((item) => (
            <li
              key={item.id}
              onClick={() => setSelected(item)}
              className={`p-1 rounded cursor-pointer ${
                selected?.id === item.id ? "bg-indigo-500 text-white" : "hover:bg-gray-600 text-white"
              }`}
            >
              {item.titre}
            </li>
          ))}
        </ul>
      )}

      {selected && (
        <button
          onClick={handleAdd}
          className="w-full mt-2 py-2 bg-indigo-600 hover:bg-indigo-700 rounded text-white"
        >
          Ajouter ce {type}
        </button>
      )}

      {message && <p className="text-yellow-400 text-sm">{message}</p>}
    </div>
  );
};

export default TagGenreSearch;
