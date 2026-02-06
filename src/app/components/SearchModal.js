"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { slugify } from "@/utils/slugify";

export default function SearchModal({ isOpen, onClose }) {
  const [searchText, setSearchText] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const debounceTimeout = useRef(null);
  const inputRef = useRef(null);

  // Focus l'input quand le modal s'ouvre
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Recherche avec debounce
  useEffect(() => {
    if (!searchText.trim()) {
      setSearchResults([]);
      return;
    }

    clearTimeout(debounceTimeout.current);

    debounceTimeout.current = setTimeout(() => {
      handleSearch();
    }, 400);

    return () => clearTimeout(debounceTimeout.current);
  }, [searchText]);

  // Reset quand le modal se ferme
  useEffect(() => {
    if (!isOpen) {
      setSearchText("");
      setSearchResults([]);
    }
  }, [isOpen]);

  const handleSearch = async () => {
    if (!searchText.trim()) return;
    setIsLoading(true);
    try {
      const url = `${apiUrl}/api/oeuvres?filters[titre][$containsi]=${encodeURIComponent(searchText)}&populate=couverture&pagination[limit]=10`;
      const res = await fetch(url);
      const data = await res.json();
      if (data?.data) setSearchResults(data.data);
    } catch (error) {
      console.error("Erreur lors de la recherche :", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") handleSearch();
    if (e.key === "Escape") onClose();
  };

  const handleOeuvreClick = (oeuvre) => {
    const slug = slugify(oeuvre.titre);
    router.push(`/oeuvre/${oeuvre.documentId}-${slug}`);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 bg-black/95 z-[999] flex flex-col items-center pt-20 px-4"
          onClick={(e) => e.target === e.currentTarget && onClose()}
        >
          {/* Barre de recherche */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="w-full max-w-2xl"
          >
            <div className="relative">
              <svg 
                className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400"
                xmlns="http://www.w3.org/2000/svg" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                ref={inputRef}
                type="text"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Rechercher une œuvre..."
                className="w-full pl-12 pr-4 py-4 rounded-xl bg-gray-800 border border-gray-700 text-white text-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              {searchText && (
                <button
                  onClick={() => setSearchText("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  ✕
                </button>
              )}
            </div>
            <p className="text-gray-500 text-sm mt-2 text-center">
              Appuyez sur Échap pour fermer
            </p>
          </motion.div>

          {/* Résultats */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="mt-6 w-full max-w-2xl bg-gray-800/50 backdrop-blur rounded-xl overflow-hidden max-h-[60vh] overflow-y-auto"
          >
            {isLoading ? (
              <div className="p-8 text-center">
                <div className="inline-block w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-gray-400 mt-2">Recherche en cours...</p>
              </div>
            ) : searchResults.length > 0 ? (
              <ul>
                {searchResults.map((oeuvre, index) => (
                  <motion.li
                    key={oeuvre.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2, delay: index * 0.03 }}
                    className="border-b border-gray-700/50 last:border-0"
                  >
                    <button
                      onClick={() => handleOeuvreClick(oeuvre)}
                      className="w-full p-4 flex items-center gap-4 hover:bg-gray-700/50 transition text-left"
                    >
                      {oeuvre.couverture?.url ? (
                        <Image
                          src={oeuvre.couverture.url}
                          alt={oeuvre.titre || "Couverture"}
                          width={60}
                          height={80}
                          className="w-14 h-20 object-cover rounded-md flex-shrink-0"
                        />
                      ) : (
                        <div className="w-14 h-20 bg-gray-700 rounded-md flex items-center justify-center flex-shrink-0">
                          <span className="text-gray-500 text-xs">N/A</span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-white font-semibold truncate">{oeuvre.titre || "Sans titre"}</h3>
                        <p className="text-gray-400 text-sm truncate">
                          {oeuvre.auteur || "Auteur inconnu"}
                        </p>
                        {oeuvre.categorie && (
                          <span className="inline-block mt-1 text-xs bg-indigo-600/30 text-indigo-300 px-2 py-0.5 rounded">
                            {oeuvre.categorie}
                          </span>
                        )}
                      </div>
                      <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </motion.li>
                ))}
              </ul>
            ) : searchText.trim() ? (
              <div className="p-8 text-center">
                <p className="text-gray-400">Aucun résultat pour "{searchText}"</p>
              </div>
            ) : (
              <div className="p-8 text-center">
                <p className="text-gray-500">Commencez à taper pour rechercher</p>
              </div>
            )}
          </motion.div>

          {/* Bouton fermer */}
          <motion.button
            onClick={onClose}
            className="absolute top-4 right-4 bg-gray-800 hover:bg-gray-700 text-white p-3 rounded-full transition"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            whileHover={{ scale: 1.1 }}
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </motion.button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
