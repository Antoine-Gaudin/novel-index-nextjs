"use client";

import { useState, useEffect } from "react";

export default function FiltreOeuvres({ onFilterChange }) {
  const [allTags, setAllTags] = useState([]);
  const [allGenres, setAllGenres] = useState([]);
  const [searchTag, setSearchTag] = useState("");
  const [searchGenre, setSearchGenre] = useState("");
  const [filtrerNouveautes, setFiltrerNouveautes] = useState(false);

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

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-gray-800 p-6 rounded-xl mb-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
    >
      <select
        name="categorie"
        value={filtres.categorie}
        onChange={handleChange}
        className="bg-gray-700 text-white rounded p-2"
      >
        <option value="">Toutes catégories</option>
        <option value="Shonen">Shonen</option>
        <option value="Seinen">Seinen</option>
        <option value="Shojo">Shojo</option>
        <option value="Isekai">Isekai</option>
      </select>

      <select
        name="langage"
        value={filtres.langage}
        onChange={handleChange}
        className="bg-gray-700 text-white rounded p-2"
      >
        <option value="">Toutes langues</option>
        <option value="Francais">Français</option>
        <option value="Anglais">Anglais</option>
        <option value="Autre">Autre</option>
      </select>

      <select
        name="etat"
        value={filtres.etat}
        onChange={handleChange}
        className="bg-gray-700 text-white rounded p-2"
      >
        <option value="">Tous états</option>
        <option value="En cours">En cours</option>
        <option value="Abandonnée">Abandonnée</option>
        <option value="Terminé">Terminé</option>
        <option value="En pause">En pause</option>
        <option value="En attente">En attente</option>
        <option value="Libre">Libre</option>
      </select>

      <select
        name="type"
        value={filtres.type}
        onChange={handleChange}
        className="bg-gray-700 text-white rounded p-2"
      >
        <option value="">Tous types</option>
        <option value="Light novel">Light novel</option>
        <option value="Web novel">Web novel</option>
        <option value="Scan">Scan</option>
        <option value="Webtoon">Webtoon</option>
      </select>

      <input
        type="number"
        name="annee"
        placeholder="Année (ex : 2024)"
        value={filtres.annee}
        onChange={handleChange}
        className="bg-gray-700 text-white rounded p-2"
      />
      <select
        name="licence"
        value={filtres.licence}
        onChange={handleChange}
        className="bg-gray-700 text-white rounded p-2"
      >
        <option value="">Toutes licences</option>
        <option value="true">Avec licence</option>
        <option value="false">Sans licence</option>
      </select>

      <input
        type="text"
        name="traduction"
        placeholder="Traduction"
        value={filtres.traduction}
        onChange={handleChange}
        className="bg-gray-700 text-white rounded p-2"
      />

<div className="col-span-full">
        <button
          type="button"
          onClick={() => {
            setFiltrerNouveautes((prev) => !prev);
          }}
          className={`px-4 py-2 rounded mb-4 ${
            filtrerNouveautes
              ? "bg-indigo-600 text-white"
              : "bg-gray-700 text-white hover:bg-gray-600"
          }`}
        >
          {filtrerNouveautes
            ? "✅ Nouveautés du mois activé"
            : "🔄 Afficher les nouveautés du mois"}
        </button>
      </div>

      <div className="col-span-full">
        {/* FILTRE TAGS */}
        <div className="col-span-full">
          <label className="block mb-2 text-sm font-medium text-white">
            Tags
          </label>
          <input
            type="text"
            placeholder="Rechercher un tag..."
            value={searchTag}
            onChange={(e) => setSearchTag(e.target.value)}
            className="bg-gray-700 text-white rounded p-2 w-full mb-4"
          />

          <div className="flex flex-wrap gap-2 mb-4">
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

          <div className="flex flex-wrap gap-2">
            {allTags
              .filter(
                (tag) =>
                  tag.titre.toLowerCase().includes(searchTag.toLowerCase()) &&
                  !filtres.tags.includes(tag.titre)
              )
              .sort(() => 0.5 - Math.random())
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
                  className="px-3 py-1 rounded-full text-sm bg-gray-700 text-white hover:bg-indigo-500 transition"
                  title={tag.description}
                >
                  {tag.titre}
                </button>
              ))}
          </div>
          <div className="mt-4">
            <button
              type="button"
              onClick={() => window.open("/tags-genres/tag", "_blank")}
              className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded"
            >
              Voir tous les tags
            </button>
          </div>
        </div>

        {/* FILTRE GENRES */}
        <div className="col-span-full mt-6">
          <label className="block mb-2 text-sm font-medium text-white">
            Genres
          </label>
          <input
            type="text"
            placeholder="Rechercher un genre..."
            value={searchGenre}
            onChange={(e) => setSearchGenre(e.target.value)}
            className="bg-gray-700 text-white rounded p-2 w-full mb-4"
          />

          <div className="flex flex-wrap gap-2 mb-4">
            {filtres.genres.map((genreName) => (
              <span
                key={`selected-${genreName}`}
                className="bg-indigo-600 text-white px-3 py-1 rounded-full text-sm flex items-center"
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

          <div className="flex flex-wrap gap-2">
            {allGenres
              .filter(
                (genre) =>
                  genre.titre
                    .toLowerCase()
                    .includes(searchGenre.toLowerCase()) &&
                  !filtres.genres.includes(genre.titre)
              )
              .sort(() => 0.5 - Math.random())
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
                  className="px-3 py-1 rounded-full text-sm bg-gray-700 text-white hover:bg-indigo-500 transition"
                  title={genre.description}
                >
                  {genre.titre}
                </button>
              ))}
          </div>
          <div className="mt-4">
            <button
              type="button"
              onClick={() => window.open("/tags-genres/genre", "_blank")}
              className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded"
            >
              Voir tous les genres
            </button>
          </div>
        </div>
      </div>

      <div className="col-span-full flex justify-end">
        <button
          type="submit"
          className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded transition duration-200"
        >
          Appliquer les filtres
        </button>
      </div>
    </form>
  );
}
