"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  FiHome, FiChevronRight, FiBookOpen,
  FiUsers, FiSearch, FiBook, FiArrowUpRight,
  FiBell, FiArrowRight, FiCalendar, FiPlus, FiFeather, FiStar
} from "react-icons/fi";
import CoverBackground from "../components/CoverBackground";

// ── Hooks ──

function useScrollReveal() {
  const ref = useRef(null);
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVis(true); obs.disconnect(); } }, { threshold: 0.06 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return { ref, vis };
}

function Reveal({ children, className = "", delay = 0 }) {
  const { ref, vis } = useScrollReveal();
  return (
    <div ref={ref} className={className} style={{
      opacity: vis ? 1 : 0, transform: vis ? "none" : "translateY(20px)",
      transition: `opacity .6s cubic-bezier(.16,1,.3,1) ${delay}ms, transform .6s cubic-bezier(.16,1,.3,1) ${delay}ms`,
    }}>{children}</div>
  );
}

// ── Constantes ──

const TYPE_META = {
  "web-novel": { label: "Web novel", plural: "Web novels", icon: "💻", gradient: "from-violet-500 to-indigo-600", text: "text-violet-400", pill: "bg-violet-500/10 text-violet-300 border-violet-500/20", glow: "shadow-violet-500/20", border: "border-violet-500/20", bg: "from-violet-950/40 to-gray-900/60" },
  "light-novel": { label: "Light novel", plural: "Light novels", icon: "📖", gradient: "from-sky-500 to-cyan-600", text: "text-sky-400", pill: "bg-sky-500/10 text-sky-300 border-sky-500/20", glow: "shadow-sky-500/20", border: "border-sky-500/20", bg: "from-sky-950/40 to-gray-900/60" },
  "manga": { label: "Manga", plural: "Mangas", icon: "📚", gradient: "from-emerald-500 to-teal-600", text: "text-emerald-400", pill: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20", glow: "shadow-emerald-500/20", border: "border-emerald-500/20", bg: "from-emerald-950/40 to-gray-900/60" },
  "webtoon": { label: "Webtoon", plural: "Webtoons", icon: "🎨", gradient: "from-rose-500 to-pink-600", text: "text-rose-400", pill: "bg-rose-500/10 text-rose-300 border-rose-500/20", glow: "shadow-rose-500/20", border: "border-rose-500/20", bg: "from-rose-950/40 to-gray-900/60" },
};

// ══════════════════════════════════════════════
// DONNÉES EN DUR (MOCK)
// ══════════════════════════════════════════════

const MOCK_MOIS = "mars 2026";
const MOCK_TYPES = [
  { type: "web-novel", count: 18, label: "Web novels", icon: "💻" },
  { type: "light-novel", count: 8, label: "Light novels", icon: "📖" },
  { type: "manga", count: 12, label: "Mangas", icon: "📚" },
  { type: "webtoon", count: 5, label: "Webtoons", icon: "🎨" },
];

const MOCK_OEUVRES = [
  {
    documentId: "mock-1", titre: "Solo Leveling : Ragnarök", type: "web-novel",
    cover: "https://picsum.photos/seed/solo-leveling/600/400", team: "Chireads", teamUrl: "https://chireads.com", chapitres: 47,
    auteur: "Chugong",
    indexeur: "NightReader", indexeurTotal: 34,
    synopsis: "Après les événements du premier arc, Sung Jin-Woo découvre un nouveau monde de donjons liés à la mythologie nordique. Alors que de nouvelles failles dimensionnelles s'ouvrent à travers le globe, il doit rassembler une armée d'ombres plus puissante que jamais pour affronter des menaces divines.",
    texte: "Merci à NightReader (34 oeuvres indexées sur Novel-Index !) pour l'ajout de cette série. Et un grand merci à la team Chireads pour leur travail de traduction. N'hésitez pas à visiter leur site pour découvrir l'ensemble de leur catalogue.",
    genres: ["Action", "Fantasy", "Aventure", "Surnaturel"], href: "#",
  },
  {
    documentId: "mock-2", titre: "Le Roi des Ténèbres", type: "light-novel",
    cover: "https://picsum.photos/seed/roi-tenebres/600/400", team: "Scantrad France", teamUrl: "https://scantrad-france.com", chapitres: 23,
    auteur: "Kim Seo-Yeon",
    indexeur: "LunaTraduction", indexeurTotal: 12,
    synopsis: "Dans un royaume médiéval où la magie a été bannie depuis des siècles, un jeune noble découvre qu'il possède un pouvoir interdit : celui de contrôler les ombres. Traqué par l'Inquisition et les guildes de chasseurs, il devra choisir entre fuir ou embrasser son destin pour protéger ceux qu'il aime.",
    texte: "Merci à LunaTraduction (12 oeuvres indexées) d'avoir ajouté cette série. La traduction est assurée par Scantrad France — allez jeter un oeil à leur site, ils ont un catalogue riche avec plein d'autres pépites.",
    genres: ["Dark Fantasy", "Politique", "Magie"], href: "#",
  },
  {
    documentId: "mock-3", titre: "Crimson Academy", type: "manga",
    cover: "https://picsum.photos/seed/crimson-academy/600/400", team: "FuryoSociety", teamUrl: "https://furyosociety.com", chapitres: 12,
    auteur: "Takeshi Yamamoto",
    indexeur: "MangaHunter42", indexeurTotal: 87,
    synopsis: "Une académie secrète forme les meilleurs assassins du monde. Lorsqu'une étudiante de première année refuse d'exécuter sa première mission, elle déclenche une guerre interne qui menace de révéler l'existence de l'école au grand public. Entre alliances et trahisons, chaque chapitre est un combat pour la survie.",
    texte: "Merci MangaHunter42 (87 oeuvres indexées — un pilier de la communauté !) pour cet ajout. La team FuryoSociety traduit cette série avec soin. Passez sur leur site pour fouiller leurs autres projets.",
    genres: ["Action", "Thriller", "École"], href: "#",
  },
  {
    documentId: "mock-4", titre: "Tower of Infinity", type: "webtoon",
    cover: "https://picsum.photos/seed/tower-infinity/600/400", team: "Phenixscans", teamUrl: "https://phenixscans.com", chapitres: 89,
    auteur: "Park Jin-Soo",
    indexeur: "WebtoonAddict", indexeurTotal: 21,
    synopsis: "Une tour apparaît au centre de Séoul, promettant pouvoir et richesse à quiconque atteint le sommet. Des milliers de grimpeurs s'y engouffrent, mais les étages sont des mondes entiers peuplés de monstres et de pièges mortels. Notre héros, un livreur ordinaire, va découvrir qu'il possède un talent unique pour survivre.",
    texte: "Merci à WebtoonAddict (21 oeuvres indexées) pour l'ajout ! Traduit par la team Phenixscans — passez sur leur site pour explorer tout ce qu'ils proposent, vous ne serez pas déçus.",
    genres: ["Action", "Fantasy", "Survival", "Tower climbing"], href: "#",
  },
  {
    documentId: "mock-5", titre: "Reborn as a Blacksmith", type: "web-novel",
    cover: "https://picsum.photos/seed/blacksmith-reborn/600/400", team: "Chireads", teamUrl: "https://chireads.com", chapitres: 156,
    auteur: "Zhang Wei",
    indexeur: "IsekaiLover", indexeurTotal: 56,
    synopsis: "Réincarné dans un monde fantastique en tant que forgeron de village, le protagoniste utilise ses connaissances modernes de métallurgie pour créer des armes légendaires. Rapidement, sa réputation attire l'attention des royaumes voisins, des guildes d'aventuriers et de forces bien plus sombres qui convoitent ses créations.",
    texte: "Merci à IsekaiLover (56 oeuvres indexées !) pour cette série. La traduction est signée Chireads — un passage sur leur site s'impose si vous cherchez d'autres web novels à dévorer.",
    genres: ["Isekai", "Artisanat", "Fantasy", "Slice of life"], href: "#",
  },
  {
    documentId: "mock-6", titre: "Chroniques de l'Aube Noire", type: "light-novel",
    cover: "https://picsum.photos/seed/aube-noire/600/400", team: "TeamOnePiece", teamUrl: "https://teamonepiece.com", chapitres: 34,
    auteur: null,
    indexeur: "FantasyScout", indexeurTotal: 8,
    synopsis: "Cinq héros issus de différentes époques sont arrachés à leur timeline et projetés dans un monde en ruine. Pour rentrer chez eux, ils doivent restaurer les six sceaux qui maintiennent l'équilibre entre les dimensions. Mais chaque sceau brisé libère une entité ancienne plus terrifiante que la précédente.",
    texte: "Bravo à FantasyScout (8 oeuvres indexées) pour l'ajout ! Traduit par TeamOnePiece — on vous encourage à aller fouiller leur site pour voir toutes les séries qu'ils proposent en français.",
    genres: ["Fantasy", "Voyage temporel", "Groupe"], href: "#",
  },
  {
    documentId: "mock-7", titre: "Neon District", type: "webtoon",
    cover: "https://picsum.photos/seed/neon-district/600/400", team: "Scantrad France", teamUrl: "https://scantrad-france.com", chapitres: 28,
    auteur: "Lee Hyun-Woo",
    indexeur: "CyberNova", indexeurTotal: 15,
    synopsis: "Dans un futur cyberpunk, les mega-corporations contrôlent chaque aspect de la vie. Dans le district néon, un hacker et une ex-agente de sécurité forment une alliance improbable pour exposer un complot qui pourrait asservir l'humanité entière grâce à des implants neuronaux défectueux.",
    texte: "Un grand merci à CyberNova (15 oeuvres indexées) pour l'ajout. La traduction est portée par Scantrad France — foncez sur leur site, ils ont un catalogue impressionnant.",
    genres: ["Cyberpunk", "Sci-Fi", "Thriller"], href: "#",
  },
  {
    documentId: "mock-8", titre: "Le Médecin de la Cour Impériale", type: "manga",
    cover: "https://picsum.photos/seed/medecin-imperial/600/400", team: "Mangastream FR", teamUrl: "https://mangastream-fr.com", chapitres: 67,
    auteur: "Chen Li-Ming",
    indexeur: "HistoireManga", indexeurTotal: 3,
    synopsis: "Un médecin moderne se retrouve transporté dans la Chine ancienne, à la cour de l'empereur. Grâce à ses connaissances médicales avancées, il sauve la vie de la princesse héritière et se retrouve mêlé aux intrigues politiques du palais. Entre complots, poisons et romances interdites, chaque jour est un défi.",
    texte: "Merci à HistoireManga (3 oeuvres indexées — bienvenue dans la communauté !) pour cette série. La team Mangastream FR assure la traduction — allez découvrir leur site pour voir leurs autres projets.",
    genres: ["Historique", "Médical", "Romance", "Isekai"], href: "#",
  },
];


// ── Palette de couleurs alternées ──

const CARD_COLORS = [
  { gradient: "from-violet-500 to-indigo-600", text: "text-violet-400", pill: "bg-violet-500/10 text-violet-300 border-violet-500/20", glow: "shadow-violet-500/20", border: "border-violet-500/20", bg: "from-violet-950/40 to-gray-900/60" },
  { gradient: "from-sky-500 to-cyan-600", text: "text-sky-400", pill: "bg-sky-500/10 text-sky-300 border-sky-500/20", glow: "shadow-sky-500/20", border: "border-sky-500/20", bg: "from-sky-950/40 to-gray-900/60" },
  { gradient: "from-emerald-500 to-teal-600", text: "text-emerald-400", pill: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20", glow: "shadow-emerald-500/20", border: "border-emerald-500/20", bg: "from-emerald-950/40 to-gray-900/60" },
  { gradient: "from-rose-500 to-pink-600", text: "text-rose-400", pill: "bg-rose-500/10 text-rose-300 border-rose-500/20", glow: "shadow-rose-500/20", border: "border-rose-500/20", bg: "from-rose-950/40 to-gray-900/60" },
  { gradient: "from-amber-500 to-orange-600", text: "text-amber-400", pill: "bg-amber-500/10 text-amber-300 border-amber-500/20", glow: "shadow-amber-500/20", border: "border-amber-500/20", bg: "from-amber-950/40 to-gray-900/60" },
  { gradient: "from-fuchsia-500 to-purple-600", text: "text-fuchsia-400", pill: "bg-fuchsia-500/10 text-fuchsia-300 border-fuchsia-500/20", glow: "shadow-fuchsia-500/20", border: "border-fuchsia-500/20", bg: "from-fuchsia-950/40 to-gray-900/60" },
  { gradient: "from-cyan-500 to-blue-600", text: "text-cyan-400", pill: "bg-cyan-500/10 text-cyan-300 border-cyan-500/20", glow: "shadow-cyan-500/20", border: "border-cyan-500/20", bg: "from-cyan-950/40 to-gray-900/60" },
  { gradient: "from-lime-500 to-green-600", text: "text-lime-400", pill: "bg-lime-500/10 text-lime-300 border-lime-500/20", glow: "shadow-lime-500/20", border: "border-lime-500/20", bg: "from-lime-950/40 to-gray-900/60" },
];

// ── Fond animé dynamique — proportionnel au nombre d'oeuvres ──

const GLOW_ANIMS = ["animate-pulseGlow1", "animate-pulseGlow2", "animate-pulseGlow3"];
const SCAN_ANIMS = ["animate-scanline1", "animate-scanline2", "animate-scanline3"];
const FLOAT_L = ["animate-floatL2R1", "animate-floatL2R2", "animate-floatL2R3", "animate-floatL2R4", "animate-floatL2R5"];
const FLOAT_R = ["animate-floatR2L1", "animate-floatR2L2", "animate-floatR2L3", "animate-floatR2L4", "animate-floatR2L5"];
const RISE_ANIMS = ["animate-riseUp1", "animate-riseUp2", "animate-riseUp3", "animate-riseUp4", "animate-riseUp5", "animate-riseUp6", "animate-riseUp7", "animate-riseUp8"];
const TWINKLE_ANIMS = ["animate-twinkle1", "animate-twinkle2", "animate-twinkle3"];
const DIAG_ANIMS = ["animate-diag1", "animate-diag2", "animate-diag3", "animate-diag4", "animate-diag5", "animate-diag6"];
const RIPPLE_ANIMS = ["animate-ripple1", "animate-ripple2", "animate-ripple3"];

// Couleurs en rgba pour usage inline (Tailwind ne supporte pas les classes dynamiques)
const RGBA_COLORS = [
  { glow: "139,92,246",  line: "139,92,246",  orb: "167,139,250", star: "196,181,253", border: "139,92,246" },  // violet
  { glow: "217,70,239",  line: "217,70,239",  orb: "232,121,249", star: "240,171,252", border: "217,70,239" },  // fuchsia
  { glow: "99,102,241",  line: "99,102,241",  orb: "129,140,248", star: "165,180,252", border: "99,102,241" },  // indigo
  { glow: "34,211,238",  line: "34,211,238",  orb: "34,211,238",  star: "103,232,249", border: "34,211,238" },  // cyan
  { glow: "244,63,94",   line: "244,63,94",   orb: "251,113,133", star: "253,164,175", border: "244,63,94" },   // rose
  { glow: "245,158,11",  line: "245,158,11",  orb: "251,191,36",  star: "252,211,77",  border: "245,158,11" },  // amber
  { glow: "16,185,129",  line: "16,185,129",  orb: "52,211,153",  star: "110,231,183", border: "16,185,129" },  // emerald
  { glow: "14,165,233",  line: "14,165,233",  orb: "56,189,248",  star: "125,211,252", border: "14,165,233" },  // sky
  { glow: "249,115,22",  line: "249,115,22",  orb: "251,146,60",  star: "253,186,116", border: "249,115,22" },  // orange
  { glow: "20,184,166",  line: "20,184,166",  orb: "45,212,191",  star: "153,246,228", border: "20,184,166" },  // teal
  { glow: "236,72,153",  line: "236,72,153",  orb: "244,114,182", star: "249,168,212", border: "236,72,153" },  // pink
  { glow: "132,204,22",  line: "132,204,22",  orb: "163,230,53",  star: "190,242,100", border: "132,204,22" },  // lime
  { glow: "168,85,247",  line: "168,85,247",  orb: "192,132,252", star: "216,180,254", border: "168,85,247" },  // purple
];

function seeded(seed) {
  let s = seed;
  return () => { s = (s * 16807 + 0) % 2147483647; return s / 2147483647; };
}

function AnimatedBackground({ count }) {
  const elements = useMemo(() => {
    const n = Math.max(count, 4);
    const rand = seeded(42);
    const C = RGBA_COLORS;

    const glowCount = Math.max(4, Math.ceil(n * 1.2));
    const scanCount = Math.max(6, Math.ceil(n * 2));
    const orbLCount = Math.max(5, Math.ceil(n * 1.5));
    const orbRCount = Math.max(5, Math.ceil(n * 1.5));
    const diamondCount = Math.max(8, Math.ceil(n * 2.5));
    const starCount = Math.max(10, Math.ceil(n * 3));
    const diagCount = Math.max(6, Math.ceil(n * 1.5));
    const rippleCount = Math.max(6, Math.ceil(n * 1.5));

    const els = [];
    const glowSizes = [350, 400, 450, 500, 600];
    const glowBlurs = [100, 110, 120, 130, 140];
    const glowOps = [0.03, 0.04, 0.05];

    // Glows
    for (let i = 0; i < glowCount; i++) {
      const c = C[i % C.length];
      const sz = glowSizes[i % glowSizes.length];
      const bl = glowBlurs[i % glowBlurs.length];
      const op = glowOps[i % glowOps.length];
      els.push(
        <div key={`g${i}`} className={`absolute rounded-full ${GLOW_ANIMS[i % GLOW_ANIMS.length]}`}
          style={{ top: `${Math.round(rand() * 90)}%`, left: `${Math.round(rand() * 85)}%`, width: sz, height: sz, backgroundColor: `rgba(${c.glow},${op})`, filter: `blur(${bl}px)`, animationDelay: `${Math.round(rand() * 15)}s` }} />
      );
    }

    // Scanlines
    for (let i = 0; i < scanCount; i++) {
      const c = C[i % C.length];
      const op = [0.15, 0.2, 0.25][i % 3];
      els.push(
        <div key={`s${i}`} className={`absolute left-0 w-full h-px ${SCAN_ANIMS[i % SCAN_ANIMS.length]}`}
          style={{ top: `${Math.round((i / scanCount) * 98 + rand() * 2)}%`, background: `linear-gradient(to right, transparent, rgba(${c.line},${op}), transparent)`, animationDelay: `${Math.round(rand() * 22)}s` }} />
      );
    }

    // Orbes L→R
    const orbPx = [8, 10, 12, 14, 16, 20];
    const orbBl = [1, 2, 3, 4];
    const orbOps = [0.25, 0.3, 0.35, 0.4, 0.45, 0.5];

    for (let i = 0; i < orbLCount; i++) {
      const c = C[i % C.length];
      const sz = orbPx[i % orbPx.length];
      els.push(
        <div key={`ol${i}`} className={`absolute rounded-full ${FLOAT_L[i % FLOAT_L.length]}`}
          style={{ width: sz, height: sz, backgroundColor: `rgba(${c.orb},${orbOps[i % orbOps.length]})`, filter: `blur(${orbBl[i % orbBl.length]}px)`, animationDelay: `${Math.round(rand() * 25)}s` }} />
      );
    }

    // Orbes R→L
    for (let i = 0; i < orbRCount; i++) {
      const c = C[(i + 5) % C.length];
      const sz = orbPx[i % orbPx.length];
      els.push(
        <div key={`or${i}`} className={`absolute rounded-full ${FLOAT_R[i % FLOAT_R.length]}`}
          style={{ width: sz, height: sz, backgroundColor: `rgba(${c.orb},${orbOps[i % orbOps.length]})`, filter: `blur(${orbBl[i % orbBl.length]}px)`, animationDelay: `${Math.round(rand() * 25)}s` }} />
      );
    }

    // Losanges
    const dPx = [6, 8, 10, 12, 14, 16];
    const dOps = [0.2, 0.25, 0.3, 0.35];

    for (let i = 0; i < diamondCount; i++) {
      const c = C[i % C.length];
      const sz = dPx[i % dPx.length];
      els.push(
        <div key={`d${i}`} className={`absolute ${RISE_ANIMS[i % RISE_ANIMS.length]}`}
          style={{ width: sz, height: sz, border: `1px solid rgba(${c.border},${dOps[i % dOps.length]})`, transform: "rotate(45deg)", animationDelay: `${Math.round(rand() * 24)}s` }} />
      );
    }

    // Étoiles
    const sPx = [4, 6];
    const sOps = [0.5, 0.55, 0.6];

    for (let i = 0; i < starCount; i++) {
      const c = C[i % C.length];
      const sz = sPx[i % sPx.length];
      els.push(
        <div key={`st${i}`} className={`absolute rounded-full ${TWINKLE_ANIMS[i % TWINKLE_ANIMS.length]}`}
          style={{ width: sz, height: sz, backgroundColor: `rgba(${c.star},${sOps[i % sOps.length]})`, top: `${Math.round((i / starCount) * 98 + rand() * 2)}%`, left: `${Math.round(rand() * 95)}%`, animationDelay: `${(rand() * 8).toFixed(1)}s` }} />
      );
    }

    // Traits diagonaux
    const diagW = [56, 64, 72, 80, 88, 96];
    const diagAngles = [5, -5, 10, -10, 15, -15, 20, -20, 25, -25, 30, -30, 35, -35, 40, -40, 45, -45, 50, -50, 55, -55, 60, -60];
    const diagOps = [0.2, 0.25, 0.3];

    for (let i = 0; i < diagCount; i++) {
      const c = C[i % C.length];
      const angle = diagAngles[i % diagAngles.length];
      els.push(
        <div key={`dg${i}`} className={`absolute h-px ${DIAG_ANIMS[i % DIAG_ANIMS.length]}`}
          style={{ width: diagW[i % diagW.length], background: `linear-gradient(to right, transparent, rgba(${c.orb},${diagOps[i % diagOps.length]}), transparent)`, transform: `rotate(${angle}deg)`, animationDelay: `${Math.round(rand() * 24)}s` }} />
      );
    }

    // Cercles ripple
    for (let i = 0; i < rippleCount; i++) {
      const c = C[i % C.length];
      els.push(
        <div key={`rp${i}`} className={`absolute rounded-full ${RIPPLE_ANIMS[i % RIPPLE_ANIMS.length]}`}
          style={{ width: 8, height: 8, border: `1px solid rgba(${c.border},${dOps[i % dOps.length]})`, top: `${Math.round(rand() * 95)}%`, left: `${Math.round(rand() * 95)}%`, animationDelay: `${Math.round(rand() * 22)}s` }} />
      );
    }

    return els;
  }, [count]);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {elements}
    </div>
  );
}

// ── Carte oeuvre ──

function OeuvreBlock({ oeuvre, index, moisLabel }) {
  const meta = TYPE_META[oeuvre.type] || TYPE_META["web-novel"];
  const color = CARD_COLORS[index % CARD_COLORS.length];
  const synopsis = (oeuvre.synopsis || "").replace(/\\r\\n|\\n|\\r/g, " ").replace(/<[^>]*>/g, "").trim();
  const isEven = index % 2 === 0;

  return (
    <div className={`relative grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-12 items-center rounded-3xl bg-gradient-to-br ${color.bg} border ${color.border} p-4 sm:p-6 lg:p-8 shadow-lg ${color.glow} hover:shadow-xl transition-shadow duration-500`}>

      {/* Cover */}
      <div className={`${isEven ? "lg:order-1" : "lg:order-2"}`}>
        <Link href={oeuvre.href} target="_blank" rel="noopener noreferrer" className="group block relative rounded-2xl overflow-hidden border border-white/10 hover:border-white/20 transition-all duration-300">
          <div className="relative aspect-[4/3] overflow-hidden bg-gray-800">
            {oeuvre.cover ? (
              <Image src={oeuvre.cover} alt={oeuvre.titre} fill className="object-cover transition-transform duration-700 group-hover:scale-105" unoptimized />
            ) : (
              <div className={`w-full h-full bg-gradient-to-br ${color.gradient} opacity-30 flex items-center justify-center`}>
                <FiBookOpen className="text-4xl text-white/50" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

            <div className="absolute top-4 left-4">
              <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-lg bg-gradient-to-r ${meta.gradient} text-white shadow-lg`}>
                {meta.icon} {meta.label}
              </span>
            </div>

            {oeuvre.chapitres > 0 && (
              <div className="absolute bottom-4 left-4">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-white bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10">
                  <FiBook className="text-[10px]" /> {oeuvre.chapitres} chapitre{oeuvre.chapitres > 1 ? "s" : ""}
                </span>
              </div>
            )}

            <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-white/15 backdrop-blur-md px-3 py-1.5 rounded-lg">
                Voir la fiche <FiArrowUpRight className="text-[10px]" />
              </span>
            </div>
          </div>
        </Link>
      </div>

      {/* Texte */}
      <div className={`${isEven ? "lg:order-2" : "lg:order-1"}`}>
        <span className={`inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[.2em] px-2.5 py-1 rounded-md border ${meta.pill} mb-4`}>
          {meta.icon} {meta.label}
        </span>

        <Link href={oeuvre.href} target="_blank" rel="noopener noreferrer" className="block group">
          <h3 className={`text-2xl sm:text-3xl font-black text-white leading-tight tracking-tight mb-4 group-hover:${color.text} transition-colors`}>
            {oeuvre.titre}
          </h3>
        </Link>

        <div className="flex flex-wrap items-center gap-4 mb-5">
          {oeuvre.auteur && (
            <div className="flex items-center gap-2.5">
              <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/[0.06] border border-white/[0.08]">
                <FiFeather className="text-sm text-gray-400" />
              </span>
              <div>
                <p className="text-[10px] uppercase tracking-[.15em] text-gray-500 leading-none mb-0.5">Auteur</p>
                <p className="text-base font-semibold text-white">{oeuvre.auteur}</p>
              </div>
            </div>
          )}
          <div className="flex items-center gap-2.5">
            <span className={`flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br ${color.gradient} shadow-md`}>
              <FiUsers className="text-sm text-white" />
            </span>
            <div>
              <p className="text-[10px] uppercase tracking-[.15em] text-gray-500 leading-none mb-0.5">Traduit par</p>
              <p className={`text-base font-semibold ${color.text}`}>{oeuvre.team}</p>
            </div>
          </div>
          {oeuvre.indexeur && (
            <div className="flex items-center gap-2.5">
              <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <FiStar className="text-sm text-amber-400" />
              </span>
              <div>
                <p className="text-[10px] uppercase tracking-[.15em] text-gray-500 leading-none mb-0.5">Indexé par</p>
                <p className="text-base font-semibold text-white">
                  {oeuvre.indexeur}
                  {oeuvre.indexeurTotal > 0 && (
                    <span className="ml-2 text-[11px] font-bold text-amber-400/80">({oeuvre.indexeurTotal} oeuvres)</span>
                  )}
                </p>
              </div>
            </div>
          )}
        </div>

        {synopsis ? (
          <p className="text-[14px] text-gray-400 leading-relaxed mb-5 line-clamp-6">{synopsis}</p>
        ) : (
          <p className="text-[14px] text-gray-500 italic mb-5">Synopsis bientôt disponible.</p>
        )}

        {oeuvre.genres && oeuvre.genres.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-5">
            {oeuvre.genres.slice(0, 5).map((g) => (
              <span key={g} className={`text-[11px] font-medium px-2.5 py-0.5 rounded-md border ${color.pill}`}>{g}</span>
            ))}
          </div>
        )}

        <Link href={oeuvre.href} target="_blank" rel="noopener noreferrer" className={`inline-flex items-center gap-2 text-sm font-semibold ${color.text} hover:gap-3 transition-all`}>
          Découvrir cette oeuvre <FiArrowRight className="text-xs" />
        </Link>
      </div>
    </div>
  );
}

// ── Template ──

export default function TemplateNouvellesOeuvres({ preloadedData }) {
  // Données réelles si dispo, sinon fallback mock
  const hasReal = preloadedData && preloadedData.oeuvres && preloadedData.oeuvres.length > 0;
  const MOIS_LABEL = hasReal ? preloadedData.article?.moisLabel || MOCK_MOIS : MOCK_MOIS;
  const OEUVRES = hasReal ? preloadedData.oeuvres : MOCK_OEUVRES;
  const TOTAL = hasReal ? preloadedData.totalOeuvres || OEUVRES.length : MOCK_OEUVRES.length;
  const TYPES = hasReal ? preloadedData.byType || MOCK_TYPES : MOCK_TYPES;

  const [activeFilter, setActiveFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const uniqueTeams = useMemo(() => {
    const s = new Set();
    OEUVRES.forEach((o) => { if (o.team && o.team !== "—") s.add(o.team); });
    return s.size;
  }, [OEUVRES]);

  const filtered = useMemo(() => {
    let list = activeFilter === "all" ? OEUVRES : OEUVRES.filter((o) => o.type === activeFilter);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((o) =>
        o.titre.toLowerCase().includes(q) ||
        o.team.toLowerCase().includes(q) ||
        (o.genres || []).some((g) => g.toLowerCase().includes(q))
      );
    }
    return list;
  }, [OEUVRES, activeFilter, searchQuery]);

  const tabs = useMemo(() => {
    const t = [{ key: "all", label: "Tout voir", count: OEUVRES.length, icon: "🔥" }];
    TYPES.forEach((tp) => {
      const m = TYPE_META[tp.type] || {};
      t.push({ key: tp.type, label: m.plural || tp.type, count: tp.count, icon: m.icon || "📄" });
    });
    return t;
  }, [OEUVRES, TYPES]);

  return (
    <div className="relative bg-gray-950 text-white min-h-screen">

      {/* ═══ HERO avec CoverBackground ═══ */}
      <section className="relative min-h-[70vh] flex flex-col justify-end overflow-hidden">
        <CoverBackground />
        <div className="absolute inset-0 z-[1] bg-gradient-to-t from-gray-950 via-gray-950/40 to-transparent" />

        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 sm:pb-20 w-full">
          {/* Breadcrumb */}
          <nav aria-label="Fil d'Ariane" className="mb-10">
            <ol className="flex items-center gap-2 text-[13px] text-gray-400">
              <li><Link href="/" className="hover:text-white transition-colors inline-flex items-center gap-1"><FiHome className="text-[11px]" /> Accueil</Link></li>
              <li><FiChevronRight className="text-[10px]" /></li>
              <li><Link href="/actualites" className="hover:text-white transition-colors">Actualités</Link></li>
              <li><FiChevronRight className="text-[10px]" /></li>
              <li className="text-white font-medium truncate max-w-[200px]">Nouvelles oeuvres</li>
            </ol>
          </nav>

          <div className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[.25em] text-violet-300/80 mb-6">
            <span className="w-8 h-px bg-violet-400/50" />
            {MOIS_LABEL}
          </div>

          <h1 className="text-[clamp(2.5rem,7vw,5rem)] font-black leading-[.92] tracking-[-.03em] mb-6">
            <span className="text-white">{TOTAL} nouvelles</span><br />
            <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-400 bg-clip-text text-transparent">séries à lire</span>
          </h1>

          <p className="text-lg text-gray-300 leading-relaxed max-w-2xl mb-10">
            Chaque mois, Novel-Index référence les nouvelles oeuvres traduites en français par les teams de la communauté.
            En {MOIS_LABEL}, {TOTAL} séries rejoignent le catalogue, portées par {uniqueTeams} teams.
          </p>

          {/* Stats */}
          <div className="flex flex-wrap gap-3">
            {TYPES.filter((t) => TYPE_META[t.type]).map((t) => {
              const m = TYPE_META[t.type];
              return (
                <div key={t.type} className="flex items-center gap-3 bg-gray-900/60 backdrop-blur-sm border border-gray-700/40 rounded-2xl px-5 py-3">
                  <span className={`flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br ${m.gradient} text-white text-sm shadow-lg`}>{m.icon}</span>
                  <div>
                    <p className="text-xl font-black text-white leading-none">{t.count}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">{m.plural}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══ FILTRES sticky ═══ */}
      <section className="sticky top-0 z-40 bg-gray-900/80 backdrop-blur-xl border-b border-white/[0.06]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-3">
            <div className="flex gap-2 overflow-x-auto scrollbar-hide flex-1">
              {tabs.map((tab) => (
                <button key={tab.key} onClick={() => setActiveFilter(tab.key)}
                  className={`inline-flex items-center gap-2 whitespace-nowrap px-4 py-2 rounded-full text-[13px] font-medium transition-all duration-200 ${
                    activeFilter === tab.key
                      ? "bg-white text-black shadow-lg shadow-white/5"
                      : "bg-white/[0.03] text-gray-500 hover:bg-white/[0.06] hover:text-white border border-white/[0.04]"
                  }`}>
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                  <span className={`text-[11px] font-bold tabular-nums ${activeFilter === tab.key ? "text-black/40" : "text-gray-600"}`}>{tab.count}</span>
                </button>
              ))}
            </div>
            <div className="relative w-56 hidden sm:block shrink-0">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 text-sm" />
              <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher..."
                className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl pl-9 pr-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-violet-500/30 transition-all"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ═══ WRAPPER OEUVRES + CTA avec fond animé dynamique ═══ */}
      <div className="relative">
        {/* ══ ANIMATED BACKGROUND — proportionnel au nombre d'oeuvres ══ */}
        <AnimatedBackground count={OEUVRES.length} />

        {/* ═══ OEUVRES — cover + texte côte à côte, alternance ═══ */}
        <section className="relative py-12 sm:py-16">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

            {searchQuery && (
              <p className="text-sm text-gray-600 mb-8">
                {filtered.length} résultat{filtered.length !== 1 ? "s" : ""} pour &ldquo;<span className="text-gray-300">{searchQuery}</span>&rdquo;
              </p>
            )}

            {filtered.length > 0 ? (
              <div className="space-y-16 sm:space-y-20">
                {filtered.map((oeuvre, i) => (
                  <div key={oeuvre.documentId || oeuvre.titre + i}>
                    {oeuvre.texte && (
                      <Reveal delay={Math.min(i * 40, 200)}>
                        <div className="max-w-4xl mb-8">
                          <p className="text-[15px] text-gray-300 leading-relaxed">
                            {oeuvre.texte}
                            {oeuvre.teamUrl && (
                              <>
                                {" "}
                                <a href={oeuvre.teamUrl} target="_blank" rel="noopener noreferrer" className="text-violet-400 hover:text-violet-300 underline underline-offset-2 transition-colors">
                                  Visiter le site de {oeuvre.team} &rarr;
                                </a>
                              </>
                            )}
                          </p>
                        </div>
                      </Reveal>
                    )}
                    <Reveal delay={Math.min(i * 40, 300)}>
                      <OeuvreBlock oeuvre={oeuvre} index={i} moisLabel={MOIS_LABEL} />
                    </Reveal>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-24 border border-dashed border-white/[0.06] rounded-2xl">
                <FiSearch className="text-2xl text-gray-700 mx-auto mb-3" />
                <p className="text-gray-600 text-sm">Aucune oeuvre ne correspond.</p>
              </div>
            )}
          </div>
        </section>

        {/* ═══ CTA ═══ */}
        <section>
          <div className="h-px bg-gradient-to-r from-transparent via-violet-500/15 to-transparent" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
          <Reveal>
            <div className="relative rounded-[20px] overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-violet-600/15 via-fuchsia-600/8 to-transparent" />
              <div className="absolute inset-0 border border-white/[0.06] rounded-[20px]" />
              <div className="relative p-8 sm:p-12 flex flex-col sm:flex-row items-center gap-8 text-center sm:text-left">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 flex items-center justify-center shrink-0 border border-white/[0.06]">
                  <FiBell className="text-xl text-violet-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white mb-1">Ne ratez aucune nouvelle série</h3>
                  <p className="text-gray-500 text-sm">Créez un compte pour suivre vos oeuvres et être notifié à chaque nouveau chapitre traduit.</p>
                </div>
                <Link href="/Inscription" className="shrink-0 inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-black font-semibold text-sm hover:shadow-xl hover:shadow-white/5 hover:-translate-y-0.5 transition-all">
                  S&apos;inscrire <FiArrowRight className="text-xs" />
                </Link>
              </div>
            </div>
          </Reveal>
          <Reveal delay={100}>
            <div className="mt-12 flex flex-wrap justify-center gap-8">
              <Link href="/Oeuvres" className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-white transition-colors"><FiBookOpen className="text-xs" /> Catalogue</Link>
              <Link href="/Teams" className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-white transition-colors"><FiUsers className="text-xs" /> Teams</Link>
              <Link href="/actualites" className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-white transition-colors"><FiCalendar className="text-xs" /> Actualités</Link>
            </div>
          </Reveal>
        </div>
      </section>
      </div>{/* fin wrapper oeuvres + CTA */}

      <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar { display:none }
        .scrollbar-hide { -ms-overflow-style:none; scrollbar-width:none }
        /* ── Glow ambiance qui pulse ── */
        @keyframes pulseGlow1 {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.15); }
        }
        @keyframes pulseGlow2 {
          0%, 100% { opacity: 0.4; transform: scale(1.1); }
          50% { opacity: 0.6; transform: scale(0.9); }
        }
        @keyframes pulseGlow3 {
          0%, 100% { opacity: 0.2; transform: scale(0.95); }
          50% { opacity: 0.5; transform: scale(1.2); }
        }
        .animate-pulseGlow1 { animation: pulseGlow1 10s ease-in-out infinite; }
        .animate-pulseGlow2 { animation: pulseGlow2 13s ease-in-out infinite 3s; }
        .animate-pulseGlow3 { animation: pulseGlow3 15s ease-in-out infinite 6s; }

        /* ── Scanlines ── */
        @keyframes scanline1 {
          0% { opacity: 0; transform: scaleX(0); }
          15% { opacity: 1; transform: scaleX(1); }
          85% { opacity: 1; transform: scaleX(1); }
          100% { opacity: 0; transform: scaleX(0); }
        }
        @keyframes scanline2 {
          0% { opacity: 0; transform: scaleX(0); transform-origin: right; }
          20% { opacity: 0.9; transform: scaleX(1); }
          80% { opacity: 0.9; transform: scaleX(1); }
          100% { opacity: 0; transform: scaleX(0); }
        }
        @keyframes scanline3 {
          0% { opacity: 0; transform: scaleX(0.1); }
          25% { opacity: 0.7; transform: scaleX(1); }
          75% { opacity: 0.7; transform: scaleX(1); }
          100% { opacity: 0; transform: scaleX(0.1); }
        }
        .animate-scanline1 { animation: scanline1 7s ease-in-out infinite; }
        .animate-scanline2 { animation: scanline2 9s ease-in-out infinite 2s; }
        .animate-scanline3 { animation: scanline3 11s ease-in-out infinite 4s; }

        /* ── Orbes gauche → droite ── */
        @keyframes floatL2R1 {
          0% { left: -20px; top: 12%; opacity: 0; }
          5% { opacity: 1; }
          95% { opacity: 1; }
          100% { left: 102%; top: 22%; opacity: 0; }
        }
        @keyframes floatL2R2 {
          0% { left: -30px; top: 40%; opacity: 0; }
          5% { opacity: 0.9; }
          95% { opacity: 0.9; }
          100% { left: 102%; top: 50%; opacity: 0; }
        }
        @keyframes floatL2R3 {
          0% { left: -20px; top: 65%; opacity: 0; }
          5% { opacity: 1; }
          95% { opacity: 1; }
          100% { left: 102%; top: 72%; opacity: 0; }
        }
        @keyframes floatL2R4 {
          0% { left: -15px; top: 30%; opacity: 0; }
          5% { opacity: 0.8; }
          95% { opacity: 0.8; }
          100% { left: 102%; top: 35%; opacity: 0; }
        }
        @keyframes floatL2R5 {
          0% { left: -10px; top: 82%; opacity: 0; }
          5% { opacity: 1; }
          95% { opacity: 1; }
          100% { left: 102%; top: 88%; opacity: 0; }
        }
        .animate-floatL2R1 { animation: floatL2R1 16s linear infinite; }
        .animate-floatL2R2 { animation: floatL2R2 20s linear infinite 4s; }
        .animate-floatL2R3 { animation: floatL2R3 14s linear infinite 8s; }
        .animate-floatL2R4 { animation: floatL2R4 22s linear infinite 2s; }
        .animate-floatL2R5 { animation: floatL2R5 18s linear infinite 11s; }

        /* ── Orbes droite → gauche ── */
        @keyframes floatR2L1 {
          0% { right: -20px; top: 18%; opacity: 0; }
          5% { opacity: 1; }
          95% { opacity: 1; }
          100% { right: 102%; top: 28%; opacity: 0; }
        }
        @keyframes floatR2L2 {
          0% { right: -30px; top: 48%; opacity: 0; }
          5% { opacity: 0.8; }
          95% { opacity: 0.8; }
          100% { right: 102%; top: 42%; opacity: 0; }
        }
        @keyframes floatR2L3 {
          0% { right: -15px; top: 72%; opacity: 0; }
          5% { opacity: 0.9; }
          95% { opacity: 0.9; }
          100% { right: 102%; top: 65%; opacity: 0; }
        }
        @keyframes floatR2L4 {
          0% { right: -25px; top: 55%; opacity: 0; }
          5% { opacity: 0.7; }
          95% { opacity: 0.7; }
          100% { right: 102%; top: 60%; opacity: 0; }
        }
        @keyframes floatR2L5 {
          0% { right: -15px; top: 85%; opacity: 0; }
          5% { opacity: 1; }
          95% { opacity: 1; }
          100% { right: 102%; top: 78%; opacity: 0; }
        }
        .animate-floatR2L1 { animation: floatR2L1 18s linear infinite 3s; }
        .animate-floatR2L2 { animation: floatR2L2 22s linear infinite 7s; }
        .animate-floatR2L3 { animation: floatR2L3 15s linear infinite 12s; }
        .animate-floatR2L4 { animation: floatR2L4 25s linear infinite 1s; }
        .animate-floatR2L5 { animation: floatR2L5 17s linear infinite 9s; }

        /* ── Losanges qui montent ── */
        @keyframes riseUp1 { 0% { bottom: -10px; left: 8%; opacity: 0; } 5% { opacity: 0.8; } 95% { opacity: 0.8; } 100% { bottom: 105%; left: 11%; opacity: 0; } }
        @keyframes riseUp2 { 0% { bottom: -10px; left: 22%; opacity: 0; } 5% { opacity: 0.6; } 95% { opacity: 0.6; } 100% { bottom: 105%; left: 25%; opacity: 0; } }
        @keyframes riseUp3 { 0% { bottom: -10px; left: 38%; opacity: 0; } 5% { opacity: 0.7; } 95% { opacity: 0.7; } 100% { bottom: 105%; left: 35%; opacity: 0; } }
        @keyframes riseUp4 { 0% { bottom: -10px; left: 52%; opacity: 0; } 5% { opacity: 0.5; } 95% { opacity: 0.5; } 100% { bottom: 105%; left: 55%; opacity: 0; } }
        @keyframes riseUp5 { 0% { bottom: -10px; left: 65%; opacity: 0; } 5% { opacity: 0.7; } 95% { opacity: 0.7; } 100% { bottom: 105%; left: 62%; opacity: 0; } }
        @keyframes riseUp6 { 0% { bottom: -10px; left: 78%; opacity: 0; } 5% { opacity: 0.5; } 95% { opacity: 0.5; } 100% { bottom: 105%; left: 80%; opacity: 0; } }
        @keyframes riseUp7 { 0% { bottom: -10px; left: 88%; opacity: 0; } 5% { opacity: 0.8; } 95% { opacity: 0.8; } 100% { bottom: 105%; left: 90%; opacity: 0; } }
        @keyframes riseUp8 { 0% { bottom: -10px; left: 95%; opacity: 0; } 5% { opacity: 0.6; } 95% { opacity: 0.6; } 100% { bottom: 105%; left: 93%; opacity: 0; } }
        .animate-riseUp1 { animation: riseUp1 12s linear infinite; }
        .animate-riseUp2 { animation: riseUp2 16s linear infinite 3s; }
        .animate-riseUp3 { animation: riseUp3 13s linear infinite 6s; }
        .animate-riseUp4 { animation: riseUp4 18s linear infinite 1s; }
        .animate-riseUp5 { animation: riseUp5 14s linear infinite 8s; }
        .animate-riseUp6 { animation: riseUp6 20s linear infinite 4s; }
        .animate-riseUp7 { animation: riseUp7 11s linear infinite 10s; }
        .animate-riseUp8 { animation: riseUp8 17s linear infinite 7s; }

        /* ── Étoiles qui scintillent ── */
        @keyframes twinkle1 {
          0%, 100% { opacity: 0; transform: scale(0.5); }
          50% { opacity: 1; transform: scale(1.5); }
        }
        @keyframes twinkle2 {
          0%, 100% { opacity: 0.2; transform: scale(0.8); }
          30% { opacity: 1; transform: scale(1.8); }
          70% { opacity: 0.8; transform: scale(1.2); }
        }
        @keyframes twinkle3 {
          0%, 100% { opacity: 0.1; transform: scale(1); }
          40% { opacity: 1; transform: scale(2); }
          60% { opacity: 0.6; transform: scale(1); }
        }
        .animate-twinkle1 { animation: twinkle1 3s ease-in-out infinite; }
        .animate-twinkle2 { animation: twinkle2 4s ease-in-out infinite 1s; }
        .animate-twinkle3 { animation: twinkle3 3.5s ease-in-out infinite 0.5s; }

        /* ── Traits diagonaux qui glissent ── */
        @keyframes diag1 { 0% { top: -5%; left: -10%; opacity: 0; } 10% { opacity: 1; } 90% { opacity: 1; } 100% { top: 95%; left: 110%; opacity: 0; } }
        @keyframes diag2 { 0% { top: -5%; right: -10%; opacity: 0; } 10% { opacity: 0.8; } 90% { opacity: 0.8; } 100% { top: 90%; right: 110%; opacity: 0; } }
        @keyframes diag3 { 0% { top: 10%; left: -10%; opacity: 0; } 10% { opacity: 0.7; } 90% { opacity: 0.7; } 100% { top: 100%; left: 110%; opacity: 0; } }
        @keyframes diag4 { 0% { top: 20%; right: -10%; opacity: 0; } 10% { opacity: 0.9; } 90% { opacity: 0.9; } 100% { top: 95%; right: 110%; opacity: 0; } }
        @keyframes diag5 { 0% { top: -10%; left: 30%; opacity: 0; } 10% { opacity: 0.6; } 90% { opacity: 0.6; } 100% { top: 105%; left: 80%; opacity: 0; } }
        @keyframes diag6 { 0% { top: -10%; right: 20%; opacity: 0; } 10% { opacity: 0.7; } 90% { opacity: 0.7; } 100% { top: 105%; right: 70%; opacity: 0; } }
        .animate-diag1 { animation: diag1 20s linear infinite; }
        .animate-diag2 { animation: diag2 25s linear infinite 5s; }
        .animate-diag3 { animation: diag3 18s linear infinite 3s; }
        .animate-diag4 { animation: diag4 22s linear infinite 8s; }
        .animate-diag5 { animation: diag5 28s linear infinite 2s; }
        .animate-diag6 { animation: diag6 24s linear infinite 10s; }

        /* ── Cercles ripple ── */
        @keyframes ripple1 {
          0% { transform: scale(1); opacity: 0.6; }
          100% { transform: scale(25); opacity: 0; }
        }
        @keyframes ripple2 {
          0% { transform: scale(1); opacity: 0.5; }
          100% { transform: scale(30); opacity: 0; }
        }
        @keyframes ripple3 {
          0% { transform: scale(1); opacity: 0.4; }
          100% { transform: scale(20); opacity: 0; }
        }
        .animate-ripple1 { animation: ripple1 8s ease-out infinite; }
        .animate-ripple2 { animation: ripple2 10s ease-out infinite 3s; }
        .animate-ripple3 { animation: ripple3 12s ease-out infinite 6s; }
      `}</style>
    </div>
  );
}
