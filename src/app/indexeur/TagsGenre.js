"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import TagGenreSearch from "./TagGenreSearch";

const TagsGenre = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [oeuvres, setOeuvres] = useState([]);
  const [selectedOeuvre, setSelectedOeuvre] = useState(null);
  const [message, setMessage] = useState(null);
  const [type, setType] = useState("Tag");
  const [valeur, setValeur] = useState("");
  const [tags, setTags] = useState([]);
  const [genres, setGenres] = useState([]);
  const [description, setDescription] = useState("");

  const jwt =
    typeof window !== "undefined" ? localStorage.getItem("jwt") : null;

  // Recherche des œuvres
  const handleSearch = async (e) => {
    e.preventDefault();
    try {
      if (!jwt) {
        setMessage("Vous devez être connecté pour effectuer cette recherche.");
        return;
      }

      const res = await axios.get(
        `https://novel-index-strapi.onrender.com/api/oeuvres?filters[titre][$containsi]=${encodeURIComponent(searchTerm)}&populate=couverture`,
        {
          headers: { Authorization: `Bearer ${jwt}` },
        }
      );
      
      setOeuvres(res.data.data || []);
      setMessage(null);
    } catch (error) {
      console.error("Erreur lors de la recherche :", error);
      setMessage("Erreur lors de la recherche des œuvres.");
    }
  };

  const handleSelectOeuvre = async (oeuvre) => {
    setSelectedOeuvre(oeuvre);
    setMessage(null);

    try {
      const res = await axios.get(
        `https://novel-index-strapi.onrender.com/api/oeuvres/${oeuvre.documentId}?populate[0]=tags&populate[1]=genres`,
        {
          headers: { Authorization: `Bearer ${jwt}` },
        }
      );
      setTags(res.data.data?.tags ?? []);
      setGenres(res.data.data?.genres ?? []);
    } catch (error) {
      console.error("Erreur chargement tags/genres :", error);
      setMessage("Erreur lors du chargement des tags/genres.");
    }
  };

  const handleAdd = async () => {
    if (!valeur.trim()) return;
  
    const endpoint = type === "Tag" ? "tags" : "genres";
  
    if (description.trim().length < 50) {
      setMessage("La description doit contenir au moins 50 caractères, soit environs 10 mots.");
      return;
    }
  
    try {
      // 🔍 Vérification doublon insensible à la casse
      const check = await axios.get(
        `https://novel-index-strapi.onrender.com/api/${endpoint}?filters[titre][$eqi]=${encodeURIComponent(valeur.trim())}`,
        {
          headers: { Authorization: `Bearer ${jwt}` },
        }
      );
  
      if ((check.data.data || []).length > 0) {
        setMessage(`Ce ${type.toLowerCase()} existe déjà dans la base.`);
        return;
      }
  
      // ✅ Création du nouveau tag/genre
      const res = await axios.post(
        `https://novel-index-strapi.onrender.com/api/${endpoint}`,
        {
          data: {
            titre: valeur.trim(),
            description: description.trim(),
            oeuvres: [selectedOeuvre.documentId],
          },
        },
        {
          headers: {
            Authorization: `Bearer ${jwt}`,
          },
        }
      );
  
      if (type === "Tag") setTags((prev) => [...prev, res.data.data]);
      else setGenres((prev) => [...prev, res.data.data]);
  
      setValeur("");
      setDescription("");
      setMessage(`${type} ajouté avec succès !`);
    } catch (error) {
      console.error(`Erreur ajout ${type} :`, error);
      setMessage(`Erreur lors de l'ajout du ${type}.`);
    }
  };
  

  const handleRemoveTag = async (docIdToRemove) => {
    const tag = tags.find((t) => t.documentId === docIdToRemove);
    if (!tag) return;

    try {
      await axios.put(
        `https://novel-index-strapi.onrender.com/api/tags/${docIdToRemove}`,
        {
          data: {
            oeuvres: (tag.oeuvres || [])
              .filter((o) => o.documentId !== selectedOeuvre.documentId)
              .map((o) => o.documentId),
          },
        },
        {
          headers: { Authorization: `Bearer ${jwt}` },
        }
      );

      setTags((prev) => prev.filter((t) => t.documentId !== docIdToRemove));
    } catch (err) {
      console.error("Erreur suppression tag :", err);
    }
  };

  const handleRemoveGenre = async (docIdToRemove) => {
    const genre = genres.find((g) => g.documentId === docIdToRemove);
    if (!genre) return;

    try {
      await axios.put(
        `https://novel-index-strapi.onrender.com/api/genres/${docIdToRemove}`,
        {
          data: {
            oeuvres: (genre.oeuvres || [])
              .filter((o) => o.documentId !== selectedOeuvre.documentId)
              .map((o) => o.documentId),
          },
        },
        {
          headers: { Authorization: `Bearer ${jwt}` },
        }
      );

      setGenres((prev) => prev.filter((g) => g.documentId !== docIdToRemove));
    } catch (err) {
      console.error("Erreur suppression genre :", err);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <h1 className="text-3xl font-bold mb-8 text-center text-white">
        🎯 Gestion des Tags & Genres
      </h1>
  
      {selectedOeuvre && (
        <button
          onClick={() => {
            setSelectedOeuvre(null);
            setTags([]);
            setGenres([]);
            setValeur("");
            setMessage(null);
          }}
          className="mb-6 inline-flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-white transition"
        >
          🔙 Retour à la recherche
        </button>
      )}
  
      {!selectedOeuvre ? (
        <form onSubmit={handleSearch} className="space-y-6">
          <div>
            <label htmlFor="searchTerm" className="block text-sm font-medium text-white mb-1">
              Recherche d'une œuvre
            </label>
            <input
              type="text"
              id="searchTerm"
              name="searchTerm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-white"
              placeholder="Recherchez une œuvre par titre..."
            />
          </div>
          <button
            type="submit"
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-white font-bold transition"
          >
            🔍 Rechercher
          </button>
          {message && <p className="mt-4 text-yellow-400">{message}</p>}
  
          {oeuvres.length > 0 && (
            <ul className="space-y-4">
              {oeuvres.map((oeuvre) => (
                <li
                  key={oeuvre.documentId}
                  className="p-4 bg-gray-800 rounded-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow"
                >
                  <div className="flex items-center gap-4">
                    {oeuvre.couverture?.url ? (
                      <img
                        src={oeuvre.couverture.url}
                        alt={oeuvre.titre}
                        className="w-16 h-24 object-cover rounded-lg border border-gray-700"
                      />
                    ) : (
                      <div className="w-16 h-24 bg-gray-700 flex items-center justify-center text-xs text-white rounded-lg">
                        No Cover
                      </div>
                    )}
                    <span className="font-semibold text-white">{oeuvre.titre}</span>
                  </div>
                  <button
                    onClick={() => handleSelectOeuvre(oeuvre)}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-white font-bold transition"
                  >
                    Sélectionner
                  </button>
                </li>
              ))}
            </ul>
          )}
        </form>
      ) : (
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg space-y-6 text-white">
          <h2 className="text-2xl font-semibold">➕ Ajouter un Tag ou un Genre</h2>
  
          <div className="space-y-4">
            <div>
              <label className="block mb-1">Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full p-3 rounded bg-gray-900 text-white"
              >
                <option value="Tag">Tag</option>
                <option value="Genre">Genre</option>
              </select>
            </div>
  
            <input
              type="text"
              value={valeur}
              onChange={(e) => setValeur(e.target.value)}
              placeholder={`Ajouter un ${type.toLowerCase()}`}
              className="w-full p-3 rounded bg-gray-900 text-white"
            />
  
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Définition du tag ou genre (min. 20 caractères)"
              className="w-full p-3 rounded bg-gray-900 text-white"
              rows={3}
            />
  
            <button
              onClick={handleAdd}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 rounded text-white font-bold transition"
            >
              Ajouter
            </button>
  
            {message && <p className="text-yellow-400">{message}</p>}
          </div>
  
          <div className="grid md:grid-cols-2 gap-6">
            <TagGenreSearch
              type="Tag"
              selectedOeuvre={selectedOeuvre}
              alreadyLinked={tags}
              onSuccess={() => handleSelectOeuvre(selectedOeuvre)}
            />
  
            <TagGenreSearch
              type="Genre"
              selectedOeuvre={selectedOeuvre}
              alreadyLinked={genres}
              onSuccess={() => handleSelectOeuvre(selectedOeuvre)}
            />
          </div>
  
          <div className="grid md:grid-cols-2 gap-6 mt-8">
            <div>
              <h3 className="text-lg font-bold mb-2">🏷 Tags liés</h3>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <div
                    key={tag.documentId}
                    title={tag.description || "Aucune description"}
                    className="flex items-center bg-gray-700 text-white px-3 py-1 rounded-full hover:bg-gray-600 transition"
                  >
                    <span className="text-sm">{tag.titre}</span>
                    <button
                      onClick={() => handleRemoveTag(tag.documentId)}
                      className="ml-2 text-red-400 hover:text-red-600 text-xs"
                      title="Supprimer ce tag"
                    >
                      ❌
                    </button>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-lg font-bold mb-2">📚 Genres liés</h3>
              <div className="flex flex-wrap gap-2">
                {genres.map((genre) => (
                  <div
                    key={genre.documentId}
                    title={genre.description || "Aucune description"}
                    className="flex items-center bg-gray-700 text-white px-3 py-1 rounded-full hover:bg-gray-600 transition"
                  >
                    <span className="text-sm">{genre.titre}</span>
                    <button
                      onClick={() => handleRemoveGenre(genre.documentId)}
                      className="ml-2 text-red-400 hover:text-red-600 text-xs"
                      title="Supprimer ce genre"
                    >
                      ❌
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
  
};

export default TagsGenre;
