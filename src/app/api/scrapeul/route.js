import { NextResponse } from "next/server";
import puppeteer from 'puppeteer';

// Fonction pour ajouter un délai (si nécessaire, sinon tu peux la supprimer)
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export async function POST(req) {
  console.log("📥 Requête reçue dans /api/scrapeul");

  try {
    // Utiliser directement l'URL dans le code
    const url = "https://victorian-novel-house.fr/oeuvres/omniscient-readers-viewpoint";
    console.log("🧠 URL cible :", url);

    // Lancer Puppeteer pour récupérer le contenu de la page
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'domcontentloaded' });

    // Récupérer tout le contenu HTML de la page
    const pageContent = await page.content();
    console.log("🎯 Contenu complet de la page : ", pageContent);

    // Retourner tout le HTML récupéré (optionnel si tu veux l'analyser)
    await browser.close();

    return NextResponse.json({ message: "Scraping réussi", content: pageContent });

  } catch (error) {
    console.error("❌ Erreur de scraping :", error);
    return NextResponse.json(
      { message: "Erreur pendant le scraping.", error: error.message },
      { status: 500 }
    );
  }
}
