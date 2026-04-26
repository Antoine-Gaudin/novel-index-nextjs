"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiExternalLink, FiUser } from "react-icons/fi";

const SKIP_CONFIRM_KEY = "ni_skip_chapter_confirm";

const formatRelativeDate = (dateInput) => {
  if (!dateInput) return null;
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return null;
  const diffMs = Date.now() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return null;
  if (diffDays === 0) return "aujourd'hui";
  if (diffDays === 1) return "hier";
  if (diffDays < 7) return `il y a ${diffDays} j`;
  if (diffDays < 30) return `il y a ${Math.floor(diffDays / 7)} sem.`;
  if (diffDays < 365) return `il y a ${Math.floor(diffDays / 30)} mois`;
  const years = Math.floor(diffDays / 365);
  return `il y a ${years} an${years > 1 ? "s" : ""}`;
};

const formatAbsoluteDate = (dateInput) => {
  if (!dateInput) return null;
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
};

const mapItems = (raw) => {
  const today = new Date().toISOString().split("T")[0];
  return (raw || []).map((it) => ({
    id: it.id,
    titre: it.titre,
    url: it.url,
    tome: it.tome,
    publishedAt: it.publishedAt,
    order: it.order || 0,
    isNew: it.publishedAt && new Date(it.publishedAt).toISOString().split("T")[0] === today,
  }));
};

const AffiChapitre = ({ documentId, licence, totalChapitres, initialItems }) => {
  const itemsPerPage = 10;
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const seeded = Array.isArray(initialItems) ? mapItems(initialItems) : null;

  const [items, setItems] = useState(seeded || []);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedTerm, setDebouncedTerm] = useState("");
  const [error, setError] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageJump, setPageJump] = useState("");
  const [chapterJump, setChapterJump] = useState("");
  const [sortDesc, setSortDesc] = useState(true);
  const [skipConfirm, setSkipConfirm] = useState(false);
  const [jumpFlash, setJumpFlash] = useState(null);
  const [jumpError, setJumpError] = useState(null);
  const debounceRef = useRef(null);
  const listRef = useRef(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setSkipConfirm(window.localStorage.getItem(SKIP_CONFIRM_KEY) === "1");
    }
  }, []);

  useEffect(() => {
    if (seeded) return;
    if (!documentId) return;

    const fetchData = async () => {
      try {
        const url = licence
          ? `${apiUrl}/api/oeuvres?filters[documentId][$eq]=${documentId}&populate=achatlivres`
          : `${apiUrl}/api/oeuvres?filters[documentId][$eq]=${documentId}&populate=chapitres`;
        const res = await fetch(url);
        const data = await res.json();
        const oeuvre = data.data?.[0];
        if (!oeuvre) {
          setItems([]);
          return;
        }
        const raw = licence ? oeuvre.achatlivres : oeuvre.chapitres;
        setItems(mapItems(raw));
      } catch (err) {
        console.error("Erreur lors de la récupération des données :", err);
        setError("Impossible de charger les données.");
      }
    };

    fetchData();
  }, [documentId, licence, apiUrl, seeded]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedTerm(searchTerm.trim().toLowerCase());
      setCurrentPage(1);
    }, 250);
    return () => debounceRef.current && clearTimeout(debounceRef.current);
  }, [searchTerm]);

  const sortedItems = useMemo(() => {
    const arr = [...items];
    arr.sort((a, b) => (sortDesc ? b.order - a.order : a.order - b.order));
    return arr;
  }, [items, sortDesc]);

  const filteredItems = useMemo(() => {
    if (!debouncedTerm) return sortedItems;
    return sortedItems.filter(
      (item) =>
        (item.titre || "").toLowerCase().includes(debouncedTerm) ||
        String(item.order).includes(debouncedTerm)
    );
  }, [sortedItems, debouncedTerm]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / itemsPerPage));

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(1);
  }, [currentPage, totalPages]);

  const handleItemActivate = useCallback(
    (item, e) => {
      if (e && (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1)) return;
      if (skipConfirm) return;
      if (e) e.preventDefault();
      setSelectedItem(item);
    },
    [skipConfirm]
  );

  const closePopup = () => setSelectedItem(null);

  const toggleSkipConfirm = () => {
    const next = !skipConfirm;
    setSkipConfirm(next);
    if (typeof window !== "undefined") {
      if (next) window.localStorage.setItem(SKIP_CONFIRM_KEY, "1");
      else window.localStorage.removeItem(SKIP_CONFIRM_KEY);
    }
  };

  const renderPageNumbers = () => {
    const pages = [];
    const total = totalPages;
    if (total <= 7) {
      for (let i = 1; i <= total; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push("start-ellipsis");
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(total - 1, currentPage + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (currentPage < total - 2) pages.push("end-ellipsis");
      pages.push(total);
    }
    return pages.map((page, idx) =>
      typeof page === "string" ? (
        <span key={`ellipsis-${idx}`} className="px-2 text-white/20 text-sm self-center">
          …
        </span>
      ) : (
        <button
          key={`page-${page}`}
          className={`min-w-[34px] h-8 px-2 rounded-lg text-sm transition-colors ${
            currentPage === page
              ? "bg-indigo-500/25 border border-indigo-400/40 text-white font-semibold"
              : "bg-white/[0.03] border border-white/[0.06] text-white/60 hover:text-white hover:border-indigo-500/30"
          }`}
          onClick={() => setCurrentPage(page)}
          aria-current={currentPage === page ? "page" : undefined}
        >
          {page}
        </button>
      )
    );
  };

  const handlePageJump = () => {
    const pageNum = parseInt(pageJump, 10);
    if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
      setCurrentPage(pageNum);
    }
  };

  const handleChapterJump = () => {
    const chNum = parseInt(chapterJump, 10);
    if (isNaN(chNum)) {
      setJumpError("Num\u00e9ro invalide");
      return;
    }
    const idx = filteredItems.findIndex((it) => Number(it.order) === chNum);
    if (idx < 0) {
      setJumpError(`Chapitre ${chNum} introuvable`);
      setTimeout(() => setJumpError(null), 2500);
      return;
    }
    setJumpError(null);
    const targetPage = Math.floor(idx / itemsPerPage) + 1;
    setCurrentPage(targetPage);
    setJumpFlash(chNum);
    setTimeout(() => setJumpFlash(null), 1800);
    if (listRef.current && typeof window !== "undefined") {
      requestAnimationFrame(() =>
        listRef.current.scrollIntoView({ behavior: "smooth", block: "start" })
      );
    }
  };

  if (error) {
    return <p className="text-red-500">{error}</p>;
  }

  if (!filteredItems.length && !debouncedTerm) {
    return <p className="text-gray-400">Aucun résultat disponible pour cette œuvre.</p>;
  }

  return (
    <div className="space-y-4">
      <div className="sticky top-0 z-10 -mx-4 px-4 py-2.5 bg-gray-900/80 backdrop-blur-md border-b border-white/[0.04]">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Rechercher un chapitre (titre ou n°)…"
              aria-label="Rechercher un chapitre"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-gray-900/60 border border-white/[0.06] text-white text-sm placeholder-white/30 focus:outline-none focus:border-indigo-500/50 focus:bg-gray-900/80 transition-colors"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                aria-label="Effacer la recherche"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-white/30 hover:text-white px-2"
              >
                ✕
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={() => setSortDesc((s) => !s)}
            className="px-4 py-2 rounded-lg bg-gray-900/60 border border-white/[0.06] text-white/70 text-sm hover:text-white hover:border-indigo-500/30 transition-colors whitespace-nowrap"
            aria-label={`Trier ${sortDesc ? "du plus ancien au plus récent" : "du plus récent au plus ancien"}`}
          >
            {sortDesc ? "↓ Récents d'abord" : "↑ Anciens d'abord"}
          </button>
        </div>
        {debouncedTerm && (
          <p className="mt-2 text-[11px] text-white/40">
            {filteredItems.length} résultat{filteredItems.length > 1 ? "s" : ""} pour « {debouncedTerm} »
          </p>
        )}
      </div>

      {filteredItems.length === 0 && debouncedTerm ? (
        <p className="text-gray-400 text-center py-6">
          Aucun chapitre ne correspond à « {debouncedTerm} ».
        </p>
      ) : (
        <div ref={listRef} className="relative pl-5">
          <div className="absolute left-[7px] top-3 bottom-3 w-px bg-gradient-to-b from-indigo-500/30 via-indigo-500/10 to-transparent" />
          <ul className="space-y-1">
            {filteredItems
              .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
              .map((item, i) => {
                const relDate = formatRelativeDate(item.publishedAt);
                const absDate = formatAbsoluteDate(item.publishedAt);
                const flashed = jumpFlash !== null && Number(item.order) === jumpFlash;
                const dotClass = flashed
                  ? "bg-amber-300 shadow-[0_0_10px_rgba(252,211,77,0.7)]"
                  : i === 0 && currentPage === 1 && sortDesc
                  ? "bg-indigo-400 shadow-[0_0_8px_rgba(99,102,241,0.5)]"
                  : "bg-white/10 group-hover:bg-indigo-400 group-hover:shadow-[0_0_6px_rgba(99,102,241,0.3)]";
                return (
                  <li key={item.id}>
                    <a
                      href={item.url || "#"}
                      target="_blank"
                      rel="noopener nofollow"
                      onClick={(e) => handleItemActivate(item, e)}
                      className={`relative flex items-center gap-4 py-2.5 pl-4 -ml-5 rounded-lg group transition-all duration-200 no-underline text-inherit hover:bg-white/[0.03] focus:bg-white/[0.05] focus:outline-none ${
                        flashed ? "bg-amber-500/[0.08] ring-1 ring-amber-400/40" : ""
                      }`}
                    >
                      <div
                        className={`absolute left-[3px] w-[9px] h-[9px] rounded-full border-2 border-gray-900 transition-all duration-300 ${dotClass}`}
                      />
                      <span className="text-[11px] font-mono font-bold text-indigo-400/40 w-10 text-right flex-shrink-0 tabular-nums">
                        {item.order}
                      </span>
                      <div className="flex-1 min-w-0">
                        <span className="text-sm text-white/80 group-hover:text-white truncate block">
                          {item.titre || `Chapitre ${item.order}`}
                        </span>
                        <div className="flex flex-wrap items-center gap-2 mt-0.5">
                          {absDate && (
                            <span
                              className="text-[10px] text-white/30 group-hover:text-white/50"
                              title={absDate}
                            >
                              {absDate}
                            </span>
                          )}
                          {item.tome && (
                            <span className="text-[10px] text-blue-400/70">
                              {item.tome.toLowerCase().startsWith("tome") ? item.tome : `Tome ${item.tome}`}
                            </span>
                          )}
                          {item.isNew && (
                            <span className="text-[10px] bg-red-600/90 text-white px-1.5 py-0.5 rounded-full">
                              Nouveau
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0 opacity-60 group-hover:opacity-100 transition-opacity">
                        {relDate && (
                          <span className="text-[10px] text-white/30">{relDate}</span>
                        )}
                        <FiExternalLink className="text-[12px] text-white/30 group-hover:text-indigo-400 transition-colors" />
                      </div>
                    </a>
                  </li>
                );
              })}
          </ul>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex flex-wrap gap-1.5 justify-center mt-6">{renderPageNumbers()}</div>
      )}

      {filteredItems.length > itemsPerPage && (
        <div className="flex flex-col sm:flex-row items-center justify-center mt-4 gap-3 text-sm">
          <div className="flex items-center gap-2">
            <label htmlFor="ch-jump" className="text-white/50">
              Aller au chapitre :
            </label>
            <input
              id="ch-jump"
              type="number"
              placeholder="N°"
              className="w-24 px-3 py-1 rounded-lg bg-gray-900/60 border border-white/[0.06] text-white text-sm focus:outline-none focus:border-indigo-500/50"
              value={chapterJump}
              onChange={(e) => setChapterJump(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleChapterJump()}
              min={1}
            />
            <button
              onClick={handleChapterJump}
              className="px-3 py-1 rounded-lg bg-indigo-500/20 border border-indigo-500/30 text-indigo-200 hover:bg-indigo-500/30 hover:border-indigo-500/50 transition-colors"
            >
              Aller
            </button>
            {jumpError && (
              <span className="text-[11px] text-red-400" role="alert">{jumpError}</span>
            )}
          </div>
          <span className="hidden sm:inline text-white/10">|</span>
          <div className="flex items-center gap-2">
            <label htmlFor="pg-jump" className="text-white/40">
              Page :
            </label>
            <input
              id="pg-jump"
              type="number"
              placeholder="…"
              className="w-20 px-3 py-1 rounded-lg bg-gray-900/60 border border-white/[0.06] text-white text-sm focus:outline-none focus:border-indigo-500/50"
              value={pageJump}
              onChange={(e) => setPageJump(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handlePageJump()}
              min={1}
              max={totalPages}
            />
            <button
              onClick={handlePageJump}
              className="px-3 py-1 rounded-lg bg-white/[0.04] border border-white/[0.06] text-white/70 hover:text-white hover:bg-white/[0.07] transition-colors"
            >
              OK
            </button>
          </div>
        </div>
      )}

      <AnimatePresence>
        {selectedItem && (
          <motion.div
            className="fixed inset-0 z-50 bg-black bg-opacity-70 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closePopup}
          >
            <motion.div
              className="bg-gray-900 p-6 rounded-2xl shadow-2xl w-full max-w-md space-y-4 text-white"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-2xl font-bold mb-2">🚀 Confirmation</h2>
              <p className="text-gray-300">
                Vous êtes sur le point d'être redirigé vers le site du traducteur.
              </p>
              <p>
                <strong>Chapitre :</strong> {selectedItem.titre || `Chapitre ${selectedItem.order}`}
              </p>

              <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={skipConfirm}
                  onChange={toggleSkipConfirm}
                  className="accent-indigo-500"
                />
                Ne plus me demander
              </label>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition font-semibold"
                  onClick={closePopup}
                >
                  Annuler
                </button>
                <button
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition font-semibold"
                  onClick={() => {
                    window.open(selectedItem.url, "_blank", "noopener,noreferrer");
                    closePopup();
                  }}
                >
                  Continuer
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AffiChapitre;
