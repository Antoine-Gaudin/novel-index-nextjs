"use client";

import { useState } from "react";
import SortieJours from "./components/SortieJours";
import SortieOeuvre from "./components/SortieOeuvre";
import OeuvresParTeam from "./components/OeuvresParTeam";
import { useRouter } from "next/navigation"; // Import du router pour la redirection

export default function Home() {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const router = useRouter(); // Ajoute cette ligne !



  return (
    <div>
      {/* Hero Header */}
      <div
        className="relative h-screen w-full bg-cover bg-center"
        style={{
          backgroundImage: `url('/images/heroheader.webp')`,
          backgroundAttachment: "fixed",
        }}
      >
        {/* Overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-50"></div>

        {/* Content */}
        <div className="absolute inset-0 flex flex-col justify-center items-center text-center text-white px-4">
          <h1 className="text-5xl md:text-6xl font-bold mb-4">
            Bienvenue sur Novel-Index
          </h1>
          <p className="text-lg md:text-2xl mb-6">
            Explorez et découvrez notre univers.
          </p>
          <button
  onClick={() => router.push("/Oeuvres")}
  className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-md text-lg font-semibold transition"
>
  Découvrir les Œuvres
</button>
        </div>

        {/* Dégradé en bas du Hero Header */}
        <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-b from-transparent to-gray-900"></div>
      </div>

      {/* Contenu suivant */}
      <SortieJours />
      <SortieOeuvre />
</div>
  );
}
