import { describe, it, expect } from "vitest";
import {
  getWeekBounds,
  getCurrentWeekSlug,
  formatDateFR,
  formatMonthFR,
  getMonthSlug,
  parseMonthSlug,
} from "@/lib/api";

// ═══════════════════════════════════════════
// getWeekBounds
// ═══════════════════════════════════════════

describe("getWeekBounds", () => {
  it("retourne year et week correctement", () => {
    const result = getWeekBounds("2026-s11");
    expect(result.year).toBe(2026);
    expect(result.week).toBe(11);
  });

  it("retourne des objets Date pour monday et sunday", () => {
    const result = getWeekBounds("2026-s11");
    expect(result.monday).toBeInstanceOf(Date);
    expect(result.sunday).toBeInstanceOf(Date);
  });

  it("sunday est 6 jours après monday", () => {
    const result = getWeekBounds("2026-s11");
    const diff = (result.sunday - result.monday) / (1000 * 60 * 60 * 24);
    expect(diff).toBe(6);
  });

  it("monday est un lundi (day 1)", () => {
    const result = getWeekBounds("2026-s01");
    // getDay(): 0=dimanche, 1=lundi
    expect(result.monday.getDay()).toBe(1);
  });

  it("gère la semaine 1 de l'année", () => {
    const result = getWeekBounds("2026-s01");
    expect(result.week).toBe(1);
    expect(result.year).toBe(2026);
  });

  it("gère des semaines élevées", () => {
    const result = getWeekBounds("2025-s52");
    expect(result.week).toBe(52);
    expect(result.year).toBe(2025);
  });
});

// ═══════════════════════════════════════════
// getCurrentWeekSlug
// ═══════════════════════════════════════════

describe("getCurrentWeekSlug", () => {
  it("retourne une chaîne au format YYYY-sWW", () => {
    const slug = getCurrentWeekSlug();
    expect(slug).toMatch(/^\d{4}-s\d{2}$/);
  });

  it("commence par l'année courante", () => {
    const slug = getCurrentWeekSlug();
    const year = new Date().getFullYear();
    expect(slug.startsWith(`${year}-`)).toBe(true);
  });
});

// ═══════════════════════════════════════════
// formatDateFR
// ═══════════════════════════════════════════

describe("formatDateFR", () => {
  it("formate une date en français avec jour, mois, année", () => {
    const result = formatDateFR("2026-03-16");
    // On vérifie que ça contient les éléments principaux
    expect(result).toContain("2026");
    // Le mois doit être en français
    expect(result.toLowerCase()).toContain("mars");
  });

  it("inclut le jour de la semaine", () => {
    const result = formatDateFR("2026-03-16");
    // 16 mars 2026 est un lundi
    expect(result.toLowerCase()).toContain("lundi");
  });
});

// ═══════════════════════════════════════════
// formatMonthFR
// ═══════════════════════════════════════════

describe("formatMonthFR", () => {
  it("formate un mois en français", () => {
    const result = formatMonthFR(2026, 3);
    expect(result.toLowerCase()).toContain("mars");
    expect(result).toContain("2026");
  });

  it("gère janvier (mois 1)", () => {
    const result = formatMonthFR(2025, 1);
    expect(result.toLowerCase()).toContain("janvier");
  });

  it("gère décembre (mois 12)", () => {
    const result = formatMonthFR(2025, 12);
    expect(result.toLowerCase()).toContain("décembre");
  });
});

// ═══════════════════════════════════════════
// getMonthSlug
// ═══════════════════════════════════════════

describe("getMonthSlug", () => {
  it("retourne le slug au format YYYY-mois", () => {
    expect(getMonthSlug(2026, 3)).toBe("2026-mars");
    expect(getMonthSlug(2025, 1)).toBe("2025-janvier");
    expect(getMonthSlug(2025, 12)).toBe("2025-decembre");
  });

  it("gère tous les mois de l'année", () => {
    const expected = [
      "janvier", "fevrier", "mars", "avril", "mai", "juin",
      "juillet", "aout", "septembre", "octobre", "novembre", "decembre"
    ];
    for (let i = 0; i < 12; i++) {
      expect(getMonthSlug(2026, i + 1)).toBe(`2026-${expected[i]}`);
    }
  });
});

// ═══════════════════════════════════════════
// parseMonthSlug
// ═══════════════════════════════════════════

describe("parseMonthSlug", () => {
  it("parse un slug mois correctement", () => {
    const result = parseMonthSlug("2026-mars");
    expect(result.year).toBe(2026);
    expect(result.month).toBe(3);
  });

  it("parse janvier", () => {
    const result = parseMonthSlug("2025-janvier");
    expect(result.year).toBe(2025);
    expect(result.month).toBe(1);
  });

  it("parse décembre", () => {
    const result = parseMonthSlug("2025-decembre");
    expect(result.year).toBe(2025);
    expect(result.month).toBe(12);
  });

  it("retourne month = -1 pour un mois invalide", () => {
    const result = parseMonthSlug("2025-invalidmois");
    expect(result.month).toBe(-1);
  });

  it("est l'inverse de getMonthSlug", () => {
    for (let m = 1; m <= 12; m++) {
      const slug = getMonthSlug(2026, m);
      const parsed = parseMonthSlug(slug);
      expect(parsed.year).toBe(2026);
      expect(parsed.month).toBe(m);
    }
  });
});
