const fetch = require('node-fetch');

async function getDynamicRoutes() {
  const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/oeuvres`;
  console.log("URL API utilisée :", apiUrl);

  const response = await fetch(apiUrl);
  const jsonResponse = await response.json();

  console.log("Réponse API Strapi :", jsonResponse);

  const oeuvres = jsonResponse.data || [];

  if (!Array.isArray(oeuvres)) {
    throw new Error("L'API ne retourne pas un tableau !");
  }

  const urls = oeuvres.map((oeuvre) => {
    const documentId = oeuvre.documentId;
    let slug = oeuvre.titre ? oeuvre.titre.toLowerCase().replace(/\s+/g, '-') : "undefined"; // Remplacement des espaces par des "-"
    
    return `/oeuvre/${documentId}-${slug}`;
  });

  console.log("✅ URLs générées :", urls.slice(0, 5)); // Vérification des 5 premières URLs
  return urls;
}

/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://www.novel-index.com',
  generateRobotsTxt: true,
  additionalPaths: async (config) => {
    const dynamicRoutes = await getDynamicRoutes();

    console.log("🚀 URLs envoyées au sitemap :", dynamicRoutes.length);

    return dynamicRoutes.map((route) => ({
      loc: route,
      changefreq: "daily",
      priority: 0.8,
    }));
  },
};
