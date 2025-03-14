  export async function POST(req) {
    try {
      const { oeuvre } = await req.json();
  
      if (!oeuvre) {
        return new Response(JSON.stringify({ error: "Donnée invalide" }), { status: 400 });
      }
  

      const STRAPI_TOKEN = "c356ed5764de60851fd2aa5403f27e3ea359c71623bcdf01ab77bdd3d10728b5bac448a3f7b5a64bcafac7d8789bbc37526f60ca149401df54f1ead0f9573786434109e8b4da06cab1fb3b84cb8a8c21da7c3e6bce8d50fe00ea426bdcccbb3e274c62d04a6a6cf3fba8ebba10e599f5c20d4424bb8e139ff94d4ee857a61a2c";
  
      await delay(500); // Ajoute un délai de 500ms entre chaque requête
  
      const response = await fetch(`https://novel-index-strapi.onrender.com/api/oeuvres`, {
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
            nameurl: oeuvre.id.toString(),
          },
        }),
      });
  
      const data = await response.json();
  
      return new Response(JSON.stringify({ success: true, data }), { status: 200 });
    } catch (error) {
      console.error("Erreur d'import :", error);
      return new Response(JSON.stringify({ error: "Erreur serveur" }), { status: 500 });
    }
  }
  