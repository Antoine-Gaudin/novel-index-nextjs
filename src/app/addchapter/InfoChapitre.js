"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";

const InfoChapitre = ({ oeuvre }) => {
  const [nomDomaine, setNomDomaine] = useState(null);
  const [chapitres, setChapitres] = useState([]);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const jwt = localStorage.getItem("jwt");

        if (!jwt) {
          setMessage("Vous devez être connecté pour afficher ces informations.");
          return;
        }

        console.log("Fetching information for oeuvre Document ID:", oeuvre.documentId);

        // Requête pour récupérer les chapitres et leurs utilisateurs associés
        const response = await axios.get(
          `https://novel-index-strapi.onrender.com/api/oeuvres/${oeuvre.documentId}?populate=chapitres.users_permissions_users`,
          {
            headers: {
              Authorization: `Bearer ${jwt}`,
            },
          }
        );

        const oeuvreData = response.data.data;
        console.log("Oeuvre data (response):", oeuvreData);

        // Récupérer le nom de domaine
        setNomDomaine(oeuvreData.nomdomaine || null);

        // Vérifier la structure des chapitres récupérés
        console.log("Chapitres bruts récupérés :", oeuvreData.chapitres);

        // Trier les chapitres par date et prendre les 10 derniers
        const sortedChapitres = (oeuvreData.chapitres || [])
          .map((chapitre) => {
            const utilisateur =
              chapitre.users_permissions_users &&
              chapitre.users_permissions_users.length > 0
                ? chapitre.users_permissions_users[0].username
                : "Inconnu";

            return {
              titre: chapitre.titre,
              datePublication: chapitre.createdAt,
              utilisateur,
            };
          })
          .sort((a, b) => new Date(b.datePublication) - new Date(a.datePublication))
          .slice(0, 10);

        console.log("Chapitres triés et traités :", sortedChapitres);

        setChapitres(sortedChapitres);
      } catch (error) {
        console.error("Erreur lors de la récupération des données :", error.response?.data || error.message);
        setMessage("Erreur lors de la récupération des informations.");
      }
    };

    fetchData();
  }, [oeuvre.documentId]);

  return (
    <div className="w-full max-w-4xl mx-auto bg-gray-800 p-6 rounded-lg shadow-lg text-white">
      <h1 className="text-2xl font-bold mb-6 text-center">Informations sur les chapitres</h1>
      {message && <p className="mb-4 text-center text-yellow-400">{message}</p>}

      {/* Affichage du nom de domaine */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold">Nom de domaine :</h2>
        <p className="mt-2 text-gray-400">
          {nomDomaine ? nomDomaine : "Aucun nom de domaine associé à cette œuvre."}
        </p>
      </div>

      {/* Liste des chapitres */}
      <div>
        <h2 className="text-xl font-semibold mb-4">10 derniers chapitres publiés :</h2>
        {chapitres.length > 0 ? (
          <ul className="space-y-4">
            {chapitres.map((chapitre, index) => (
              <li
                key={index}
                className="p-4 bg-gray-700 rounded-lg shadow-md flex justify-between items-center"
              >
                <div>
                  <h3 className="text-lg font-bold">{chapitre.titre}</h3>
                  <p className="text-sm text-gray-400">
                    Publié le :{" "}
                    {new Date(chapitre.datePublication).toLocaleDateString()} par{" "}
                    {chapitre.utilisateur}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-400">Aucun chapitre publié pour cette œuvre.</p>
        )}
      </div>
    </div>
  );
};

export default InfoChapitre;
