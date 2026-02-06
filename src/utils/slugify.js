/**
 * Fonction de slugification unifiée pour tout le projet
 * Convertit un texte en slug URL-friendly
 * 
 * Exemple : "L'Épée du Roi" → "l-epee-du-roi"
 * 
 * @param {string} str - Le texte à slugifier
 * @returns {string} Le slug généré
 */
export function slugify(str) {
  if (!str) return "";
  
  return str
    .toLowerCase()
    .normalize("NFD") // Décompose les caractères accentués
    .replace(/[\u0300-\u036f]/g, "") // Supprime les accents
    .replace(/[^a-z0-9]+/g, "-") // Remplace tous les non-alphanumériques par des tirets
    .replace(/^-+|-+$/g, ""); // Supprime les tirets en début et fin
}
