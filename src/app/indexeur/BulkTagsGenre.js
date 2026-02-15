"use client";

import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  ChevronDown,
  ChevronUp,
  X,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL;
const AUTHORIZED_EMAIL = "agaudin76@gmail.com";

const BulkTagsGenre = ({ user }) => {
  const [step, setStep] = useState(1);

  // Data
  const [oeuvres, setOeuvres] = useState([]);
  const [allTags, setAllTags] = useState([]);
  const [allGenres, setAllGenres] = useState([]);
  const [loading, setLoading] = useState(true);

  // Step 1 - Selection
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [searchOeuvre, setSearchOeuvre] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterMissing, setFilterMissing] = useState("");

  // Step 2 - Tags & Genres choice
  const [selectedTags, setSelectedTags] = useState([]);
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [searchTag, setSearchTag] = useState("");
  const [searchGenre, setSearchGenre] = useState("");

  // Step 4 - Execution
  const [executing, setExecuting] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, label: "" });

  // Step 5 - Results
  const [results, setResults] = useState({ success: [], errors: [] });

  // Expanded preview
  const [previewExpanded, setPreviewExpanded] = useState(false);

  const jwt =
    typeof window !== "undefined" ? localStorage.getItem("jwt") : null;

  const isAuthorized = user?.email === AUTHORIZED_EMAIL;

  // Load all data on mount
  useEffect(() => {
    if (!isAuthorized) return;
    const fetchAll = async () => {
      setLoading(true);
      try {
        // Fetch oeuvres with pagination (Strapi max 100 per page)
        let allOeuvres = [];
        let page = 1;
        let hasMore = true;
        while (hasMore) {
          const res = await axios.get(
            `${API}/api/oeuvres?populate[0]=tags&populate[1]=genres&pagination[page]=${page}&pagination[pageSize]=100&sort=titre:asc`,
            { headers: { Authorization: `Bearer ${jwt}` } }
          );
          const data = res.data.data || [];
          allOeuvres = [...allOeuvres, ...data];
          const pagination = res.data.meta?.pagination;
          hasMore = pagination && page < pagination.pageCount;
          page++;
        }
        setOeuvres(allOeuvres);

        // Fetch all tags
        let allTagsData = [];
        page = 1;
        hasMore = true;
        while (hasMore) {
          const res = await axios.get(
            `${API}/api/tags?pagination[page]=${page}&pagination[pageSize]=100&sort=titre:asc`,
            { headers: { Authorization: `Bearer ${jwt}` } }
          );
          allTagsData = [...allTagsData, ...res.data.data];
          const pagination = res.data.meta?.pagination;
          hasMore = pagination && page < pagination.pageCount;
          page++;
        }
        setAllTags(allTagsData);

        // Fetch all genres
        let allGenresData = [];
        page = 1;
        hasMore = true;
        while (hasMore) {
          const res = await axios.get(
            `${API}/api/genres?pagination[page]=${page}&pagination[pageSize]=100&sort=titre:asc`,
            { headers: { Authorization: `Bearer ${jwt}` } }
          );
          allGenresData = [...allGenresData, ...res.data.data];
          const pagination = res.data.meta?.pagination;
          hasMore = pagination && page < pagination.pageCount;
          page++;
        }
        setAllGenres(allGenresData);
      } catch (err) {
        console.error("Erreur chargement des donnees:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [jwt, isAuthorized]);

  // Filtered oeuvres
  const filteredOeuvres = useMemo(() => {
    return oeuvres.filter((o) => {
      // Search filter
      if (
        searchOeuvre &&
        !o.titre?.toLowerCase().includes(searchOeuvre.toLowerCase())
      )
        return false;

      // Type filter
      if (filterType && o.type !== filterType) return false;

      // Missing filter
      if (filterMissing === "no_tags" && (o.tags?.length || 0) > 0)
        return false;
      if (filterMissing === "no_genres" && (o.genres?.length || 0) > 0)
        return false;
      if (
        filterMissing === "no_both" &&
        ((o.tags?.length || 0) > 0 || (o.genres?.length || 0) > 0)
      )
        return false;

      return true;
    });
  }, [oeuvres, searchOeuvre, filterType, filterMissing]);

  // Unique types
  const oeuvreTypes = useMemo(() => {
    const types = new Set(oeuvres.map((o) => o.type).filter(Boolean));
    return [...types].sort();
  }, [oeuvres]);

  // Handlers
  const toggleOeuvre = (docId) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(docId)) next.delete(docId);
      else next.add(docId);
      return next;
    });
  };

  const selectAllFiltered = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      filteredOeuvres.forEach((o) => next.add(o.documentId));
      return next;
    });
  };

  const deselectAllFiltered = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      filteredOeuvres.forEach((o) => next.delete(o.documentId));
      return next;
    });
  };

  const toggleTag = (tag) => {
    setSelectedTags((prev) =>
      prev.find((t) => t.documentId === tag.documentId)
        ? prev.filter((t) => t.documentId !== tag.documentId)
        : [...prev, tag]
    );
  };

  const toggleGenre = (genre) => {
    setSelectedGenres((prev) =>
      prev.find((g) => g.documentId === genre.documentId)
        ? prev.filter((g) => g.documentId !== genre.documentId)
        : [...prev, genre]
    );
  };

  // Filtered tags/genres for search
  const filteredTags = useMemo(() => {
    if (!searchTag) return allTags;
    return allTags.filter((t) =>
      t.titre?.toLowerCase().includes(searchTag.toLowerCase())
    );
  }, [allTags, searchTag]);

  const filteredGenres = useMemo(() => {
    if (!searchGenre) return allGenres;
    return allGenres.filter((g) =>
      g.titre?.toLowerCase().includes(searchGenre.toLowerCase())
    );
  }, [allGenres, searchGenre]);

  // Execution
  const totalApiCalls = (selectedTags.length + selectedGenres.length) * 2;

  const executeAssignment = async () => {
    setExecuting(true);
    const allItems = [
      ...selectedTags.map((t) => ({ ...t, kind: "tag" })),
      ...selectedGenres.map((g) => ({ ...g, kind: "genre" })),
    ];
    const total = allItems.length;
    const successList = [];
    const errorList = [];

    for (let i = 0; i < allItems.length; i++) {
      const item = allItems[i];
      const endpoint = item.kind === "tag" ? "tags" : "genres";
      const label = `Attribution de "${item.titre}" (${item.kind}) a ${selectedIds.size} oeuvres...`;
      setProgress({ current: i + 1, total, label });

      try {
        // GET current oeuvres for this tag/genre
        const res = await axios.get(
          `${API}/api/${endpoint}/${item.documentId}?populate[oeuvres][fields][0]=documentId`,
          { headers: { Authorization: `Bearer ${jwt}` } }
        );

        const existingIds = (res.data.data?.oeuvres || []).map(
          (o) => o.documentId
        );
        const mergedIds = [...new Set([...existingIds, ...selectedIds])];

        // PUT merged oeuvres
        await axios.put(
          `${API}/api/${endpoint}/${item.documentId}`,
          { data: { oeuvres: mergedIds } },
          { headers: { Authorization: `Bearer ${jwt}` } }
        );

        successList.push(
          `${item.titre} (${item.kind}) - assigne a ${selectedIds.size} oeuvres`
        );
      } catch (err) {
        console.error(`Erreur pour ${item.titre}:`, err);
        errorList.push(
          `${item.titre} (${item.kind}) - ${err.response?.data?.error?.message || err.message}`
        );
      }

      // Rate limiting delay
      if (i < allItems.length - 1) {
        await new Promise((r) => setTimeout(r, 300));
      }
    }

    setResults({ success: successList, errors: errorList });
    setExecuting(false);
    setStep(5);
  };

  const resetAll = () => {
    setStep(1);
    setSelectedIds(new Set());
    setSelectedTags([]);
    setSelectedGenres([]);
    setSearchOeuvre("");
    setSearchTag("");
    setSearchGenre("");
    setFilterType("");
    setFilterMissing("");
    setProgress({ current: 0, total: 0, label: "" });
    setResults({ success: [], errors: [] });
    setPreviewExpanded(false);
  };

  const selectedOeuvresList = oeuvres.filter((o) =>
    selectedIds.has(o.documentId)
  );

  // Authorization check (after all hooks)
  if (!isAuthorized) {
    return (
      <div className="text-center py-16">
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Acces refuse</h2>
        <p className="text-gray-400">
          Cet outil est reserve a l&apos;administrateur.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="text-center py-16">
        <div className="animate-spin w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-gray-400">Chargement des donnees...</p>
      </div>
    );
  }

  // Step indicators
  const steps = [
    "Selection",
    "Tags & Genres",
    "Apercu",
    "Execution",
    "Resultats",
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      {/* Step indicator */}
      <div className="flex items-center justify-center gap-2 mb-8">
        {steps.map((s, i) => (
          <div key={i} className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                step === i + 1
                  ? "bg-indigo-600 text-white"
                  : step > i + 1
                    ? "bg-green-600 text-white"
                    : "bg-gray-700 text-gray-400"
              }`}
            >
              {step > i + 1 ? "\u2713" : i + 1}
            </div>
            <span
              className={`text-sm hidden sm:inline ${step === i + 1 ? "text-white font-medium" : "text-gray-500"}`}
            >
              {s}
            </span>
            {i < steps.length - 1 && (
              <div className="w-8 h-px bg-gray-600 hidden sm:block" />
            )}
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* STEP 1: Selection des oeuvres */}
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            <h2 className="text-xl font-bold text-white mb-4">
              Selectionner les oeuvres
            </h2>

            {/* Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchOeuvre}
                  onChange={(e) => setSearchOeuvre(e.target.value)}
                  placeholder="Rechercher par titre..."
                  className="w-full pl-10 pr-3 py-2.5 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm"
                />
              </div>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3 py-2.5 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm"
              >
                <option value="">Tous les types</option>
                {oeuvreTypes.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              <select
                value={filterMissing}
                onChange={(e) => setFilterMissing(e.target.value)}
                className="px-3 py-2.5 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm"
              >
                <option value="">Tous</option>
                <option value="no_tags">Sans tags</option>
                <option value="no_genres">Sans genres</option>
                <option value="no_both">Sans les deux</option>
              </select>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-400">
                {filteredOeuvres.length} oeuvres affichees - {selectedIds.size}{" "}
                selectionnees
              </span>
              <div className="flex gap-2">
                <button
                  onClick={selectAllFiltered}
                  className="px-3 py-1.5 text-xs bg-gray-700 hover:bg-gray-600 rounded-lg text-white transition"
                >
                  Tout selectionner
                </button>
                <button
                  onClick={deselectAllFiltered}
                  className="px-3 py-1.5 text-xs bg-gray-700 hover:bg-gray-600 rounded-lg text-white transition"
                >
                  Tout deselectionner
                </button>
              </div>
            </div>

            {/* List */}
            <div className="max-h-[450px] overflow-y-auto border border-gray-700 rounded-lg">
              {filteredOeuvres.map((o) => (
                <label
                  key={o.documentId}
                  className={`flex items-center gap-3 px-4 py-3 border-b border-gray-700/50 cursor-pointer hover:bg-gray-800/50 transition ${
                    selectedIds.has(o.documentId) ? "bg-gray-800" : ""
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedIds.has(o.documentId)}
                    onChange={() => toggleOeuvre(o.documentId)}
                    className="accent-indigo-600 w-4 h-4"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm truncate">{o.titre}</p>
                    <p className="text-xs text-gray-500">{o.type || "N/A"}</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        (o.tags?.length || 0) === 0
                          ? "bg-red-900/50 text-red-400"
                          : "bg-gray-700 text-gray-300"
                      }`}
                    >
                      {o.tags?.length || 0} tags
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        (o.genres?.length || 0) === 0
                          ? "bg-red-900/50 text-red-400"
                          : "bg-gray-700 text-gray-300"
                      }`}
                    >
                      {o.genres?.length || 0} genres
                    </span>
                  </div>
                </label>
              ))}
            </div>

            {/* Next */}
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setStep(2)}
                disabled={selectedIds.size === 0}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg text-white font-medium transition"
              >
                Suivant ({selectedIds.size} oeuvres)
              </button>
            </div>
          </motion.div>
        )}

        {/* STEP 2: Choix Tags & Genres */}
        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            <h2 className="text-xl font-bold text-white mb-1">
              Choisir les Tags & Genres
            </h2>
            <p className="text-sm text-gray-400 mb-6">
              {selectedIds.size} oeuvres selectionnees
            </p>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Tags */}
              <div className="bg-gray-800 rounded-lg p-4">
                <h3 className="text-white font-semibold mb-3">Tags</h3>

                {/* Selected tags */}
                {selectedTags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {selectedTags.map((t) => (
                      <span
                        key={t.documentId}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-indigo-600 text-white"
                      >
                        {t.titre}
                        <button onClick={() => toggleTag(t)}>
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {/* Search */}
                <div className="relative mb-3">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchTag}
                    onChange={(e) => setSearchTag(e.target.value)}
                    placeholder="Rechercher un tag..."
                    className="w-full pl-10 pr-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white text-sm"
                  />
                </div>

                {/* Tag pills */}
                <div className="max-h-[250px] overflow-y-auto flex flex-wrap gap-2">
                  {filteredTags.map((t) => {
                    const isSelected = selectedTags.some(
                      (s) => s.documentId === t.documentId
                    );
                    return (
                      <button
                        key={t.documentId}
                        onClick={() => toggleTag(t)}
                        className={`px-3 py-1 rounded-full text-sm transition ${
                          isSelected
                            ? "bg-indigo-600 text-white"
                            : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                        }`}
                      >
                        {t.titre}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Genres */}
              <div className="bg-gray-800 rounded-lg p-4">
                <h3 className="text-white font-semibold mb-3">Genres</h3>

                {/* Selected genres */}
                {selectedGenres.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {selectedGenres.map((g) => (
                      <span
                        key={g.documentId}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-indigo-600 text-white"
                      >
                        {g.titre}
                        <button onClick={() => toggleGenre(g)}>
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {/* Search */}
                <div className="relative mb-3">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchGenre}
                    onChange={(e) => setSearchGenre(e.target.value)}
                    placeholder="Rechercher un genre..."
                    className="w-full pl-10 pr-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white text-sm"
                  />
                </div>

                {/* Genre pills */}
                <div className="max-h-[250px] overflow-y-auto flex flex-wrap gap-2">
                  {filteredGenres.map((g) => {
                    const isSelected = selectedGenres.some(
                      (s) => s.documentId === g.documentId
                    );
                    return (
                      <button
                        key={g.documentId}
                        onClick={() => toggleGenre(g)}
                        className={`px-3 py-1 rounded-full text-sm transition ${
                          isSelected
                            ? "bg-indigo-600 text-white"
                            : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                        }`}
                      >
                        {g.titre}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Navigation */}
            <div className="mt-6 flex justify-between">
              <button
                onClick={() => setStep(1)}
                className="px-5 py-2.5 bg-gray-700 hover:bg-gray-600 rounded-lg text-white transition"
              >
                Retour
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={
                  selectedTags.length === 0 && selectedGenres.length === 0
                }
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg text-white font-medium transition"
              >
                Suivant ({selectedTags.length} tags, {selectedGenres.length}{" "}
                genres)
              </button>
            </div>
          </motion.div>
        )}

        {/* STEP 3: Apercu */}
        {step === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            <h2 className="text-xl font-bold text-white mb-4">
              Apercu de l&apos;assignation
            </h2>

            <div className="bg-gray-800 rounded-lg p-6 space-y-4">
              {/* Summary */}
              <div className="text-center">
                <p className="text-lg text-white">
                  <span className="font-bold text-indigo-400">
                    {selectedTags.length} tags
                  </span>{" "}
                  +{" "}
                  <span className="font-bold text-indigo-400">
                    {selectedGenres.length} genres
                  </span>{" "}
                  &rarr;{" "}
                  <span className="font-bold text-indigo-400">
                    {selectedIds.size} oeuvres
                  </span>
                </p>
                <p className="text-sm text-gray-400 mt-1">
                  {totalApiCalls} appels API necessaires
                </p>
              </div>

              {/* Tags & Genres chosen */}
              <div className="grid md:grid-cols-2 gap-4">
                {selectedTags.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-400 mb-2">
                      Tags a assigner
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedTags.map((t) => (
                        <span
                          key={t.documentId}
                          className="px-3 py-1 rounded-full text-sm bg-indigo-600/30 text-indigo-300"
                        >
                          {t.titre}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {selectedGenres.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-400 mb-2">
                      Genres a assigner
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedGenres.map((g) => (
                        <span
                          key={g.documentId}
                          className="px-3 py-1 rounded-full text-sm bg-indigo-600/30 text-indigo-300"
                        >
                          {g.titre}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Oeuvres list */}
              <div>
                <button
                  onClick={() => setPreviewExpanded(!previewExpanded)}
                  className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition"
                >
                  {previewExpanded ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                  {selectedOeuvresList.length} oeuvres concernees
                </button>
                {(previewExpanded || selectedOeuvresList.length <= 10) && (
                  <ul className="mt-2 space-y-1 max-h-[300px] overflow-y-auto">
                    {selectedOeuvresList.map((o) => (
                      <li
                        key={o.documentId}
                        className="text-sm text-gray-300 px-3 py-1.5 bg-gray-900/50 rounded"
                      >
                        {o.titre}{" "}
                        <span className="text-gray-500">
                          ({o.type || "N/A"})
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* Navigation */}
            <div className="mt-6 flex justify-between">
              <button
                onClick={() => setStep(2)}
                className="px-5 py-2.5 bg-gray-700 hover:bg-gray-600 rounded-lg text-white transition"
              >
                Retour
              </button>
              <button
                onClick={() => {
                  setStep(4);
                  executeAssignment();
                }}
                className="px-6 py-2.5 bg-green-600 hover:bg-green-700 rounded-lg text-white font-medium transition"
              >
                Executer l&apos;assignation
              </button>
            </div>
          </motion.div>
        )}

        {/* STEP 4: Execution */}
        {step === 4 && (
          <motion.div
            key="step4"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            <h2 className="text-xl font-bold text-white mb-6">
              Assignation en cours...
            </h2>

            <div className="bg-gray-800 rounded-lg p-6">
              {/* Progress bar */}
              <div className="w-full bg-gray-700 rounded-full h-4 mb-4 overflow-hidden">
                <div
                  className="bg-indigo-600 h-4 rounded-full transition-all duration-300"
                  style={{
                    width: `${progress.total > 0 ? (progress.current / progress.total) * 100 : 0}%`,
                  }}
                />
              </div>

              <p className="text-sm text-gray-300 mb-2">{progress.label}</p>
              <p className="text-sm text-gray-500">
                ({progress.current}/{progress.total})
              </p>
            </div>
          </motion.div>
        )}

        {/* STEP 5: Resultats */}
        {step === 5 && (
          <motion.div
            key="step5"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            <h2 className="text-xl font-bold text-white mb-6">Resultats</h2>

            <div className="bg-gray-800 rounded-lg p-6 space-y-6">
              {/* Counters */}
              <div className="flex gap-6 justify-center">
                <div className="text-center">
                  <p className="text-3xl font-bold text-green-400">
                    {results.success.length}
                  </p>
                  <p className="text-sm text-gray-400">Succes</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-red-400">
                    {results.errors.length}
                  </p>
                  <p className="text-sm text-gray-400">Erreurs</p>
                </div>
              </div>

              {/* Success list */}
              {results.success.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-green-400 mb-2 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" /> Assignations reussies
                  </h4>
                  <ul className="space-y-1">
                    {results.success.map((s, i) => (
                      <li
                        key={i}
                        className="text-sm text-gray-300 px-3 py-1.5 bg-gray-900/50 rounded"
                      >
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Error list */}
              {results.errors.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-red-400 mb-2 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" /> Erreurs
                  </h4>
                  <ul className="space-y-1">
                    {results.errors.map((e, i) => (
                      <li
                        key={i}
                        className="text-sm text-red-300 px-3 py-1.5 bg-red-900/20 rounded"
                      >
                        {e}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Reset */}
            <div className="mt-6 flex justify-center">
              <button
                onClick={resetAll}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-white font-medium transition"
              >
                Nouvelle assignation
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BulkTagsGenre;
