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

    // Attendre que les éléments <li> avec la classe 'chapter-item' soient visibles
    await page.waitForSelector('li.chapter-item', { timeout: 5000 });  // Attendre 5 secondes maximum

    // Récupérer tous les éléments <li> avec la classe 'chapter-item'
    const chapterItems = await page.evaluate(() => {
      const items = [];
      // Sélectionner tous les éléments <li> avec la classe 'chapter-item'
      const liElements = document.querySelectorAll('li.chapter-item');
      liElements.forEach((li) => {
        items.push({
          text: li.textContent.trim(),
        });
      });
      return items;
    });

    // Afficher les résultats dans la console
    console.log("🎯 Résultats du scraping : ", chapterItems);

    await browser.close();

    // Réponse pour indiquer que l'API a bien exécuté le scraping
    return NextResponse.json({ message: "Scraping réussi", data: chapterItems });

  } catch (error) {
    console.error("❌ Erreur de scraping :", error);
    return NextResponse.json(
      { message: "Erreur pendant le scraping.", error: error.message },
      { status: 500 }
    );
  }
}
