import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET(req) {
    try {
        console.log("🚀 API appelée avec URL :", req.url);

        // Charger le fichier JSON
        const filePath = path.join(process.cwd(), "public", "data.json");
        
        console.log("📁 Chemin du fichier JSON :", filePath);

        if (!fs.existsSync(filePath)) {
            console.error("🚨 Fichier data.json introuvable !");
            return NextResponse.json({ error: "Fichier data.json introuvable" }, { status: 500 });
        }

        const fileContent = fs.readFileSync(filePath, "utf8");
        console.log("📂 Contenu brut du fichier JSON chargé !");

        const jsonData = JSON.parse(fileContent);
        console.log("✅ JSON analysé avec succès !");

        // Vérifier si la clé "data" existe
        if (!jsonData.data || !Array.isArray(jsonData.data)) {
            console.error("🚨 Erreur : La clé 'data' n'existe pas ou n'est pas un tableau !");
            return NextResponse.json({ error: "Format JSON invalide" }, { status: 500 });
        }

        console.log("📊 Nombre d'entrées dans 'data' :", jsonData.data.length);

        // Extraire le `chap_id` de la requête
        const { searchParams } = new URL(req.url);
        const chap_id = searchParams.get("chap_id");

        console.log("🔍 Recherche des chapitres avec chap_id =", chap_id);

        if (!chap_id) {
            console.log("❌ Aucun chap_id fourni");
            return NextResponse.json({ error: "Veuillez fournir un chap_id." }, { status: 400 });
        }

        // Filtrer les chapitres dans `jsonData.data`
        let results = jsonData.data.filter(item => item.chap_id?.toString() === chap_id.toString());

        console.log(`📌 ${results.length} chapitres trouvés pour chap_id=${chap_id}`);

        if (results.length === 0) {
            console.warn(`⚠ Aucun chapitre trouvé pour chap_id=${chap_id}`);
            return NextResponse.json([], { status: 200 });
        }

        // Trier les résultats par `time_chap` en ordre croissant
        results.sort((a, b) => new Date(a.time_chap) - new Date(b.time_chap));

        console.log("📊 Résultats après tri :", results);

        return NextResponse.json(results, { status: 200 });
    } catch (error) {
        console.error("🚨 Erreur dans l'API :", error);
        return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }
}
