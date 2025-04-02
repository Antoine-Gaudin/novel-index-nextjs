"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";

const Profil = ({ user }) => {
  const [abonnements, setAbonnements] = useState([]);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const router = useRouter();
  

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
        const abonnementsData = data.data;

        const abonnementsAvecChapitres = abonnementsData.map((a) => {
          const oeuvre = a.oeuvres?.[0];
          const chapitres = oeuvre?.chapitres || [];
          return { ...a, chapitres };
        });

        setAbonnements(abonnementsAvecChapitres);
      } catch (error) {
        console.error("Erreur lors du fetch des abonnements :", error);
      }
    };

    fetchAbonnements();
  }, [user.documentId]);

  const isToday = (dateString) => {
    const today = new Date();
    const date = new Date(dateString);
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const abonnementsDuJour = abonnements.filter((a) => {
    const chapitres = a.chapitres || [];
    return chapitres.some((ch) => isToday(ch.createdAt));
  });

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-white">
          📅 Sorties du jour
        </h1>
        <p className="text-gray-400 mt-2">
          Voici les œuvres que vous suivez avec un nouveau chapitre aujourd’hui.
        </p>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
          className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3"
        >
          {abonnementsDuJour.length === 0 ? (
            <p className="text-center text-gray-400 col-span-full">
              Aucune sortie aujourd’hui.
            </p>
          ) : (
            abonnementsDuJour.map((abonnement) => {
              const chapitres = abonnement.chapitres || [];
              const lastCheckedDate = new Date(abonnement.lastChecked);
              const nouveauxChapitres = chapitres.filter(
                (ch) => new Date(ch.createdAt) > lastCheckedDate
              );
              const nbNouveaux = nouveauxChapitres.length;
              const oeuvre = abonnement.oeuvres?.[0];

              return (
                <div
                  key={abonnement.documentId}
                  className="bg-gray-800 rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-shadow cursor-pointer"
                  onClick={() => {
                    const titreSlug = oeuvre.titre
                      .toLowerCase()
                      .normalize("NFD")
                      .replace(/[\u0300-\u036f]/g, "")
                      .replace(/[^a-z0-9]+/g, "-")
                      .replace(/^-+|-+$/g, "");
                    router.push(`/oeuvre/${oeuvre.documentId}-${titreSlug}`);
                  }}
                >
                  {oeuvre?.couverture?.url ? (
                    <img
                      src={oeuvre.couverture.url}
                      alt={oeuvre.titre}
                      className="w-full h-48 object-cover"
                    />
                  ) : (
                    <div className="w-full h-48 bg-gray-700 flex items-center justify-center text-gray-400">
                      Pas de visuel
                    </div>
                  )}
                  <div className="p-4 space-y-2">
                    <h2 className="text-lg font-semibold text-white">
                      {oeuvre?.titre || "Sans titre"}
                    </h2>

                    <p className="text-sm text-gray-400">
                      Dernier accès :{" "}
                      {abonnement.lastChecked
                        ? new Date(abonnement.lastChecked).toLocaleString(
                            "fr-FR"
                          )
                        : "Jamais"}
                    </p>

                    {nbNouveaux > 0 ? (
                      <p className="text-sm text-green-400 font-semibold">
                        📈 {nbNouveaux} nouveau
                        {nbNouveaux > 1 ? "x" : ""} chapitre
                        {nbNouveaux > 1 ? "s" : ""} depuis votre visite
                      </p>
                    ) : (
                      <p className="text-sm text-gray-400">
                        ✅ Vous êtes à jour sur cette œuvre
                      </p>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default Profil;
