// ═══════════════════════════════════════════
// Helpers partagés pour les crons de génération d'articles
// ═══════════════════════════════════════════

const STRAPI = process.env.NEXT_PUBLIC_API_URL;
const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY;
const CRON_SECRET = process.env.CRON_SECRET || "novel-index-cron-2026";
const MODEL = "google/gemma-3n-e4b-it:free";

const CONTEXT =
  "Contexte : tu écris pour Novel-Index, un site francophone qui indexe les web novels, light novels, mangas et webtoons traduits en français. " +
  "Tu ne fais PAS partie d'une rédaction, tu facilites l'accès aux sorties. " +
  "Écris en français, naturellement, sans emojis, sans formules creuses. Tu parles à des lecteurs passionnés.\n\n";

const JOURS_FR = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
const MOIS_FR = ["", "janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];

// ── Auth ──

export function verifyCronSecret(request) {
  const auth = request.headers.get("authorization");
  return auth === `Bearer ${CRON_SECRET}`;
}

// ── Dates ──

export function getYesterdayISO() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split("T")[0];
}

export function formatDateFR(dateISO) {
  const d = new Date(dateISO + "T12:00:00");
  const jour = JOURS_FR[d.getDay()];
  const num = d.getDate();
  const mois = MOIS_FR[d.getMonth() + 1];
  const annee = d.getFullYear();
  return `${jour} ${num} ${mois} ${annee}`;
}

export function getLastWeekBounds() {
  const now = new Date();
  const dayOfWeek = now.getDay() || 7;
  const lastSunday = new Date(now);
  lastSunday.setDate(now.getDate() - dayOfWeek);
  const lastMonday = new Date(lastSunday);
  lastMonday.setDate(lastSunday.getDate() - 6);
  return {
    start: lastMonday.toISOString().split("T")[0],
    end: lastSunday.toISOString().split("T")[0],
  };
}

export function getLastMonthInfo() {
  const now = new Date();
  const year = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
  const month = now.getMonth() === 0 ? 12 : now.getMonth();
  const daysInMonth = new Date(year, month, 0).getDate();
  return { year, month, daysInMonth, label: `${MOIS_FR[month]} ${year}` };
}

export function getISOWeekNumber(dateISO) {
  const d = new Date(dateISO + "T12:00:00");
  const jan4 = new Date(d.getFullYear(), 0, 4);
  const dayOfYear = Math.floor((d - new Date(d.getFullYear(), 0, 1)) / 86400000) + 1;
  const dayOfWeek = jan4.getDay() || 7;
  return Math.ceil((dayOfYear + dayOfWeek - 1) / 7);
}

// ── Fetch sorties Strapi ──

export async function fetchSortiesForDate(dateISO) {
  const PAGE_SIZE = 100;
  const results = [];
  const fetched = {};
  let page = 0;
  let hasMore = true;

  while (hasMore && page < 10) {
    const url =
      `${STRAPI}/api/oeuvres` +
      `?populate[couverture]=true` +
      `&populate[teams]=true` +
      `&populate[genres]=true` +
      `&pagination[start]=${page * PAGE_SIZE}` +
      `&pagination[limit]=${PAGE_SIZE}` +
      `&populate[chapitres][filters][updatedAt][$gte]=${dateISO}T00:00:00` +
      `&populate[chapitres][filters][updatedAt][$lte]=${dateISO}T23:59:59`;

    const res = await fetch(url);
    if (!res.ok) break;
    const data = await res.json();
    const oeuvres = data?.data || [];
    if (oeuvres.length === 0) { hasMore = false; break; }

    for (const oeuvre of oeuvres) {
      const docId = oeuvre.documentId || oeuvre.id;
      const chapitres = oeuvre.chapitres || [];
      if (chapitres.length > 0 && !fetched[docId]) {
        fetched[docId] = true;
        results.push({
          documentId: docId,
          titre: oeuvre.titre || "Sans titre",
          type: oeuvre.type || "web-novel",
          couverture: oeuvre.couverture?.url || null,
          chapitresCount: chapitres.length,
          teams: (oeuvre.teams || []).map((t) => ({
            id: t.documentId || t.id,
            nom: t.titre || t.nom || "Team inconnue",
          })),
          genres: (oeuvre.genres || []).map((g) => g.titre).filter(Boolean),
        });
      }
    }
    page++;
  }
  return results;
}

export async function fetchNewOeuvresForMonth(year, month) {
  const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
  const endDate = `${year}-${String(month).padStart(2, "0")}-${new Date(year, month, 0).getDate()}`;

  const PAGE_SIZE = 100;
  const results = [];
  let page = 0;
  let hasMore = true;

  while (hasMore && page < 10) {
    const url =
      `${STRAPI}/api/oeuvres` +
      `?populate[couverture]=true` +
      `&populate[teams]=true` +
      `&populate[genres]=true` +
      `&filters[createdAt][$gte]=${startDate}T00:00:00` +
      `&filters[createdAt][$lte]=${endDate}T23:59:59` +
      `&pagination[start]=${page * PAGE_SIZE}` +
      `&pagination[limit]=${PAGE_SIZE}` +
      `&sort=createdAt:desc`;

    const res = await fetch(url);
    if (!res.ok) break;
    const data = await res.json();
    const oeuvres = data?.data || [];
    if (oeuvres.length === 0) { hasMore = false; break; }

    for (const o of oeuvres) {
      results.push({
        documentId: o.documentId || o.id,
        titre: o.titre || "Sans titre",
        type: o.type || "web-novel",
        couverture: o.couverture?.url || null,
        teams: (o.teams || []).map((t) => ({
          id: t.documentId || t.id,
          nom: t.titre || t.nom || "Team inconnue",
        })),
        genres: (o.genres || []).map((g) => g.titre).filter(Boolean),
        createdAt: o.createdAt,
      });
    }
    page++;
  }
  return results;
}

// ── Stats helpers ──

export function buildStats(sorties) {
  const totalChapitres = sorties.reduce((s, o) => s + (o.chapitresCount || 0), 0);
  const totalSeries = sorties.length;
  const allTeams = {};
  sorties.forEach((o) => {
    (o.teams || []).forEach((t) => {
      if (!allTeams[t.id]) allTeams[t.id] = { ...t, oeuvresCount: 0, chapitresCount: 0 };
      allTeams[t.id].oeuvresCount++;
      allTeams[t.id].chapitresCount += o.chapitresCount || 0;
    });
  });
  const teamsList = Object.values(allTeams).sort((a, b) => b.chapitresCount - a.chapitresCount);

  const sorted = [...sorties].sort((a, b) => (b.chapitresCount || 0) - (a.chapitresCount || 0));
  const top5 = sorted.slice(0, 5);

  const byType = {};
  sorties.forEach((o) => {
    const t = o.type || "web-novel";
    if (!byType[t]) byType[t] = [];
    byType[t].push(o);
  });

  return { totalChapitres, totalSeries, teamsList, top5, byType };
}

// ── Génération IA ──

export async function generateText(prompt) {
  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENROUTER_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: "user", content: CONTEXT + prompt }],
        max_tokens: 600,
        temperature: 0.7,
      }),
    });

    if (!res.ok) {
      console.error("OpenRouter error:", await res.text().catch(() => ""));
      return "";
    }
    const data = await res.json();
    return (data.choices?.[0]?.message?.content || "").trim();
  } catch (err) {
    console.error("generateText error:", err);
    return "";
  }
}

// ── Slugify ──

export function slugify(text) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// ── Cover URL ──

export function coverUrl(url) {
  if (!url) return null;
  return url.startsWith("http") ? url : `${STRAPI}${url}`;
}

// ── Création article Strapi (POST standard) ──

export async function checkArticleExists(slug) {
  try {
    const res = await fetch(
      `${STRAPI}/api/articles?filters[slug][$eq]=${slug}&fields[0]=id`
    );
    if (!res.ok) return false;
    const data = await res.json();
    return (data.data || []).length > 0;
  } catch {
    return false;
  }
}

export async function createArticleInStrapi({ titre, slug, contenu, extrait, categorie = "actualite", oeuvresDocIds = [], mise_en_avant = false }) {
  const body = {
    data: {
      titre,
      slug,
      contenu,
      extrait,
      categorie,
      statut: "publie",
      mise_en_avant,
    },
  };

  if (oeuvresDocIds.length > 0) {
    body.data.oeuvres_liees = oeuvresDocIds;
  }

  const res = await fetch(`${STRAPI}/api/articles?status=published`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text().catch(() => "");
    throw new Error(`Strapi POST /api/articles failed (${res.status}): ${err}`);
  }

  const data = await res.json();
  return data;
}

// ── HTML builders ──

const TYPE_LABELS = {
  "web-novel": "Web novels",
  "light-novel": "Light novels",
  "manga": "Mangas",
  "webtoon": "Webtoons",
};

export function buildSortiesHTML({ titre, dateFR, stats, top5, byType, teamsList, aiTexts }) {
  const topHTML = top5.map((o, i) => {
    const cover = coverUrl(o.couverture);
    const team = o.teams?.[0]?.nom || "—";
    return `<div style="display:flex;align-items:center;gap:16px;padding:12px;background:#1f2937;border-radius:12px;margin-bottom:8px;">
      ${cover ? `<img src="${cover}" alt="${o.titre}" style="width:48px;height:64px;object-fit:cover;border-radius:8px;" />` : ""}
      <div style="flex:1;">
        <strong style="color:#e5e7eb;">#${i + 1} — ${o.titre}</strong><br/>
        <small style="color:#9ca3af;">${team} · +${o.chapitresCount} chapitres</small>
      </div>
    </div>`;
  }).join("\n");

  const categoriesHTML = Object.entries(byType).map(([type, oeuvres]) => {
    const label = TYPE_LABELS[type] || type;
    const items = oeuvres.map((o) => {
      const team = o.teams?.[0]?.nom || "—";
      return `<li style="color:#d1d5db;">${o.titre} <small style="color:#6b7280;">— ${team} · +${o.chapitresCount} chap.</small></li>`;
    }).join("\n");
    return `<h3 style="color:#a5b4fc;margin-top:24px;">${label} (${oeuvres.length})</h3>\n<ul>${items}</ul>`;
  }).join("\n");

  const teamsHTML = teamsList.slice(0, 10).map((t) => {
    return `<li style="color:#d1d5db;">${t.nom} <small style="color:#6b7280;">— ${t.oeuvresCount} séries · ${t.chapitresCount} chapitres</small></li>`;
  }).join("\n");

  return `
<h2 style="color:#818cf8;">${titre}</h2>
<p style="color:#9ca3af;">${dateFR} — ${stats.totalChapitres} chapitres sur ${stats.totalSeries} séries par ${stats.teamsList.length} teams</p>

${aiTexts.intro ? `<p style="color:#d1d5db;">${aiTexts.intro}</p>` : ""}

<h3 style="color:#fbbf24;">Top ${top5.length} du jour</h3>
${topHTML}

${aiTexts.podium ? `<p style="color:#d1d5db;">${aiTexts.podium}</p>` : ""}

<h2 style="color:#818cf8;">Toutes les sorties</h2>
${categoriesHTML}

<h2 style="color:#34d399;">Teams actives</h2>
<ul>${teamsHTML}</ul>

${aiTexts.teams ? `<p style="color:#d1d5db;">${aiTexts.teams}</p>` : ""}

${aiTexts.conclusion ? `<p style="color:#d1d5db;">${aiTexts.conclusion}</p>` : ""}
`.trim();
}

export function buildRecapSemaineHTML({ weekLabel, dailyStats, totalStats, top5, teamsList, aiTexts }) {
  const dailyRows = dailyStats.map((d) => {
    return `<tr>
      <td style="color:#d1d5db;padding:4px 12px;">${d.label}</td>
      <td style="color:#9ca3af;padding:4px 12px;">${d.chapitres} chapitres</td>
      <td style="color:#9ca3af;padding:4px 12px;">${d.series} séries</td>
    </tr>`;
  }).join("\n");

  const topHTML = top5.map((o, i) => {
    return `<li style="color:#d1d5db;"><strong>#${i + 1} ${o.titre}</strong> — ${o.chapitresCount} chapitres <small style="color:#6b7280;">(${o.teams?.[0]?.nom || "—"})</small></li>`;
  }).join("\n");

  return `
<h2 style="color:#818cf8;">Récap de la ${weekLabel}</h2>
<p style="color:#9ca3af;">${totalStats.totalChapitres} chapitres sur ${totalStats.totalSeries} séries par ${totalStats.teamsList.length} teams</p>

${aiTexts.intro ? `<p style="color:#d1d5db;">${aiTexts.intro}</p>` : ""}

<h3 style="color:#fbbf24;">Jour par jour</h3>
<table style="width:100%;border-collapse:collapse;">${dailyRows}</table>

<h3 style="color:#fbbf24;">Top 5 de la semaine</h3>
<ol>${topHTML}</ol>

${aiTexts.analyse ? `<p style="color:#d1d5db;">${aiTexts.analyse}</p>` : ""}

${aiTexts.conclusion ? `<p style="color:#d1d5db;">${aiTexts.conclusion}</p>` : ""}
`.trim();
}

export function buildRecapMoisHTML({ moisLabel, totalStats, top5, teamsList, aiTexts }) {
  const topHTML = top5.map((o, i) => {
    return `<li style="color:#d1d5db;"><strong>#${i + 1} ${o.titre}</strong> — ${o.chapitresCount} chapitres <small style="color:#6b7280;">(${o.teams?.[0]?.nom || "—"})</small></li>`;
  }).join("\n");

  const teamsHTML = teamsList.slice(0, 15).map((t) => {
    return `<li style="color:#d1d5db;">${t.nom} — ${t.chapitresCount} chapitres sur ${t.oeuvresCount} séries</li>`;
  }).join("\n");

  return `
<h2 style="color:#818cf8;">Bilan de ${moisLabel}</h2>
<p style="color:#9ca3af;">${totalStats.totalChapitres} chapitres sur ${totalStats.totalSeries} séries par ${totalStats.teamsList.length} teams</p>

${aiTexts.intro ? `<p style="color:#d1d5db;">${aiTexts.intro}</p>` : ""}

<h3 style="color:#fbbf24;">Top 5 du mois</h3>
<ol>${topHTML}</ol>

${aiTexts.analyse ? `<p style="color:#d1d5db;">${aiTexts.analyse}</p>` : ""}

<h3 style="color:#34d399;">Teams les plus actives</h3>
<ul>${teamsHTML}</ul>

${aiTexts.teams ? `<p style="color:#d1d5db;">${aiTexts.teams}</p>` : ""}

${aiTexts.conclusion ? `<p style="color:#d1d5db;">${aiTexts.conclusion}</p>` : ""}
`.trim();
}

export function buildNouvellesOeuvresHTML({ moisLabel, oeuvres, aiTexts }) {
  const byType = {};
  oeuvres.forEach((o) => {
    const t = o.type || "web-novel";
    if (!byType[t]) byType[t] = [];
    byType[t].push(o);
  });

  const sections = Object.entries(byType).map(([type, items]) => {
    const label = TYPE_LABELS[type] || type;
    const list = items.map((o) => {
      const cover = coverUrl(o.couverture);
      const team = o.teams?.[0]?.nom || "—";
      const genres = o.genres?.slice(0, 3).join(", ") || "";
      return `<div style="display:flex;align-items:center;gap:12px;padding:10px;background:#1f2937;border-radius:10px;margin-bottom:6px;">
        ${cover ? `<img src="${cover}" alt="${o.titre}" style="width:40px;height:56px;object-fit:cover;border-radius:6px;" />` : ""}
        <div>
          <strong style="color:#e5e7eb;">${o.titre}</strong><br/>
          <small style="color:#6b7280;">${team}${genres ? ` · ${genres}` : ""}</small>
        </div>
      </div>`;
    }).join("\n");
    return `<h3 style="color:#a5b4fc;">${label} (${items.length})</h3>\n${list}`;
  }).join("\n");

  return `
<h2 style="color:#818cf8;">Nouvelles oeuvres — ${moisLabel}</h2>
<p style="color:#9ca3af;">${oeuvres.length} nouvelles oeuvres ajoutées ce mois</p>

${aiTexts.intro ? `<p style="color:#d1d5db;">${aiTexts.intro}</p>` : ""}

${sections}

${aiTexts.conclusion ? `<p style="color:#d1d5db;">${aiTexts.conclusion}</p>` : ""}
`.trim();
}
