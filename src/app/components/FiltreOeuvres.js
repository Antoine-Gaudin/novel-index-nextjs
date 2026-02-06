"use client";

import { useState, useEffect } from "react";

export default function FiltreOeuvres({ onFilterChange }) {
  const [allTags, setAllTags] = useState([]);
  const [allGenres, setAllGenres] = useState([]);
  const [searchTag, setSearchTag] = useState("");
  const [searchGenre, setSearchGenre] = useState("");
  const [filtrerNouveautes, setFiltrerNouveautes] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const resTags = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/tags`
      );
      const resGenres = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/genres`
      );
      const dataTags = await resTags.json();
      const dataGenres = await resGenres.json();
      setAllTags(dataTags.data || []);
      setAllGenres(dataGenres.data || []);
    };

    fetchData();
  }, []);

  const [filtres, setFiltres] = useState({
    categorie: "",
    langage: "",
    etat: "",
    type: "",
    annee: "",
    licence: "",
    traduction: "",
    tags: [],
    genres: [],
  });

  const handleChange = (e) => {
    setFiltres({ ...filtres, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onFilterChange({ ...filtres, nouveautes: filtrerNouveautes });
  };

  const handleReset = () => {
    const emptyFiltres = {
      categorie: "",
      langage: "",
      etat: "",
      type: "",
      annee: "",
      licence: "",
      traduction: "",
      tags: [],
      genres: [],
    };
    setFiltres(emptyFiltres);
    setFiltrerNouveautes(false);
    setSearchTag("");
    setSearchGenre("");
    onFilterChange({ ...emptyFiltres, nouveautes: false });
  };

  // Compte le nombre de filtres actifs
  const activeFiltersCount = [
    filtres.categorie,
    filtres.langage,
    filtres.etat,
    filtres.type,
    filtres.annee,
    filtres.licence,
    filtres.traduction,
    filtrerNouveautes,
  ].filter(Boolean).length + filtres.tags.length + filtres.genres.length;

  return (
    <div className="bg-gray-800 rounded-xl mb-8 overflow-hidden">
      {/* En-tête avec résumé des filtres actifs */}
      <div 
        className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-750"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <span className="text-lg font-medium text-white">🔍 Filtres</span>
          {activeFiltersCount > 0 && (
            <span className="bg-indigo-600 text-white text-xs px-2 py-1 rounded-full">
              {activeFiltersCount} actif{activeFiltersCount > 1 ? "s" : ""}
            </span>
          )}
          {/* Badges des filtres actifs */}
          <div className="hidden md:flex flex-wrap gap-1">
            {filtres.categorie && (
              <span className="bg-gray-700 text-gray-300 text-xs px-2 py-0.5 rounded">{filtres.categorie}</span>
            )}
            {filtres.type && (
              <span className="bg-gray-700 text-gray-300 text-xs px-2 py-0.5 rounded">{filtres.type}</span>
            )}
            {filtres.etat && (
              <span className="bg-gray-700 text-gray-300 text-xs px-2 py-0.5 rounded">{filtres.etat}</span>
            )}
            {filtrerNouveautes && (
              <span className="bg-green-600 text-white text-xs px-2 py-0.5 rounded">🆕 Nouveautés</span>
            )}
          </div>
        </div>
        <span className="text-gray-400 text-xl">{isExpanded ? "▲" : "▼"}</span>
      </div>

      {/* Formulaire de filtres (collapsible) */}
      {isExpanded && (
        <form onSubmit={handleSubmit} className="p-6 pt-2 border-t border-gray-700">
          {/* Boutons rapides */}
          <div className="flex flex-wrap gap-2 mb-6">
            <button
              type="button"
              onClick={() => setFiltrerNouveautes((prev) => !prev)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                filtrerNouveautes
                  ? "bg-green-600 text-white"
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              }`}
            >
              {filtrerNouveautes ? "✅ Nouveautés du mois" : "🆕 Nouveautés du mois"}
            </button>
            {activeFiltersCount > 0 && (
              <button
                type="button"
                onClick={handleReset}
                className="px-4 py-2 rounded-full text-sm font-medium bg-red-600/20 text-red-400 hover:bg-red-600/30 transition"
              >
                ✕ Réinitialiser les filtres
              </button>
            )}
          </div>

          {/* Grille des filtres principaux */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
            <div>
              <label className="block text-xs text-gray-400 mb-1">📂 Catégorie</label>
              <select
                name="categorie"
                value={filtres.categorie}
                onChange={handleChange}
                className="bg-gray-700 text-white rounded p-2 w-full"
              >
                <option value="">Toutes catégories</option>
                <option value="Shonen">Shonen</option>
                <option value="Seinen">Seinen</option>
                <option value="Shojo">Shojo</option>
                <option value="Isekai">Isekai</option>
              </select>
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1">🌐 Langue</label>
              <select
                name="langage"
                value={filtres.langage}
                onChange={handleChange}
                className="bg-gray-700 text-white rounded p-2 w-full"
              >
                <option value="">Toutes langues</option>
                <option value="Francais">Français</option>
                <option value="Anglais">Anglais</option>
                <option value="Autre">Autre</option>
              </select>
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1">📊 État</label>
              <select
                name="etat"
                value={filtres.etat}
                onChange={handleChange}
                className="bg-gray-700 text-white rounded p-2 w-full"
              >
                <option value="">Tous états</option>
                <option value="En cours">En cours</option>
                <option value="Abandonnée">Abandonnée</option>
                <option value="Terminé">Terminé</option>
                <option value="En pause">En pause</option>
                <option value="En attente">En attente</option>
                <option value="Libre">Libre</option>
              </select>
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1">📚 Type</label>
              <select
                name="type"
                value={filtres.type}
                onChange={handleChange}
                className="bg-gray-700 text-white rounded p-2 w-full"
              >
                <option value="">Tous types</option>
                <option value="Light novel">Light novel</option>
                <option value="Web novel">Web novel</option>
                <option value="Scan">Scan</option>
                <option value="Webtoon">Webtoon</option>
              </select>
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1">📅 Année</label>
              <input
                type="number"
                name="annee"
                placeholder="Ex : 2024"
                value={filtres.annee}
                onChange={handleChange}
                className="bg-gray-700 text-white rounded p-2 w-full"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1">📜 Licence</label>
              <select
                name="licence"
                value={filtres.licence}
                onChange={handleChange}
                className="bg-gray-700 text-white rounded p-2 w-full"
              >
                <option value="">Toutes licences</option>
                <option value="true">Avec licence</option>
                <option value="false">Sans licence</option>
              </select>
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1">✍️ Traducteur</label>
              <input
                type="text"
                name="traduction"
                placeholder="Nom du traducteur"
                value={filtres.traduction}
                onChange={handleChange}
                className="bg-gray-700 text-white rounded p-2 w-full"
              />
            </div>
          </div>

          {/* FILTRE TAGS */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-indigo-400 mb-2">
              🏷️ Tags
            </label>
            <input
              type="text"
              placeholder="Rechercher un tag..."
              value={searchTag}
              onChange={(e) => setSearchTag(e.target.value)}
              className="bg-gray-700 text-white rounded p-2 w-full mb-3"
            />

            {/* Tags sélectionnés */}
            {filtres.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {filtres.tags.map((tagName) => (
                  <span
                    key={`selected-${tagName}`}
                    className="bg-indigo-600 text-white px-3 py-1 rounded-full text-sm flex items-center"
                  >
                    {tagName}
                    <button
                      type="button"
                      onClick={() =>
                        setFiltres((prev) => ({
                          ...prev,
                          tags: prev.tags.filter((t) => t !== tagName),
                        }))
                      }
                      className="ml-2 text-xs hover:text-red-300"
                    >
                      ✕
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Tags disponibles (triés alphabétiquement) */}
            <div className="flex flex-wrap gap-2">
              {allTags
                .filter(
                  (tag) =>
                    tag.titre.toLowerCase().includes(searchTag.toLowerCase()) &&
                    !filtres.tags.includes(tag.titre)
                )
                .sort((a, b) => a.titre.localeCompare(b.titre))
                .slice(0, 20)
                .map((tag) => (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() =>
                      setFiltres((prev) => ({
                        ...prev,
                        tags: [...prev.tags, tag.titre],
                      }))
                    }
                    className="px-3 py-1 rounded-full text-sm bg-gray-700 text-gray-300 hover:bg-indigo-500 hover:text-white transition"
                    title={tag.description}
                  >
                    {tag.titre}
                  </button>
                ))}
            </div>
            <div className="mt-3">
              <button
                type="button"
                onClick={() => window.open("/tags-genres/tag", "_blank")}
                className="text-indigo-400 hover:text-indigo-300 text-sm underline"
              >
                Voir tous les tags →
              </button>
            </div>
          </div>

          {/* FILTRE GENRES */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-pink-400 mb-2">
              📚 Genres
            </label>
            <input
              type="text"
              placeholder="Rechercher un genre..."
              value={searchGenre}
              onChange={(e) => setSearchGenre(e.target.value)}
              className="bg-gray-700 text-white rounded p-2 w-full mb-3"
            />

            {/* Genres sélectionnés */}
            {filtres.genres.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {filtres.genres.map((genreName) => (
                  <span
                    key={`selected-${genreName}`}
                    className="bg-pink-600 text-white px-3 py-1 rounded-full text-sm flex items-center"
                  >
                    {genreName}
                    <button
                      type="button"
                      onClick={() =>
                        setFiltres((prev) => ({
                          ...prev,
                          genres: prev.genres.filter((g) => g !== genreName),
                        }))
                      }
                      className="ml-2 text-xs hover:text-red-300"
                    >
                      ✕
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Genres disponibles (triés alphabétiquement) */}
            <div className="flex flex-wrap gap-2">
              {allGenres
                .filter(
                  (genre) =>
                    genre.titre
                      .toLowerCase()
                      .includes(searchGenre.toLowerCase()) &&
                    !filtres.genres.includes(genre.titre)
                )
                .sort((a, b) => a.titre.localeCompare(b.titre))
                .slice(0, 20)
                .map((genre) => (
                  <button
                    key={genre.id}
                    type="button"
                    onClick={() =>
                      setFiltres((prev) => ({
                        ...prev,
                        genres: [...prev.genres, genre.titre],
                      }))
                    }
                    className="px-3 py-1 rounded-full text-sm bg-gray-700 text-gray-300 hover:bg-pink-500 hover:text-white transition"
                    title={genre.description}
                  >
                    {genre.titre}
                  </button>
                ))}
            </div>
            <div className="mt-3">
              <button
                type="button"
                onClick={() => window.open("/tags-genres/genre", "_blank")}
                className="text-pink-400 hover:text-pink-300 text-sm underline"
              >
                Voir tous les genres →
              </button>
            </div>
          </div>

          {/* Bouton submit */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-700">
            <button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded-lg font-medium transition duration-200 flex items-center gap-2"
            >
              <span>✓</span> Appliquer les filtres
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
