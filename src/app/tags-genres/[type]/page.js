"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { slugify } from "@/utils/slugify";

export default function TagsGenresListPage() {
  const { type } = useParams(); // "tag" ou "genre"
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const observerRef = useRef(null);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const PAGE_SIZE = 25;
  


  const fetchData = async (reset = false) => {
    try {
      const start = reset ? 0 : page * PAGE_SIZE;

      const res = await fetch(
        `${apiUrl}/api/${type === "tag" ? "tags" : "genres"}?pagination[start]=${start}&pagination[limit]=${PAGE_SIZE}&filters[titre][$containsi]=${encodeURIComponent(search)}`
      );
      const data = await res.json();
      const results = data.data || [];

      if (results.length < PAGE_SIZE) {
        setHasMore(false);
      }

      setItems((prev) =>
        reset ? results : [...prev, ...results.filter((r) => !prev.some((i) => i.id === r.id))]
      );
    } catch (err) {
      console.error("Erreur chargement :", err);
    }
  };

  // Initial load + search reset
  useEffect(() => {
    setPage(0);
    setHasMore(true);
    setItems([]);
    fetchData(true);
  }, [type, search]);

  // Load more on scroll
  useEffect(() => {
    if (page === 0) return;
    fetchData();
  }, [page]);

  // Scroll observer
  useEffect(() => {
    if (!hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setPage((prev) => prev + 1);
        }
      },
      { threshold: 1 }
    );

    const el = observerRef.current;
    if (el) observer.observe(el);

    return () => {
      if (el) observer.unobserve(el);
    };
  }, [hasMore]);

  return (
    <div className="p-6 bg-gray-900 min-h-screen text-white">
      <h1 className="text-3xl font-bold mb-6 capitalize">
        Liste des {type === "tag" ? "tags" : "genres"}
      </h1>

      <input
        type="text"
        placeholder={`Rechercher un ${type === "tag" ? "tag" : "genre"}...`}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full mb-6 p-3 rounded bg-gray-800 border border-gray-600 text-white"
      />

      <table className="w-full text-left bg-gray-800 rounded-lg overflow-hidden">
        <thead className="bg-gray-700 text-sm uppercase text-gray-300">
          <tr>
            <th className="px-4 py-3">Titre</th>
            <th className="px-4 py-3">Description</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id}
            className="border-t border-gray-700 hover:bg-gray-700 cursor-pointer"
            onClick={() =>
                window.open(`/tags-genres/${type}/${slugify(item.titre)}`, "_blank")
              }
              >
              <td className="px-4 py-3 font-medium">{item.titre}</td>
              <td className="px-4 py-3 text-sm text-gray-300">
                {item.description || <em className="text-gray-500">Aucune description</em>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div ref={observerRef} className="h-10 w-full" />
    </div>
  );
}
