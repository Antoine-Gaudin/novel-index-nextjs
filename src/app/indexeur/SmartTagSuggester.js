// Helpers pour suggérer des tags/genres pertinents pour une œuvre
// en se basant sur son titre + synopsis.

function normalize(s) {
  return (s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[’'`]/g, " ");
}

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Score les items (tags ou genres) selon leur pertinence pour l'œuvre.
 * @param {{titre?:string, synopsis?:string}} oeuvre
 * @param {{titre:string, documentId:string}[]} items
 * @returns {Array} items enrichis d'un score, triés desc
 */
export function scoreSuggestions(oeuvre, items) {
  const titreNorm = normalize(oeuvre?.titre);
  const synopsisNorm = normalize(oeuvre?.synopsis);
  if (!titreNorm && !synopsisNorm) return [];

  const haystack = `${titreNorm} ${synopsisNorm}`;
  const results = [];

  for (const it of items || []) {
    const name = normalize(it.titre);
    if (!name || name.length < 3) continue;

    // Match mot entier (\b ne marche pas bien avec les espaces internes,
    // donc on encadre par non-alphanumeric ou bord)
    let re;
    try {
      re = new RegExp(`(^|[^a-z0-9])${escapeRegExp(name)}([^a-z0-9]|$)`, "g");
    } catch {
      continue;
    }

    let count = 0;
    let m;
    while ((m = re.exec(haystack)) !== null) {
      count++;
      if (re.lastIndex === m.index) re.lastIndex++;
    }

    if (count > 0) {
      let score = count;
      // Bonus si présent dans le titre
      if (titreNorm.includes(name)) score += 3;
      // Bonus si tag composé (plus rare donc plus discriminant)
      if (name.includes(" ")) score += 1;
      results.push({ ...it, score, hits: count });
    }
  }

  return results.sort((a, b) => b.score - a.score);
}

/**
 * Combine top-N tags suggérés avec un seuil de score minimal pour pré-coché.
 */
export function buildSuggestions(oeuvre, items, { topN = 15, autoCheckMinScore = 2 } = {}) {
  const scored = scoreSuggestions(oeuvre, items);
  const suggestions = scored.slice(0, topN);
  const autoChecked = suggestions
    .filter((s) => s.score >= autoCheckMinScore)
    .map((s) => s.documentId);
  return { suggestions, autoChecked };
}
