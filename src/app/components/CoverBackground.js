"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";

const CoverBackground = () => {
  const [covers, setCovers] = useState([]);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    const fetchCovers = async () => {
      try {
        const res = await fetch(
          `${apiUrl}/api/oeuvres?populate=couverture&pagination[limit]=30`
        );
        const data = await res.json();
        const filtered = (data.data || [])
          .filter((o) => o.couverture?.url)
          .map((o) => ({
            id: o.id,
            url: o.couverture.url.startsWith("http")
              ? o.couverture.url
              : `${apiUrl}${o.couverture.url}`,
          }));

        // Dupliquer pour remplir ~50 cellules
        let allCovers = [...filtered];
        while (allCovers.length < 50 && filtered.length > 0) {
          allCovers = [...allCovers, ...filtered];
        }
        setCovers(allCovers.slice(0, 50));
      } catch (err) {
        console.error("Erreur chargement couvertures:", err);
      }
    };

    fetchCovers();
  }, [apiUrl]);

  if (covers.length === 0) return null;

  return (
    <div className="absolute inset-0 z-0 overflow-hidden">
      <div className="grid grid-cols-5 md:grid-cols-8 lg:grid-cols-10 gap-1 w-full h-full">
        {covers.map((cover, index) => (
          <motion.div
            key={`${cover.id}-${index}`}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              delay: index * 0.05,
              duration: 0.4,
              ease: "easeOut",
            }}
            className="aspect-[2/3] overflow-hidden"
          >
            <img
              src={cover.url}
              alt=""
              loading="lazy"
              className="w-full h-full object-cover"
            />
          </motion.div>
        ))}
      </div>
      {/* Overlay gradient sombre */}
      <div className="absolute inset-0 bg-gradient-to-b from-gray-900/70 via-gray-900/80 to-gray-900/95" />
    </div>
  );
};

export default CoverBackground;
