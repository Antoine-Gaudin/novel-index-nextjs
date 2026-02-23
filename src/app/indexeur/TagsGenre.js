"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import axios from "axios";
import {
  Tag, BookOpen, Plus, Search, X, Loader2, CheckCircle,
  AlertCircle, Info, Copy, Check, ChevronDown, ChevronUp,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const API = process.env.NEXT_PUBLIC_API_URL;

const TagsGenre = ({ user }) => {
  // Left panel
  const [searchTerm, setSearchTerm] = useState("");
  const [allOeuvres, setAllOeuvres] = useState([]);
  const [loadingInitial, setLoadingInitial] = useState(true);

  // Selection
  const [selectedOeuvre, setSelectedOeuvre] = useState(null);
  const [loadingSelect, setLoadingSelect] = useState(false);

  // Tags / Genres
  const [tags, setTags] = useState([]);
  const [genres, setGenres] = useState([]);

  // Unified search
  const [searchType, setSearchType] = useState("tags");
  const [tagGenreSearch, setTagGenreSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchingTG, setSearchingTG] = useState(false);
  const [addingId, setAddingId] = useState(null);
  const debounceRef = useRef(null);

  // Create form
  const [showCreate, setShowCreate] = useState(false);
  const [createType, setCreateType] = useState("Tag");
  const [createName, setCreateName] = useState("");
  const [createDesc, setCreateDesc] = useState("");
  const [loadingCreate, setLoadingCreate] = useState(false);

  // Messages & UI
  const [message, setMessage] = useState(null);
  const [copied, setCopied] = useState(false);

  // Undo
  const [undoAction, setUndoAction] = useState(null);
  const undoTimeoutRef = useRef(null);

  const { jwt } = useAuth();

  const showMessage = useCallback((text, type = "info") => {
    setMessage({ text, type });
  }, []);

  // Debounced tag/genre search
  const fetchTGResults = useCallback(
    async (term) => {
      if (!jwt || term.length < 2) {
        setSearchResults([]);
        return;
      }
      setSearchingTG(true);
      try {
        const endpoint = searchType === "tags" ? "tags" : "genres";
        const res = await axios.get(
          `${API}/api/${endpoint}?filters[titre][$containsi]=${encodeURIComponent(term)}&populate=oeuvres`,
          { headers: { Authorization: `Bearer ${jwt}` } }
        );
        const linked = searchType === "tags" ? tags : genres;
        const filtered = (res.data.data || []).filter(
          (item) => !linked.find((a) => a.documentId === item.documentId)
        );
        setSearchResults(filtered);
      } catch (err) {
        console.error("Erreur recherche tag/genre :", err);
      } finally {
        setSearchingTG(false);
      }
    },
    [jwt, searchType, tags, genres]
  );

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (tagGenreSearch.length < 2) {
      setSearchResults([]);
      return;
    }
    debounceRef.current = setTimeout(() => fetchTGResults(tagGenreSearch), 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [tagGenreSearch, fetchTGResults]);

  // Charger toutes les œuvres au montage
  useEffect(() => {
    const loadAll = async () => {
      if (!jwt) { setLoadingInitial(false); return; }
      try {
        let page = 1;
        let all = [];
        let hasMore = true;
        while (hasMore) {
          const res = await axios.get(
            `${API}/api/oeuvres?populate[0]=couverture&populate[1]=tags&populate[2]=genres&pagination[page]=${page}&pagination[pageSize]=100&sort=titre:asc`,
            { headers: { Authorization: `Bearer ${jwt}` } }
          );
          const data = res.data.data || [];
          all = [...all, ...data];
          const pagination = res.data.meta?.pagination;
          hasMore = pagination && page < pagination.pageCount;
          page++;
        }
        setAllOeuvres(all);
      } catch (err) {
        console.error("Erreur chargement œuvres :", err);
        showMessage("Erreur lors du chargement des œuvres.", "error");
      } finally {
        setLoadingInitial(false);
      }
    };
    loadAll();
  }, [jwt, showMessage]);

  // Cleanup undo timeout on unmount
  useEffect(() => {
    return () => {
      if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
    };
  }, []);

  // Filtrage local
  const filteredOeuvres = allOeuvres.filter((o) =>
    o.titre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ── Auth guard (after all hooks) ──
  if (!user) {
    return (
      <div className="text-center py-16">
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Accès refusé</h2>
        <p className="text-gray-400">
          Vous devez être connecté pour accéder à cette fonctionnalité.
        </p>
      </div>
    );
  }

  // ── Helpers ──
  const updateBadge = (docId, field, delta) => {
    setAllOeuvres((prev) =>
      prev.map((o) => {
        if (o.documentId !== docId) return o;
        const arr = o[field] || [];
        return {
          ...o,
          [field]:
            delta > 0
              ? [...arr, {}]
              : arr.slice(0, Math.max(0, arr.length - 1)),
        };
      })
    );
  };

  const executeRemoval = async (itemType, item, oeuvreDocId) => {
    try {
      const ep = itemType === "tag" ? "tags" : "genres";
      const res = await axios.get(
        `${API}/api/${ep}/${item.documentId}?populate[oeuvres][fields][0]=documentId`,
        { headers: { Authorization: `Bearer ${jwt}` } }
      );
      const ids = (res.data.data?.oeuvres || [])
        .filter((o) => o.documentId !== oeuvreDocId)
        .map((o) => o.documentId);
      await axios.put(
        `${API}/api/${ep}/${item.documentId}`,
        { data: { oeuvres: ids } },
        { headers: { Authorization: `Bearer ${jwt}` } }
      );
    } catch (err) {
      console.error("Erreur suppression :", err);
    }
  };

  const commitPendingUndo = () => {
    if (!undoAction) return;
    clearTimeout(undoAction.timeoutId);
    executeRemoval(undoAction.itemType, undoAction.item, undoAction.oeuvreDocId);
    setUndoAction(null);
  };

  // ── Actions ──
  const handleSelectOeuvre = async (oeuvre) => {
    commitPendingUndo();
    setSelectedOeuvre(oeuvre);
    setMessage(null);
    setLoadingSelect(true);
    setTagGenreSearch("");
    setSearchResults([]);
    try {
      const res = await axios.get(
        `${API}/api/oeuvres/${oeuvre.documentId}?populate[0]=tags&populate[1]=genres`,
        { headers: { Authorization: `Bearer ${jwt}` } }
      );
      setTags(res.data.data?.tags ?? []);
      setGenres(res.data.data?.genres ?? []);
    } catch (err) {
      console.error("Erreur chargement :", err);
      showMessage("Erreur lors du chargement.", "error");
    } finally {
      setLoadingSelect(false);
    }
  };

  const handleCopyTitle = async () => {
    if (!selectedOeuvre) return;
    try {
      await navigator.clipboard.writeText(selectedOeuvre.titre);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showMessage("Impossible de copier.", "error");
    }
  };

  const handleDirectAdd = async (item) => {
    if (addingId) return;
    setAddingId(item.documentId);
    try {
      const ep = searchType === "tags" ? "tags" : "genres";
      const ids = [
        ...new Set([
          ...(item.oeuvres?.map((o) => o.documentId) || []),
          selectedOeuvre.documentId,
        ]),
      ];
      await axios.put(
        `${API}/api/${ep}/${item.documentId}`,
        { data: { oeuvres: ids } },
        { headers: { Authorization: `Bearer ${jwt}` } }
      );
      if (searchType === "tags") {
        setTags((prev) => [...prev, item]);
        updateBadge(selectedOeuvre.documentId, "tags", 1);
      } else {
        setGenres((prev) => [...prev, item]);
        updateBadge(selectedOeuvre.documentId, "genres", 1);
      }
      setSearchResults((prev) =>
        prev.filter((r) => r.documentId !== item.documentId)
      );
      showMessage(
        `${searchType === "tags" ? "Tag" : "Genre"} ajouté.`,
        "success"
      );
    } catch (err) {
      console.error("Erreur ajout :", err);
      showMessage("Erreur lors de l'ajout.", "error");
    } finally {
      setAddingId(null);
    }
  };

  const handleRemove = (itemType, item) => {
    commitPendingUndo();
    const oeuvreDocId = selectedOeuvre.documentId;
    const field = itemType === "tag" ? "tags" : "genres";

    if (itemType === "tag")
      setTags((prev) => prev.filter((t) => t.documentId !== item.documentId));
    else
      setGenres((prev) =>
        prev.filter((g) => g.documentId !== item.documentId)
      );
    updateBadge(oeuvreDocId, field, -1);

    const timeoutId = setTimeout(() => {
      executeRemoval(itemType, item, oeuvreDocId);
      setUndoAction(null);
    }, 5000);
    undoTimeoutRef.current = timeoutId;
    setUndoAction({ itemType, item, timeoutId, oeuvreDocId });
  };

  const handleUndo = () => {
    if (!undoAction) return;
    clearTimeout(undoAction.timeoutId);
    const field = undoAction.itemType === "tag" ? "tags" : "genres";
    if (undoAction.itemType === "tag")
      setTags((prev) => [...prev, undoAction.item]);
    else setGenres((prev) => [...prev, undoAction.item]);
    updateBadge(undoAction.oeuvreDocId, field, 1);
    setUndoAction(null);
  };

  const handleCreate = async () => {
    if (!createName.trim() || loadingCreate) return;
    if (createDesc.trim().length < 50) {
      showMessage(
        "La description doit contenir au moins 50 caractères.",
        "error"
      );
      return;
    }
    const ep = createType === "Tag" ? "tags" : "genres";
    setLoadingCreate(true);
    try {
      const check = await axios.get(
        `${API}/api/${ep}?filters[titre][$eqi]=${encodeURIComponent(createName.trim())}`,
        { headers: { Authorization: `Bearer ${jwt}` } }
      );
      if ((check.data.data || []).length > 0) {
        showMessage(`Ce ${createType.toLowerCase()} existe déjà.`, "error");
        setLoadingCreate(false);
        return;
      }
      const res = await axios.post(
        `${API}/api/${ep}`,
        {
          data: {
            titre: createName.trim(),
            description: createDesc.trim(),
            oeuvres: [selectedOeuvre.documentId],
          },
        },
        { headers: { Authorization: `Bearer ${jwt}` } }
      );
      if (createType === "Tag") {
        setTags((prev) => [...prev, res.data.data]);
        updateBadge(selectedOeuvre.documentId, "tags", 1);
      } else {
        setGenres((prev) => [...prev, res.data.data]);
        updateBadge(selectedOeuvre.documentId, "genres", 1);
      }
      setCreateName("");
      setCreateDesc("");
      showMessage(`${createType} créé et ajouté.`, "success");
    } catch (err) {
      console.error("Erreur création :", err);
      showMessage("Erreur lors de la création.", "error");
    } finally {
      setLoadingCreate(false);
    }
  };

  // ── Message banner ──
  const MessageBanner = () => {
    if (!message) return null;
    const s = {
      success: "bg-green-900/30 border-green-600 text-green-400",
      error: "bg-red-900/30 border-red-600 text-red-400",
      info: "bg-blue-900/30 border-blue-600 text-blue-400",
    };
    const ic = {
      success: <CheckCircle className="w-4 h-4 shrink-0" />,
      error: <AlertCircle className="w-4 h-4 shrink-0" />,
      info: <Info className="w-4 h-4 shrink-0" />,
    };
    return (
      <div
        className={`flex items-center gap-2 px-4 py-3 rounded-lg border ${s[message.type]}`}
      >
        {ic[message.type]}
        <span className="text-sm">{message.text}</span>
        <button
          onClick={() => setMessage(null)}
          className="ml-auto hover:opacity-70"
          aria-label="Fermer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  };

  // ── Render ──
  return (
    <div className="w-full px-4 py-6">
      <h1 className="text-2xl font-bold mb-6 text-center text-white flex items-center justify-center gap-3">
        <Tag className="w-7 h-7 text-indigo-400" />
        Gestion des Tags &amp; Genres
      </h1>

      <div className="flex flex-col xl:flex-row gap-6">
        {/* ===== LEFT: Grille des œuvres ===== */}
        <div className="xl:w-1/2 shrink-0 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filtrer les œuvres..."
              className="w-full p-2.5 pl-9 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {loadingInitial ? (
            <div className="text-center py-8">
              <Loader2 className="w-6 h-6 text-indigo-500 animate-spin mx-auto mb-2" />
              <p className="text-xs text-gray-500">Chargement des œuvres...</p>
            </div>
          ) : (
          <div>
            <p className="text-[11px] text-gray-500 px-1 mb-2">
              {filteredOeuvres.length} / {allOeuvres.length} œuvres
            </p>
            {filteredOeuvres.length === 0 && searchTerm && (
              <p className="text-xs text-gray-500 text-center py-4">
                Aucune œuvre trouvée.
              </p>
            )}
            <div className="xl:max-h-[calc(100vh-260px)] overflow-y-auto pr-1">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-3 2xl:grid-cols-4 gap-3">
                {filteredOeuvres.map((o) => (
                  <button
                    key={o.documentId}
                    onClick={() => handleSelectOeuvre(o)}
                    className={`text-left p-2 rounded-lg transition flex flex-col items-center ${
                      selectedOeuvre?.documentId === o.documentId
                        ? "bg-indigo-600/20 border-2 border-indigo-500 ring-2 ring-indigo-500/30"
                        : "bg-gray-800 hover:bg-gray-700 border-2 border-transparent"
                    }`}
                  >
                    {o.couverture?.url ? (
                      <img
                        src={o.couverture.url}
                        alt=""
                        className="w-full aspect-[2/3] object-cover rounded mb-2"
                      />
                    ) : (
                      <div className="w-full aspect-[2/3] bg-gray-700 rounded mb-2 flex items-center justify-center text-gray-500 text-xs">
                        No Cover
                      </div>
                    )}
                    <p className="text-xs font-medium text-white text-center line-clamp-2 leading-tight w-full">
                      {o.titre}
                    </p>
                    <div className="flex gap-1 mt-1.5 flex-wrap justify-center">
                      <span className="text-[9px] px-1.5 py-0.5 bg-indigo-900/50 text-indigo-300 rounded">
                        {o.tags?.length || 0} tags
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 bg-purple-900/50 text-purple-300 rounded">
                        {o.genres?.length || 0} genres
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
          )}
        </div>

        {/* ===== RIGHT: Édition ===== */}
        <div className="flex-1 min-w-0">
          {!selectedOeuvre ? (
            <div className="flex items-center justify-center h-64 text-gray-500">
              <div className="text-center">
                <Search className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Sélectionnez une œuvre à gauche</p>
              </div>
            </div>
          ) : loadingSelect ? (
            <div className="text-center py-16">
              <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mx-auto mb-4" />
              <p className="text-gray-400 text-sm">Chargement...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Header: titre + bouton copier */}
              <div className="flex items-center gap-4 bg-gray-800 p-4 rounded-lg">
                {selectedOeuvre.couverture?.url && (
                  <img
                    src={selectedOeuvre.couverture.url}
                    alt=""
                    className="w-12 h-[68px] object-cover rounded"
                  />
                )}
                <h2 className="flex-1 text-lg font-bold text-white truncate">
                  {selectedOeuvre.titre}
                </h2>
                <button
                  onClick={handleCopyTitle}
                  className="shrink-0 p-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white transition"
                  title="Copier le titre"
                >
                  {copied ? (
                    <Check className="w-5 h-5 text-green-400" />
                  ) : (
                    <Copy className="w-5 h-5" />
                  )}
                </button>
              </div>

              <MessageBanner />

              {/* Tags actuels */}
              <div>
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5" /> Tags ({tags.length})
                </h3>
                {tags.length === 0 ? (
                  <p className="text-xs text-gray-600 italic">Aucun tag.</p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {tags.map((t) => (
                      <span
                        key={t.documentId}
                        className="inline-flex items-center bg-indigo-900/40 text-indigo-300 pl-2.5 pr-1 py-1 rounded-full text-xs"
                      >
                        {t.titre}
                        <button
                          onClick={() => handleRemove("tag", t)}
                          className="ml-1 p-0.5 rounded-full hover:bg-red-900/50 hover:text-red-400 transition"
                          aria-label={`Retirer ${t.titre}`}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Genres actuels */}
              <div>
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5" /> Genres ({genres.length})
                </h3>
                {genres.length === 0 ? (
                  <p className="text-xs text-gray-600 italic">Aucun genre.</p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {genres.map((g) => (
                      <span
                        key={g.documentId}
                        className="inline-flex items-center bg-purple-900/40 text-purple-300 pl-2.5 pr-1 py-1 rounded-full text-xs"
                      >
                        {g.titre}
                        <button
                          onClick={() => handleRemove("genre", g)}
                          className="ml-1 p-0.5 rounded-full hover:bg-red-900/50 hover:text-red-400 transition"
                          aria-label={`Retirer ${g.titre}`}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Recherche unifiée tag/genre existant */}
              <div className="bg-gray-800 p-4 rounded-lg space-y-3">
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setSearchType("tags");
                      setTagGenreSearch("");
                      setSearchResults([]);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                      searchType === "tags"
                        ? "bg-indigo-600 text-white"
                        : "bg-gray-700 text-gray-400 hover:text-white"
                    }`}
                  >
                    Tag existant
                  </button>
                  <button
                    onClick={() => {
                      setSearchType("genres");
                      setTagGenreSearch("");
                      setSearchResults([]);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                      searchType === "genres"
                        ? "bg-purple-600 text-white"
                        : "bg-gray-700 text-gray-400 hover:text-white"
                    }`}
                  >
                    Genre existant
                  </button>
                </div>

                <div className="relative">
                  <input
                    type="text"
                    value={tagGenreSearch}
                    onChange={(e) => setTagGenreSearch(e.target.value)}
                    placeholder={`Rechercher un ${searchType === "tags" ? "tag" : "genre"}...`}
                    className="w-full p-2.5 bg-gray-700 text-white rounded-lg pr-10 text-sm focus:ring-2 focus:ring-indigo-500 transition"
                  />
                  {searchingTG && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 animate-spin" />
                  )}
                </div>

                {tagGenreSearch.length >= 2 &&
                  !searchingTG &&
                  searchResults.length === 0 && (
                    <p className="text-xs text-gray-500 italic">
                      Aucun résultat.
                    </p>
                  )}

                {searchResults.length > 0 && (
                  <ul className="space-y-1 max-h-48 overflow-y-auto">
                    {searchResults.map((item) => (
                      <li
                        key={item.documentId}
                        onClick={() => handleDirectAdd(item)}
                        className={`p-2 rounded-lg cursor-pointer transition flex items-center justify-between text-sm ${
                          addingId === item.documentId
                            ? "bg-gray-600 opacity-50 pointer-events-none"
                            : "hover:bg-gray-600 text-white"
                        }`}
                      >
                        <span>{item.titre}</span>
                        {addingId === item.documentId ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-gray-400" />
                        ) : (
                          <Plus className="w-3.5 h-3.5 text-gray-500" />
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Créer un nouveau (rétractable) */}
              <div className="bg-gray-800 rounded-lg overflow-hidden">
                <button
                  onClick={() => setShowCreate(!showCreate)}
                  className="w-full p-3 flex items-center justify-between text-white hover:bg-gray-700 transition text-sm"
                >
                  <span className="flex items-center gap-2 font-medium">
                    <Plus className="w-4 h-4 text-indigo-400" />
                    Créer un nouveau tag ou genre
                  </span>
                  {showCreate ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </button>
                {showCreate && (
                  <div className="px-4 pb-4 space-y-3">
                    <select
                      value={createType}
                      onChange={(e) => setCreateType(e.target.value)}
                      className="w-full p-2 rounded bg-gray-900 text-white text-sm"
                    >
                      <option value="Tag">Tag</option>
                      <option value="Genre">Genre</option>
                    </select>
                    <input
                      type="text"
                      value={createName}
                      onChange={(e) => setCreateName(e.target.value)}
                      placeholder="Nom..."
                      className="w-full p-2 rounded bg-gray-900 text-white text-sm"
                    />
                    <div>
                      <textarea
                        value={createDesc}
                        onChange={(e) => setCreateDesc(e.target.value)}
                        placeholder="Description (min. 50 caractères)..."
                        className="w-full p-2 rounded bg-gray-900 text-white text-sm"
                        rows={2}
                      />
                      <p className="text-[11px] text-gray-500 mt-0.5">
                        {createDesc.trim().length}/50 caractères
                      </p>
                    </div>
                    <button
                      onClick={handleCreate}
                      disabled={loadingCreate || !createName.trim()}
                      className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-600 rounded text-white text-sm font-medium transition flex items-center justify-center gap-2"
                    >
                      {loadingCreate && (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      )}
                      {loadingCreate ? "Création..." : "Créer et ajouter"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Undo toast */}
      {undoAction && (
        <div className="fixed bottom-6 right-6 z-50 bg-gray-800 border border-gray-600 rounded-lg shadow-2xl px-4 py-3 flex items-center gap-4">
          <span className="text-sm text-white">
            {undoAction.itemType === "tag" ? "Tag" : "Genre"}{" "}
            <span className="font-medium">{undoAction.item.titre}</span> retiré
          </span>
          <button
            onClick={handleUndo}
            className="text-sm font-bold text-indigo-400 hover:text-indigo-300 transition"
          >
            Annuler
          </button>
        </div>
      )}
    </div>
  );
};

export default TagsGenre;
