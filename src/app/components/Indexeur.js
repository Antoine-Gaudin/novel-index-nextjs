"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  BookOpen,
  Users,
  PencilLine,
  Tag,
  Globe,
  ChevronRight,
} from "lucide-react";

import IndexeurChapitre from "../indexeur/IndexeurChapitre";
import IndexeurOeuvre from "../indexeur/IndexeurOeuvre";
import IndexeurTeams from "../indexeur/IndexeurTeams";
import IndexeurModification from "../indexeur/IndexeurModification";
import IndexeurProprietaire from "../indexeur/IndexeurPropriétaire";
import TagsGenre from "../indexeur/TagsGenre";

const sections = [
  {
    id: "IndexeurChapitre",
    title: "Chapitres",
    icon: FileText,
  },
  {
    id: "IndexeurOeuvre",
    title: "Oeuvre",
    icon: BookOpen,
  },
  {
    id: "IndexeurTeams",
    title: "Teams",
    icon: Users,
  },
  {
    id: "IndexeurModification",
    title: "Modification",
    icon: PencilLine,
  },
  {
    id: "TagsGenre",
    title: "Tags & Genres",
    icon: Tag,
  },
  {
    id: "IndexeurProprietaire",
    title: "Proprietaire",
    icon: Globe,
  },
];

const Indexeur = ({ user }) => {
  const [activeSection, setActiveSection] = useState(null);

  const renderComponent = () => {
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
        return null;
    }
  };

  const activeTitle = sections.find((s) => s.id === activeSection)?.title;

  return (
    <div className="w-full max-w-6xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
        <button
          onClick={() => setActiveSection(null)}
          className="hover:text-white transition"
        >
          Indexeur
        </button>
        {activeSection && (
          <>
            <ChevronRight className="w-4 h-4" />
            <span className="text-white font-medium">{activeTitle}</span>
          </>
        )}
      </div>

      {/* Tabs horizontaux */}
      <div className="flex flex-wrap gap-2 mb-6 bg-gray-800/50 p-2 rounded-xl">
        {sections.map((s) => {
          const Icon = s.icon;
          const isActive = activeSection === s.id;
          return (
            <button
              key={s.id}
              onClick={() => setActiveSection(s.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive
                  ? "bg-indigo-600 text-white shadow-lg"
                  : "text-gray-400 hover:text-white hover:bg-gray-700/50"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{s.title}</span>
            </button>
          );
        })}
      </div>

      {/* Contenu */}
      <AnimatePresence mode="wait">
        {!activeSection ? (
          <motion.div
            key="welcome"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="text-center py-16"
          >
            <h2 className="text-2xl font-bold text-white mb-3">
              Espace Indexeur
            </h2>
            <p className="text-gray-400 max-w-md mx-auto">
              Selectionnez une section ci-dessus pour commencer a indexer du
              contenu.
            </p>

            {/* Grille rapide pour le premier accès */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-8 max-w-2xl mx-auto">
              {sections.map((s) => {
                const Icon = s.icon;
                return (
                  <button
                    key={s.id}
                    onClick={() => setActiveSection(s.id)}
                    className="flex flex-col items-center gap-2 p-4 bg-gray-800 hover:bg-gray-700 rounded-xl transition group"
                  >
                    <Icon className="w-6 h-6 text-gray-400 group-hover:text-indigo-400 transition" />
                    <span className="text-sm text-gray-300 group-hover:text-white transition">
                      {s.title}
                    </span>
                  </button>
                );
              })}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {renderComponent()}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Indexeur;
