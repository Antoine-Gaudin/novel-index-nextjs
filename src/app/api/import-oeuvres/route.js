export async function POST(req) {
    try {
      console.log("📩 Réception d'une requête d'importation...");
  
      const { oeuvre } = await req.json();
  
      if (!oeuvre) {
        console.log("❌ Donnée invalide reçue :", oeuvre);
        return new Response(JSON.stringify({ error: "Donnée invalide" }), { status: 400 });
      }
  
      console.log("✅ Données reçues :", JSON.stringify(oeuvre, null, 2));
  
      const STRAPI_TOKEN = "c356ed5764de60851fd2aa5403f27e3ea359c71623bcdf01ab77bdd3d10728b5bac448a3f7b5a64bcafac7d8789bbc37526f60ca149401df54f1ead0f9573786434109e8b4da06cab1fb3b84cb8a8c21da7c3e6bce8d50fe00ea426bdcccbb3e274c62d04a6a6cf3fba8ebba10e599f5c20d4424bb8e139ff94d4ee857a61a2c";
      const API_URL = "https://novel-index-strapi.onrender.com/api/oeuvres";
  
      await delay(500); // Ajoute un délai de 500ms entre chaque requête
  
      const payload = {
        data: {
          titre: oeuvre.titre || "Titre inconnu",
          auteur: oeuvre.auteur || "Auteur inconnu",
          traduction: oeuvre.traduction || "",
          synopsis: oeuvre.synopsis || "",
          annee: oeuvre.parution ? parseInt(oeuvre.parution, 10) : null,
          etat: oeuvre.statut || "Non défini",
          type: oeuvre.type || "Non défini",
          categorie: oeuvre.categorie || "Non spécifié",
          licence: oeuvre.licence || "",
          langage: oeuvre.langage || "",
          couverture: oeuvre.image || null, // Vérifier si c'est bien une URL ou un fichier
          teams: oeuvre.team || null,
          nameurl: oeuvre.titre_url || "nom-inconnu",
        },
      };
  
      console.log("📤 Données envoyées à Strapi :", JSON.stringify(payload, null, 2));
  
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${STRAPI_TOKEN}`,
        },
        body: JSON.stringify(payload),
      });
  
      const data = await response.json();
  
      console.log("📥 Réponse de Strapi :", JSON.stringify(data, null, 2));
  
      if (!response.ok) {
        console.error("❌ Erreur Strapi :", data);
        return new Response(JSON.stringify({ error: "Erreur avec Strapi", details: data }), { status: response.status });
      }
  
      return new Response(JSON.stringify({ success: true, data }), { status: 200 });
  
    } catch (error) {
      console.error("❌ Erreur d'importation :", error);
      return new Response(JSON.stringify({ error: "Erreur serveur", details: error.message }), { status: 500 });
    }
  }
  