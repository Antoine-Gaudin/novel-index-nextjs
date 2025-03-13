"use client";

import React, { useState } from "react";
import Cookies from "js-cookie";

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
    <div className="w-full max-w-md bg-gray-800 p-6 rounded-lg shadow-lg">
      <h1 className="text-2xl font-bold mb-6 text-center">Paramètres</h1>
      <div className="text-sm mb-4">
        <p>
          <strong>Nom d'utilisateur :</strong> {user.username}
        </p>
        <p>
          <strong>Email :</strong> {user.email}
        </p>
        <div className="mt-4">
          <strong>Restreint :</strong>{" "}
          <span
            className={`py-1 px-3 rounded ${
              user.restreint ? "bg-red-600 text-white" : "bg-green-600 text-white"
            }`}
          >
            {user.restreint ? "Oui (compte restreint)" : "Non (aucune restriction)"}
          </span>
        </div>
      </div>
      {Object.keys(user)
        .filter(
          (key) =>
            typeof user[key] === "boolean" &&
            key !== "admin" &&
            key !== "confirmed" &&
            key !== "blocked" &&
            key !== "restreint"
        )
        .map((key) => (
          <div key={key} className="mb-4">
            <div className="flex justify-between items-center mb-1">
              <span className="capitalize">{key} :</span>
              <button
                onClick={() => handleToggle(key)}
                disabled={loading || user.restreint}
                className={`py-1 px-3 rounded ${
                  user[key]
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-red-600 hover:bg-red-700"
                } ${
                  user.restreint
                    ? "opacity-50 cursor-not-allowed"
                    : "cursor-pointer"
                } text-white`}
              >
                {user[key] ? "Actif" : "Inactif"}
              </button>
            </div>
          </div>
        ))}
      <form
        onSubmit={handleProfilePictureSubmit}
        className="mt-6 border-t border-gray-700 pt-4"
      >
        <h2 className="text-lg font-bold mb-4">Changer la photo de profil</h2>
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="block w-full text-white bg-gray-700 border border-gray-600 rounded p-2 mb-4"
        />
        <button
          type="submit"
          className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 rounded text-white"
        >
          Télécharger
        </button>
      </form>
      {feedbackMessage && (
        <p className="mt-4 text-green-500 text-center">{feedbackMessage}</p>
      )}
      {error && <p className="mt-4 text-red-500 text-center">{error}</p>}
    </div>
  );
};

export default Parametre;
