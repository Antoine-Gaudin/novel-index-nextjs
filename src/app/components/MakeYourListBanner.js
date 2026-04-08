"use client";

import { useState, useEffect } from "react";

/**
 * Bannière publicitaire Make Your List
 * Même interface que KanveoBanner pour être interchangeable via AdBanner.
 *
 * Props :
 *   format  : "banner" (728x90 / responsive) | "card" (300x250) | "mini" (320x50)
 *   className : classes supplémentaires sur le wrapper
 *   delay   : délai en ms avant l'apparition (défaut : 800)
 */
export default function MakeYourListBanner({ format = "banner", className = "", delay = 800 }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  const href = "https://workspace-todo.vercel.app";

  if (!visible) return null;

  const Check = ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
      <polyline points="9 11 12 14 22 4" />
      <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
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
                     bg-gradient-to-r from-violet-700 via-violet-500 to-purple-500
                     shadow-[0_20px_40px_rgba(0,0,0,0.2)]
                     hover:scale-[1.01] hover:shadow-lg hover:shadow-violet-500/20
                     transition-all duration-300 group"
        >
          <div className="flex items-center gap-2.5 flex-shrink-0">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-white/15 group-hover:bg-white/25 transition-colors">
              <Check size={20} />
            </div>
            <div>
              <span className="text-white font-bold text-lg tracking-tight block leading-none">Make Your List</span>
              <span className="text-violet-200 text-[9px] font-medium">SPONSORISÉ</span>
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="text-white font-semibold text-sm">L&apos;app tout-en-un pour organiser votre vie</div>
            <div className="text-white/60 text-xs mt-0.5 truncate">
              Listes · Kanban · Notes · Schémas · Collaboration · API
            </div>
          </div>

          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="text-right">
              <div className="text-white/50 text-[11px]">dès</div>
              <div className="text-white font-bold text-lg leading-tight">
                0€ <span className="text-white/60 text-[11px] font-normal">gratuit</span>
              </div>
            </div>
            <span className="bg-white text-violet-700 group-hover:bg-violet-50 font-semibold text-sm px-4 py-2 rounded-lg transition-colors">
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
                     bg-gradient-to-r from-violet-700 to-violet-500
                     active:scale-[0.98] transition-transform"
        >
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <div className="w-7 h-7 rounded-md flex items-center justify-center bg-white/15">
              <Check size={14} />
            </div>
            <div className="leading-none">
              <span className="text-white font-bold text-xs block">Make Your List</span>
              <span className="text-violet-200 text-[8px]">GRATUIT</span>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-white/80 text-[10px] leading-tight">Listes · Kanban · Notes</div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-white font-bold text-sm">0€</span>
            <span className="bg-white text-violet-700 font-semibold text-[10px] px-2.5 py-1 rounded-md">
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
                     bg-gradient-to-br from-violet-700 via-violet-500 to-purple-500
                     shadow-[0_20px_40px_rgba(0,0,0,0.2)]
                     hover:shadow-xl hover:shadow-violet-500/20
                     transition-all duration-300 group"
        >
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/15 group-hover:bg-white/25 transition-colors">
              <Check size={16} />
            </div>
            <span className="text-white font-bold text-lg">Make Your List</span>
          </div>

          <div className="text-center">
            <div className="text-white font-bold text-[15px] leading-tight">
              Tout pour organiser votre vie<br />en un seul endroit
            </div>
            <div className="flex flex-wrap justify-center gap-1 mt-2">
              {["Listes", "Kanban", "Notes", "Schémas"].map((t) => (
                <span key={t} className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-white/80">{t}</span>
              ))}
            </div>
          </div>

          <div className="flex flex-col items-center gap-2">
            <div className="flex items-baseline gap-2">
              <span className="text-white font-bold text-2xl">Gratuit</span>
              <span className="text-white/50 text-[11px]">dès 2,49€/mois</span>
            </div>
            <span className="bg-white text-violet-700 group-hover:bg-violet-50 font-semibold text-[13px] px-6 py-2 rounded-lg transition-colors">
              Commencer gratuitement →
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
          className="flex items-center w-full max-w-[320px] rounded-lg overflow-hidden px-2.5 py-2 gap-2 no-underline
                     bg-gradient-to-r from-violet-700 to-violet-500
                     shadow-[0_8px_24px_rgba(0,0,0,0.2)]
                     active:scale-[0.98] transition-transform"
        >
          <div className="w-[22px] h-[22px] rounded flex items-center justify-center bg-white/15 flex-shrink-0">
            <Check size={12} />
          </div>
          <span className="text-white font-bold text-xs flex-shrink-0">Make Your List</span>
          <span className="flex-1 text-white/70 text-[10px] whitespace-nowrap overflow-hidden text-ellipsis">
            Listes · Kanban · Notes · Schémas
          </span>
          <span className="bg-white text-violet-700 font-semibold text-[10px] px-2.5 py-[5px] rounded flex-shrink-0">
            Essayer →
          </span>
        </a>
      </div>
    );
  }

  return null;
}
