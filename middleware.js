import { NextResponse } from "next/server";

// Liste de bots agressifs/scrapers à bloquer au niveau Edge
const BLOCKED_BOTS = [
  "AhrefsBot",
  "SemrushBot",
  "MJ12bot",
  "DotBot",
  "BLEXBot",
  "PetalBot",
  "Bytespider",
  "GPTBot",
  "ClaudeBot",
  "CCBot",
  "DataForSeoBot",
  "Amazonbot",
  "anthropic-ai",
  "ChatGPT-User",
  "img2dataset",
  "serpstatbot",
  "Screaming Frog",
  "Riddler",
  "Sogou",
  "Yandex",
  "Baiduspider",
  "SEOkicks",
  "MegaIndex",
  "Majestic",
  "BacklinkCrawler",
];

// Regex compilé une seule fois
const BOT_REGEX = new RegExp(BLOCKED_BOTS.map(b => b.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join("|"), "i");

export function middleware(request) {
  const ua = request.headers.get("user-agent") || "";

  // 1. Bloquer les bots agressifs → retourner 403 immédiatement (0 compute)
  if (BOT_REGEX.test(ua)) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  // 2. Bloquer les requêtes sans User-Agent (souvent des scripts/bots)
  if (!ua || ua.length < 10) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  // 3. Protéger les routes API de scraping
  const pathname = request.nextUrl.pathname;
  
  if (
    pathname.startsWith("/api/scrapeauto") ||
    pathname.startsWith("/api/scrapeul")
  ) {
    const secret = request.headers.get("x-cron-secret");
    if (secret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  return NextResponse.next();
}

// Matcher — s'applique à toutes les routes sauf les assets statiques
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|logo.png|images/|robots.txt|sitemap).*)",
  ],
};
