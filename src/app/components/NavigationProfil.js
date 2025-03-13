"use client";

import { useState } from "react";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";

const NavigationProfil = ({ onMenuSelect, user }) => {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false); // État pour ouvrir/fermer le menu

  const handleLogout = () => {
    Cookies.remove("jwt");
    Cookies.remove("userInfo");
    router.push("/Connexion");
  };

  return (
    <div className="relative">
      {/* Bouton pour ouvrir/fermer le menu (pour petits écrans) */}
      <button
        className="md:hidden bg-gray-700 text-white py-2 px-4 rounded-lg shadow-lg focus:outline-none"
        onClick={() => setIsMenuOpen(!isMenuOpen)}
      >
        {isMenuOpen ? "Fermer Menu" : "Ouvrir Menu"}
      </button>

      {/* Menu principal */}
      <aside
        className={`w-64 h-auto bg-gray-800 text-white shadow-lg md:block ${
          isMenuOpen ? "block" : "hidden"
        }`}
      >
        <div className="p-4 text-center border-b border-gray-700">
          <h2 className="text-lg font-bold">Menu Profil</h2>
        </div>
        <nav className="mt-4">
          <ul className="space-y-2 px-4">
            {/* Profil */}
            <li>
              <button
                className="block py-2 px-4 rounded hover:bg-gray-700 transition-colors w-full text-left"
                onClick={() => onMenuSelect("profil")}
              >
                Profil
              </button>
            </li>

            {/* Section dynamique Indexeur */}
            {user && (user.indexeur || user.proprietaire) && (
              <li>
                <button
                  className="block py-2 px-4 rounded hover:bg-gray-700 transition-colors w-full text-left"
                  onClick={() => onMenuSelect("indexeur")}
                >
                  Indexeur
                </button>
              </li>
            )}

            {/* Administration (si l'utilisateur est admin) */}
            {user && user.admin && (
              <li>
                <button
                  className="block py-2 px-4 rounded hover:bg-gray-700 transition-colors w-full text-left"
                  onClick={() => onMenuSelect("administration")}
                >
                  Administration
                </button>
              </li>
            )}

            {/* Paramètre */}
            <li>
              <button
                className="block py-2 px-4 rounded hover:bg-gray-700 transition-colors w-full text-left"
                onClick={() => onMenuSelect("parametre")}
              >
                Paramètre
              </button>
            </li>

            {/* Déconnexion */}
            <li>
              <button
                className="block py-2 px-4 rounded bg-red-500 hover:bg-red-600 text-white transition-colors w-full text-left"
                onClick={handleLogout}
              >
                Déconnexion
              </button>
            </li>
          </ul>
        </nav>
      </aside>
    </div>
  );
};

export default NavigationProfil;
