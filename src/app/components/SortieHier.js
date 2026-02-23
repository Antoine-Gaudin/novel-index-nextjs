"use client";

import { useState, useEffect } from "react";
import SectionSorties from "./SectionSorties";

const SortieHier = () => {
  const [oeuvres, setOeuvres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    const fetchOeuvresHier = async () => {
      setLoading(true);
      setError(null);

      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split("T")[0];
      const todayStr = today.toISOString().split("T")[0];

      const fetched = {};
      const results = [];
      const pageSize = 100;
      let page = 0;
      let hasMore = true;
      const maxPages = 10;

      try {
        while (hasMore && page < maxPages) {
          const res = await fetch(
            `${apiUrl}/api/oeuvres?populate[couverture]=true&pagination[start]=${
              page * pageSize
            }&pagination[limit]=${pageSize}&populate[chapitres][filters][updatedAt][$gte]=${yesterdayStr}T00:00:00&populate[chapitres][filters][updatedAt][$lt]=${todayStr}T00:00:00`
          );
          const data = await res.json();
          const oeuvresData = data?.data || [];

          if (oeuvresData.length === 0) {
            hasMore = false;
            break;
          }

          for (const oeuvre of oeuvresData) {
            const docId = oeuvre.documentId || oeuvre.id;
            const chapitres =
              oeuvre.chapitres || oeuvre?.chapitres?.data || [];

            if (chapitres.length > 0 && !fetched[docId]) {
              const lastUpdatedChapitre = chapitres
                .map((c) => new Date(c.updatedAt))
                .sort((a, b) => b - a)[0];

              results.push({
                documentId: docId,
                titre: oeuvre.titre || "Sans titre",
                couverture: oeuvre.couverture?.url || null,
                type: oeuvre.type || "Type inconnu",
                traduction: oeuvre.traduction || "Categorie inconnue",
                updatedAt: oeuvre.updatedAt || new Date().toISOString(),
                lastChapitreUpdate:
                  lastUpdatedChapitre?.toISOString() || null,
              });
              fetched[docId] = true;
            }
          }

          page++;
        }

        // Ajouter les achats d'hier
        const achatRes = await fetch(
          `${apiUrl}/api/Achatlivres?filters[updatedAt][$gte]=${yesterdayStr}T00:00:00&filters[updatedAt][$lt]=${todayStr}T00:00:00&populate[oeuvres][populate]=couverture`
        );
        const achatJson = await achatRes.json();
        const achats = achatJson?.data || [];

        for (const achat of achats) {
          const oeuvre = achat.oeuvres?.[0];
          if (!oeuvre || fetched[oeuvre.documentId]) continue;

          results.push({
            documentId: oeuvre.documentId,
            titre: oeuvre.titre || "Sans titre",
            couverture: oeuvre.couverture?.url || null,
            type: oeuvre.type || "Type inconnu",
            traduction: oeuvre.traduction || "Categorie inconnue",
            updatedAt: oeuvre.updatedAt || new Date().toISOString(),
          });
          fetched[oeuvre.documentId] = true;
        }

        results.sort((a, b) => {
          const dateA = new Date(a.lastChapitreUpdate || a.updatedAt);
          const dateB = new Date(b.lastChapitreUpdate || b.updatedAt);
          return dateB - dateA;
        });

        setOeuvres(results);
      } catch (err) {
        console.error("Erreur :", err);
        setError("Erreur lors de la récupération des sorties d'hier.");
      } finally {
        setLoading(false);
      }
    };

    fetchOeuvresHier();
  }, [apiUrl]);

  return (
    <SectionSorties
      titre="📅 Sorties d'hier"
      oeuvres={oeuvres}
      loading={loading}
      error={error}
      showTimeAgo={false}
      accentColor="amber"
      emptyMessage="Aucune sortie hier."
      countLabel={(count) =>
        `${count} œuvre${count > 1 ? "s" : ""} mise${count > 1 ? "s" : ""} à jour hier`
      }
    />
  );
};

export default SortieHier;
