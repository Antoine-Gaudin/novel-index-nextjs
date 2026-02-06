"use client";

import { useState } from "react";
import VosAbonnements from "./VosAbonnements";
import VosCategories from "./VosCategories";


const Bibliotheque = ({ user }) => {
  const [onglet, setOnglet] = useState("abonnements");

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-white">📚 Votre Bibliothèque</h1>
        <p className="text-gray-400 mt-2">
          Gérez vos œuvres et catégories personnalisées
        </p>
      </div>

      {/* Onglets */}
      <div className="flex justify-center gap-4 mb-8">
        <button
          className={`px-5 py-2 rounded-full font-medium transition ${
            onglet === "abonnements"
              ? "bg-indigo-600 text-white"
              : "bg-gray-700 hover:bg-gray-600 text-gray-200"
          }`}
          onClick={() => setOnglet("abonnements")}
        >
          📖 Vos abonnements
        </button>
        <button
          className={`px-5 py-2 rounded-full font-medium transition ${
            onglet === "bibliotheque"
              ? "bg-indigo-600 text-white"
              : "bg-gray-700 hover:bg-gray-600 text-gray-200"
          }`}
          onClick={() => setOnglet("bibliotheque")}
        >
          Vos cat&eacute;gories
        </button>
      </div>

      {/* Affichage des composants */}
      {onglet === "abonnements" && <VosAbonnements user={user} />}
      {onglet === "bibliotheque" && <VosCategories user={user} />}
    </div>
  );
};

export default Bibliotheque;
