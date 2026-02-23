"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { slugify } from "@/utils/slugify";

const MIN_SEARCH_LENGTH = 2;

// RU1: Surligne le texte correspondant à la recherche
function HighlightText({ text, query }) {
  if (!query || query.length < MIN_SEARCH_LENGTH) return <>{text}</>;
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
  const parts = text.split(regex);
  return (
    <>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark key={i} className="bg-indigo-500/40 text-white rounded px-0.5">{part}</mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

export default function SearchModal({ isOpen, onClose }) {
  const [searchText, setSearchText] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [recentSearches, setRecentSearches] = useState([]);
  const [showAll, setShowAll] = useState(false);
  const router = useRouter();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const debounceTimeout = useRef(null);
  const inputRef = useRef(null);
  const resultRefs = useRef([]);

  // RF5: Charger les recherches récentes
  useEffect(() => {
    try {
      const saved = localStorage.getItem("novel-index-searches");
      if (saved) setRecentSearches(JSON.parse(saved).slice(0, 5));
    } catch {}
  }, []);

  // Focus l'input quand le modal s'ouvre
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // RF1: Recherche par titre ET auteur
  const handleSearch = useCallback(async () => {
    const trimmed = searchText.trim();
    if (!trimmed || trimmed.length < MIN_SEARCH_LENGTH) return;
    setIsLoading(true);
    setActiveIndex(-1);
    try {
      const encoded = encodeURIComponent(trimmed);
      const url = `${apiUrl}/api/oeuvres?filters[$or][0][titre][$containsi]=${encoded}&filters[$or][1][auteur][$containsi]=${encoded}&populate=couverture&pagination[limit]=20`;
      const res = await fetch(url);
      const data = await res.json();
      if (data?.data) setSearchResults(data.data);
    } catch (error) {
      console.error("Erreur lors de la recherche :", error);
    } finally {
      setIsLoading(false);
    }
  }, [searchText, apiUrl]);

  // RF2: Recherche avec debounce — minimum 2 caractères
  useEffect(() => {
    if (!searchText.trim() || searchText.trim().length < MIN_SEARCH_LENGTH) {
      setSearchResults([]);
      return;
    }

    clearTimeout(debounceTimeout.current);
    debounceTimeout.current = setTimeout(handleSearch, 400);

    return () => clearTimeout(debounceTimeout.current);
  }, [searchText, handleSearch]);

  // Reset quand le modal se ferme
  useEffect(() => {
    if (!isOpen) {
      setSearchText("");
      setSearchResults([]);
      setActiveIndex(-1);
      setShowAll(false);
    }
  }, [isOpen]);

  // RF5: Sauvegarder une recherche récente
  const saveRecentSearch = useCallback((text) => {
    try {
      const updated = [text, ...recentSearches.filter((s) => s !== text)].slice(0, 5);
      setRecentSearches(updated);
      localStorage.setItem("novel-index-searches", JSON.stringify(updated));
    } catch {}
  }, [recentSearches]);

  // RE1: Navigation clavier dans les résultats
  const handleKeyDown = (e) => {
    if (e.key === "Escape") { onClose(); return; }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => {
        const next = prev < searchResults.length - 1 ? prev + 1 : 0;
        resultRefs.current[next]?.scrollIntoView({ block: "nearest" });
        return next;
      });
      return;
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => {
        const next = prev > 0 ? prev - 1 : searchResults.length - 1;
        resultRefs.current[next]?.scrollIntoView({ block: "nearest" });
        return next;
      });
      return;
    }

    // RF4: Enter sélectionne le résultat actif au lieu de relancer la recherche
    if (e.key === "Enter") {
      if (activeIndex >= 0 && searchResults[activeIndex]) {
        handleOeuvreClick(searchResults[activeIndex]);
      }
      return;
    }
  };

  const handleOeuvreClick = (oeuvre) => {
    saveRecentSearch(searchText.trim());
    const slug = slugify(oeuvre.titre);
    router.push(`/oeuvre/${oeuvre.documentId}-${slug}`);
    onClose();
  };

  // RF3: Résultats visibles (10 par défaut, puis tous)
  const visibleResults = showAll ? searchResults : searchResults.slice(0, 10);
  const hasMore = searchResults.length > 10;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 bg-black/95 z-[999] flex flex-col items-center pt-12 sm:pt-20 px-4"
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
                onChange={(e) => { setSearchText(e.target.value); setShowAll(false); }}
                onKeyDown={handleKeyDown}
                placeholder="Rechercher une œuvre par titre ou auteur..."
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
              Flèches ↑↓ pour naviguer · Entrée pour ouvrir · Échap pour fermer
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
            ) : visibleResults.length > 0 ? (
              <>
                <ul role="listbox" aria-label="Résultats de recherche">
                  {visibleResults.map((oeuvre, index) => (
                    <motion.li
                      key={oeuvre.id}
                      ref={(el) => (resultRefs.current[index] = el)}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.2, delay: index * 0.03 }}
                      className="border-b border-gray-700/50 last:border-0"
                      role="option"
                      aria-selected={index === activeIndex}
                    >
                      <button
                        onClick={() => handleOeuvreClick(oeuvre)}
                        onMouseEnter={() => setActiveIndex(index)}
                        className={`w-full p-4 flex items-center gap-4 transition text-left ${
                          index === activeIndex
                            ? "bg-indigo-600/20 border-l-2 border-indigo-500"
                            : "hover:bg-gray-700/50 border-l-2 border-transparent"
                        }`}
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
                          <h3 className="text-white font-semibold truncate">
                            <HighlightText text={oeuvre.titre || "Sans titre"} query={searchText.trim()} />
                          </h3>
                          <p className="text-gray-400 text-sm truncate">
                            <HighlightText text={oeuvre.auteur || "Auteur inconnu"} query={searchText.trim()} />
                          </p>
                          {/* RE3: Toujours afficher un badge type/catégorie */}
                          <div className="flex gap-1.5 mt-1">
                            {oeuvre.type && (
                              <span className="text-xs bg-indigo-600/30 text-indigo-300 px-2 py-0.5 rounded">{oeuvre.type}</span>
                            )}
                            {oeuvre.categorie && (
                              <span className="text-xs bg-purple-600/30 text-purple-300 px-2 py-0.5 rounded">{oeuvre.categorie}</span>
                            )}
                            {!oeuvre.type && !oeuvre.categorie && (
                              <span className="text-xs bg-gray-600/30 text-gray-400 px-2 py-0.5 rounded">Œuvre</span>
                            )}
                          </div>
                        </div>
                        <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </motion.li>
                  ))}
                </ul>
                {hasMore && !showAll && (
                  <button
                    onClick={() => setShowAll(true)}
                    className="w-full p-3 text-center text-indigo-400 hover:text-indigo-300 hover:bg-gray-700/30 text-sm font-medium transition-colors"
                  >
                    Voir les {searchResults.length - 10} autres résultats
                  </button>
                )}
              </>
            ) : searchText.trim().length >= MIN_SEARCH_LENGTH ? (
              <div className="p-8 text-center">
                <p className="text-gray-400">Aucun résultat pour &quot;{searchText}&quot;</p>
                <p className="text-gray-500 text-sm mt-1">Essayez avec un titre ou un nom d&apos;auteur différent</p>
              </div>
            ) : searchText.trim().length > 0 ? (
              <div className="p-8 text-center">
                <p className="text-gray-500">Tapez au moins {MIN_SEARCH_LENGTH} caractères pour rechercher</p>
              </div>
            ) : recentSearches.length > 0 ? (
              <div className="p-4">
                <p className="text-gray-500 text-xs uppercase tracking-wide mb-3">Recherches récentes</p>
                <ul>
                  {recentSearches.map((text, i) => (
                    <li key={i}>
                      <button
                        onClick={() => setSearchText(text)}
                        className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-700/50 rounded-lg transition text-left text-gray-300 hover:text-white"
                      >
                        <svg className="w-4 h-4 text-gray-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-sm truncate">{text}</span>
                      </button>
                    </li>
                  ))}
                </ul>
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
