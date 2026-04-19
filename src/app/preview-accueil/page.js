"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { AnimatePresence } from "framer-motion";
import {
  FiBook, FiBookOpen, FiEye,
  FiArrowRight, FiX, FiExternalLink, FiStar, FiChevronsRight,
  FiUsers, FiCompass, FiHeart, FiTag, FiSearch, FiPlusCircle,
  FiShare2, FiUser, FiGlobe, FiInfo, FiFileText, FiFolder, FiClock,
  FiMessageCircle, FiCopy, FiCheck, FiBarChart2, FiTrendingUp,
  FiChevronLeft, FiChevronRight, FiAward
} from "react-icons/fi";
import { FaTwitter, FaRedditAlien, FaDiscord } from "react-icons/fa";
import { slugify } from "@/utils/slugify";
import DOMPurify from "dompurify";
import CommentairePreview from "../components/CommentairePreview";
import HeroSection from "../components/HeroSection";
import AdBanner from "../components/AdBanner";
import CtaInscription from "../components/CtaInscription";

/* ============================================================
   PREVIEW OEUVRE — Modale immersive WOW
   ============================================================ */

function PreviewOeuvre({ oeuvre, onClose }) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const [details, setDetails] = useState(null);
  const [allChapitres, setAllChapitres] = useState([]);
  const [showAllGenres, setShowAllGenres] = useState(false);
  const [showAllTags, setShowAllTags] = useState(false);
  const [selectedChapter, setSelectedChapter] = useState(null);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [copied, setCopied] = useState(false);
  const [synopsisExpanded, setSynopsisExpanded] = useState(false);
  const modalRef = useRef(null);
  const shareRef = useRef(null);

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

  const handleTabTrap = useCallback((e) => {
    if (e.key !== "Tab" || !modalRef.current) return;
    const f = modalRef.current.querySelectorAll('button, [href], input, [tabindex]:not([tabindex="-1"])');
    if (!f.length) return;
    if (e.shiftKey) { if (document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); } }
    else { if (document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); } }
  }, []);

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

  useEffect(() => {
    if (!showShareMenu) return;
    const h = (e) => { if (shareRef.current && !shareRef.current.contains(e.target)) setShowShareMenu(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [showShareMenu]);

  const cover = oeuvre.couverture;
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

  // Stagger helper
  const stagger = (i) => ({ initial: { opacity: 0, y: 18 }, animate: { opacity: 1, y: 0 }, transition: { delay: 0.3 + i * 0.08, duration: 0.45, ease: [.22,1,.36,1] } });

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
                {/* Noise overlay for cinematic texture */}
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
                  {/* Chapter count badge */}
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
                  {/* Glass badges */}
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
                  {/* Gradient title */}
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

              <button className="flex items-center gap-2 bg-white/[0.04] hover:bg-amber-500/10 text-amber-400/80 hover:text-amber-300 pl-5 pr-6 py-3 rounded-full text-sm font-bold transition-all duration-300 border border-white/[0.06] hover:border-amber-400/30 hover:scale-[1.03]">
                <FiHeart /> Suivre
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
                    {/* Timeline vertical line */}
                    <div className="absolute left-[7px] top-2 bottom-2 w-px bg-gradient-to-b from-indigo-500/30 via-indigo-500/10 to-transparent" />
                    <div className="space-y-1">
                      {lastFive.map((ch, i) => (
                        <a key={ch.id || ch.order}
                          href={ch.lien || "#"} target="_blank" rel="noopener noreferrer"
                          className="relative flex items-center gap-4 py-2.5 pl-4 -ml-5 group hover:bg-white/[0.02] rounded-lg transition-all duration-200">
                          {/* Timeline dot */}
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
                  {/* Ambient blob */}
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
                    <a href={selectedChapter.lien || selectedChapter.url || "#"} target="_blank" rel="noopener noreferrer"
                      onClick={() => setSelectedChapter(null)}
                      className="flex-1 px-4 py-3 rounded-xl transition-all duration-200 text-sm font-extrabold flex items-center justify-center gap-2 hover:scale-[1.02] shadow-lg shadow-indigo-500/20"
                      style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}>
                      Lire <FiChevronsRight />
                    </a>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </motion.div>
    </AnimatePresence>
  );
}

/* ============================================================
   UTILS
   ============================================================ */

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

function coverOf(oeuvre) {
  if (!oeuvre) return null;
  return typeof oeuvre.couverture === "string"
    ? oeuvre.couverture
    : oeuvre.couverture?.url || null;
}

function getDayLabel(dateStr) {
  const d = new Date(dateStr + "T12:00:00");
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (dateStr === today.toISOString().split("T")[0]) return "Aujourd'hui";
  if (dateStr === yesterday.toISOString().split("T")[0]) return "Hier";
  return d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "short" });
}

function makeOeuvrePayload(sortie) {
  const o = sortie.oeuvre || sortie;
  return { ...o, couverture: coverOf(o), lastChapitreUpdate: sortie.dernierUpdate || o.updatedAt };
}

/* ============================================================
   1. SORTIES — Onglets jours + grille directe (WOW v2)
   ============================================================ */

function NavigateurSorties({ allSorties, onSelect }) {
  // Dédupliquer par oeuvre+date (garder la sortie la plus récente par oeuvre par jour)
  const deduped = [];
  const seen = new Set();
  for (const s of allSorties) {
    const oe = s.oeuvre || s;
    const key = `${s.date}_${oe.documentId}`;
    if (!seen.has(key)) { seen.add(key); deduped.push(s); }
  }

  const byDate = {};
  deduped.forEach((s) => { if (!byDate[s.date]) byDate[s.date] = []; byDate[s.date].push(s); });

  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    const sorties = byDate[dateStr] || [];
    if (i === 0 || sorties.length > 0) days.push({ date: dateStr, label: getDayLabel(dateStr), sorties, count: sorties.length });
  }

  // Par défaut : premier jour qui a du contenu
  const defaultDay = days.find((d) => d.count > 0)?.date || days[0]?.date;
  const [selectedDay, setSelectedDay] = useState(defaultDay);
  const todayStr = days[0]?.date;
  const current = days.find((d) => d.date === selectedDay) || days[0];
  const isToday = selectedDay === todayStr;

  return (
    <section className="relative py-8 px-4">
      {/* Ambient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-indigo-600/[0.04] rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto relative">

        {/* ═══ HEADER ═══ */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <FiBook className="text-white text-[15px]" />
          </div>
          <h2 className="text-xl font-black text-white tracking-tight">Sorties de la semaine</h2>
          <span className="bg-indigo-500/15 text-indigo-300 px-3 py-1 rounded-full font-bold text-xs border border-indigo-500/20">
            {deduped.length}
          </span>
        </div>

        {/* ═══ DAY TABS ═══ */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 mb-6" style={{ scrollbarWidth: "none" }}>
          {days.map((day) => {
            const isActive = selectedDay === day.date;
            const isDayToday = day.date === todayStr;
            return (
              <button key={day.date} onClick={() => setSelectedDay(day.date)}
                className={`relative flex-shrink-0 flex flex-col items-center min-w-[80px] px-4 py-2.5 rounded-xl text-xs font-medium transition-all duration-300 ${
                  isActive
                    ? "bg-gradient-to-b from-indigo-500/20 to-purple-500/10 text-white border border-indigo-500/30 shadow-lg shadow-indigo-500/10"
                    : "bg-white/[0.02] text-white/30 hover:text-white/55 hover:bg-white/[0.05] border border-white/[0.04]"
                }`}
              >
                {isActive && <div className="absolute top-0 left-3 right-3 h-[2px] rounded-full bg-gradient-to-r from-indigo-400 to-purple-400" />}
                <span className="capitalize font-semibold text-[11px] mb-0.5">
                  {isDayToday ? (
                    <span className="flex items-center gap-1.5">
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-400" />
                      </span>
                      {day.label}
                    </span>
                  ) : day.label}
                </span>
                <span className={`text-lg font-black leading-none ${isActive ? "text-white" : "text-white/20"}`}>{day.count}</span>
              </button>
            );
          })}
        </div>

        {/* ═══ CURRENT DAY CONTENT ═══ */}
        <AnimatePresence mode="wait">
          <motion.div key={selectedDay}
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}>

            {/* Day info bar */}
            {current.count > 0 && isToday && current.sorties[0]?.dernierUpdate && (
              <div className="flex items-center gap-2 mb-4">
                <span className="flex items-center gap-1.5 text-green-400 text-xs font-medium">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                  </span>
                  Dernière MAJ {timeAgo(current.sorties[0].dernierUpdate)}
                </span>
              </div>
            )}

            {/* Grid */}
            {current.count === 0 ? (
              <div className="text-center py-16 bg-white/[0.015] rounded-2xl border border-white/[0.04]">
                <div className="w-14 h-14 rounded-2xl bg-white/[0.03] flex items-center justify-center mx-auto mb-4 border border-white/[0.05]">
                  <FiBook className="text-2xl text-white/10" />
                </div>
                <p className="text-white/25 text-sm mb-1">Pas encore de sortie</p>
                <p className="text-white/15 text-xs">Les nouvelles sorties apparaîtront ici</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8 gap-3 sm:gap-4">
                {current.sorties.map((sortie, i) => {
                  const oeuvre = sortie.oeuvre || sortie;
                  const cover = coverOf(oeuvre);
                  return (
                    <motion.div key={`${current.date}-${oeuvre.documentId || i}-${i}`}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25, delay: Math.min(i * 0.025, 0.3) }}
                      whileHover={{ y: -6, transition: { duration: 0.2 } }}
                      className="group relative aspect-[2/3] rounded-xl overflow-hidden cursor-pointer transition-all duration-300"
                      onClick={() => onSelect(makeOeuvrePayload(sortie))}
                    >
                      {/* Glow border on hover */}
                      <div className="absolute -inset-[1px] rounded-xl bg-gradient-to-b from-indigo-500/0 via-indigo-500/0 to-indigo-500/0 group-hover:from-indigo-500/40 group-hover:via-purple-500/20 group-hover:to-indigo-500/40 transition-all duration-500 z-0" />
                      <div className="absolute inset-[1px] rounded-[11px] overflow-hidden z-10 bg-gray-900">
                        {cover ? (
                          <Image src={cover} alt={oeuvre.titre || ""} fill sizes="(max-width:640px) 33vw, (max-width:768px) 25vw, (max-width:1024px) 20vw, (max-width:1280px) 16vw, 12vw"
                            className="object-cover group-hover:scale-110 transition-transform duration-700 ease-out" loading={i < 8 ? "eager" : "lazy"} />
                        ) : (
                          <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                            <FiBook className="text-3xl text-white/10" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent opacity-80 group-hover:opacity-90 transition-opacity duration-300" />
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-400/0 via-white/0 to-purple-400/0 group-hover:from-indigo-400/[0.06] group-hover:via-white/[0.03] group-hover:to-purple-400/[0.06] transition-all duration-500" />

                        {isToday && sortie.dernierUpdate && (
                          <div className="absolute top-2 right-2 z-20">
                            <span className="bg-black/60 text-green-400 px-2 py-0.5 text-[10px] rounded-lg font-semibold backdrop-blur-md ring-1 ring-green-500/20">
                              {timeAgo(sortie.dernierUpdate)}
                            </span>
                          </div>
                        )}
                        <div className="absolute bottom-0 left-0 right-0 p-3 z-20">
                          <div className="flex gap-1 mb-1.5">
                            <span className="inline-block bg-indigo-500/80 backdrop-blur-sm text-white px-2 py-0.5 text-[10px] rounded-lg font-semibold">{oeuvre.type}</span>
                            {sortie.source === "achat" && <span className="inline-block bg-amber-500/80 backdrop-blur-sm text-white px-2 py-0.5 text-[10px] rounded-lg font-semibold">Achat</span>}
                          </div>
                          <p className="font-bold text-xs sm:text-sm text-white truncate group-hover:text-indigo-200 transition-colors duration-300 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">{oeuvre.titre}</p>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}


/* ============================================================
   3. NOUVELLES OEUVRES (WOW)
   ============================================================ */

function NouvellesOeuvres({ onSelect }) {
  const [oeuvres, setOeuvres] = useState([]);
  const [loading, setLoading] = useState(true);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    const f = async () => {
      try {
        const today = new Date().toISOString().split("T")[0];
        const res = await fetch(`${apiUrl}/api/oeuvres?filters[createdAt][$gte]=${today}T00:00:00&sort=createdAt:desc&populate=couverture`);
        const data = await res.json();
        setOeuvres((data.data || []).map((o) => ({ ...o, couverture: o.couverture?.url || null, type: o.type || "Type inconnu", traduction: o.traduction || "Catégorie inconnue" })));
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    f();
  }, [apiUrl]);

  if (loading) return (
    <section className="relative py-10 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 animate-pulse" />
          <div className="h-6 w-48 bg-white/[0.04] rounded-lg animate-pulse" />
        </div>
        <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
          {[...Array(5)].map((_, i) => <div key={i} className="aspect-[2/3] bg-white/[0.03] rounded-xl animate-pulse border border-white/[0.04]" />)}
        </div>
      </div>
    </section>
  );

  if (oeuvres.length === 0) return null;

  return (
    <section className="relative py-10 px-4">
      {/* Ambient emerald glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[250px] bg-emerald-600/[0.03] rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-7xl mx-auto relative">
        {/* Section header */}
        <div className="flex items-center gap-3 mb-7">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/15">
            <FiPlusCircle className="text-white text-sm" />
          </div>
          <h2 className="text-xl font-black text-white tracking-tight">Nouvelles œuvres</h2>
          <span className="bg-emerald-500/15 text-emerald-400 px-3 py-1 rounded-full font-bold text-xs border border-emerald-500/20">
            {oeuvres.length}
          </span>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 sm:gap-4">
          {oeuvres.map((oeuvre, i) => {
            const cover = coverOf(oeuvre);
            return (
              <motion.div key={oeuvre.documentId || i}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: Math.min(i * 0.04, 0.4) }}
                whileHover={{ y: -6, transition: { duration: 0.2 } }}
                className="group relative aspect-[2/3] rounded-xl overflow-hidden cursor-pointer transition-all duration-300"
                onClick={() => onSelect(makeOeuvrePayload(oeuvre))}
              >
                {/* Glow border on hover */}
                <div className="absolute -inset-[1px] rounded-xl bg-gradient-to-b from-emerald-500/0 via-emerald-500/0 to-emerald-500/0 group-hover:from-emerald-500/40 group-hover:via-teal-500/20 group-hover:to-emerald-500/40 transition-all duration-500 z-0" />
                <div className="absolute inset-[1px] rounded-[11px] overflow-hidden z-10 bg-gray-900">
                  {cover ? (
                    <Image src={cover} alt={oeuvre.titre || ""} fill sizes="(max-width:640px) 33vw, (max-width:1024px) 20vw, 16vw"
                      className="object-cover group-hover:scale-110 transition-transform duration-700 ease-out" loading="lazy" />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                      <FiBook className="text-3xl text-white/10" />
                    </div>
                  )}
                  {/* Cinematic overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent opacity-80 group-hover:opacity-90 transition-opacity duration-300" />
                  {/* Hover light sweep */}
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/0 via-white/0 to-teal-400/0 group-hover:from-emerald-400/[0.06] group-hover:via-white/[0.03] group-hover:to-teal-400/[0.06] transition-all duration-500" />

                  <div className="absolute top-2 left-2 z-20">
                    <span className="bg-emerald-500/80 backdrop-blur-md text-white px-2 py-0.5 text-[10px] rounded-lg font-bold ring-1 ring-emerald-400/20 shadow-sm shadow-emerald-500/20">Nouveau</span>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-3 z-20">
                    <span className="inline-block bg-indigo-500/80 backdrop-blur-sm text-white px-2 py-0.5 text-[10px] rounded-lg mb-1.5 font-semibold">{oeuvre.type}</span>
                    <p className="font-bold text-xs sm:text-sm text-white truncate group-hover:text-emerald-200 transition-colors duration-300 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">{oeuvre.titre}</p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   PAGE COMPLÈTE
   ============================================================ */

/* ── 4. À DÉCOUVRIR — Vitrine oeuvres mises à jour récemment ── */
function OeuvresVitrine({ onSelect }) {
  const [oeuvres, setOeuvres] = useState([]);
  const [loading, setLoading] = useState(true);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    const f = async () => {
      try {
        // Étape 1 : chapitres les plus récents → oeuvre documentIds uniques
        const chapRes = await fetch(
          `${apiUrl}/api/chapitres?sort=createdAt:desc&pagination[limit]=40&populate[0]=oeuvres`
        );
        const chapData = await chapRes.json();
        const seen = new Set();
        const oeuvreIds = [];
        for (const ch of chapData.data || []) {
          const oe = Array.isArray(ch.oeuvres) ? ch.oeuvres[0] : ch.oeuvres;
          if (oe?.documentId && !seen.has(oe.documentId)) {
            seen.add(oe.documentId);
            oeuvreIds.push(oe.documentId);
            if (oeuvreIds.length >= 6) break;
          }
        }
        if (oeuvreIds.length === 0) { setLoading(false); return; }

        // Étape 2 : fetch complet de ces oeuvres
        const filters = oeuvreIds.map((id, i) => `filters[documentId][$in][${i}]=${id}`).join("&");
        const res = await fetch(
          `${apiUrl}/api/oeuvres?${filters}&populate[0]=couverture&populate[1]=genres&populate[2]=chapitres`
        );
        const data = await res.json();

        // Remettre dans l'ordre des chapitres récents
        const map = new Map((data.data || []).map((o) => [o.documentId, o]));
        setOeuvres(oeuvreIds.map((id) => map.get(id)).filter(Boolean).map((o) => ({
          documentId: o.documentId,
          titre: o.titre,
          type: o.type || "Type inconnu",
          synopsis: o.synopsis || "",
          traduction: o.traduction || null,
          etat: o.etat || null,
          couverture: o.couverture?.url || null,
          genres: (o.genres || []).map((g) => g.titre).filter(Boolean).slice(0, 4),
          chapitresCount: o.chapitres?.length || 0,
        })));
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    f();
  }, [apiUrl]);

  if (loading) return (
    <section className="relative py-10 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/10 animate-pulse" />
          <div className="h-6 w-52 bg-white/[0.04] rounded-lg animate-pulse" />
        </div>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => <div key={i} className="h-48 bg-white/[0.03] rounded-2xl animate-pulse border border-white/[0.04]" />)}
        </div>
      </div>
    </section>
  );

  if (oeuvres.length === 0) return null;

  // 1 featured (first) + rest in grid
  const featured = oeuvres[0];
  const rest = oeuvres.slice(1);
  const featuredCover = featured.couverture ? (featured.couverture.startsWith("http") ? featured.couverture : `${apiUrl}${featured.couverture}`) : null;

  const cleanSynopsis = (html) => {
    if (!html) return "";
    const text = html.replace(/<br\s*\/?>/gi, " ").replace(/<[^>]+>/g, "").replace(/\r?\n/g, " ").replace(/\s+/g, " ").trim();
    return text.length > 200 ? text.slice(0, 200) + "…" : text;
  };

  return (
    <section className="relative py-10 px-4">
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[500px] h-[300px] bg-amber-600/[0.03] rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto relative">
        {/* Header */}
        <div className="flex items-center justify-between mb-7">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/15">
              <FiStar className="text-white text-[15px]" />
            </div>
            <h2 className="text-xl font-black text-white tracking-tight">À découvrir</h2>
            <span className="bg-amber-500/15 text-amber-300 px-3 py-1 rounded-full font-bold text-xs border border-amber-500/20">
              Derniers chapitres
            </span>
          </div>
          <Link href="/Oeuvres" className="hidden sm:flex items-center gap-1.5 text-amber-400/60 hover:text-amber-300 text-sm font-medium transition-colors">
            Voir tout <FiArrowRight className="text-xs" />
          </Link>
        </div>

        {/* Featured — Grande carte horizontale */}
        <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4 }}
          className="group relative mb-6 cursor-pointer" onClick={() => onSelect({ documentId: featured.documentId, titre: featured.titre, type: featured.type })}>
          <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-r from-amber-500/0 via-orange-500/0 to-amber-500/0 group-hover:from-amber-500/30 group-hover:via-orange-500/15 group-hover:to-amber-500/30 transition-all duration-500" />
          <div className="relative flex flex-col sm:flex-row bg-white/[0.02] border border-white/[0.06] group-hover:border-amber-500/20 rounded-2xl overflow-hidden transition-all duration-300">
            {/* Cover */}
            <div className="relative sm:w-[220px] md:w-[260px] flex-shrink-0 aspect-[2/3] sm:aspect-auto sm:min-h-[280px]">
              {featuredCover ? (
                <Image src={featuredCover} alt={featured.titre} fill className="object-cover group-hover:scale-105 transition-transform duration-700" sizes="260px" />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                  <FiBook className="text-4xl text-white/10" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#111827] hidden sm:block" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#111827] to-transparent sm:hidden" />
            </div>

            {/* Info */}
            <div className="flex-1 p-5 sm:p-7 flex flex-col justify-center relative">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="bg-amber-500/80 text-white px-2.5 py-0.5 text-[11px] rounded-lg font-semibold">{featured.type}</span>
                {featured.etat && <span className="bg-white/[0.06] text-white/50 px-2.5 py-0.5 text-[11px] rounded-lg font-medium">{featured.etat}</span>}
                {featured.chapitresCount > 0 && (
                  <span className="flex items-center gap-1 text-white/30 text-[11px]">
                    <FiFileText className="text-[10px]" />{featured.chapitresCount} ch.
                  </span>
                )}
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-white mb-2 group-hover:text-amber-200 transition-colors leading-tight">{featured.titre}</h3>
              {featured.traduction && (
                <p className="text-white/30 text-xs mb-3 flex items-center gap-1.5">
                  <FiUsers className="text-[10px]" />{featured.traduction}
                </p>
              )}
              <p className="text-white/40 text-sm leading-relaxed mb-4 line-clamp-3">{cleanSynopsis(featured.synopsis)}</p>
              {featured.genres.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {featured.genres.map((g) => (
                    <span key={g} className="bg-white/[0.04] text-white/40 px-2.5 py-1 rounded-lg text-[11px] font-medium border border-white/[0.04]">{g}</span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Grille — Cartes plus compactes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {rest.map((oeuvre, i) => {
            const cover = oeuvre.couverture ? (oeuvre.couverture.startsWith("http") ? oeuvre.couverture : `${apiUrl}${oeuvre.couverture}`) : null;
            return (
              <motion.div key={oeuvre.documentId || i}
                initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ duration: 0.3, delay: Math.min(i * 0.06, 0.3) }}
                className="group relative cursor-pointer"
                onClick={() => onSelect({ documentId: oeuvre.documentId, titre: oeuvre.titre, type: oeuvre.type })}
              >
                <div className="absolute -inset-[1px] rounded-xl bg-gradient-to-b from-amber-500/0 to-amber-500/0 group-hover:from-amber-500/20 group-hover:to-orange-500/10 transition-all duration-500" />
                <div className="relative flex gap-4 bg-white/[0.02] border border-white/[0.06] group-hover:border-amber-500/20 rounded-xl p-3.5 transition-all duration-300 h-full">
                  {/* Mini cover */}
                  <div className="relative flex-shrink-0 w-[80px] sm:w-[90px] aspect-[2/3] rounded-lg overflow-hidden bg-gray-900">
                    {cover ? (
                      <Image src={cover} alt={oeuvre.titre} fill className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="90px" />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                        <FiBook className="text-xl text-white/10" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="bg-amber-500/70 text-white px-2 py-0.5 text-[10px] rounded-md font-semibold">{oeuvre.type}</span>
                      {oeuvre.chapitresCount > 0 && (
                        <span className="text-white/25 text-[10px]">{oeuvre.chapitresCount} ch.</span>
                      )}
                    </div>
                    <h4 className="font-bold text-sm text-white truncate group-hover:text-amber-200 transition-colors mb-1">{oeuvre.titre}</h4>
                    {oeuvre.traduction && (
                      <p className="text-white/25 text-[11px] mb-1.5 truncate">{oeuvre.traduction}</p>
                    )}
                    <p className="text-white/30 text-xs leading-relaxed line-clamp-2">{cleanSynopsis(oeuvre.synopsis)}</p>
                    {oeuvre.genres.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {oeuvre.genres.slice(0, 3).map((g) => (
                          <span key={g} className="bg-white/[0.04] text-white/30 px-2 py-0.5 rounded-md text-[10px] border border-white/[0.03]">{g}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Mobile "voir tout" */}
        <div className="sm:hidden text-center mt-5">
          <Link href="/Oeuvres" className="inline-flex items-center gap-1.5 text-amber-400/60 hover:text-amber-300 text-sm font-medium transition-colors">
            Voir toutes les oeuvres <FiArrowRight className="text-xs" />
          </Link>
        </div>
      </div>
    </section>
  );
}


/* ── 5. TOP TEAMS ── */
function TopTeams() {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    const f = async () => {
      try {
        const res = await fetch(`${apiUrl}/api/teams?populate[0]=couverture&populate[1]=oeuvres&pagination[limit]=12&sort=createdAt:asc`);
        const data = await res.json();
        const items = (data.data || [])
          .map((t) => ({
            documentId: t.documentId,
            nom: t.titre || "Team",
            avatar: t.couverture?.url ? (t.couverture.url.startsWith("http") ? t.couverture.url : `${apiUrl}${t.couverture.url}`) : null,
            oeuvresCount: t.oeuvres?.length || 0,
          }))
          .sort((a, b) => b.oeuvresCount - a.oeuvresCount)
          .slice(0, 8);
        setTeams(items);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    f();
  }, [apiUrl]);

  if (loading) return (
    <section className="relative py-10 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/10 animate-pulse" />
          <div className="h-6 w-48 bg-white/[0.04] rounded-lg animate-pulse" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-white/[0.03] rounded-xl animate-pulse border border-white/[0.04]" />)}
        </div>
      </div>
    </section>
  );

  if (teams.length === 0) return null;

  return (
    <section className="relative py-10 px-4">
      <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-[400px] h-[250px] bg-violet-600/[0.03] rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-7xl mx-auto relative">
        {/* Header */}
        <div className="flex items-center justify-between mb-7">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center shadow-lg shadow-violet-500/15">
              <FiUsers className="text-white text-[15px]" />
            </div>
            <h2 className="text-xl font-black text-white tracking-tight">Teams de traduction</h2>
            <span className="bg-violet-500/15 text-violet-300 px-3 py-1 rounded-full font-bold text-xs border border-violet-500/20">
              Top {teams.length}
            </span>
          </div>
          <Link href="/Teams" className="hidden sm:flex items-center gap-1.5 text-violet-400/60 hover:text-violet-300 text-sm font-medium transition-colors">
            Voir tout <FiArrowRight className="text-xs" />
          </Link>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {teams.map((team, i) => (
            <motion.div key={team.documentId || i}
              initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ duration: 0.3, delay: Math.min(i * 0.05, 0.3) }}>
              <Link href={`/Teams/${slugify(team.nom)}-${team.documentId}`}
                className="group relative flex items-center gap-3 bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.06] hover:border-violet-500/30 rounded-xl p-4 transition-all duration-300">
                {/* Avatar */}
                <div className="relative flex-shrink-0 w-12 h-12 rounded-xl overflow-hidden bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 border border-white/[0.06]">
                  {team.avatar ? (
                    <Image src={team.avatar} alt={team.nom} fill className="object-cover" sizes="48px" />
                  ) : (
                    <div className="flex items-center justify-center w-full h-full">
                      <FiUsers className="text-xl text-violet-400/40" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-sm text-white truncate group-hover:text-violet-200 transition-colors">{team.nom}</p>
                  <p className="text-white/30 text-xs mt-0.5">{team.oeuvresCount} œuvre{team.oeuvresCount > 1 ? "s" : ""}</p>
                </div>
                {/* Rank */}
                {i < 3 && (
                  <span className={`flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-md text-[10px] font-black ${
                    i === 0 ? "bg-amber-500/20 text-amber-400" : i === 1 ? "bg-gray-400/20 text-gray-300" : "bg-amber-700/20 text-amber-500"
                  }`}>
                    <FiAward className="text-xs" />
                  </span>
                )}
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Mobile "voir tout" */}
        <div className="sm:hidden text-center mt-5">
          <Link href="/Teams" className="inline-flex items-center gap-1.5 text-violet-400/60 hover:text-violet-300 text-sm font-medium transition-colors">
            Voir toutes les teams <FiArrowRight className="text-xs" />
          </Link>
        </div>
      </div>
    </section>
  );
}


/* ── 5b. DÉCOUVRIR PAR TEAM ── */
function DecouvrirParTeam({ onSelect }) {
  const [oeuvres, setOeuvres] = useState([]);
  const [teamName, setTeamName] = useState("");
  const [teamId, setTeamId] = useState("");
  const [loading, setLoading] = useState(true);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    const f = async () => {
      try {
        // Récupérer les top teams pour en choisir une au hasard parmi les 5 meilleures
        const teamsRes = await fetch(
          `${apiUrl}/api/teams?populate[0]=oeuvres&populate[1]=couverture&pagination[limit]=10&sort=createdAt:asc`
        );
        const teamsData = await teamsRes.json();
        const sorted = (teamsData.data || [])
          .map((t) => ({ documentId: t.documentId, nom: t.titre || "Team", count: t.oeuvres?.length || 0 }))
          .filter((t) => t.count >= 4)
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);
        if (sorted.length === 0) { setLoading(false); return; }

        // Choisir une team différente chaque jour (rotation quotidienne)
        const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
        const pick = sorted[dayOfYear % sorted.length];
        setTeamName(pick.nom);
        setTeamId(pick.documentId);

        // Fetch les oeuvres de cette team avec couverture + chapitres
        const res = await fetch(
          `${apiUrl}/api/teams/${pick.documentId}?populate[oeuvres][populate][0]=couverture&populate[oeuvres][populate][1]=chapitres`
        );
        const data = await res.json();
        const items = (data.data?.oeuvres || []).slice(0, 6).map((o) => ({
          documentId: o.documentId,
          titre: o.titre,
          type: o.type || "Type inconnu",
          synopsis: o.synopsis || "",
          traduction: pick.nom,
          etat: o.etat || null,
          couverture: o.couverture?.url || null,
          chapitresCount: o.chapitres?.length || 0,
        }));
        setOeuvres(items);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    f();
  }, [apiUrl]);

  const cleanSynopsis = (html) => {
    if (!html) return "";
    const text = html.replace(/<br\s*\/?>/gi, " ").replace(/<[^>]+>/g, "").replace(/\r?\n/g, " ").replace(/\s+/g, " ").trim();
    return text.length > 200 ? text.slice(0, 200) + "…" : text;
  };

  if (loading) return (
    <section className="relative py-10 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500/20 to-teal-500/10 animate-pulse" />
          <div className="h-6 w-56 bg-white/[0.04] rounded-lg animate-pulse" />
        </div>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => <div key={i} className="h-48 bg-white/[0.03] rounded-2xl animate-pulse border border-white/[0.04]" />)}
        </div>
      </div>
    </section>
  );

  if (oeuvres.length === 0) return null;

  const featured = oeuvres[0];
  const rest = oeuvres.slice(1);
  const featuredCover = featured.couverture ? (featured.couverture.startsWith("http") ? featured.couverture : `${apiUrl}${featured.couverture}`) : null;

  return (
    <section className="relative py-10 px-4">
      <div className="absolute bottom-0 left-1/3 w-[500px] h-[300px] bg-cyan-600/[0.03] rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto relative">
        {/* Header */}
        <div className="flex items-center justify-between mb-7">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-teal-600 flex items-center justify-center shadow-lg shadow-cyan-500/15">
              <FiCompass className="text-white text-[15px]" />
            </div>
            <h2 className="text-xl font-black text-white tracking-tight">Traduit par</h2>
            <Link href={`/Teams/${slugify(teamName)}-${teamId}`}
              className="bg-cyan-500/15 text-cyan-300 px-3 py-1 rounded-full font-bold text-xs border border-cyan-500/20 hover:bg-cyan-500/25 transition-colors">
              {teamName}
            </Link>
          </div>
          <Link href={`/Teams/${slugify(teamName)}-${teamId}`} className="hidden sm:flex items-center gap-1.5 text-cyan-400/60 hover:text-cyan-300 text-sm font-medium transition-colors">
            Voir la team <FiArrowRight className="text-xs" />
          </Link>
        </div>

        {/* Featured — Grande carte horizontale */}
        <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4 }}
          className="group relative mb-6 cursor-pointer" onClick={() => onSelect({ documentId: featured.documentId, titre: featured.titre, type: featured.type })}>
          <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-r from-cyan-500/0 via-teal-500/0 to-cyan-500/0 group-hover:from-cyan-500/30 group-hover:via-teal-500/15 group-hover:to-cyan-500/30 transition-all duration-500" />
          <div className="relative flex flex-col sm:flex-row bg-white/[0.02] border border-white/[0.06] group-hover:border-cyan-500/20 rounded-2xl overflow-hidden transition-all duration-300">
            {/* Cover */}
            <div className="relative sm:w-[220px] md:w-[260px] flex-shrink-0 aspect-[2/3] sm:aspect-auto sm:min-h-[280px]">
              {featuredCover ? (
                <Image src={featuredCover} alt={featured.titre} fill className="object-cover group-hover:scale-105 transition-transform duration-700" sizes="260px" />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                  <FiBook className="text-4xl text-white/10" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#111827] hidden sm:block" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#111827] to-transparent sm:hidden" />
            </div>

            {/* Info */}
            <div className="flex-1 p-5 sm:p-7 flex flex-col justify-center relative">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="bg-cyan-500/80 text-white px-2.5 py-0.5 text-[11px] rounded-lg font-semibold">{featured.type}</span>
                {featured.etat && <span className="bg-white/[0.06] text-white/50 px-2.5 py-0.5 text-[11px] rounded-lg font-medium">{featured.etat}</span>}
                {featured.chapitresCount > 0 && (
                  <span className="flex items-center gap-1 text-white/30 text-[11px]">
                    <FiFileText className="text-[10px]" />{featured.chapitresCount} ch.
                  </span>
                )}
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-white mb-2 group-hover:text-cyan-200 transition-colors leading-tight">{featured.titre}</h3>
              <p className="text-white/30 text-xs mb-3 flex items-center gap-1.5">
                <FiUsers className="text-[10px]" />{teamName}
              </p>
              <p className="text-white/40 text-sm leading-relaxed mb-4 line-clamp-3">{cleanSynopsis(featured.synopsis)}</p>
            </div>
          </div>
        </motion.div>

        {/* Grille — Cartes compactes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {rest.map((oeuvre, i) => {
            const cover = oeuvre.couverture ? (oeuvre.couverture.startsWith("http") ? oeuvre.couverture : `${apiUrl}${oeuvre.couverture}`) : null;
            return (
              <motion.div key={oeuvre.documentId || i}
                initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ duration: 0.3, delay: Math.min(i * 0.06, 0.3) }}
                className="group relative cursor-pointer"
                onClick={() => onSelect({ documentId: oeuvre.documentId, titre: oeuvre.titre, type: oeuvre.type })}
              >
                <div className="absolute -inset-[1px] rounded-xl bg-gradient-to-b from-cyan-500/0 to-cyan-500/0 group-hover:from-cyan-500/20 group-hover:to-teal-500/10 transition-all duration-500" />
                <div className="relative flex gap-4 bg-white/[0.02] border border-white/[0.06] group-hover:border-cyan-500/20 rounded-xl p-3.5 transition-all duration-300 h-full">
                  {/* Mini cover */}
                  <div className="relative flex-shrink-0 w-[80px] sm:w-[90px] aspect-[2/3] rounded-lg overflow-hidden bg-gray-900">
                    {cover ? (
                      <Image src={cover} alt={oeuvre.titre} fill className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="90px" />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                        <FiBook className="text-xl text-white/10" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="bg-cyan-500/70 text-white px-2 py-0.5 text-[10px] rounded-md font-semibold">{oeuvre.type}</span>
                      {oeuvre.chapitresCount > 0 && (
                        <span className="text-white/25 text-[10px]">{oeuvre.chapitresCount} ch.</span>
                      )}
                    </div>
                    <h4 className="font-bold text-sm text-white truncate group-hover:text-cyan-200 transition-colors mb-1">{oeuvre.titre}</h4>
                    <p className="text-white/25 text-[11px] mb-1.5 truncate">{teamName}</p>
                    <p className="text-white/30 text-xs leading-relaxed line-clamp-2">{cleanSynopsis(oeuvre.synopsis)}</p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Mobile "voir tout" */}
        <div className="sm:hidden text-center mt-5">
          <Link href={`/Teams/${slugify(teamName)}-${teamId}`} className="inline-flex items-center gap-1.5 text-cyan-400/60 hover:text-cyan-300 text-sm font-medium transition-colors">
            Voir toutes les oeuvres de {teamName} <FiArrowRight className="text-xs" />
          </Link>
        </div>
      </div>
    </section>
  );
}


/* ── 5c. DÉCOUVRIR PAR GENRE ── */
function DecouvrirParGenre({ onSelect }) {
  const [oeuvres, setOeuvres] = useState([]);
  const [genreName, setGenreName] = useState("");
  const [loading, setLoading] = useState(true);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    const f = async () => {
      try {
        const genresRes = await fetch(
          `${apiUrl}/api/genres?populate=oeuvres&pagination[limit]=50`
        );
        const genresData = await genresRes.json();
        const eligible = (genresData.data || [])
          .filter((g) => (g.oeuvres?.length || 0) >= 6 && g.titre)
          .sort((a, b) => (b.oeuvres?.length || 0) - (a.oeuvres?.length || 0))
          .slice(0, 10);
        if (eligible.length === 0) { setLoading(false); return; }

        // Rotation quotidienne (décalé de 3 pour ne pas coïncider avec la team)
        const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
        const pick = eligible[(dayOfYear + 3) % eligible.length];
        setGenreName(pick.titre);

        // Fetch oeuvres du genre avec couverture + chapitres
        const res = await fetch(
          `${apiUrl}/api/genres/${pick.documentId}?populate[oeuvres][populate][0]=couverture&populate[oeuvres][populate][1]=chapitres`
        );
        const data = await res.json();
        const items = (data.data?.oeuvres || [])
          .filter((o) => o.titre)
          .slice(0, 6)
          .map((o) => ({
            documentId: o.documentId,
            titre: o.titre,
            type: o.type || "Type inconnu",
            synopsis: o.synopsis || "",
            traduction: o.traduction || null,
            etat: o.etat || null,
            couverture: o.couverture?.url || null,
            chapitresCount: o.chapitres?.length || 0,
          }));
        setOeuvres(items);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    f();
  }, [apiUrl]);

  const cleanSynopsis = (html) => {
    if (!html) return "";
    const text = html.replace(/<br\s*\/?>/gi, " ").replace(/<[^>]+>/g, "").replace(/\r?\n/g, " ").replace(/\s+/g, " ").trim();
    return text.length > 200 ? text.slice(0, 200) + "…" : text;
  };

  if (loading) return (
    <section className="relative py-10 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-500/20 to-pink-500/10 animate-pulse" />
          <div className="h-6 w-56 bg-white/[0.04] rounded-lg animate-pulse" />
        </div>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => <div key={i} className="h-48 bg-white/[0.03] rounded-2xl animate-pulse border border-white/[0.04]" />)}
        </div>
      </div>
    </section>
  );

  if (oeuvres.length === 0) return null;

  const featured = oeuvres[0];
  const rest = oeuvres.slice(1);
  const featuredCover = featured.couverture ? (featured.couverture.startsWith("http") ? featured.couverture : `${apiUrl}${featured.couverture}`) : null;

  return (
    <section className="relative py-10 px-4">
      <div className="absolute top-1/3 right-1/4 w-[500px] h-[300px] bg-rose-600/[0.03] rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto relative">
        {/* Header */}
        <div className="flex items-center justify-between mb-7">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center shadow-lg shadow-rose-500/15">
              <FiTag className="text-white text-[15px]" />
            </div>
            <h2 className="text-xl font-black text-white tracking-tight">Genre du jour</h2>
            <Link href={`/Oeuvres?genre=${encodeURIComponent(genreName)}`}
              className="bg-rose-500/15 text-rose-300 px-3 py-1 rounded-full font-bold text-xs border border-rose-500/20 hover:bg-rose-500/25 transition-colors">
              {genreName}
            </Link>
          </div>
          <Link href="/Oeuvres" className="hidden sm:flex items-center gap-1.5 text-rose-400/60 hover:text-rose-300 text-sm font-medium transition-colors">
            Explorer <FiArrowRight className="text-xs" />
          </Link>
        </div>

        {/* Featured */}
        <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4 }}
          className="group relative mb-6 cursor-pointer" onClick={() => onSelect({ documentId: featured.documentId, titre: featured.titre, type: featured.type })}>
          <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-r from-rose-500/0 via-pink-500/0 to-rose-500/0 group-hover:from-rose-500/30 group-hover:via-pink-500/15 group-hover:to-rose-500/30 transition-all duration-500" />
          <div className="relative flex flex-col sm:flex-row bg-white/[0.02] border border-white/[0.06] group-hover:border-rose-500/20 rounded-2xl overflow-hidden transition-all duration-300">
            <div className="relative sm:w-[220px] md:w-[260px] flex-shrink-0 aspect-[2/3] sm:aspect-auto sm:min-h-[280px]">
              {featuredCover ? (
                <Image src={featuredCover} alt={featured.titre} fill className="object-cover group-hover:scale-105 transition-transform duration-700" sizes="260px" />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                  <FiBook className="text-4xl text-white/10" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#111827] hidden sm:block" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#111827] to-transparent sm:hidden" />
            </div>
            <div className="flex-1 p-5 sm:p-7 flex flex-col justify-center relative">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="bg-rose-500/80 text-white px-2.5 py-0.5 text-[11px] rounded-lg font-semibold">{featured.type}</span>
                {featured.etat && <span className="bg-white/[0.06] text-white/50 px-2.5 py-0.5 text-[11px] rounded-lg font-medium">{featured.etat}</span>}
                {featured.chapitresCount > 0 && (
                  <span className="flex items-center gap-1 text-white/30 text-[11px]">
                    <FiFileText className="text-[10px]" />{featured.chapitresCount} ch.
                  </span>
                )}
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-white mb-2 group-hover:text-rose-200 transition-colors leading-tight">{featured.titre}</h3>
              {featured.traduction && (
                <p className="text-white/30 text-xs mb-3 flex items-center gap-1.5">
                  <FiUsers className="text-[10px]" />{featured.traduction}
                </p>
              )}
              <p className="text-white/40 text-sm leading-relaxed mb-4 line-clamp-3">{cleanSynopsis(featured.synopsis)}</p>
            </div>
          </div>
        </motion.div>

        {/* Grille */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {rest.map((oeuvre, i) => {
            const cover = oeuvre.couverture ? (oeuvre.couverture.startsWith("http") ? oeuvre.couverture : `${apiUrl}${oeuvre.couverture}`) : null;
            return (
              <motion.div key={oeuvre.documentId || i}
                initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ duration: 0.3, delay: Math.min(i * 0.06, 0.3) }}
                className="group relative cursor-pointer"
                onClick={() => onSelect({ documentId: oeuvre.documentId, titre: oeuvre.titre, type: oeuvre.type })}
              >
                <div className="absolute -inset-[1px] rounded-xl bg-gradient-to-b from-rose-500/0 to-rose-500/0 group-hover:from-rose-500/20 group-hover:to-pink-500/10 transition-all duration-500" />
                <div className="relative flex gap-4 bg-white/[0.02] border border-white/[0.06] group-hover:border-rose-500/20 rounded-xl p-3.5 transition-all duration-300 h-full">
                  <div className="relative flex-shrink-0 w-[80px] sm:w-[90px] aspect-[2/3] rounded-lg overflow-hidden bg-gray-900">
                    {cover ? (
                      <Image src={cover} alt={oeuvre.titre} fill className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="90px" />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                        <FiBook className="text-xl text-white/10" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="bg-rose-500/70 text-white px-2 py-0.5 text-[10px] rounded-md font-semibold">{oeuvre.type}</span>
                      {oeuvre.chapitresCount > 0 && (
                        <span className="text-white/25 text-[10px]">{oeuvre.chapitresCount} ch.</span>
                      )}
                    </div>
                    <h4 className="font-bold text-sm text-white truncate group-hover:text-rose-200 transition-colors mb-1">{oeuvre.titre}</h4>
                    {oeuvre.traduction && (
                      <p className="text-white/25 text-[11px] mb-1.5 truncate">{oeuvre.traduction}</p>
                    )}
                    <p className="text-white/30 text-xs leading-relaxed line-clamp-2">{cleanSynopsis(oeuvre.synopsis)}</p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Mobile */}
        <div className="sm:hidden text-center mt-5">
          <Link href={`/Oeuvres?genre=${encodeURIComponent(genreName)}`} className="inline-flex items-center gap-1.5 text-rose-400/60 hover:text-rose-300 text-sm font-medium transition-colors">
            Voir toutes les oeuvres {genreName} <FiArrowRight className="text-xs" />
          </Link>
        </div>
      </div>
    </section>
  );
}


/* ── 6. COMMUNAUTÉ ── */
function CommunauteSection() {
  return (
    <section className="relative py-14 px-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-indigo-600/[0.03] rounded-full blur-[150px]" />
      </div>

      <div className="max-w-5xl mx-auto relative">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
          {/* Header */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 bg-indigo-500/10 text-indigo-300 px-4 py-1.5 rounded-full text-xs font-semibold border border-indigo-500/20 mb-4">
              <FiHeart className="text-pink-400" /> Communauté
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-3">
              Rejoignez les <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">passionnés</span>
            </h2>
            <p className="text-white/35 max-w-xl mx-auto">Partagez vos découvertes, discutez avec d&apos;autres lecteurs et restez informé des dernières sorties.</p>
          </div>

          {/* Cards */}
          <div className="grid sm:grid-cols-3 gap-4">
            {/* Discord */}
            <a href="https://discord.gg/novel-index" target="_blank" rel="noopener noreferrer"
              className="group relative bg-white/[0.02] hover:bg-[#5865F2]/10 border border-white/[0.06] hover:border-[#5865F2]/30 rounded-2xl p-6 text-center transition-all duration-300 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-[#5865F2]/0 to-[#5865F2]/0 group-hover:from-[#5865F2]/5 group-hover:to-transparent transition-all duration-500" />
              <div className="relative">
                <div className="w-14 h-14 rounded-2xl bg-[#5865F2]/10 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 border border-[#5865F2]/10">
                  <FaDiscord className="text-2xl text-[#5865F2]" />
                </div>
                <h3 className="font-bold text-white mb-1.5">Discord</h3>
                <p className="text-white/30 text-sm leading-relaxed">Rejoignez le serveur pour discuter avec la communauté en temps réel.</p>
              </div>
            </a>

            {/* Twitter */}
            <a href="https://twitter.com/NovelIndex" target="_blank" rel="noopener noreferrer"
              className="group relative bg-white/[0.02] hover:bg-sky-500/10 border border-white/[0.06] hover:border-sky-500/30 rounded-2xl p-6 text-center transition-all duration-300 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-sky-500/0 to-sky-500/0 group-hover:from-sky-500/5 group-hover:to-transparent transition-all duration-500" />
              <div className="relative">
                <div className="w-14 h-14 rounded-2xl bg-sky-500/10 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 border border-sky-500/10">
                  <FaTwitter className="text-2xl text-sky-400" />
                </div>
                <h3 className="font-bold text-white mb-1.5">Twitter / X</h3>
                <p className="text-white/30 text-sm leading-relaxed">Suivez-nous pour les annonces et les nouvelles sorties.</p>
              </div>
            </a>

            {/* Contribuer */}
            <Link href="/Inscription"
              className="group relative bg-white/[0.02] hover:bg-emerald-500/10 border border-white/[0.06] hover:border-emerald-500/30 rounded-2xl p-6 text-center transition-all duration-300 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/0 to-emerald-500/0 group-hover:from-emerald-500/5 group-hover:to-transparent transition-all duration-500" />
              <div className="relative">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 border border-emerald-500/10">
                  <FiPlusCircle className="text-2xl text-emerald-400" />
                </div>
                <h3 className="font-bold text-white mb-1.5">Contribuer</h3>
                <p className="text-white/30 text-sm leading-relaxed">Créez un compte et aidez à indexer les traductions françaises.</p>
              </div>
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}


export default function PreviewAccueil() {
  const [allSorties, setAllSorties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedData, setSelectedData] = useState(null);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    const fetchAll = async () => {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const sinceStr = sevenDaysAgo.toISOString().split("T")[0];

      try {
        // Paginer pour tout récupérer
        let all = [];
        let start = 0;
        const limit = 100;
        let hasMore = true;

        while (hasMore) {
          const res = await fetch(
            `${apiUrl}/api/sortie-du-jours?filters[date][$gte]=${sinceStr}&populate[oeuvre][populate]=couverture&sort=dernierUpdate:desc&pagination[start]=${start}&pagination[limit]=${limit}`
          );
          const data = await res.json();
          const items = data?.data || [];
          all = [...all, ...items];
          hasMore = items.length === limit;
          start += limit;
        }

        setAllSorties(all.filter((s) => s.oeuvre));
      } catch (err) {
        console.error(err);
        setError("Erreur lors du chargement.");
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [apiUrl]);

  return (
    <div className="min-h-screen bg-[#111827]">
      {/* Banner preview */}
      <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2.5 text-center text-amber-300/80 text-xs backdrop-blur-sm">
        <strong>PREVIEW</strong> — Proposition de nouvelle homepage · Cette page ne modifie rien
      </div>

      {error && <div className="bg-red-900/30 border-b border-red-600 px-4 py-3 text-center text-red-200">{error}</div>}

      {/* 0. HERO EXISTANT */}
      <HeroSection />

      {loading ? (
        <div className="p-4 space-y-4">
          <div className="h-10 w-64 bg-white/[0.04] rounded-xl animate-pulse" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => <div key={i} className="h-56 bg-white/[0.03] rounded-xl animate-pulse border border-white/[0.04]" />)}
          </div>
        </div>
      ) : (
        <>
          {/* 1. NAVIGATEUR SORTIES — Onglets jours + sidebar */}
          <NavigateurSorties allSorties={allSorties} onSelect={setSelectedData} />

          {/* PUB */}
          <AdBanner format="banner" className="py-6 px-4" delay={1200} />

          {/* 2. NOUVELLES OEUVRES */}
          <NouvellesOeuvres onSelect={setSelectedData} />

          {/* 3. À DÉCOUVRIR — Vitrine */}
          <OeuvresVitrine onSelect={setSelectedData} />

          {/* 4. TOP TEAMS */}
          <TopTeams />

          {/* 5. DÉCOUVRIR PAR TEAM */}
          <DecouvrirParTeam onSelect={setSelectedData} />

          {/* 5b. GENRE DU JOUR */}
          <DecouvrirParGenre onSelect={setSelectedData} />

          {/* 6. COMMUNAUTÉ */}
          <CommunauteSection />
        </>
      )}

      {/* ===== BLOCS SEO — WOW ===== */}

      {/* Gradient divider */}
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center gap-4">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent" />
          <div className="w-2 h-2 rounded-full bg-indigo-500/20" />
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent" />
        </div>
      </div>

      <section className="relative py-20 px-4 sm:px-6 lg:px-8 overflow-hidden" aria-labelledby="about-heading">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-600/[0.03] rounded-full blur-[150px] pointer-events-none" />
        <div className="max-w-4xl mx-auto relative">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
            <h2 id="about-heading" className="text-3xl sm:text-4xl font-black text-white mb-8 text-center tracking-tight">
              Qu&apos;est-ce que <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">Novel-Index</span> ?
            </h2>
            <div className="space-y-5 text-white/50 text-lg leading-relaxed">
              <p><strong className="text-white/80">Novel-Index</strong> est la plateforme collaborative francophone de référence pour découvrir et suivre vos <strong className="text-indigo-400">Light Novels</strong>, <strong className="text-indigo-400">Web Novels</strong>, <strong className="text-indigo-400">Manga</strong>, <strong className="text-indigo-400">Manhwa</strong> et <strong className="text-indigo-400">Webtoons</strong> traduits en français.</p>
              <p>Notre mission est simple : <strong className="text-white/80">centraliser toutes les traductions françaises</strong> disponibles en un seul endroit. Plutôt que de chercher sur des dizaines de sites différents, Novel-Index vous redirige directement vers les <strong className="text-white/80">teams de traduction</strong> qui publient les chapitres.</p>
              <p>Nous ne stockons aucun contenu traduit. Novel-Index est un <strong className="text-white/80">index collaboratif</strong> : chaque team de traduction peut référencer ses œuvres et ses chapitres, et les lecteurs retrouvent tout au même endroit. C&apos;est un pont entre les lecteurs francophones et les traducteurs passionnés.</p>
              <p>Que vous cherchiez le dernier chapitre de votre <strong className="text-indigo-400">novel fantaisie</strong> préféré, une nouvelle <strong className="text-indigo-400">série romance</strong> à découvrir, ou les dernières sorties de <strong className="text-indigo-400">scans action</strong>, Novel-Index vous permet de tout suivre en temps réel grâce à son système d&apos;abonnements et de notifications.</p>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="relative py-20 px-4 sm:px-6 lg:px-8 overflow-hidden" aria-labelledby="categories-heading">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-purple-600/[0.025] rounded-full blur-[120px] pointer-events-none" />
        <div className="max-w-6xl mx-auto relative">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
            <h2 id="categories-heading" className="text-3xl sm:text-4xl font-black text-white mb-3 text-center tracking-tight">Explorez par catégorie</h2>
            <p className="text-white/35 text-center mb-12 max-w-2xl mx-auto">Naviguez dans notre catalogue par type d&apos;œuvre ou par genre. Des milliers de titres traduits en français vous attendent.</p>

            <h3 className="text-lg font-bold text-white/70 mb-4 flex items-center gap-2">
              <div className="w-1 h-5 rounded-full bg-gradient-to-b from-indigo-500 to-purple-600" />
              Par type d&apos;œuvre
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mb-12">
              {[
                { label: "Light Novels", href: "/Oeuvres?type=Light+Novel", icon: <FiBook className="text-indigo-400" /> },
                { label: "Web Novels", href: "/Oeuvres?type=Web+Novel", icon: <FiBookOpen className="text-blue-400" /> },
                { label: "Manga", href: "/Oeuvres?type=Manga", icon: <FiEye className="text-pink-400" /> },
                { label: "Manhwa", href: "/Oeuvres?type=Manhwa", icon: <FiHeart className="text-red-400" /> },
                { label: "Webtoons", href: "/Oeuvres?type=Webtoon", icon: <FiCompass className="text-green-400" /> },
              ].map((item) => (
                <Link key={item.label} href={item.href} className="group flex items-center gap-3 bg-white/[0.025] hover:bg-white/[0.05] border border-white/[0.06] hover:border-indigo-500/30 rounded-xl px-4 py-3.5 transition-all duration-300">
                  <span className="text-xl group-hover:scale-110 transition-transform duration-300">{item.icon}</span>
                  <span className="text-white/70 font-medium group-hover:text-white transition-colors">{item.label}</span>
                </Link>
              ))}
            </div>

            <h3 className="text-lg font-bold text-white/70 mb-4 flex items-center gap-2">
              <div className="w-1 h-5 rounded-full bg-gradient-to-b from-pink-500 to-rose-600" />
              Genres populaires
            </h3>
            <div className="flex flex-wrap gap-2 mb-8">
              {["Action","Aventure","Comédie","Drame","Fantaisie","Horreur","Isekai","Mystère","Romance","Sci-Fi","Slice of Life","Thriller","Surnaturel","Arts Martiaux","Mecha","Historique"].map((genre) => (
                <Link key={genre} href={`/tags-genres/genres/${genre.toLowerCase().replace(/ /g, "-")}`}
                  className="group bg-white/[0.025] hover:bg-indigo-500/15 border border-white/[0.06] hover:border-indigo-500/30 text-white/40 hover:text-white/80 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300">
                  <FiTag className="inline mr-1.5 text-xs opacity-40 group-hover:opacity-80 transition-opacity" />{genre}
                </Link>
              ))}
            </div>
            <div className="text-center mt-8">
              <Link href="/Teams" className="inline-flex items-center gap-2 text-indigo-400/70 hover:text-indigo-300 font-medium transition-colors">
                <FiUsers className="text-lg" />Découvrir toutes les teams de traduction<FiArrowRight />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="relative py-20 px-4 sm:px-6 lg:px-8 overflow-hidden" aria-labelledby="how-heading">
        <div className="absolute bottom-0 left-0 w-[400px] h-[300px] bg-indigo-600/[0.025] rounded-full blur-[120px] pointer-events-none" />
        <div className="max-w-5xl mx-auto relative">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
            <h2 id="how-heading" className="text-3xl sm:text-4xl font-black text-white mb-3 text-center tracking-tight">Comment ça marche ?</h2>
            <p className="text-white/35 text-center mb-14 max-w-2xl mx-auto">Novel-Index est gratuit et ouvert à tous. En 3 étapes, accédez à des milliers de chapitres traduits en français.</p>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { icon: <FiSearch className="text-indigo-400 text-xl" />, color: "indigo", title: "1. Recherchez", desc: "Trouvez une œuvre par son titre, son genre, son auteur ou sa team de traduction." },
                { icon: <FiPlusCircle className="text-emerald-400 text-xl" />, color: "emerald", title: "2. Abonnez-vous", desc: "Créez un compte gratuit et suivez vos œuvres préférées." },
                { icon: <FiShare2 className="text-pink-400 text-xl" />, color: "pink", title: "3. Lisez", desc: "Cliquez sur un chapitre, vous êtes redirigé vers le site de la team. Simple et gratuit." },
              ].map((step, idx) => (
                <motion.div key={step.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }} transition={{ duration: 0.4, delay: idx * 0.1 }}
                  className="group bg-white/[0.02] hover:bg-white/[0.04] border border-white/[0.06] hover:border-white/[0.1] rounded-2xl p-7 text-center transition-all duration-300">
                  <div className={`w-14 h-14 bg-${step.color}-500/10 rounded-2xl flex items-center justify-center mx-auto mb-5 group-hover:scale-110 transition-transform duration-300 border border-${step.color}-500/10`}>
                    {step.icon}
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">{step.title}</h3>
                  <p className="text-white/40 leading-relaxed">{step.desc}</p>
                </motion.div>
              ))}
            </div>
            <CtaInscription />
          </motion.div>
        </div>
      </section>

      {/* PREVIEW OEUVRE */}
      {selectedData && <PreviewOeuvre oeuvre={selectedData} onClose={() => setSelectedData(null)} />}
    </div>
  );
}
