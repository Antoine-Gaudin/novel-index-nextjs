"use client";

import { useUser } from "../context/UserContext";
import { useRouter } from "next/navigation";
import { useState } from "react";

const Menu = () => {
  const { isLoggedIn, userProfilePicture } = useUser(); // ✅ Utilisation du contexte
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();

  return (
    <header className="bg-black bg-opacity-80 text-white py-4">
      <nav className="max-w-7xl mx-auto px-4 flex justify-between items-center">
        <h1 className="text-xl font-bold cursor-pointer hover:text-gray-400 transition duration-300" onClick={() => router.push("/")}>
          Novel-index
        </h1>
        <ul className="hidden md:flex space-x-4 items-center">
          <li>
            <a href="/" className="text-white font-bold hover:text-gray-400 transition duration-300">Accueil</a>
          </li>
          <li>
            <a href="/Oeuvres" className="text-white font-bold hover:text-gray-400 transition duration-300">Œuvres</a>
          </li>
          {isLoggedIn ? (
            <li>
              <a href="/Profil" className="block w-10 h-10 rounded-full overflow-hidden border-2 border-white hover:border-gray-400 transition duration-300">
                {userProfilePicture ? (
                  <img src={userProfilePicture} alt="Profil" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gray-700 flex items-center justify-center">
                    <span className="text-white text-lg font-bold">?</span>
                  </div>
                )}
              </a>
            </li>
          ) : (
            <>
              <li><a href="/Inscription" className="text-white font-bold hover:text-gray-400 transition duration-300">Inscription</a></li>
              <li><a href="/Connexion" className="text-white font-bold hover:text-gray-400 transition duration-300">Connexion</a></li>
            </>
          )}
        </ul>
        <button className="md:hidden text-white focus:outline-none" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? "✖" : "☰"}
        </button>
      </nav>

      {/* Menu mobile */}
      {menuOpen && (
        <ul className="md:hidden flex flex-col space-y-2 mt-2 px-4">
          <li><a href="/" className="block text-white font-bold hover:text-gray-400 transition duration-300">Accueil</a></li>
          <li><a href="/Oeuvres" className="block text-white font-bold hover:text-gray-400 transition duration-300">Œuvres</a></li>
          {isLoggedIn ? (
            <li>
              <a href="/Profil" className="block w-10 h-10 rounded-full overflow-hidden border-2 border-white hover:border-gray-400 transition duration-300">
                {userProfilePicture ? (
                  <img src={userProfilePicture} alt="Profil" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gray-700 flex items-center justify-center">
                    <span className="text-sm text-gray-400">?</span>
                  </div>
                )}
              </a>
            </li>
          ) : (
            <>
              <li><a href="/Inscription" className="block text-white font-bold hover:text-gray-400 transition duration-300">Inscription</a></li>
              <li><a href="/Connexion" className="block text-white font-bold hover:text-gray-400 transition duration-300">Connexion</a></li>
            </>
          )}
        </ul>
      )}
    </header>
  );
};

export default Menu;
