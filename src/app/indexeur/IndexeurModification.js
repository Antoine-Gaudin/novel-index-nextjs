"use client";

import React, { useState } from "react";
import MoGeneral from "../Modification/MoGeneral";
import MoTeams from "../Modification/MoTeams";

const tabs = [
  { key: "oeuvreChapitre", label: "Oeuvres & Chapitres" },
  { key: "teams", label: "Teams" },
];

const IndexeurModification = ({ user }) => {
  const [activeContent, setActiveContent] = useState("oeuvreChapitre");

  const renderContent = () => {
    switch (activeContent) {
      case "oeuvreChapitre":
        return <MoGeneral user={user} />;
      case "teams":
        return <MoTeams user={user} />;
      default:
        return null;
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto bg-gray-900 p-8 rounded-2xl text-white">
      <h1 className="text-3xl font-bold text-center mb-6">
        Modification des Donnees
      </h1>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 bg-gray-800/50 p-1.5 rounded-lg">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveContent(tab.key)}
            className={`flex-1 py-2.5 rounded-md text-sm font-medium transition-all duration-200 ${
              activeContent === tab.key
                ? "bg-indigo-600 text-white shadow"
                : "text-gray-400 hover:text-white hover:bg-gray-700/50"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Contenu */}
      {renderContent()}
    </div>
  );
};

export default IndexeurModification;
