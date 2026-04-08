"use client";

import { useState, useEffect } from "react";
import KanveoBanner from "./KanveoBanner";
import MakeYourListBanner from "./MakeYourListBanner";

/**
 * Wrapper 50/50 — affiche aléatoirement KanveoBanner ou MakeYourListBanner.
 * Le tirage est effectué côté client uniquement (useEffect) pour éviter
 * le mismatch d'hydratation Next.js.
 *
 * Props identiques à KanveoBanner / MakeYourListBanner :
 *   format    : "banner" | "card" | "mini"
 *   className : classes supplémentaires
 *   delay     : délai en ms avant l'apparition
 */
export default function AdBanner({ format = "banner", className = "", delay = 800 }) {
  const [showKanveo, setShowKanveo] = useState(null);

  useEffect(() => {
    setShowKanveo(Math.random() < 0.5);
  }, []);

  // null = côté serveur ou avant hydratation → on n'affiche rien
  if (showKanveo === null) return null;

  return showKanveo
    ? <KanveoBanner format={format} className={className} delay={delay} />
    : <MakeYourListBanner format={format} className={className} delay={delay} />;
}
