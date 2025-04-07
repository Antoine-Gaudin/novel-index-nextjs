"use client";
import React, { useState } from "react";
import axios from "axios";

const AjoutType = ({ type, selectedOeuvre }) => {
  const [valeur, setValeur] = useState("");
  const [message, setMessage] = useState(null);

  if (!type || !selectedOeuvre) return null;

  const endpoint = type === "Tag" ? "tags" : "genres";

  const handleAdd = async () => {
    const jwt = localStorage.getItem("jwt");

    try {
      const response = await axios.post(
        `https://novel-index-strapi.onrender.com/api/${endpoint}`,
        {
          data: {
            titre: valeur,
            oeuvres: [selectedOeuvre.documentId],
          },
        },
        {
          headers: {
            Authorization: `Bearer ${jwt}`,
          },
        }
      );

      setMessage(`${type} ajouté avec succès !`);
      setValeur("");
    } catch (err) {
      console.error(`Erreur lors de l'ajout du ${type} :`, err.response?.data || err.message);
      setMessage(`Erreur lors de l'ajout du ${type}.`);
    }
  };

  return (
    <div className="space-y-2">
      <input
        type="text"
        value={valeur}
        onChange={(e) => setValeur(e.target.value)}
        placeholder={`Ajouter un ${type.toLowerCase()}`}
        className="w-full p-2 rounded bg-gray-800 text-white"
      />
      <button
        onClick={handleAdd}
        className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 rounded text-white"
      >
        Ajouter
      </button>
      {message && <p className="text-yellow-400">{message}</p>}
    </div>
  );
};

export default AjoutType;
