"use client";

import React, { useState, useEffect } from "react";
import AffiChapitre from "./Affichapitre";
import Commentaire from "./commentaire";

const FicheOeuvre = ({ oeuvre, onClose }) => {
  const [chapitres, setChapitres] = useState([]);
  const [selectedChapter, setSelectedChapter] = useState(null);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    const fetchChapitres = async () => {
      try {
        const res = await fetch(`${apiUrl}/api/oeuvres/${oeuvre.documentId}?populate=chapitres`);
        if (!res.ok) throw new Error("Erreur API");
        const data = await res.json();

        // Trier les chapitres par `order`
        const sortedChapitres = data.data.chapitres.sort((a, b) => a.order - b.order);
        setChapitres(sortedChapitres);
      } catch (err) {
        console.error("Erreur lors de la récupération des chapitres :", err);
      }
    };

    if (oeuvre.documentId) {
      fetchChapitres();
    }
  }, [oeuvre.documentId]);

  // Gérer le clic pour "Commencer à lire" et "Lire le dernier chapitre"
  const handleReadClick = (type) => {
    if (!chapitres.length) return;

    const selectedChapitre =
      type === "first" ? chapitres[0] : chapitres[chapitres.length - 1];

    setSelectedChapter(selectedChapitre);
  };

  // Fermer le pop-up
  const closePopup = () => {
    setSelectedChapter(null);
  };

  if (!oeuvre) {
    return null; // Si aucune œuvre n'est passée, on ne montre rien
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex justify-center items-center">
      <div
        className="relative bg-gray-900 text-white rounded-lg shadow-lg w-full max-w-5xl h-5/6 overflow-hidden"
        style={{
          overflowY: "scroll", 
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
      >
        {/* Masquer la barre de défilement sur Webkit */}
        <style>
          {`
            .relative::-webkit-scrollbar {
              display: none;
            }
            @media (max-width: 814px) {
              .responsive-section {
                flex-direction: column;
                align-items: center;
                text-align: center;
              }
              .responsive-section img {
                width: 10rem;
                height: 14rem;
                margin-bottom: 1rem;
              }
              .responsive-buttons {
                flex-direction: column;
                gap: 0.5rem;
              }
              .responsive-grid {
                grid-template-columns: 1fr;
              }
            }
          `}
        </style>

        {/* En-tête */}
        <div className="relative">
          {/* Image de fond avec dégradé */}
          <div
            className="absolute inset-0 h-64"
            style={{
              backgroundImage: `
                linear-gradient(to bottom, rgba(17, 24, 39, 0.6), rgba(17, 24, 39, 1)),
                url('/images/heroheader.webp')`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          ></div>
        </div>

        {/* Zone d'informations */}
        <div className="relative flex items-end px-12 responsive-section">
          {/* Image de couverture */}
          {oeuvre.couverture ? (
            <img
              src={`https://novel-index-strapi.onrender.com${oeuvre.couverture}`}
              alt={oeuvre.titre || "Image non disponible"}
              className="rounded-md shadow-md"
              style={{
                width: "14rem",
                height: "20rem",
                objectFit: "cover",
              }}
            />
          ) : (
            <div className="w-full md:w-1/3 bg-gray-700 text-gray-400 flex items-center justify-center rounded-lg">
              Pas de couverture
            </div>
          )}

          {/* Informations principales */}
          <div className="flex flex-col justify-end space-y-6 ml-8 h-full">
            <h1 className="text-4xl font-bold">{oeuvre.titre || "Titre non disponible"}</h1>
            <p className="text-gray-300 text-lg">
              <strong>
                {oeuvre.auteur || "Auteur inconnu"} (Auteur),{" "}
                {oeuvre.traduction || "Traduction inconnue"} (Traduction)
              </strong>
            </p>

            {/* Boutons d'action */}
            <div className="flex space-x-4 responsive-buttons">
              <button
                className="px-6 py-3 bg-indigo-600 text-white rounded-md shadow hover:bg-indigo-700 text-lg"
                onClick={() => handleReadClick("first")}
              >
                Commencer à lire
              </button>
              <button
                className="px-6 py-3 bg-green-600 text-white rounded-md shadow hover:bg-green-700 text-lg"
                onClick={() => handleReadClick("last")}
              >
                Lire le dernier chapitre
              </button>
            </div>
          </div>
        </div>

        {/* Bouton Fermer */}
        <button
          className="absolute top-4 right-4 bg-red-600 hover:bg-red-700 text-white rounded-full w-10 h-10 flex items-center justify-center text-lg"
          onClick={onClose}
        >
          ✖
        </button>

        {/* Contenu Principal */}
        <div className="p-6 space-y-4">
          {/* titrealt, categorie, licence, langage, etat, annee */}
          <div className="flex flex-wrap gap-4">
            {oeuvre.titrealt && (
              <span className="bg-yellow-600 text-white px-3 py-1 rounded-md text-sm">
                Titre alternatif : {oeuvre.titrealt}
              </span>
            )}
            {oeuvre.categorie && (
              <span className="bg-blue-600 text-white px-3 py-1 rounded-md text-sm">
                Catégorie : {oeuvre.categorie}
              </span>
            )}
            {typeof oeuvre.licence === "boolean" && (
              <span
                className={`${
                  oeuvre.licence ? "bg-green-600" : "bg-red-600"
                } text-white px-3 py-1 rounded-md text-sm`}
              >
                {oeuvre.licence ? "Licencié" : "Non licencié"}
              </span>
            )}
            {oeuvre.langage && (
              <span className="bg-purple-600 text-white px-3 py-1 rounded-md text-sm">
                Langage : {oeuvre.langage}
              </span>
            )}
            {oeuvre.etat && (
              <span className="bg-gray-600 text-white px-3 py-1 rounded-md text-sm">
                État : {oeuvre.etat}
              </span>
            )}
            {oeuvre.annee && (
              <span className="bg-gray-600 text-white px-3 py-1 rounded-md text-sm">
                Année : {oeuvre.annee}
              </span>
            )}
          </div>

          {/* Fenêtre Pop-up de confirmation */}
          {selectedChapter && (
            <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50">
              <div className="bg-gray-900 text-white p-6 rounded-lg shadow-lg w-full max-w-md space-y-4">
                <h2 className="text-2xl font-bold">Confirmation</h2>
                <p>Vous êtes sur le point d'être redirigé vers le chapitre sélectionné.</p>
                <p><strong>Chapitre :</strong> {selectedChapter.titre || "Titre non disponible"}</p>
                <div className="flex justify-end space-x-4">
                  <button className="px-4 py-2 bg-red-600 rounded-md hover:bg-red-700" onClick={closePopup}>
                    Annuler
                  </button>
                  <button className="px-4 py-2 bg-green-600 rounded-md hover:bg-green-700" onClick={() => {
                    window.open(selectedChapter.url, "_blank");
                    closePopup();
                  }}>
                    Continuer
                  </button>
                </div>
              </div>
            </div>
          )}

          <AffiChapitre documentId={oeuvre.documentId} licence={oeuvre.licence} />
          <Commentaire oeuvre={oeuvre} />
        </div>
      </div>
    </div>
  );
};

export default FicheOeuvre;
