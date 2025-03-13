"use client";

import { useState } from "react";
import IndexeurChapitre from "../indexeur/IndexeurChapitre";
import IndexeurOeuvre from "../indexeur/IndexeurOeuvre";
import IndexeurTeams from "../indexeur/IndexeurTeams";
import IndexeurModification from "../indexeur/IndexeurModification";
import IndexeurProprietaire from "../indexeur/IndexeurPropriétaire";
import TagsGenre from "../indexeur/TagsGenre";

const Indexeur = ({ user }) => {
  const [activeSection, setActiveSection] = useState(null); // Détermine quelle section est active

  const renderContent = () => {
    switch (activeSection) {
      case "IndexeurChapitre":
        return <IndexeurChapitre user={user} />;
      case "IndexeurOeuvre":
        return <IndexeurOeuvre user={user} />;
      case "IndexeurTeams":
        return <IndexeurTeams user={user} />;
      case "IndexeurModification":
        return <IndexeurModification user={user} />;
      case "TagsGenre":
        return <TagsGenre user={user} />;
      case "IndexeurProprietaire":
        return <IndexeurProprietaire user={user} />;
      default:
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Section 1: Indexer des Chapitres */}
            <div className="bg-gray-700 p-4 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-2">Indexer des Chapitres</h2>
              <p className="text-sm text-gray-400">
                Ajouter ou référencer les derniers chapitres pour une œuvre déjà existante.
              </p>
              <button
                className="mt-4 w-full py-2 bg-indigo-600 hover:bg-indigo-700 rounded text-white"
                onClick={() => setActiveSection("IndexeurChapitre")}
              >
                Commencer
              </button>
            </div>

            {/* Section 2: Indexer une Œuvre */}
            <div className="bg-gray-700 p-4 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-2">Indexer une Œuvre</h2>
              <p className="text-sm text-gray-400">
                Ajouter une nouvelle œuvre pour qu'elle soit disponible sur le site.
              </p>
              <button
                className="mt-4 w-full py-2 bg-indigo-600 hover:bg-indigo-700 rounded text-white"
                onClick={() => setActiveSection("IndexeurOeuvre")}
              >
                Commencer
              </button>
            </div>

            {/* Section 3: Indexer une Teams */}
            <div className="bg-gray-700 p-4 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-2">Indexer une Teams</h2>
              <p className="text-sm text-gray-400">
                Référencer une équipe de traduction pour leur permettre de gérer leurs contenus.
              </p>
              <button
                className="mt-4 w-full py-2 bg-indigo-600 hover:bg-indigo-700 rounded text-white"
                onClick={() => setActiveSection("IndexeurTeams")}
              >
                Commencer
              </button>
            </div>

            {/* Section 4: Modification d'œuvre ou de chapitre */}
            <div className="bg-gray-700 p-4 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-2">Modification d'œuvre ou de chapitre</h2>
              <p className="text-sm text-gray-400">
                Modifier les informations d'une œuvre ou d'un chapitre déjà référencé.
              </p>
              <button
                className="mt-4 w-full py-2 bg-indigo-600 hover:bg-indigo-700 rounded text-white"
                onClick={() => setActiveSection("IndexeurModification")}
              >
                Commencer
              </button>
            </div>

            {/* Section 5: Ajouter un Tag et un Genre */}
            <div className="bg-gray-700 p-4 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-2">Ajouter un Tag et un Genre</h2>
              <p className="text-sm text-gray-400">
                Ajouter ou gérer les tags et genres pour mieux classifier les œuvres.
              </p>
              <button
                className="mt-4 w-full py-2 bg-indigo-600 hover:bg-indigo-700 rounded text-white"
                onClick={() => setActiveSection("TagsGenre")}
              >
                Commencer
              </button>
            </div>

            {/* Section 6: Propriétaire d'un site internet */}
            <div className="bg-gray-700 p-4 rounded-lg shadow-md md:col-span-2">
              <h2 className="text-xl font-semibold mb-2">Propriétaire d'un site internet</h2>
              <p className="text-sm text-gray-400">
                Vous êtes propriétaire d'un site ? Réclamez ou mettez à jour les informations pour vos œuvres.
              </p>
              <button
                className="mt-4 w-full py-2 bg-indigo-600 hover:bg-indigo-700 rounded text-white"
                onClick={() => setActiveSection("IndexeurProprietaire")}
              >
                Commencer
              </button>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="w-full max-w-4xl bg-gray-800 p-6 rounded-lg shadow-lg">
      <h1 className="text-3xl font-bold mb-6 text-center">Indexeur</h1>
      {activeSection && (
        <button
          className="mb-4 py-2 px-4 bg-gray-700 hover:bg-gray-600 rounded text-white"
          onClick={() => setActiveSection(null)} // Retour à l'accueil de l'indexeur
        >
          Retour
        </button>
      )}
      {renderContent()}
    </div>
  );
};

export default Indexeur;
