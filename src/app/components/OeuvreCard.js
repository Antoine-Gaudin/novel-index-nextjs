"use client";

import { motion } from "framer-motion";
import { FiBook } from "react-icons/fi";

const OeuvreCard = ({ oeuvre, index = 0, onClick, showTimeAgo = false }) => {
  const getTimeAgo = (dateString) => {
    if (!dateString) return null;
    const updated = new Date(dateString);
    const now = new Date();
    const diffMs = now - updated;
    const diffMins = Math.floor(diffMs / (1000 * 60));

    if (diffMins < 60) return `${diffMins} min`;
    const diffHours = Math.floor(diffMins / 60);
    return `${diffHours}h`;
  };

  const timeAgo = showTimeAgo
    ? getTimeAgo(oeuvre.lastChapitreUpdate || oeuvre.updatedAt)
    : null;

  // Support des deux formats de couverture (URL directe ou objet avec .url)
  const coverUrl = typeof oeuvre.couverture === "string" 
    ? oeuvre.couverture 
    : oeuvre.couverture?.url;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      whileHover={{ y: -8, transition: { duration: 0.2 } }}
      className="group relative bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-lg overflow-hidden cursor-pointer border border-gray-700/30 hover:border-indigo-500/50 hover:shadow-indigo-500/10 hover:shadow-xl transition-all duration-300"
      onClick={() => onClick?.(oeuvre)}
    >
      {coverUrl ? (
        <div
          className="h-48 sm:h-64 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
          style={{ backgroundImage: `url(${coverUrl})` }}
        />
      ) : (
        <div className="h-48 sm:h-64 bg-gray-700/50 flex items-center justify-center text-gray-500">
          <FiBook className="text-4xl" />
        </div>
      )}
      <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black via-gray-900/95 to-transparent px-3 py-3">
        <div className="flex flex-wrap gap-1.5 mb-2">
          <span className="bg-indigo-600/80 text-white px-2 py-0.5 text-xs rounded-full">
            {oeuvre.type || "Type"}
          </span>
          <span className="bg-purple-600/80 text-white px-2 py-0.5 text-xs rounded-full">
            {oeuvre.categorie || oeuvre.traduction || "Catégorie"}
          </span>
          {timeAgo && (
            <span className="bg-green-600/80 text-white px-2 py-0.5 text-xs rounded-full">
              {timeAgo}
            </span>
          )}
        </div>
        <p className="font-semibold text-sm sm:text-base text-white truncate group-hover:text-indigo-300 transition-colors">
          {oeuvre.titre || "Titre non disponible"}
        </p>
      </div>
    </motion.div>
  );
};

export default OeuvreCard;
