"use client"; // Nécessaire pour Next.js 14

import { useState } from "react";

export default function JsonSorter() {
  const [jsonData, setJsonData] = useState("");
  const [sortedData, setSortedData] = useState([]);
  const [filterChapId, setFilterChapId] = useState("");
  const [copySuccess, setCopySuccess] = useState(false);

  // Fonction pour trier les données JSON par `chap_id`
  const handleSort = () => {
    try {
      let parsedData = JSON.parse(jsonData);

      if (!Array.isArray(parsedData)) {
        alert("Le JSON doit être un tableau !");
        return;
      }

      // Filtrer par `chap_id` si une valeur est entrée
      let filteredData = parsedData;
      if (filterChapId) {
        filteredData = parsedData.filter(
          (item) => item.chap_id == filterChapId
        );
      }

      // Trier par `chap_id` en ordre croissant
      const sorted = [...filteredData].sort((a, b) => a.chap_id - b.chap_id);

      setSortedData(sorted);
      setCopySuccess(false); // Réinitialiser l'état du bouton copier
    } catch (error) {
      alert("JSON invalide !");
    }
  };

  // Fonction pour copier les résultats triés
  const handleCopy = () => {
    if (sortedData.length === 0) return;

    const textToCopy = sortedData
      .map((item) => `Chapitre ${item.chapitre} ; Tome ${item.tome} ; ${item.lien}`)
      .join("\n");

    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000); // Réinitialisation après 2 secondes
    });
  };

  return (
    <div className="flex flex-col items-center p-5">
      <h1 className="text-2xl font-bold mb-4">Trier un JSON par `chap_id`</h1>

      {/* Zone de texte pour coller le JSON */}
      <textarea
        className="w-full h-40 p-2 border rounded mb-4 bg-gray-800 text-white"
        placeholder="Collez votre JSON ici..."
        value={jsonData}
        onChange={(e) => setJsonData(e.target.value)}
      />

      {/* Filtrer par chap_id */}
      <input
        className="border p-2 rounded mb-4 bg-gray-800 text-white"
        placeholder="Entrez un chap_id (facultatif)"
        value={filterChapId}
        onChange={(e) => setFilterChapId(e.target.value)}
      />

      {/* Boutons pour Trier et Copier */}
      <div className="flex gap-4">
        <button
          className="bg-blue-500 text-white px-4 py-2 rounded"
          onClick={handleSort}
        >
          Trier par chap_id
        </button>
        
        {sortedData.length > 0 && (
          <button
            className="bg-green-500 text-white px-4 py-2 rounded"
            onClick={handleCopy}
          >
            {copySuccess ? "✅ Copié !" : "📋 Copier"}
          </button>
        )}
      </div>

      {/* Affichage des résultats triés sous forme de texte lisible */}
      <div className="w-full mt-4">
        {sortedData.length > 0 ? (
          <div className="text-white bg-gray-900 p-4 rounded">
            {sortedData.map((item, index) => (
              <p key={index} className="mb-2">
                <span className="text-green-400 font-semibold">
                  Chapitre {item.chapitre} ; Tome {item.tome} ;
                </span>{" "}
                <a
                  href={item.lien}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:underline"
                >
                  {item.lien}
                </a>
              </p>
            ))}
          </div>
        ) : (
          <p className="text-gray-400">Les données triées apparaîtront ici...</p>
        )}
      </div>
    </div>
  );
}
