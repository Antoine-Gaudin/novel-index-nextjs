"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import AbonnementCard from "./AbonnementCard";

const SkeletonCard = () => (
  <div className="bg-gray-800 rounded-xl overflow-hidden shadow-md animate-pulse">
    <div className="w-full h-48 bg-gray-700" />
    <div className="p-4 space-y-3">
      <div className="h-5 bg-gray-700 rounded w-3/4" />
      <div className="h-4 bg-gray-700 rounded w-1/2" />
      <div className="h-4 bg-gray-700 rounded w-2/3" />
    </div>
  </div>
);

const VosAbonnements = ({ user }) => {
  const [abonnements, setAbonnements] = useState([]);
  const [loading, setLoading] = useState(true);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    const fetchAbonnements = async () => {
      try {
        const jwt = localStorage.getItem("jwt");

        const res = await fetch(
          `${apiUrl}/api/checkoeuvretimes?filters[users_permissions_users][documentId][$eq]=${user.documentId}&populate[oeuvres][populate][0]=couverture&populate[oeuvres][populate][1]=chapitres`,
          {
            headers: { Authorization: `Bearer ${jwt}` },
          }
        );

        const data = await res.json();
        const abonnementsData = data.data || [];

        const abonnementsAvecChapitres = abonnementsData.map((a) => {
          const oeuvre = a.oeuvres?.[0];
          const chapitres = oeuvre?.chapitres || [];
          return { ...a, chapitres };
        });

        setAbonnements(abonnementsAvecChapitres);
      } catch (error) {
        console.error("Erreur lors du fetch des abonnements :", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAbonnements();
  }, [user.documentId, apiUrl]);

  if (loading) {
    return (
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <AnimatePresence mode="wait">
        <motion.div
          key="abonnements"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
          className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3"
        >
          {abonnements.length === 0 ? (
            <p className="text-center text-gray-400 col-span-full">
              Aucun abonnement trouv&eacute;.
            </p>
          ) : (
            abonnements.map((abonnement) => (
              <AbonnementCard
                key={abonnement.documentId}
                abonnement={abonnement}
              />
            ))
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default VosAbonnements;
