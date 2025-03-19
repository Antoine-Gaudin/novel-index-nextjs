const fetch = require('node-fetch');

async function getDynamicRoutes() {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/oeuvres`);
  const jsonResponse = await response.json();

  console.log("Réponse API Strapi :", jsonResponse); // 🔥 Vérification console

  const oeuvres = jsonResponse.data || []; // 🛠 Corrige la structure

  if (!Array.isArray(oeuvres)) {
    throw new Error("L'API ne retourne pas un tableau !");
  }

  return oeuvres.map((oeuvre) => `/oeuvre/${oeuvre.documentId}-${oeuvre.slug}`);
}

/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://www.novel-index.com', // Assure-toi que c'est bien défini
  generateRobotsTxt: true, // Génère robots.txt
  additionalPaths: async (config) => {
    const dynamicRoutes = await getDynamicRoutes();
    return dynamicRoutes.map((route) => ({
      loc: route,
      changefreq: 'daily',
      priority: 0.8,
    }));
  },
};
