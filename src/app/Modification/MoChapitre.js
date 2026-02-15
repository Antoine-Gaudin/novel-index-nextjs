"use client";

import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import FormMoChapitre from "../components/FormMoChapitre";

const STRAPI_URL = "https://novel-index-strapi.onrender.com";

const MoChapitre = ({ user, oeuvre, onDirty }) => {
  const [chapitres, setChapitres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState(null);
  const [showUrls, setShowUrls] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [showAllUrls, setShowAllUrls] = useState(false);
  const [bulkTome, setBulkTome] = useState("");
  const [modifiedChapitreIds, setModifiedChapitreIds] = useState(new Set());
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState("");

  const fetchChapitres = async () => {
    setLoading(true);
    try {
      const jwt = localStorage.getItem("jwt");
      const response = await axios.get(
        `${STRAPI_URL}/api/oeuvres/${oeuvre.documentId}?populate=chapitres`,
        { headers: { Authorization: `Bearer ${jwt}` } }
      );
      setChapitres(
        (response.data.data.chapitres || []).sort(
          (a, b) => Number(a.order) - Number(b.order)
        )
      );
    } catch (error) {
      console.error("Erreur fetch chapitres:", error);
      setFeedback({
        type: "error",
        message: "Erreur lors de la recuperation des chapitres.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChapitres();
  }, [oeuvre]);

  // Correction du bug : utilise documentId au lieu de l'index filtre
  const handleChapitreChange = (documentId, field, value) => {
    const updated = [...chapitres];
    const idx = updated.findIndex((c) => c.documentId === documentId);
    if (idx === -1) return;

    updated[idx] = { ...updated[idx], [field]: value };
    setChapitres(updated);
    setModifiedChapitreIds((prev) => new Set(prev).add(documentId));
    onDirty?.(true);
  };

  const toggleUrl = (documentId) => {
    setShowUrls((prev) => ({
      ...prev,
      [documentId]: !prev[documentId],
    }));
  };

  const toggleSelect = (documentId) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(documentId)) {
        next.delete(documentId);
      } else {
        next.add(documentId);
      }
      return next;
    });
  };

  const toggleSelectAll = (filteredList) => {
    const allFilteredIds = filteredList.map((c) => c.documentId);
    const allSelected = allFilteredIds.every((id) => selectedIds.has(id));

    if (allSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        allFilteredIds.forEach((id) => next.delete(id));
        return next;
      });
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        allFilteredIds.forEach((id) => next.add(id));
        return next;
      });
    }
  };

  const handleSaveChapitres = useCallback(async () => {
    try {
      const jwt = localStorage.getItem("jwt");

      // Force un ordre croissant a partir de 1
      const reorderedChapitres = [...chapitres]
        .sort((a, b) => Number(a.order) - Number(b.order))
        .map((chap, index) => ({
          ...chap,
          order: index + 1,
        }));

      setChapitres(reorderedChapitres);

      const chaptersToUpdate = reorderedChapitres.filter((chap) =>
        modifiedChapitreIds.has(chap.documentId)
      );

      if (chaptersToUpdate.length === 0) {
        setFeedback({
          type: "info",
          message: "Aucune modification a enregistrer.",
        });
        setStatusMessage("");
        setTimeout(() => setFeedback(null), 3000);
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
            `${STRAPI_URL}/api/chapitres/${chapitre.documentId}`,
            { data: filteredChapitre },
            { headers: { Authorization: `Bearer ${jwt}` } }
          );

          successCount++;

          if (successCount % 80 === 0 && successCount !== total) {
            setStatusMessage(
              `Pause 5s apres ${successCount} chapitres...`
            );
            await new Promise((r) => setTimeout(r, 5000));
            setStatusMessage("Reprise...");
          }

          const pourcentage = Math.round((successCount / total) * 100);
          setProgress(pourcentage);
          setStatusMessage(
            `Enregistrement ${successCount}/${total} chapitres...`
          );
        } catch (err) {
          console.error(`Echec mise a jour chapitre ${chapitre.titre}`, err);
          setStatusMessage(`Erreur sur "${chapitre.titre}"`);
        }
      }

      setFeedback({
        type: "success",
        message: `${successCount} chapitre${successCount > 1 ? "s" : ""} enregistre${successCount > 1 ? "s" : ""} avec succes.`,
      });
      setStatusMessage("Termine !");
      setModifiedChapitreIds(new Set());
      onDirty?.(false);

      await fetchChapitres();

      setTimeout(() => {
        setProgress(0);
        setStatusMessage("");
        setFeedback(null);
      }, 3000);
    } catch (error) {
      console.error("Erreur globale:", error.response?.data || error.message);
      setFeedback({
        type: "error",
        message: "Erreur lors de la mise a jour des chapitres.",
      });
      setStatusMessage("");
    }
  }, [chapitres, modifiedChapitreIds, oeuvre, onDirty]);

  // Ctrl+S shortcut
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        handleSaveChapitres();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleSaveChapitres]);

  const filteredChapitres = chapitres.filter((chapitre) => {
    const query = searchTerm.toLowerCase().trim();
    if (!query) return true;

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
  });

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
      selectedIds={selectedIds}
      toggleSelect={toggleSelect}
      toggleSelectAll={toggleSelectAll}
      filteredChapitres={filteredChapitres}
      modifiedChapitreIds={modifiedChapitreIds}
      handleChapitreChange={handleChapitreChange}
      handleSaveChapitres={handleSaveChapitres}
      feedback={feedback}
      statusMessage={statusMessage}
      progress={progress}
      loading={loading}
    />
  );
};

export default MoChapitre;
