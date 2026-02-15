"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import SearchModal from "./SearchModal";
import { FiHome, FiBook, FiSearch, FiUser, FiUserPlus, FiLogIn, FiMenu, FiX, FiUsers } from "react-icons/fi";

const Menu = () => {
  const [hasMounted, setHasMounted] = useState(false);
  const [userProfilePicture, setUserProfilePicture] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const router = useRouter();
  const pathname = usePathname();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  const { isLoggedIn, user, jwt, isLoading, usernameInitial } = useAuth();

  useEffect(() => {
    setHasMounted(true);
    
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Fetch profile picture when user/jwt changes
  useEffect(() => {
    if (!jwt || !user) {
      setUserProfilePicture(null);
      return;
    }

    const fetchUserProfile = async () => {
      try {
        const response = await fetch(
          `${apiUrl}/api/users/me?populate=profil`,
          {
            headers: { Authorization: `Bearer ${jwt}` },
          }
        );

        if (response.ok) {
          const userData = await response.json();
          const profilePictureUrl = userData?.profil?.formats?.small?.url;
          if (profilePictureUrl) {
            setUserProfilePicture(profilePictureUrl);
          }
        } else if (response.status === 401) {
          // Token invalide/expiré, ne rien faire ici (AuthContext gèrera la déconnexion si nécessaire)
          setUserProfilePicture(null);
        }
      } catch (error) {
        console.error(
          "Erreur lors de la récupération de l'image de profil :",
          error
        );
      }
    };

    fetchUserProfile();
  }, [jwt, user, apiUrl]);

  if (!hasMounted || isLoading) return null;

  const isActive = (path) => pathname === path;

  const NavLink = ({ href, icon: Icon, children }) => (
    <Link
      href={href}
      className={`group flex items-center gap-2 px-3 py-2 rounded-lg font-medium transition-all duration-300 ${
        isActive(href)
          ? "text-indigo-400 bg-indigo-500/10"
          : "text-gray-300 hover:text-white hover:bg-white/5"
      }`}
    >
      <Icon className={`text-lg ${isActive(href) ? "text-indigo-400" : "text-gray-400 group-hover:text-indigo-400"} transition-colors`} />
      <span className="relative">
        {children}
        <span className={`absolute -bottom-1 left-0 h-0.5 bg-indigo-500 transition-all duration-300 ${isActive(href) ? "w-full" : "w-0 group-hover:w-full"}`} />
      </span>
    </Link>
  );

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled 
        ? "bg-gray-900/95 backdrop-blur-lg shadow-lg shadow-black/20 border-b border-gray-800/50" 
        : "bg-gradient-to-b from-gray-900/90 to-transparent"
    }`}>
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex justify-between items-center">
        {/* Logo */}
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="cursor-pointer"
          onClick={() => router.push("/")}
        >
          <Image 
            src="/logo.png" 
            alt="Logo Novel-index" 
            width={40} 
            height={40} 
            className="h-10 w-auto drop-shadow-lg" 
          />
        </motion.div>

        {/* Navigation Desktop */}
        <ul className="hidden md:flex items-center gap-1">
          <li>
            <NavLink href="/" icon={FiHome}>Accueil</NavLink>
          </li>
          <li>
            <NavLink href="/Oeuvres" icon={FiBook}>Oeuvres</NavLink>
          </li>
          <li>
            <NavLink href="/Teams" icon={FiUsers}>Teams</NavLink>
          </li>
          <li>
            <button
              onClick={() => setIsSearchOpen(true)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg font-medium text-gray-300 hover:text-white hover:bg-white/5 transition-all duration-300 group"
            >
              <FiSearch className="text-lg text-gray-400 group-hover:text-indigo-400 transition-colors" />
              <span>Rechercher</span>
            </button>
          </li>
        </ul>

        {/* Actions Desktop */}
        <div className="hidden md:flex items-center gap-3">
          {!isLoggedIn ? (
            <>
              <Link
                href="/Connexion"
                className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-gray-300 hover:text-white hover:bg-white/5 transition-all duration-300"
              >
                <FiLogIn className="text-lg" />
                <span>Connexion</span>
              </Link>
              <Link
                href="/Inscription"
                className="flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all duration-300"
              >
                <FiUserPlus className="text-lg" />
                <span>Inscription</span>
              </Link>
            </>
          ) : (
            <Link
              href="/Profil"
              className="group relative"
            >
              <div className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-gray-700 group-hover:ring-indigo-500 transition-all duration-300 shadow-lg">
                {userProfilePicture ? (
                  <Image
                    src={userProfilePicture}
                    alt="Profil"
                    width={40}
                    height={40}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center">
                    <span className="text-white text-lg font-bold">
                      {usernameInitial}
                    </span>
                  </div>
                )}
              </div>
              <span className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-900" />
            </Link>
          )}
        </div>

        {/* Hamburger Mobile */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          className="md:hidden w-10 h-10 flex items-center justify-center rounded-lg text-white hover:bg-white/10 transition-colors"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? <FiX className="text-2xl" /> : <FiMenu className="text-2xl" />}
        </motion.button>
      </nav>

      {/* Menu Mobile */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden overflow-hidden bg-gray-900/95 backdrop-blur-lg border-t border-gray-800/50"
          >
            <ul className="flex flex-col p-4 space-y-1">
              <li>
                <Link 
                  href="/" 
                  onClick={() => setMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
                    isActive("/") ? "text-indigo-400 bg-indigo-500/10" : "text-gray-300 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <FiHome className="text-xl" />
                  Accueil
                </Link>
              </li>
              <li>
                <Link 
                  href="/Oeuvres" 
                  onClick={() => setMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
                    isActive("/Oeuvres") ? "text-indigo-400 bg-indigo-500/10" : "text-gray-300 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <FiBook className="text-xl" />
                  Oeuvres
                </Link>
              </li>
              <li>
                <Link 
                  href="/Teams" 
                  onClick={() => setMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
                    isActive("/Teams") ? "text-indigo-400 bg-indigo-500/10" : "text-gray-300 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <FiUsers className="text-xl" />
                  Teams
                </Link>
              </li>
              <li>
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    setIsSearchOpen(true);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-gray-300 hover:text-white hover:bg-white/5 transition-all"
                >
                  <FiSearch className="text-xl" />
                  Rechercher
                </button>
              </li>
              
              <li className="pt-2 border-t border-gray-800/50 mt-2">
                {!isLoggedIn ? (
                  <div className="flex flex-col gap-2">
                    <Link 
                      href="/Connexion" 
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-gray-300 hover:text-white hover:bg-white/5 transition-all"
                    >
                      <FiLogIn className="text-xl" />
                      Connexion
                    </Link>
                    <Link 
                      href="/Inscription" 
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 shadow-lg"
                    >
                      <FiUserPlus className="text-xl" />
                      Inscription
                    </Link>
                  </div>
                ) : (
                  <Link 
                    href="/Profil" 
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-gray-300 hover:text-white hover:bg-white/5 transition-all"
                  >
                    <div className="w-8 h-8 rounded-full overflow-hidden ring-2 ring-gray-700">
                      {userProfilePicture ? (
                        <Image
                          src={userProfilePicture}
                          alt="Profil"
                          width={32}
                          height={32}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center">
                          <span className="text-white text-sm font-bold">
                            {usernameInitial}
                          </span>
                        </div>
                      )}
                    </div>
                    Mon Profil
                  </Link>
                )}
              </li>
            </ul>
          </motion.div>
        )}
      </AnimatePresence>

      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </header>
  );
};

export default Menu;
