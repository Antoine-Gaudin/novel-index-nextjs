"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  UserCheck,
  Mail,
  BookOpen,
  ShoppingBag,
  ArrowLeft,
} from "lucide-react";

import ValidationProprietaire from "../administration/ValidationProprietaire";
import MessageAdministration from "../administration/MessageAdministration";
import AddMaisonEdition from "../administration/AddMaisonEdition";
import AddAchatLivre from "../administration/AddAchatLIvre";

const Administration = () => {
  const [activeSection, setActiveSection] = useState(null);

  const sections = [
    {
      id: "ValidationProprietaire",
      title: "Validation des Propriétaires",
      desc: "Validez ou refusez les demandes des propriétaires de sites internet.",
      icon: <UserCheck className="w-5 h-5 mr-2" />,
      component: <ValidationProprietaire />,
    },
    {
      id: "MessageAdministration",
      title: "Messages d'administration",
      desc: "Consultez et gérez les messages de différentes sections du site.",
      icon: <Mail className="w-5 h-5 mr-2" />,
      component: <MessageAdministration />,
    },
    {
      id: "AddMaisonEdition",
      title: "Ajouter une maison d'édition",
      desc: "Ajoutez une nouvelle maison d'édition pour vos projets.",
      icon: <BookOpen className="w-5 h-5 mr-2" />,
      component: <AddMaisonEdition />,
    },
    {
      id: "AddAchatLivre",
      title: "Ajouter un achat de livre",
      desc: "Gérez et ajoutez de nouveaux achats de livres dans la base.",
      icon: <ShoppingBag className="w-5 h-5 mr-2" />,
      component: <AddAchatLivre />,
    },
  ];

  return (
    <div className="w-full max-w-6xl mx-auto p-6 bg-gray-900 text-white rounded-xl shadow-lg">
      <h1 className="text-3xl font-bold text-center mb-6">Panneau d'administration</h1>

      {activeSection && (
        <button
          onClick={() => setActiveSection(null)}
          className="mb-4 flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-white transition"
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
            {sections.map((section) => (
              <div
                key={section.id}
                className="bg-gray-800 hover:bg-gray-700 p-6 rounded-lg shadow-md transition-all duration-200 group"
              >
                <h2 className="text-xl font-semibold flex items-center mb-2">
                  {section.icon}
                  {section.title}
                </h2>
                <p className="text-sm text-gray-400">{section.desc}</p>
                <button
                  className="mt-4 w-full py-2 bg-indigo-600 hover:bg-indigo-700 rounded text-white font-medium"
                  onClick={() => setActiveSection(section.id)}
                >
                  Ouvrir
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

export default Administration;
