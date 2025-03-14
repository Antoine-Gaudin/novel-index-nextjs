"use client";

import { useState } from "react";

export default function ImportPage() {
  const [file, setFile] = useState(null);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) {
      setMessage("❌ Veuillez sélectionner un fichier JSON.");
      return;
    }

    setIsUploading(true);
    setProgress(0);

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const oeuvres = JSON.parse(e.target.result);
        const totalOeuvres = oeuvres.length;

        for (let i = 0; i < totalOeuvres; i++) {
          await fetch("/api/import-oeuvres", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ oeuvre: oeuvres[i] }),
          });

          // Mise à jour de la barre de progression
          setProgress(((i + 1) / totalOeuvres) * 100);
          await new Promise((resolve) => setTimeout(resolve, 500)); // Délai de 500ms entre chaque requête
        }

        setMessage(`✅ Importation réussie ! ${totalOeuvres} œuvres ajoutées.`);
      } catch (error) {
        setMessage("❌ Erreur : Format JSON invalide.");
      } finally {
        setIsUploading(false);
      }
    };

    reader.readAsText(file);
  };

  return (
    <div className="p-6 max-w-lg mx-auto">
      <h1 className="text-xl font-bold mb-4">Importer des Œuvres</h1>
      <input type="file" accept="application/json" onChange={handleFileChange} />
      <button
        onClick={handleUpload}
        className="bg-blue-500 text-white px-4 py-2 rounded"
        disabled={isUploading}
      >
        {isUploading ? "Importation en cours..." : "Importer"}
      </button>

      {/* Barre de progression */}
      {isUploading && (
        <div className="mt-4 w-full bg-gray-200 rounded">
          <div
            className="bg-blue-500 text-xs text-center text-white p-1 rounded"
            style={{ width: `${progress}%` }}
          >
            {Math.round(progress)}%
          </div>
        </div>
      )}

      {message && <p className="mt-4">{message}</p>}
    </div>
  );
}
