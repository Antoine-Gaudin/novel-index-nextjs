"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { slugify } from "@/utils/slugify";
import { motion } from "framer-motion";
import { Clock, Bell, CheckCircle, BookOpen, Eye } from "lucide-react";

const AbonnementCard = ({ abonnement, onMarkAsRead }) => {
  const router = useRouter();
  const [markingRead, setMarkingRead] = useState(false);
  const oeuvre = abonnement.oeuvres?.[0];
  const chapitres = abonnement.chapitres || [];
  const lastCheckedDate = new Date(abonnement.lastChecked);
  const nouveauxChapitres = chapitres.filter(
    (ch) => new Date(ch.createdAt) > lastCheckedDate
  );
  const nbNouveaux = nouveauxChapitres.length;
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  const formatDate = (dateString) => {
    if (!dateString) return "Jamais";
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays < 7) return `Il y a ${diffDays}j`;
    return date.toLocaleDateString("fr-FR");
  };

  const handleMarkAsRead = async (e) => {
    e.stopPropagation();
    setMarkingRead(true);
    try {
      const jwt = localStorage.getItem("jwt");
      await fetch(`${apiUrl}/api/checkoeuvretimes/${abonnement.documentId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwt}`,
        },
        body: JSON.stringify({
          data: { lastChecked: new Date().toISOString() },
        }),
      });
      if (onMarkAsRead) onMarkAsRead(abonnement.documentId);
    } catch (error) {
      console.error("Erreur marquage lu :", error);
    } finally {
      setMarkingRead(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="group relative bg-gray-800/50 border border-gray-700/50 rounded-xl overflow-hidden hover:border-gray-600/50 transition-all cursor-pointer"
      onClick={() => {
        if (oeuvre) {
          const titreSlug = slugify(oeuvre.titre);
          router.push(`/oeuvre/${oeuvre.documentId}-${titreSlug}`);
        }
      }}
    >
      {/* Badge non lu */}
      {nbNouveaux > 0 && (
        <div className="absolute top-3 right-3 z-10 flex items-center gap-1 px-2 py-1 bg-green-500 text-white text-xs font-bold rounded-full shadow-lg shadow-green-500/30">
          <Bell className="w-3 h-3" />
          {nbNouveaux}
        </div>
      )}

      {/* Image */}
      <div className="relative">
        {oeuvre?.couverture?.url ? (
          <Image
            src={oeuvre.couverture.url}
            alt={oeuvre.titre}
            width={300}
            height={192}
            className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-48 bg-gray-700/50 flex items-center justify-center">
            <BookOpen className="w-10 h-10 text-gray-600" />
          </div>
        )}
        {/* Overlay hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>

      {/* Contenu */}
      <div className="p-4 space-y-3">
        <h2 className="text-base font-semibold text-white truncate">
          {oeuvre?.titre || "Sans titre"}
        </h2>

        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <Clock className="w-3.5 h-3.5" />
          <span>{formatDate(abonnement.lastChecked)}</span>
        </div>

        {nbNouveaux > 0 ? (
          <div className="flex items-center justify-between">
            <p className="text-sm text-green-400 font-medium">
              {nbNouveaux} nouveau{nbNouveaux > 1 ? "x" : ""} chapitre{nbNouveaux > 1 ? "s" : ""}
            </p>
            <button
              onClick={handleMarkAsRead}
              disabled={markingRead}
              className="flex items-center gap-1 px-2.5 py-1 bg-gray-700 hover:bg-gray-600 rounded-md text-xs text-gray-300 transition-colors"
              title="Marquer comme lu"
            >
              {markingRead ? (
                <span className="w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                <Eye className="w-3.5 h-3.5" />
              )}
              Lu
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-sm text-gray-500">
            <CheckCircle className="w-4 h-4 text-gray-600" />
            <span>À jour</span>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default AbonnementCard;
