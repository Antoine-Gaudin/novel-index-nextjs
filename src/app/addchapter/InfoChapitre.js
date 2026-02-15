"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen,
  Globe,
  Clock,
  User,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  Calendar,
} from "lucide-react";

const API_URL = "https://novel-index-strapi.onrender.com";

const InfoChapitre = ({ oeuvre }) => {
  const [nomDomaine, setNomDomaine] = useState(null);
  const [chapitres, setChapitres] = useState([]);
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const jwt = localStorage.getItem("jwt");

        if (!jwt) {
          setMessage("Vous devez être connecté pour afficher ces informations.");
          setLoading(false);
          return;
        }

        const response = await axios.get(
          `${API_URL}/api/oeuvres/${oeuvre.documentId}?populate=chapitres.users_permissions_users`,
          { headers: { Authorization: `Bearer ${jwt}` } }
        );

        const oeuvreData = response.data.data;

        setNomDomaine(oeuvreData.nomdomaine || null);

        const sortedChapitres = (oeuvreData.chapitres || [])
          .map((chapitre) => {
            const utilisateur =
              chapitre.users_permissions_users?.length > 0
                ? chapitre.users_permissions_users[0].username
                : "Inconnu";

            return {
              titre: chapitre.titre,
              url: chapitre.url,
              datePublication: chapitre.createdAt,
              utilisateur,
            };
          })
          .sort((a, b) => new Date(b.datePublication) - new Date(a.datePublication))
          .slice(0, 10);

        setChapitres(sortedChapitres);
      } catch (error) {
        console.error("Erreur:", error.response?.data || error.message);
        setMessage("Erreur lors de la récupération des informations.");
      }
      setLoading(false);
    };

    fetchData();
  }, [oeuvre.documentId]);

  const formatDate = (dateString) => {
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="w-full max-w-4xl mx-auto space-y-6"
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-purple-500/20 rounded-lg">
          <BookOpen className="w-5 h-5 text-purple-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Informations sur les chapitres</h2>
          <p className="text-xs text-gray-500">{oeuvre?.titre}</p>
        </div>
      </div>

      {/* Message d'erreur */}
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-3 bg-amber-500/20 border border-amber-500/30 rounded-lg flex items-center gap-2 text-amber-400 text-sm"
          >
            <AlertTriangle className="w-4 h-4" />
            {message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Nom de domaine */}
      <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-2">
          <Globe className="w-4 h-4 text-blue-400" />
          <span className="text-sm font-medium text-gray-300">Nom de domaine</span>
        </div>
        {nomDomaine ? (
          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 bg-blue-500/20 text-blue-400 rounded-lg text-sm font-mono">
              {nomDomaine}
            </span>
          </div>
        ) : (
          <p className="text-gray-500 text-sm">Aucun nom de domaine associé</p>
        )}
      </div>

      {/* Liste des chapitres */}
      <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-700/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-medium text-white">10 derniers chapitres</span>
          </div>
          <span className="text-xs text-gray-500">{chapitres.length} chapitres</span>
        </div>

        {loading ? (
          <div className="p-8 flex items-center justify-center">
            <RefreshCw className="w-5 h-5 text-gray-500 animate-spin" />
          </div>
        ) : chapitres.length > 0 ? (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{
              visible: { transition: { staggerChildren: 0.05 } },
            }}
            className="divide-y divide-gray-700/30"
          >
            {chapitres.map((chapitre, index) => (
              <motion.div
                key={index}
                variants={{
                  hidden: { opacity: 0, x: -10 },
                  visible: { opacity: 1, x: 0 },
                }}
                className="px-4 py-3 hover:bg-gray-700/30 transition-colors group"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-medium text-white truncate">
                        {chapitre.titre}
                      </h3>
                      {chapitre.url && (
                        <a
                          href={chapitre.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <ExternalLink className="w-3.5 h-3.5 text-gray-500 hover:text-blue-400" />
                        </a>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(chapitre.datePublication)}
                      </span>
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        <span className="text-indigo-400">{chapitre.utilisateur}</span>
                      </span>
                    </div>
                  </div>
                  <span className="text-xs text-gray-600 tabular-nums">#{index + 1}</span>
                </div>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <div className="p-8 text-center">
            <BookOpen className="w-8 h-8 text-gray-600 mx-auto mb-2" />
            <p className="text-gray-500 text-sm">Aucun chapitre publié</p>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default InfoChapitre;
