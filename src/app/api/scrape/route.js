import { NextResponse } from "next/server";
import * as cheerio from "cheerio";

export async function POST(req) {
    console.log("📥 Requête reçue dans /api/scrape");
  
    try {
      const body = await req.json();
      console.log("🧠 Corps reçu :", body);
  
      const url = body.url;
      if (!url) {
        return NextResponse.json({ message: "URL manquante." }, { status: 400 });
      }
  
      const response = await fetch(url);
      const html = await response.text();
  
      const $ = cheerio.load(html);
      const links = [];
  
      $("a").each((_, el) => {
        const href = $(el).attr("href");
        const text = $(el).text().trim();
        if (href) {
          links.push({ href, text });
        }
      });
  
      return NextResponse.json({ links });
    } catch (error) {
      console.error("❌ Scraping error:", error);
      return NextResponse.json(
        { message: "Erreur pendant le scraping.", error: error.message },
        { status: 500 }
      );
    }
  }
  
