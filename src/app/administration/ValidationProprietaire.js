"use client";

import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import {
  UserCheck,
  UserX,
  Search,
  ExternalLink,
  CheckCircle,
  XCircle,
  Clock,
  ChevronDown,
  ChevronUp,
  Globe,
  FileText,
  User,
  RefreshCw,
  Check,
  X,
  AlertTriangle,
  Eye,
  MessageSquare,
  Send,
  Inbox,
  Filter,
  CheckSquare,
  Square,
} from "lucide-react";

const API_URL = "https://novel-index-strapi.onrender.com";

const ValidationProprietaire = () => {
  const [proprietaires, setProprietaires] = useState([]);
  const [allProprietaires, setAllProprietaires] = useState([]); // Tous y compris validés
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);
  const [messageType, setMessageType] = useState("info");
  const [expandedId, setExpandedId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showValidated, setShowValidated] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [saving, setSaving] = useState(false);

  const getJwt = () => localStorage.getItem("jwt");

  useEffect(() => {
    fetchProprietaires();
  }, []);

  const fetchProprietaires = async () => {
    setLoading(true);
    try {
      const jwt = getJwt();
      const response = await axios.get(`${API_URL}/api/proprietaires`, {
        headers: { Authorization: `Bearer ${jwt}` },
      });

      const all = response.data.data || [];
      setAllProprietaires(all);
      setProprietaires(all.filter(p => !p.validationAdmin));
    } catch (error) {
      console.error("Erreur récupération proprietaires:", error);
      showMessage("Erreur lors de la récupération des données", "error");
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (msg, type = "info") => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => setMessage(null), 4000);
  };

  // Filtrer selon la recherche et le filtre validé
  const displayedProprietaires = useMemo(() => {
    let result = showValidated ? allProprietaires : proprietaires;
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(p =>
        p.utilisateur?.toLowerCase().includes(query) ||
        p.urlsite?.toLowerCase().includes(query) ||
        p.sitename?.toLowerCase().includes(query)
      );
    }
    
    return result;
  }, [proprietaires, allProprietaires, showValidated, searchQuery]);

  // Stats
  const stats = useMemo(() => ({
    enAttente: proprietaires.length,
    valides: allProprietaires.filter(p => p.validationAdmin).length,
    total: allProprietaires.length
  }), [proprietaires, allProprietaires]);

  const handleFieldChange = (documentId, field, value) => {
    const updateList = showValidated ? setAllProprietaires : setProprietaires;
    const updateOther = showValidated ? setProprietaires : setAllProprietaires;

    updateList(prev =>
      prev.map(p => p.documentId === documentId ? { ...p, [field]: value } : p)
    );
    updateOther(prev =>
      prev.map(p => p.documentId === documentId ? { ...p, [field]: value } : p)
    );
  };

  const handleSingleSave = async (proprietaire) => {
    setSaving(true);
    try {
      const jwt = getJwt();
      await axios.put(`${API_URL}/api/proprietaires/${proprietaire.documentId}`, {
        data: {
          infovalidation: proprietaire.infovalidation,
          validationAdmin: proprietaire.validationAdmin,
          bullInfo: proprietaire.bullInfo,
        }
      }, {
        headers: { Authorization: `Bearer ${jwt}` },
      });

      // Si validé, retirer de la liste en attente
      if (proprietaire.validationAdmin) {
        setProprietaires(prev => prev.filter(p => p.documentId !== proprietaire.documentId));
      }

      showMessage("Modifications enregistrées", "success");
    } catch (error) {
      console.error("Erreur sauvegarde:", error);
      showMessage("Erreur lors de l'enregistrement", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleBulkValidate = async (validate) => {
    if (selectedIds.length === 0) return;
    setSaving(true);
    try {
      const jwt = getJwt();
      await Promise.all(
        selectedIds.map(id =>
          axios.put(`${API_URL}/api/proprietaires/${id}`, {
            data: { validationAdmin: validate }
          }, {
            headers: { Authorization: `Bearer ${jwt}` },
          })
        )
      );

      // Mettre à jour les listes
      const updateState = (prev) =>
        prev.map(p => selectedIds.includes(p.documentId) ? { ...p, validationAdmin: validate } : p);
      
      setAllProprietaires(updateState);
      if (validate) {
        setProprietaires(prev => prev.filter(p => !selectedIds.includes(p.documentId)));
      } else {
        setProprietaires(updateState);
      }

      setSelectedIds([]);
      showMessage(`${selectedIds.length} demande(s) ${validate ? 'validée(s)' : 'mise(s) à jour'}`, "success");
    } catch (error) {
      console.error("Erreur bulk:", error);
      showMessage("Erreur lors de l'opération", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleSelectAll = () => {
    if (selectedIds.length === displayedProprietaires.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(displayedProprietaires.map(p => p.documentId));
    }
  };

  const handleSelectOne = (documentId) => {
    setSelectedIds(prev =>
      prev.includes(documentId)
        ? prev.filter(id => id !== documentId)
        : [...prev, documentId]
    );
  };

  const toggleExpand = (documentId) => {
    setExpandedId(prev => prev === documentId ? null : documentId);
  };

  return (
    <div className="w-full bg-gray-900 rounded-2xl overflow-hidden">
      {/* Notification Toast */}
      {message && (
        <div className={`
          fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg
          flex items-center gap-2 animate-slide-in
          ${messageType === 'success' ? 'bg-green-500/90' : 
            messageType === 'error' ? 'bg-red-500/90' : 'bg-blue-500/90'}
          text-white text-sm font-medium
        `}>
          {messageType === 'success' ? <Check className="w-4 h-4" /> : 
           messageType === 'error' ? <X className="w-4 h-4" /> : 
           <AlertTriangle className="w-4 h-4" />}
          {message}
        </div>
      )}

      {/* Header */}
      <div className="bg-gray-800/50 border-b border-gray-700/50 p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/20 rounded-lg">
              <UserCheck className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Validation Propriétaires</h2>
              <p className="text-xs text-gray-500">{stats.enAttente} en attente</p>
            </div>
          </div>
          <button
            onClick={fetchProprietaires}
            disabled={loading}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <RefreshCw className={`w-4 h-4 text-gray-400 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Stats pills */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setShowValidated(false)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1 ${
              !showValidated
                ? "bg-amber-500/20 text-amber-400 ring-1 ring-amber-500/50"
                : "bg-gray-700/50 text-gray-400 hover:bg-gray-700"
            }`}
          >
            <Clock className="w-3 h-3" />
            En attente ({stats.enAttente})
          </button>
          <button
            onClick={() => setShowValidated(true)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1 ${
              showValidated
                ? "bg-green-500/20 text-green-400 ring-1 ring-green-500/50"
                : "bg-gray-700/50 text-gray-400 hover:bg-gray-700"
            }`}
          >
            <CheckCircle className="w-3 h-3" />
            Tous ({stats.total})
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-gray-800/30 border-b border-gray-700/30 p-3 flex flex-col sm:flex-row gap-3">
        {/* Recherche */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Rechercher par utilisateur, URL, nom..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Bulk actions bar */}
      {selectedIds.length > 0 && (
        <div className="bg-amber-500/10 border-b border-amber-500/30 p-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-sm text-amber-400 font-medium">
              {selectedIds.length} sélectionné(s)
            </span>
            <button
              onClick={handleSelectAll}
              className="text-xs text-gray-400 hover:text-white underline"
            >
              {selectedIds.length === displayedProprietaires.length ? "Désélectionner" : "Tout sélectionner"}
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleBulkValidate(true)}
              disabled={saving}
              className="px-3 py-1.5 bg-green-500/20 hover:bg-green-500/30 rounded text-xs text-green-400 flex items-center gap-1 transition-colors disabled:opacity-50"
            >
              <CheckCircle className="w-3 h-3" />
              Tout valider
            </button>
          </div>
        </div>
      )}

      {/* Liste */}
      <div className="max-h-[500px] overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <RefreshCw className="w-8 h-8 text-gray-500 animate-spin mx-auto mb-2" />
              <p className="text-gray-500 text-sm">Chargement...</p>
            </div>
          </div>
        ) : displayedProprietaires.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Inbox className="w-12 h-12 text-gray-600 mx-auto mb-2" />
              <p className="text-gray-500 text-sm">
                {searchQuery ? "Aucun résultat" : showValidated ? "Aucune demande" : "Aucune demande en attente"}
              </p>
              {stats.enAttente === 0 && !showValidated && (
                <p className="text-green-400 text-xs mt-2 flex items-center justify-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  Toutes les demandes ont été traitées !
                </p>
              )}
            </div>
          </div>
        ) : (
          <ul className="divide-y divide-gray-700/30">
            {displayedProprietaires.map((proprietaire) => {
              const isExpanded = expandedId === proprietaire.documentId;
              return (
                <li key={proprietaire.documentId} className="group">
                  {/* Header row */}
                  <div className="flex items-center gap-3 p-4 hover:bg-gray-800/30 transition-colors">
                    {/* Checkbox */}
                    <button
                      onClick={() => handleSelectOne(proprietaire.documentId)}
                      className="flex-shrink-0"
                    >
                      {selectedIds.includes(proprietaire.documentId) ? (
                        <CheckSquare className="w-4 h-4 text-amber-400" />
                      ) : (
                        <Square className="w-4 h-4 text-gray-600 group-hover:text-gray-400" />
                      )}
                    </button>

                    {/* Status indicator */}
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      proprietaire.validationAdmin ? 'bg-green-500' : 'bg-amber-500'
                    }`} />

                    {/* Main info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <User className="w-3.5 h-3.5 text-gray-500" />
                        <span className="text-sm font-medium text-white truncate">
                          {proprietaire.utilisateur || "Utilisateur inconnu"}
                        </span>
                        {proprietaire.validationAdmin && (
                          <span className="px-1.5 py-0.5 bg-green-500/20 text-green-400 text-[10px] font-medium rounded">
                            VALIDÉ
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span className="flex items-center gap-1 truncate">
                          <Globe className="w-3 h-3" />
                          {proprietaire.urlsite || "URL non spécifiée"}
                        </span>
                        {proprietaire.sitename && (
                          <span className="hidden sm:flex items-center gap-1">
                            <FileText className="w-3 h-3" />
                            {proprietaire.sitename}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      {proprietaire.urlsite && (
                        <a
                          href={proprietaire.urlsite.startsWith('http') ? proprietaire.urlsite : `https://${proprietaire.urlsite}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                          title="Visiter le site"
                        >
                          <ExternalLink className="w-4 h-4 text-gray-500 hover:text-blue-400" />
                        </a>
                      )}
                      <button
                        onClick={() => toggleExpand(proprietaire.documentId)}
                        className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                      >
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-gray-400" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-gray-400" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Expanded content */}
                  {isExpanded && (
                    <div className="px-4 pb-4 space-y-4 bg-gray-800/20">
                      {/* Oeuvres validées */}
                      {proprietaire.oeuvresvalide && (
                        <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700/30">
                          <label className="block text-xs text-gray-500 font-medium uppercase tracking-wide mb-2">
                            Œuvres demandées
                          </label>
                          <div className="text-sm text-gray-300 whitespace-pre-wrap max-h-32 overflow-y-auto">
                            {proprietaire.oeuvresvalide}
                          </div>
                        </div>
                      )}

                      {/* Contrôles de validation */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Checkboxes */}
                        <div className="flex flex-col gap-3">
                          <label className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg border border-gray-700/30 cursor-pointer hover:bg-gray-700/50 transition-colors">
                            <input
                              type="checkbox"
                              checked={proprietaire.infovalidation || false}
                              onChange={(e) => handleFieldChange(proprietaire.documentId, "infovalidation", e.target.checked)}
                              className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-amber-500 focus:ring-amber-500/50"
                            />
                            <div>
                              <span className="text-sm text-white font-medium">Info validation</span>
                              <p className="text-xs text-gray-500">Informations vérifiées</p>
                            </div>
                          </label>

                          <label className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg border border-gray-700/30 cursor-pointer hover:bg-gray-700/50 transition-colors">
                            <input
                              type="checkbox"
                              checked={proprietaire.validationAdmin || false}
                              onChange={(e) => handleFieldChange(proprietaire.documentId, "validationAdmin", e.target.checked)}
                              className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-green-500 focus:ring-green-500/50"
                            />
                            <div>
                              <span className="text-sm text-white font-medium">Validation Admin</span>
                              <p className="text-xs text-gray-500">Approuver la demande</p>
                            </div>
                          </label>
                        </div>

                        {/* Notes */}
                        <div>
                          <label className="block text-xs text-gray-500 font-medium uppercase tracking-wide mb-2">
                            Notes / Commentaires
                          </label>
                          <textarea
                            value={proprietaire.bullInfo || ""}
                            onChange={(e) => handleFieldChange(proprietaire.documentId, "bullInfo", e.target.value)}
                            placeholder="Ajouter des notes..."
                            className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:border-amber-500 transition-colors resize-none"
                            rows={3}
                          />
                        </div>
                      </div>

                      {/* Save button */}
                      <div className="flex justify-end">
                        <button
                          onClick={() => handleSingleSave(proprietaire)}
                          disabled={saving}
                          className="px-4 py-2 bg-amber-500 hover:bg-amber-600 disabled:bg-gray-600 rounded-lg text-sm font-medium text-white flex items-center gap-2 transition-colors"
                        >
                          {saving ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          ) : (
                            <Check className="w-4 h-4" />
                          )}
                          Enregistrer
                        </button>
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <style jsx global>{`
        @keyframes slide-in {
          from {
            opacity: 0;
            transform: translateX(100%);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default ValidationProprietaire;
