// Popup ajout d'œuvres dans une catégorie
import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { slugify } from "@/utils/slugify";
import {
  X as XIcon,
  Search,
  Plus,
  Check,
  BookOpen,
  Loader2,
} from "lucide-react";

const SkeletonCard = () => (
  <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl overflow-hidden animate-pulse">
    <div className="w-full h-44 bg-gray-700/50" />
    <div className="p-4 space-y-2">
      <div className="h-4 w-3/4 bg-gray-700/50 rounded" />
      <div className="h-3 w-1/2 bg-gray-700/50 rounded" />
    </div>
  </div>
);

const AjouterOeuvresPopup = ({ user, onClose, category, onOeuvreAjoutee }) => {
  const [abonnements, setAbonnements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedDocumentIds, setSelectedDocumentIds] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  const toggleSelection = (docId) => {
    setSelectedDocumentIds((prev) =>
      prev.includes(docId)
        ? prev.filter((id) => id !== docId)
        : [...prev, docId]
    );
  };

  useEffect(() => {
    const fetchAbonnements = async () => {
      try {
        const jwt = localStorage.getItem("jwt");
        const res = await fetch(
          `${apiUrl}/api/checkoeuvretimes?filters[users_permissions_users][documentId][$eq]=${user.documentId}&populate[oeuvres][populate][0]=couverture`,
          {
            headers: { Authorization: `Bearer ${jwt}` },
          }
        );
        const data = await res.json();
        const mapped = data.data.map((a) => a.oeuvres?.[0]).filter(Boolean);
        setAbonnements(mapped);
      } catch (err) {
        console.error("Erreur fetch abonnements:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAbonnements();
  }, [user.documentId]);

  const filteredAbonnements = useMemo(() => {
    if (!searchTerm.trim()) return abonnements;
    const term = searchTerm.toLowerCase();
    return abonnements.filter((o) =>
      o.titre?.toLowerCase().includes(term)
    );
  }, [abonnements, searchTerm]);

  const handleAjouterOeuvres = async () => {
    const jwt = localStorage.getItem("jwt");
    setSaving(true);
    try {
      await fetch(`${apiUrl}/api/nameoeuvrelists/${category.documentId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwt}`,
        },
        body: JSON.stringify({
          data: {
            oeuvres: selectedDocumentIds,
          },
        }),
      });
      setSelectedDocumentIds([]);
      onOeuvreAjoutee();
    } catch (e) {
      console.error("Erreur ajout œuvres:", e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center z-50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.2 }}
        className="bg-gray-900 border border-gray-700/50 rounded-2xl p-6 w-full max-w-4xl relative max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-white text-xl font-bold">
              Ajouter des œuvres
            </h3>
            <p className="text-gray-500 text-sm mt-0.5">
              Catégorie : <span className="text-indigo-400">{category.name}</span>
            </p>
          </div>
          <button
            className="p-2 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
            onClick={onClose}
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Barre de recherche */}
        {!loading && abonnements.length > 0 && (
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher une œuvre..."
              className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-gray-800 text-white border border-gray-700 text-sm focus:border-indigo-500 focus:outline-none transition-colors"
            />
          </div>
        )}

        {/* Contenu */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : abonnements.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="p-4 bg-gray-800/50 rounded-full mb-4">
                <BookOpen className="w-10 h-10 text-gray-600" />
              </div>
              <h4 className="text-gray-300 font-medium mb-1">Aucun abonnement</h4>
              <p className="text-gray-500 text-sm max-w-xs">
                Abonnez-vous d'abord à des œuvres pour pouvoir les ajouter à vos catégories.
              </p>
            </div>
          ) : filteredAbonnements.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-center">
              <Search className="w-8 h-8 text-gray-600 mb-2" />
              <p className="text-gray-500 text-sm">Aucune œuvre ne correspond à "{searchTerm}"</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {filteredAbonnements.map((oeuvre) => {
                const docId = oeuvre.documentId;
                const isSelected = selectedDocumentIds.includes(docId);

                return (
                  <div
                    key={docId}
                    onClick={() => toggleSelection(docId)}
                    className={`group relative bg-gray-800/50 rounded-xl overflow-hidden transition-all cursor-pointer border-2 ${
                      isSelected
                        ? "border-indigo-500 ring-1 ring-indigo-500/30"
                        : "border-transparent hover:border-gray-600/50"
                    }`}
                  >
                    {/* Indicateur sélection */}
                    <div
                      className={`absolute top-2 right-2 z-10 w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                        isSelected
                          ? "bg-indigo-500 text-white"
                          : "bg-gray-900/60 text-gray-500 opacity-0 group-hover:opacity-100"
                      }`}
                    >
                      {isSelected ? (
                        <Check className="w-3.5 h-3.5" />
                      ) : (
                        <Plus className="w-3.5 h-3.5" />
                      )}
                    </div>

                    {oeuvre?.couverture?.url ? (
                      <Image
                        src={oeuvre.couverture.url}
                        alt={oeuvre.titre}
                        width={300}
                        height={176}
                        className="w-full h-44 object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-44 bg-gray-700/30 flex items-center justify-center">
                        <BookOpen className="w-8 h-8 text-gray-600" />
                      </div>
                    )}
                    <div className="p-3">
                      <h2 className="text-sm font-semibold text-white truncate">
                        {oeuvre.titre}
                      </h2>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer avec bouton */}
        {!loading && abonnements.length > 0 && (
          <div className="flex items-center justify-between mt-5 pt-4 border-t border-gray-800">
            <p className="text-sm text-gray-500">
              {selectedDocumentIds.length} œuvre{selectedDocumentIds.length > 1 ? "s" : ""} sélectionnée{selectedDocumentIds.length > 1 ? "s" : ""}
            </p>
            <button
              onClick={handleAjouterOeuvres}
              disabled={selectedDocumentIds.length === 0 || saving}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:hover:bg-indigo-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              Ajouter à la catégorie
            </button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default AjouterOeuvresPopup;
