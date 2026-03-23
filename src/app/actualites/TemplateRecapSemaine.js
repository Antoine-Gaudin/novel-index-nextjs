"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  FiHome, FiChevronRight, FiCalendar, FiBookOpen, FiUsers,
  FiArrowLeft, FiArrowRight, FiTrendingUp, FiStar,
  FiExternalLink, FiBell, FiZap, FiAward, FiBookmark,
  FiChevronDown, FiBarChart2, FiLoader, FiCoffee, FiFileText
} from "react-icons/fi";

// ══════════════════════════════════════
// DONNÉES MOCK POUR PREVIEW
// ══════════════════════════════════════

const MOCK_DATA = {
  article: {
    titre: "Récap Semaine 12",
    sousTitre: "187 chapitres traduits du 16 au 22 mars 2026",
    weekLabel: "Semaine 12",
    dateRange: "16 – 22 mars 2026",
    stats: { chapitres: 187, series: 45, teams: 12 },
  },
  dailyStats: [
    { jour: "Lundi", date: "16 mars", chapitres: 32, series: 8 },
    { jour: "Mardi", date: "17 mars", chapitres: 28, series: 7 },
    { jour: "Mercredi", date: "18 mars", chapitres: 41, series: 11, best: true },
    { jour: "Jeudi", date: "19 mars", chapitres: 22, series: 6 },
    { jour: "Vendredi", date: "20 mars", chapitres: 30, series: 8 },
    { jour: "Samedi", date: "21 mars", chapitres: 19, series: 5 },
    { jour: "Dimanche", date: "22 mars", chapitres: 15, series: 4 },
  ],
  top5: [
    { rang: 1, titre: "Solo Leveling", team: "Chireads", type: "Web novel", chapitres: 24, cover: "", href: "#" },
    { rang: 2, titre: "Overgeared", team: "Chireads", type: "Web novel", chapitres: 18, cover: "", href: "#" },
    { rang: 3, titre: "The Beginning After the End", team: "Chireads", type: "Web novel", chapitres: 14, cover: "", href: "#" },
    { rang: 4, titre: "Omniscient Reader's Viewpoint", team: "Chireads", type: "Web novel", chapitres: 12, cover: "", href: "#" },
    { rang: 5, titre: "Second Life Ranker", team: "Chireads", type: "Web novel", chapitres: 9, cover: "", href: "#" },
  ],
  teams: [
    { nom: "Chireads", initial: "C", oeuvresCount: 28, chapitresCount: 95, color: "from-emerald-600 to-teal-600", href: "#" },
    { nom: "Scantrad", initial: "S", oeuvresCount: 12, chapitresCount: 42, color: "from-teal-600 to-cyan-600", href: "#" },
    { nom: "FuryoSociety", initial: "F", oeuvresCount: 8, chapitresCount: 28, color: "from-green-600 to-emerald-600", href: "#" },
    { nom: "Phenixscans", initial: "P", oeuvresCount: 5, chapitresCount: 22, color: "from-cyan-600 to-blue-600", href: "#" },
  ],
  articles: [
    { titre: "Interview : la team Chireads parle de ses projets 2026", source: "Novel-Index", date: "18 mars", href: "/actualites/interview-chireads-2026", cover: "", externe: false },
    { titre: "Top 10 des web novels les plus lus en mars", source: "Novel-Index", date: "17 mars", href: "/actualites/top-10-mars", cover: "", externe: false },
    { titre: "Dragon Ball Daima : l'anime qui relance le manga", source: "Db-z.com", date: "19 mars", href: "https://db-z.com/dragon-ball-daima", cover: "", externe: true },
    { titre: "Les light novels à surveiller ce printemps", source: "Animeland", date: "20 mars", href: "https://animeland.fr/light-novels-printemps", cover: "", externe: true },
    { titre: "Le webtoon français gagne du terrain", source: "ActuaLitté", date: "16 mars", href: "https://actualitte.com/webtoon-francais", cover: "", externe: true },
  ],
  aiTexts: {
    intro: "La semaine 12 a été riche en traductions avec pas moins de 187 chapitres publiés sur 45 séries différentes. Le mercredi s'est imposé comme le jour le plus productif avec 41 chapitres, porté par une vague de publications simultanées. Les 12 teams actives ont maintenu un rythme soutenu tout au long de la semaine, confirmant la dynamique observée depuis début mars.",
    analyse: "Solo Leveling domine largement le classement avec 24 chapitres publiés sur la semaine, consolidant sa place de série la plus suivie sur Novel-Index. Derrière, Overgeared et The Beginning After the End complètent un podium exclusivement web novel. Côté teams, Chireads concentre à elle seule plus de la moitié des publications hebdomadaires.",
    conclusion: "Encore une semaine bien remplie pour la communauté francophone. Rendez-vous lundi prochain pour le récap de la semaine 13, et d'ici là, bonne lecture à tous.",
  },
};

// ══════════════════════════════════════
// HOOKS
// ══════════════════════════════════════

function useCountUp(target, duration = 1800) {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setStarted(true); obs.disconnect(); } },
      { threshold: 0.3 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!started) return;
    const start = performance.now();
    let raf;
    const step = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * target));
      if (progress < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [started, target, duration]);

  return { ref, count };
}

function useScrollReveal(options = {}) {
  const ref = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setIsVisible(true); obs.disconnect(); } },
      { threshold: options.threshold || 0.15, rootMargin: options.rootMargin || "0px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [options.threshold, options.rootMargin]);

  return { ref, isVisible };
}

function useActiveSection() {
  const [active, setActive] = useState("hero");

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY + window.innerHeight / 3;
      for (let i = SECTIONS.length - 1; i >= 0; i--) {
        const el = document.getElementById(SECTIONS[i].id);
        if (el && el.offsetTop <= scrollY) {
          setActive(SECTIONS[i].id);
          break;
        }
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return active;
}

const SECTIONS = [
  { id: "hero", label: "Accueil" },
  { id: "intro", label: "Introduction" },
  { id: "rythme", label: "Jour par jour" },
  { id: "top5", label: "Top 5" },
  { id: "teams", label: "Teams" },
  { id: "articles", label: "Articles" },
  { id: "analyse", label: "Analyse" },
  { id: "conclusion", label: "Conclusion" },
];

// ══════════════════════════════════════
// COMPOSANTS
// ══════════════════════════════════════

function RevealSection({ children, className = "", delay = 0, direction = "up" }) {
  const { ref, isVisible } = useScrollReveal();
  const transforms = {
    up: "translateY(40px)",
    left: "translateX(-40px)",
    right: "translateX(40px)",
    scale: "scale(0.95)",
  };

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? "none" : transforms[direction],
        transition: `opacity 0.8s cubic-bezier(0.16,1,0.3,1) ${delay}ms, transform 0.8s cubic-bezier(0.16,1,0.3,1) ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

function CounterStat({ value, label }) {
  const { ref, count } = useCountUp(value);
  return (
    <div ref={ref}>
      <p className="text-5xl sm:text-6xl font-black text-white tabular-nums">{count}</p>
      <p className="text-sm text-gray-500 uppercase tracking-wider mt-1">{label}</p>
    </div>
  );
}

function GlowCard({ children, className = "", glowColor = "rgba(16,185,129,0.15)", href }) {
  const cardRef = useRef(null);
  const [glow, setGlow] = useState({ x: 50, y: 50 });

  const handleMouse = useCallback((e) => {
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return;
    setGlow({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    });
  }, []);

  const Tag = href ? Link : "div";
  const extraProps = href ? { href } : {};

  return (
    <Tag
      ref={cardRef}
      onMouseMove={handleMouse}
      className={`relative group ${className}`}
      style={{
        background: `radial-gradient(600px circle at ${glow.x}% ${glow.y}%, ${glowColor}, transparent 70%)`,
      }}
      {...extraProps}
    >
      {children}
    </Tag>
  );
}

function DayBar({ jour, date, chapitres, maxChapitres, best, delay }) {
  const { ref, isVisible } = useScrollReveal();
  const heightPercent = (chapitres / maxChapitres) * 100;

  return (
    <div ref={ref} className="flex flex-col items-center gap-2 flex-1">
      {/* Compteur */}
      <span
        className={`text-sm font-bold transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"} ${best ? "text-emerald-400" : "text-gray-400"}`}
        style={{ transitionDelay: `${delay + 800}ms` }}
      >
        {chapitres}
      </span>

      {/* Barre */}
      <div className="w-full h-48 sm:h-56 bg-gray-800/30 rounded-xl overflow-hidden flex flex-col justify-end relative">
        {best && (
          <div
            className={`absolute -top-1 left-1/2 -translate-x-1/2 z-10 transition-all duration-500 ${isVisible ? "opacity-100 scale-100" : "opacity-0 scale-50"}`}
            style={{ transitionDelay: `${delay + 1200}ms` }}
          >
            <span className="inline-flex items-center gap-1 bg-emerald-500 text-black text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full whitespace-nowrap">
              <FiStar className="text-[8px]" /> Top
            </span>
          </div>
        )}
        <div
          className={`w-full rounded-xl transition-all duration-1000 ease-out ${best
            ? "bg-gradient-to-t from-emerald-600 to-teal-400 shadow-lg shadow-emerald-500/20"
            : "bg-gradient-to-t from-gray-700 to-gray-600"
          }`}
          style={{
            height: isVisible ? `${heightPercent}%` : "0%",
            transitionDelay: `${delay}ms`,
          }}
        />
      </div>

      {/* Labels */}
      <div className="text-center">
        <p className={`text-xs font-semibold ${best ? "text-emerald-400" : "text-gray-400"}`}>{jour}</p>
        <p className="text-[10px] text-gray-600">{date}</p>
      </div>
    </div>
  );
}

// ══════════════════════════════════════
// PAGE
// ══════════════════════════════════════

export default function TemplateRecapSemaine({ preloadedData } = {}) {
  const activeSection = useActiveSection();
  const data = preloadedData || MOCK_DATA;
  const isPreview = !preloadedData;

  const { article: ARTICLE, dailyStats: DAILY, top5: TOP5, teams: TEAMS, articles: ARTICLES, aiTexts } = data;
  const maxChapitres = Math.max(...DAILY.map((d) => d.chapitres), 1);
  const bestDay = DAILY.reduce((best, d) => d.chapitres > best.chapitres ? d : best, DAILY[0]);

  return (
    <div className="relative bg-gray-950 text-white min-h-screen overflow-hidden">

      {/* ── SOMMAIRE FLOTTANT (desktop) ── */}
      <nav className="fixed right-6 top-1/2 -translate-y-1/2 z-50 hidden xl:flex flex-col items-end gap-1">
        {SECTIONS.map((s) => (
          <a
            key={s.id}
            href={`#${s.id}`}
            className="group flex items-center gap-3 py-1.5"
            onClick={(e) => {
              e.preventDefault();
              document.getElementById(s.id)?.scrollIntoView({ behavior: "smooth" });
            }}
          >
            <span
              className={`text-[11px] font-medium transition-all duration-300 ${
                activeSection === s.id
                  ? "text-emerald-400 opacity-100 translate-x-0"
                  : "text-gray-600 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0"
              }`}
            >
              {s.label}
            </span>
            <span
              className={`block rounded-full transition-all duration-300 ${
                activeSection === s.id
                  ? "w-8 h-2 bg-emerald-500"
                  : "w-2 h-2 bg-gray-700 group-hover:bg-gray-500"
              }`}
            />
          </a>
        ))}
      </nav>

      {/* ══════════════════════════════════════════════════════
          SECTION 1 — HERO
          ══════════════════════════════════════════════════════ */}
      <section id="hero" className="relative min-h-[90vh] flex flex-col justify-end overflow-hidden">
        {/* Fond */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-950 via-gray-950 to-teal-950" />
          <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-emerald-600/10 rounded-full blur-[120px]" style={{ animation: "pulse 6s ease-in-out infinite" }} />
          <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-teal-600/8 rounded-full blur-[100px]" style={{ animation: "pulse 8s ease-in-out infinite 2s" }} />
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: "linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)",
              backgroundSize: "60px 60px",
            }}
          />
        </div>

        {/* Breadcrumb */}
        <nav
          aria-label="Fil d'Ariane"
          className="absolute top-0 left-0 right-0 z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20"
        >
          <ol className="flex items-center gap-2 text-sm text-gray-500">
            <li>
              <Link href="/" className="hover:text-white transition-colors flex items-center gap-1">
                <FiHome className="text-xs" /> Accueil
              </Link>
            </li>
            <li><FiChevronRight className="text-xs" /></li>
            <li>
              <Link href="/actualites" className="hover:text-white transition-colors">Actualités</Link>
            </li>
            <li><FiChevronRight className="text-xs" /></li>
            <li className="text-gray-300 font-medium truncate max-w-[250px]">{ARTICLE.titre}</li>
          </ol>
        </nav>

        {/* Contenu Hero */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
          <div className="flex items-center gap-3 mb-6" style={{ animation: "fadeSlideUp 0.8s ease-out both" }}>
            <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-emerald-300 bg-emerald-500/15 backdrop-blur-sm px-4 py-1.5 rounded-full border border-emerald-500/20">
              <FiBarChart2 className="text-sm" /> Récap hebdomadaire
            </span>
            <span className="hidden sm:flex items-center gap-1.5 text-xs text-gray-600">
              <FiCoffee className="text-[10px]" /> 5 min de lecture
            </span>
          </div>

          <h1
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white mb-4 leading-[0.95] tracking-tight"
            style={{ animation: "fadeSlideUp 0.8s ease-out 0.15s both" }}
          >
            <span className="block">{ARTICLE.weekLabel}</span>
            <span className="block bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent" style={{ backgroundSize: "200% auto", animation: "gradientShift 6s linear infinite" }}>
              {ARTICLE.dateRange}
            </span>
          </h1>

          <p
            className="text-xl sm:text-2xl text-gray-400 font-light max-w-2xl mb-12"
            style={{ animation: "fadeSlideUp 0.8s ease-out 0.3s both" }}
          >
            {ARTICLE.sousTitre}
          </p>

          {/* Compteurs animés */}
          <div className="flex flex-wrap gap-8 sm:gap-12" style={{ animation: "fadeSlideUp 0.8s ease-out 0.45s both" }}>
            <CounterStat value={ARTICLE.stats.chapitres} label="chapitres" />
            <div className="w-px bg-gray-800 self-stretch" />
            <CounterStat value={ARTICLE.stats.series} label="séries" />
            <div className="w-px bg-gray-800 self-stretch" />
            <CounterStat value={ARTICLE.stats.teams} label="teams" />
          </div>
        </div>

        {/* Flèche scroll */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10" style={{ animation: "bounce 2s ease-in-out infinite" }}>
          <FiChevronDown className="text-2xl text-gray-600" />
        </div>

        {/* Séparateur vague */}
        <div className="absolute bottom-0 left-0 right-0 z-10">
          <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto" preserveAspectRatio="none">
            <path d="M0 60L1440 60L1440 30C1200 0 960 50 720 30C480 10 240 50 0 20L0 60Z" fill="#111827" />
          </svg>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          SECTION 2 — INTRODUCTION
          ══════════════════════════════════════════════════════ */}
      <section id="intro" className="relative bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <RevealSection>
            <p className="text-lg sm:text-xl text-gray-300 leading-relaxed font-light">
              La <strong className="text-white font-semibold">{ARTICLE.weekLabel}</strong> touche à sa fin et le bilan est là : <strong className="text-white font-semibold">{ARTICLE.stats.chapitres} chapitres</strong> traduits sur <strong className="text-white font-semibold">{ARTICLE.stats.series} séries</strong> par <strong className="text-white font-semibold">{ARTICLE.stats.teams} teams</strong>.
            </p>
          </RevealSection>

          <RevealSection delay={150} direction="left">
            <blockquote className="relative my-12 py-8 pl-8 border-l-2 border-emerald-500">
              <div className="absolute -left-3 top-0 w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center">
                <span className="text-white text-xs font-bold">&ldquo;</span>
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-white leading-snug">
                {bestDay.chapitres} chapitres le {bestDay.jour.toLowerCase()} — jour le plus productif de la semaine.
              </p>
              <div className="absolute -left-3 bottom-0 w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center">
                <span className="text-white text-xs font-bold">&rdquo;</span>
              </div>
            </blockquote>
          </RevealSection>

          <RevealSection delay={200}>
            <p className="text-lg text-gray-400 leading-relaxed">
              {aiTexts.intro || ""}
            </p>
          </RevealSection>
        </div>

        <div className="h-px bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent" />
      </section>

      {/* ══════════════════════════════════════════════════════
          SECTION 3 — RYTHME DE LA SEMAINE (barres verticales)
          ══════════════════════════════════════════════════════ */}
      <section id="rythme" className="relative bg-gray-950 py-16 sm:py-24">
        <div className="absolute top-0 left-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-[120px]" />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <RevealSection>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 flex items-center justify-center border border-emerald-500/20">
                <FiBarChart2 className="text-xl text-emerald-400" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-emerald-500/80 mb-1">Activité</p>
                <h2 className="text-2xl sm:text-3xl font-bold text-white">Jour par jour</h2>
              </div>
            </div>
            <p className="text-gray-500 max-w-2xl mb-12">
              Visualisez le rythme des publications tout au long de la semaine. Chaque barre représente le nombre de chapitres traduits ce jour-là.
            </p>
          </RevealSection>

          {/* Barres verticales */}
          <div className="flex items-end gap-2 sm:gap-4">
            {DAILY.map((day, i) => (
              <DayBar
                key={day.jour}
                jour={day.jour}
                date={day.date}
                chapitres={day.chapitres}
                maxChapitres={maxChapitres}
                best={day.chapitres === bestDay.chapitres}
                delay={i * 120}
              />
            ))}
          </div>

          {/* Légende */}
          <RevealSection delay={1000}>
            <div className="flex items-center justify-center gap-6 mt-8 text-xs text-gray-600">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-gradient-to-t from-gray-700 to-gray-600" />
                <span>Jour standard</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-gradient-to-t from-emerald-600 to-teal-400" />
                <span>Jour le plus actif</span>
              </div>
            </div>
          </RevealSection>
        </div>

        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto" preserveAspectRatio="none">
            <path d="M0 40H1440V20C1320 35 1200 5 1080 20C960 35 840 5 720 20C600 35 480 5 360 20C240 35 120 5 0 20V40Z" fill="#111827" fillOpacity="0.5" />
          </svg>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          SECTION 4 — TOP 5 DE LA SEMAINE
          ══════════════════════════════════════════════════════ */}
      <section id="top5" className="relative bg-gray-950 py-16 sm:py-24">
        <div className="absolute top-0 right-0 w-96 h-96 bg-yellow-500/5 rounded-full blur-[120px]" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <RevealSection>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-yellow-500/20 to-orange-500/10 flex items-center justify-center border border-yellow-500/20">
                <FiAward className="text-xl text-yellow-400" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-yellow-500/80 mb-1">Classement</p>
                <h2 className="text-2xl sm:text-3xl font-bold text-white">Top 5 de la semaine</h2>
              </div>
            </div>
            <p className="text-gray-500 max-w-2xl mb-10">
              Les séries qui ont cumulé le plus de chapitres traduits cette semaine.
            </p>
          </RevealSection>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* #1 — Grand format */}
            {TOP5[0] && (
              <RevealSection delay={100} direction="scale" className="lg:row-span-2">
                <GlowCard
                  href={TOP5[0].href}
                  glowColor="rgba(234,179,8,0.12)"
                  className="block rounded-2xl overflow-hidden bg-gray-900 border border-yellow-500/20 hover:border-yellow-500/40 transition-all h-full relative min-h-[280px]"
                >
                  {TOP5[0].cover ? (
                    <Image src={TOP5[0].cover} alt={TOP5[0].titre} fill className="object-cover opacity-40 group-hover:opacity-50 group-hover:scale-105 transition-all duration-700" />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/40 to-teal-900/40" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/60 to-transparent" />
                  <div className="absolute -bottom-20 left-1/2 -translate-x-1/2 w-[300px] h-[200px] bg-yellow-500/10 rounded-full blur-[80px] group-hover:bg-yellow-500/15 transition-colors duration-700" />
                  <div className="absolute top-4 left-4 z-10">
                    <span className="inline-flex items-center gap-1.5 bg-yellow-500 text-black text-xs font-black uppercase tracking-wider px-3 py-1.5 rounded-full shadow-lg shadow-yellow-500/20">
                      #1 de la semaine
                    </span>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8 z-10">
                    <p className="text-xs text-yellow-400/80 font-semibold uppercase tracking-wider mb-2">{TOP5[0].type}</p>
                    <h3 className="text-2xl sm:text-3xl font-bold text-white mb-2 group-hover:text-yellow-200 transition-colors">
                      {TOP5[0].titre}
                    </h3>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-400">{TOP5[0].team}</span>
                      <span className="text-sm font-bold text-yellow-400 bg-yellow-500/10 px-3 py-1 rounded-full backdrop-blur-sm">
                        +{TOP5[0].chapitres} chapitres
                      </span>
                    </div>
                  </div>
                </GlowCard>
              </RevealSection>
            )}

            {/* #2 à #5 — Format compact */}
            {TOP5.slice(1).map((item, i) => (
              <RevealSection key={item.rang} delay={200 + i * 100} direction="right">
                <GlowCard
                  href={item.href}
                  glowColor="rgba(156,163,175,0.08)"
                  className="block rounded-2xl overflow-hidden bg-gray-900 border border-gray-700/50 hover:border-gray-500/50 transition-all"
                >
                  <div className="flex items-stretch">
                    <div className="relative w-24 sm:w-28 shrink-0 overflow-hidden">
                      {item.cover ? (
                        <Image src={item.cover} alt={item.titre} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <div className="w-full h-full bg-gray-800 min-h-[88px]" />
                      )}
                      <div className="absolute top-2 left-2">
                        <span className={`inline-flex items-center justify-center w-7 h-7 text-[10px] font-black rounded-full shadow-lg ${
                          item.rang === 2 ? "bg-gray-400 text-black" :
                          item.rang === 3 ? "bg-amber-600 text-white" :
                          "bg-gray-600 text-white"
                        }`}>
                          #{item.rang}
                        </span>
                      </div>
                    </div>
                    <div className="flex-1 p-4 sm:p-5 flex flex-col justify-center">
                      <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider mb-1">{item.type}</p>
                      <h3 className="text-base sm:text-lg font-bold text-white mb-1 group-hover:text-emerald-300 transition-colors">{item.titre}</h3>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-gray-500">{item.team}</span>
                        <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full">+{item.chapitres}</span>
                      </div>
                    </div>
                  </div>
                </GlowCard>
              </RevealSection>
            ))}
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-yellow-500/20 to-transparent" />
      </section>

      {/* ══════════════════════════════════════════════════════
          SECTION 5 — TEAMS ACTIVES
          ══════════════════════════════════════════════════════ */}
      <section id="teams" className="relative bg-gray-900 py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <RevealSection>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-500/20 to-cyan-500/10 flex items-center justify-center border border-teal-500/20">
                <FiUsers className="text-xl text-teal-400" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-teal-500/80 mb-1">Traduction</p>
                <h2 className="text-2xl sm:text-3xl font-bold text-white">Teams de la semaine</h2>
              </div>
            </div>
            <p className="text-gray-500 max-w-2xl mb-10">
              Les teams de traduction qui ont rendu possible cette semaine de lectures. Merci à elles.
            </p>
          </RevealSection>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {TEAMS.map((team, i) => (
              <RevealSection key={team.nom} delay={i * 120} direction="up">
                <GlowCard
                  href={team.href}
                  glowColor="rgba(20,184,166,0.1)"
                  className="flex items-center gap-4 p-5 rounded-xl bg-gray-800/40 border border-gray-700/50 hover:border-teal-500/50 transition-all"
                >
                  <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${team.color} flex items-center justify-center shrink-0 shadow-lg`}>
                    <span className="text-white font-bold text-xl">{team.initial}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold group-hover:text-teal-300 transition-colors">{team.nom}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{team.oeuvresCount} séries</p>
                    <p className="text-sm font-bold text-emerald-400 mt-1">{team.chapitresCount} chap.</p>
                  </div>
                  <FiExternalLink className="text-gray-600 group-hover:text-teal-400 transition-colors shrink-0" />
                </GlowCard>
              </RevealSection>
            ))}
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-teal-500/20 to-transparent" />
      </section>

      {/* ══════════════════════════════════════════════════════
          SECTION 6 — ARTICLES DE LA SEMAINE
          ══════════════════════════════════════════════════════ */}
      {ARTICLES && ARTICLES.length > 0 && (
        <section id="articles" className="relative bg-gray-950 py-16 sm:py-24">
          <div className="absolute bottom-0 right-0 w-80 h-80 bg-cyan-500/5 rounded-full blur-[100px]" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <RevealSection>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-500/10 flex items-center justify-center border border-cyan-500/20">
                  <FiFileText className="text-xl text-cyan-400" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-cyan-500/80 mb-1">À lire</p>
                  <h2 className="text-2xl sm:text-3xl font-bold text-white">Articles de la semaine</h2>
                </div>
              </div>
              <p className="text-gray-500 max-w-2xl mb-10">
                Les articles publiés cette semaine sur Novel-Index et ailleurs dans la communauté.
              </p>
            </RevealSection>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {ARTICLES.map((art, i) => (
                <RevealSection key={art.titre} delay={i * 100}>
                  {art.externe ? (
                    <a
                      href={art.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex flex-col rounded-xl overflow-hidden bg-gray-900/60 border border-gray-800/60 hover:border-cyan-500/40 transition-all h-full"
                    >
                      {art.cover ? (
                        <div className="relative w-full h-36 overflow-hidden">
                          <img src={art.cover} alt={art.titre} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        </div>
                      ) : (
                        <div className="w-full h-24 bg-gradient-to-br from-gray-800 to-gray-700/50 flex items-center justify-center">
                          <FiExternalLink className="text-2xl text-gray-600" />
                        </div>
                      )}
                      <div className="flex-1 p-4 flex flex-col">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-full">
                            Externe
                          </span>
                          <span className="text-[10px] text-gray-600">{art.source}</span>
                        </div>
                        <h3 className="text-sm font-semibold text-white group-hover:text-cyan-300 transition-colors line-clamp-2 flex-1">
                          {art.titre}
                        </h3>
                        <div className="flex items-center justify-between mt-3">
                          <span className="text-[11px] text-gray-500">{art.date}</span>
                          <FiExternalLink className="text-xs text-gray-600 group-hover:text-cyan-400 transition-colors" />
                        </div>
                      </div>
                    </a>
                  ) : (
                    <Link
                      href={art.href}
                      className="group flex flex-col rounded-xl overflow-hidden bg-gray-900/60 border border-gray-800/60 hover:border-emerald-500/40 transition-all h-full"
                    >
                      {art.cover ? (
                        <div className="relative w-full h-36 overflow-hidden">
                          <Image src={art.cover} alt={art.titre} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                        </div>
                      ) : (
                        <div className="w-full h-24 bg-gradient-to-br from-emerald-900/30 to-teal-900/20 flex items-center justify-center">
                          <FiFileText className="text-2xl text-emerald-600/50" />
                        </div>
                      )}
                      <div className="flex-1 p-4 flex flex-col">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                            Novel-Index
                          </span>
                        </div>
                        <h3 className="text-sm font-semibold text-white group-hover:text-emerald-300 transition-colors line-clamp-2 flex-1">
                          {art.titre}
                        </h3>
                        <span className="text-[11px] text-gray-500 mt-3">{art.date}</span>
                      </div>
                    </Link>
                  )}
                </RevealSection>
              ))}
            </div>
          </div>

          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent" />
        </section>
      )}

      {/* ══════════════════════════════════════════════════════
          SECTION 7 — ANALYSE & TENDANCES
          ══════════════════════════════════════════════════════ */}
      <section id="analyse" className="relative bg-gradient-to-r from-emerald-950/50 via-gray-900 to-teal-950/50 border-y border-gray-800/50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <RevealSection>
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 flex items-center justify-center border border-emerald-500/20">
                <FiTrendingUp className="text-lg text-emerald-400" />
              </div>
              <h2 className="text-xl font-bold text-white">Analyse & tendances</h2>
            </div>
          </RevealSection>

          <RevealSection delay={100}>
            <p className="text-lg text-gray-300 leading-relaxed">
              {aiTexts.analyse || ""}
            </p>
          </RevealSection>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          SECTION 7 — CONCLUSION + CTA
          ══════════════════════════════════════════════════════ */}
      <section id="conclusion" className="relative bg-gray-900 py-16 sm:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <RevealSection>
            <div className="space-y-5 text-gray-300 leading-relaxed text-lg">
              <p>{aiTexts.conclusion || ""}</p>
            </div>
          </RevealSection>

          {/* CTA */}
          <RevealSection delay={200} direction="scale">
            <div className="mt-12 p-8 rounded-2xl bg-gradient-to-br from-emerald-600/15 to-teal-600/10 border border-emerald-500/20 hover:border-emerald-500/30 transition-colors">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                <div className="w-14 h-14 rounded-2xl bg-emerald-600/20 flex items-center justify-center shrink-0">
                  <FiBell className="text-2xl text-emerald-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white mb-1">Ne ratez aucun chapitre traduit en français</h3>
                  <p className="text-gray-400">
                    Abonnez-vous à vos séries préférées pour être notifié à chaque nouveau chapitre. Gratuit et instantané.
                  </p>
                </div>
                <Link
                  href="/Inscription"
                  className="shrink-0 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium transition-all hover:shadow-lg hover:shadow-emerald-600/20 hover:-translate-y-0.5"
                >
                  Créer un compte
                </Link>
              </div>
            </div>
          </RevealSection>

          {/* Liens rapides */}
          <RevealSection delay={300}>
            <div className="mt-10 flex flex-wrap gap-4">
              <Link href="/Oeuvres" className="flex items-center gap-2 text-sm text-gray-500 hover:text-emerald-400 transition-colors">
                <FiBookOpen /> Parcourir le catalogue
              </Link>
              <Link href="/Teams" className="flex items-center gap-2 text-sm text-gray-500 hover:text-emerald-400 transition-colors">
                <FiUsers /> Toutes les teams
              </Link>
              <Link href="/actualites" className="flex items-center gap-2 text-sm text-gray-500 hover:text-emerald-400 transition-colors">
                <FiCalendar /> Archives des sorties
              </Link>
            </div>
          </RevealSection>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          NAVIGATION PREV/NEXT
          ══════════════════════════════════════════════════════ */}
      <nav className="relative bg-gray-950 border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 divide-x divide-gray-800">
            <Link
              href="/actualites"
              className="group flex items-center gap-4 py-8 pr-6 hover:bg-gray-900/50 transition-colors"
            >
              <FiArrowLeft className="text-2xl text-gray-600 group-hover:text-emerald-400 group-hover:-translate-x-1 transition-all shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-gray-600 uppercase tracking-wider mb-1">Semaine précédente</p>
                <p className="text-white font-medium truncate group-hover:text-emerald-300 transition-colors">
                  Récap Semaine 11
                </p>
              </div>
            </Link>
            <Link
              href="/actualites"
              className="group flex items-center justify-end gap-4 py-8 pl-6 hover:bg-gray-900/50 transition-colors text-right"
            >
              <div className="min-w-0">
                <p className="text-xs text-gray-600 uppercase tracking-wider mb-1">Semaine suivante</p>
                <p className="text-white font-medium truncate group-hover:text-emerald-300 transition-colors">
                  Récap Semaine 13
                </p>
              </div>
              <FiArrowRight className="text-2xl text-gray-600 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all shrink-0" />
            </Link>
          </div>
        </div>
      </nav>

      {/* CSS ANIMATIONS */}
      <style jsx global>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes gradientShift {
          0%, 100% { background-position: 0% center; }
          50% { background-position: 200% center; }
        }
        @keyframes bounce {
          0%, 100% { transform: translateX(-50%) translateY(0); }
          50% { transform: translateX(-50%) translateY(8px); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}
