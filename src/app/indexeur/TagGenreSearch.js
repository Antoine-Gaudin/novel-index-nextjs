"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { Search, Loader2, CheckCircle, AlertCircle, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const API = process.env.NEXT_PUBLIC_API_URL;

const TagGenreSearch = ({ type, selectedOeuvre, alreadyLinked, onSuccess }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState(null);
  const [message, setMessage] = useState(null);
  const [searching, setSearching] = useState(false);
  const [adding, setAdding] = useState(false);
  const debounceRef = useRef(null);

  const { jwt } = useAuth();

  const fetchResults = useCallback(async (term) => {
    if (!jwt || term.length < 2) {
      setResults([]);
      return;
    }
    setSearching(true);
    try {
      const res = await axios.get(
        `${API}/api/${type.toLowerCase()}s?filters[titre][$containsi]=${encodeURIComponent(term)}&populate=oeuvres`,
        { headers: { Authorization: `Bearer ${jwt}` } }
      );
      const all = res.data.data || [];
      const filtered = all
        .filter((item) => !alreadyLinked.find((a) => a.documentId === item.documentId))
        .map((item) => ({
          ...item,
          documentId: item.documentId || item.id,
        }));

      setResults(filtered);
    } catch (err) {
      console.error("Erreur de recherche :", err);
    } finally {
      setSearching(false);
    }
  }, [jwt, type, alreadyLinked]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (searchTerm.length < 2) {
      setResults([]);
      return;
    }

    debounceRef.current = setTimeout(() => {
      fetchResults(searchTerm);
    }, 400);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchTerm, fetchResults]);

  const handleAdd = async () => {
    if (!selected || adding) return;

    setAdding(true);
    try {
      const updatedDocIds = [...new Set([
        ...(selected.oeuvres?.map((o) => o.documentId) || []),
        selectedOeuvre.documentId,
      ])];

      await axios.put(
        `${API}/api/${type.toLowerCase()}s/${selected.documentId}`,
        { data: { oeuvres: updatedDocIds } },
        { headers: { Authorization: `Bearer ${jwt}` } }
      );

      setMessage({ text: `${type} lié avec succès à l'\u0153uvre.`, type: "success" });
      setSearchTerm("");
      setSelected(null);
      setResults([]);
      onSuccess();
    } catch (err) {
      console.error("Erreur de liaison :", err);
      setMessage({ text: "Erreur lors de la liaison.", type: "error" });
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="bg-gray-800 p-4 rounded-lg space-y-3">
      <h3 className="font-bold text-white mb-1 flex items-center gap-2">
        <Search className="w-4 h-4 text-gray-400" />
        Ajouter un {type} existant
      </h3>

      <div className="relative">
        <input
          type="text"
          placeholder={`Rechercher un ${type.toLowerCase()}...`}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full p-2.5 bg-gray-700 text-white rounded-lg pr-10 focus:ring-2 focus:ring-indigo-500 transition"
          aria-label={`Rechercher un ${type.toLowerCase()} existant`}
        />
        {searching && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 animate-spin" />
        )}
      </div>

      {searchTerm.length >= 2 && !searching && results.length === 0 && (
        <p className="text-sm text-gray-500 italic">Aucun {type.toLowerCase()} trouvé.</p>
      )}

      {results.length > 0 && (
        <ul className="bg-gray-700 rounded-lg p-2 space-y-1 max-h-48 overflow-y-auto">
          {results.map((item) => (
            <li
              key={item.documentId}
              onClick={() => setSelected(item)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && setSelected(item)}
              className={`p-2 rounded-lg cursor-pointer transition ${
                selected?.documentId === item.documentId
                  ? "bg-indigo-500 text-white"
                  : "hover:bg-gray-600 text-white"
              }`}
            >
              {item.titre}
            </li>
          ))}
        </ul>
      )}

      {selected && (
        <button
          onClick={handleAdd}
          disabled={adding}
          className="w-full mt-2 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-800 rounded-lg text-white font-medium transition flex items-center justify-center gap-2"
        >
          {adding ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : null}
          {adding ? "Ajout en cours..." : `Ajouter ce ${type}`}
        </button>
      )}

      {message && (
        <div className={`flex items-center gap-2 text-sm px-3 py-2 rounded-lg ${
          message.type === "success"
            ? "bg-green-900/30 text-green-400"
            : "bg-red-900/30 text-red-400"
        }`}>
          {message.type === "success" ? (
            <CheckCircle className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{message.text}</span>
          <button
            onClick={() => setMessage(null)}
            className="ml-auto hover:opacity-70"
            aria-label="Fermer le message"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};

export default TagGenreSearch;
