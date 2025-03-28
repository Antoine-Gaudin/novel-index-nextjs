"use client";

import { useState } from "react";
import SortieJours from "./components/SortieJours";
import SortieOeuvre from "./components/SortieOeuvre";
import OeuvresParTeam from "./components/OeuvresParTeam";
import { useRouter } from "next/navigation"; // Import du router pour la redirection

export default function Home() {
  const [searchText, setSearchText] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const router = useRouter(); // Initialisation du router

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  const handleSearch = async () => {
    if (!searchText.trim()) return; // Évite les recherches vides
  
    try {
      const url = `${apiUrl}/api/oeuvres?filters[titre][$containsi]=${searchText}&populate=couverture`;
      const res = await fetch(url);
      const data = await res.json();
  
      if (!data || !data.data) throw new Error("Aucune donnée reçue");
  
  
      setSearchResults(data.data);
    } catch (error) {
      console.error("Erreur lors de la recherche :", error);
    }
  };
  

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const handleOeuvreClick = (oeuvre) => {
    const slug = oeuvre.titre
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-") // Remplace les caractères spéciaux par "-"
      .replace(/^-+|-+$/g, ""); // Supprime les tirets en trop
  
    router.push(`/oeuvre/${oeuvre.documentId}-${slug}`); // ✅ Nouvelle URL
  };

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
          <input
            type="text"
            placeholder="Rechercher une œuvre"
            className="px-4 py-2 rounded-md text-gray-900 focus:outline-none w-3/4 max-w-lg"
            onClick={() => setIsSearchOpen(true)}
          />
        </div>

        {/* Dégradé en bas du Hero Header */}
        <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-b from-transparent to-gray-900"></div>
      </div>

      {/* Contenu suivant */}
      <SortieJours />
      <SortieOeuvre />
      <OeuvresParTeam />

      {/* Recherche Plein Écran */}
      {isSearchOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex flex-col items-center justify-center">
          <div className="w-full max-w-2xl p-4">
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Rechercher une œuvre..."
              className="w-full px-4 py-3 rounded-md text-gray-900 focus:outline-none"
              autoFocus
            />
            <button
              onClick={handleSearch}
              className="mt-4 w-full bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md"
            >
              Rechercher
            </button>
          </div>

          <div className="mt-6 w-full max-w-2xl bg-gray-800 rounded-lg p-4 max-h-80 overflow-y-auto">
            {searchResults.length > 0 ? (
              <ul>
                {searchResults.map((oeuvre) => (
                  <li
                    key={oeuvre.id}
                    className="p-4 border-b border-gray-700 hover:bg-gray-700 cursor-pointer flex items-center"
                    onClick={() => handleOeuvreClick(oeuvre)} // Redirection au clic
                  >
             
                      <img
                        src={`${oeuvre.couverture.url}`}
                        alt={oeuvre.titre || "Image non disponible"}
                        className="w-16 h-16 object-cover rounded-md mr-4"
                      />
               
                    <div>
                      <h3 className="text-xl font-bold">
                        {oeuvre.titre || "Titre non disponible"}
                      </h3>
                      <p className="text-sm text-gray-400">
                        Auteur : {oeuvre.auteur || "Auteur non spécifié"}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-400 text-center">
                Aucun résultat pour cette recherche.
              </p>
            )}
          </div>

          <button
            onClick={() => setIsSearchOpen(false)}
            className="absolute top-4 right-4 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md"
          >
            Fermer
          </button>
        </div>
      )}
    </div>
  );
}
