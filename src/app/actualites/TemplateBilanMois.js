"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  FiHome, FiChevronRight, FiChevronDown, FiBookOpen,
  FiExternalLink, FiStar, FiLayers, FiCoffee,
  FiBell, FiUsers, FiCalendar, FiTrendingUp, FiAward
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
    const obs = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) { setStarted(true); obs.disconnect(); } }, { threshold: 0.3 });
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
    const obs = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) { setIsVisible(true); obs.disconnect(); } }, { threshold: options.threshold || 0.15, rootMargin: options.rootMargin || "0px" });
    obs.observe(el);
    return () => obs.disconnect();
  }, [options.threshold, options.rootMargin]);
  return { ref, isVisible };
}

// ── COMPOSANTS ──

function RevealSection({ children, className = "", delay = 0, direction = "up" }) {
  const { ref, isVisible } = useScrollReveal();
  const transforms = { up: "translateY(40px)", left: "translateX(-40px)", right: "translateX(40px)", scale: "scale(0.95)" };
  return (
    <div ref={ref} className={className} style={{
      opacity: isVisible ? 1 : 0, transform: isVisible ? "none" : transforms[direction],
      transition: `opacity 0.8s cubic-bezier(0.16,1,0.3,1) ${delay}ms, transform 0.8s cubic-bezier(0.16,1,0.3,1) ${delay}ms`,
    }}>{children}</div>
  );
}

function CounterStat({ value, label }) {
  const { ref, count } = useCountUp(value);
  return (<div ref={ref}><p className="text-5xl sm:text-6xl font-black text-white tabular-nums">{count}</p><p className="text-sm text-gray-500 uppercase tracking-wider mt-1">{label}</p></div>);
}

function GlowCard({ children, className = "", glowColor = "rgba(245,158,11,0.15)", href }) {
  const cardRef = useRef(null);
  const [glow, setGlow] = useState({ x: 50, y: 50 });
  const handleMouse = useCallback((e) => {
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return;
    setGlow({ x: ((e.clientX - rect.left) / rect.width) * 100, y: ((e.clientY - rect.top) / rect.height) * 100 });
  }, []);
  const Tag = href ? Link : "div";
  const extraProps = href ? { href } : {};
  return (<Tag ref={cardRef} onMouseMove={handleMouse} className={`relative group ${className}`} style={{ background: `radial-gradient(600px circle at ${glow.x}% ${glow.y}%, ${glowColor}, transparent 70%)` }} {...extraProps}>{children}</Tag>);
}

function WeekBar({ label, chapitres, maxChapitres, delay }) {
  const { ref, isVisible } = useScrollReveal();
  const heightPercent = (chapitres / maxChapitres) * 100;
  const isBest = chapitres === maxChapitres;
  return (
    <div ref={ref} className="flex flex-col items-center gap-2 flex-1">
      <span className={`text-sm font-bold transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"} ${isBest ? "text-amber-400" : "text-gray-400"}`} style={{ transitionDelay: `${delay + 800}ms` }}>{chapitres}</span>
      <div className="w-full h-48 sm:h-56 bg-gray-800/30 rounded-xl overflow-hidden flex flex-col justify-end relative">
        {isBest && (
          <div className={`absolute -top-1 left-1/2 -translate-x-1/2 z-10 transition-all duration-500 ${isVisible ? "opacity-100 scale-100" : "opacity-0 scale-50"}`} style={{ transitionDelay: `${delay + 1200}ms` }}>
            <span className="inline-flex items-center gap-1 bg-amber-500 text-black text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full whitespace-nowrap"><FiStar className="text-[8px]" /> Top</span>
          </div>
        )}
        <div className={`w-full rounded-xl transition-all duration-1000 ease-out ${isBest ? "bg-gradient-to-t from-amber-600 to-orange-400 shadow-lg shadow-amber-500/20" : "bg-gradient-to-t from-gray-700 to-gray-600"}`}
          style={{ height: isVisible ? `${heightPercent}%` : "0%", transitionDelay: `${delay}ms` }} />
      </div>
      <p className={`text-xs font-semibold ${isBest ? "text-amber-400" : "text-gray-400"}`}>{label}</p>
    </div>
  );
}

const SECTIONS_MOIS = [
  { id: "hero", label: "Accueil" },
  { id: "intro", label: "Introduction" },
  { id: "evolution", label: "Évolution" },
  { id: "top5", label: "Top 5" },
  { id: "categories", label: "Catégories" },
  { id: "teams", label: "Teams" },
  { id: "communaute", label: "Communauté" },
  { id: "articles", label: "Articles" },
  { id: "conclusion", label: "Conclusion" },
];

// ── TEMPLATE BILAN DU MOIS ──

export default function TemplateBilanMois({ preloadedData }) {
  const { article: ARTICLE, weeklyStats: WEEKS, top5: TOP5, categories: CATS, teams: TEAMS, articles: ARTICLES, communaute, aiTexts } = preloadedData;
  const maxWeek = Math.max(...(WEEKS || []).map((w) => w.chapitres), 1);

  const [activeSection, setActiveSection] = useState("hero");

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY + window.innerHeight / 3;
      for (let i = SECTIONS_MOIS.length - 1; i >= 0; i--) {
        const el = document.getElementById(SECTIONS_MOIS[i].id);
        if (el && el.offsetTop <= scrollY) { setActiveSection(SECTIONS_MOIS[i].id); break; }
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="relative bg-gray-950 text-white min-h-screen overflow-hidden">

      {/* SOMMAIRE FLOTTANT */}
      <nav className="fixed right-6 top-1/2 -translate-y-1/2 z-50 hidden xl:flex flex-col items-end gap-1">
        {SECTIONS_MOIS.map((s) => (
          <a key={s.id} href={`#${s.id}`} className="group flex items-center gap-3 py-1.5"
            onClick={(e) => { e.preventDefault(); document.getElementById(s.id)?.scrollIntoView({ behavior: "smooth" }); }}>
            <span className={`text-[11px] font-medium transition-all duration-300 ${activeSection === s.id ? "text-amber-400 opacity-100 translate-x-0" : "text-gray-600 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0"}`}>{s.label}</span>
            <span className={`block rounded-full transition-all duration-300 ${activeSection === s.id ? "w-8 h-2 bg-amber-500" : "w-2 h-2 bg-gray-700 group-hover:bg-gray-500"}`} />
          </a>
        ))}
      </nav>

      {/* ═══ HERO ═══ */}
      <section id="hero" className="relative min-h-[90vh] flex flex-col justify-end overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-950 via-gray-950 to-orange-950" />
          <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-amber-600/10 rounded-full blur-[120px]" style={{ animation: "pulse 6s ease-in-out infinite" }} />
          <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-orange-600/8 rounded-full blur-[100px]" style={{ animation: "pulse 8s ease-in-out infinite 2s" }} />
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
            <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-amber-300 bg-amber-500/15 backdrop-blur-sm px-4 py-1.5 rounded-full border border-amber-500/20">
              <FiCalendar className="text-sm" /> Bilan mensuel
            </span>
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white mb-4 leading-[0.95] tracking-tight" style={{ animation: "fadeSlideUp 0.8s ease-out 0.15s both" }}>
            <span className="block">Bilan</span>
            <span className="block bg-gradient-to-r from-amber-400 via-orange-400 to-red-400 bg-clip-text text-transparent" style={{ backgroundSize: "200% auto", animation: "gradientShift 6s linear infinite" }}>{ARTICLE.moisLabel}</span>
          </h1>
          <p className="text-xl sm:text-2xl text-gray-400 font-light max-w-2xl mb-12" style={{ animation: "fadeSlideUp 0.8s ease-out 0.3s both" }}>{ARTICLE.sousTitre}</p>
          <div className="flex flex-wrap gap-8 sm:gap-12" style={{ animation: "fadeSlideUp 0.8s ease-out 0.45s both" }}>
            <CounterStat value={ARTICLE.stats.chapitres} label="chapitres" />
            <div className="w-px bg-gray-800 self-stretch" />
            <CounterStat value={ARTICLE.stats.series} label="séries" />
            <div className="w-px bg-gray-800 self-stretch" />
            <CounterStat value={ARTICLE.stats.teams} label="teams" />
          </div>
        </div>
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10" style={{ animation: "bounce 2s ease-in-out infinite" }}><FiChevronDown className="text-2xl text-gray-600" /></div>
        <div className="absolute bottom-0 left-0 right-0 z-10">
          <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto" preserveAspectRatio="none"><path d="M0 60L1440 60L1440 30C1200 0 960 50 720 30C480 10 240 50 0 20L0 60Z" fill="#111827" /></svg>
        </div>
      </section>

      {/* ═══ INTRO ═══ */}
      <section id="intro" className="relative bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <RevealSection>
            <p className="text-lg sm:text-xl text-gray-300 leading-relaxed font-light">
              Le mois de <strong className="text-white font-semibold">{ARTICLE.moisLabel}</strong> touche à sa fin. Au total, <strong className="text-white font-semibold">{ARTICLE.stats.chapitres} chapitres</strong> traduits sur <strong className="text-white font-semibold">{ARTICLE.stats.series} séries</strong> par <strong className="text-white font-semibold">{ARTICLE.stats.teams} teams</strong>.
            </p>
          </RevealSection>
          <RevealSection delay={150} direction="left">
            <blockquote className="relative my-12 py-8 pl-8 border-l-2 border-amber-500">
              <div className="absolute -left-3 top-0 w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center"><span className="text-white text-xs font-bold">&ldquo;</span></div>
              <p className="text-2xl sm:text-3xl font-bold text-white leading-snug">{ARTICLE.stats.chapitres} chapitres en un mois — le travail des {ARTICLE.stats.teams} teams résumé en chiffres.</p>
              <div className="absolute -left-3 bottom-0 w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center"><span className="text-white text-xs font-bold">&rdquo;</span></div>
            </blockquote>
          </RevealSection>
          {aiTexts.intro && <RevealSection delay={200}><p className="text-lg text-gray-400 leading-relaxed">{aiTexts.intro}</p></RevealSection>}
        </div>
        <div className="h-px bg-gradient-to-r from-transparent via-amber-500/40 to-transparent" />
      </section>

      {/* ═══ ÉVOLUTION SEMAINE PAR SEMAINE ═══ */}
      {WEEKS && WEEKS.length > 0 && (
        <section id="evolution" className="relative bg-gray-950 py-16 sm:py-24">
          <div className="absolute top-0 left-0 w-96 h-96 bg-amber-500/5 rounded-full blur-[120px]" />
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <RevealSection>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/10 flex items-center justify-center border border-amber-500/20"><FiTrendingUp className="text-xl text-amber-400" /></div>
                <div><p className="text-xs font-bold uppercase tracking-widest text-amber-500/80 mb-1">Progression</p><h2 className="text-2xl sm:text-3xl font-bold text-white">Semaine par semaine</h2></div>
              </div>
              <p className="text-gray-500 max-w-2xl mb-12">L&apos;évolution des publications tout au long du mois.</p>
            </RevealSection>
            <div className="flex items-end gap-4 sm:gap-8">
              {WEEKS.map((week, i) => (<WeekBar key={week.label} label={week.label} chapitres={week.chapitres} maxChapitres={maxWeek} delay={i * 150} />))}
            </div>
          </div>
        </section>
      )}

      {/* ═══ TOP 5 ═══ */}
      <section id="top5" className="relative bg-gray-950 py-16 sm:py-24">
        <div className="absolute top-0 right-0 w-96 h-96 bg-yellow-500/5 rounded-full blur-[120px]" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <RevealSection>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-yellow-500/20 to-orange-500/10 flex items-center justify-center border border-yellow-500/20"><FiAward className="text-xl text-yellow-400" /></div>
              <div><p className="text-xs font-bold uppercase tracking-widest text-yellow-500/80 mb-1">Classement</p><h2 className="text-2xl sm:text-3xl font-bold text-white">Top 5 du mois</h2></div>
            </div>
            <p className="text-gray-500 max-w-2xl mb-10">Les séries qui ont cumulé le plus de chapitres en {ARTICLE.moisLabel}.</p>
          </RevealSection>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {TOP5[0] && (
              <RevealSection delay={100} direction="scale" className="lg:row-span-2">
                <GlowCard href={TOP5[0].href} glowColor="rgba(234,179,8,0.12)" className="block rounded-2xl overflow-hidden bg-gray-900 border border-yellow-500/20 hover:border-yellow-500/40 transition-all h-full relative min-h-[280px]">
                  {TOP5[0].cover ? (<Image src={TOP5[0].cover} alt={TOP5[0].titre} fill className="object-cover opacity-40 group-hover:opacity-50 group-hover:scale-105 transition-all duration-700" />) : (<div className="absolute inset-0 bg-gradient-to-br from-amber-900/40 to-orange-900/40" />)}
                  <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/60 to-transparent" />
                  <div className="absolute top-4 left-4 z-10"><span className="inline-flex items-center gap-1.5 bg-yellow-500 text-black text-xs font-black uppercase tracking-wider px-3 py-1.5 rounded-full shadow-lg shadow-yellow-500/20">#1 du mois</span></div>
                  <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8 z-10">
                    <p className="text-xs text-yellow-400/80 font-semibold uppercase tracking-wider mb-2">{TOP5[0].type}</p>
                    <h3 className="text-2xl sm:text-3xl font-bold text-white mb-2 group-hover:text-yellow-200 transition-colors">{TOP5[0].titre}</h3>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-400">{TOP5[0].team}</span>
                      <span className="text-sm font-bold text-yellow-400 bg-yellow-500/10 px-3 py-1 rounded-full backdrop-blur-sm">+{TOP5[0].chapitres} chapitres</span>
                    </div>
                  </div>
                </GlowCard>
              </RevealSection>
            )}
            {TOP5.slice(1).map((item, i) => (
              <RevealSection key={item.rang} delay={200 + i * 100} direction="right">
                <GlowCard href={item.href} glowColor="rgba(156,163,175,0.08)" className="block rounded-2xl overflow-hidden bg-gray-900 border border-gray-700/50 hover:border-gray-500/50 transition-all">
                  <div className="flex items-stretch">
                    <div className="relative w-24 sm:w-28 shrink-0 overflow-hidden">
                      {item.cover ? (<Image src={item.cover} alt={item.titre} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />) : (<div className="w-full h-full bg-gray-800 min-h-[88px]" />)}
                      <div className="absolute top-2 left-2"><span className={`inline-flex items-center justify-center w-7 h-7 text-[10px] font-black rounded-full shadow-lg ${item.rang === 2 ? "bg-gray-400 text-black" : item.rang === 3 ? "bg-amber-600 text-white" : "bg-gray-600 text-white"}`}>#{item.rang}</span></div>
                    </div>
                    <div className="flex-1 p-4 sm:p-5 flex flex-col justify-center">
                      <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider mb-1">{item.type}</p>
                      <h3 className="text-base sm:text-lg font-bold text-white mb-1 group-hover:text-amber-300 transition-colors">{item.titre}</h3>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-gray-500">{item.team}</span>
                        <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full">+{item.chapitres}</span>
                      </div>
                    </div>
                  </div>
                </GlowCard>
              </RevealSection>
            ))}
          </div>
          {aiTexts.analyse && (<RevealSection delay={200}><div className="mt-8 p-6 rounded-2xl bg-gray-900/50 border border-gray-800/50"><p className="text-gray-400 leading-relaxed">{aiTexts.analyse}</p></div></RevealSection>)}
        </div>
      </section>

      {/* ═══ CATÉGORIES ═══ */}
      {CATS && CATS.length > 0 && (
        <section id="categories" className="relative bg-gradient-to-r from-amber-950/50 via-gray-900 to-orange-950/50 border-y border-gray-800/50">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
            <RevealSection>
              <div className="flex items-center gap-4 mb-10">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500/20 to-red-500/10 flex items-center justify-center border border-orange-500/20"><FiLayers className="text-xl text-orange-400" /></div>
                <div><p className="text-xs font-bold uppercase tracking-widest text-orange-500/80 mb-1">Répartition</p><h2 className="text-2xl sm:text-3xl font-bold text-white">Par catégorie</h2></div>
              </div>
            </RevealSection>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {CATS.map((cat, i) => {
                const totalCh = ARTICLE.stats.chapitres;
                const percent = totalCh > 0 ? Math.round((cat.chapitres / totalCh) * 100) : 0;
                return (
                  <RevealSection key={cat.label} delay={i * 120}>
                    <div className="p-5 rounded-xl bg-gray-800/40 border border-gray-700/50">
                      <p className="text-sm text-gray-400 font-medium mb-3">{cat.label}</p>
                      <p className="text-3xl font-black text-white mb-1">{cat.count}</p>
                      <p className="text-xs text-gray-500 mb-3">{cat.chapitres} chapitres</p>
                      <div className="w-full h-2 bg-gray-700/50 rounded-full overflow-hidden"><div className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-1000" style={{ width: `${percent}%` }} /></div>
                      <p className="text-[10px] text-gray-600 mt-1">{percent}% du total</p>
                    </div>
                  </RevealSection>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ═══ TEAMS ═══ */}
      <section id="teams" className="relative bg-gray-900 py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <RevealSection>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500/20 to-red-500/10 flex items-center justify-center border border-orange-500/20"><FiUsers className="text-xl text-orange-400" /></div>
              <div><p className="text-xs font-bold uppercase tracking-widest text-orange-500/80 mb-1">Traduction</p><h2 className="text-2xl sm:text-3xl font-bold text-white">Teams du mois</h2></div>
            </div>
          </RevealSection>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {TEAMS.map((team, i) => (
              <RevealSection key={team.nom} delay={i * 100}>
                <GlowCard href={team.href} glowColor="rgba(245,158,11,0.1)" className="flex items-center gap-4 p-5 rounded-xl bg-gray-800/40 border border-gray-700/50 hover:border-amber-500/50 transition-all">
                  <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${team.color} flex items-center justify-center shrink-0 shadow-lg`}><span className="text-white font-bold text-xl">{team.initial}</span></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold group-hover:text-amber-300 transition-colors">{team.nom}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{team.oeuvresCount} séries</p>
                    <p className="text-sm font-bold text-amber-400 mt-1">{team.chapitresCount} chap.</p>
                  </div>
                  <FiExternalLink className="text-gray-600 group-hover:text-amber-400 transition-colors shrink-0" />
                </GlowCard>
              </RevealSection>
            ))}
          </div>
          {aiTexts.teams && (<RevealSection delay={300}><div className="mt-8 p-6 rounded-2xl bg-gray-800/30 border border-gray-700/30"><p className="text-gray-400 leading-relaxed">{aiTexts.teams}</p></div></RevealSection>)}
        </div>
      </section>

      {/* ═══ COMMUNAUTÉ ═══ */}
      {communaute && (
        <section id="communaute" className="relative bg-gray-950 py-16 sm:py-24">
          <div className="absolute top-0 left-1/3 w-80 h-80 bg-pink-500/5 rounded-full blur-[100px]" />
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <RevealSection>
              <div className="flex items-center gap-4 mb-10">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-pink-500/20 to-rose-500/10 flex items-center justify-center border border-pink-500/20"><FiUsers className="text-xl text-pink-400" /></div>
                <div><p className="text-xs font-bold uppercase tracking-widest text-pink-500/80 mb-1">Communauté</p><h2 className="text-2xl sm:text-3xl font-bold text-white">Novel-Index grandit</h2></div>
              </div>
            </RevealSection>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <RevealSection delay={100} direction="left"><div className="p-8 rounded-2xl bg-gradient-to-br from-pink-900/20 to-rose-900/10 border border-pink-500/20 text-center"><CounterStat value={communaute.nouveauxInscrits} label="nouveaux inscrits ce mois" /></div></RevealSection>
              <RevealSection delay={200} direction="right"><div className="p-8 rounded-2xl bg-gradient-to-br from-amber-900/20 to-orange-900/10 border border-amber-500/20 text-center"><CounterStat value={communaute.totalMembres} label="membres au total" /></div></RevealSection>
            </div>
            <RevealSection delay={300}><p className="text-gray-500 text-center mt-8 text-sm">Merci à chacun d&apos;entre vous. Chaque inscription compte et fait grandir la communauté francophone.</p></RevealSection>
          </div>
        </section>
      )}

      {/* ═══ ARTICLES ═══ */}
      {ARTICLES && ARTICLES.length > 0 && (
        <section id="articles" className="relative bg-gray-900 py-16 sm:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <RevealSection>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-500/10 flex items-center justify-center border border-cyan-500/20"><FiBookOpen className="text-xl text-cyan-400" /></div>
                <div><p className="text-xs font-bold uppercase tracking-widest text-cyan-500/80 mb-1">À lire</p><h2 className="text-2xl sm:text-3xl font-bold text-white">Articles du mois</h2></div>
              </div>
            </RevealSection>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {ARTICLES.map((art, i) => (
                <RevealSection key={art.titre} delay={i * 100}>
                  {art.externe ? (
                    <a href={art.href} target="_blank" rel="noopener noreferrer" className="group flex flex-col rounded-xl overflow-hidden bg-gray-800/40 border border-gray-700/50 hover:border-cyan-500/40 transition-all h-full">
                      {art.cover ? (<div className="relative w-full h-32 overflow-hidden"><img src={art.cover} alt={art.titre} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" /></div>) : (<div className="w-full h-20 bg-gradient-to-br from-gray-800 to-gray-700/50 flex items-center justify-center"><FiExternalLink className="text-xl text-gray-600" /></div>)}
                      <div className="flex-1 p-4 flex flex-col">
                        <div className="flex items-center gap-2 mb-2"><span className="text-[10px] font-semibold uppercase tracking-wider text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-full">Externe</span><span className="text-[10px] text-gray-600">{art.source}</span></div>
                        <h3 className="text-sm font-semibold text-white group-hover:text-cyan-300 transition-colors line-clamp-2 flex-1">{art.titre}</h3>
                        <div className="flex items-center justify-between mt-3"><span className="text-[11px] text-gray-500">{art.date}</span><FiExternalLink className="text-xs text-gray-600 group-hover:text-cyan-400 transition-colors" /></div>
                      </div>
                    </a>
                  ) : (
                    <Link href={art.href} className="group flex flex-col rounded-xl overflow-hidden bg-gray-800/40 border border-gray-700/50 hover:border-amber-500/40 transition-all h-full">
                      {art.cover ? (<div className="relative w-full h-32 overflow-hidden"><Image src={art.cover} alt={art.titre} fill className="object-cover group-hover:scale-105 transition-transform duration-500" /></div>) : (<div className="w-full h-20 bg-gradient-to-br from-amber-900/20 to-orange-900/10 flex items-center justify-center"><FiBookOpen className="text-xl text-amber-600/50" /></div>)}
                      <div className="flex-1 p-4 flex flex-col">
                        <div className="flex items-center gap-2 mb-2"><span className="text-[10px] font-semibold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">Novel-Index</span></div>
                        <h3 className="text-sm font-semibold text-white group-hover:text-amber-300 transition-colors line-clamp-2 flex-1">{art.titre}</h3>
                        <span className="text-[11px] text-gray-500 mt-3">{art.date}</span>
                      </div>
                    </Link>
                  )}
                </RevealSection>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ═══ CONCLUSION ═══ */}
      <section id="conclusion" className="relative bg-gray-950 py-16 sm:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {aiTexts.conclusion && (<RevealSection><div className="space-y-5 text-gray-300 leading-relaxed text-lg"><p>{aiTexts.conclusion}</p></div></RevealSection>)}
          <RevealSection delay={200} direction="scale">
            <div className="mt-12 p-8 rounded-2xl bg-gradient-to-br from-amber-600/15 to-orange-600/10 border border-amber-500/20">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                <div className="w-14 h-14 rounded-2xl bg-amber-600/20 flex items-center justify-center shrink-0"><FiBell className="text-2xl text-amber-400" /></div>
                <div className="flex-1"><h3 className="text-xl font-bold text-white mb-1">Ne ratez aucun chapitre traduit en français</h3><p className="text-gray-400">Abonnez-vous à vos séries préférées pour être notifié à chaque nouveau chapitre.</p></div>
                <Link href="/Inscription" className="shrink-0 px-6 py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-medium transition-all hover:shadow-lg hover:shadow-amber-600/20 hover:-translate-y-0.5">Créer un compte</Link>
              </div>
            </div>
          </RevealSection>
          <RevealSection delay={300}>
            <div className="mt-10 flex flex-wrap gap-4">
              <Link href="/Oeuvres" className="flex items-center gap-2 text-sm text-gray-500 hover:text-amber-400 transition-colors"><FiBookOpen /> Parcourir le catalogue</Link>
              <Link href="/Teams" className="flex items-center gap-2 text-sm text-gray-500 hover:text-amber-400 transition-colors"><FiUsers /> Toutes les teams</Link>
              <Link href="/actualites" className="flex items-center gap-2 text-sm text-gray-500 hover:text-amber-400 transition-colors"><FiCalendar /> Archives</Link>
            </div>
          </RevealSection>
        </div>
      </section>

      <style jsx global>{`
        @keyframes fadeSlideUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes gradientShift { 0%, 100% { background-position: 0% center; } 50% { background-position: 200% center; } }
        @keyframes bounce { 0%, 100% { transform: translateX(-50%) translateY(0); } 50% { transform: translateX(-50%) translateY(8px); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
      `}</style>
    </div>
  );
}
