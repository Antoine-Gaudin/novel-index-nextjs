"use client";

import { useState } from "react";

export default function ImportPage() {
  const [textData, setTextData] = useState("");
  const [message, setMessage] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    // Récupérer le token JWT de l'utilisateur connecté
    const jwt = localStorage.getItem("jwt");

    if (!jwt) {
      setMessage("❌ Vous devez être connecté pour ajouter une œuvre.");
      return;
    }

    if (!textData.trim()) {
      setMessage("❌ Le texte est vide.");
      return;
    }

    setIsUploading(true);
    setMessage("⏳ Importation en cours...");

    // Séparer les lignes et nettoyer les espaces/retours à la ligne
    const lines = textData.split(/\r?\n/).map(line => line.replace(/\s+/g, " ").trim()).filter(line => line !== "");
    
    let successCount = 0;
    let errors = [];

    for (let i = 0; i < lines.length; i++) {
      const parts = lines[i].split("|").map(part => part.trim());

      if (parts.length < 9) { 
        errors.push(`❌ Ligne ${i + 1} invalide : ${lines[i]}`);
        continue;
      }

      const oeuvre = {
        nameurl: parts[0],   // ID pour nameurl
        titre: parts[1],     // Titre
        auteur: parts[2],    // Auteur
        categorie: parts[3], // Catégorie
        etat: parts[4],      // Statut => etat
        teams: parts[5],     // Team => teams
        synopsis: parts[6],  // Synopsis
        annee: parseInt(parts[7], 10) || null, // Parution => annee
        type: parts[8],      // Type
      };

      try {
        const res = await fetch("https://novel-index-strapi.onrender.com/api/oeuvres", {  // ⬅️ Correction de l'URL
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${jwt}`, // ⬅️ Utilisation du JWT utilisateur
          },
          body: JSON.stringify({ data: oeuvre }),
        });

        const data = await res.json();

        if (res.ok) {
          successCount++;
        } else {
          errors.push(`❌ Erreur ligne ${i + 1} : ${data.error || "Réponse invalide de Strapi"}`);
        }
      } catch (error) {
        errors.push(`❌ Erreur serveur ligne ${i + 1}`);
      }

      await new Promise(resolve => setTimeout(resolve, 500)); // Délai pour éviter la surcharge de requêtes
    }

    setMessage(`✅ ${successCount} œuvres ajoutées avec succès.\n${errors.join("\n")}`);
    setIsUploading(false);
  };

  return (
    <div className="p-6 max-w-lg mx-auto">
      <h1 className="text-xl font-bold mb-4">Importer des Œuvres dans Strapi</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <textarea
  rows="10"
  className="border p-2 w-full text-black"
  placeholder="Collez vos œuvres ici..."
  value={textData}
  onChange={(e) => setTextData(e.target.value)}
  onPaste={(e) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text/plain").replace(/\n/g, " "); // Remplace les retours à la ligne par un espace
    setTextData(prev => prev + text);
  }}
  style={{ whiteSpace: "nowrap", overflowX: "scroll" }} // Empêche le retour à la ligne et active le scroll horizontal
/>

        <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded" disabled={isUploading}>
          {isUploading ? "Importation en cours..." : "Importer"}
        </button>

        {message && <pre className="mt-4 whitespace-pre-wrap">{message}</pre>}
      </form>
    </div>
  );
}
