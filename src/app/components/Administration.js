import React, { useState } from "react";
import ValidationProprietaire from "../administration/ValidationProprietaire";
import MessageAdministration from "../administration/MessageAdministration";
import AddMaisonEdition from "../administration/AddMaisonEdition";
import AddAchatLivre from "../administration/AddAchatLIvre";

const Administration = () => {
  const [activeSection, setActiveSection] = useState(null);

  const renderContent = () => {
    switch (activeSection) {
      case "ValidationProprietaire":
        return <ValidationProprietaire />;
      case "MessageAdministration":
        return <MessageAdministration />;
      case "AddMaisonEdition":
        return <AddMaisonEdition />;
      case "AddAchatLivre":
        return <AddAchatLivre />;
      default:
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Validation des propriétaires */}
            <div className="bg-gray-700 p-4 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-2">Validation des Propriétaires</h2>
              <p className="text-sm text-gray-400">
                Validez ou refusez les demandes des propriétaires de sites internet.
              </p>
              <button
                className="mt-4 w-full py-2 bg-indigo-600 hover:bg-indigo-700 rounded text-white"
                onClick={() => setActiveSection("ValidationProprietaire")}
              >
                Gérer les validations
              </button>
            </div>

            {/* Messages d'administration */}
            <div className="bg-gray-700 p-4 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-2">Messages d'administration</h2>
              <p className="text-sm text-gray-400">
                Consultez et gérez les messages de différentes sections du site.
              </p>
              <button
                className="mt-4 w-full py-2 bg-indigo-600 hover:bg-indigo-700 rounded text-white"
                onClick={() => setActiveSection("MessageAdministration")}
              >
                Voir les messages
              </button>
            </div>

            {/* Ajouter une maison d'édition */}
            <div className="bg-gray-700 p-4 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-2">Ajouter une maison d'édition</h2>
              <p className="text-sm text-gray-400">
                Ajoutez une nouvelle maison d'édition pour vos projets.
              </p>
              <button
                className="mt-4 w-full py-2 bg-indigo-600 hover:bg-indigo-700 rounded text-white"
                onClick={() => setActiveSection("AddMaisonEdition")}
              >
                Ajouter une maison d'édition
              </button>
            </div>

            {/* Ajouter un achat de livre */}
            <div className="bg-gray-700 p-4 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-2">Ajouter un achat de livre</h2>
              <p className="text-sm text-gray-400">
                Gérez et ajoutez de nouveaux achats de livres dans la base.
              </p>
              <button
                className="mt-4 w-full py-2 bg-indigo-600 hover:bg-indigo-700 rounded text-white"
                onClick={() => setActiveSection("AddAchatLivre")}
              >
                Ajouter un achat de livre
              </button>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto bg-gray-800 p-6 rounded-lg shadow-lg text-white">
      <h1 className="text-3xl font-bold mb-6 text-center">Administration</h1>
      {activeSection && (
        <button
          onClick={() => setActiveSection(null)}
          className="mb-4 py-2 px-4 bg-gray-700 hover:bg-gray-600 rounded text-white"
        >
          Retour
        </button>
      )}
      {renderContent()}
    </div>
  );
};

export default Administration;
