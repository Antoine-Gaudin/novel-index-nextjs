// pages/api/update-sorties.js

export default async function handler(req, res) {
    if (req.method !== "POST") return res.status(405).end("Méthode non autorisée");
  
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    const today = new Date().toISOString().split("T")[0];
  
    const graphqlQuery = {
      query: `
        query {
          oeuvres(pagination: { limit: 100000 }) {
            documentId
            titre
            couverture { url }
            type
            traduction
            chapitres(
              filters: { updatedAt: { gte: "${today}T00:00:00.000Z" } }
              pagination: { limit: 1 }
              sort: "updatedAt:desc"
            ) {
              documentId
              titre
              updatedAt
            }
          }
        }
      `
    };
  
    try {
      const response = await fetch(`${apiUrl}/graphql`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(graphqlQuery),
      });
  
      const result = await response.json();
  
      if (result.errors) {
        console.error("GraphQL error:", result.errors);
        return res.status(500).json({ error: "GraphQL error" });
      }
  
      const oeuvres = result.data.oeuvres.filter(o => o.chapitres?.length > 0);
  
      // 💾 Sauvegarder localement dans /public/data/
      const fs = require("fs");
      const path = require("path");
      const filePath = path.join(process.cwd(), "public", "data", "sorties-du-jour.json");
  
      fs.writeFileSync(filePath, JSON.stringify(oeuvres, null, 2), "utf-8");
  
      res.status(200).json({ message: "Fichier mis à jour avec succès", total: oeuvres.length });
    } catch (error) {
      console.error("Erreur update-sorties:", error);
      res.status(500).json({ error: "Erreur lors de la génération du fichier" });
    }
  }
  