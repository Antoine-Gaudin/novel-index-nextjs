import { slugify } from "./slugify";

/**
 * Slugifie un nom d'auteur.
 * Si le résultat de slugify() est vide (ex : noms 100% non-latin comme "朱月十話"),
 * on retourne l'encodage URL du nom trimé en minuscules afin d'avoir une URL stable
 * et restaurable en base.
 *
 * @param {string} name
 * @returns {string} slug ou nom encodé URL ; "" si name vide
 */
export function auteurSlug(name) {
  if (!name) return "";
  const trimmed = name.trim();
  if (!trimmed) return "";
  const s = slugify(trimmed);
  if (s) return s;
  return encodeURIComponent(trimmed.toLowerCase());
}
