"use client";

import React, { useState } from "react";
import MoGeneral from "../Modification/MoGeneral";
import MoTeams from "../Modification/MoTeams";

const IndexeurModification = ({ user }) => {
  const [activeContent, setActiveContent] = useState(null);

  const renderContent = () => {
    switch (activeContent) {
      case "oeuvreChapitre":
        return <MoGeneral user={user} />;
      case "teams":
        return <MoTeams user={user} />;
      default:
        return (
          <p className="text-center text-gray-400 text-sm">
            Sélectionnez une section pour commencer.
          </p>
        );
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto bg-gray-900 p-8 rounded-2xl shadow-2xl text-white space-y-8">
      <h1 className="text-3xl font-bold text-center">🛠️ Modification des Données</h1>

      {/* Menu de sélection */}
      {!activeContent && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Carte Œuvres */}
          <div className="bg-gray-800 p-6 rounded-xl shadow hover:shadow-lg transition">
            <h2 className="text-xl font-semibold mb-2">📖 Modifier Œuvres & Chapitres</h2>
            <p className="text-sm text-gray-400 mb-4">
              Gérez les informations des œuvres et chapitres déjà référencés.
            </p>
            <button
              onClick={() => setActiveContent("oeuvreChapitre")}
              className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg font-semibold transition"
            >
              Accéder à la modification
            </button>
          </div>

          {/* Carte Teams */}
          <div className="bg-gray-800 p-6 rounded-xl shadow hover:shadow-lg transition">
            <h2 className="text-xl font-semibold mb-2">👥 Modifier les Teams</h2>
            <p className="text-sm text-gray-400 mb-4">
              Mettez à jour les informations des équipes de traduction.
            </p>
            <button
              onClick={() => setActiveContent("teams")}
              className="w-full py-2 bg-green-600 hover:bg-green-700 rounded-lg font-semibold transition"
            >
              Accéder à la modification
            </button>
          </div>
        </div>
      )}

      {/* Section active */}
      {activeContent && (
        <div className="bg-gray-800 p-6 rounded-xl shadow-lg">
          <div className="mb-4 flex justify-end">
            <button
              onClick={() => setActiveContent(null)}
              className="text-sm px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-full transition"
            >
              ⬅️ Retour
            </button>
          </div>
          {renderContent()}
        </div>
      )}
    </div>
  );
};

export default IndexeurModification;
