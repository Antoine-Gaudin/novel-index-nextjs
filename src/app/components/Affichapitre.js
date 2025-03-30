"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
const AffiChapitre = ({ documentId, licence }) => {
  const [items, setItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null); // Élément sélectionné pour le pop-up
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [totalPages, setTotalPages] = useState(1);
  const [pageJump, setPageJump] = useState("");

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
              tome: achat.tome,
              publishedAt: achat.publishedAt,
              order: achat.order || 0, // Ajouter un `order` par défaut si absent
            }))
          : data.data.chapitres.map((chapitre) => ({
              id: chapitre.id,
              titre: chapitre.titre,
              url: chapitre.url, // URL de redirection
              tome: chapitre.tome,
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

        console.log("liste des chapitre", itemsWithNewFlag);

        setItems(itemsWithNewFlag);
        setFilteredItems(itemsWithNewFlag);
        setTotalPages(Math.ceil(itemsWithNewFlag.length / itemsPerPage));
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
        setCurrentPage(1); // On revient à la page 1 quand on fait une recherche
        setTotalPages(Math.ceil(filtered.length / itemsPerPage));
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
    return (
      <p className="text-gray-400">
        Aucun résultat disponible pour cette œuvre.
      </p>
    );
  }

  const renderPageNumbers = () => {
    const pages = [];
    const total = totalPages;
  
    if (total <= 5) {
      for (let i = 1; i <= total; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1, 2, 3);
  
      if (currentPage > 5 && currentPage < total - 1) {
        pages.push("start-ellipsis");
      }
  
      pages.push(total - 1, total);
    }
  
    return pages.map((page, idx) =>
      typeof page === "string" ? (
        <span key={`ellipsis-${idx}`} className="px-2 text-gray-500">...</span>
      ) : (
        <button
          key={`page-${page}`} // ✅ clé unique
          className={`px-3 py-1 rounded-lg ${
            currentPage === page ? "bg-indigo-600 text-white" : "bg-gray-700 text-white"
          }`}
          onClick={() => setCurrentPage(page)}
        >
          {page}
        </button>
      )
    );
  };
  
  
  const handlePageJump = () => {
    const pageNum = parseInt(pageJump);
    if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
      setCurrentPage(pageNum);
    }
  };
  


  return (
    <div className="space-y-6">
      <h3 className="text-2xl font-bold text-white">
        📚 Chapitres disponibles
      </h3>

      {/* 🔍 Barre de recherche */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="🔎 Rechercher un chapitre..."
          value={searchTerm}
          onChange={handleSearch}
          className="w-full px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {/* 📄 Liste des chapitres */}
      <ul className="space-y-3">
        {filteredItems
          .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
          .map((item) => (
            <li
              key={item.id}
              onClick={() => handleItemClick(item)}
              className="group flex justify-between items-center bg-gray-800 hover:bg-indigo-600 transition-colors cursor-pointer p-4 rounded-xl shadow-md"
            >
              <div className="flex flex-col">
                <span className="text-lg font-semibold group-hover:text-white transition">
                  {item.titre || "Titre non disponible"}
                </span>
                {item.tome && (
                  <span className="text-sm text-blue-400 mt-1">
                    Tome {item.tome}
                  </span>
                )}
                {item.isNew && (
                  <span className="mt-2 w-24 text-center text-xs bg-red-600 text-white px-3 py-1 rounded-full">
                    🆕 Nouveau
                  </span>
                )}
              </div>
              <span className="text-sm italic text-gray-400 group-hover:text-white">
                {licence ? "💳 Achat requis" : "🔗 Redirection"}
              </span>
            </li>
          ))}
      </ul>

      {/* ⏩ Pagination dynamique */}
      <div className="flex flex-wrap gap-2 justify-center mt-6">
        {renderPageNumbers()}
      </div>

      {/* 🔍 Aller à une page précise */}
      <div className="flex items-center justify-center mt-4 gap-2">
        <input
          type="number"
          placeholder="Page..."
          className="w-24 px-3 py-1 rounded-lg bg-gray-700 text-white"
          value={pageJump}
          onChange={(e) => setPageJump(e.target.value)}
          min={1}
          max={totalPages}
        />
        <button
          onClick={handlePageJump}
          className="px-4 py-1 rounded-lg bg-indigo-500 text-white"
        >
          Aller
        </button>
      </div>

      {/* 🪟 Pop-up animé avec framer-motion */}
      <AnimatePresence>
        {selectedItem && (
          <motion.div
            className="fixed inset-0 z-50 bg-black bg-opacity-70 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-gray-900 p-6 rounded-2xl shadow-2xl w-full max-w-md space-y-4 text-white"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              <h2 className="text-2xl font-bold mb-2">🚀 Confirmation</h2>
              <p className="text-gray-300">
                Vous êtes sur le point d'être redirigé vers le site du
                traducteur.
              </p>
              <p>
                <strong>Chapitre :</strong>{" "}
                {selectedItem.titre || "Titre non disponible"}
              </p>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition font-semibold"
                  onClick={closePopup}
                >
                  Annuler
                </button>
                <button
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition font-semibold"
                  onClick={() => {
                    window.open(selectedItem.url, "_blank");
                    closePopup();
                  }}
                >
                  Continuer
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AffiChapitre;
