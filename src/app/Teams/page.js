"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { slugify } from "@/utils/slugify";
import CoverBackground from "@/app/components/CoverBackground";
import KanveoBanner from "@/app/components/KanveoBanner";
import { FiUsers, FiBook, FiExternalLink, FiSearch, FiCheckCircle, FiXCircle } from "react-icons/fi";

/**
 * Vérifie si une team peut être affichée
 * Critères obligatoires : titre, description
 * La couverture est optionnelle (un placeholder sera affiché)
 */
function canDisplay(team) {
  const hasTitle = !!team.titre?.trim();
  const hasDescription = !!team.description?.trim();
  
  return hasTitle && hasDescription;
}

export default function TeamsPage() {
  const [teams, setTeams] = useState([]);
  const [filteredTeams, setFilteredTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterActive, setFilterActive] = useState("all"); // all, active, inactive
  const [stats, setStats] = useState({ total: 0, displayed: 0, hidden: 0 });

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const res = await fetch(
          `${apiUrl}/api/teams?populate[0]=couverture&populate[1]=oeuvres&populate[2]=teamliens&sort=titre:asc`
        );
        if (!res.ok) throw new Error("Erreur API");
        const data = await res.json();

        const allTeams = data.data || [];
        const displayableTeams = allTeams.filter(canDisplay);

        setTeams(displayableTeams);
        setFilteredTeams(displayableTeams);
        setStats({
          total: allTeams.length,
          displayed: displayableTeams.length,
          hidden: allTeams.length - displayableTeams.length,
        });
      } catch (err) {
        console.error("Erreur lors de la récupération des teams:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTeams();
  }, [apiUrl]);

  // Filtrage par recherche et état
  useEffect(() => {
    let result = teams;

    // Filtre par recherche
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (team) =>
          team.titre?.toLowerCase().includes(term) ||
          team.description?.toLowerCase().includes(term)
      );
    }

    // Filtre par état actif/inactif
    if (filterActive === "active") {
      result = result.filter((team) => team.etat === true);
    } else if (filterActive === "inactive") {
      result = result.filter((team) => team.etat === false);
    }

    setFilteredTeams(result);
  }, [searchTerm, filterActive, teams]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header avec CoverBackground */}
      <div className="relative h-64 md:h-72 overflow-hidden">
        <CoverBackground />
        <div className="absolute inset-0 bg-gradient-to-b from-gray-900/40 via-gray-900/30 to-gray-900 z-10" />
        <div className="relative z-20 h-full flex flex-col items-center justify-center px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <div className="flex items-center justify-center gap-3 mb-3">
              <FiUsers className="text-indigo-400 text-3xl md:text-4xl" />
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white">
                Teams de Traduction
              </h1>
            </div>
            <p className="text-gray-300 text-sm md:text-base max-w-2xl mx-auto">
              Découvrez les équipes de traduction qui travaillent sur vos œuvres préférées.
              {stats.displayed} teams référencées sur Novel-Index.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Filtres */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-gray-800 p-4 rounded-xl">
          {/* Recherche */}
          <div className="relative w-full md:w-96">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher une team..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:border-indigo-500 focus:outline-none"
            />
          </div>

          {/* Filtre par état */}
          <div className="flex gap-2">
            <button
              onClick={() => setFilterActive("all")}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filterActive === "all"
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              }`}
            >
              Toutes ({teams.length})
            </button>
            <button
              onClick={() => setFilterActive("active")}
              className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                filterActive === "active"
                  ? "bg-green-600 text-white"
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              }`}
            >
              <FiCheckCircle /> Actives
            </button>
            <button
              onClick={() => setFilterActive("inactive")}
              className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                filterActive === "inactive"
                  ? "bg-red-600 text-white"
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              }`}
            >
              <FiXCircle /> Inactives
            </button>
          </div>
        </div>
      </div>

      {/* Publicité Kanveo */}
      <KanveoBanner format="banner" className="max-w-7xl mx-auto px-4 py-4" />

      {/* Liste des Teams */}
      <div className="max-w-7xl mx-auto px-4 pb-12">
        {filteredTeams.length === 0 ? (
          <div className="text-center py-16">
            <FiUsers className="mx-auto text-6xl text-gray-600 mb-4" />
            <p className="text-gray-400 text-lg">
              {searchTerm
                ? "Aucune team ne correspond à votre recherche."
                : "Aucune team disponible pour le moment."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredTeams.map((team) => (
              <TeamCard key={team.documentId} team={team} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function TeamCard({ team }) {
  const slug = slugify(team.titre);

  return (
    <Link href={`/Teams/${team.documentId}-${slug}`}>
      <div className="bg-gray-800 rounded-xl overflow-hidden hover:ring-2 hover:ring-indigo-500 transition-all duration-300 transform hover:-translate-y-1 cursor-pointer group">
        {/* Image de couverture */}
        <div className="relative h-40 bg-gray-700">
          {team.couverture?.url ? (
            <Image
              src={team.couverture.url}
              alt={team.titre}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <FiUsers className="text-5xl text-gray-600" />
            </div>
          )}
          {/* Badge état */}
          <div
            className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-semibold ${
              team.etat
                ? "bg-green-500/90 text-white"
                : "bg-red-500/90 text-white"
            }`}
          >
            {team.etat ? "Active" : "Inactive"}
          </div>
        </div>

        {/* Contenu */}
        <div className="p-4">
          <h3 className="font-bold text-lg mb-2 truncate group-hover:text-indigo-400 transition-colors">
            {team.titre}
          </h3>
          
          {team.description && (
            <p className="text-gray-400 text-sm line-clamp-2 mb-3">
              {team.description}
            </p>
          )}

          {/* Stats */}
          <div className="flex items-center justify-between text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <FiBook />
              {team.oeuvres?.length || 0} œuvres
            </span>
            <span className="flex items-center gap-1">
              <FiExternalLink />
              {team.teamliens?.length || 0} liens
            </span>
          </div>

        </div>
      </div>
    </Link>
  );
}
