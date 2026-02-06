"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
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

const Profil = ({ user }) => {
  const [abonnements, setAbonnements] = useState([]);
  const [loading, setLoading] = useState(true);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    // Protection : ne pas fetch si user n'existe pas
    if (!user?.documentId) {
      setLoading(false);
      return;
    }

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
  }, [user?.documentId, apiUrl]);

  // Protection : si pas d'utilisateur, afficher un loader
  if (!user) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="bg-gray-800 rounded-2xl p-6 animate-pulse">
          <div className="h-24 w-24 bg-gray-700 rounded-full mx-auto mb-4" />
          <div className="h-6 bg-gray-700 rounded w-1/3 mx-auto mb-2" />
          <div className="h-4 bg-gray-700 rounded w-1/4 mx-auto" />
        </div>
      </div>
    );
  }

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

  const memberSince = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString("fr-FR", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* Section profil utilisateur */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-gray-800 rounded-2xl p-6 flex flex-col sm:flex-row items-center gap-6"
      >
        {/* Avatar */}
        <div className="shrink-0">
          {user.profil?.url ? (
            <Image
              src={user.profil.url}
              alt={user.username}
              width={96}
              height={96}
              className="w-24 h-24 rounded-full object-cover border-2 border-indigo-500"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-indigo-600 flex items-center justify-center text-3xl font-bold text-white">
              {user.username?.charAt(0).toUpperCase() || "?"}
            </div>
          )}
        </div>

        {/* Infos */}
        <div className="flex-grow text-center sm:text-left space-y-1">
          <h1 className="text-2xl font-bold text-white">{user.username}</h1>
          <p className="text-gray-400 text-sm">{user.email}</p>
          {memberSince && (
            <p className="text-gray-500 text-xs">
              Membre depuis le {memberSince}
            </p>
          )}
        </div>

        {/* Stats */}
        <div className="flex gap-6 text-center shrink-0">
          <div className="bg-gray-900 px-5 py-3 rounded-xl">
            <p className="text-2xl font-bold text-indigo-400">
              {loading ? "-" : abonnements.length}
            </p>
            <p className="text-xs text-gray-400">Abonnements</p>
          </div>
          <div className="bg-gray-900 px-5 py-3 rounded-xl">
            <p className="text-2xl font-bold text-green-400">
              {loading ? "-" : abonnementsDuJour.length}
            </p>
            <p className="text-xs text-gray-400">Sorties aujourd&apos;hui</p>
          </div>
        </div>
      </motion.div>

      {/* Section sorties du jour */}
      <div>
        <h2 className="text-xl font-bold text-white mb-4">
          Sorties du jour de vos abonnements
        </h2>

        {loading ? (
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : (
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
                  Aucune sortie aujourd&apos;hui parmi vos abonnements.
                </p>
              ) : (
                abonnementsDuJour.map((abonnement) => (
                  <AbonnementCard
                    key={abonnement.documentId}
                    abonnement={abonnement}
                  />
                ))
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};

export default Profil;
