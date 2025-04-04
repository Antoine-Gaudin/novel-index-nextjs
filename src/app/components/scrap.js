const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  // Navigue vers la page
  await page.goto('https://victorian-novel-house.fr/oeuvres/omniscient-readers-viewpoint', {
    waitUntil: 'networkidle2', // Attend que le réseau soit inactif
  });

  // Attendre que l'élément "Chapitres" soit présent
  await page.waitForSelector('h3.volume-header', { visible: true });

  // Simuler le clic sur l'élément "Chapitres"
  await page.click('h3.volume-header');

  // Attendre que la liste des chapitres devienne visible
  await page.waitForSelector('ul.chapters-list', { visible: true });

  // Extraire les chapitres
  const chapters = await page.$$eval('ul.chapters-list li a', links => {
    return links.map(link => ({
      text: link.textContent.trim(),
      href: link.href,
    }));
  });

  console.log(chapters);

  await browser.close();
})();
