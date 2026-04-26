"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { slugify } from "@/utils/slugify";
import { auteurSlug } from "@/utils/auteurSlug";
import {
  FiSearch,
  FiUser,
  FiCalendar,
  FiBook,
  FiClock,
  FiCheckCircle,
} from "react-icons/fi";

function getCoverUrl(o) {
  const c = o?.couverture;
  if (!c) return null;
  if (typeof c === "string") return c;
  return c.formats?.medium?.url || c.formats?.small?.url || c.url || null;
}

const PAGE_SIZE = 24;

export default function TeamCatalogClient({ oeuvres = [], teamTitre = "" }) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [etatFilter, setEtatFilter] = useState("all");
  const [sort, setSort] = useState("recent");
  const [visible, setVisible] = useState(PAGE_SIZE);

  // Options dérivées
  const typeOptions = useMemo(() => {
    const set = new Set();
    for (const o of oeuvres) if (o.type) set.add(o.type);
    return Array.from(set).sort();
  }, [oeuvres]);

  const etatOptions = useMemo(() => {
    const set = new Set();
    for (const o of oeuvres) if (o.etat) set.add(o.etat);
    return Array.from(set).sort();
  }, [oeuvres]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = oeuvres.filter((o) => {
      if (typeFilter !== "all" && o.type !== typeFilter) return false;
      if (etatFilter !== "all" && o.etat !== etatFilter) return false;
      if (!q) return true;
      const hay = `${o.titre || ""} ${o.auteur || ""}`.toLowerCase();
      return hay.includes(q);
    });
    if (sort === "recent") {
      list = [...list].sort((a, b) =>
        (b.updatedAt || "").localeCompare(a.updatedAt || ""),
      );
    } else if (sort === "titre") {
      list = [...list].sort((a, b) =>
        (a.titre || "").localeCompare(b.titre || "", "fr", { sensitivity: "base" }),
      );
    } else if (sort === "annee") {
      list = [...list].sort((a, b) => (b.annee || 0) - (a.annee || 0));
    }
    return list;
  }, [oeuvres, search, typeFilter, etatFilter, sort]);

  const shown = filtered.slice(0, visible);
  const hasMore = filtered.length > visible;

  const resetVisible = (cb) => (val) => {
    cb(val);
    setVisible(PAGE_SIZE);
  };

  return (
    <div className="space-y-4">
      {/* Barre filtres */}
      <div className="bg-gray-900/40 rounded-lg p-3 border border-gray-700/30 space-y-3">
        <div className="flex flex-col md:flex-row gap-2 md:items-center">
          <div className="relative flex-1 min-w-0">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="search"
              value={search}
              onChange={resetVisible(setSearch)}
              placeholder={`Rechercher dans le catalogue de ${teamTitre || "la team"}…`}
              aria-label="Rechercher une œuvre dans le catalogue"
              className="w-full pl-9 pr-3 py-2 bg-gray-800/60 border border-gray-700/40 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-400/60"
            />
          </div>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            aria-label="Trier les œuvres"
            className="px-3 py-2 bg-gray-800/60 border border-gray-700/40 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-400/60"
          >
            <option value="recent">Plus récentes</option>
            <option value="titre">Titre A→Z</option>
            <option value="annee">Année récente</option>
          </select>
        </div>

        {(typeOptions.length > 1 || etatOptions.length > 1) && (
          <div className="flex flex-wrap gap-2">
            {typeOptions.length > 1 && (
              <div className="flex flex-wrap gap-1.5 items-center">
                <span className="text-xs text-gray-500 mr-1">Format&nbsp;:</span>
                <button
                  type="button"
                  onClick={resetVisible(setTypeFilter).bind(null, "all")}
                  className={`px-2.5 py-1 text-xs rounded-full border transition-colors ${
                    typeFilter === "all"
                      ? "bg-indigo-500/30 text-indigo-200 border-indigo-400/50"
                      : "bg-gray-800/40 text-gray-400 border-gray-700/40 hover:bg-gray-700/40"
                  }`}
                >
                  Tous
                </button>
                {typeOptions.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={resetVisible(setTypeFilter).bind(null, t)}
                    className={`px-2.5 py-1 text-xs rounded-full border transition-colors ${
                      typeFilter === t
                        ? "bg-indigo-500/30 text-indigo-200 border-indigo-400/50"
                        : "bg-gray-800/40 text-gray-400 border-gray-700/40 hover:bg-gray-700/40"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            )}

            {etatOptions.length > 1 && (
              <div className="flex flex-wrap gap-1.5 items-center">
                <span className="text-xs text-gray-500 mr-1">État&nbsp;:</span>
                <button
                  type="button"
                  onClick={resetVisible(setEtatFilter).bind(null, "all")}
                  className={`px-2.5 py-1 text-xs rounded-full border transition-colors ${
                    etatFilter === "all"
                      ? "bg-emerald-500/30 text-emerald-200 border-emerald-400/50"
                      : "bg-gray-800/40 text-gray-400 border-gray-700/40 hover:bg-gray-700/40"
                  }`}
                >
                  Tous
                </button>
                {etatOptions.map((e) => (
                  <button
                    key={e}
                    type="button"
                    onClick={resetVisible(setEtatFilter).bind(null, e)}
                    className={`px-2.5 py-1 text-xs rounded-full border transition-colors ${
                      etatFilter === e
                        ? "bg-emerald-500/30 text-emerald-200 border-emerald-400/50"
                        : "bg-gray-800/40 text-gray-400 border-gray-700/40 hover:bg-gray-700/40"
                    }`}
                  >
                    {e}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="text-xs text-gray-500 flex items-center gap-2">
          <FiBook className="text-amber-400" />
          {filtered.length} œuvre{filtered.length > 1 ? "s" : ""} affichée{filtered.length > 1 ? "s" : ""}
          {filtered.length !== oeuvres.length && (
            <span className="text-gray-600">/ {oeuvres.length} au total</span>
          )}
        </div>
      </div>

      {shown.length > 0 ? (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {shown.map((o, idx) => {
              const oCover = getCoverUrl(o);
              const isPriority = idx < 4;
              return (
                <Link
                  key={o.documentId || o.id}
                  href={`/oeuvre/${o.documentId}-${slugify(o.titre || "")}`}
                  title={`${o.titre} — ${o.auteur || "Auteur inconnu"}`}
                  className="group bg-gray-900/40 rounded-lg overflow-hidden border border-gray-700/30 hover:border-indigo-400/40 transition-all"
                >
                  <div className="relative aspect-[2/3] bg-gray-800 overflow-hidden">
                    {oCover ? (
                      <Image
                        src={oCover}
                        alt={`Couverture de ${o.titre} — traduit par ${teamTitre}`}
                        fill
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 20vw"
                        loading={isPriority ? "eager" : "lazy"}
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs">
                        Sans couverture
                      </div>
                    )}
                    {o.type && (
                      <span className="absolute top-2 left-2 px-2 py-0.5 text-[10px] font-semibold rounded bg-black/70 text-gray-200 border border-gray-500/40">
                        {o.type}
                      </span>
                    )}
                    {o.etat && (
                      <span className="absolute top-2 right-2 px-2 py-0.5 text-[10px] font-semibold rounded bg-black/70 text-gray-200 border border-gray-500/40 flex items-center gap-1">
                        {o.etat === "Terminé" ? (
                          <FiCheckCircle className="text-emerald-300" />
                        ) : (
                          <FiClock className="text-amber-300" />
                        )}
                        {o.etat}
                      </span>
                    )}
                  </div>
                  <div className="p-2.5 space-y-1">
                    <h3 className="text-sm font-semibold text-white line-clamp-2 group-hover:text-indigo-200 transition-colors">
                      {o.titre}
                    </h3>
                    {o.auteur && (
                      <p className="text-xs text-gray-400 flex items-center gap-1 truncate">
                        <FiUser className="flex-shrink-0" />
                        <span className="truncate">{o.auteur}</span>
                      </p>
                    )}
                    {o.annee && (
                      <p className="text-[11px] text-gray-500 flex items-center gap-1">
                        <FiCalendar /> {o.annee}
                      </p>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>

          {hasMore && (
            <div className="flex justify-center pt-2">
              <button
                type="button"
                onClick={() => setVisible((v) => v + PAGE_SIZE)}
                className="px-5 py-2.5 bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-400/40 rounded-lg text-sm font-semibold text-indigo-100 transition-colors"
              >
                Voir plus ({filtered.length - visible} restantes)
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="bg-gray-900/40 rounded-lg p-8 border border-gray-700/30 text-center text-gray-400 text-sm">
          Aucune œuvre ne correspond aux filtres.
        </div>
      )}
    </div>
  );
}

// Helper exporté pour réutilisation côté serveur (non utilisé en pratique, gardé pour cohérence)
export { auteurSlug };
