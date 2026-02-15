"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, FolderOpen } from "lucide-react";
import VosAbonnements from "./VosAbonnements";
import VosCategories from "./VosCategories";

const tabs = [
  { key: "abonnements", label: "Vos abonnements", icon: BookOpen },
  { key: "bibliotheque", label: "Vos catégories", icon: FolderOpen },
];

const Bibliotheque = ({ user }) => {
  const [onglet, setOnglet] = useState("abonnements");
  const [statsLoading, setStatsLoading] = useState(true);
  const [stats, setStats] = useState({ abonnements: 0, categories: 0 });
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    if (!user?.documentId) {
      setStatsLoading(false);
      return;
    }
    const fetchStats = async () => {
      try {
        const jwt = localStorage.getItem("jwt");
        const [aboRes, catRes] = await Promise.all([
          fetch(
            `${apiUrl}/api/checkoeuvretimes?filters[users_permissions_users][documentId][$eq]=${user.documentId}&pagination[limit]=1`,
            { headers: { Authorization: `Bearer ${jwt}` } }
          ),
          fetch(
            `${apiUrl}/api/nameoeuvrelists?filters[users_permissions_users][documentId][$eq]=${user.documentId}&pagination[limit]=1`,
            { headers: { Authorization: `Bearer ${jwt}` } }
          ),
        ]);
        const [aboData, catData] = await Promise.all([aboRes.json(), catRes.json()]);
        setStats({
          abonnements: aboData?.meta?.pagination?.total ?? 0,
          categories: catData?.meta?.pagination?.total ?? 0,
        });
      } catch (err) {
        console.error("Erreur fetch stats biblio :", err);
      } finally {
        setStatsLoading(false);
      }
    };
    fetchStats();
  }, [user?.documentId, apiUrl]);

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="flex items-center justify-center gap-3 mb-2">
          <div className="p-2.5 bg-indigo-500/20 rounded-xl">
            <BookOpen className="w-6 h-6 text-indigo-400" />
          </div>
          <h1 className="text-3xl font-bold text-white">Votre Bibliothèque</h1>
        </div>
        <p className="text-gray-400 mt-2">
          Gérez vos œuvres et catégories personnalisées
        </p>
      </div>

      {/* Compteurs */}
      <div className="flex justify-center gap-4 mb-8">
        <div className="flex items-center gap-3 bg-gray-800/50 border border-gray-700/50 rounded-xl px-5 py-3">
          <BookOpen className="w-5 h-5 text-indigo-400" />
          <div>
            <p className="text-xl font-bold text-white">
              {statsLoading ? "-" : stats.abonnements}
            </p>
            <p className="text-xs text-gray-400">Abonnements</p>
          </div>
        </div>
        <div className="flex items-center gap-3 bg-gray-800/50 border border-gray-700/50 rounded-xl px-5 py-3">
          <FolderOpen className="w-5 h-5 text-orange-400" />
          <div>
            <p className="text-xl font-bold text-white">
              {statsLoading ? "-" : stats.categories}
            </p>
            <p className="text-xs text-gray-400">Catégories</p>
          </div>
        </div>
      </div>

      {/* Onglets */}
      <div className="flex justify-center gap-2 mb-8 bg-gray-800/50 p-1.5 rounded-xl w-fit mx-auto border border-gray-700/50">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = onglet === tab.key;
          return (
            <button
              key={tab.key}
              className={`relative flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 ${
                isActive
                  ? "text-white"
                  : "text-gray-400 hover:text-gray-200"
              }`}
              onClick={() => setOnglet(tab.key)}
            >
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-indigo-600 rounded-lg"
                  transition={{ type: "spring", duration: 0.4, bounce: 0.15 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-2">
                <Icon className="w-4 h-4" />
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Contenu */}
      <AnimatePresence mode="wait">
        <motion.div
          key={onglet}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.25 }}
        >
          {onglet === "abonnements" && <VosAbonnements user={user} />}
          {onglet === "bibliotheque" && <VosCategories user={user} />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default Bibliotheque;
