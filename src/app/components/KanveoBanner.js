"use client";

import { useState, useEffect } from "react";

/**
 * Bannière publicitaire Kanveo — Lien affilié interne
 * S'intègre au design dark de Novel-Index
 * Apparaît avec un léger délai pour ne pas gêner le chargement du contenu principal.
 *
 * Props :
 *   format : "banner" (728x90 / responsive) | "card" (300x250) | "mini" (320x50)
 *   className : classes supplémentaires sur le wrapper
 *   delay : délai en ms avant l'apparition (défaut : 800)
 */
export default function KanveoBanner({ format = "banner", className = "", delay = 800 }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  const href = "https://kanveo.fr/ref/3HAW4BNP";

  if (!visible) {
    return null;
  }

  const Star = ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
      <path d="M12 2L14.09 8.26L21 9.27L16 14.14L17.18 21.02L12 17.77L6.82 21.02L8 14.14L3 9.27L9.91 8.26L12 2Z" />
    </svg>
  );

  // ─── FORMAT BANNER — Large horizontal (desktop) + compact (mobile) ───
  if (format === "banner") {
    return (
      <div className={`flex justify-center animate-[fadeIn_0.5s_ease-in-out] ${className}`}>
        {/* Desktop */}
        <a
          href={href}
          target="_blank"
          rel="noopener sponsored"
          className="hidden md:flex items-center w-full max-w-[728px] rounded-xl overflow-hidden px-6 py-3 gap-5 no-underline
                     bg-gradient-to-r from-indigo-600/20 via-purple-600/20 to-indigo-600/20
                     border border-indigo-500/20 hover:border-indigo-500/50
                     backdrop-blur-sm
                     hover:scale-[1.01] hover:shadow-lg hover:shadow-indigo-500/10
                     transition-all duration-300 group"
        >
          {/* Logo */}
          <div className="flex items-center gap-2.5 flex-shrink-0">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-indigo-600/30 group-hover:bg-indigo-600/50 transition-colors">
              <Star size={20} />
            </div>
            <div>
              <span className="text-white font-bold text-lg tracking-tight block leading-none">Kanveo</span>
              <span className="text-indigo-400 text-[9px] font-medium">SPONSORISÉ</span>
            </div>
          </div>

          {/* Texte */}
          <div className="flex-1 min-w-0">
            <div className="text-white font-semibold text-sm">Le CRM de prospection pour indépendants &amp; TPE</div>
            <div className="text-gray-400 text-xs mt-0.5 truncate">
              Import SIRENE · Pipeline Kanban · Tâches · Clients &amp; Finances
            </div>
          </div>

          {/* Prix + CTA */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="text-right">
              <div className="text-gray-500 text-[11px] line-through">19€/mois</div>
              <div className="text-white font-bold text-lg leading-tight">
                15€ <span className="text-gray-400 text-[11px] font-normal">HT/mois</span>
              </div>
            </div>
            <span className="bg-indigo-600 group-hover:bg-indigo-500 text-white font-semibold text-sm px-4 py-2 rounded-lg transition-colors">
              Essayer →
            </span>
          </div>
        </a>

        {/* Mobile */}
        <a
          href={href}
          target="_blank"
          rel="noopener sponsored"
          className="flex md:hidden items-center w-full max-w-[400px] rounded-lg overflow-hidden px-3 py-2.5 gap-2.5 no-underline
                     bg-gradient-to-r from-indigo-600/15 via-purple-600/15 to-indigo-600/15
                     border border-indigo-500/20
                     backdrop-blur-sm
                     active:scale-[0.98] transition-transform"
        >
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <div className="w-7 h-7 rounded-md flex items-center justify-center bg-indigo-600/30">
              <Star size={14} />
            </div>
            <div className="leading-none">
              <span className="text-white font-bold text-xs block">Kanveo</span>
              <span className="text-indigo-400 text-[8px]">SPONSORISÉ</span>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-gray-200 text-[10px] leading-tight">CRM prospection</div>
            <div className="text-gray-400 text-[9px]">indépendants &amp; TPE</div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-white font-bold text-sm">
              15€<span className="text-gray-500 text-[9px] font-normal">/mois</span>
            </span>
            <span className="bg-indigo-600 text-white font-semibold text-[10px] px-2.5 py-1 rounded-md">
              Essayer
            </span>
          </div>
        </a>
      </div>
    );
  }

  // ─── FORMAT CARD — 300×250 (fiche oeuvre, sidebar) ───
  if (format === "card") {
    return (
      <div className={`flex justify-center animate-[fadeIn_0.5s_ease-in-out] ${className}`}>
        <a
          href={href}
          target="_blank"
          rel="noopener sponsored"
          className="flex flex-col items-center justify-between w-[300px] h-[250px] rounded-xl overflow-hidden p-5 no-underline
                     bg-gradient-to-br from-gray-800/80 via-indigo-900/30 to-purple-900/30
                     border border-indigo-500/20 hover:border-indigo-500/40
                     backdrop-blur-sm
                     hover:shadow-xl hover:shadow-indigo-500/10
                     transition-all duration-300 group"
        >
          {/* Header */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-indigo-600/30 group-hover:bg-indigo-600/50 transition-colors">
              <Star size={16} />
            </div>
            <span className="text-white font-bold text-lg">Kanveo</span>
            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-yellow-500/20 text-yellow-300 border border-yellow-500/30">
              BETA
            </span>
          </div>

          {/* Contenu */}
          <div className="text-center">
            <div className="text-white font-bold text-[15px] leading-tight">
              Le CRM de prospection<br />pour indépendants &amp; TPE
            </div>
            <div className="flex flex-wrap justify-center gap-1 mt-2">
              {["SIRENE", "Kanban", "Tâches", "Finances"].map((t) => (
                <span
                  key={t}
                  className="text-[10px] px-2 py-0.5 rounded-full bg-gray-700/60 text-gray-300"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>

          {/* Prix + CTA */}
          <div className="flex flex-col items-center gap-2">
            <div className="flex items-baseline gap-2">
              <span className="text-gray-500 text-[13px] line-through">19€</span>
              <span className="text-white font-bold text-2xl">15€</span>
              <span className="text-gray-400 text-[11px]">HT/mois</span>
            </div>
            <span className="bg-indigo-600 group-hover:bg-indigo-500 text-white font-semibold text-[13px] px-6 py-2 rounded-lg transition-colors">
              Commencer maintenant →
            </span>
          </div>
        </a>
      </div>
    );
  }

  // ─── FORMAT MINI — Compact (mobile only, ou insertion fine) ───
  if (format === "mini") {
    return (
      <div className={`flex justify-center animate-[fadeIn_0.5s_ease-in-out] ${className}`}>
        <a
          href={href}
          target="_blank"
          rel="noopener sponsored"
          className="flex items-center w-full max-w-[320px] rounded-lg overflow-hidden px-3 py-2 gap-2.5 no-underline
                     bg-gradient-to-r from-indigo-600/15 to-purple-600/15
                     border border-indigo-500/20
                     active:scale-[0.98] transition-transform"
        >
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <div className="w-6 h-6 rounded flex items-center justify-center bg-indigo-600/30">
              <Star size={12} />
            </div>
            <span className="text-white font-bold text-xs">Kanveo</span>
          </div>
          <div className="flex-1 text-[10px] leading-tight text-gray-300">
            CRM prospection<br />indépendants &amp; TPE
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-white font-bold text-[13px]">
              15€<span className="text-gray-500 text-[9px]">/mois</span>
            </span>
            <span className="bg-indigo-600 text-white font-semibold text-[10px] px-2.5 py-1 rounded-md">
              Essayer
            </span>
          </div>
        </a>
      </div>
    );
  }

  return null;
}
