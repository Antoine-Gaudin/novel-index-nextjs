import { NextResponse } from "next/server";

// 🚨 MODE URGENCE : Bloquer TOUS les bots pendant quelques jours
// Change cette date quand tu veux réactiver les bots
const BLOCK_ALL_BOTS_UNTIL = new Date("2026-02-26T00:00:00Z"); // 3 jours

export function middleware(request) {
  const ua = (request.headers.get("user-agent") || "").toLowerCase();
  const now = new Date();

  // Si pas de User-Agent → bloqué
  if (!ua || ua.trim() === "") {
    return new NextResponse("Forbidden", { status: 403 });
  }

  // 🚨 MODE URGENCE : Bloquer TOUT ce qui ressemble à un bot
  if (now < BLOCK_ALL_BOTS_UNTIL) {
    const isBotLike =
      ua.includes("bot") ||
      ua.includes("crawl") ||
      ua.includes("spider") ||
      ua.includes("slurp") ||
      ua.includes("fetch") ||
      ua.includes("curl") ||
      ua.includes("wget") ||
      ua.includes("python") ||
      ua.includes("java") ||
      ua.includes("php") ||
      ua.includes("go-http") ||
      ua.includes("node") ||
      ua.includes("axios") ||
      ua.includes("http") ||
      ua.includes("scraper") ||
      ua.includes("lighthouse") ||
      ua.includes("chrome-lighthouse") ||
      ua.includes("pagespeed") ||
      ua.includes("google") ||
      ua.includes("bing") ||
      ua.includes("yandex") ||
      ua.includes("baidu") ||
      ua.includes("duckduck") ||
      ua.includes("facebook") ||
      ua.includes("twitter") ||
      ua.includes("discord") ||
      ua.includes("telegram") ||
      ua.includes("whatsapp") ||
      ua.includes("slack") ||
      ua.includes("semrush") ||
      ua.includes("ahrefs") ||
      ua.includes("mj12") ||
      ua.includes("dotbot") ||
      ua.includes("bytespider") ||
      ua.includes("gpt") ||
      ua.includes("chatgpt") ||
      ua.includes("claude") ||
      ua.includes("anthropic") ||
      ua.includes("archive");

    if (isBotLike) {
      return new NextResponse("Temporarily unavailable", { status: 503 });
    }
  }

  // Protéger les routes API de scraping
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
    "/((?!_next/static|_next/image|favicon.ico|logo.png|images/|robots.txt).*)",
  ],
};
