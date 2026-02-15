"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen,
  Link2,
  Hash,
  Layers,
  Plus,
  Check,
  AlertTriangle,
  Zap,
  RefreshCw,
  X,
} from "lucide-react";

const API_URL = "https://novel-index-strapi.onrender.com";

const OneChapitre = ({ user, oeuvre }) => {
  const [formData, setFormData] = useState({
    titre: "",
    tome: "",
    url: "",
    order: "",
  });

  const [message, setMessage] = useState(null);
  const [messageType, setMessageType] = useState("info");
  const [loading, setLoading] = useState(false);
  const [lastAddedChapter, setLastAddedChapter] = useState(null);
  const [quickMode, setQuickMode] = useState(false);

  const titleTemplates = [
    { label: "Chapitre", prefix: "Chapitre " },
    { label: "Ch.", prefix: "Ch. " },
    { label: "Épisode", prefix: "Épisode " },
    { label: "Ep.", prefix: "Ep. " },
  ];
  const [selectedTemplate, setSelectedTemplate] = useState(titleTemplates[0]);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const jwt = localStorage.getItem("jwt");
        if (!jwt || !oeuvre?.documentId) return;

        const res = await axios.get(
          `${API_URL}/api/oeuvres/${oeuvre.documentId}?populate=chapitres`,
          { headers: { Authorization: `Bearer ${jwt}` } }
        );

        const chapitres = res.data.data.chapitres || [];
        let nouvelOrdre = 1;

        if (chapitres.length > 0) {
          const dernier = chapitres.reduce((max, c) => {
            const maxOrder = parseInt(max.order, 10);
            const currentOrder = parseInt(c.order, 10);
            return currentOrder > maxOrder ? c : max;
          });
          nouvelOrdre = parseInt(dernier.order, 10) + 1;
          setLastAddedChapter(dernier);
        }

        setFormData((prev) => ({ ...prev, order: nouvelOrdre }));
      } catch (err) {
        console.error("Erreur récupération ordre :", err);
      }
    };

    fetchOrder();
  }, [oeuvre?.documentId]);

  const showMessage = (msg, type = "info") => {
    setMessage(msg);
    setMessageType(type);
    if (type === "success") {
      setTimeout(() => setMessage(null), 4000);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleQuickFill = () => {
    setFormData((prev) => ({
      ...prev,
      titre: `${selectedTemplate.prefix}${prev.order || 1}`,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const jwt = localStorage.getItem("jwt");

      if (!jwt) {
        showMessage("Vous devez être connecté pour ajouter un chapitre.", "error");
        setLoading(false);
        return;
      }

      // Vérification si l'URL existe déjà
      const urlCheckResponse = await axios.get(
        `${API_URL}/api/chapitres?filters[url][$eq]=${encodeURIComponent(formData.url)}`,
        { headers: { Authorization: `Bearer ${jwt}` } }
      );

      if (urlCheckResponse.data.data.length > 0) {
        showMessage("Cette URL existe déjà. Veuillez en utiliser une autre.", "error");
        setLoading(false);
        return;
      }

      // Récupération des chapitres de l'œuvre
      const oeuvreResponse = await axios.get(
        `${API_URL}/api/oeuvres/${oeuvre.documentId}?populate=chapitres`,
        { headers: { Authorization: `Bearer ${jwt}` } }
      );

      const chapitres = oeuvreResponse.data.data.chapitres;
      let nouvelOrdre = 1;
      let dernierChapitre = null;

      if (chapitres.length > 0) {
        dernierChapitre = chapitres.reduce((maxChapitre, currentChapitre) =>
          currentChapitre.order > maxChapitre.order ? currentChapitre : maxChapitre
        );
        nouvelOrdre = parseInt(dernierChapitre.order, 10) + 1;
      }

      setFormData((prev) => ({ ...prev, order: nouvelOrdre }));

      // Payload
      const payload = {
        data: {
          titre: formData.titre,
          tome: formData.tome,
          url: formData.url,
          order: formData.order,
          oeuvres: [oeuvre.documentId],
          users_permissions_users: [user.documentId],
        },
      };

      await axios.post(`${API_URL}/api/chapitres`, payload, {
        headers: {
          Authorization: `Bearer ${jwt}`,
          "Content-Type": "application/json",
        },
      });

      setLastAddedChapter({ titre: formData.titre, order: formData.order });
      showMessage(`"${formData.titre}" ajouté avec succès !`, "success");
      setFormData({
        titre: "",
        tome: formData.tome,
        url: "",
        order: parseInt(formData.order, 10) + 1,
      });
    } catch (error) {
      console.error("Erreur lors de l'ajout :", error.response?.data || error.message);
      showMessage("Erreur lors de l'ajout du chapitre.", "error");
    }

    setLoading(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="w-full max-w-2xl mx-auto"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-500/20 rounded-lg">
            <BookOpen className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Ajouter un chapitre</h2>
            <p className="text-xs text-gray-500">Prochain ordre : #{formData.order || "..."}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setQuickMode(!quickMode)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            quickMode
              ? "bg-amber-500/20 text-amber-400 ring-1 ring-amber-500/50"
              : "bg-gray-800 text-gray-400 hover:bg-gray-700"
          }`}
        >
          <Zap className="w-3.5 h-3.5" />
          Mode rapide
        </button>
      </div>

      {/* Message Toast */}
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`mb-4 p-3 rounded-lg flex items-center gap-2 text-sm ${
              messageType === "success"
                ? "bg-green-500/20 text-green-400 border border-green-500/30"
                : messageType === "error"
                ? "bg-red-500/20 text-red-400 border border-red-500/30"
                : "bg-blue-500/20 text-blue-400 border border-blue-500/30"
            }`}
          >
            {messageType === "success" ? (
              <Check className="w-4 h-4 flex-shrink-0" />
            ) : messageType === "error" ? (
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            ) : null}
            <span className="flex-1">{message}</span>
            <button onClick={() => setMessage(null)} className="hover:opacity-70">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick Mode Panel */}
      <AnimatePresence>
        {quickMode && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-4 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl"
          >
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-4 h-4 text-amber-400" />
              <span className="text-sm font-medium text-amber-400">Templates de titre</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {titleTemplates.map((template) => (
                <button
                  key={template.label}
                  type="button"
                  onClick={() => {
                    setSelectedTemplate(template);
                    setFormData((prev) => ({
                      ...prev,
                      titre: `${template.prefix}${prev.order || 1}`,
                    }));
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    selectedTemplate.label === template.label
                      ? "bg-amber-500 text-white"
                      : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                  }`}
                >
                  {template.prefix}{formData.order || 1}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Titre */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
            <BookOpen className="w-4 h-4 text-gray-500" />
            Titre du chapitre
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              name="titre"
              value={formData.titre}
              onChange={handleChange}
              className="flex-1 p-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-indigo-500 focus:outline-none transition-colors"
              placeholder="Ex: Chapitre 42"
              required
            />
            {quickMode && (
              <button
                type="button"
                onClick={handleQuickFill}
                className="px-4 bg-gray-700 hover:bg-gray-600 rounded-lg text-gray-300 transition-colors"
                title="Remplir automatiquement"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Tome */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
            <Layers className="w-4 h-4 text-gray-500" />
            Tome
            <span className="text-xs text-gray-500">(optionnel)</span>
          </label>
          <input
            type="text"
            name="tome"
            value={formData.tome}
            onChange={handleChange}
            className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-indigo-500 focus:outline-none transition-colors"
            placeholder="Ex: Tome 1"
          />
        </div>

        {/* URL */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
            <Link2 className="w-4 h-4 text-gray-500" />
            URL du chapitre
          </label>
          <input
            type="url"
            name="url"
            value={formData.url}
            onChange={handleChange}
            className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-indigo-500 focus:outline-none transition-colors"
            placeholder="https://..."
            required
          />
        </div>

        {/* Ordre */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
            <Hash className="w-4 h-4 text-gray-500" />
            Ordre du chapitre
          </label>
          <input
            type="number"
            name="order"
            value={formData.order}
            onChange={handleChange}
            className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-indigo-500 focus:outline-none transition-colors"
            min="1"
          />
        </div>

        {/* Submit */}
        <motion.button
          type="submit"
          disabled={loading}
          whileTap={{ scale: 0.98 }}
          className={`w-full py-3.5 rounded-xl font-semibold text-white flex items-center justify-center gap-2 transition-all ${
            loading
              ? "bg-gray-700 cursor-not-allowed"
              : "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-lg shadow-indigo-500/25"
          }`}
        >
          {loading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              Ajout en cours...
            </>
          ) : (
            <>
              <Plus className="w-4 h-4" />
              Ajouter le chapitre
            </>
          )}
        </motion.button>
      </form>

      {/* Last added info */}
      {lastAddedChapter && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-4 p-3 bg-gray-800/50 border border-gray-700/50 rounded-lg"
        >
          <p className="text-xs text-gray-500 flex items-center gap-2">
            <Check className="w-3 h-3 text-green-400" />
            Dernier ajout : <span className="text-gray-300">{lastAddedChapter.titre}</span>
            <span className="text-gray-600">#{lastAddedChapter.order}</span>
          </p>
        </motion.div>
      )}
    </motion.div>
  );
};

export default OneChapitre;
