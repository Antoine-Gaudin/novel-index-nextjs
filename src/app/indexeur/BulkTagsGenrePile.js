"use client";

import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  X,
  CheckCircle,
  AlertCircle,
  ChevronRight,
  SkipForward,
  Sparkles,
  Tag as TagIcon,
  BookOpen,
  Loader2,
  Plus,
  Wand2,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { buildSuggestions } from "./SmartTagSuggester";

const API = process.env.NEXT_PUBLIC_API_URL;
const AUTHORIZED_EMAIL = "agaudin76@gmail.com";

export default function BulkTagsGenrePile({ user }) {
  const { jwt } = useAuth();
  const isAuthorized = user?.email === AUTHORIZED_EMAIL;

  // Stage : "filter" → "pile" → "auto" → "done"
  const [stage, setStage] = useState("filter");

  // Données globales
  const [oeuvres, setOeuvres] = useState([]);
  const [allTags, setAllTags] = useState([]);
  const [allGenres, setAllGenres] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filtres
  const [searchOeuvre, setSearchOeuvre] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterMissing, setFilterMissing] = useState("no_both");
  const [selectedIds, setSelectedIds] = useState(new Set());

  // Pile en cours
  const [queue, setQueue] = useState([]); // documentIds
  const [cursor, setCursor] = useState(0);
  const [pickedTagIds, setPickedTagIds] = useState(new Set());
  const [pickedGenreIds, setPickedGenreIds] = useState(new Set());
  const [searchTagPile, setSearchTagPile] = useState("");
  const [searchGenrePile, setSearchGenrePile] = useState("");
  const [saving, setSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState(null);
  const [aiInfo, setAiInfo] = useState(null);

  // Auto-pilote
  const [autoRunning, setAutoRunning] = useState(false);
  const [autoStop, setAutoStop] = useState(false);
  const [autoCurrent, setAutoCurrent] = useState(null);
  const [autoCount, setAutoCount] = useState(0);
  const [autoTotalTokens, setAutoTotalTokens] = useState({ in: 0, out: 0 });

  // Résultats
  const [results, setResults] = useState({ success: [], errors: [], skipped: [] });

  // ─────────────── Chargement initial ───────────────
  useEffect(() => {
    if (!isAuthorized) return;
    const fetchAll = async () => {
      setLoading(true);
      try {
        // Œuvres avec synopsis + tags + genres + auteur + type
        let allOeuvres = [];
        let page = 1;
        let hasMore = true;
        while (hasMore) {
          const res = await axios.get(
            `${API}/api/oeuvres?populate[tags][fields][0]=titre&populate[tags][fields][1]=documentId&populate[genres][fields][0]=titre&populate[genres][fields][1]=documentId&populate[couverture][fields][0]=id&fields[0]=titre&fields[1]=documentId&fields[2]=auteur&fields[3]=type&fields[4]=synopsis&fields[5]=annee&fields[6]=etat&pagination[page]=${page}&pagination[pageSize]=100&sort=titre:asc`,
            { headers: { Authorization: `Bearer ${jwt}` } },
          );
          const data = res.data.data || [];
          allOeuvres = [...allOeuvres, ...data];
          const pag = res.data.meta?.pagination;
          hasMore = pag && page < pag.pageCount;
          page++;
        }
        setOeuvres(allOeuvres);

        // Tags
        let allTagsData = [];
        page = 1;
        hasMore = true;
        while (hasMore) {
          const res = await axios.get(
            `${API}/api/tags?fields[0]=titre&fields[1]=documentId&fields[2]=description&pagination[page]=${page}&pagination[pageSize]=100&sort=titre:asc`,
            { headers: { Authorization: `Bearer ${jwt}` } },
          );
          allTagsData = [...allTagsData, ...res.data.data];
          const pag = res.data.meta?.pagination;
          hasMore = pag && page < pag.pageCount;
          page++;
        }
        setAllTags(allTagsData);

        // Genres
        let allGenresData = [];
        page = 1;
        hasMore = true;
        while (hasMore) {
          const res = await axios.get(
            `${API}/api/genres?fields[0]=titre&fields[1]=documentId&fields[2]=description&pagination[page]=${page}&pagination[pageSize]=100&sort=titre:asc`,
            { headers: { Authorization: `Bearer ${jwt}` } },
          );
          allGenresData = [...allGenresData, ...res.data.data];
          const pag = res.data.meta?.pagination;
          hasMore = pag && page < pag.pageCount;
          page++;
        }
        setAllGenres(allGenresData);
      } catch (err) {
        console.error("Erreur chargement données:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [jwt, isAuthorized]);

  // ─────────────── Filtres ───────────────
  const filteredOeuvres = useMemo(() => {
    return oeuvres.filter((o) => {
      if (
        searchOeuvre &&
        !o.titre?.toLowerCase().includes(searchOeuvre.toLowerCase())
      )
        return false;
      if (filterType && o.type !== filterType) return false;
      if (filterMissing === "no_tags" && (o.tags?.length || 0) > 0) return false;
      if (filterMissing === "no_genres" && (o.genres?.length || 0) > 0) return false;
      if (
        filterMissing === "no_both" &&
        ((o.tags?.length || 0) > 0 || (o.genres?.length || 0) > 0)
      )
        return false;
      return true;
    });
  }, [oeuvres, searchOeuvre, filterType, filterMissing]);

  const oeuvreTypes = useMemo(() => {
    const types = new Set(oeuvres.map((o) => o.type).filter(Boolean));
    return [...types].sort();
  }, [oeuvres]);

  const toggleOeuvre = (docId) => {
    setSelectedIds((prev) => {
      const n = new Set(prev);
      if (n.has(docId)) n.delete(docId);
      else n.add(docId);
      return n;
    });
  };

  const selectAllFiltered = () => {
    setSelectedIds(new Set(filteredOeuvres.map((o) => o.documentId)));
  };
  const clearSelection = () => setSelectedIds(new Set());

  // ─────────────── Démarrer la pile ───────────────
  const startPile = () => {
    const ids = filteredOeuvres
      .filter((o) => selectedIds.has(o.documentId))
      .map((o) => o.documentId);
    if (ids.length === 0) return;
    setQueue(ids);
    setCursor(0);
    setResults({ success: [], errors: [], skipped: [] });
    setStage("pile");
  };

  // ─────────────── Auto-pilote ───────────────
  // Traite TOUTES les œuvres sélectionnées : IA → save → suivante, sans intervention.
  const startAuto = async () => {
    const targets = filteredOeuvres.filter((o) =>
      selectedIds.has(o.documentId),
    );
    if (targets.length === 0) return;
    if (
      !window.confirm(
        `Lancer l'auto-pilote sur ${targets.length} œuvres ?\n\nL'IA va analyser, sauver et passer à la suivante automatiquement.\nLes tags/genres existants seront préservés et complétés (jamais supprimés).\nCoût estimé : ~${(targets.length * 0.001).toFixed(2)} $.`,
      )
    )
      return;

    setStage("auto");
    setAutoRunning(true);
    setAutoStop(false);
    setAutoCount(0);
    setAutoTotalTokens({ in: 0, out: 0 });
    setResults({ success: [], errors: [], skipped: [] });

    let stopped = false;
    for (let i = 0; i < targets.length; i++) {
      if (stopped) break;
      // Re-vérifie le flag stop via un ref serait mieux mais state suffit ici
      // car on attend chaque appel
      const oeuvre = targets[i];
      setAutoCurrent({ index: i + 1, total: targets.length, titre: oeuvre.titre });

      try {
        // 1) Appel IA
        const aiRes = await axios.post("/api/ai-suggest-tags", {
          titre: oeuvre.titre,
          synopsis: oeuvre.synopsis || "",
          auteur: oeuvre.auteur,
          type: oeuvre.type,
          tags: allTags.map((t) => ({
            documentId: t.documentId,
            titre: t.titre,
            description: t.description || "",
          })),
          genres: allGenres.map((g) => ({
            documentId: g.documentId,
            titre: g.titre,
            description: g.description || "",
          })),
        });
        const { tagIds = [], genreIds = [], usage } = aiRes.data || {};

        // Tokens cumulés
        if (usage) {
          setAutoTotalTokens((t) => ({
            in: t.in + (usage.prompt_tokens || 0),
            out: t.out + (usage.completion_tokens || 0),
          }));
        }

        // 2) Merge avec l'existant (préserve)
        const mergedTags = new Set([
          ...(oeuvre.tags || []).map((t) => t.documentId),
          ...tagIds,
        ]);
        const mergedGenres = new Set([
          ...(oeuvre.genres || []).map((g) => g.documentId),
          ...genreIds,
        ]);

        // 3) Sauvegarde (couverture réaffirmée pour éviter qu'elle ne soit effacée)
        const putData = {
          tags: [...mergedTags],
          genres: [...mergedGenres],
        };
        if (oeuvre.couverture?.id) {
          putData.couverture = oeuvre.couverture.id;
        }
        await axios.put(
          `${API}/api/oeuvres/${oeuvre.documentId}`,
          { data: putData },
          { headers: { Authorization: `Bearer ${jwt}` } },
        );

        // 4) MAJ locale
        setOeuvres((prev) =>
          prev.map((o) =>
            o.documentId === oeuvre.documentId
              ? {
                  ...o,
                  tags: allTags.filter((t) => mergedTags.has(t.documentId)),
                  genres: allGenres.filter((g) => mergedGenres.has(g.documentId)),
                }
              : o,
          ),
        );

        setResults((r) => ({
          ...r,
          success: [
            ...r.success,
            `${oeuvre.titre} (+${tagIds.length} tags, +${genreIds.length} genres)`,
          ],
        }));
      } catch (err) {
        setResults((r) => ({
          ...r,
          errors: [
            ...r.errors,
            `${oeuvre.titre} — ${err.response?.data?.error || err.message}`,
          ],
        }));
      }

      setAutoCount(i + 1);

      // Petite pause pour ne pas saturer OpenRouter (limite ~20 req/min en safe)
      await new Promise((res) => setTimeout(res, 400));

      // Check stop drapeau via state (lecture asynchrone, on relit via une closure ref-like)
      // Note : on lit autoStop via un state qui peut être mis à jour pendant la boucle.
      // Comme React batch, on utilise une astuce : stocker dans un objet partagé.
      if (typeof window !== "undefined" && window.__autoStop) {
        stopped = true;
        window.__autoStop = false;
      }
    }

    setAutoRunning(false);
    setAutoCurrent(null);
    setStage("done");
  };

  const requestAutoStop = () => {
    setAutoStop(true);
    if (typeof window !== "undefined") window.__autoStop = true;
  };

  // ─────────────── Œuvre courante & suggestions ───────────────
  const currentOeuvre = useMemo(() => {
    if (stage !== "pile" || cursor >= queue.length) return null;
    return oeuvres.find((o) => o.documentId === queue[cursor]) || null;
  }, [stage, cursor, queue, oeuvres]);

  const tagSuggestions = useMemo(() => {
    if (!currentOeuvre) return { suggestions: [], autoChecked: [] };
    return buildSuggestions(currentOeuvre, allTags, { topN: 15 });
  }, [currentOeuvre, allTags]);

  const genreSuggestions = useMemo(() => {
    if (!currentOeuvre) return { suggestions: [], autoChecked: [] };
    return buildSuggestions(currentOeuvre, allGenres, { topN: 10 });
  }, [currentOeuvre, allGenres]);

  // Réinitialiser la sélection à chaque nouvelle œuvre + pré-coché auto
  useEffect(() => {
    if (!currentOeuvre) return;
    const initialTags = new Set([
      ...(currentOeuvre.tags || []).map((t) => t.documentId),
      ...tagSuggestions.autoChecked,
    ]);
    const initialGenres = new Set([
      ...(currentOeuvre.genres || []).map((g) => g.documentId),
      ...genreSuggestions.autoChecked,
    ]);
    setPickedTagIds(initialTags);
    setPickedGenreIds(initialGenres);
    setSearchTagPile("");
    setSearchGenrePile("");
    setAiError(null);
    setAiInfo(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentOeuvre?.documentId]);

  // Listes filtrées pour recherche libre
  const filteredTagsForSearch = useMemo(() => {
    if (!searchTagPile) return [];
    const q = searchTagPile.toLowerCase();
    return allTags
      .filter((t) => t.titre?.toLowerCase().includes(q))
      .slice(0, 20);
  }, [allTags, searchTagPile]);

  const filteredGenresForSearch = useMemo(() => {
    if (!searchGenrePile) return [];
    const q = searchGenrePile.toLowerCase();
    return allGenres
      .filter((g) => g.titre?.toLowerCase().includes(q))
      .slice(0, 20);
  }, [allGenres, searchGenrePile]);

  // ─────────────── Actions pile ───────────────
  const togglePicked = (kind, id) => {
    if (kind === "tag") {
      setPickedTagIds((prev) => {
        const n = new Set(prev);
        if (n.has(id)) n.delete(id);
        else n.add(id);
        return n;
      });
    } else {
      setPickedGenreIds((prev) => {
        const n = new Set(prev);
        if (n.has(id)) n.delete(id);
        else n.add(id);
        return n;
      });
    }
  };

  const skipCurrent = () => {
    if (!currentOeuvre) return;
    setResults((r) => ({ ...r, skipped: [...r.skipped, currentOeuvre.titre] }));
    advance();
  };

  const runAISuggest = async () => {
    if (!currentOeuvre) return;
    setAiLoading(true);
    setAiError(null);
    setAiInfo(null);
    try {
      const res = await axios.post("/api/ai-suggest-tags", {
        titre: currentOeuvre.titre,
        synopsis: currentOeuvre.synopsis || "",
        auteur: currentOeuvre.auteur,
        type: currentOeuvre.type,
        tags: allTags.map((t) => ({
          documentId: t.documentId,
          titre: t.titre,
          description: t.description || "",
        })),
        genres: allGenres.map((g) => ({
          documentId: g.documentId,
          titre: g.titre,
          description: g.description || "",
        })),
      });
      const { tagIds = [], genreIds = [], model, usage } = res.data || {};
      setPickedTagIds((prev) => {
        const n = new Set(prev);
        tagIds.forEach((id) => n.add(id));
        return n;
      });
      setPickedGenreIds((prev) => {
        const n = new Set(prev);
        genreIds.forEach((id) => n.add(id));
        return n;
      });
      const tokens = usage
        ? ` · ${usage.prompt_tokens || 0}→${usage.completion_tokens || 0} tok`
        : "";
      setAiInfo(
        `${model || "?"} : +${tagIds.length} tags, +${genreIds.length} genres${tokens}`,
      );
    } catch (err) {
      setAiError(
        err.response?.data?.error || err.message || "Erreur appel IA",
      );
    } finally {
      setAiLoading(false);
    }
  };

  const advance = () => {
    if (cursor + 1 >= queue.length) {
      setStage("done");
    } else {
      setCursor(cursor + 1);
    }
  };

  const saveAndNext = async () => {
    if (!currentOeuvre) return;
    setSaving(true);
    try {
      // PUT œuvre avec ses nouvelles relations (couverture réaffirmée pour éviter qu'elle ne soit effacée)
      const putData = {
        tags: [...pickedTagIds],
        genres: [...pickedGenreIds],
      };
      if (currentOeuvre.couverture?.id) {
        putData.couverture = currentOeuvre.couverture.id;
      }
      await axios.put(
        `${API}/api/oeuvres/${currentOeuvre.documentId}`,
        { data: putData },
        { headers: { Authorization: `Bearer ${jwt}` } },
      );

      // Mise à jour locale pour refléter
      setOeuvres((prev) =>
        prev.map((o) =>
          o.documentId === currentOeuvre.documentId
            ? {
                ...o,
                tags: allTags.filter((t) => pickedTagIds.has(t.documentId)),
                genres: allGenres.filter((g) => pickedGenreIds.has(g.documentId)),
              }
            : o,
        ),
      );

      setResults((r) => ({
        ...r,
        success: [
          ...r.success,
          `${currentOeuvre.titre} (${pickedTagIds.size} tags, ${pickedGenreIds.size} genres)`,
        ],
      }));
      advance();
    } catch (err) {
      console.error("Erreur sauvegarde:", err);
      setResults((r) => ({
        ...r,
        errors: [
          ...r.errors,
          `${currentOeuvre.titre} — ${err.response?.data?.error?.message || err.message}`,
        ],
      }));
    } finally {
      setSaving(false);
    }
  };

  const resetAll = () => {
    setStage("filter");
    setSelectedIds(new Set());
    setQueue([]);
    setCursor(0);
    setResults({ success: [], errors: [], skipped: [] });
  };

  // ─────────────── Rendus ───────────────
  if (!isAuthorized) {
    return (
      <div className="text-center py-16">
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Accès refusé</h2>
        <p className="text-gray-400">
          Cet outil est réservé à l&apos;administrateur.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="text-center py-16">
        <Loader2 className="w-8 h-8 text-indigo-400 mx-auto mb-4 animate-spin" />
        <p className="text-gray-400">Chargement des œuvres, tags et genres…</p>
      </div>
    );
  }

  // ───────── STAGE filter ─────────
  if (stage === "filter") {
    return (
      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-indigo-400" />
            Mode pile assistée
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            Sélectionne les œuvres à taguer, puis traite-les une à une avec des suggestions
            calculées à partir de leur synopsis et de leur titre.
          </p>
        </div>

        {/* Filtres */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchOeuvre}
              onChange={(e) => setSearchOeuvre(e.target.value)}
              placeholder="Rechercher par titre…"
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
            <option value="">Toutes les œuvres</option>
            <option value="no_tags">Sans tags</option>
            <option value="no_genres">Sans genres</option>
            <option value="no_both">Sans tags ET sans genres</option>
          </select>
        </div>

        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-gray-400">
            {filteredOeuvres.length} affichées · {selectedIds.size} sélectionnées
          </span>
          <div className="flex gap-2">
            <button
              onClick={selectAllFiltered}
              className="px-3 py-1.5 text-xs bg-gray-700 hover:bg-gray-600 rounded-lg text-white transition"
            >
              Tout sélectionner
            </button>
            <button
              onClick={clearSelection}
              className="px-3 py-1.5 text-xs bg-gray-700 hover:bg-gray-600 rounded-lg text-white transition"
            >
              Vider
            </button>
          </div>
        </div>

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
                <p className="text-xs text-gray-500">
                  {o.type || "N/A"}
                  {o.auteur ? ` · ${o.auteur}` : ""}
                  {o.synopsis ? "" : " · ⚠ pas de synopsis"}
                </p>
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

        <div className="mt-4 flex justify-end gap-2">
          <button
            onClick={startAuto}
            disabled={selectedIds.size === 0}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-fuchsia-600 to-indigo-600 hover:from-fuchsia-500 hover:to-indigo-500 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed rounded-lg text-white font-medium transition shadow"
            title="L'IA tague et sauve toutes les œuvres sélectionnées sans intervention"
          >
            <Wand2 className="w-4 h-4" /> Auto-pilote IA ({selectedIds.size})
          </button>
          <button
            onClick={startPile}
            disabled={selectedIds.size === 0}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg text-white font-medium transition"
          >
            Pile manuelle ({selectedIds.size}) <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // ───────── STAGE auto ─────────
  if (stage === "auto") {
    const total = autoCurrent?.total || 0;
    const pct = total ? (autoCount / total) * 100 : 0;
    const estCost = (
      (autoTotalTokens.in * 0.15 + autoTotalTokens.out * 0.6) /
      1_000_000
    ).toFixed(4);
    return (
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-5">
        <div className="text-center">
          <Wand2 className="w-10 h-10 text-fuchsia-400 mx-auto mb-2 animate-pulse" />
          <h2 className="text-2xl font-bold text-white">Auto-pilote IA</h2>
          <p className="text-sm text-gray-400 mt-1">
            {autoCount} / {total} œuvres traitées · {results.success.length}{" "}
            succès · {results.errors.length} erreurs
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Tokens : {autoTotalTokens.in.toLocaleString()} →{" "}
            {autoTotalTokens.out.toLocaleString()} · Coût ≈ {estCost} $
          </p>
        </div>

        <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-fuchsia-500 to-indigo-500 transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>

        {autoCurrent && autoRunning && (
          <div className="bg-gray-800/60 border border-gray-700 rounded-lg p-4 text-center">
            <p className="text-xs text-gray-500 uppercase tracking-wider">
              En cours
            </p>
            <p className="text-white font-medium mt-1">{autoCurrent.titre}</p>
          </div>
        )}

        {autoRunning && (
          <div className="flex justify-center">
            <button
              onClick={requestAutoStop}
              disabled={autoStop}
              className="px-5 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 rounded-lg text-white text-sm font-medium"
            >
              {autoStop ? "Arrêt en cours…" : "Arrêter après l'œuvre actuelle"}
            </button>
          </div>
        )}

        {results.success.length > 0 && (
          <div className="bg-green-950/30 border border-green-800/40 rounded-lg p-3 max-h-64 overflow-y-auto">
            <p className="text-green-400 text-xs font-semibold mb-1">
              Dernières validations
            </p>
            <ul className="text-xs text-gray-300 space-y-0.5">
              {results.success.slice(-15).map((s, i) => (
                <li key={i}>✓ {s}</li>
              ))}
            </ul>
          </div>
        )}
        {results.errors.length > 0 && (
          <div className="bg-red-950/30 border border-red-800/40 rounded-lg p-3 max-h-40 overflow-y-auto">
            <p className="text-red-400 text-xs font-semibold mb-1">Erreurs</p>
            <ul className="text-xs text-gray-300 space-y-0.5">
              {results.errors.slice(-10).map((s, i) => (
                <li key={i}>✗ {s}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  }

  // ───────── STAGE done ─────────
  if (stage === "done") {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <div className="text-center">
          <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
          <h2 className="text-2xl font-bold text-white">Pile terminée</h2>
          <p className="text-sm text-gray-400 mt-1">
            {results.success.length} validées · {results.skipped.length} ignorées ·{" "}
            {results.errors.length} erreurs
          </p>
        </div>

        {results.success.length > 0 && (
          <div className="bg-green-950/30 border border-green-800/40 rounded-lg p-4">
            <h3 className="text-green-400 font-semibold mb-2">
              ✅ Validées ({results.success.length})
            </h3>
            <ul className="text-sm text-gray-300 space-y-1 max-h-48 overflow-y-auto">
              {results.success.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          </div>
        )}
        {results.skipped.length > 0 && (
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
            <h3 className="text-gray-300 font-semibold mb-2">
              ⏭ Ignorées ({results.skipped.length})
            </h3>
            <ul className="text-sm text-gray-400 space-y-1 max-h-32 overflow-y-auto">
              {results.skipped.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          </div>
        )}
        {results.errors.length > 0 && (
          <div className="bg-red-950/30 border border-red-800/40 rounded-lg p-4">
            <h3 className="text-red-400 font-semibold mb-2">
              ❌ Erreurs ({results.errors.length})
            </h3>
            <ul className="text-sm text-gray-300 space-y-1 max-h-48 overflow-y-auto">
              {results.errors.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex justify-center">
          <button
            onClick={resetAll}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-white font-medium"
          >
            Recommencer une pile
          </button>
        </div>
      </div>
    );
  }

  // ───────── STAGE pile ─────────
  if (!currentOeuvre) return null;
  const synopsis = currentOeuvre.synopsis || "";
  const allPickedTags = allTags.filter((t) => pickedTagIds.has(t.documentId));
  const allPickedGenres = allGenres.filter((g) => pickedGenreIds.has(g.documentId));

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      {/* Progression */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">
            Œuvre {cursor + 1} / {queue.length}
          </h2>
          <p className="text-xs text-gray-500">
            {queue.length - cursor - 1} restantes · {results.success.length} validées
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={skipCurrent}
            disabled={saving}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-gray-700 hover:bg-gray-600 rounded-lg text-white"
          >
            <SkipForward className="w-4 h-4" /> Passer
          </button>
          <button
            onClick={() => setStage("done")}
            disabled={saving}
            className="px-3 py-1.5 text-sm bg-gray-700 hover:bg-gray-600 rounded-lg text-white"
          >
            Arrêter
          </button>
        </div>
      </div>

      {/* Barre de progression */}
      <div className="w-full h-1.5 bg-gray-800 rounded-full mb-6 overflow-hidden">
        <div
          className="h-full bg-indigo-500 transition-all"
          style={{ width: `${((cursor + 1) / queue.length) * 100}%` }}
        />
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentOeuvre.documentId}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.15 }}
        >
          {/* Header œuvre */}
          <div className="bg-gray-800 rounded-lg p-5 mb-4 border border-gray-700">
            <h3 className="text-xl font-bold text-white">{currentOeuvre.titre}</h3>
            <p className="text-sm text-gray-400 mt-1">
              {currentOeuvre.auteur || "Auteur inconnu"} · {currentOeuvre.type || "N/A"}
              {currentOeuvre.annee ? ` · ${currentOeuvre.annee}` : ""}
              {currentOeuvre.etat ? ` · ${currentOeuvre.etat}` : ""}
            </p>
            {synopsis ? (
              <details className="mt-3">
                <summary className="text-xs text-indigo-400 cursor-pointer hover:text-indigo-300">
                  Synopsis ({synopsis.length} caractères)
                </summary>
                <p className="text-sm text-gray-300 mt-2 whitespace-pre-line leading-relaxed">
                  {synopsis}
                </p>
              </details>
            ) : (
              <p className="text-xs text-amber-400 mt-3">
                ⚠ Pas de synopsis — les suggestions seront limitées au titre.
              </p>
            )}
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <button
                onClick={runAISuggest}
                disabled={aiLoading || saving}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-fuchsia-600 to-indigo-600 hover:from-fuchsia-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white text-sm font-medium shadow"
              >
                {aiLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> L&apos;IA réfléchit…
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4" /> Suggérer avec l&apos;IA
                  </>
                )}
              </button>
              {aiInfo && (
                <span className="text-xs text-emerald-400">{aiInfo}</span>
              )}
              {aiError && (
                <span className="text-xs text-red-400">⚠ {aiError}</span>
              )}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {/* TAGS */}
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                <TagIcon className="w-4 h-4 text-purple-400" /> Tags
                <span className="text-xs text-gray-500 font-normal">
                  ({pickedTagIds.size} sélectionnés)
                </span>
              </h4>

              {/* Sélectionnés */}
              {allPickedTags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3 pb-3 border-b border-gray-700">
                  {allPickedTags.map((t) => (
                    <span
                      key={t.documentId}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-purple-600 text-white"
                    >
                      {t.titre}
                      <button onClick={() => togglePicked("tag", t.documentId)}>
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {/* Suggestions auto */}
              {tagSuggestions.suggestions.length > 0 && (
                <div className="mb-3">
                  <p className="text-[11px] uppercase tracking-wider text-gray-500 mb-1.5 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Suggestions
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {tagSuggestions.suggestions.map((t) => {
                      const picked = pickedTagIds.has(t.documentId);
                      return (
                        <button
                          key={t.documentId}
                          onClick={() => togglePicked("tag", t.documentId)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs transition ${
                            picked
                              ? "bg-purple-600 text-white"
                              : "bg-purple-900/40 text-purple-300 hover:bg-purple-800/60 border border-purple-700/40"
                          }`}
                          title={`Score ${t.score} · ${t.hits} occurrence(s)`}
                        >
                          {t.titre}
                          <span className="opacity-60">·{t.score}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Recherche libre */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <input
                  type="text"
                  value={searchTagPile}
                  onChange={(e) => setSearchTagPile(e.target.value)}
                  placeholder="Ajouter un tag manuellement…"
                  className="w-full pl-9 pr-3 py-1.5 bg-gray-900 border border-gray-600 rounded-lg text-white text-xs"
                />
              </div>
              {filteredTagsForSearch.length > 0 && (
                <div className="mt-2 max-h-40 overflow-y-auto flex flex-wrap gap-1.5">
                  {filteredTagsForSearch.map((t) => {
                    const picked = pickedTagIds.has(t.documentId);
                    return (
                      <button
                        key={t.documentId}
                        onClick={() => togglePicked("tag", t.documentId)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs ${
                          picked
                            ? "bg-purple-600 text-white"
                            : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                        }`}
                      >
                        {!picked && <Plus className="w-3 h-3" />} {t.titre}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* GENRES */}
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-indigo-400" /> Genres
                <span className="text-xs text-gray-500 font-normal">
                  ({pickedGenreIds.size} sélectionnés)
                </span>
              </h4>

              {allPickedGenres.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3 pb-3 border-b border-gray-700">
                  {allPickedGenres.map((g) => (
                    <span
                      key={g.documentId}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-indigo-600 text-white"
                    >
                      {g.titre}
                      <button onClick={() => togglePicked("genre", g.documentId)}>
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {genreSuggestions.suggestions.length > 0 && (
                <div className="mb-3">
                  <p className="text-[11px] uppercase tracking-wider text-gray-500 mb-1.5 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Suggestions
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {genreSuggestions.suggestions.map((g) => {
                      const picked = pickedGenreIds.has(g.documentId);
                      return (
                        <button
                          key={g.documentId}
                          onClick={() => togglePicked("genre", g.documentId)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs transition ${
                            picked
                              ? "bg-indigo-600 text-white"
                              : "bg-indigo-900/40 text-indigo-300 hover:bg-indigo-800/60 border border-indigo-700/40"
                          }`}
                          title={`Score ${g.score} · ${g.hits} occurrence(s)`}
                        >
                          {g.titre}
                          <span className="opacity-60">·{g.score}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <input
                  type="text"
                  value={searchGenrePile}
                  onChange={(e) => setSearchGenrePile(e.target.value)}
                  placeholder="Ajouter un genre manuellement…"
                  className="w-full pl-9 pr-3 py-1.5 bg-gray-900 border border-gray-600 rounded-lg text-white text-xs"
                />
              </div>
              {filteredGenresForSearch.length > 0 && (
                <div className="mt-2 max-h-40 overflow-y-auto flex flex-wrap gap-1.5">
                  {filteredGenresForSearch.map((g) => {
                    const picked = pickedGenreIds.has(g.documentId);
                    return (
                      <button
                        key={g.documentId}
                        onClick={() => togglePicked("genre", g.documentId)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs ${
                          picked
                            ? "bg-indigo-600 text-white"
                            : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                        }`}
                      >
                        {!picked && <Plus className="w-3 h-3" />} {g.titre}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Action principale */}
          <div className="mt-6 flex justify-end gap-2">
            <button
              onClick={skipCurrent}
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-gray-700 hover:bg-gray-600 rounded-lg text-white"
            >
              <SkipForward className="w-4 h-4" /> Passer sans sauver
            </button>
            <button
              onClick={saveAndNext}
              disabled={saving}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-600 rounded-lg text-white font-medium"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Sauvegarde…
                </>
              ) : (
                <>
                  Sauver & suivant <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
