"use client";

import { useState } from "react";

export default function FiltreOeuvres({ onFilterChange }) {
  const [filtres, setFiltres] = useState({
    categorie: "",
    langage: "",
    etat: "",
    type: "",
    annee: "",
    licence: "",
    traduction: "",
  });

  const handleChange = (e) => {
    setFiltres({ ...filtres, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onFilterChange(filtres);
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
