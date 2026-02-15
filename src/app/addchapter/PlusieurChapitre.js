"use client";

import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookCopy,
  Wand2,
  Link2,
  Hash,
  Layers,
  Check,
  AlertTriangle,
  RefreshCw,
  X,
  ChevronDown,
  ChevronUp,
  Copy,
  ArrowRight,
  FileText,
  Trash2,
  Eye,
  EyeOff,
  Sparkles,
} from "lucide-react";

const API_URL = "https://novel-index-strapi.onrender.com";

const PlusieursChapitre = ({ user, oeuvre }) => {
  const [chapitres, setChapitres] = useState("");
  const [message, setMessage] = useState(null);
  const [messageType, setMessageType] = useState("info");
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showConstructeur, setShowConstructeur] = useState(false);
  const [dernierOrder, setDernierOrder] = useState(0);
  const [showPreview, setShowPreview] = useState(false);

  // Constructeur d'URL states
  const [startTitle, setStartTitle] = useState("");
  const [endTitle, setEndTitle] = useState("");
  const [urlPattern, setUrlPattern] = useState("");
  const [tome, setTome] = useState("");
  const [titlePrefix, setTitlePrefix] = useState("Chapitre ");

  const titlePrefixes = [
    { label: "Chapitre", value: "Chapitre " },
    { label: "Ch.", value: "Ch. " },
    { label: "Épisode", value: "Épisode " },
    { label: "Ep.", value: "Ep. " },
  ];

  const handleChange = (e) => {
    setChapitres(e.target.value);
  };

  const showNotification = (msg, type = "info") => {
    setMessage(msg);
    setMessageType(type);
    if (type === "success") {
      setTimeout(() => setMessage(null), 5000);
    }
  };

  useEffect(() => {
    const fetchLastOrder = async () => {
      try {
        const jwt = localStorage.getItem("jwt");
        if (!jwt || !oeuvre?.documentId) return;

        const res = await axios.get(
          `${API_URL}/api/oeuvres/${oeuvre.documentId}?populate=chapitres`,
          { headers: { Authorization: `Bearer ${jwt}` } }
        );

        const chapitres = res.data.data.chapitres || [];

        if (chapitres.length === 0) return;

        const dernierChapitre = chapitres.reduce((maxChapitre, currentChapitre) => {
          const maxOrder = parseInt(maxChapitre.order || 0, 10);
          const currOrder = parseInt(currentChapitre.order || 0, 10);
          return currOrder > maxOrder ? currentChapitre : maxChapitre;
        });

        const foundOrder = parseInt(dernierChapitre.order, 10);
        setDernierOrder(foundOrder);
      } catch (error) {
        console.error("Erreur dans le fetch de dernier order :", error.message);
      }
    };

    fetchLastOrder();
  }, [oeuvre?.documentId]);

  // Parse et preview des chapitres
  const parsedChapters = useMemo(() => {
    const lignes = chapitres.split("\n").map((l) => l.trim()).filter((l) => l);
    return lignes.map((ligne, index) => {
      const parts = ligne.split(";").map((p) => p.trim());
      if (parts.length < 2 || parts.length > 3) {
        return { error: true, raw: ligne, index: index + 1 };
      }
      const [titre, tomeOrUrl, url] = parts;
      return {
        error: false,
        titre,
        tome: parts.length === 3 ? tomeOrUrl : "",
        url: parts.length === 3 ? url : tomeOrUrl,
        order: dernierOrder + index + 1,
      };
    });
  }, [chapitres, dernierOrder]);

  const validCount = parsedChapters.filter((c) => !c.error).length;
  const errorCount = parsedChapters.filter((c) => c.error).length;

  // Générateur de chapitres
  const handleGenerate = () => {
    const startNumber = parseInt(startTitle, 10);
    const endNumber = parseInt(endTitle, 10);

    if (isNaN(startNumber) || isNaN(endNumber) || startNumber > endNumber) {
      showNotification("Les numéros de début et fin doivent être valides.", "error");
      return;
    }

    if (!urlPattern.includes("{n}")) {
      showNotification("Le modèle d'URL doit contenir {n} pour le numéro.", "error");
      return;
    }

    const chapters = [];
    for (let i = startNumber; i <= endNumber; i++) {
      const generatedUrl = urlPattern.replace(/{n}/g, i);
      if (tome) {
        chapters.push(`${titlePrefix}${i} ; ${tome} ; ${generatedUrl}`);
      } else {
        chapters.push(`${titlePrefix}${i} ; ${generatedUrl}`);
      }
    }

    // Ajouter au textarea existant ou remplacer
    if (chapitres.trim()) {
      setChapitres((prev) => prev + "\n" + chapters.join("\n"));
    } else {
      setChapitres(chapters.join("\n"));
    }

    showNotification(`${chapters.length} chapitres générés et ajoutés !`, "success");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setProgress(0);
    setMessage(null);

    try {
      const jwt = localStorage.getItem("jwt");

      if (!jwt) {
        showNotification("Vous devez être connecté pour ajouter des chapitres.", "error");
        setLoading(false);
        return;
      }

      const lignes = chapitres.split("\n").map((ligne) => ligne.trim()).filter((ligne) => ligne);

      if (lignes.length === 0) {
        showNotification("Aucun chapitre n'a été saisi.", "error");
        setLoading(false);
        return;
      }

      // Récupération des chapitres existants
      const oeuvreResponse = await axios.get(
        `${API_URL}/api/oeuvres/${oeuvre.documentId}?populate=chapitres`,
        { headers: { Authorization: `Bearer ${jwt}` } }
      );

      const chapitresExistants = oeuvreResponse.data.data.chapitres || [];
      const urlsExistantes = chapitresExistants.map((chapitre) => chapitre.url);

      const payloads = [];
      const errors = [];

      lignes.forEach((ligne, index) => {
        const parts = ligne.split(";").map((part) => part.trim());

        if (parts.length < 2 || parts.length > 3) {
          errors.push(`Ligne ${index + 1}: Format invalide`);
          return;
        }

        const [titre, tomeOrUrl, url] = parts;
        const tomeVal = parts.length === 3 ? tomeOrUrl : "";
        const finalUrl = parts.length === 3 ? url : tomeOrUrl;

        if (urlsExistantes.includes(finalUrl)) {
          errors.push(`Ligne ${index + 1}: URL déjà existante`);
          return;
        }

        payloads.push({
          data: {
            titre,
            tome: tomeVal,
            url: finalUrl,
            order: dernierOrder + payloads.length + 1,
            oeuvres: [oeuvre.documentId],
            users_permissions_users: [user.documentId],
          },
        });
      });

      let successCount = 0;

      for (let i = 0; i < payloads.length; i++) {
        await axios.post(`${API_URL}/api/chapitres`, payloads[i], {
          headers: {
            Authorization: `Bearer ${jwt}`,
            "Content-Type": "application/json",
          },
        });

        successCount++;
        setProgress(((successCount / payloads.length) * 100).toFixed(0));

        if (successCount % 80 === 0) {
          await new Promise((resolve) => setTimeout(resolve, 5000));
        }
      }

      let successMessage = `${successCount} chapitres ajoutés !`;
      if (errors.length > 0) {
        successMessage += ` (${errors.length} erreur(s))`;
        setMessageType("warning");
      } else {
        setMessageType("success");
      }

      showNotification(successMessage, errors.length > 0 ? "warning" : "success");
      setChapitres("");
      setDernierOrder(dernierOrder + successCount);
    } catch (error) {
      console.error("Erreur lors de l'ajout :", error.response?.data || error.message);
      showNotification("Erreur lors de l'ajout des chapitres.", "error");
    }

    setLoading(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="w-full max-w-4xl mx-auto space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-500/20 rounded-lg">
            <BookCopy className="w-5 h-5 text-green-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Ajouter plusieurs chapitres</h2>
            <p className="text-xs text-gray-500">Dernier ordre : #{dernierOrder || 0}</p>
          </div>
        </div>

        {chapitres.trim() && (
          <div className="flex items-center gap-2 text-xs">
            <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded">
              {validCount} valide(s)
            </span>
            {errorCount > 0 && (
              <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded">
                {errorCount} erreur(s)
              </span>
            )}
          </div>
        )}
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
                : messageType === "error"
                ? "bg-red-500/20 text-red-400 border border-red-500/30"
                : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
            }`}
          >
            {messageType === "success" ? <Check className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
            <span className="flex-1 whitespace-pre-line">{message}</span>
            <button onClick={() => setMessage(null)}>
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Constructeur d'URL */}
      <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl overflow-hidden">
        <button
          type="button"
          onClick={() => setShowConstructeur(!showConstructeur)}
          className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-800 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Wand2 className="w-4 h-4 text-purple-400" />
            <span className="font-medium text-white">Générateur de chapitres</span>
            <span className="text-xs text-gray-500">Créez des séries rapidement</span>
          </div>
          {showConstructeur ? (
            <ChevronUp className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          )}
        </button>

        <AnimatePresence>
          {showConstructeur && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-t border-gray-700/50"
            >
              <div className="p-4 space-y-4">
                {/* Template de titre */}
                <div>
                  <label className="block text-xs text-gray-400 mb-2">Préfixe du titre</label>
                  <div className="flex flex-wrap gap-2">
                    {titlePrefixes.map((t) => (
                      <button
                        key={t.value}
                        type="button"
                        onClick={() => setTitlePrefix(t.value)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          titlePrefix === t.value
                            ? "bg-purple-500 text-white"
                            : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Numéros début/fin */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-400 mb-2">De</label>
                    <input
                      type="number"
                      value={startTitle}
                      onChange={(e) => setStartTitle(e.target.value)}
                      className="w-full p-2.5 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm focus:border-purple-500 focus:outline-none"
                      placeholder="1"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-2">À</label>
                    <input
                      type="number"
                      value={endTitle}
                      onChange={(e) => setEndTitle(e.target.value)}
                      className="w-full p-2.5 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm focus:border-purple-500 focus:outline-none"
                      placeholder="10"
                    />
                  </div>
                </div>

                {/* Pattern URL */}
                <div>
                  <label className="block text-xs text-gray-400 mb-2">
                    Modèle d'URL <code className="text-purple-400">{"{n}"}</code> = numéro
                  </label>
                  <input
                    type="text"
                    value={urlPattern}
                    onChange={(e) => setUrlPattern(e.target.value)}
                    className="w-full p-2.5 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm placeholder-gray-600 focus:border-purple-500 focus:outline-none"
                    placeholder="https://site.com/novel/chapitre-{n}"
                  />
                </div>

                {/* Tome optionnel */}
                <div>
                  <label className="block text-xs text-gray-400 mb-2">Tome (optionnel)</label>
                  <input
                    type="text"
                    value={tome}
                    onChange={(e) => setTome(e.target.value)}
                    className="w-full p-2.5 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm placeholder-gray-600 focus:border-purple-500 focus:outline-none"
                    placeholder="Tome 1"
                  />
                </div>

                {/* Preview */}
                {startTitle && endTitle && urlPattern.includes("{n}") && (
                  <div className="p-3 bg-gray-900/50 rounded-lg border border-gray-700/50">
                    <p className="text-xs text-gray-500 mb-2">Aperçu :</p>
                    <p className="text-sm text-gray-300">
                      {titlePrefix}{startTitle}{tome ? ` ; ${tome}` : ""} ; {urlPattern.replace("{n}", startTitle)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      ... jusqu'à {titlePrefix}{endTitle}
                    </p>
                  </div>
                )}

                {/* Bouton générer */}
                <button
                  type="button"
                  onClick={handleGenerate}
                  className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 rounded-lg text-white font-medium flex items-center justify-center gap-2 transition-all"
                >
                  <Sparkles className="w-4 h-4" />
                  Générer et ajouter à la liste
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Formulaire principal */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Textarea */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
              <FileText className="w-4 h-4 text-gray-500" />
              Liste des chapitres
            </label>
            {chapitres.trim() && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowPreview(!showPreview)}
                  className="text-xs text-gray-400 hover:text-white flex items-center gap-1"
                >
                  {showPreview ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  {showPreview ? "Cacher" : "Prévisualiser"}
                </button>
                <button
                  type="button"
                  onClick={() => setChapitres("")}
                  className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" />
                  Vider
                </button>
              </div>
            )}
          </div>

          <textarea
            value={chapitres}
            onChange={handleChange}
            rows={8}
            className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm placeholder-gray-600 focus:border-green-500 focus:outline-none resize-none font-mono"
            placeholder={`Titre ; URL
Titre ; Tome ; URL

Exemple:
Chapitre 1 ; https://site.com/ch1
Chapitre 2 ; Tome 1 ; https://site.com/ch2`}
            required
          />

          <p className="text-xs text-gray-500 mt-1">
            Format : <code className="text-green-400">Titre ; URL</code> ou{" "}
            <code className="text-green-400">Titre ; Tome ; URL</code>
          </p>
        </div>

        {/* Preview tableau */}
        <AnimatePresence>
          {showPreview && parsedChapters.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-gray-800/50 border border-gray-700/50 rounded-lg overflow-hidden"
            >
              <div className="p-3 border-b border-gray-700/50">
                <p className="text-xs text-gray-400">Prévisualisation ({parsedChapters.length} lignes)</p>
              </div>
              <div className="max-h-48 overflow-y-auto">
                <table className="w-full text-xs">
                  <thead className="bg-gray-900/50 sticky top-0">
                    <tr className="text-left text-gray-500">
                      <th className="px-3 py-2 w-12">#</th>
                      <th className="px-3 py-2">Titre</th>
                      <th className="px-3 py-2">Tome</th>
                      <th className="px-3 py-2">URL</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedChapters.slice(0, 20).map((ch, i) => (
                      <tr
                        key={i}
                        className={`border-t border-gray-700/30 ${ch.error ? "bg-red-500/10" : ""}`}
                      >
                        <td className="px-3 py-2 text-gray-500">{ch.order || ch.index}</td>
                        <td className="px-3 py-2 text-white">{ch.error ? <span className="text-red-400">Erreur</span> : ch.titre}</td>
                        <td className="px-3 py-2 text-gray-400">{ch.tome || "-"}</td>
                        <td className="px-3 py-2 text-gray-400 truncate max-w-[200px]">{ch.url || ch.raw}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {parsedChapters.length > 20 && (
                  <p className="text-xs text-gray-500 text-center py-2">
                    + {parsedChapters.length - 20} autres...
                  </p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Barre de progression */}
        {loading && (
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-gray-400">
              <span>Progression</span>
              <span>{progress}%</span>
            </div>
            <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-green-500 to-emerald-500"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ ease: "easeOut" }}
              />
            </div>
          </div>
        )}

        {/* Submit */}
        <motion.button
          type="submit"
          disabled={loading || validCount === 0}
          whileTap={{ scale: 0.98 }}
          className={`w-full py-3.5 rounded-xl font-semibold text-white flex items-center justify-center gap-2 transition-all ${
            loading || validCount === 0
              ? "bg-gray-700 cursor-not-allowed"
              : "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 shadow-lg shadow-green-500/25"
          }`}
        >
          {loading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              Ajout en cours... {progress}%
            </>
          ) : (
            <>
              <Check className="w-4 h-4" />
              Ajouter {validCount} chapitre(s)
            </>
          )}
        </motion.button>
      </form>
    </motion.div>
  );
};

export default PlusieursChapitre;
