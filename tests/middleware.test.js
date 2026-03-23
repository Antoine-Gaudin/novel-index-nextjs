import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock NextResponse before importing middleware
vi.mock("next/server", () => {
  class MockNextResponse {
    constructor(body, init = {}) {
      this.body = body;
      this.status = init.status || 200;
      this.headers = new Map(Object.entries(init.headers || {}));
    }
  }
  MockNextResponse.next = () => {
    const res = new MockNextResponse(null, { status: 200 });
    res.headers = new Map();
    res.headers.set = res.headers.set.bind(res.headers);
    return res;
  };
  MockNextResponse.json = (body, init = {}) => new MockNextResponse(JSON.stringify(body), init);
  return { NextResponse: MockNextResponse };
});

const { middleware } = await import("../middleware.js");

function makeRequest({ ua = "Mozilla/5.0", ip = "1.2.3.4", pathname = "/", headers = {} } = {}) {
  const allHeaders = {
    "user-agent": ua,
    "x-forwarded-for": ip,
    "accept-language": "fr-FR",
    accept: "text/html",
    "sec-fetch-mode": "navigate",
    "sec-ch-ua": '"Chromium"',
    ...headers,
  };
  return {
    headers: {
      get: (key) => allHeaders[key.toLowerCase()] ?? null,
    },
    nextUrl: { pathname },
  };
}

describe("middleware", () => {
  describe("blocage user-agent", () => {
    it("bloque GPTBot", () => {
      const res = middleware(makeRequest({ ua: "GPTBot/1.0" }));
      expect(res.status).toBe(403);
    });

    it("bloque claudebot", () => {
      const res = middleware(makeRequest({ ua: "claudebot" }));
      expect(res.status).toBe(403);
    });

    it("bloque semrushbot", () => {
      const res = middleware(makeRequest({ ua: "SemrushBot/7" }));
      expect(res.status).toBe(403);
    });

    it("bloque les scrapers python-requests", () => {
      const res = middleware(makeRequest({ ua: "python-requests/2.28" }));
      expect(res.status).toBe(403);
    });

    it("bloque wget", () => {
      const res = middleware(makeRequest({ ua: "Wget/1.21" }));
      expect(res.status).toBe(403);
    });

    it("bloque un user-agent vide", () => {
      const res = middleware(makeRequest({ ua: "" }));
      expect(res.status).toBe(403);
    });
  });

  describe("blocage IP OpenAI", () => {
    it("bloque une IP dans les plages OpenAI", () => {
      const res = middleware(makeRequest({ ip: "20.15.100.50" }));
      expect(res.status).toBe(403);
    });

    it("laisse passer une IP normale", () => {
      const res = middleware(makeRequest({ ip: "88.120.45.67" }));
      expect(res.status).toBe(200);
    });
  });

  describe("bots légitimes", () => {
    it("laisse passer Googlebot", () => {
      const res = middleware(makeRequest({ ua: "Googlebot/2.1 (+http://www.google.com/bot.html)" }));
      expect(res.status).toBe(200);
    });

    it("laisse passer Bingbot", () => {
      const res = middleware(makeRequest({ ua: "Mozilla/5.0 (compatible; bingbot/2.0)" }));
      expect(res.status).toBe(200);
    });
  });

  describe("navigateurs normaux", () => {
    it("laisse passer Chrome", () => {
      const res = middleware(makeRequest({ ua: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0" }));
      expect(res.status).toBe(200);
    });

    it("ajoute les headers de sécurité à la réponse", () => {
      const res = middleware(makeRequest());
      expect(res.headers.get("X-Robots-Tag")).toBe("noai, noimageai");
      expect(res.headers.get("X-Content-Type-Options")).toBe("nosniff");
    });
  });

  describe("protection API scrape", () => {
    it("refuse l'accès à /api/scrapeauto sans secret", () => {
      const res = middleware(makeRequest({ pathname: "/api/scrapeauto" }));
      expect(res.status).toBe(401);
    });

    it("refuse l'accès avec un mauvais secret", () => {
      const res = middleware(makeRequest({
        pathname: "/api/scrapeauto",
        headers: { "x-cron-secret": "wrong" },
      }));
      expect(res.status).toBe(401);
    });
  });

  describe("détection comportementale", () => {
    it("bloque un UA suspect sans headers standard", () => {
      const res = middleware(makeRequest({
        ua: "bot-scraper",
        headers: {
          "user-agent": "bot-scraper",
          "x-forwarded-for": "10.0.0.1",
          // Pas d'accept-language, accept, sec-fetch-mode, sec-ch-ua
        },
      }));
      expect(res.status).toBe(403);
    });
  });
});
