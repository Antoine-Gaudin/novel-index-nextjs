"use client";

import { motion, AnimatePresence } from "framer-motion";
import React, { useState, useEffect, useRef, useCallback } from "react";
import DOMPurify from "dompurify";
import Cookies from "js-cookie";
import Image from "next/image";
import Link from "next/link";
import { slugify } from "@/utils/slugify";
import CommentairePreview from "./CommentairePreview";
import {
  FiX, FiBook, FiBookOpen, FiChevronsRight, FiStar, FiUser, FiGlobe,
  FiArrowRight, FiExternalLink, FiHeart, FiShare2, FiMessageCircle,
  FiCopy, FiCheck, FiBarChart2, FiClock
} from "react-icons/fi";
import { FaTwitter, FaRedditAlien } from "react-icons/fa";

/* ── Utilitaire temps relatif ── */
function timeAgo(date) {
  if (!date) return "";
  const diff = Math.floor((Date.now() - new Date(date).getTime()) / 60000);
  if (diff < 1) return "à l'instant";
  if (diff < 60) return `${diff}min`;
  const h = Math.floor(diff / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  return `${d}j`;
}

/* ============================================================
   FICHE OEUVRE — Modale immersive WOW
   ============================================================ */
const FicheOeuvre = ({ oeuvre, onClose }) => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const [details, setDetails] = useState(null);
  const [allChapitres, setAllChapitres] = useState([]);
  const [showAllGenres, setShowAllGenres] = useState(false);
  const [showAllTags, setShowAllTags] = useState(false);
  const [selectedChapter, setSelectedChapter] = useState(null);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [copied, setCopied] = useState(false);
  const [synopsisExpanded, setSynopsisExpanded] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscriptionId, setSubscriptionId] = useState(null);
  const modalRef = useRef(null);
  const shareRef = useRef(null);

  /* ── Fetch détails oeuvre ── */
  useEffect(() => {
    if (!oeuvre?.documentId) return;
    (async () => {
      try {
        const res = await fetch(
          `${apiUrl}/api/oeuvres/${oeuvre.documentId}?populate[chapitres][populate]=users_permissions_users&populate[tags]=true&populate[genres]=true`
        );
        const data = await res.json();
        setDetails(data.data);
        setAllChapitres((data.data?.chapitres || []).sort((a, b) => a.order - b.order));
      } catch (e) { console.error(e); }
    })();
  }, [oeuvre?.documentId, apiUrl]);

  /* ── Check abonnement ── */
  useEffect(() => {
    const checkAbonnement = async () => {
      const jwt = Cookies.get("jwt");
      const userInfo = Cookies.get("userInfo");
      let userId = null;
      try { userId = userInfo ? JSON.parse(userInfo)?.documentId : null; } catch { return; }
      if (!jwt || !userId || !oeuvre?.documentId) return;

      try {
        const res = await fetch(
          `${apiUrl}/api/checkoeuvretimes?filters[oeuvres][documentId][$eq]=${oeuvre.documentId}&filters[users_permissions_users][documentId][$eq]=${userId}`,
          { headers: { Authorization: `Bearer ${jwt}` } }
        );
        if (!res.ok) return;
        const data = await res.json();
        const abo = data?.data?.[0];
        if (abo) { setIsSubscribed(true); setSubscriptionId(abo.documentId); }
        else { setIsSubscribed(false); setSubscriptionId(null); }
      } catch (err) { console.error("Erreur checkAbonnement :", err); }
    };
    if (oeuvre?.documentId) checkAbonnement();
  }, [oeuvre?.documentId, apiUrl]);

  /* ── Update lastChecked quand abonné ── */
  useEffect(() => {
    const jwt = Cookies.get("jwt");
    if (!jwt || !subscriptionId) return;
    (async () => {
      try {
        await fetch(`${apiUrl}/api/checkoeuvretimes/${subscriptionId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${jwt}` },
          body: JSON.stringify({ data: { lastChecked: new Date().toISOString() } }),
        });
      } catch (err) { console.error("Erreur lastChecked :", err); }
    })();
  }, [subscriptionId, apiUrl]);

  /* ── Subscribe / Unsubscribe ── */
  const handleSubscribe = async () => {
    const jwt = Cookies.get("jwt");
    if (!jwt) return;
    let userId = null;
    try { userId = Cookies.get("userInfo") ? JSON.parse(Cookies.get("userInfo"))?.documentId : null; } catch { return; }
    if (!userId) return;
    try {
      const res = await fetch(`${apiUrl}/api/checkoeuvretimes`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${jwt}` },
        body: JSON.stringify({
          data: {
            oeuvres: [oeuvre.documentId],
            users_permissions_users: [userId],
            lastChecked: new Date().toISOString(),
            notification: true,
            archived: false,
          },
        }),
      });
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      const data = await res.json();
      setIsSubscribed(true);
      setSubscriptionId(data.data.documentId);
    } catch (err) { console.error("Erreur abonnement :", err); }
  };

  const handleUnsubscribe = async () => {
    if (!subscriptionId) return;
    const jwt = Cookies.get("jwt");
    if (!jwt) return;
    try {
      const res = await fetch(`${apiUrl}/api/checkoeuvretimes/${subscriptionId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${jwt}` },
      });
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      setIsSubscribed(false);
      setSubscriptionId(null);
    } catch (err) { console.error("Erreur désabonnement :", err); }
  };

  /* ── Focus trap ── */
  const handleTabTrap = useCallback((e) => {
    if (e.key !== "Tab" || !modalRef.current) return;
    const f = modalRef.current.querySelectorAll('button, [href], input, [tabindex]:not([tabindex="-1"])');
    if (!f.length) return;
    if (e.shiftKey) { if (document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); } }
    else { if (document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); } }
  }, []);

  /* ── Keyboard (Escape + tab trap) ── */
  useEffect(() => {
    const h = (e) => {
      if (e.key === "Escape") {
        if (selectedChapter) return setSelectedChapter(null);
        if (showShareMenu) return setShowShareMenu(false);
        onClose();
      }
      handleTabTrap(e);
    };
    window.addEventListener("keydown", h);
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", h); document.body.style.overflow = ""; };
  }, [onClose, handleTabTrap, selectedChapter, showShareMenu]);

  /* ── Fermer share menu au clic extérieur ── */
  useEffect(() => {
    if (!showShareMenu) return;
    const h = (e) => { if (shareRef.current && !shareRef.current.contains(e.target)) setShowShareMenu(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [showShareMenu]);

  /* ── Données dérivées ── */
  const cover = typeof oeuvre.couverture === "string" ? oeuvre.couverture : oeuvre.couverture?.url || null;
  const m = { ...oeuvre, ...details };
  const slug = m.documentId ? `${m.documentId}-${slugify(m.titre || "")}` : "";
  const genres = details?.genres || [];
  const tags = details?.tags || [];
  const totalCh = allChapitres.length;
  const lastFive = [...allChapitres].reverse().slice(0, 5);
  const firstCh = allChapitres[0];
  const lastCh = allChapitres[allChapitres.length - 1];
  const readTime = totalCh * 5;
  const readLabel = readTime >= 60 ? `${Math.floor(readTime / 60)}h${readTime % 60 > 0 ? `${readTime % 60}` : ""}` : `${readTime}min`;
  const lastDate = lastCh?.publishedAt || lastCh?.createdAt;
  const majLabel = (() => {
    if (!lastDate) return null;
    const d = Math.floor((Date.now() - new Date(lastDate).getTime()) / 86400000);
    if (d === 0) return "Aujourd'hui";
    if (d === 1) return "Hier";
    if (d < 7) return `Il y a ${d}j`;
    if (d < 30) return `Il y a ${Math.floor(d / 7)} sem.`;
    return `Il y a ${Math.floor(d / 30)} mois`;
  })();

  const handleRead = (type) => {
    if (!allChapitres.length) return;
    setSelectedChapter(type === "first" ? firstCh : lastCh);
  };

  const pageUrl = typeof window !== "undefined" && slug ? `${window.location.origin}/oeuvre/${slug}` : "";
  const copyLink = async () => {
    try { await navigator.clipboard.writeText(pageUrl); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch {}
  };

  const stagger = (i) => ({ initial: { opacity: 0, y: 18 }, animate: { opacity: 1, y: 0 }, transition: { delay: 0.3 + i * 0.08, duration: 0.45, ease: [.22,1,.36,1] } });

  if (!oeuvre) return null;

  return (
    <AnimatePresence>
      {/* ═══ Keyframes pour effets spéciaux ═══ */}
      <style>{`
        @keyframes spin-glow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes shimmer { from { background-position: -200% center; } to { background-position: 200% center; } }
        @keyframes float-a { 0%,100% { transform: translate(0,0) scale(1); opacity:.25; } 50% { transform: translate(15px,-25px) scale(1.2); opacity:.5; } }
        @keyframes float-b { 0%,100% { transform: translate(0,0) scale(1); opacity:.2; } 50% { transform: translate(-20px,12px) scale(1.15); opacity:.45; } }
        @keyframes float-c { 0%,100% { transform: translate(0,0) scale(1); opacity:.15; } 50% { transform: translate(8px,18px) scale(1.25); opacity:.4; } }
        @keyframes pulse-ring { 0%,100% { box-shadow: 0 0 0 0 rgba(99,102,241,0.4); } 50% { box-shadow: 0 0 0 8px rgba(99,102,241,0); } }
      `}</style>

      {/* ═══ Overlay ═══ */}
      <motion.div key="overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/85 backdrop-blur-lg" onClick={onClose} />

      {/* ═══ MODAL WRAPPER — bordure gradient tournante ═══ */}
      <motion.div key="modal-wrap"
        initial={{ opacity: 0, y: 60, scale: 0.92 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 60, scale: 0.92 }}
        transition={{ type: "spring", damping: 24, stiffness: 220 }}
        className="fixed z-50 inset-0 m-auto w-[calc(100%-1.5rem)] sm:w-[740px] md:w-[880px] h-fit max-h-[92vh] p-[2px] rounded-[22px]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Animated spinning conic gradient border */}
        <div className="absolute inset-0 rounded-[22px] overflow-hidden pointer-events-none">
          <div className="absolute inset-[-120%]" style={{
            background: "conic-gradient(from 0deg, #6366f1, #8b5cf6, #ec4899, transparent 40%, transparent 60%, #6366f1)",
            animation: "spin-glow 4s linear infinite",
          }} />
        </div>
        {/* Ambient glow */}
        <div className="absolute -inset-6 bg-indigo-500/[0.07] rounded-[40px] blur-3xl pointer-events-none" />

        {/* ═══ MODAL CONTENT ═══ */}
        <div ref={modalRef} role="dialog" aria-modal="true"
          className="relative bg-[#111827] rounded-[20px] overflow-hidden shadow-2xl">
          <div className="overflow-y-auto max-h-[calc(92vh-4px)]" style={{ scrollbarWidth: "thin", scrollbarColor: "#334155 transparent" }}>

            {/* ════════════════ IMMERSIVE HERO ════════════════ */}
            <div className="relative h-[310px] sm:h-[370px] overflow-hidden">
              {/* Multi-layer cinematic background */}
              <div className="absolute inset-0">
                {cover ? (
                  <Image src={cover} alt="" fill className="object-cover object-[center_20%] scale-[1.15]" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-indigo-950 via-[#0a0e1a] to-black" />
                )}
                <div className="absolute inset-0 bg-[#111827]/30 backdrop-blur-[2px]" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#111827] via-[#111827]/50 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-r from-[#111827]/60 via-transparent to-[#111827]/40" />
                <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")" }} />
              </div>

              {/* Floating orbs */}
              <div className="absolute top-8 right-16 w-36 h-36 bg-indigo-500/30 rounded-full blur-[60px]" style={{ animation: "float-a 6s ease-in-out infinite" }} />
              <div className="absolute top-16 left-8 w-28 h-28 bg-violet-500/25 rounded-full blur-[50px]" style={{ animation: "float-b 8s ease-in-out infinite" }} />
              <div className="absolute bottom-16 right-32 w-24 h-24 bg-pink-500/20 rounded-full blur-[45px]" style={{ animation: "float-c 7s ease-in-out infinite" }} />

              {/* Close button with rotation */}
              <button onClick={onClose}
                className="absolute top-4 right-4 z-10 w-10 h-10 bg-white/5 hover:bg-white/15 backdrop-blur-md rounded-full flex items-center justify-center text-white/40 hover:text-white transition-all duration-300 border border-white/10 hover:border-white/25 hover:rotate-90 hover:scale-110">
                <FiX className="text-lg" />
              </button>

              {/* Hero content — cover + titre */}
              <div className="absolute bottom-0 left-0 right-0 px-6 sm:px-8 pb-7 flex gap-6 items-end">
                {/* Cover with gradient ring + glow */}
                <motion.div className="flex-shrink-0 relative"
                  initial={{ opacity: 0, x: -30, rotate: -3 }}
                  animate={{ opacity: 1, x: 0, rotate: 0 }}
                  transition={{ delay: 0.15, duration: 0.6, ease: [.22,1,.36,1] }}>
                  <div className="absolute -inset-4 bg-gradient-to-b from-indigo-500/25 via-purple-500/15 to-pink-500/10 rounded-2xl blur-2xl" />
                  <div className="absolute -inset-[3px] rounded-xl bg-gradient-to-b from-indigo-400/50 via-purple-500/30 to-pink-500/20" />
                  {cover ? (
                    <Image src={cover} alt={m.titre || ""} width={160} height={230}
                      className="relative w-[115px] sm:w-[145px] aspect-[2/3] object-cover rounded-[9px] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.8)]" />
                  ) : (
                    <div className="relative w-[115px] sm:w-[145px] aspect-[2/3] bg-[#0f1318] rounded-[9px] flex items-center justify-center">
                      <FiBook className="text-4xl text-slate-700" />
                    </div>
                  )}
                  {totalCh > 0 && (
                    <div className="absolute -top-2 -right-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow-lg" style={{ animation: "pulse-ring 2s ease-in-out infinite" }}>
                      {totalCh} ch.
                    </div>
                  )}
                </motion.div>

                {/* Titre + méta */}
                <motion.div className="flex-1 min-w-0 space-y-3"
                  initial={{ opacity: 0, y: 25 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25, duration: 0.6, ease: [.22,1,.36,1] }}>
                  <div className="flex flex-wrap gap-1.5">
                    {m.type && (
                      <span className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-indigo-200 bg-indigo-500/20 backdrop-blur-md px-2.5 py-0.5 rounded-full border border-indigo-400/25 shadow-[0_0_12px_rgba(99,102,241,0.15)]">
                        {m.type}
                      </span>
                    )}
                    {m.etat && (
                      <span className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-emerald-200 bg-emerald-500/20 backdrop-blur-md px-2.5 py-0.5 rounded-full border border-emerald-400/25 shadow-[0_0_12px_rgba(16,185,129,0.15)]">
                        {m.etat}
                      </span>
                    )}
                    {m.categorie && (
                      <span className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-sky-200 bg-sky-500/20 backdrop-blur-md px-2.5 py-0.5 rounded-full border border-sky-400/25 shadow-[0_0_12px_rgba(14,165,233,0.15)]">
                        {m.categorie}
                      </span>
                    )}
                  </div>
                  <h2 className="text-2xl sm:text-[2rem] font-black leading-[1.15] line-clamp-2" style={{
                    background: "linear-gradient(135deg, #ffffff 0%, #e0e7ff 50%, #a5b4fc 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    filter: "drop-shadow(0 2px 12px rgba(99,102,241,0.25))",
                  }}>
                    {m.titre}
                  </h2>
                  {m.titrealt && <p className="text-[11px] text-white/20 italic truncate">{m.titrealt}</p>}
                  <div className="flex items-center gap-4 text-xs">
                    {m.auteur && (
                      <span className="flex items-center gap-1.5 text-white/50 bg-white/[0.04] backdrop-blur-sm px-2 py-1 rounded-md">
                        <FiUser className="text-indigo-400" />{m.auteur}
                      </span>
                    )}
                    {m.traduction && (
                      <span className="flex items-center gap-1.5 text-white/40 bg-white/[0.04] backdrop-blur-sm px-2 py-1 rounded-md">
                        <FiGlobe className="text-emerald-400" />{m.traduction}
                      </span>
                    )}
                  </div>
                </motion.div>
              </div>
            </div>

            {/* ════════════════ BENTO STATS GRID ════════════════ */}
            <motion.div className="px-6 sm:px-8 py-5" {...stagger(0)}>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {totalCh > 0 && (
                  <div className="group bg-white/[0.025] backdrop-blur-sm border border-white/[0.06] rounded-2xl p-4 hover:bg-indigo-500/[0.06] hover:border-indigo-500/20 transition-all duration-300 cursor-default">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-7 h-7 rounded-lg bg-indigo-500/15 flex items-center justify-center">
                        <FiBookOpen className="text-indigo-400 text-xs" />
                      </div>
                      <span className="text-[10px] uppercase tracking-[0.12em] text-white/25 font-semibold">Chapitres</span>
                    </div>
                    <p className="text-3xl font-black text-white/90 group-hover:text-indigo-300 transition-colors tabular-nums">{totalCh}</p>
                  </div>
                )}
                {totalCh > 0 && (
                  <div className="group bg-white/[0.025] backdrop-blur-sm border border-white/[0.06] rounded-2xl p-4 hover:bg-amber-500/[0.06] hover:border-amber-500/20 transition-all duration-300 cursor-default">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-7 h-7 rounded-lg bg-amber-500/15 flex items-center justify-center">
                        <FiClock className="text-amber-400 text-xs" />
                      </div>
                      <span className="text-[10px] uppercase tracking-[0.12em] text-white/25 font-semibold">Lecture</span>
                    </div>
                    <p className="text-3xl font-black text-white/90 group-hover:text-amber-300 transition-colors">~{readLabel}</p>
                  </div>
                )}
                {majLabel && (
                  <div className="group bg-white/[0.025] backdrop-blur-sm border border-white/[0.06] rounded-2xl p-4 hover:bg-emerald-500/[0.06] hover:border-emerald-500/20 transition-all duration-300 cursor-default">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-7 h-7 rounded-lg bg-emerald-500/15 flex items-center justify-center">
                        <FiBarChart2 className="text-emerald-400 text-xs" />
                      </div>
                      <span className="text-[10px] uppercase tracking-[0.12em] text-white/25 font-semibold">Dernière MAJ</span>
                    </div>
                    <p className="text-lg font-bold text-white/90 group-hover:text-emerald-300 transition-colors">{majLabel}</p>
                  </div>
                )}
                {m.annee && (
                  <div className="group bg-white/[0.025] backdrop-blur-sm border border-white/[0.06] rounded-2xl p-4 hover:bg-purple-500/[0.06] hover:border-purple-500/20 transition-all duration-300 cursor-default">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-7 h-7 rounded-lg bg-purple-500/15 flex items-center justify-center">
                        <FiStar className="text-purple-400 text-xs" />
                      </div>
                      <span className="text-[10px] uppercase tracking-[0.12em] text-white/25 font-semibold">Année</span>
                    </div>
                    <p className="text-3xl font-black text-white/90 group-hover:text-purple-300 transition-colors tabular-nums">{m.annee}</p>
                  </div>
                )}
              </div>
            </motion.div>

            {/* ════════════════ ACTION BAR ════════════════ */}
            <motion.div className="px-6 sm:px-8 pb-5 flex flex-wrap items-center gap-2.5" {...stagger(1)}>
              {/* Shimmer CTA */}
              <button onClick={() => handleRead("first")} disabled={!totalCh}
                className="group relative flex items-center gap-2 text-white pl-5 pr-6 py-3 rounded-full text-sm font-extrabold transition-all duration-300 disabled:opacity-30 overflow-hidden shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-[1.04] active:scale-[0.97]"
                style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6, #a855f7)" }}>
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{
                    background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent)",
                    backgroundSize: "200% 100%",
                    animation: "shimmer 2s ease-in-out infinite",
                  }} />
                <FiBook className="text-base relative z-10" />
                <span className="relative z-10">Commencer</span>
              </button>

              <button onClick={() => handleRead("last")} disabled={!totalCh || totalCh < 2}
                className="flex items-center gap-2 bg-white/[0.04] hover:bg-white/[0.08] disabled:opacity-30 text-white/70 hover:text-white pl-5 pr-6 py-3 rounded-full text-sm font-bold transition-all duration-300 border border-white/[0.06] hover:border-indigo-400/30 hover:scale-[1.03]">
                <FiChevronsRight className="text-indigo-400" /> Ch. {lastCh?.order || "..."}
              </button>

              {/* Bouton Suivre — fonctionnel */}
              <button
                onClick={isSubscribed ? handleUnsubscribe : handleSubscribe}
                className={`flex items-center gap-2 pl-5 pr-6 py-3 rounded-full text-sm font-bold transition-all duration-300 border hover:scale-[1.03] ${
                  isSubscribed
                    ? "bg-amber-500/15 text-amber-300 border-amber-400/30 hover:bg-amber-500/25"
                    : "bg-white/[0.04] text-amber-400/80 hover:text-amber-300 border-white/[0.06] hover:border-amber-400/30 hover:bg-amber-500/10"
                }`}>
                <FiHeart className={isSubscribed ? "fill-current" : ""} />
                {isSubscribed ? "Suivi" : "Suivre"}
              </button>

              <div className="relative ml-auto flex items-center gap-2" ref={shareRef}>
                <button onClick={() => setShowShareMenu((p) => !p)}
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-white/[0.04] hover:bg-white/[0.1] text-white/30 hover:text-white transition-all duration-300 border border-white/[0.06] hover:border-white/20 hover:scale-110">
                  <FiShare2 className="text-sm" />
                </button>
                {slug && (
                  <Link href={`/oeuvre/${slug}`}
                    className="w-10 h-10 flex items-center justify-center rounded-full bg-white/[0.04] hover:bg-white/[0.1] text-white/30 hover:text-white transition-all duration-300 border border-white/[0.06] hover:border-white/20 hover:scale-110">
                    <FiExternalLink className="text-sm" />
                  </Link>
                )}
                <AnimatePresence>
                  {showShareMenu && (
                    <motion.div initial={{ opacity: 0, y: 8, scale: 0.92 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: 0.92 }}
                      className="absolute top-full mt-2.5 right-0 bg-[#0f1318]/95 backdrop-blur-2xl border border-white/[0.1] rounded-2xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.8)] p-2 min-w-[185px] z-30">
                      <button onClick={copyLink}
                        className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-white/45 hover:text-white hover:bg-white/[0.06] rounded-xl transition">
                        {copied ? <FiCheck className="text-emerald-400" /> : <FiCopy />} {copied ? "Copié !" : "Copier le lien"}
                      </button>
                      <a href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(m.titre || "")}&url=${encodeURIComponent(pageUrl)}`}
                        target="_blank" rel="noopener noreferrer"
                        className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-white/45 hover:text-white hover:bg-white/[0.06] rounded-xl transition">
                        <FaTwitter className="text-sky-400" /> Twitter / X
                      </a>
                      <a href={`https://www.reddit.com/submit?url=${encodeURIComponent(pageUrl)}&title=${encodeURIComponent(m.titre || "")}`}
                        target="_blank" rel="noopener noreferrer"
                        className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-white/45 hover:text-white hover:bg-white/[0.06] rounded-xl transition">
                        <FaRedditAlien className="text-orange-400" /> Reddit
                      </a>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>

            {/* Gradient separator */}
            <div className="mx-6 sm:mx-8 h-px bg-gradient-to-r from-transparent via-indigo-500/15 to-transparent" />

            {/* ════════════════ BODY ════════════════ */}
            <div className="px-6 sm:px-8 py-7 space-y-7">

              {/* ── Synopsis avec barre accent ── */}
              {m.synopsis && (
                <motion.div {...stagger(2)}>
                  <h3 className="text-xs font-bold text-white/50 uppercase tracking-[0.2em] mb-3 flex items-center gap-2.5">
                    <div className="w-1 h-4 rounded-full bg-gradient-to-b from-indigo-400 to-purple-500" />
                    Synopsis
                  </h3>
                  <div className="relative">
                    <div className="pl-4 border-l-2 border-indigo-500/15">
                      <div
                        className={`text-[13px] text-white/55 leading-[1.85] ${!synopsisExpanded ? "line-clamp-5" : ""}`}
                        style={{ whiteSpace: "pre-wrap" }}
                        dangerouslySetInnerHTML={{
                          __html: DOMPurify.sanitize(
                            typeof m.synopsis === "string" ? m.synopsis.replace(/\r\n|\n|\r/g, "<br>") : ""
                          ),
                        }}
                      />
                    </div>
                    {!synopsisExpanded && (
                      <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-[#111827] to-transparent" />
                    )}
                    <button onClick={() => setSynopsisExpanded((p) => !p)}
                      className="relative z-10 mt-2 text-[11px] font-semibold text-indigo-400/60 hover:text-indigo-300 transition flex items-center gap-1">
                      {synopsisExpanded ? "Réduire" : "Lire la suite"} <FiArrowRight className={`text-[9px] transition-transform ${synopsisExpanded ? "rotate-[-90deg]" : "rotate-90"}`} />
                    </button>
                  </div>
                </motion.div>
              )}

              {/* ── Infos rapides ── */}
              {(m.langage || m.categorie || m.type) && (
                <motion.div className="flex flex-wrap gap-3" {...stagger(3)}>
                  {[
                    m.categorie && ["Catégorie", m.categorie, "from-sky-500/15 to-sky-500/5", "border-sky-500/15", "text-sky-300/80"],
                    m.type && ["Type", m.type, "from-indigo-500/15 to-indigo-500/5", "border-indigo-500/15", "text-indigo-300/80"],
                    m.langage && ["Langage", m.langage, "from-violet-500/15 to-violet-500/5", "border-violet-500/15", "text-violet-300/80"],
                    m.etat && ["État", m.etat, "from-emerald-500/15 to-emerald-500/5", "border-emerald-500/15", "text-emerald-300/80"],
                  ].filter(Boolean).map(([label, val, bg, border, color]) => (
                    <div key={label} className={`flex items-center gap-2 bg-gradient-to-r ${bg} border ${border} rounded-lg px-3 py-1.5`}>
                      <span className="text-[10px] uppercase tracking-wider text-white/20 font-medium">{label}</span>
                      <span className={`text-xs font-semibold ${color}`}>{val}</span>
                    </div>
                  ))}
                  {m.licence !== undefined && (
                    <div className={`flex items-center gap-2 bg-gradient-to-r ${m.licence ? "from-amber-500/15 to-amber-500/5 border-amber-500/15" : "from-white/[0.03] to-transparent border-white/[0.06]"} border rounded-lg px-3 py-1.5`}>
                      <span className="text-[10px] uppercase tracking-wider text-white/20 font-medium">Licence</span>
                      <span className={`text-xs font-semibold ${m.licence ? "text-amber-300/80" : "text-white/30"}`}>{m.licence ? "⚠️ Licencié" : "Non licencié"}</span>
                    </div>
                  )}
                </motion.div>
              )}

              {/* ── Genres & Tags ── */}
              {(genres.length > 0 || tags.length > 0) && (
                <motion.div className="space-y-4" {...stagger(4)}>
                  {genres.length > 0 && (
                    <div>
                      <h3 className="text-xs font-bold text-white/50 uppercase tracking-[0.2em] mb-2.5 flex items-center gap-2.5">
                        <div className="w-1 h-4 rounded-full bg-gradient-to-b from-pink-400 to-rose-500" />
                        Genres <span className="text-white/15 font-normal">({genres.length})</span>
                      </h3>
                      <div className="flex flex-wrap gap-1.5">
                        {(showAllGenres ? genres : genres.slice(0, 10)).map((g) => (
                          <Link key={g.id || g.nom || g.titre}
                            href={`/tags-genres/genre/${slugify(g.titre || g.nom || "")}`}
                            className="text-[11px] font-semibold text-pink-300/70 bg-pink-500/8 hover:bg-pink-500/15 px-3 py-1.5 rounded-lg transition-all duration-200 border border-pink-500/10 hover:border-pink-500/25 hover:text-pink-200 hover:scale-[1.04] hover:shadow-[0_0_12px_rgba(236,72,153,0.12)]">
                            {g.titre || g.nom}
                          </Link>
                        ))}
                        {genres.length > 10 && (
                          <button onClick={() => setShowAllGenres((p) => !p)}
                            className="text-[11px] text-pink-400/40 hover:text-pink-300 px-2.5 py-1.5 transition font-medium">
                            {showAllGenres ? "− Réduire" : `+${genres.length - 10}`}
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                  {tags.length > 0 && (
                    <div>
                      <h3 className="text-xs font-bold text-white/50 uppercase tracking-[0.2em] mb-2.5 flex items-center gap-2.5">
                        <div className="w-1 h-4 rounded-full bg-gradient-to-b from-slate-400 to-slate-600" />
                        Tags <span className="text-white/15 font-normal">({tags.length})</span>
                      </h3>
                      <div className="flex flex-wrap gap-1.5">
                        {(showAllTags ? tags : tags.slice(0, 12)).map((t) => (
                          <Link key={t.id || t.nom || t.titre}
                            href={`/tags-genres/tag/${slugify(t.titre || t.nom || "")}`}
                            className="text-[11px] font-medium text-white/30 bg-white/[0.03] hover:bg-white/[0.07] px-3 py-1.5 rounded-lg transition-all duration-200 border border-white/[0.04] hover:border-white/[0.12] hover:text-white/60 hover:scale-[1.04]">
                            {t.titre || t.nom}
                          </Link>
                        ))}
                        {tags.length > 12 && (
                          <button onClick={() => setShowAllTags((p) => !p)}
                            className="text-[11px] text-white/20 hover:text-white/40 px-2.5 py-1.5 transition font-medium">
                            {showAllTags ? "− Réduire" : `+${tags.length - 12}`}
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Gradient separator */}
              <div className="h-px bg-gradient-to-r from-transparent via-white/[0.04] to-transparent" />

              {/* ── Chapitres en timeline ── */}
              <motion.div {...stagger(5)}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs font-bold text-white/50 uppercase tracking-[0.2em] flex items-center gap-2.5">
                    <div className="w-1 h-4 rounded-full bg-gradient-to-b from-amber-400 to-orange-500" />
                    Derniers chapitres
                    {totalCh > 0 && <span className="text-white/15 font-normal">({totalCh})</span>}
                  </h3>
                  {totalCh > 5 && slug && (
                    <Link href={`/oeuvre/${slug}`}
                      className="text-[11px] text-indigo-400/50 hover:text-indigo-300 flex items-center gap-1.5 transition group">
                      Tout voir <FiArrowRight className="text-[9px] group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                  )}
                </div>
                {lastFive.length > 0 ? (
                  <div className="relative pl-5">
                    <div className="absolute left-[7px] top-2 bottom-2 w-px bg-gradient-to-b from-indigo-500/30 via-indigo-500/10 to-transparent" />
                    <div className="space-y-1">
                      {lastFive.map((ch, i) => (
                        <a key={ch.id || ch.order}
                          href={ch.lien || "#"} target="_blank" rel="noopener noreferrer"
                          className="relative flex items-center gap-4 py-2.5 pl-4 -ml-5 group hover:bg-white/[0.02] rounded-lg transition-all duration-200">
                          <div className={`absolute left-[3px] w-[9px] h-[9px] rounded-full border-2 border-[#111827] transition-all duration-300 ${
                            i === 0
                              ? "bg-indigo-400 shadow-[0_0_8px_rgba(99,102,241,0.5)]"
                              : "bg-white/10 group-hover:bg-indigo-400 group-hover:shadow-[0_0_6px_rgba(99,102,241,0.3)]"
                          }`} />
                          <span className="text-[11px] font-mono font-bold text-indigo-400/30 w-8 text-right flex-shrink-0 tabular-nums">{ch.order}</span>
                          <div className="flex-1 min-w-0">
                            <span className="text-sm text-white/65 group-hover:text-white/95 transition-colors truncate block">
                              {ch.titre || `Chapitre ${ch.order}`}
                            </span>
                            <div className="flex items-center gap-2 mt-0.5">
                              {(ch.publishedAt || ch.createdAt) && (
                                <span className="text-[10px] text-white/15">
                                  {new Date(ch.publishedAt || ch.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}
                                </span>
                              )}
                              {ch.users_permissions_users?.[0]?.username && (
                                <span className="text-[10px] text-indigo-400/30 flex items-center gap-1">
                                  <FiUser className="text-[8px]" />{ch.users_permissions_users[0].username}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-3 flex-shrink-0 opacity-50 group-hover:opacity-100 transition-opacity">
                            {ch.publishedAt && <span className="text-[10px] text-white/20">{timeAgo(ch.publishedAt)}</span>}
                            <FiExternalLink className="text-[11px] text-white/10 group-hover:text-indigo-400/60 transition-colors" />
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2.5 text-sm text-white/25 py-10">
                    <div className="w-4 h-4 border-2 border-white/10 border-t-indigo-400/50 rounded-full animate-spin" />
                    Chargement...
                  </div>
                )}
              </motion.div>

              {/* ── Licence warning ── */}
              {m.licence && (
                <motion.div {...stagger(6)}
                  className="relative overflow-hidden bg-gradient-to-r from-amber-500/[0.06] via-amber-500/[0.03] to-transparent border border-amber-500/10 rounded-2xl px-5 py-4">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-3xl" />
                  <div className="relative flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-lg">⚠️</span>
                    </div>
                    <div>
                      <p className="text-[12px] font-bold text-amber-200/70">Œuvre licenciée</p>
                      <p className="text-[11px] text-amber-300/40 mt-0.5">Soutenez l&apos;auteur en achetant la version officielle.</p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Gradient separator */}
              <div className="h-px bg-gradient-to-r from-transparent via-white/[0.04] to-transparent" />

              {/* ── Commentaires ── */}
              <motion.div {...stagger(7)}>
                <h3 className="text-xs font-bold text-white/50 uppercase tracking-[0.2em] mb-4 flex items-center gap-2.5">
                  <div className="w-1 h-4 rounded-full bg-gradient-to-b from-teal-400 to-cyan-500" />
                  <FiMessageCircle className="text-white/20" /> Commentaires
                </h3>
                <CommentairePreview oeuvre={oeuvre} />
              </motion.div>

            </div>
          </div>

          {/* ════════════════ POPUP REDIRECTION ════════════════ */}
          <AnimatePresence>
            {selectedChapter && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/80 backdrop-blur-md flex justify-center items-center z-[60] p-6"
                onClick={() => setSelectedChapter(null)}>
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 15 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 15 }}
                  transition={{ type: "spring", damping: 25, stiffness: 300 }}
                  className="relative bg-[#0f1318] text-white p-6 rounded-2xl shadow-[0_25px_80px_-20px_rgba(0,0,0,0.9)] w-full max-w-sm space-y-5 border border-white/[0.08] overflow-hidden"
                  onClick={(e) => e.stopPropagation()}>
                  <div className="absolute -top-10 -right-10 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl" />
                  <div className="relative flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/10 flex items-center justify-center border border-indigo-500/20">
                      <FiExternalLink className="text-indigo-400 text-lg" />
                    </div>
                    <div>
                      <h2 className="text-base font-bold">Redirection externe</h2>
                      <p className="text-[11px] text-white/25">Site de traduction</p>
                    </div>
                  </div>
                  <div className="relative bg-white/[0.03] border border-white/[0.05] p-3.5 rounded-xl">
                    <p className="text-[10px] uppercase tracking-wider text-white/20 mb-1 font-medium">Chapitre {selectedChapter.order}</p>
                    <p className="text-sm font-bold text-white/80 truncate">{selectedChapter.titre || `Chapitre ${selectedChapter.order}`}</p>
                  </div>
                  <div className="relative flex gap-2.5">
                    <button onClick={() => setSelectedChapter(null)}
                      className="flex-1 px-4 py-3 bg-white/[0.05] hover:bg-white/[0.1] rounded-xl transition-all duration-200 text-sm font-medium text-white/50 hover:text-white/80">
                      Annuler
                    </button>
                    <button
                      onClick={() => { window.open(selectedChapter.lien || selectedChapter.url || "#", "_blank"); setSelectedChapter(null); }}
                      className="flex-1 px-4 py-3 rounded-xl text-sm font-bold text-white transition-all duration-200 overflow-hidden relative shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 hover:scale-[1.02] active:scale-[0.98]"
                      style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}>
                      <span className="relative z-10 flex items-center justify-center gap-2">Continuer <FiExternalLink className="text-xs" /></span>
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default FicheOeuvre;
