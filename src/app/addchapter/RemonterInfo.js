"use client";

import React, { useState } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquareWarning,
  Type,
  FileText,
  AlertTriangle,
  Send,
  Check,
  X,
  RefreshCw,
} from "lucide-react";

const API_URL = "https://novel-index-strapi.onrender.com";

const RemonterInfo = ({ user }) => {
  const [formData, setFormData] = useState({
    titre: "",
    contenu: "",
    signalement: false,
    origine: "Remonter une information (chapitre)",
  });

  const [message, setMessage] = useState(null);
  const [messageType, setMessageType] = useState("info");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const showNotification = (msg, type = "info") => {
    setMessage(msg);
    setMessageType(type);
    if (type === "success") {
      setTimeout(() => setMessage(null), 5000);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const jwt = localStorage.getItem("jwt");

      if (!jwt) {
        showNotification("Vous devez être connecté pour soumettre une information.", "error");
        setLoading(false);
        return;
      }

      const payload = {
        data: {
          titre: formData.titre,
          contenu: formData.contenu,
          signalement: formData.signalement,
          origine: formData.origine,
        },
      };

      await axios.post(`${API_URL}/api/administrations`, payload, {
        headers: {
          Authorization: `Bearer ${jwt}`,
          "Content-Type": "application/json",
        },
      });

      showNotification("Information remontée avec succès !", "success");
      setFormData({
        titre: "",
        contenu: "",
        signalement: false,
        origine: "Remonter une information (chapitre)",
      });
    } catch (error) {
      console.error("Erreur:", error.response?.data || error.message);
      showNotification("Erreur lors de la soumission de l'information.", "error");
    }

    setLoading(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="w-full max-w-2xl mx-auto space-y-6"
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-amber-500/20 rounded-lg">
          <MessageSquareWarning className="w-5 h-5 text-amber-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Remonter une information</h2>
          <p className="text-xs text-gray-500">Signaler un problème ou proposer une suggestion</p>
        </div>
      </div>

      {/* Message */}
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`p-3 rounded-lg flex items-center gap-2 text-sm ${
              messageType === "success"
                ? "bg-green-500/20 text-green-400 border border-green-500/30"
                : "bg-red-500/20 text-red-400 border border-red-500/30"
            }`}
          >
            {messageType === "success" ? <Check className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
            <span className="flex-1">{message}</span>
            <button onClick={() => setMessage(null)}>
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Formulaire */}
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Titre */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
            <Type className="w-4 h-4 text-gray-500" />
            Titre de l'information
          </label>
          <input
            type="text"
            name="titre"
            value={formData.titre}
            onChange={handleChange}
            className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-600 focus:border-amber-500 focus:outline-none"
            placeholder="Ex: Chapitre manquant, lien brisé, erreur de numérotation..."
            required
          />
        </div>

        {/* Contenu */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
            <FileText className="w-4 h-4 text-gray-500" />
            Description détaillée
          </label>
          <textarea
            name="contenu"
            value={formData.contenu}
            onChange={handleChange}
            rows={6}
            className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-600 focus:border-amber-500 focus:outline-none resize-none"
            placeholder="Décrivez le problème en détail : quel chapitre, quelle œuvre, quel est le problème exact..."
            required
          />
          <p className="text-xs text-gray-500 text-right">{formData.contenu.length} caractères</p>
        </div>

        {/* Signalement urgent */}
        <div
          onClick={() => setFormData({ ...formData, signalement: !formData.signalement })}
          className={`p-4 rounded-lg border cursor-pointer transition-all ${
            formData.signalement
              ? "bg-red-500/20 border-red-500/50"
              : "bg-gray-800/50 border-gray-700/50 hover:border-gray-600"
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                formData.signalement
                  ? "bg-red-500 border-red-500"
                  : "border-gray-600"
              }`}
            >
              {formData.signalement && <Check className="w-3 h-3 text-white" />}
            </div>
            <div className="flex-1">
              <p className={`text-sm font-medium ${formData.signalement ? "text-red-400" : "text-gray-300"}`}>
                Signalement urgent
              </p>
              <p className="text-xs text-gray-500">
                À cocher uniquement en cas de problème critique (contenu inapproprié, spam, etc.)
              </p>
            </div>
            <AlertTriangle className={`w-5 h-5 ${formData.signalement ? "text-red-400" : "text-gray-600"}`} />
          </div>
        </div>

        {/* Submit */}
        <motion.button
          type="submit"
          disabled={loading || !formData.titre || !formData.contenu}
          whileTap={{ scale: 0.98 }}
          className={`w-full py-3.5 rounded-xl font-semibold text-white flex items-center justify-center gap-2 transition-all ${
            loading || !formData.titre || !formData.contenu
              ? "bg-gray-700 cursor-not-allowed"
              : formData.signalement
              ? "bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 shadow-lg shadow-red-500/25"
              : "bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 shadow-lg shadow-amber-500/25"
          }`}
        >
          {loading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              Envoi en cours...
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              Envoyer le rapport
            </>
          )}
        </motion.button>
      </form>
    </motion.div>
  );
};

export default RemonterInfo;
