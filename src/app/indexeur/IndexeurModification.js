"use client";

import React, { useState } from "react";
import MoGeneral from "../Modification/MoGeneral"; // Import du composant pour "Œuvre et Chapitre"
import MoTeams from "../Modification/MoTeams"; // Import du composant pour "Teams"

const IndexeurModification = ({ user }) => {
  const [activeContent, setActiveContent] = useState(null); // Gère le contenu affiché

  const renderContent = () => {
    switch (activeContent) {
      case "oeuvreChapitre":
        return <MoGeneral user={user} />;
      case "teams":
        return <MoTeams user={user} />;
      default:
        return <p className="text-gray-300">Veuillez sélectionner une section pour commencer.</p>;
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto bg-gray-800 p-6 rounded-lg shadow-lg text-white space-y-8">
      <h1 className="text-3xl font-bold mb-6 text-center">Indexeur de Modifications</h1>

      {/* Affichage des menus uniquement si aucun contenu n'est actif */}
      {!activeContent && (
        <>
          {/* Section : Modification Œuvre et Chapitre */}
          <div className="p-4 bg-gray-700 rounded-lg">
            <h2 className="text-2xl font-bold mb-4">Modification Œuvre et Chapitre</h2>
            <p className="mb-4 text-gray-300">
              Ici, vous pouvez modifier les informations concernant vos œuvres et chapitres existants.
            </p>
            <button
              onClick={() => setActiveContent("oeuvreChapitre")}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-white font-bold"
            >
              Modifier Œuvres et Chapitres
            </button>
          </div>

          {/* Section : Modification Teams */}
          <div className="p-4 bg-gray-700 rounded-lg">
            <h2 className="text-2xl font-bold mb-4">Modification Teams</h2>
            <p className="mb-4 text-gray-300">
              Accédez à la gestion et modification des informations liées aux teams et leurs liens associés.
            </p>
            <button
              onClick={() => setActiveContent("teams")}
              className="w-full py-3 bg-green-600 hover:bg-green-700 rounded-lg text-white font-bold"
            >
              Modifier Teams
            </button>
          </div>
        </>
      )}

      {/* Contenu rendu dynamiquement */}
      {activeContent && (
        <div className="p-4 bg-gray-800 mt-6 rounded-lg shadow-lg">
          {renderContent()}
        </div>
      )}
    </div>
  );
};

export default IndexeurModification;
