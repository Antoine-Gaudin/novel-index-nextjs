"use client";

import { useState } from "react";

export default function ImportPage() {
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");

  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) {
      setMessage("❌ Veuillez sélectionner un fichier JSON.");
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const oeuvres = JSON.parse(e.target.result);
        const res = await fetch("/api/import-oeuvres", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ oeuvres }),
        });

        const data = await res.json();
        if (data.success) {
          setMessage(`✅ Importation réussie ! ${data.results.length} œuvres ajoutées.`);
        } else {
          setMessage(`❌ Erreur : ${data.error}`);
        }
      } catch (error) {
        setMessage("❌ Erreur : Format JSON invalide.");
      }
    };

    reader.readAsText(file);
  };

  return (
    <div className="p-6 max-w-lg mx-auto">
      <h1 className="text-xl font-bold mb-4">Importer des Œuvres</h1>
      <input type="file" accept="application/json" onChange={handleFileChange} />
      <button onClick={handleUpload} className="bg-blue-500 text-white px-4 py-2 rounded">
        Importer
      </button>
      {message && <p className="mt-4">{message}</p>}
    </div>
  );
}
