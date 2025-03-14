export async function POST(req) {
    try {
      const { oeuvres } = await req.json();
  
      if (!oeuvres || !Array.isArray(oeuvres)) {
        return new Response(JSON.stringify({ error: "Format JSON incorrect" }), { status: 400 });
      }
  
      const API_URL = process.env.NEXT_PUBLIC_STRAPI_URL;
      const STRAPI_TOKEN = process.env.STRAPI_ADMIN_TOKEN;
  
      const results = [];
  
      for (const oeuvre of oeuvres) {
        const response = await fetch(`${API_URL}/api/oeuvres`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${STRAPI_TOKEN}`,
          },
          body: JSON.stringify({
            data: {
              titre: oeuvre.titre,
              auteur: oeuvre.auteur,
              categorie: oeuvre.categorie,
              etat: oeuvre.statut,
              teams: oeuvre.team,
              synopsis: oeuvre.synopsis,
              type: oeuvre.type,
              annee: parseInt(oeuvre.parution, 10) || null,
              nameurl: oeuvre.id.toString(), // Stocker l'ID temporairement ici
            },
          }),
        });
  
        const data = await response.json();
        results.push(data);
      }
  
      return new Response(JSON.stringify({ success: true, results }), { status: 200 });
    } catch (error) {
      console.error("Erreur d'import :", error);
      return new Response(JSON.stringify({ error: "Erreur serveur" }), { status: 500 });
    }
  }
  