// Route serveur : suggère des tags et genres via OpenRouter (LLM gratuit)
// POST { titre, synopsis, auteur?, type?, tags: [{documentId, titre}], genres: [{documentId, titre}] }
// → { tagIds: string[], genreIds: string[], raw?: string }

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
// Modèles payants fiables (en ordre de préférence) — fallback automatique si erreur
// Coût estimé pour ~3k tokens entrée + 200 sortie par œuvre :
// - gpt-4o-mini : ~0.0006 $ par œuvre
// - gemini-2.5-flash : ~0.001 $ par œuvre
// - deepseek-chat-v3.1 : ~0.0009 $ par œuvre
const MODELS = [
  {
    id: "openai/gpt-4o-mini",
    supportsJsonMode: true,
  },
  {
    id: "google/gemini-2.5-flash",
    supportsJsonMode: true,
  },
  {
    id: "deepseek/deepseek-chat-v3.1",
    supportsJsonMode: false,
  },
];

function buildPrompt({ titre, synopsis, auteur, type, tags, genres }) {
  // On utilise des index courts (T1, T2... / G1, G2...) au lieu des documentId
  // pour réduire les hallucinations du modèle sur des chaînes cryptiques.
  const tagsList = tags
    .map((t, i) => {
      const desc = (t.description || "").trim();
      return desc
        ? `T${i + 1} : ${t.titre} — ${desc}`
        : `T${i + 1} : ${t.titre}`;
    })
    .join("\n");
  const genresList = genres
    .map((g, i) => {
      const desc = (g.description || "").trim();
      return desc
        ? `G${i + 1} : ${g.titre} — ${desc}`
        : `G${i + 1} : ${g.titre}`;
    })
    .join("\n");

  return `Tu es un assistant pour un site de catalogue de romans web (novel-index.com). Tu dois choisir les tags et genres pertinents pour une œuvre, UNIQUEMENT depuis les listes fournies.

ŒUVRE
Titre : ${titre || "(inconnu)"}
${auteur ? `Auteur : ${auteur}\n` : ""}${type ? `Type : ${type}\n` : ""}Synopsis :
${synopsis || "(pas de synopsis)"}

GENRES DISPONIBLES (format : Gn : nom — définition)
${genresList}

TAGS DISPONIBLES (format : Tn : nom — définition)
${tagsList}

CONSIGNES
- Réponds UNIQUEMENT avec un JSON valide, sans texte autour, sans markdown.
- Référence par les CODES (T1, T2, G1, G2...) qui apparaissent ci-dessus.
- Les définitions sont des **guides** : un tag s'applique dès que le concept est présent, même sans correspondance littérale.
- Inférence sémantique attendue : déduis ce qui n'est pas dit explicitement (ex : "épée magique + royaume" → Fantasy ; "se réveille dans un autre corps" → Réincarnation/Transmigration).
- Genres : OBLIGATOIRE minimum 3 codes (sois inclusif, choisis les plus probables).
- Tags : OBLIGATOIRE minimum 5 codes, vise 8 à 15.

FORMAT EXACT
{"genres": ["G1", "G3", "G7"], "tags": ["T2", "T5", "T12", "T18"]}`;
}

function safeParseJson(text) {
  if (!text) return null;
  // Nettoie ```json ... ```
  const cleaned = text
    .replace(/```json\s*/gi, "")
    .replace(/```\s*/g, "")
    .trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    // Tente d'extraire le premier objet JSON
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch {
        return null;
      }
    }
    return null;
  }
}

async function callModel(model, prompt, apiKey) {
  const payload = {
    model: model.id,
    messages: [
      {
        role: "system",
        content:
          "Tu es un assistant de catalogage qui répond TOUJOURS en JSON valide, sans markdown ni texte autour.",
      },
      { role: "user", content: prompt },
    ],
    temperature: 0.2,
    max_tokens: 1500,
  };
  if (model.supportsJsonMode) {
    payload.response_format = { type: "json_object" };
  }
  const res = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://www.novel-index.com",
      "X-Title": "Novel-Index Tag Suggester",
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(
      `OpenRouter ${res.status} (${model.id}): ${err.slice(0, 300)}`,
    );
  }
  const json = await res.json();
  return {
    content: json?.choices?.[0]?.message?.content || "",
    usage: json?.usage || null,
  };
}

export async function POST(req) {
  try {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return Response.json(
        { error: "OPENROUTER_API_KEY manquant" },
        { status: 500 },
      );
    }
    const body = await req.json();
    const { titre, synopsis, auteur, type, tags = [], genres = [] } = body;
    if (!Array.isArray(tags) || !Array.isArray(genres)) {
      return Response.json(
        { error: "tags et genres doivent être des tableaux" },
        { status: 400 },
      );
    }
    if (!synopsis && !titre) {
      return Response.json(
        { error: "Synopsis ou titre requis" },
        { status: 400 },
      );
    }

    const prompt = buildPrompt({ titre, synopsis, auteur, type, tags, genres });

    let lastError = null;
    let raw = "";
    for (const model of MODELS) {
      try {
        const { content, usage } = await callModel(model, prompt, apiKey);
        raw = content;
        const parsed = safeParseJson(raw);
        if (
          parsed &&
          (Array.isArray(parsed.tags) ||
            Array.isArray(parsed.genres) ||
            Array.isArray(parsed.tagIds) ||
            Array.isArray(parsed.genreIds))
        ) {
          // Accepte les deux formats : codes (T1, G2) ou directement docIds
          const rawTags = parsed.tags || parsed.tagIds || [];
          const rawGenres = parsed.genres || parsed.genreIds || [];

          const tagDocIdSet = new Set(tags.map((t) => t.documentId));
          const genreDocIdSet = new Set(genres.map((g) => g.documentId));

          const resolveTag = (code) => {
            if (typeof code !== "string") return null;
            const m = code.match(/^T(\d+)$/i);
            if (m) {
              const idx = parseInt(m[1], 10) - 1;
              return tags[idx]?.documentId || null;
            }
            // Sinon fallback : on suppose un docId direct
            return tagDocIdSet.has(code) ? code : null;
          };
          const resolveGenre = (code) => {
            if (typeof code !== "string") return null;
            const m = code.match(/^G(\d+)$/i);
            if (m) {
              const idx = parseInt(m[1], 10) - 1;
              return genres[idx]?.documentId || null;
            }
            return genreDocIdSet.has(code) ? code : null;
          };

          const tagIds = [
            ...new Set(rawTags.map(resolveTag).filter(Boolean)),
          ];
          const genreIds = [
            ...new Set(rawGenres.map(resolveGenre).filter(Boolean)),
          ];

          return Response.json({
            tagIds,
            genreIds,
            model: model.id,
            usage,
          });
        }
        lastError = `Réponse non parsable: ${raw.slice(0, 200)}`;
      } catch (e) {
        lastError = e.message;
      }
    }
    return Response.json(
      { error: lastError || "Tous les modèles ont échoué", raw },
      { status: 502 },
    );
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
