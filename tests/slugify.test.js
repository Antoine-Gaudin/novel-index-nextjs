import { describe, it, expect } from "vitest";
import { slugify } from "@/utils/slugify";

describe("slugify", () => {
  it("convertit un titre simple en slug", () => {
    expect(slugify("Solo Leveling")).toBe("solo-leveling");
  });

  it("gère les accents et caractères spéciaux", () => {
    expect(slugify("L'Épée du Roi")).toBe("l-epee-du-roi");
    expect(slugify("Café à la crème")).toBe("cafe-a-la-creme");
  });

  it("supprime les tirets en début et fin", () => {
    expect(slugify("--hello-world--")).toBe("hello-world");
  });

  it("remplace les espaces multiples et caractères spéciaux par un seul tiret", () => {
    expect(slugify("A   B   C")).toBe("a-b-c");
    expect(slugify("hello!@#$world")).toBe("hello-world");
  });

  it("retourne une chaîne vide pour null, undefined ou chaîne vide", () => {
    expect(slugify(null)).toBe("");
    expect(slugify(undefined)).toBe("");
    expect(slugify("")).toBe("");
  });

  it("gère les caractères japonais/chinois", () => {
    const result = slugify("Tower of God 신의 탑");
    expect(result).toBe("tower-of-god");
  });

  it("met tout en minuscule", () => {
    expect(slugify("HELLO WORLD")).toBe("hello-world");
  });

  it("gère les tirets existants", () => {
    expect(slugify("re-zero")).toBe("re-zero");
  });

  it("gère les chiffres", () => {
    expect(slugify("Level 99 Boss")).toBe("level-99-boss");
  });
});
