import { NextResponse } from "next/server";
import * as cheerio from "cheerio";

// Fonction pour introduire un délai
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export async function POST(req) {
    console.log("📥 Requête reçue dans /api/scrape");
  
    try {
      const body = await req.json();
      console.log("🧠 Corps reçu :", body);
  
      const url = body.url;
      if (!url) {
        return NextResponse.json({ message: "URL manquante." }, { status: 400 });
      }
  
      // Ajouter un délai de 2 à 3 secondes (choisir entre 2000ms et 3000ms)
      console.log("⌛ Attente de 2 à 3 secondes avant de scrapper...");
      await delay(Math.floor(Math.random() * 1000) + 2000);  // Délai aléatoire entre 2000ms et 3000ms
  
      // Récupération du HTML de l'URL
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
