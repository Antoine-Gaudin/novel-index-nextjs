"use client"; // Nécessaire pour Next.js 14

import { useState } from "react";

export default function JsonSorter() {
  const [jsonData, setJsonData] = useState("");
  const [sortedData, setSortedData] = useState([]);
  const [filterChapId, setFilterChapId] = useState("");

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
    } catch (error) {
      alert("JSON invalide !");
    }
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

      {/* Bouton pour trier */}
      <button
        className="bg-blue-500 text-white px-4 py-2 rounded"
        onClick={handleSort}
      >
        Trier par chap_id
      </button>

      {/* Affichage des résultats triés avec fond sombre et texte lisible */}
      <pre className="w-full bg-gray-900 text-green-400 p-4 mt-4 rounded overflow-auto">
        {sortedData.length > 0
          ? JSON.stringify(sortedData, null, 2)
          : "Les données triées apparaîtront ici..."}
      </pre>
    </div>
  );
}
