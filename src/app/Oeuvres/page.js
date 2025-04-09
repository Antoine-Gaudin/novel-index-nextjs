"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import FiltreOeuvres from "@/app/components/FiltreOeuvres";

export default function Oeuvres() {
  const [oeuvres, setOeuvres] = useState([]);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [queryFiltres, setQueryFiltres] = useState("");
  const [totalOeuvres, setTotalOeuvres] = useState(0);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const router = useRouter();
  const pageSize = 12;
  const [pageJump, setPageJump] = useState("");
  const [filtrerNouveautes, setFiltrerNouveautes] = useState(false);

  const fetchOeuvres = async () => {
    setLoading(true);
    try {
      const start = page * pageSize;

      const res = await fetch(
        `${apiUrl}/api/oeuvres?populate=couverture&pagination[start]=${start}&pagination[limit]=${pageSize}&${queryFiltres}`
      );

      const data = await res.json();
      const results = data.data || [];

      const total = data.meta?.pagination?.total || 0;
      setTotalOeuvres(total);

      // 🔥 Correction ici : on remplace l'empilement par un set direct
      setOeuvres(results);
    } catch (error) {
      console.error("Erreur lors du chargement des œuvres :", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOeuvres();
  }, [queryFiltres, page]);

  const handleOeuvreClick = (oeuvre) => {
    const slug = oeuvre.titre
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    router.push(`/oeuvre/${oeuvre.documentId}-${slug}`);
  };

  const handleFilterChange = (filtres) => {
    const params = [];

    if (filtres.categorie)
      params.push(`filters[categorie][$eq]=${encodeURIComponent(filtres.categorie)}`);
    if (filtres.langage)
      params.push(`filters[langage][$eq]=${encodeURIComponent(filtres.langage)}`);
    if (filtres.etat)
      params.push(`filters[etat][$eq]=${encodeURIComponent(filtres.etat)}`);
    if (filtres.type)
      params.push(`filters[type][$eq]=${encodeURIComponent(filtres.type)}`);
    if (filtres.annee)
      params.push(`filters[annee][$eq]=${encodeURIComponent(filtres.annee)}`);
    if (filtres.licence !== "")
      params.push(`filters[licence][$eq]=${filtres.licence}`);
    if (filtres.traduction)
      params.push(`filters[traduction][$containsi]=${encodeURIComponent(filtres.traduction)}`);
    if (filtres.tags.length > 0) {
      params.push(`filters[tags][titre][$in]=${filtres.tags.map(encodeURIComponent).join(",")}`);
    }
    if (filtres.genres.length > 0) {
      params.push(`filters[genres][titre][$in]=${filtres.genres.map(encodeURIComponent).join(",")}`);
    }


  // ➕ filtre nouveauté du mois
 if (filtres.nouveautes) {
    const now = new Date();
    const premierDuMois = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    params.push(`filters[createdAt][$gte]=${encodeURIComponent(premierDuMois)}`);
  }

    setQueryFiltres(params.join("&"));
    setPage(0); // reset à la première page si on change les filtres
  };

  return (
    <div className="bg-gray-900 text-white p-8 min-h-screen">
      <h2 className="text-3xl font-bold mb-6">Liste des œuvres</h2>

      <FiltreOeuvres onFilterChange={handleFilterChange} />

      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {oeuvres.map((oeuvre) => (
          <div
            key={oeuvre.id}
            className="relative bg-gray-800 rounded-lg shadow-lg overflow-hidden cursor-pointer"
            onClick={() => handleOeuvreClick(oeuvre)}
          >
            {oeuvre.couverture?.url ? (
              <div
                className="h-48 sm:h-64 bg-cover bg-center"
                style={{
                  backgroundImage: `url('${oeuvre.couverture.url}')`,
                }}
              ></div>
            ) : (
              <div className="h-48 sm:h-64 bg-gray-700 flex items-center justify-center text-gray-400">
                Pas de couverture
              </div>
            )}

            <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black via-gray-900 opacity-90 px-4 py-2">
              <div className="flex space-x-2 mb-2">
                <span className="bg-black bg-opacity-70 text-white px-2 py-0.5 text-xs sm:text-sm rounded">
                  {oeuvre.type || "Type non spécifié"}
                </span>
                <span className="bg-black bg-opacity-70 text-white px-2 py-0.5 text-xs sm:text-sm rounded">
                  {oeuvre.categorie || "Catégorie non spécifiée"}
                </span>
              </div>
              <p className="font-bold text-sm sm:text-base md:text-lg text-white truncate">
                {oeuvre.titre || "Titre non disponible"}
              </p>
            </div>
          </div>
        ))}
      </div>

      {totalOeuvres > 0 && (
  <div className="mt-10 text-center space-y-6">
    <p className="text-sm text-gray-300">
      Il y a un total de <span className="font-bold">{totalOeuvres}</span> œuvre{totalOeuvres > 1 ? "s" : ""}
    </p>

    {/* PAGINATION NUMÉROTÉE */}
    <div className="flex flex-wrap justify-center gap-2">
      <button
        disabled={page === 0}
        onClick={() => setPage((p) => Math.max(0, p - 1))}
        className="px-3 py-1 bg-gray-700 rounded disabled:opacity-40"
      >
        ⬅ Précédent
      </button>

      {(() => {
        const totalPages = Math.ceil(totalOeuvres / pageSize);
        const pages = [];
        const middleStart = Math.max(1, page - 4);
        const middleEnd = Math.min(totalPages - 4, page + 4);

        // Début toujours visible
        pages.push(
          <button
            key="first-0"
            onClick={() => setPage(0)}
            className={`px-3 py-1 rounded ${
              page === 0 ? "bg-indigo-600 text-white" : "bg-gray-700 hover:bg-gray-600 text-white"
            }`}
          >
            1
          </button>
        );

        if (middleStart > 1) {
          pages.push(<span key="start-ellipsis" className="px-2 text-gray-500">...</span>);
        }

        for (let i = middleStart; i <= middleEnd; i++) {
          if (i !== 0 && i !== totalPages - 1) {
            pages.push(
              <button
              key={`middle-${i}`}
                onClick={() => setPage(i)}
                className={`px-3 py-1 rounded ${
                  i === page ? "bg-indigo-600 text-white" : "bg-gray-700 hover:bg-gray-600 text-white"
                }`}
              >
                {i + 1}
              </button>
            );
          }
        }

        if (middleEnd < totalPages - 4) {
          pages.push(<span key="end-ellipsis" className="px-2 text-gray-500">...</span>);
        }

        // Fin toujours visible
        for (let i = totalPages - 3; i < totalPages; i++) {
          if (i > middleEnd) {
            pages.push(
              <button
              key={`last-${i}`}
                onClick={() => setPage(i)}
                className={`px-3 py-1 rounded ${
                  i === page ? "bg-indigo-600 text-white" : "bg-gray-700 hover:bg-gray-600 text-white"
                }`}
              >
                {i + 1}
              </button>
            );
          }
        }

        return pages;
      })()}

      <button
        disabled={(page + 1) * pageSize >= totalOeuvres}
        onClick={() => setPage((p) => p + 1)}
        className="px-3 py-1 bg-gray-700 rounded disabled:opacity-40"
      >
        Suivant ➡
      </button>
    </div>

    {/* BARRE POUR SAUTER À UNE PAGE */}
    <div className="flex justify-center items-center gap-2 mt-4">
      <input
        type="number"
        placeholder="Page..."
        min={1}
        max={Math.ceil(totalOeuvres / pageSize)}
        value={pageJump}
        onChange={(e) => setPageJump(e.target.value)}
        className="w-24 px-3 py-1 rounded bg-gray-700 text-white text-center"
      />
      <button
        onClick={() => {
          const val = parseInt(pageJump);
          if (!isNaN(val) && val >= 1 && val <= Math.ceil(totalOeuvres / pageSize)) {
            setPage(val - 1);
            setPageJump("");
          }
        }}
        className="px-4 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-500"
      >
        Rechercher
      </button>
    </div>

  </div>
)}

    </div>
  );
}
