"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Oeuvres() {
  const [oeuvres, setOeuvres] = useState([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const router = useRouter();
  const pageSize = 50;

  const fetchOeuvres = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `${apiUrl}/api/oeuvres?populate=couverture&pagination[start]=${
          page * pageSize
        }&pagination[limit]=${pageSize}`
      );

      const data = await res.json();
      const results = data.data || [];

      if (results.length < pageSize) {
        setHasMore(false);
      }

      setOeuvres((prev) => [
        ...prev,
        ...results.filter((newItem) => !prev.some((item) => item.id === newItem.id)),
      ]);
    } catch (error) {
      console.error("Erreur lors du chargement des œuvres :", error);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setOeuvres([]);
    setPage(0);
    setHasMore(true);
  }, []);

  useEffect(() => {
    fetchOeuvres();
  }, [page]);

  const handleVoirPlus = () => {
    if (hasMore && !loading) {
      setPage((prev) => prev + 1);
    }
  };

  const handleOeuvreClick = (oeuvre) => {
    const slug = oeuvre.titre
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    router.push(`/oeuvre/${oeuvre.documentId}-${slug}`);
  };

  return (
    <div className="bg-gray-900 text-white p-8 min-h-screen">
      <h2 className="text-3xl font-bold mb-6">Liste des œuvres</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {oeuvres.map((oeuvre) => (
          <div
            key={oeuvre.id}
            className="relative bg-gray-800 rounded-lg shadow-lg overflow-hidden cursor-pointer"
            onClick={() => handleOeuvreClick(oeuvre)}
          >
            {oeuvre.couverture?.url ? (
              <div
                className="h-64 bg-cover bg-center"
                style={{
                  backgroundImage: `url('${oeuvre.couverture.url}')`,
                }}
              ></div>
            ) : (
              <div className="h-64 bg-gray-700 flex items-center justify-center text-gray-400">
                Pas de couverture
              </div>
            )}

            <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black via-gray-900 opacity-90 px-4 py-2">
              <div className="flex space-x-2 mb-2">
                <span className="bg-black bg-opacity-70 text-white px-3 py-1 text-sm rounded-md">
                  {oeuvre.type || "Type non spécifié"}
                </span>
                <span className="bg-black bg-opacity-70 text-white px-3 py-1 text-sm rounded-md">
                  {oeuvre.categorie || "Catégorie non spécifiée"}
                </span>
              </div>
              <p className="font-bold text-lg text-white">
                {oeuvre.titre || "Titre non disponible"}
              </p>
            </div>
          </div>
        ))}
      </div>

      {hasMore && (
        <div className="text-center mt-8">
          <button
            onClick={handleVoirPlus}
            className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-500 transition-all duration-200"
            disabled={loading}
          >
            {loading ? "Chargement..." : "Voir plus"}
          </button>
        </div>
      )}
    </div>
  );
}
