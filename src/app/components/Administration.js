"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import {
  UserCheck,
  Mail,
  BookOpen,
  ArrowLeft,
  LayoutDashboard,
  AlertTriangle,
  Clock,
  CheckCircle,
  TrendingUp,
  RefreshCw,
  Bell,
  Settings,
  ChevronRight,
  Activity,
  Users,
  MessageSquare,
  FileText,
} from "lucide-react";

import ValidationProprietaire from "../administration/ValidationProprietaire";
import MessageAdministration from "../administration/MessageAdministration";
import GestionEditions from "../administration/GestionEditions";

const API_URL = "https://novel-index-strapi.onrender.com";

const Administration = () => {
  const [activeSection, setActiveSection] = useState(null);
  const [stats, setStats] = useState({
    messages: { total: 0, signalements: 0, nonLus: 0 },
    proprietaires: { enAttente: 0 },
    editions: { total: 0 },
    loading: true
  });
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [refreshing, setRefreshing] = useState(false);

  // Charger les statistiques au montage
  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setRefreshing(true);
    try {
      const jwt = localStorage.getItem("jwt");
      const headers = jwt ? { Authorization: `Bearer ${jwt}` } : {};

      const [messagesRes, proprietairesRes, editionsRes] = await Promise.all([
        axios.get(`${API_URL}/api/administrations`, { headers }).catch(() => ({ data: { data: [] } })),
        axios.get(`${API_URL}/api/proprietaires`, { headers }).catch(() => ({ data: { data: [] } })),
        axios.get(`${API_URL}/api/editions`, { headers }).catch(() => ({ data: { data: [] } }))
      ]);

      const messages = messagesRes.data.data || [];
      const proprietaires = proprietairesRes.data.data || [];
      const editions = editionsRes.data.data || [];

      setStats({
        messages: {
          total: messages.length,
          signalements: messages.filter(m => m.signalement).length,
          nonLus: messages.filter(m => !m.lu).length
        },
        proprietaires: {
          enAttente: proprietaires.filter(p => !p.validationAdmin).length
        },
        editions: {
          total: editions.length
        },
        loading: false
      });
      setLastRefresh(new Date());
    } catch (error) {
      console.error("Erreur chargement stats:", error);
      setStats(prev => ({ ...prev, loading: false }));
    } finally {
      setRefreshing(false);
    }
  };

  const sections = [
    {
      id: "ValidationProprietaire",
      title: "Validations",
      desc: "Demandes de propriétaires en attente",
      icon: UserCheck,
      color: "from-amber-500 to-orange-600",
      bgColor: "bg-amber-500/10",
      borderColor: "border-amber-500/30",
      badge: stats.proprietaires.enAttente,
      badgeColor: stats.proprietaires.enAttente > 0 ? "bg-amber-500" : "bg-gray-600",
      component: <ValidationProprietaire />,
    },
    {
      id: "MessageAdministration",
      title: "Messages",
      desc: "Gérer les messages et signalements",
      icon: Mail,
      color: "from-blue-500 to-cyan-600",
      bgColor: "bg-blue-500/10",
      borderColor: "border-blue-500/30",
      badge: stats.messages.signalements,
      badgeColor: stats.messages.signalements > 0 ? "bg-red-500" : "bg-gray-600",
      component: <MessageAdministration />,
    },
    {
      id: "GestionEditions",
      title: "Éditions & Licences",
      desc: "Maisons d'édition et blocages licence",
      icon: BookOpen,
      color: "from-purple-500 to-pink-600",
      bgColor: "bg-purple-500/10",
      borderColor: "border-purple-500/30",
      badge: stats.editions.total,
      badgeColor: "bg-purple-500",
      component: <GestionEditions />,
    },
  ];

  const quickStats = [
    {
      label: "Messages non lus",
      value: stats.messages.nonLus,
      icon: MessageSquare,
      color: "text-blue-400",
      trend: stats.messages.nonLus > 0 ? "urgent" : "ok"
    },
    {
      label: "Signalements",
      value: stats.messages.signalements,
      icon: AlertTriangle,
      color: "text-red-400",
      trend: stats.messages.signalements > 0 ? "urgent" : "ok"
    },
    {
      label: "Validations en attente",
      value: stats.proprietaires.enAttente,
      icon: Clock,
      color: "text-amber-400",
      trend: stats.proprietaires.enAttente > 0 ? "warning" : "ok"
    },
    {
      label: "Maisons d'édition",
      value: stats.editions.total,
      icon: FileText,
      color: "text-purple-400",
      trend: "neutral"
    },
  ];

  return (
    <div className="w-full max-w-7xl mx-auto text-white">
      {/* Header avec refresh et timestamp */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg">
            <LayoutDashboard className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
              Administration
            </h1>
            <p className="text-xs text-gray-500">
              Dernière mise à jour : {lastRefresh.toLocaleTimeString('fr-FR')}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {activeSection && (
            <button
              onClick={() => setActiveSection(null)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Retour</span>
            </button>
          )}
          <button
            onClick={fetchStats}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Actualiser</span>
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {!activeSection ? (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            {/* Quick Stats Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {quickStats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`
                    relative overflow-hidden
                    bg-gray-800/50 backdrop-blur border border-gray-700/50 
                    rounded-xl p-4 
                    ${stat.trend === 'urgent' ? 'ring-1 ring-red-500/50' : ''}
                    ${stat.trend === 'warning' ? 'ring-1 ring-amber-500/30' : ''}
                  `}
                >
                  <div className="flex items-center justify-between">
                    <stat.icon className={`w-5 h-5 ${stat.color}`} />
                    {stat.trend === 'urgent' && (
                      <span className="flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                      </span>
                    )}
                  </div>
                  <div className="mt-3">
                    <p className="text-2xl font-bold">{stats.loading ? '-' : stat.value}</p>
                    <p className="text-xs text-gray-500 truncate">{stat.label}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Main Sections Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {sections.map((section, index) => {
                const IconComponent = section.icon;
                return (
                  <motion.button
                    key={section.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 + index * 0.05 }}
                    onClick={() => setActiveSection(section.id)}
                    className={`
                      relative group text-left
                      bg-gray-800/60 backdrop-blur
                      border ${section.borderColor}
                      rounded-2xl p-5
                      hover:bg-gray-800 hover:border-gray-600
                      transition-all duration-300
                      overflow-hidden
                    `}
                  >
                    {/* Gradient overlay on hover */}
                    <div className={`
                      absolute inset-0 opacity-0 group-hover:opacity-10
                      bg-gradient-to-br ${section.color}
                      transition-opacity duration-300
                    `} />
                    
                    {/* Badge */}
                    {section.badge > 0 && (
                      <span className={`
                        absolute top-3 right-3
                        ${section.badgeColor}
                        text-white text-xs font-bold
                        px-2 py-0.5 rounded-full
                        min-w-[24px] text-center
                      `}>
                        {section.badge}
                      </span>
                    )}

                    {/* Icon */}
                    <div className={`
                      w-12 h-12 rounded-xl ${section.bgColor}
                      flex items-center justify-center mb-4
                      group-hover:scale-110 transition-transform duration-300
                    `}>
                      <IconComponent className={`w-6 h-6 bg-gradient-to-br ${section.color} bg-clip-text`} style={{ color: 'inherit' }} />
                    </div>

                    {/* Content */}
                    <h3 className="text-lg font-semibold mb-1 flex items-center gap-2">
                      {section.title}
                      <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                    </h3>
                    <p className="text-sm text-gray-400">{section.desc}</p>
                  </motion.button>
                );
              })}
            </div>

            {/* Activity Summary */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-gray-800/40 border border-gray-700/50 rounded-2xl p-5"
            >
              <div className="flex items-center gap-2 mb-4">
                <Activity className="w-5 h-5 text-green-400" />
                <h3 className="font-semibold">Résumé rapide</h3>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                {/* Messages status */}
                <div className="flex items-center gap-3 p-3 bg-gray-900/50 rounded-xl">
                  <div className={`w-3 h-3 rounded-full ${
                    stats.messages.signalements > 0 ? 'bg-red-500 animate-pulse' : 
                    stats.messages.nonLus > 0 ? 'bg-amber-500' : 'bg-green-500'
                  }`} />
                  <div>
                    <p className="font-medium">Messages</p>
                    <p className="text-gray-500 text-xs">
                      {stats.messages.signalements > 0 
                        ? `${stats.messages.signalements} signalement(s) à traiter`
                        : stats.messages.nonLus > 0
                        ? `${stats.messages.nonLus} non lu(s)`
                        : 'Tout est en ordre'}
                    </p>
                  </div>
                </div>

                {/* Validations status */}
                <div className="flex items-center gap-3 p-3 bg-gray-900/50 rounded-xl">
                  <div className={`w-3 h-3 rounded-full ${
                    stats.proprietaires.enAttente > 0 ? 'bg-amber-500' : 'bg-green-500'
                  }`} />
                  <div>
                    <p className="font-medium">Validations</p>
                    <p className="text-gray-500 text-xs">
                      {stats.proprietaires.enAttente > 0 
                        ? `${stats.proprietaires.enAttente} en attente`
                        : 'Aucune en attente'}
                    </p>
                  </div>
                </div>

                {/* Editions status */}
                <div className="flex items-center gap-3 p-3 bg-gray-900/50 rounded-xl">
                  <div className="w-3 h-3 rounded-full bg-purple-500" />
                  <div>
                    <p className="font-medium">Éditions</p>
                    <p className="text-gray-500 text-xs">
                      {stats.editions.total} maison(s) enregistrée(s)
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Quick Tips */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="flex items-center gap-3 p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-sm"
            >
              <Bell className="w-5 h-5 text-indigo-400 flex-shrink-0" />
              <p className="text-gray-300">
                <span className="font-medium text-indigo-400">Astuce :</span> Traitez en priorité les signalements (badge rouge) pour maintenir un contenu de qualité.
              </p>
            </motion.div>
          </motion.div>
        ) : (
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {sections.find((s) => s.id === activeSection)?.component}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Administration;
