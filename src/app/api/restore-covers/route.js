// Restaure les relations couverture cassées par matching nom de fichier ↔ titre œuvre.
// POST { dryRun: boolean }
// → { matched: [...], unmatched: [...], updated: [...], errors: [...] }

const STRAPI = process.env.NEXT_PUBLIC_API_URL;
const TOKEN = process.env.STRAPI_ADMIN_TOKEN;

function normalize(s) {
  if (!s) return "";
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // accents
    .replace(/['’`]/g, "") // apostrophes
    .replace(/\.(jpg|jpeg|png|webp|gif)$/i, "") // extension fichier
    .replace(/[^a-z0-9]+/g, " ") // tout le reste → espace
    .trim();
}

async function fetchAllMedia() {
  // Strapi accepte pageSize jusqu'à 1000 par défaut
  const url = `${STRAPI}/api/upload/files?pagination[pageSize]=1000`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`upload/files ${res.status}`);
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

async function fetchOeuvresWithoutCover() {
  const all = [];
  let page = 1;
  while (true) {
    const url = `${STRAPI}/api/oeuvres?populate[couverture][fields][0]=id&fields[0]=titre&fields[1]=documentId&pagination[page]=${page}&pagination[pageSize]=100`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`oeuvres ${res.status}`);
    const json = await res.json();
    const items = json.data || [];
    for (const o of items) {
      if (!o.couverture?.id) all.push(o);
    }
    const pag = json.meta?.pagination;
    if (!pag || page >= pag.pageCount) break;
    page++;
  }
  return all;
}

export async function POST(req) {
  try {
    if (!TOKEN) {
      return Response.json(
        { error: "STRAPI_ADMIN_TOKEN manquant" },
        { status: 500 },
      );
    }
    const { dryRun = true } = await req.json().catch(() => ({}));

    const [media, oeuvres] = await Promise.all([
      fetchAllMedia(),
      fetchOeuvresWithoutCover(),
    ]);

    // Index des médias par nom normalisé
    const byNorm = new Map();
    for (const m of media) {
      const key = normalize(m.name || "");
      if (!key) continue;
      // En cas de doublon, on garde le plus récent
      const existing = byNorm.get(key);
      if (
        !existing ||
        new Date(m.updatedAt || 0) > new Date(existing.updatedAt || 0)
      ) {
        byNorm.set(key, m);
      }
    }

    const matched = [];
    const unmatched = [];

    for (const o of oeuvres) {
      const key = normalize(o.titre || "");
      const m = byNorm.get(key);
      if (m) {
        matched.push({
          documentId: o.documentId,
          titre: o.titre,
          mediaId: m.id,
          mediaName: m.name,
          mediaUrl: m.url,
        });
      } else {
        unmatched.push({ documentId: o.documentId, titre: o.titre });
      }
    }

    if (dryRun) {
      return Response.json({
        dryRun: true,
        totalOeuvresSansCouv: oeuvres.length,
        totalMedia: media.length,
        matched: matched.length,
        unmatched: unmatched.length,
        sampleMatched: matched.slice(0, 10),
        sampleUnmatched: unmatched.slice(0, 20),
      });
    }

    // Exécution réelle
    const updated = [];
    const errors = [];
    for (const m of matched) {
      try {
        const res = await fetch(`${STRAPI}/api/oeuvres/${m.documentId}`, {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${TOKEN}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ data: { couverture: m.mediaId } }),
        });
        if (!res.ok) {
          const txt = await res.text();
          errors.push({
            titre: m.titre,
            error: `${res.status}: ${txt.slice(0, 200)}`,
          });
        } else {
          updated.push(m.titre);
        }
      } catch (e) {
        errors.push({ titre: m.titre, error: e.message });
      }
      // Petite pause pour ne pas saturer
      await new Promise((r) => setTimeout(r, 100));
    }

    return Response.json({
      dryRun: false,
      totalProcessed: matched.length,
      updated: updated.length,
      errors: errors.length,
      unmatched: unmatched.length,
      sampleUpdated: updated.slice(0, 10),
      errors_detail: errors.slice(0, 20),
      unmatched_detail: unmatched.slice(0, 50),
    });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
