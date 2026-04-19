"use client";

import { useState, useEffect } from "react";
import SectionSorties from "./SectionSorties";

const SortieJours = () => {
  const [oeuvres, setOeuvres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    const fetchSortiesDuJour = async () => {
      setLoading(true);
      setError(null);

      const today = new Date().toISOString().split("T")[0];

      try {
        const res = await fetch(
          `${apiUrl}/api/sortie-du-jours?filters[date][$eq]=${today}&populate[oeuvre][populate]=couverture&sort=dernierUpdate:desc`
        );
        const data = await res.json();
        const sorties = data?.data || [];

        const results = sorties
          .filter((s) => s.oeuvre)
          .map((sortie) => ({
            documentId: sortie.oeuvre.documentId,
            titre: sortie.oeuvre.titre || "Sans titre",
            couverture: sortie.oeuvre.couverture?.url || null,
            type: sortie.oeuvre.type || "Type inconnu",
            traduction: sortie.oeuvre.traduction || "Categorie inconnue",
            updatedAt: sortie.oeuvre.updatedAt || new Date().toISOString(),
            lastChapitreUpdate: sortie.dernierUpdate || null,
          }));

        setOeuvres(results);
      } catch (err) {
        console.error("Erreur :", err);
        setError("Erreur lors de la récupération des œuvres.");
      } finally {
        setLoading(false);
      }
    };

    fetchSortiesDuJour();
  }, [apiUrl]);

  return (
    <SectionSorties
      titre="🔥 Sorties du jour"
      oeuvres={oeuvres}
      loading={loading}
      error={error}
      showTimeAgo={true}
      accentColor="indigo"
      emptyMessage="Pas encore de sorties aujourd'hui. Repassez plus tard !"
      countLabel={(count) =>
        `${count} œuvre${count > 1 ? "s" : ""} mise${count > 1 ? "s" : ""} à jour aujourd'hui`
      }
    />
  );
};

export default SortieJours;
