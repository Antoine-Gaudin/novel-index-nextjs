"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  FiHome, FiChevronRight, FiChevronDown, FiBookOpen,
  FiExternalLink, FiStar, FiLayers, FiCoffee, FiZap,
  FiBell, FiUsers, FiCalendar, FiTrendingUp, FiAward,
  FiBookmark, FiLoader
} from "react-icons/fi";

// ── HOOKS ──

const API = process.env.NEXT_PUBLIC_API_URL;

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

// ── COMPOSANTS ──

function RevealSection({ children, className = "", delay = 0, direction = "up" }) {
  const { ref, isVisible } = useScrollReveal();
  const transforms = {
    up: "translateY(40px)", left: "translateX(-40px)",
    right: "translateX(40px)", scale: "scale(0.95)",
  };
  return (
    <div ref={ref} className={className} style={{
      opacity: isVisible ? 1 : 0,
      transform: isVisible ? "none" : transforms[direction],
      transition: `opacity 0.8s cubic-bezier(0.16,1,0.3,1) ${delay}ms, transform 0.8s cubic-bezier(0.16,1,0.3,1) ${delay}ms`,
    }}>
      {children}
    </div>
  );
}

function AnimatedBar({ width, active, delay = 0, count = 0 }) {
  const { ref, isVisible } = useScrollReveal();
  return (
    <div ref={ref} className="flex-1 h-8 bg-gray-800/50 rounded-lg overflow-hidden relative">
      <div
        className={`h-full rounded-lg ${active ? "bg-gradient-to-r from-indigo-600 to-purple-600" : "bg-gray-700/60"}`}
        style={{ width: isVisible ? `${width}%` : "0%", transition: `width 1.2s cubic-bezier(0.16,1,0.3,1) ${delay}ms` }}
      />
      <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold transition-opacity duration-500 ${isVisible ? "opacity-100" : "opacity-0"} ${active ? "text-white" : "text-gray-500"}`}
        style={{ transitionDelay: `${delay + 600}ms` }}>
        {count}
      </span>
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

function GlowCard({ children, className = "", glowColor = "rgba(99,102,241,0.15)", href }) {
  const cardRef = useRef(null);
  const [glow, setGlow] = useState({ x: 50, y: 50 });
  const handleMouse = useCallback((e) => {
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return;
    setGlow({ x: ((e.clientX - rect.left) / rect.width) * 100, y: ((e.clientY - rect.top) / rect.height) * 100 });
  }, []);
  const Tag = href ? Link : "div";
  const extraProps = href ? { href } : {};
  return (
    <Tag ref={cardRef} onMouseMove={handleMouse} className={`relative group ${className}`}
      style={{ background: `radial-gradient(600px circle at ${glow.x}% ${glow.y}%, ${glowColor}, transparent 70%)` }} {...extraProps}>
      {children}
    </Tag>
  );
}

const SECTIONS = [
  { id: "hero", label: "Accueil" },
  { id: "intro", label: "Introduction" },
  { id: "podium", label: "Podium" },
  { id: "catalogue", label: "Catalogue" },
  { id: "teams", label: "Teams & Stats" },
  { id: "coup-de-coeur", label: "Coup de coeur" },
  { id: "conclusion", label: "Conclusion" },
];

// ── TEMPLATE SORTIES DU JOUR ──

export default function TemplateSortiesJour({ preloadedData }) {
  const { article: ARTICLE, top3: TOP3, categories: CATEGORIES, teams: TEAMS, weekData, aiTexts } = preloadedData;
  const maxSemaine = Math.max(...(weekData || []).map((d) => d.count), 1);

  const [activeSection, setActiveSection] = useState("hero");

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY + window.innerHeight / 3;
      for (let i = SECTIONS.length - 1; i >= 0; i--) {
        const el = document.getElementById(SECTIONS[i].id);
        if (el && el.offsetTop <= scrollY) { setActiveSection(SECTIONS[i].id); break; }
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="relative bg-gray-950 text-white min-h-screen overflow-hidden">

      {/* SOMMAIRE FLOTTANT */}
      <nav className="fixed right-6 top-1/2 -translate-y-1/2 z-50 hidden xl:flex flex-col items-end gap-1">
        {SECTIONS.map((s) => (
          <a key={s.id} href={`#${s.id}`} className="group flex items-center gap-3 py-1.5"
            onClick={(e) => { e.preventDefault(); document.getElementById(s.id)?.scrollIntoView({ behavior: "smooth" }); }}>
            <span className={`text-[11px] font-medium transition-all duration-300 ${activeSection === s.id ? "text-indigo-400 opacity-100 translate-x-0" : "text-gray-600 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0"}`}>{s.label}</span>
            <span className={`block rounded-full transition-all duration-300 ${activeSection === s.id ? "w-8 h-2 bg-indigo-500" : "w-2 h-2 bg-gray-700 group-hover:bg-gray-500"}`} />
          </a>
        ))}
      </nav>

      {/* ═══ HERO ═══ */}
      <section id="hero" className="relative min-h-[90vh] flex flex-col justify-end overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 via-gray-950 to-purple-950" />
          <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[120px]" style={{ animation: "pulse 6s ease-in-out infinite" }} />
          <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-purple-600/8 rounded-full blur-[100px]" style={{ animation: "pulse 8s ease-in-out infinite 2s" }} />
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)", backgroundSize: "60px 60px" }} />
        </div>

        <nav aria-label="Fil d'Ariane" className="absolute top-0 left-0 right-0 z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20">
          <ol className="flex items-center gap-2 text-sm text-gray-500">
            <li><Link href="/" className="hover:text-white transition-colors flex items-center gap-1"><FiHome className="text-xs" /> Accueil</Link></li>
            <li><FiChevronRight className="text-xs" /></li>
            <li><Link href="/actualites" className="hover:text-white transition-colors">Actualités</Link></li>
            <li><FiChevronRight className="text-xs" /></li>
            <li className="text-gray-300 font-medium truncate max-w-[250px]">{ARTICLE.titre}</li>
          </ol>
        </nav>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
          <div className="flex items-center gap-3 mb-6" style={{ animation: "fadeSlideUp 0.8s ease-out both" }}>
            <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-indigo-300 bg-indigo-500/15 backdrop-blur-sm px-4 py-1.5 rounded-full border border-indigo-500/20">
              <FiZap className="text-sm" /> Sorties du jour
            </span>
            <span className="hidden sm:flex items-center gap-1.5 text-xs text-gray-600">
              <FiCoffee className="text-[10px]" /> 8 min de lecture
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white mb-4 leading-[0.95] tracking-tight" style={{ animation: "fadeSlideUp 0.8s ease-out 0.15s both" }}>
            <span className="block">{ARTICLE.date.split(" ").slice(0, 1)}</span>
            <span className="block bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent" style={{ backgroundSize: "200% auto", animation: "gradientShift 6s linear infinite" }}>
              {ARTICLE.date.split(" ").slice(1).join(" ")}
            </span>
          </h1>

          <p className="text-xl sm:text-2xl text-gray-400 font-light max-w-2xl mb-12" style={{ animation: "fadeSlideUp 0.8s ease-out 0.3s both" }}>
            {ARTICLE.sousTitre}
          </p>

          <div className="flex flex-wrap gap-8 sm:gap-12" style={{ animation: "fadeSlideUp 0.8s ease-out 0.45s both" }}>
            <CounterStat value={ARTICLE.stats.chapitres} label="chapitres" />
            <div className="w-px bg-gray-800 self-stretch" />
            <CounterStat value={ARTICLE.stats.series} label="séries" />
            <div className="w-px bg-gray-800 self-stretch" />
            <CounterStat value={ARTICLE.stats.teams} label="teams" />
          </div>
        </div>

        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10" style={{ animation: "bounce 2s ease-in-out infinite" }}>
          <FiChevronDown className="text-2xl text-gray-600" />
        </div>
        <div className="absolute bottom-0 left-0 right-0 z-10">
          <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto" preserveAspectRatio="none">
            <path d="M0 60L1440 60L1440 30C1200 0 960 50 720 30C480 10 240 50 0 20L0 60Z" fill="#111827" />
          </svg>
        </div>
      </section>

      {/* ═══ INTRO ═══ */}
      <section id="intro" className="relative bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <RevealSection>
            <p className="text-lg sm:text-xl text-gray-300 leading-relaxed font-light">
              {aiTexts.intro || `${ARTICLE.stats.chapitres} chapitres publiés sur ${ARTICLE.stats.series} séries par ${ARTICLE.stats.teams} teams.`}
            </p>
          </RevealSection>

          {weekData && weekData.length > 0 && (
            <RevealSection delay={200}>
              <div className="mt-12">
                <p className="text-xs font-bold uppercase tracking-widest text-indigo-500/80 mb-4">Tendance de la semaine</p>
                <div className="flex items-end gap-3">
                  {weekData.map((d, i) => (
                    <div key={d.jour} className="flex-1 flex flex-col items-center gap-2">
                      <AnimatedBar width={(d.count / maxSemaine) * 100} active={d.active} delay={i * 100} count={d.count} />
                      <span className={`text-[10px] font-medium ${d.active ? "text-indigo-400" : "text-gray-600"}`}>{d.jour.slice(0, 3)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </RevealSection>
          )}
        </div>
        <div className="h-px bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent" />
      </section>

      {/* ═══ PODIUM ═══ */}
      <section id="podium" className="relative bg-gray-950 py-16 sm:py-24">
        <div className="absolute top-0 right-0 w-96 h-96 bg-yellow-500/5 rounded-full blur-[120px]" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <RevealSection>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-yellow-500/20 to-orange-500/10 flex items-center justify-center border border-yellow-500/20">
                <FiAward className="text-xl text-yellow-400" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-yellow-500/80 mb-1">Classement</p>
                <h2 className="text-2xl sm:text-3xl font-bold text-white">Podium du jour</h2>
              </div>
            </div>
            {aiTexts.podium && <p className="text-gray-500 max-w-2xl mb-10">{aiTexts.podium}</p>}
          </RevealSection>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
            {TOP3.map((item, i) => (
              <RevealSection key={item.rang} delay={i * 150} direction="scale">
                <GlowCard href={item.href} glowColor={i === 0 ? "rgba(234,179,8,0.12)" : "rgba(156,163,175,0.08)"}
                  className={`block rounded-2xl overflow-hidden bg-gray-900 border transition-all ${i === 0 ? "border-yellow-500/20 hover:border-yellow-500/40" : "border-gray-700/50 hover:border-gray-500/50"} ${i === 0 ? "lg:row-span-1" : ""}`}>
                  <div className="relative h-48 overflow-hidden">
                    {item.cover ? (
                      <Image src={item.cover} alt={item.titre} fill className="object-cover group-hover:scale-105 transition-transform duration-700" />
                    ) : (
                      <div className={`w-full h-full ${i === 0 ? "bg-gradient-to-br from-yellow-900/40 to-orange-900/40" : "bg-gray-800"}`} />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/40 to-transparent" />
                    <div className="absolute top-3 left-3">
                      <span className={`inline-flex items-center justify-center w-8 h-8 text-xs font-black rounded-full shadow-lg ${i === 0 ? "bg-yellow-500 text-black" : i === 1 ? "bg-gray-400 text-black" : "bg-amber-600 text-white"}`}>#{item.rang}</span>
                    </div>
                  </div>
                  <div className="p-5">
                    <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider mb-1">{item.type}</p>
                    <h3 className={`text-lg font-bold mb-2 transition-colors ${i === 0 ? "text-white group-hover:text-yellow-200" : "text-white group-hover:text-indigo-300"}`}>{item.titre}</h3>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-500">{item.team}</span>
                      <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${i === 0 ? "text-yellow-400 bg-yellow-500/10" : "text-indigo-400 bg-indigo-500/10"}`}>+{item.chapitres} chap.</span>
                    </div>
                  </div>
                </GlowCard>
              </RevealSection>
            ))}
          </div>

          {aiTexts.podiumDetail && (
            <RevealSection delay={200}>
              <div className="mt-8 p-6 rounded-2xl bg-gray-900/50 border border-gray-800/50">
                <p className="text-gray-400 leading-relaxed">{aiTexts.podiumDetail}</p>
              </div>
            </RevealSection>
          )}
        </div>
      </section>

      {/* ═══ CATALOGUE ═══ */}
      <section id="catalogue" className="relative bg-gray-900 py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <RevealSection>
            <div className="flex items-center gap-4 mb-10">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/10 flex items-center justify-center border border-indigo-500/20">
                <FiLayers className="text-xl text-indigo-400" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-indigo-500/80 mb-1">Catalogue</p>
                <h2 className="text-2xl sm:text-3xl font-bold text-white">Toutes les sorties</h2>
              </div>
            </div>
          </RevealSection>

          {CATEGORIES.map((cat, ci) => (
            <div key={cat.label} className="mb-10">
              <RevealSection delay={ci * 100}>
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-xl">{cat.icon}</span>
                  <h3 className="text-lg font-bold text-white">{cat.label}</h3>
                  <span className="text-sm text-indigo-400 bg-indigo-500/10 px-3 py-0.5 rounded-full font-semibold">{cat.count}</span>
                </div>
              </RevealSection>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {cat.oeuvres.map((o, i) => (
                  <RevealSection key={o.titre + i} delay={ci * 100 + i * 50}>
                    <GlowCard href={o.href} className="flex items-center gap-3 p-3 rounded-xl bg-gray-800/40 border border-gray-700/50 hover:border-indigo-500/30 transition-all">
                      {o.cover ? (
                        <div className="relative w-12 h-16 shrink-0 rounded-lg overflow-hidden">
                          <Image src={o.cover} alt={o.titre} fill className="object-cover" />
                        </div>
                      ) : (
                        <div className="w-12 h-16 shrink-0 rounded-lg bg-gray-700/50" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white truncate group-hover:text-indigo-300 transition-colors">{o.titre}</p>
                        <p className="text-[11px] text-gray-500">{o.team} · +{o.chapitres} chap.</p>
                        {o.genre && <p className="text-[10px] text-gray-600 mt-0.5">{o.genre}</p>}
                      </div>
                    </GlowCard>
                  </RevealSection>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ TEAMS ═══ */}
      <section id="teams" className="relative bg-gray-950 py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <RevealSection>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-green-500/20 to-emerald-500/10 flex items-center justify-center border border-green-500/20">
                <FiUsers className="text-xl text-green-400" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-green-500/80 mb-1">Traduction</p>
                <h2 className="text-2xl sm:text-3xl font-bold text-white">Teams actives</h2>
              </div>
            </div>
            {aiTexts.teamsEditorial && <p className="text-gray-500 max-w-2xl mb-10">{aiTexts.teamsEditorial}</p>}
          </RevealSection>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {TEAMS.map((team, i) => (
              <RevealSection key={team.nom} delay={i * 100}>
                <GlowCard href={team.href} glowColor="rgba(52,211,153,0.1)" className="flex items-center gap-4 p-5 rounded-xl bg-gray-800/40 border border-gray-700/50 hover:border-green-500/50 transition-all">
                  <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${team.color} flex items-center justify-center shrink-0 shadow-lg`}>
                    <span className="text-white font-bold text-xl">{team.initial}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold group-hover:text-green-300 transition-colors">{team.nom}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{team.oeuvresCount} séries</p>
                    <p className="text-sm font-bold text-green-400 mt-1">{team.chapitresCount} chap.</p>
                  </div>
                  <FiExternalLink className="text-gray-600 group-hover:text-green-400 transition-colors shrink-0" />
                </GlowCard>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ COUP DE COEUR ═══ */}
      {TOP3[0] && (
        <section id="coup-de-coeur" className="relative bg-gray-900 py-16 sm:py-24">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <RevealSection>
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-pink-500/20 to-rose-500/10 flex items-center justify-center border border-pink-500/20">
                  <FiBookmark className="text-xl text-pink-400" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-pink-500/80 mb-1">Sélection</p>
                  <h2 className="text-2xl sm:text-3xl font-bold text-white">Coup de coeur</h2>
                </div>
              </div>
            </RevealSection>

            <RevealSection delay={100} direction="scale">
              <GlowCard href={TOP3[0].href} glowColor="rgba(236,72,153,0.1)" className="block rounded-2xl overflow-hidden bg-gray-800/50 border border-pink-500/20 hover:border-pink-500/40 transition-all">
                <div className="flex flex-col sm:flex-row">
                  <div className="relative w-full sm:w-48 h-64 sm:h-auto shrink-0 overflow-hidden">
                    {TOP3[0].cover ? (
                      <Image src={TOP3[0].cover} alt={TOP3[0].titre} fill className="object-cover group-hover:scale-105 transition-transform duration-700" />
                    ) : (
                      <div className="w-full h-full min-h-[200px] bg-gradient-to-br from-pink-900/30 to-rose-900/20" />
                    )}
                  </div>
                  <div className="flex-1 p-6 sm:p-8">
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-pink-400 bg-pink-500/10 px-3 py-1 rounded-full mb-3">
                      <FiStar className="text-[10px]" /> {TOP3[0].type}
                    </span>
                    <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-pink-300 transition-colors">{TOP3[0].titre}</h3>
                    <p className="text-sm text-gray-400 mb-4">Traduit par <strong className="text-white">{TOP3[0].team}</strong> · {TOP3[0].chapitres} chapitres aujourd&apos;hui</p>
                    {aiTexts.coupDeCoeur1 && <p className="text-gray-400 leading-relaxed mb-3">{aiTexts.coupDeCoeur1}</p>}
                    {aiTexts.coupDeCoeur2 && <p className="text-gray-400 leading-relaxed">{aiTexts.coupDeCoeur2}</p>}
                  </div>
                </div>
              </GlowCard>
            </RevealSection>
          </div>
        </section>
      )}

      {/* ═══ CONCLUSION ═══ */}
      <section id="conclusion" className="relative bg-gray-950 py-16 sm:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <RevealSection>
            <div className="space-y-5 text-gray-300 leading-relaxed text-lg">
              {aiTexts.conclusion1 && <p>{aiTexts.conclusion1}</p>}
              {aiTexts.conclusion2 && <p>{aiTexts.conclusion2}</p>}
            </div>
          </RevealSection>

          <RevealSection delay={200} direction="scale">
            <div className="mt-12 p-8 rounded-2xl bg-gradient-to-br from-indigo-600/15 to-purple-600/10 border border-indigo-500/20">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                <div className="w-14 h-14 rounded-2xl bg-indigo-600/20 flex items-center justify-center shrink-0">
                  <FiBell className="text-2xl text-indigo-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white mb-1">Ne ratez aucun chapitre traduit en français</h3>
                  <p className="text-gray-400">Abonnez-vous à vos séries préférées pour être notifié à chaque nouveau chapitre.</p>
                </div>
                <Link href="/Inscription" className="shrink-0 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-all hover:shadow-lg hover:shadow-indigo-600/20 hover:-translate-y-0.5">
                  Créer un compte
                </Link>
              </div>
            </div>
          </RevealSection>

          <RevealSection delay={300}>
            <div className="mt-10 flex flex-wrap gap-4">
              <Link href="/Oeuvres" className="flex items-center gap-2 text-sm text-gray-500 hover:text-indigo-400 transition-colors"><FiBookOpen /> Parcourir le catalogue</Link>
              <Link href="/Teams" className="flex items-center gap-2 text-sm text-gray-500 hover:text-indigo-400 transition-colors"><FiUsers /> Toutes les teams</Link>
              <Link href="/actualites" className="flex items-center gap-2 text-sm text-gray-500 hover:text-indigo-400 transition-colors"><FiCalendar /> Archives</Link>
            </div>
          </RevealSection>
        </div>
      </section>

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
