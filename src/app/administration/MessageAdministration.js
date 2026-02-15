"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import axios from "axios";
import {
  Search,
  Filter,
  Trash2,
  Eye,
  EyeOff,
  AlertTriangle,
  CheckCircle,
  Clock,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Mail,
  MailOpen,
  Flag,
  MessageSquare,
  X,
  Check,
  Copy,
  ExternalLink,
  RefreshCw,
  Inbox,
  Archive,
  Tag,
  SortAsc,
  SortDesc,
  CheckSquare,
  Square,
  Layers,
  Send,
  FileText,
} from "lucide-react";

const API_URL = "https://novel-index-strapi.onrender.com";

const MessageAdministration = () => {
  // États principaux
  const [messages, setMessages] = useState([]);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // États de filtrage et recherche
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("tous"); // tous, signalements, nonLus
  const [filterOrigine, setFilterOrigine] = useState("toutes");
  const [sortOrder, setSortOrder] = useState("desc"); // desc (récent d'abord) ou asc

  // États de sélection multiple
  const [selectedIds, setSelectedIds] = useState([]);
  const [showBulkActions, setShowBulkActions] = useState(false);

  // États UI
  const [showFilters, setShowFilters] = useState(false);
  const [notification, setNotification] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [copySuccess, setCopySuccess] = useState(null);

  // États pour suppression en masse avec progression
  const [bulkDeleteProgress, setBulkDeleteProgress] = useState({ current: 0, total: 0, isRunning: false, errors: 0 });
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const cancelBulkDeleteRef = useRef(false);

  // Templates de réponses rapides
  const responseTemplates = [
    { id: 1, label: "Merci", text: "Merci pour votre message. Nous avons bien pris en compte votre signalement." },
    { id: 2, label: "Traité", text: "Le problème signalé a été traité. Merci de votre vigilance !" },
    { id: 3, label: "Besoin d'info", text: "Merci pour votre message. Pourriez-vous nous fournir plus de détails ?" },
    { id: 4, label: "Refusé", text: "Après vérification, votre signalement n'a pas été retenu. Merci de votre compréhension." },
  ];

  const getJwt = () => localStorage.getItem("jwt");

  // Charger les messages
  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    setLoading(true);
    setError(null);
    try {
      const jwt = getJwt();
      const response = await axios.get(`${API_URL}/api/administrations?sort=createdAt:desc`, {
        headers: { Authorization: `Bearer ${jwt}` },
      });
      setMessages(response.data.data || []);
    } catch (err) {
      console.error("Erreur récupération messages:", err);
      setError("Impossible de charger les messages");
    } finally {
      setLoading(false);
    }
  };

  // Notification helper
  const showNotification = (message, type = "info") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // Extraire les origines uniques
  const uniqueOrigines = useMemo(() => {
    const origines = [...new Set(messages.map(m => m.origine).filter(Boolean))];
    return origines.sort();
  }, [messages]);

  // Filtrer et trier les messages
  const filteredMessages = useMemo(() => {
    let result = [...messages];

    // Filtre par type
    if (filterType === "signalements") {
      result = result.filter(m => m.signalement);
    } else if (filterType === "nonLus") {
      result = result.filter(m => !m.lu);
    }

    // Filtre par origine
    if (filterOrigine !== "toutes") {
      result = result.filter(m => m.origine === filterOrigine);
    }

    // Recherche
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(m =>
        m.titre?.toLowerCase().includes(query) ||
        m.contenu?.toLowerCase().includes(query) ||
        m.origine?.toLowerCase().includes(query)
      );
    }

    // Tri
    result.sort((a, b) => {
      const dateA = new Date(a.createdAt);
      const dateB = new Date(b.createdAt);
      return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
    });

    return result;
  }, [messages, filterType, filterOrigine, searchQuery, sortOrder]);

  // Statistiques
  const stats = useMemo(() => ({
    total: messages.length,
    signalements: messages.filter(m => m.signalement).length,
    nonLus: messages.filter(m => !m.lu).length,
  }), [messages]);

  // Actions
  const handleDelete = async (documentId) => {
    try {
      const jwt = getJwt();
      await axios.delete(`${API_URL}/api/administrations/${documentId}`, {
        headers: { Authorization: `Bearer ${jwt}` },
      });
      setMessages(prev => prev.filter(m => m.documentId !== documentId));
      setConfirmDelete(null);
      if (selectedMessage?.documentId === documentId) {
        setSelectedMessage(null);
      }
      showNotification("Message supprimé", "success");
    } catch (err) {
      console.error("Erreur suppression:", err);
      showNotification("Erreur lors de la suppression", "error");
    }
  };

  // Suppression en masse avec barre de progression et traitement par lots
  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    
    const jwt = getJwt();
    const total = selectedIds.length;
    const BATCH_SIZE = 10; // Nombre de suppressions simultanées par lot
    const deletedIds = [];
    let errors = 0;
    
    // Reset et démarrage
    cancelBulkDeleteRef.current = false;
    setBulkDeleteProgress({ current: 0, total, isRunning: true, errors: 0 });
    setShowBulkDeleteConfirm(false);

    // Traitement par lots
    for (let i = 0; i < selectedIds.length; i += BATCH_SIZE) {
      // Vérifier si annulation demandée
      if (cancelBulkDeleteRef.current) {
        break;
      }

      const batch = selectedIds.slice(i, i + BATCH_SIZE);
      
      // Traiter le lot actuel
      const results = await Promise.allSettled(
        batch.map(id =>
          axios.delete(`${API_URL}/api/administrations/${id}`, {
            headers: { Authorization: `Bearer ${jwt}` },
          })
        )
      );

      // Compter les succès et erreurs
      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          deletedIds.push(batch[index]);
        } else {
          errors++;
        }
      });

      // Mise à jour de la progression
      const current = Math.min(i + BATCH_SIZE, selectedIds.length);
      setBulkDeleteProgress({ current, total, isRunning: true, errors });

      // Petite pause pour ne pas surcharger l'API
      if (i + BATCH_SIZE < selectedIds.length && !cancelBulkDeleteRef.current) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    // Mise à jour finale de l'état
    setMessages(prev => prev.filter(m => !deletedIds.includes(m.documentId)));
    setSelectedIds(prev => prev.filter(id => !deletedIds.includes(id)));
    
    // Fin de l'opération
    setBulkDeleteProgress(prev => ({ ...prev, isRunning: false }));
    
    // Notification finale
    if (cancelBulkDeleteRef.current) {
      showNotification(`Annulé - ${deletedIds.length}/${total} supprimé(s)`, "info");
    } else if (errors > 0) {
      showNotification(`${deletedIds.length} supprimé(s), ${errors} erreur(s)`, "warning");
    } else {
      showNotification(`${deletedIds.length} message(s) supprimé(s)`, "success");
    }

    // Reset après un délai pour voir le 100%
    setTimeout(() => {
      setBulkDeleteProgress({ current: 0, total: 0, isRunning: false, errors: 0 });
    }, 2000);
  };

  const cancelBulkDelete = () => {
    cancelBulkDeleteRef.current = true;
  };

  const handleToggleLu = async (message) => {
    try {
      const jwt = getJwt();
      const newLuStatus = !message.lu;
      await axios.put(`${API_URL}/api/administrations/${message.documentId}`, {
        data: { lu: newLuStatus }
      }, {
        headers: { Authorization: `Bearer ${jwt}` },
      });
      setMessages(prev => prev.map(m =>
        m.documentId === message.documentId ? { ...m, lu: newLuStatus } : m
      ));
      if (selectedMessage?.documentId === message.documentId) {
        setSelectedMessage({ ...selectedMessage, lu: newLuStatus });
      }
      showNotification(newLuStatus ? "Marqué comme lu" : "Marqué comme non lu", "success");
    } catch (err) {
      console.error("Erreur toggle lu:", err);
      showNotification("Erreur lors de la mise à jour", "error");
    }
  };

  const handleBulkToggleLu = async (lu) => {
    if (selectedIds.length === 0) return;
    try {
      const jwt = getJwt();
      await Promise.all(
        selectedIds.map(id =>
          axios.put(`${API_URL}/api/administrations/${id}`, {
            data: { lu }
          }, {
            headers: { Authorization: `Bearer ${jwt}` },
          })
        )
      );
      setMessages(prev => prev.map(m =>
        selectedIds.includes(m.documentId) ? { ...m, lu } : m
      ));
      setSelectedIds([]);
      showNotification(`${selectedIds.length} message(s) marqué(s) comme ${lu ? 'lu' : 'non lu'}`, "success");
    } catch (err) {
      console.error("Erreur bulk toggle:", err);
      showNotification("Erreur lors de la mise à jour", "error");
    }
  };

  const handleCopyContent = (text) => {
    navigator.clipboard.writeText(text);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(null), 2000);
    showNotification("Copié dans le presse-papier", "success");
  };

  const handleSelectAll = () => {
    if (selectedIds.length === filteredMessages.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredMessages.map(m => m.documentId));
    }
  };

  const handleSelectOne = (documentId) => {
    setSelectedIds(prev =>
      prev.includes(documentId)
        ? prev.filter(id => id !== documentId)
        : [...prev, documentId]
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) return `Il y a ${minutes}min`;
    if (hours < 24) return `Il y a ${hours}h`;
    if (days < 7) return `Il y a ${days}j`;
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  };

  return (
    <div className="w-full bg-gray-900 rounded-2xl overflow-hidden">
      {/* Notification Toast */}
      {notification && (
        <div className={`
          fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg
          flex items-center gap-2 animate-slide-in
          ${notification.type === 'success' ? 'bg-green-500/90' : 
            notification.type === 'error' ? 'bg-red-500/90' : 'bg-blue-500/90'}
          text-white text-sm font-medium
        `}>
          {notification.type === 'success' ? <Check className="w-4 h-4" /> : 
           notification.type === 'error' ? <X className="w-4 h-4" /> : 
           <MessageSquare className="w-4 h-4" />}
          {notification.message}
        </div>
      )}

      {/* Header avec stats */}
      <div className="bg-gray-800/50 border-b border-gray-700/50 p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Inbox className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Messages</h2>
              <p className="text-xs text-gray-500">{stats.total} message(s)</p>
            </div>
          </div>
          <button
            onClick={fetchMessages}
            disabled={loading}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            title="Rafraîchir"
          >
            <RefreshCw className={`w-4 h-4 text-gray-400 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Quick stats pills */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilterType("tous")}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              filterType === "tous"
                ? "bg-gray-600 text-white"
                : "bg-gray-700/50 text-gray-400 hover:bg-gray-700"
            }`}
          >
            Tous ({stats.total})
          </button>
          <button
            onClick={() => setFilterType("signalements")}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1 ${
              filterType === "signalements"
                ? "bg-red-500/20 text-red-400 ring-1 ring-red-500/50"
                : "bg-gray-700/50 text-gray-400 hover:bg-gray-700"
            }`}
          >
            <AlertTriangle className="w-3 h-3" />
            Signalements ({stats.signalements})
          </button>
          <button
            onClick={() => setFilterType("nonLus")}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1 ${
              filterType === "nonLus"
                ? "bg-blue-500/20 text-blue-400 ring-1 ring-blue-500/50"
                : "bg-gray-700/50 text-gray-400 hover:bg-gray-700"
            }`}
          >
            <Mail className="w-3 h-3" />
            Non lus ({stats.nonLus})
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
            placeholder="Rechercher un message..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
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

        {/* Filtres et actions */}
        <div className="flex items-center gap-2">
          {/* Filtre origine */}
          <select
            value={filterOrigine}
            onChange={(e) => setFilterOrigine(e.target.value)}
            className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500"
          >
            <option value="toutes">Toutes origines</option>
            {uniqueOrigines.map(origine => (
              <option key={origine} value={origine}>{origine}</option>
            ))}
          </select>

          {/* Tri */}
          <button
            onClick={() => setSortOrder(prev => prev === "desc" ? "asc" : "desc")}
            className="p-2 bg-gray-800 border border-gray-700 rounded-lg hover:bg-gray-700 transition-colors"
            title={sortOrder === "desc" ? "Plus récent d'abord" : "Plus ancien d'abord"}
          >
            {sortOrder === "desc" ? (
              <SortDesc className="w-4 h-4 text-gray-400" />
            ) : (
              <SortAsc className="w-4 h-4 text-gray-400" />
            )}
          </button>
        </div>
      </div>

      {/* Bulk actions bar */}
      {selectedIds.length > 0 && (
        <div className="bg-blue-500/10 border-b border-blue-500/30 p-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-sm text-blue-400 font-medium">
              {selectedIds.length} sélectionné(s)
            </span>
            <button
              onClick={handleSelectAll}
              className="text-xs text-gray-400 hover:text-white underline"
            >
              {selectedIds.length === filteredMessages.length ? "Désélectionner tout" : "Tout sélectionner"}
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleBulkToggleLu(true)}
              className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded text-xs text-white flex items-center gap-1 transition-colors"
            >
              <MailOpen className="w-3 h-3" />
              Marquer lu
            </button>
            <button
              onClick={() => handleBulkToggleLu(false)}
              className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded text-xs text-white flex items-center gap-1 transition-colors"
            >
              <Mail className="w-3 h-3" />
              Marquer non lu
            </button>
            <button
              onClick={() => setShowBulkDeleteConfirm(true)}
              className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 rounded text-xs text-red-400 flex items-center gap-1 transition-colors"
            >
              <Trash2 className="w-3 h-3" />
              Supprimer
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex h-[500px]">
        {/* Liste des messages */}
        <div className={`${selectedMessage ? 'hidden sm:block sm:w-2/5' : 'w-full'} border-r border-gray-700/30 overflow-y-auto`}>
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <RefreshCw className="w-8 h-8 text-gray-500 animate-spin mx-auto mb-2" />
                <p className="text-gray-500 text-sm">Chargement...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center p-4">
                <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-2" />
                <p className="text-red-400 text-sm mb-2">{error}</p>
                <button
                  onClick={fetchMessages}
                  className="text-blue-400 text-sm hover:underline"
                >
                  Réessayer
                </button>
              </div>
            </div>
          ) : filteredMessages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center p-4">
                <Inbox className="w-12 h-12 text-gray-600 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">Aucun message</p>
                {(searchQuery || filterType !== "tous" || filterOrigine !== "toutes") && (
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      setFilterType("tous");
                      setFilterOrigine("toutes");
                    }}
                    className="text-blue-400 text-xs hover:underline mt-2"
                  >
                    Réinitialiser les filtres
                  </button>
                )}
              </div>
            </div>
          ) : (
            <ul className="divide-y divide-gray-700/30">
              {filteredMessages.map((message) => (
                <li
                  key={message.documentId}
                  className={`
                    relative group hover:bg-gray-800/50 transition-colors cursor-pointer
                    ${selectedMessage?.documentId === message.documentId ? 'bg-gray-800' : ''}
                    ${!message.lu ? 'bg-blue-500/5' : ''}
                  `}
                >
                  <div className="flex items-start gap-3 p-3">
                    {/* Checkbox */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectOne(message.documentId);
                      }}
                      className="mt-1 flex-shrink-0"
                    >
                      {selectedIds.includes(message.documentId) ? (
                        <CheckSquare className="w-4 h-4 text-blue-400" />
                      ) : (
                        <Square className="w-4 h-4 text-gray-600 group-hover:text-gray-400" />
                      )}
                    </button>

                    {/* Content */}
                    <div
                      className="flex-1 min-w-0"
                      onClick={() => setSelectedMessage(message)}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        {/* Indicateur non lu */}
                        {!message.lu && (
                          <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                        )}
                        
                        {/* Titre */}
                        <h3 className={`text-sm truncate ${!message.lu ? 'font-semibold text-white' : 'text-gray-300'}`}>
                          {message.titre || "Sans titre"}
                        </h3>

                        {/* Badge signalement */}
                        {message.signalement && (
                          <span className="px-1.5 py-0.5 bg-red-500/20 text-red-400 text-[10px] font-medium rounded flex-shrink-0">
                            SIGNALÉ
                          </span>
                        )}
                      </div>

                      {/* Preview du contenu */}
                      <p className="text-xs text-gray-500 line-clamp-1 mb-1">
                        {message.contenu?.substring(0, 100) || "Aucun contenu"}
                      </p>

                      {/* Meta */}
                      <div className="flex items-center gap-2 text-[10px] text-gray-600">
                        <span className="px-1.5 py-0.5 bg-gray-800 rounded">{message.origine || "Inconnu"}</span>
                        <span>{formatDate(message.createdAt)}</span>
                      </div>
                    </div>

                    {/* Actions rapides */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleLu(message);
                        }}
                        className="p-1.5 hover:bg-gray-700 rounded"
                        title={message.lu ? "Marquer non lu" : "Marquer lu"}
                      >
                        {message.lu ? (
                          <Mail className="w-3.5 h-3.5 text-gray-500" />
                        ) : (
                          <MailOpen className="w-3.5 h-3.5 text-gray-500" />
                        )}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setConfirmDelete(message.documentId);
                        }}
                        className="p-1.5 hover:bg-red-500/20 rounded"
                        title="Supprimer"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-gray-500 hover:text-red-400" />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Detail View */}
        {selectedMessage ? (
          <div className={`${selectedMessage ? 'flex-1' : 'hidden'} flex flex-col bg-gray-900`}>
            {/* Detail Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-700/30">
              <button
                onClick={() => setSelectedMessage(null)}
                className="sm:hidden p-2 hover:bg-gray-800 rounded-lg"
              >
                <ChevronLeft className="w-5 h-5 text-gray-400" />
              </button>
              
              <div className="flex items-center gap-2 ml-auto">
                <button
                  onClick={() => handleToggleLu(selectedMessage)}
                  className="p-2 hover:bg-gray-800 rounded-lg"
                  title={selectedMessage.lu ? "Marquer non lu" : "Marquer lu"}
                >
                  {selectedMessage.lu ? (
                    <Mail className="w-4 h-4 text-gray-400" />
                  ) : (
                    <MailOpen className="w-4 h-4 text-gray-400" />
                  )}
                </button>
                <button
                  onClick={() => setConfirmDelete(selectedMessage.documentId)}
                  className="p-2 hover:bg-red-500/20 rounded-lg"
                  title="Supprimer"
                >
                  <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-400" />
                </button>
              </div>
            </div>

            {/* Detail Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Header info */}
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h2 className="text-xl font-bold text-white">{selectedMessage.titre || "Sans titre"}</h2>
                  {selectedMessage.signalement && (
                    <span className="px-2 py-1 bg-red-500/20 text-red-400 text-xs font-medium rounded flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      Signalement
                    </span>
                  )}
                </div>
                
                <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Tag className="w-3 h-3" />
                    {selectedMessage.origine || "Origine inconnue"}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(selectedMessage.createdAt).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                  <span className={`flex items-center gap-1 ${selectedMessage.lu ? 'text-green-400' : 'text-blue-400'}`}>
                    {selectedMessage.lu ? <CheckCircle className="w-3 h-3" /> : <Mail className="w-3 h-3" />}
                    {selectedMessage.lu ? "Lu" : "Non lu"}
                  </span>
                </div>
              </div>

              {/* Contenu */}
              <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/30">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs text-gray-500 font-medium uppercase tracking-wide">Contenu du message</span>
                  <button
                    onClick={() => handleCopyContent(selectedMessage.contenu || "")}
                    className="text-xs text-gray-500 hover:text-white flex items-center gap-1 transition-colors"
                  >
                    <Copy className="w-3 h-3" />
                    {copySuccess ? "Copié !" : "Copier"}
                  </button>
                </div>
                <p className="text-gray-300 whitespace-pre-wrap text-sm leading-relaxed">
                  {selectedMessage.contenu || "Aucun contenu"}
                </p>
              </div>

              {/* Templates de réponse rapide */}
              <div className="bg-gray-800/30 rounded-xl p-4 border border-gray-700/30">
                <div className="flex items-center gap-2 mb-3">
                  <Send className="w-4 h-4 text-gray-500" />
                  <span className="text-xs text-gray-500 font-medium uppercase tracking-wide">Réponses rapides</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {responseTemplates.map(template => (
                    <button
                      key={template.id}
                      onClick={() => handleCopyContent(template.text)}
                      className="p-3 bg-gray-800 hover:bg-gray-700 rounded-lg text-left transition-colors group"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-white">{template.label}</span>
                        <Copy className="w-3 h-3 text-gray-600 group-hover:text-gray-400" />
                      </div>
                      <p className="text-[10px] text-gray-500 line-clamp-2">{template.text}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Actions supplémentaires */}
              <div className="flex flex-wrap gap-2">
                {selectedMessage.url && (
                  <a
                    href={selectedMessage.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg text-sm hover:bg-blue-500/30 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Voir la page concernée
                  </a>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="hidden sm:flex flex-1 items-center justify-center bg-gray-900/50">
            <div className="text-center p-8">
              <MessageSquare className="w-16 h-16 text-gray-700 mx-auto mb-4" />
              <p className="text-gray-500 text-sm">Sélectionnez un message pour voir les détails</p>
            </div>
          </div>
        )}
      </div>

      {/* Modal de confirmation de suppression */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl p-6 max-w-sm w-full shadow-2xl border border-gray-700">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-500/20 rounded-lg">
                <Trash2 className="w-5 h-5 text-red-400" />
              </div>
              <h3 className="text-lg font-semibold text-white">Confirmer la suppression</h3>
            </div>
            <p className="text-gray-400 text-sm mb-6">
              Cette action est irréversible. Le message sera définitivement supprimé.
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white text-sm transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={() => handleDelete(confirmDelete)}
                className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 rounded-lg text-white text-sm transition-colors"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmation suppression en masse + Barre de progression */}
      {(showBulkDeleteConfirm || bulkDeleteProgress.isRunning) && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl p-6 max-w-md w-full shadow-2xl border border-gray-700">
            {!bulkDeleteProgress.isRunning ? (
              // État: Confirmation avant suppression
              <>
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-red-500/20 rounded-lg">
                    <Trash2 className="w-5 h-5 text-red-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">Suppression en masse</h3>
                </div>
                
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6">
                  <div className="flex items-center gap-2 text-red-400 mb-2">
                    <AlertTriangle className="w-4 h-4" />
                    <span className="font-medium">Attention</span>
                  </div>
                  <p className="text-gray-300 text-sm">
                    Vous êtes sur le point de supprimer <span className="font-bold text-white">{selectedIds.length}</span> message(s).
                  </p>
                  <p className="text-gray-500 text-xs mt-2">
                    Cette action est irréversible et peut prendre un moment.
                  </p>
                </div>

                {selectedIds.length > 100 && (
                  <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 mb-4">
                    <p className="text-amber-400 text-xs flex items-center gap-2">
                      <Clock className="w-3 h-3" />
                      Estimation: ~{Math.ceil(selectedIds.length / 10 * 0.2)} secondes
                    </p>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowBulkDeleteConfirm(false)}
                    className="flex-1 px-4 py-2.5 bg-gray-700 hover:bg-gray-600 rounded-lg text-white text-sm transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleBulkDelete}
                    className="flex-1 px-4 py-2.5 bg-red-500 hover:bg-red-600 rounded-lg text-white text-sm font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Supprimer tout
                  </button>
                </div>
              </>
            ) : (
              // État: Progression de la suppression
              <>
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-red-500/20 rounded-lg">
                    <RefreshCw className="w-5 h-5 text-red-400 animate-spin" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">Suppression en cours...</h3>
                    <p className="text-xs text-gray-500">Ne fermez pas cette fenêtre</p>
                  </div>
                </div>

                {/* Compteur */}
                <div className="text-center mb-4">
                  <span className="text-4xl font-bold text-white">{bulkDeleteProgress.current}</span>
                  <span className="text-2xl text-gray-500"> / {bulkDeleteProgress.total}</span>
                </div>

                {/* Barre de progression */}
                <div className="relative h-4 bg-gray-700 rounded-full overflow-hidden mb-4">
                  <div
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-red-600 to-red-400 transition-all duration-300 ease-out"
                    style={{ width: `${(bulkDeleteProgress.current / bulkDeleteProgress.total) * 100}%` }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs font-medium text-white drop-shadow">
                      {Math.round((bulkDeleteProgress.current / bulkDeleteProgress.total) * 100)}%
                    </span>
                  </div>
                </div>

                {/* Stats */}
                <div className="flex justify-between text-xs text-gray-500 mb-6">
                  <span>Restant: {bulkDeleteProgress.total - bulkDeleteProgress.current}</span>
                  {bulkDeleteProgress.errors > 0 && (
                    <span className="text-red-400">{bulkDeleteProgress.errors} erreur(s)</span>
                  )}
                </div>

                {/* Bouton annuler */}
                <button
                  onClick={cancelBulkDelete}
                  className="w-full px-4 py-2.5 bg-gray-700 hover:bg-gray-600 rounded-lg text-white text-sm transition-colors flex items-center justify-center gap-2"
                >
                  <X className="w-4 h-4" />
                  Annuler la suppression
                </button>
                <p className="text-[10px] text-gray-600 text-center mt-2">
                  Les messages déjà supprimés ne seront pas restaurés
                </p>
              </>
            )}
          </div>
        </div>
      )}

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

export default MessageAdministration;
