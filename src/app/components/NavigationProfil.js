"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

const menuItems = [
  { key: "profil", label: "Profil", emoji: "\uD83D\uDC64" },
  { key: "bibliotheque", label: "Biblioth\u00e8que", emoji: "\uD83D\uDCDA" },
];

const conditionalItems = [
  { key: "indexeur", label: "Indexeur", emoji: "\uD83E\uDDE9", condition: (user) => user?.indexeur || user?.proprietaire },
  { key: "administration", label: "Administration", emoji: "\uD83D\uDEE0\uFE0F", condition: (user) => user?.admin },
];

const NavigationProfil = ({ onMenuSelect, user, activeMenu }) => {
  const router = useRouter();
  const { logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  const handleSelect = (key) => {
    onMenuSelect(key);
    setIsMenuOpen(false);
  };

  const buttonClass = (key) =>
    `w-full text-left px-4 py-2 rounded-lg transition ${
      activeMenu === key
        ? "bg-indigo-600 text-white font-semibold"
        : "text-gray-300 hover:bg-gray-700"
    }`;

  return (
    <div className="relative">
      {/* Toggle mobile menu */}
      <div className="md:hidden flex justify-end mb-4">
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg shadow transition duration-200"
        >
          {isMenuOpen ? "\u2716 Fermer" : "\u2630 Menu"}
        </button>
      </div>

      {/* Sidebar */}
      <aside
        className={`w-full md:w-64 bg-gray-900 text-white shadow-xl rounded-lg overflow-hidden md:block transition-all duration-300 ${
          isMenuOpen ? "block" : "hidden md:block"
        }`}
      >
        <div className="bg-gray-800 py-4 px-6 border-b border-gray-700">
          <h2 className="text-xl font-semibold text-center">Menu Profil</h2>
        </div>

        <nav className="p-4 space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.key}
              onClick={() => handleSelect(item.key)}
              className={buttonClass(item.key)}
            >
              {item.emoji} {item.label}
            </button>
          ))}

          {conditionalItems.map(
            (item) =>
              item.condition(user) && (
                <button
                  key={item.key}
                  onClick={() => handleSelect(item.key)}
                  className={buttonClass(item.key)}
                >
                  {item.emoji} {item.label}
                </button>
              )
          )}

          <button
            onClick={() => handleSelect("parametre")}
            className={buttonClass("parametre")}
          >
            ⚙️ Paramètres
          </button>

          <hr className="border-gray-700 my-2" />

          <button
            onClick={handleLogout}
            className="w-full text-left px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg font-semibold transition"
          >
            🚪 Déconnexion
          </button>
        </nav>
      </aside>
    </div>
  );
};

export default NavigationProfil;
