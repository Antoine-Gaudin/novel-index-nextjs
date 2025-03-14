"use client";

import { useEffect, useState } from "react";
import axios from "axios";

export default function ImportPage({ user }) {
  const [currentUser, setCurrentUser] = useState(user || null);
  const [textData, setTextData] = useState("");
  const [message, setMessage] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      if (!user) {  // Si user n'est pas en prop, on le récupère
        const jwt = localStorage.getItem("jwt");
        if (!jwt) {
          setMessage("❌ Vous devez être connecté pour importer des œuvres.");
          return;
        }

        try {
          const res = await axios.get("https://novel-index-strapi.onrender.com/api/users/me", {
            headers: {
              Authorization: `Bearer ${jwt}`,
            },
          });

          setCurrentUser(res.data);  // On stocke l'utilisateur récupéré
          console.log("✅ Utilisateur récupéré :", res.data);
        } catch (error) {
          console.error("❌ Erreur récupération utilisateur :", error);
          setMessage("❌ Impossible de récupérer votre profil.");
        }
      }
    };

    fetchUser();
  }, [user]); // Ne s'exécute qu'une fois si user n'est pas défini

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!currentUser || !currentUser.id) {
      setMessage("❌ Vous devez être connecté.");
      console.error("❌ ERREUR: user est undefined ou sans ID", currentUser);
      return;
    }

    const jwt = localStorage.getItem("jwt");
    if (!jwt) {
      setMessage("❌ Vous devez être connecté.");
      return;
    }

    if (!textData.trim()) {
      setMessage("❌ Le texte est vide.");
      return;
    }

    setIsUploading(true);
    setMessage("⏳ Importation en cours...");

    const lines = textData.split(/\r?\n/).map(line => line.trim()).filter(line => line !== "");
    
    let successCount = 0;
    let errors = [];

    for (let i = 0; i < lines.length; i++) {
      const parts = lines[i].split("|").map(part => part.trim());

      if (parts.length < 8) { 
        errors.push(`❌ Ligne ${i + 1} invalide : ${lines[i]}`);
        continue;
      }

      const oeuvre = {
        titre: parts[1],
        auteur: parts[2],
        categorie: parts[3],
        etat: parts[4],
        synopsis: parts[6],
        annee: parseInt(parts[7], 10) || null,
        type: parts[8],
        users_permissions_users: [currentUser?.documentId],
      };
      

      try {
        const response = await axios.post("https://novel-index-strapi.onrender.com/api/oeuvres", { data: oeuvre }, {
          headers: {
            "Authorization": `Bearer ${jwt}`,
            "Content-Type": "application/json",
          },
        });

        if (response.status === 200 || response.status === 201) {
          successCount++;
        } else {
          errors.push(`❌ Erreur ligne ${i + 1} : ${response.data.error || "Réponse invalide de Strapi"}`);
        }
      } catch (error) {
        console.error("❌ Erreur serveur ligne", i + 1, ":", error.response?.data || error.message);
        errors.push(`❌ Erreur serveur ligne ${i + 1}`);
      }

      await new Promise(resolve => setTimeout(resolve, 500));
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
            const text = e.clipboardData.getData("text/plain").replace(/\n/g, " ");
            setTextData(prev => prev + text);
          }}
          style={{ whiteSpace: "nowrap", overflowX: "scroll" }}
        />
        <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded" disabled={isUploading}>
          {isUploading ? "Importation en cours..." : "Importer"}
        </button>

        {message && <pre className="mt-4 whitespace-pre-wrap">{message}</pre>}
      </form>
    </div>
  );
}
