const fetch = require('node-fetch');

async function getDynamicRoutes() {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/oeuvres`); // Endpoint Strapi
  const oeuvres = await response.json();

  return oeuvres.map((oeuvre) => `/oeuvre/${oeuvre.documentId}-${oeuvre.slug}`);
}

module.exports = async () => {
  const dynamicRoutes = await getDynamicRoutes();

  return {
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://www.novel-index.com',
    generateRobotsTxt: true, // Générer aussi un robots.txt
    additionalPaths: async (config) =>
      dynamicRoutes.map((route) => ({
        loc: route,
        changefreq: 'daily',
        priority: 0.8,
      })),
  };
};
