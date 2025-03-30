"use client";

import React, { useState } from "react";
import Cookies from "js-cookie";
import { motion } from "framer-motion";
const Parametre = ({ user }) => {
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [profilePicture, setProfilePicture] = useState(null);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  const handleToggle = async (key) => {
    const jwt = Cookies.get("jwt");
    if (!jwt) {
      console.error("JWT introuvable");
      return;
    }

    try {
      setLoading(true);
      const updatedValue = !user[key];

      const res = await fetch(`${apiUrl}/api/users/${user.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwt}`,
        },
        body: JSON.stringify({ [key]: updatedValue }),
      });

      if (!res.ok) {
        throw new Error("Erreur lors de la mise à jour de l'utilisateur");
      }

      const updatedUser = await res.json();
      console.log("Utilisateur mis à jour :", updatedUser);

      user[key] = updatedValue;

      if (key === "indexeur") {
        setFeedbackMessage(
          updatedValue
            ? "Bienvenue parmi les participants au référencement !"
            : "Vous avez quitté l'équipe de référencement."
        );
      } else if (key === "proprietaire") {
        setFeedbackMessage(
          updatedValue
            ? "Bienvenue en tant que propriétaire référencé !"
            : "Vous n'êtes plus référencé en tant que propriétaire."
        );
      }
    } catch (err) {
      console.error("Erreur :", err);
      setError("Erreur lors de la mise à jour.");
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    setProfilePicture(e.target.files[0]);
  };

  const handleProfilePictureSubmit = async (e) => {
    e.preventDefault();
  
    const jwt = Cookies.get("jwt");
    if (!jwt) {
      console.error("JWT introuvable");
      setError("Vous devez être connecté pour effectuer cette action.");
      return;
    }
  
    if (!profilePicture) {
      setError("Veuillez sélectionner une image avant de soumettre.");
      return;
    }
  
    try {
      const formData = new FormData();
      formData.append("files", profilePicture);
      formData.append("ref", "plugin::users-permissions.user"); // Le modèle utilisateur
      formData.append("refId", user.id); // L'ID de l'utilisateur
      formData.append("field", "profil"); // Mise à jour pour utiliser le bon champ 'profil'
  
      try {
        const response = await fetch(`${apiUrl}/api/upload`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${jwt}`,
          },
          body: formData,
        });
  
        if (!response.ok) {
          throw new Error("Erreur mineure lors du téléchargement de l'image");
        }
  
        const data = await response.json();
        console.log("Photo de profil téléchargée avec succès :", data);
  
        // Mettez à jour le message de feedback et réactualisez l'utilisateur si nécessaire
        setFeedbackMessage("Photo de profil mise à jour avec succès !");
      } catch (uploadError) {
        console.warn(
          "Erreur mineure lors de l'upload (probablement liée au format d'image) :",
          uploadError.message
        );
        setFeedbackMessage(
          "Photo de profil non mise à jour, mais les autres modifications ont été enregistrées."
        );
      }
    } catch (err) {
      console.error("Erreur :", err);
      setError("Erreur lors du téléchargement de la photo de profil.");
    }
  };
  


  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-md mx-auto bg-gray-900 p-6 rounded-xl shadow-lg text-white space-y-6"
    >
      <h1 className="text-3xl font-bold text-center">⚙️ Paramètres</h1>
  
      {/* 👤 Infos utilisateur */}
      <div className="bg-gray-800 p-4 rounded-lg space-y-2 text-sm">
        <p>
          <span className="font-semibold text-gray-300">Nom d'utilisateur :</span>{" "}
          {user.username}
        </p>
        <p>
          <span className="font-semibold text-gray-300">Email :</span> {user.email}
        </p>
        <div className="mt-2">
          <span className="font-semibold text-gray-300">Restreint :</span>{" "}
          <span
            className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
              user.restreint ? "bg-red-600" : "bg-green-600"
            }`}
          >
            {user.restreint ? "Oui (compte restreint)" : "Non (aucune restriction)"}
          </span>
        </div>
      </div>
  
      {/* 🔄 Boutons de bascule */}
      <div className="space-y-4">
        {Object.keys(user)
          .filter(
            (key) =>
              typeof user[key] === "boolean" &&
              !["admin", "confirmed", "blocked", "restreint"].includes(key)
          )
          .map((key) => (
            <div key={key} className="bg-gray-800 p-3 rounded-lg flex justify-between items-center">
              <span className="capitalize font-medium">{key}</span>
              <button
                onClick={() => handleToggle(key)}
                disabled={loading || user.restreint}
                className={`px-4 py-1 rounded-md text-sm font-semibold transition ${
                  user[key]
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-red-600 hover:bg-red-700"
                } ${user.restreint ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                {user[key] ? "Actif" : "Inactif"}
              </button>
            </div>
          ))}
      </div>
  
      {/* 📸 Changer la photo de profil */}
      <form
        onSubmit={handleProfilePictureSubmit}
        className="bg-gray-800 p-4 rounded-lg space-y-4 border-t border-gray-700 mt-6"
      >
        <h2 className="text-lg font-semibold">Changer la photo de profil</h2>
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="block w-full text-sm text-white bg-gray-700 border border-gray-600 rounded-lg p-2"
        />
        <button
          type="submit"
          className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition"
        >
          📤 Télécharger
        </button>
      </form>
  
      {/* 📝 Feedback */}
      {feedbackMessage && (
        <p className="mt-2 text-green-400 text-sm text-center">{feedbackMessage}</p>
      )}
      {error && (
        <p className="mt-2 text-red-500 text-sm text-center">{error}</p>
      )}
    </motion.div>
  );
  
  
};

export default Parametre;
