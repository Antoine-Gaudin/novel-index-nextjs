"use client";

import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, SlidersHorizontal, BookOpen, Bell, ArrowUpDown, Compass } from "lucide-react";
import AbonnementCard from "./AbonnementCard";
import Link from "next/link";

const SkeletonCard = () => (
  <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl overflow-hidden animate-pulse">
    <div className="w-full h-48 bg-gray-700/50" />
    <div className="p-4 space-y-3">
      <div className="h-5 bg-gray-700/50 rounded w-3/4" />
      <div className="h-4 bg-gray-700/50 rounded w-1/2" />
      <div className="h-4 bg-gray-700/50 rounded w-2/3" />
    </div>
  </div>
);

const VosAbonnements = ({ user }) => {
  const [abonnements, setAbonnements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("nouveaux"); // "nouveaux", "alpha", "recent"
  const [filterUnread, setFilterUnread] = useState(false);
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

  // Compteur global de chapitres non lus
  const totalNonLus = useMemo(() => {
    return abonnements.reduce((total, a) => {
      const lastCheckedDate = new Date(a.lastChecked);
      const chapitres = a.chapitres || [];
      const nonLus = chapitres.filter((ch) => new Date(ch.createdAt) > lastCheckedDate);
      return total + nonLus.length;
    }, 0);
  }, [abonnements]);

  // Filtrage et tri
  const filteredAbonnements = useMemo(() => {
    let result = [...abonnements];

    // Recherche
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter((a) => {
        const titre = a.oeuvres?.[0]?.titre || "";
        return titre.toLowerCase().includes(query);
      });
    }

    // Filtre non lus
    if (filterUnread) {
      result = result.filter((a) => {
        const lastCheckedDate = new Date(a.lastChecked);
        const chapitres = a.chapitres || [];
        return chapitres.some((ch) => new Date(ch.createdAt) > lastCheckedDate);
      });
    }

    // Tri
    result.sort((a, b) => {
      if (sortBy === "alpha") {
        const titreA = a.oeuvres?.[0]?.titre || "";
        const titreB = b.oeuvres?.[0]?.titre || "";
        return titreA.localeCompare(titreB, "fr");
      }
      if (sortBy === "recent") {
        return new Date(b.lastChecked || 0) - new Date(a.lastChecked || 0);
      }
      // "nouveaux" — ceux avec le plus de chapitres non lus en premier
      const getNonLus = (ab) => {
        const lastChecked = new Date(ab.lastChecked);
        return (ab.chapitres || []).filter((ch) => new Date(ch.createdAt) > lastChecked).length;
      };
      return getNonLus(b) - getNonLus(a);
    });

    return result;
  }, [abonnements, searchQuery, sortBy, filterUnread]);

  // Callback pour mettre à jour lastChecked localement
  const handleMarkAsRead = (documentId) => {
    setAbonnements((prev) =>
      prev.map((a) =>
        a.documentId === documentId
          ? { ...a, lastChecked: new Date().toISOString() }
          : a
      )
    );
  };

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
    <div className="space-y-6">
      {/* Barre de stats + recherche + filtres */}
      <div className="space-y-4">
        {/* Stats rapides */}
        {abonnements.length > 0 && (
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-800/50 border border-gray-700/50 rounded-lg">
              <BookOpen className="w-4 h-4 text-indigo-400" />
              <span className="text-sm text-gray-300">{abonnements.length} abonnement{abonnements.length > 1 ? "s" : ""}</span>
            </div>
            {totalNonLus > 0 && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/30 rounded-lg">
                <Bell className="w-4 h-4 text-green-400" />
                <span className="text-sm text-green-400 font-medium">{totalNonLus} chapitre{totalNonLus > 1 ? "s" : ""} non lu{totalNonLus > 1 ? "s" : ""}</span>
              </div>
            )}
          </div>
        )}

        {/* Recherche + filtres */}
        {abonnements.length > 0 && (
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Barre de recherche */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher une œuvre..."
                className="w-full pl-10 pr-4 py-2.5 bg-gray-800/50 border border-gray-700/50 rounded-lg text-white placeholder-gray-500 text-sm focus:border-indigo-500 focus:outline-none transition-colors"
              />
            </div>

            {/* Filtre non lus */}
            <button
              onClick={() => setFilterUnread(!filterUnread)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                filterUnread
                  ? "bg-green-500/20 text-green-400 border border-green-500/30"
                  : "bg-gray-800/50 text-gray-400 border border-gray-700/50 hover:text-gray-200"
              }`}
            >
              <Bell className="w-4 h-4" />
              Non lus
            </button>

            {/* Tri */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="appearance-none pl-9 pr-8 py-2.5 bg-gray-800/50 border border-gray-700/50 rounded-lg text-sm text-gray-300 focus:border-indigo-500 focus:outline-none cursor-pointer"
              >
                <option value="nouveaux">Nouveaux chapitres</option>
                <option value="alpha">Alphabétique</option>
                <option value="recent">Dernier accès</option>
              </select>
              <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
            </div>
          </div>
        )}
      </div>

      {/* Grille */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`${searchQuery}-${sortBy}-${filterUnread}`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3"
        >
          {filteredAbonnements.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center py-16 text-center">
              {abonnements.length === 0 ? (
                <>
                  <div className="p-4 bg-gray-800/50 rounded-full mb-4">
                    <Compass className="w-10 h-10 text-gray-600" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-300 mb-2">Aucun abonnement</h3>
                  <p className="text-gray-500 text-sm max-w-sm mb-4">
                    Abonnez-vous à des œuvres pour suivre les nouveaux chapitres et ne jamais manquer une sortie.
                  </p>
                  <Link
                    href="/Oeuvres"
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    Parcourir le catalogue
                  </Link>
                </>
              ) : (
                <>
                  <div className="p-4 bg-gray-800/50 rounded-full mb-4">
                    <Search className="w-8 h-8 text-gray-600" />
                  </div>
                  <p className="text-gray-400 text-sm">Aucun résultat pour cette recherche.</p>
                </>
              )}
            </div>
          ) : (
            filteredAbonnements.map((abonnement) => (
              <AbonnementCard
                key={abonnement.documentId}
                abonnement={abonnement}
                onMarkAsRead={handleMarkAsRead}
              />
            ))
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default VosAbonnements;
