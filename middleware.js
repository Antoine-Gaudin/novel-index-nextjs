import { NextResponse } from "next/server";

// ============================================================
// 🛡️ MIDDLEWARE ANTI-BOT — Protection agressive
// ============================================================

// --- 1. LISTE NOIRE DE USER-AGENTS (AI crawlers + scrapers) ---
// Ces patterns sont testés en lowercase contre le user-agent
const BLOCKED_UA_EXACT = [
  // OpenAI / ChatGPT
  "gptbot",
  "chatgpt-user",
  "oai-searchbot",
  "openai",
  // Anthropic / Claude
  "claudebot",
  "claude-web",
  "anthropic-ai",
  "anthropic",
  // Google AI
  "google-extended",
  // Meta AI
  "meta-externalagent",
  "meta-externalfetcher",
  "facebookbot",
  "facebookexternalhit",
  // Common Crawl / datasets
  "ccbot",
  "img2dataset",
  "commoncrawl",
  // SEO bots agressifs
  "ahrefsbot",
  "semrushbot",
  "mj12bot",
  "dotbot",
  "blexbot",
  "petalbot",
  "dataforseobot",
  "amazonbot",
  "bytespider",
  "zoominfobot",
  "serpstatbot",
  "megaindex",
  "barkrowler",
  "bomborabot",
  "bubing",
  // Autres AI crawlers
  "cohere-ai",
  "perplexitybot",
  "youbot",
  "ai2bot",
  "diffbot",
  "applebot-extended",
  "timpibot",
  "velenpublicwebcrawler",
  "webzio-extended",
  "omgili",
  "friendlycrawler",
  "iaskspider",
  // Scrapers génériques
  "scrapy",
  "nutch",
  "colly",
  "go-http-client",
  "java/",
  "python-requests",
  "python-urllib",
  "aiohttp",
  "httpx",
  "node-fetch",
  "undici",
  "axios",
  "wget",
  "curl",
  "libwww",
  "lwp-trivial",
  "mechanize",
  "phantomjs",
  "headlesschrome",
];

// Patterns regex pour attraper les variantes
const BLOCKED_UA_PATTERNS = [
  /gpt/i,
  /chatgpt/i,
  /openai/i,
  /claude/i,
  /anthropic/i,
  /bytespider/i,
  /bytedance/i,
  /ccbot/i,
  /semrush/i,
  /ahrefs/i,
  /mj12/i,
  /dotbot/i,
  /dataforseo/i,
  /petalbot/i,
  /meta-external/i,
  /perplexity/i,
  /cohere/i,
  /diffbot/i,
  /scrapy/i,
  /python-requests/i,
  /go-http-client/i,
];

// --- 2. PLAGES IP CONNUES D'OPENAI (GPTBot) ---
// Source: https://openai.com/gptbot-ranges.txt (mise à jour régulièrement)
const OPENAI_IP_PREFIXES = [
  "20.15.",
  "20.171.",
  "20.161.",
  "23.98.",
  "40.84.",
  "52.167.",
  "52.230.",
  "52.234.",
  "52.246.",
  "57.152.",
  "104.209.",
  "104.210.",
  "104.214.",
  "172.178.",
  "191.234.",
  "191.235.",
  "191.236.",
  "191.237.",
  "191.238.",
  "20.0.",
  "20.1.",
  "20.2.",
  "20.3.",
  "20.4.",
  "20.5.",
  "20.6.",
  "20.7.",
  "40.80.",
  "52.170.",
];

// Plages CIDR d'OpenAI connues — on check les 2-3 premiers octets
const BLOCKED_IP_CIDRS = [
  // OpenAI Azure ranges
  { prefix: "20.15.", min: 0, max: 255 },
  { prefix: "20.171.", min: 0, max: 255 },
  { prefix: "52.167.", min: 0, max: 255 },
  { prefix: "52.230.", min: 0, max: 255 },
  { prefix: "57.152.", min: 0, max: 255 },
  { prefix: "23.98.", min: 0, max: 255 },
];

// --- 3. RATE LIMITING EN MEMOIRE ---
const rateMap = new Map();
const RATE_LIMIT_WINDOW = 10_000;  // 10 secondes
const RATE_LIMIT_MAX = 30;         // max 30 requêtes par 10s pour un utilisateur normal
const BOT_SUSPECT_THRESHOLD = 15;  // au-dessus de 15 req/10s = suspect
const CLEANUP_INTERVAL = 60_000;   // nettoyage toutes les 60s
let lastCleanup = Date.now();

function cleanupRateMap() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;
  const cutoff = now - RATE_LIMIT_WINDOW * 3;
  for (const [key, data] of rateMap) {
    if (data.windowStart < cutoff) {
      rateMap.delete(key);
    }
  }
}

function checkRateLimit(ip) {
  const now = Date.now();
  const data = rateMap.get(ip);

  if (!data || now - data.windowStart > RATE_LIMIT_WINDOW) {
    rateMap.set(ip, { count: 1, windowStart: now, blocked: false });
    return { allowed: true, count: 1 };
  }

  data.count++;

  if (data.count > RATE_LIMIT_MAX) {
    data.blocked = true;
    return { allowed: false, count: data.count };
  }

  return { allowed: true, count: data.count, suspect: data.count > BOT_SUSPECT_THRESHOLD };
}

// --- 4. BOTS LÉGITIMES AUTORISÉS (Google, Bing...) ---
// On les laisse passer MAIS avec rate limit
const ALLOWED_SEARCH_BOTS = [
  "googlebot",
  "bingbot",
  "yandexbot", 
  "duckduckbot",
  "baiduspider",
  "slurp",        // Yahoo
];

function isAllowedSearchBot(ua) {
  return ALLOWED_SEARCH_BOTS.some((bot) => ua.includes(bot));
}

// --- 5. DÉTECTION AVANCÉE DE BOTS ---
function isSuspiciousRequest(request, ua) {
  let score = 0;

  // Pas de Accept-Language → probablement un bot
  if (!request.headers.get("accept-language")) score += 2;

  // Pas de Accept header
  if (!request.headers.get("accept")) score += 2;

  // Pas de sec-fetch-mode (navigateurs modernes l'envoient toujours)
  if (!request.headers.get("sec-fetch-mode")) score += 2;

  // Pas de sec-ch-ua (Chrome, Edge, etc. l'envoient)
  if (!request.headers.get("sec-ch-ua") && !ua.includes("firefox") && !ua.includes("safari")) score += 1;

  // User-agent très court (< 30 chars) → suspect
  if (ua.length < 30) score += 3;

  // User-agent qui contient "bot", "crawl", "spider" mais pas dans la whitelist
  if ((ua.includes("bot") || ua.includes("crawl") || ua.includes("spider")) && !isAllowedSearchBot(ua)) {
    score += 5;
  }

  // User-agent contient "http://" ou "https://" (souvent les crawlers mettent leur URL)
  if (ua.includes("http://") || ua.includes("https://")) score += 2;

  return score;
}

// ============================================================
// 🚀 MIDDLEWARE PRINCIPAL
// ============================================================
export function middleware(request) {
  const ua = (request.headers.get("user-agent") || "").toLowerCase();
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    request.headers.get("cf-connecting-ip") ||
    "unknown";
  const pathname = request.nextUrl.pathname;

  // --- Nettoyage périodique du rate map ---
  cleanupRateMap();

  // --- ÉTAPE 1 : Pas de User-Agent → blocage immédiat ---
  if (!ua || ua.trim() === "") {
    return new NextResponse(null, { status: 403 });
  }

  // --- ÉTAPE 2 : Blocage par IP OpenAI connues ---
  if (ip !== "unknown") {
    const isBlockedIP = OPENAI_IP_PREFIXES.some((prefix) => ip.startsWith(prefix));
    if (isBlockedIP) {
      return new NextResponse(null, {
        status: 403,
        headers: {
          "Cache-Control": "no-store",
          "X-Robots-Tag": "noindex, nofollow",
        },
      });
    }
  }

  // --- ÉTAPE 3 : Blocage par User-Agent exact ---
  const isBlockedExact = BLOCKED_UA_EXACT.some((bot) => ua.includes(bot));
  if (isBlockedExact) {
    return new NextResponse(null, {
      status: 403,
      headers: {
        "Cache-Control": "no-store",
        "X-Robots-Tag": "noindex, nofollow",
      },
    });
  }

  // --- ÉTAPE 4 : Blocage par pattern regex ---
  const isBlockedPattern = BLOCKED_UA_PATTERNS.some((regex) => regex.test(ua));
  if (isBlockedPattern) {
    return new NextResponse(null, {
      status: 403,
      headers: {
        "Cache-Control": "no-store",
        "X-Robots-Tag": "noindex, nofollow",
      },
    });
  }

  // --- ÉTAPE 5 : Rate Limiting par IP ---
  if (ip !== "unknown") {
    const rateResult = checkRateLimit(ip);

    if (!rateResult.allowed) {
      // Trop de requêtes → bloqué temporairement
      return new NextResponse("Too Many Requests", {
        status: 429,
        headers: {
          "Retry-After": "60",
          "Cache-Control": "no-store",
        },
      });
    }

    // Si suspect par le rate + pas un bot légitime → vérification supplémentaire
    if (rateResult.suspect && !isAllowedSearchBot(ua)) {
      const suspicionScore = isSuspiciousRequest(request, ua);
      if (suspicionScore >= 5) {
        return new NextResponse(null, {
          status: 403,
          headers: { "Cache-Control": "no-store" },
        });
      }
    }
  }

  // --- ÉTAPE 6 : Détection comportementale pour non-bots suspects ---
  if (!isAllowedSearchBot(ua)) {
    const suspicionScore = isSuspiciousRequest(request, ua);
    // Score très élevé = quasi-certain que c'est un bot déguisé
    if (suspicionScore >= 8) {
      return new NextResponse(null, {
        status: 403,
        headers: { "Cache-Control": "no-store" },
      });
    }
  }

  // --- ÉTAPE 7 : Rate limit les bots légitimes (Google, Bing) ---
  if (isAllowedSearchBot(ua) && ip !== "unknown") {
    const botRateData = rateMap.get(`bot_${ip}`);
    const now = Date.now();
    if (!botRateData || now - botRateData.windowStart > 60_000) {
      rateMap.set(`bot_${ip}`, { count: 1, windowStart: now });
    } else {
      botRateData.count++;
      // Max 10 requêtes par minute pour les bots légitimes
      if (botRateData.count > 10) {
        return new NextResponse(null, {
          status: 429,
          headers: { "Retry-After": "120" },
        });
      }
    }
  }

  // --- ÉTAPE 8 : Protection des routes API de scraping ---
  if (
    pathname.startsWith("/api/scrapeauto") ||
    pathname.startsWith("/api/scrapeul")
  ) {
    const secret = request.headers.get("x-cron-secret");
    if (secret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  // --- RÉPONSE NORMALE avec headers de sécurité ---
  const response = NextResponse.next();
  response.headers.set("X-Robots-Tag", "noai, noimageai");
  response.headers.set("X-Content-Type-Options", "nosniff");
  return response;
}

// Matcher — s'applique à toutes les routes sauf les assets statiques
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|logo.png|images/|robots.txt|sitemap).*)",
  ],
};
