"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import {
  FiUser,
  FiBook,
  FiSettings,
  FiLogOut,
  FiMenu,
  FiX,
  FiEdit3,
  FiTag,
  FiShield,
} from "react-icons/fi";

const menuItems = [
  { key: "profil", label: "Profil", icon: FiUser },
  { key: "bibliotheque", label: "Bibliothèque", icon: FiBook },
];

const conditionalItems = [
  { key: "indexeur", label: "Indexeur", icon: FiEdit3, condition: (user) => user?.indexeur || user?.proprietaire },
  { key: "bulktags", label: "Tags en masse", icon: FiTag, condition: (user) => user?.email === "agaudin76@gmail.com" },
  { key: "administration", label: "Administration", icon: FiShield, condition: (user) => user?.admin },
];

const NavigationProfil = ({ onMenuSelect, user, activeMenu }) => {
  const router = useRouter();
  const { logout, usernameInitial } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  const handleSelect = (key) => {
    onMenuSelect(key);
    setIsMenuOpen(false);
  };

  const profilePictureUrl = user?.profil?.formats?.small?.url || user?.profil?.url;

  const NavButton = ({ itemKey, label, icon: Icon }) => {
    const isActive = activeMenu === itemKey;
    return (
      <button
        onClick={() => handleSelect(itemKey)}
        className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
          isActive
            ? "bg-indigo-600/20 text-indigo-400 border border-indigo-500/30"
            : "text-gray-400 hover:text-white hover:bg-white/5 border border-transparent"
        }`}
      >
        <Icon className={`w-4 h-4 ${isActive ? "text-indigo-400" : "text-gray-500"}`} />
        <span>{label}</span>
        {isActive && (
          <div className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-400" />
        )}
      </button>
    );
  };

  return (
    <div className="relative">
      {/* Toggle mobile */}
      <div className="md:hidden p-4">
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="flex items-center gap-2 px-4 py-2.5 bg-gray-800/80 hover:bg-gray-700/80 text-white rounded-xl border border-gray-700/50 transition-all"
        >
          {isMenuOpen ? <FiX className="w-5 h-5" /> : <FiMenu className="w-5 h-5" />}
          <span className="text-sm font-medium">{isMenuOpen ? "Fermer" : "Menu"}</span>
        </button>
      </div>

      {/* Sidebar */}
      <aside
        className={`w-full md:w-72 md:min-h-screen bg-gray-900/50 md:bg-gray-900/80 md:backdrop-blur-xl md:border-r border-gray-800/50 transition-all duration-300 ${
          isMenuOpen ? "block" : "hidden md:block"
        }`}
      >
        {/* User card */}
        <div className="p-6 border-b border-gray-800/50">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl overflow-hidden ring-2 ring-indigo-500/20 shadow-lg flex-shrink-0">
              {profilePictureUrl ? (
                <Image
                  src={profilePictureUrl}
                  alt="Profil"
                  width={48}
                  height={48}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center">
                  <span className="text-white text-lg font-bold">
                    {usernameInitial || user?.username?.[0]?.toUpperCase() || "?"}
                  </span>
                </div>
              )}
            </div>
            <div className="min-w-0">
              <p className="text-white font-semibold truncate">
                {user?.username || "Mon compte"}
              </p>
              <p className="text-gray-500 text-xs truncate">
                {user?.email || ""}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1">
          <p className="text-[10px] uppercase tracking-widest text-gray-600 font-semibold px-4 mb-2">
            Général
          </p>
          {menuItems.map((item) => (
            <NavButton key={item.key} itemKey={item.key} label={item.label} icon={item.icon} />
          ))}

          {conditionalItems.some((item) => item.condition(user)) && (
            <>
              <div className="pt-3 pb-1">
                <p className="text-[10px] uppercase tracking-widest text-gray-600 font-semibold px-4 mb-2">
                  Gestion
                </p>
              </div>
              {conditionalItems.map(
                (item) =>
                  item.condition(user) && (
                    <NavButton key={item.key} itemKey={item.key} label={item.label} icon={item.icon} />
                  )
              )}
            </>
          )}

          <div className="pt-3 pb-1">
            <p className="text-[10px] uppercase tracking-widest text-gray-600 font-semibold px-4 mb-2">
              Compte
            </p>
          </div>
          <NavButton itemKey="parametre" label="Paramètres" icon={FiSettings} />

          <div className="pt-4">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all duration-200"
            >
              <FiLogOut className="w-4 h-4" />
              <span>Déconnexion</span>
            </button>
          </div>
        </nav>
      </aside>
    </div>
  );
};

export default NavigationProfil;
