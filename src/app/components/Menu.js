"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

const Menu = () => {
  const [hasMounted, setHasMounted] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userProfilePicture, setUserProfilePicture] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [usernameInitial, setUsernameInitial] = useState("?");

  const [searchText, setSearchText] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const router = useRouter();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  const debounceTimeout = useRef(null);


  
  


  useEffect(() => {
    if (!searchText.trim()) {
      setSearchResults([]);
      return;
    }

    clearTimeout(debounceTimeout.current);

    debounceTimeout.current = setTimeout(() => {
      handleSearch();
    }, 400); // ⏱️ délai de 400ms après le dernier caractère tapé

    return () => clearTimeout(debounceTimeout.current);
  }, [searchText]);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    const jwt = Cookies.get("jwt");
    setIsLoggedIn(!!jwt);

    if (jwt) {
      try {
        const userInfo = JSON.parse(Cookies.get("userInfo"));
        const initial = userInfo?.username?.[0]?.toUpperCase();
        if (initial) setUsernameInitial(initial);
      } catch {
        setUsernameInitial("?");
      }

      const fetchUserProfile = async () => {
        try {
          const response = await fetch(
            "https://novel-index-strapi.onrender.com/api/users/me?populate=profil",
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
          }
        } catch (error) {
          console.error(
            "Erreur lors de la récupération de l'image de profil :",
            error
          );
        }
      };

      fetchUserProfile();
    }
  }, []);

  const handleSearch = async () => {
    if (!searchText.trim()) return;
    try {
      const url = `${apiUrl}/api/oeuvres?filters[titre][$containsi]=${searchText}&populate=couverture`;
      const res = await fetch(url);
      const data = await res.json();
      if (data?.data) setSearchResults(data.data);
    } catch (error) {
      console.error("Erreur lors de la recherche :", error);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") handleSearch();
  };

  const handleOeuvreClick = (oeuvre) => {
    const slug = oeuvre.titre
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    router.push(`/oeuvre/${oeuvre.documentId}-${slug}`);
    setIsSearchOpen(false);
    setSearchText("");
  };

  if (!hasMounted) return null;

  return (
    <header className="bg-black bg-opacity-80 text-white py-4 relative z-50">
      <nav className="max-w-7xl mx-auto px-4 flex justify-between items-center relative">
        <div
          className="cursor-pointer hover:opacity-80 transition duration-300"
          onClick={() => router.push("/")}
        >
          <img src="/logo.png" alt="Logo Novel-index" className="h-10 w-auto" />
        </div>

        <ul className="hidden md:flex space-x-4 items-center">
          <li>
            <Link
              href="/"
              className="text-white font-bold hover:text-gray-400 transition duration-300"
            >
              Accueil
            </Link>
          </li>
          <li>
            <Link
              href="/Oeuvres"
              className="text-white font-bold hover:text-gray-400 transition duration-300"
            >
              Œuvres
            </Link>
          </li>
          <li>
            <button
              onClick={() => setIsSearchOpen(true)}
              className="text-white font-bold hover:text-gray-400 transition duration-300"
            >
              Rechercher 🔍
            </button>
          </li>
          {!isLoggedIn ? (
            <>
              <li>
                <Link
                  href="/Inscription"
                  className="text-white font-bold hover:text-gray-400 transition duration-300"
                >
                  Inscription
                </Link>
              </li>
              <li>
                <Link
                  href="/Connexion"
                  className="text-white font-bold hover:text-gray-400 transition duration-300"
                >
                  Connexion
                </Link>
              </li>
            </>
          ) : (
            <li>
              <Link
                href="/Profil"
                className="block w-10 h-10 rounded-full overflow-hidden border-2 border-white hover:border-gray-400 transition duration-300"
              >
                {userProfilePicture ? (
                  <img
                    src={userProfilePicture}
                    alt="Profil"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-700 flex items-center justify-center">
                    <span className="text-white text-lg font-bold">
                      {usernameInitial}
                    </span>
                  </div>
                )}
              </Link>
            </li>
          )}
        </ul>

        <button
          className="md:hidden text-white focus:outline-none"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? "✖" : "☰"}
        </button>
      </nav>

      {menuOpen && (
        <ul className="md:hidden flex flex-col space-y-2 mt-2 px-4">
          <li>
            <Link href="/" className="text-white font-bold">
              Accueil
            </Link>
          </li>
          <li>
            <Link href="/Oeuvres" className="text-white font-bold">
              Œuvres
            </Link>
          </li>
          <li>
            <button
              onClick={() => {
                setMenuOpen(false);
                setIsSearchOpen(true);
              }}
              className="text-white font-bold"
            >
              Rechercher 🔍
            </button>
          </li>
          {!isLoggedIn ? (
            <>
              <li>
                <Link href="/Inscription" className="text-white font-bold">
                  Inscription
                </Link>
              </li>
              <li>
                <Link href="/Connexion" className="text-white font-bold">
                  Connexion
                </Link>
              </li>
            </>
          ) : (
            <li>
              <Link href="/Profil" className="text-white font-bold">
                Profil
              </Link>
            </li>
          )}
        </ul>
      )}

<AnimatePresence>
  {isSearchOpen && (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.25 }}
      className="fixed inset-0 bg-black bg-opacity-90 z-[999] flex flex-col items-center justify-center"
    >
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
      </div>

      <div className="mt-6 w-full max-w-2xl bg-gray-800 rounded-lg p-4 max-h-80 overflow-y-auto">
        {searchResults.length > 0 ? (
          <ul>
            <AnimatePresence>
              {searchResults.map((oeuvre, index) => (
                <motion.li
                  key={oeuvre.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                  className="p-4 border-b border-gray-700 hover:bg-gray-700 cursor-pointer flex items-center"
                  onClick={() => handleOeuvreClick(oeuvre)}
                >
                  {oeuvre.couverture?.url && (
                    <img
                      src={oeuvre.couverture.url}
                      alt={oeuvre.titre || "Image non disponible"}
                      className="w-16 h-16 object-cover rounded-md mr-4"
                    />
                  )}
                  <div>
                    <h3 className="text-xl font-bold">{oeuvre.titre || "Titre non disponible"}</h3>
                    <p className="text-sm text-gray-400">
                      Auteur : {oeuvre.auteur || "Non spécifié"}
                    </p>
                  </div>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        ) : (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="text-gray-400 text-center"
          >
            Aucun résultat pour cette recherche.
          </motion.p>
        )}
      </div>

      <motion.button
        onClick={() => setIsSearchOpen(false)}
        className="absolute top-4 right-4 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        Fermer
      </motion.button>
    </motion.div>
  )}
</AnimatePresence>

    </header>
  );
};

export default Menu;
