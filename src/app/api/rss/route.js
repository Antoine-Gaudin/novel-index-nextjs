import { NextResponse } from "next/server";

const RSS_FEEDS = [
  "https://rss.app/feeds/t64woClRzNhL3NvW.xml",
  "https://rss.app/feeds/pmnVLgvzUGJVttS4.xml",
  "https://rss.app/feeds/rRycTB0GYlegE52l.xml",
  "https://rss.app/feeds/EdeUbOVwZy3TnxFj.xml",
  "https://rss.app/feeds/wOfiHd40WmfUcZiy.xml",
  "https://rss.app/feeds/6BpCf7fR7EnXgwUC.xml",
  "https://rss.app/feeds/dmNjL1XrTGqVikzF.xml",
];

async function fetchOneFeed(url) {
  try {
    const res = await fetch(url, { next: { revalidate: 1800 } });
    if (!res.ok) return [];
    const xml = await res.text();
    return parseItems(xml);
  } catch {
    return [];
  }
}

function parseItems(xml) {
  const items = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;

  while ((match = itemRegex.exec(xml)) !== null) {
    const block = match[1];

    const titre = extract(block, "title");
    const url = extract(block, "link");
    const extrait = extract(block, "description")?.replace(/<[^>]*>/g, "").slice(0, 200);
    const pubDate = extract(block, "pubDate");
    const auteur = extract(block, "dc:creator") || extract(block, "author");
    const source = extract(block, "source") || extractDomain(url);

    const mediaMatch = block.match(/<media:content[^>]*url="([^"]+)"/);
    const enclosureMatch = block.match(/<enclosure[^>]*url="([^"]+)"/);
    const rawCover = mediaMatch?.[1] || enclosureMatch?.[1] || null;
    const cover = cleanCoverUrl(rawCover);

    const rawDate = pubDate ? new Date(pubDate) : null;
    const date = rawDate
      ? rawDate.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })
      : "";

    items.push({ titre, url, extrait, date, auteur, source, cover, _ts: rawDate?.getTime() || 0 });
  }

  return items;
}

export async function GET() {
  try {
    const results = await Promise.all(RSS_FEEDS.map(fetchOneFeed));
    const allItems = results.flat();

    // Tri par date décroissante, dédoublonnage par URL
    allItems.sort((a, b) => b._ts - a._ts);
    const seen = new Set();
    const unique = [];
    for (const item of allItems) {
      if (item.url && seen.has(item.url)) continue;
      if (item.url) seen.add(item.url);
      unique.push(item);
      if (unique.length >= 20) break;
    }

    return NextResponse.json({ items: unique });
  } catch (err) {
    console.error("RSS fetch error:", err);
    return NextResponse.json({ items: [] });
  }
}

function extract(block, tag) {
  // Handle CDATA
  const cdataRegex = new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]></${tag}>`);
  const cdataMatch = block.match(cdataRegex);
  if (cdataMatch) return cdataMatch[1].trim();

  const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`);
  const m = block.match(regex);
  return m ? m[1].trim() : null;
}

function cleanCoverUrl(url) {
  if (!url) return null;
  // Décoder les entités HTML (&amp; → &)
  const decoded = url.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"');
  // Vérifier que c'est bien une URL d'image (pas juste un domaine nu)
  try {
    const parsed = new URL(decoded);
    const path = parsed.pathname;
    // Rejeter les URLs sans chemin réel (ex: "https://www.boursorama.com/")
    if (path === "/" || path === "") return null;
    return decoded;
  } catch {
    return null;
  }
}

function extractDomain(url) {
  if (!url) return "";
  try {
    const hostname = new URL(url).hostname.replace("www.", "");
    // Capitalize first letter
    return hostname.charAt(0).toUpperCase() + hostname.slice(1);
  } catch {
    return "";
  }
}
