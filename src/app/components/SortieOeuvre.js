"use client";

import { useState, useEffect } from "react";
import SectionSorties from "./SectionSorties";

const SortieOeuvre = () => {
  const [oeuvres, setOeuvres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    const fetchOeuvresDuJour = async () => {
      setLoading(true);
      setError(null);

      try {
        const today = new Date().toISOString().split("T")[0];

        const response = await fetch(
          `${apiUrl}/api/oeuvres?filters[createdAt][$gte]=${today}T00:00:00&sort=createdAt:desc&populate=couverture`
        );
        const data = await response.json();

        if (!response.ok)
          throw new Error("Erreur lors de la récupération des œuvres.");

        const enriched = data.data.map((oeuvre) => ({
          ...oeuvre,
          couverture: oeuvre.couverture?.url || null,
          type: oeuvre.type || "Type inconnu",
          traduction: oeuvre.traduction || "Categorie inconnue",
          createdAt: oeuvre.createdAt || new Date().toISOString(),
        }));

        setOeuvres(enriched);
      } catch (err) {
        setError("Impossible de récupérer les nouvelles œuvres.");
        console.error("Erreur lors du fetch :", err);
      } finally {
        setLoading(false);
      }
    };

    fetchOeuvresDuJour();
  }, [apiUrl]);

  return (
    <SectionSorties
      titre="✨ Nouvelles œuvres"
      oeuvres={oeuvres}
      loading={loading}
      error={error}
      showTimeAgo={false}
      accentColor="emerald"
      emptyMessage="Aucune nouvelle œuvre aujourd'hui."
      countLabel={(count) =>
        `${count} nouvelle${count > 1 ? "s" : ""} œuvre${count > 1 ? "s" : ""} ajoutée${count > 1 ? "s" : ""} aujourd'hui`
      }
    />
  );
};

export default SortieOeuvre;
