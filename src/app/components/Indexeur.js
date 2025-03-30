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
  ArrowLeft,
} from "lucide-react";

import IndexeurChapitre from "../indexeur/IndexeurChapitre";
import IndexeurOeuvre from "../indexeur/IndexeurOeuvre";
import IndexeurTeams from "../indexeur/IndexeurTeams";
import IndexeurModification from "../indexeur/IndexeurModification";
import IndexeurProprietaire from "../indexeur/IndexeurPropriétaire";
import TagsGenre from "../indexeur/TagsGenre";

const Indexeur = ({ user }) => {
  const [activeSection, setActiveSection] = useState(null);

  const sections = [
    {
      id: "IndexeurChapitre",
      title: "Indexer des Chapitres",
      desc: "Ajouter ou référencer les derniers chapitres pour une œuvre déjà existante.",
      icon: <FileText className="w-5 h-5 mr-2" />,
      component: <IndexeurChapitre user={user} />,
    },
    {
      id: "IndexeurOeuvre",
      title: "Indexer une Œuvre",
      desc: "Ajouter une nouvelle œuvre pour qu'elle soit disponible sur le site.",
      icon: <BookOpen className="w-5 h-5 mr-2" />,
      component: <IndexeurOeuvre user={user} />,
    },
    {
      id: "IndexeurTeams",
      title: "Indexer une Teams",
      desc: "Référencer une équipe de traduction pour leur permettre de gérer leurs contenus.",
      icon: <Users className="w-5 h-5 mr-2" />,
      component: <IndexeurTeams user={user} />,
    },
    {
      id: "IndexeurModification",
      title: "Modification",
      desc: "Modifier les informations d'une œuvre ou d'un chapitre déjà référencé.",
      icon: <PencilLine className="w-5 h-5 mr-2" />,
      component: <IndexeurModification user={user} />,
    },
    {
      id: "TagsGenre",
      title: "Tags & Genres",
      desc: "Ajouter ou gérer les tags et genres pour mieux classifier les œuvres.",
      icon: <Tag className="w-5 h-5 mr-2" />,
      component: <TagsGenre user={user} />,
    },
    {
      id: "IndexeurProprietaire",
      title: "Propriétaire de site",
      desc: "Vous êtes propriétaire d'un site ? Réclamez ou mettez à jour les informations pour vos œuvres.",
      icon: <Globe className="w-5 h-5 mr-2" />,
      component: <IndexeurProprietaire user={user} />,
    },
  ];

  return (
    <div className="w-full max-w-6xl mx-auto p-6 bg-gray-900 text-white rounded-xl shadow-lg">

      {activeSection && (
        <button
          className="mb-4 flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-white transition"
          onClick={() => setActiveSection(null)}
        >
          <ArrowLeft className="w-4 h-4" />
          Retour
        </button>
      )}

      <AnimatePresence mode="wait">
        {!activeSection ? (
          <motion.div
            key="menu"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            {sections.map((s) => (
              <div
                key={s.id}
                className="bg-gray-800 hover:bg-gray-700 p-6 rounded-lg shadow-md transition-all duration-200 group"
              >
                <h2 className="text-xl font-semibold flex items-center mb-2">
                  {s.icon}
                  {s.title}
                </h2>
                <p className="text-sm text-gray-400">{s.desc}</p>
                <button
                  className="mt-4 w-full py-2 bg-indigo-600 hover:bg-indigo-700 rounded text-white font-medium"
                  onClick={() => setActiveSection(s.id)}
                >
                  Commencer
                </button>
              </div>
            ))}
          </motion.div>
        ) : (
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            {sections.find((s) => s.id === activeSection)?.component}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Indexeur;
