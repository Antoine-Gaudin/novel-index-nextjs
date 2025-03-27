import fs from "fs";
import path from "path";

export default async function handler(req, res) {
  // ✅ Accès GET depuis le navigateur pour tester
  if (req.method === "GET") {
    return res.status(200).json({ message: "✅ L'API répond correctement en GET." });
  }

  // ✅ Seulement accepter les requêtes POST pour traitement webhook
  if (req.method !== "POST") {
    return res.status(405).json({ error: "❌ Méthode non autorisée. Utilisez POST." });
  }

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
    `,
  };

  try {
    const response = await fetch(`${apiUrl}/graphql`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(graphqlQuery),
    });

    const result = await response.json();

    if (result.errors) {
      console.error("GraphQL Error :", result.errors);
      return res.status(500).json({ error: "Erreur GraphQL", details: result.errors });
    }

    const oeuvres = result.data.oeuvres.filter(o => o.chapitres?.length > 0);

    const filePath = path.join(process.cwd(), "public", "data", "sorties-du-jour.json");
    fs.writeFileSync(filePath, JSON.stringify(oeuvres, null, 2), "utf-8");

    return res.status(200).json({
      message: "✅ Fichier sorties-du-jour.json mis à jour avec succès.",
      total: oeuvres.length,
    });
  } catch (error) {
    console.error("❌ Erreur côté serveur :", error);
    return res.status(500).json({ error: "Erreur interne serveur", details: error.message });
  }
}
