"use client";

import React, { useState, useEffect } from "react";

const AffiChapitre = ({ documentId, licence }) => {
  const [items, setItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null); // Élément sélectionné pour le pop-up
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Construire l'URL en fonction de la licence
        const url = licence
          ? `${apiUrl}/api/oeuvres/${documentId}?populate=achatlivres`
          : `${apiUrl}/api/oeuvres/${documentId}?populate=chapitres`;

        const res = await fetch(url);
        const data = await res.json();

        // Stocker les chapitres ou les achats
        const fetchedItems = licence
          ? data.data.achatlivres.map((achat) => ({
              id: achat.id,
              titre: achat.titre,
              url: achat.url, // URL de redirection
              publishedAt: achat.publishedAt,
              order: achat.order || 0, // Ajouter un `order` par défaut si absent
            }))
          : data.data.chapitres.map((chapitre) => ({
              id: chapitre.id,
              titre: chapitre.titre,
              url: chapitre.url, // URL de redirection
              publishedAt: chapitre.publishedAt,
              order: chapitre.order || 0, // Ajouter un `order` par défaut si absent
            }));

        // Tri par `order` décroissant
        const sortedItems = fetchedItems.sort((a, b) => b.order - a.order);

        // Ajouter un indicateur "Nouveau" pour les chapitres sortis aujourd'hui
        const today = new Date().toISOString().split("T")[0];
        const itemsWithNewFlag = sortedItems.map((item) => ({
          ...item,
          isNew:
            item.publishedAt &&
            new Date(item.publishedAt).toISOString().split("T")[0] === today,
        }));

        // Limiter aux 10 premiers éléments
        const limitedItems = itemsWithNewFlag.slice(0, 10);
        setItems(limitedItems);
        setFilteredItems(limitedItems); // Initialiser les résultats filtrés
      } catch (err) {
        console.error("Erreur lors de la récupération des données :", err);
        setError("Impossible de charger les données.");
      }
    };

    if (documentId) {
      fetchData();
    }
  }, [documentId, licence]);

  const handleSearch = (e) => {
    const term = e.target.value.toLowerCase();
    setSearchTerm(term);
  
    setTimeout(() => {
      const filtered = items.filter((item) =>
        item.titre.toLowerCase().includes(term)
      );
  
      // Vérifie si des résultats existent avant de mettre à jour
      if (filtered.length > 0 || term === "") {
        setFilteredItems(filtered);
      }
    }, 100);
  };
  

  // Fonction pour gérer l'ouverture de la fenêtre pop-up
  const handleItemClick = (item) => {
    setSelectedItem(item);
  };

  // Fonction pour gérer la fermeture de la fenêtre pop-up
  const closePopup = () => {
    setSelectedItem(null);
  };

  if (error) {
    return <p className="text-red-500">{error}</p>;
  }

  if (!filteredItems.length) {
    return <p className="text-gray-400">Aucun résultat disponible pour cette œuvre.</p>;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold">Chapitres</h3>

      {/* Barre de recherche */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Rechercher un chapitre par son titre..."
          value={searchTerm}
          onChange={handleSearch}
          className="w-full px-4 py-2 rounded-md bg-gray-800 border border-gray-700 text-white focus:outline-none"
        />
      </div>

      {/* Liste des résultats triés et limités */}
      <ul className="space-y-2">
        {filteredItems.map((item) => (
          <li
            key={item.id}
            className="flex justify-between items-center bg-gray-800 p-4 rounded-md shadow hover:bg-gray-700 cursor-pointer"
            onClick={() => handleItemClick(item)} // Ouvrir le pop-up
          >
            <div>
              {/* Titre de l'élément */}
              <span className="font-bold">{item.titre || "Titre non disponible"}</span>
              {/* Afficher "Nouveau" si applicable */}
              {item.isNew && (
                <span className="ml-2 text-xs bg-red-600 text-white px-2 py-1 rounded-full">
                  Nouveau
                </span>
              )}
            </div>
            {/* Différenciation entre chapitres et achats */}
            <span className="text-sm italic text-gray-500">
              {licence ? "Redirection achat" : "Redirection"}
            </span>
          </li>
        ))}
      </ul>

      {/* Fenêtre Pop-up */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50">
          <div className="bg-gray-900 text-white p-6 rounded-lg shadow-lg w-full max-w-md space-y-4">
            <h2 className="text-2xl font-bold">Confirmation</h2>
            <p>
              Vous êtes sur le point d'être redirigé vers le site du traducteur.
            </p>
            <p>
              <strong>Redirection vers :</strong> {selectedItem.titre || "Titre non disponible"}
            </p>
            <div className="flex justify-end space-x-4">
              <button
                className="px-4 py-2 bg-red-600 rounded-md hover:bg-red-700"
                onClick={closePopup}
              >
                Annuler
              </button>
              <button
                className="px-4 py-2 bg-green-600 rounded-md hover:bg-green-700"
                onClick={() => {
                  window.open(selectedItem.url, "_blank");
                  closePopup();
                }}
              >
                Continuer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AffiChapitre;
