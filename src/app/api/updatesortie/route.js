// app/api/updatesortie/route.js

import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  return NextResponse.json({ message: "✅ L'API répond correctement en GET." });
}

export async function POST(req) {
    try {
      const body = await req.json(); // <– Récupère le body envoyé par Strapi
      console.log("📦 Données reçues de Strapi :", body);
    } catch (err) {
      console.warn("❌ Aucune donnée JSON envoyée (pas grave si Webhook)", err);
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
    const res = await fetch(`${apiUrl}/graphql`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(graphqlQuery),
    });

    const data = await res.json();

    if (data.errors) {
      console.error("GraphQL Error :", data.errors);
      return NextResponse.json({ error: "Erreur GraphQL", details: data.errors }, { status: 500 });
    }

    const oeuvres = data.data.oeuvres.filter(o => o.chapitres?.length > 0);

    const filePath = path.join(process.cwd(), "public", "data", "sorties-du-jour.json");
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(oeuvres, null, 2), "utf-8");

    return NextResponse.json({
      message: "✅ Fichier JSON mis à jour avec succès.",
      total: oeuvres.length,
    });
  } catch (error) {
    console.error("Erreur serveur :", error);
    return NextResponse.json({ error: "Erreur serveur", details: error.message }, { status: 500 });
  }
}
