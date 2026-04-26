import { slugify } from "@/utils/slugify";

const STRAPI = process.env.NEXT_PUBLIC_API_URL;
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.novel-index.com";

export const revalidate = 3600;

function escapeXml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

async function fetchTeam(documentId) {
  try {
    const res = await fetch(
      `${STRAPI}/api/teams/${documentId}` +
        `?populate[oeuvres][fields][0]=titre` +
        `&populate[oeuvres][fields][1]=documentId` +
        `&populate[oeuvres][fields][2]=auteur` +
        `&populate[oeuvres][fields][3]=type` +
        `&populate[oeuvres][fields][4]=updatedAt` +
        `&populate[oeuvres][sort]=updatedAt:desc` +
        `&populate[oeuvres][pagination][limit]=30`,
      { next: { revalidate: 3600 } },
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data.data || null;
  } catch {
    return null;
  }
}

export async function GET(_req, { params }) {
  const { documentId } = await params;
  if (!documentId) {
    return new Response("Not Found", { status: 404 });
  }
  const team = await fetchTeam(documentId);
  if (!team) {
    return new Response("Not Found", { status: 404 });
  }

  const titre = team.titre;
  const expectedSlug = slugify(titre || "");
  const teamUrl = `${SITE_URL}/Teams/${documentId}-${expectedSlug}`;
  const feedUrl = `${SITE_URL}/api/teams/${documentId}/rss`;
  const oeuvres = (team.oeuvres || [])
    .filter((o) => o.updatedAt)
    .sort((a, b) => (b.updatedAt || "").localeCompare(a.updatedAt || ""))
    .slice(0, 30);

  const lastBuild = oeuvres[0]?.updatedAt || team.updatedAt || new Date().toISOString();

  const items = oeuvres
    .map((o) => {
      const oUrl = `${SITE_URL}/oeuvre/${o.documentId}-${slugify(o.titre || "")}`;
      const pubDate = new Date(o.updatedAt).toUTCString();
      const desc = `Œuvre traduite par ${titre}${o.auteur ? ` — ${o.auteur}` : ""}${o.type ? ` (${o.type})` : ""}.`;
      return `    <item>
      <title>${escapeXml(o.titre)}</title>
      <link>${escapeXml(oUrl)}</link>
      <guid isPermaLink="true">${escapeXml(oUrl)}</guid>
      <pubDate>${pubDate}</pubDate>
      <description>${escapeXml(desc)}</description>
    </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(titre)} — Mises à jour de catalogue | Novel-Index</title>
    <link>${escapeXml(teamUrl)}</link>
    <atom:link href="${escapeXml(feedUrl)}" rel="self" type="application/rss+xml" />
    <description>Dernières mises à jour des œuvres traduites par ${escapeXml(titre)} sur Novel-Index.</description>
    <language>fr-FR</language>
    <lastBuildDate>${new Date(lastBuild).toUTCString()}</lastBuildDate>
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=600, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
