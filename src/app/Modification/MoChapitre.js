"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import FormMoChapitre from "../components/FormMoChapitre";

const MoChapitre = ({ user, oeuvre }) => {
  const [chapitres, setChapitres] = useState([]);
  const [message, setMessage] = useState(null);
  const [showUrls, setShowUrls] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [showAllUrls, setShowAllUrls] = useState(false); // ✅ toggle global URL
  const [bulkTome, setBulkTome] = useState("");
  const [modifiedChapitreIds, setModifiedChapitreIds] = useState(new Set());
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState("");

  const fetchChapitres = async () => {
    try {
      const jwt = localStorage.getItem("jwt");
      const response = await axios.get(
        `https://novel-index-strapi.onrender.com/api/oeuvres/${oeuvre.documentId}?populate=chapitres`,
        {
          headers: { Authorization: `Bearer ${jwt}` },
        }
      );
      setChapitres(
        (response.data.data.chapitres || []).sort((a, b) => Number(a.order) - Number(b.order))
      );
      
    } catch (error) {
      console.error(
        "Erreur lors de la récupération des chapitres :",
        error.response?.data || error.message
      );
      setMessage("Erreur lors de la récupération des chapitres.");
    }
  };

  useEffect(() => {
    fetchChapitres();
  }, [oeuvre]);

  const handleChapitreChange = (index, field, value) => {
    const updated = [...chapitres];
    updated[index][field] = value;
    setChapitres(updated);

    const id = updated[index].documentId;
    setModifiedChapitreIds((prev) => new Set(prev).add(id));
  };

  const toggleUrl = (index) => {
    setShowUrls((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const handleSaveChapitres = async () => {
    try {
      const jwt = localStorage.getItem("jwt");

// 🔁 Force un ordre croissant à partir de 1 (ou 0 si tu préfères)
const reorderedChapitres = [...chapitres]
  .sort((a, b) => Number(a.order) - Number(b.order))
  .map((chap, index) => ({
    ...chap,
    order: index + 1, // <- ordres stricts 1, 2, 3, ...
  }));

setChapitres(reorderedChapitres);

// Ensuite, sélectionne les modifiés
const chaptersToUpdate = reorderedChapitres.filter((chap) =>
  modifiedChapitreIds.has(chap.documentId)
);


      if (chaptersToUpdate.length === 0) {
        setMessage("Aucune modification à enregistrer.");
        setStatusMessage("Aucune mise à jour nécessaire.");
        return;
      }

      const total = chaptersToUpdate.length;
      let successCount = 0;

      for (const chapitre of chaptersToUpdate) {
        const filteredChapitre = Object.keys(chapitre)
          .filter(
            (key) =>
              !["id", "documentId", "createdAt", "updatedAt"].includes(key)
          )
          .reduce((obj, key) => {
            obj[key] = chapitre[key];
            return obj;
          }, {});

        try {
          await axios.put(
            `https://novel-index-strapi.onrender.com/api/chapitres/${chapitre.documentId}`,
            { data: filteredChapitre },
            { headers: { Authorization: `Bearer ${jwt}` } }
          );

          successCount++;
          // Pause automatique toutes les 80 requêtes
          if (successCount % 80 === 0 && successCount !== total) {
            setStatusMessage(
              `🛑 Pause 5 sec après ${successCount} chapitres...`
            );
            await new Promise((r) => setTimeout(r, 5000));
            setStatusMessage("✅ Reprise...");
          }
          const pourcentage = Math.round((successCount / total) * 100);
          setProgress(pourcentage);
          setStatusMessage(
            `💾 Enregistrement ${successCount}/${total} chapitres...`
          );

        } catch (err) {
          console.error(`❌ Échec mise à jour chapitre ${chapitre.titre}`, err);
          setStatusMessage(`❌ Erreur sur "${chapitre.titre}"`);
        }
      }

      setMessage("✅ Tous les chapitres ont été enregistrés.");
      setStatusMessage("✅ Terminé !");
      setModifiedChapitreIds(new Set());


// 🔁 Re-fetch les chapitres mis à jour
await fetchChapitres();

      // Affiche encore la barre 1 seconde après la fin
      setTimeout(() => {
        setProgress(0);
        setStatusMessage("");
      }, 1500);
    } catch (error) {
      console.error(
        "🔥 Erreur globale :",
        error.response?.data || error.message
      );
      setMessage("❌ Erreur lors de la mise à jour.");
      setStatusMessage("Erreur générale.");
    }
  };

  const filteredChapitres = chapitres
  .filter((chapitre) => {
    const query = searchTerm.toLowerCase().trim();

    const matchesTitre = chapitre.titre?.toLowerCase().includes(query);

    const matchesOrderRange = (() => {
      if (query.includes(".")) {
        const [start, end] = query.split(".").map(Number);
        return (
          !isNaN(start) &&
          !isNaN(end) &&
          Number(chapitre.order) >= start &&
          Number(chapitre.order) <= end
        );
      }
      return false;
    })();

    return matchesTitre || matchesOrderRange;
  })


  return (
    <FormMoChapitre
    chapitres={chapitres}
    setChapitres={setChapitres}
    searchTerm={searchTerm}
    setSearchTerm={setSearchTerm}
    bulkTome={bulkTome}
    setBulkTome={setBulkTome}
    showAllUrls={showAllUrls}
    setShowAllUrls={setShowAllUrls}
    showUrls={showUrls}
    toggleUrl={toggleUrl}
    filteredChapitres={filteredChapitres}
    handleChapitreChange={handleChapitreChange}
    handleSaveChapitres={handleSaveChapitres}
    statusMessage={statusMessage}
    progress={progress}
  />
  );
};

export default MoChapitre;
