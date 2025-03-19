"use client";

import { useEffect, useState } from "react";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";

const Menu = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userProfilePicture, setUserProfilePicture] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const jwt = Cookies.get("jwt");
    setIsLoggedIn(!!jwt);

    if (jwt) {
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
          console.error("Erreur lors de la récupération de l'image de profil :", error);
        }
      };

      fetchUserProfile();
    }
  }, []);

  return (
    <header className="bg-black bg-opacity-80 text-white py-4">
      <nav className="max-w-7xl mx-auto px-4 flex justify-between items-center">
        <h1
          className="text-xl font-bold cursor-pointer hover:text-gray-400 transition duration-300"
          onClick={() => router.push("/")}
        >
          Novel-index
        </h1>
        <ul className="hidden md:flex space-x-4 items-center">
          <li>
            <a href="/" className="text-white font-bold hover:text-gray-400 transition duration-300">
              Accueil
            </a>
          </li>
          <li>
            <a href="/Oeuvres" className="text-white font-bold hover:text-gray-400 transition duration-300">
              Œuvres
            </a>
          </li>
          {!isLoggedIn ? (
            <>
              <li>
                <a href="/Inscription" className="text-white font-bold hover:text-gray-400 transition duration-300">
                  Inscription
                </a>
              </li>
              <li>
                <a href="/Connexion" className="text-white font-bold hover:text-gray-400 transition duration-300">
                  Connexion
                </a>
              </li>
            </>
          ) : (
            <li>
              <a href="/Profil" className="block w-10 h-10 rounded-full overflow-hidden border-2 border-white hover:border-gray-400 transition duration-300">
                {userProfilePicture ? (
                  <img src={userProfilePicture} alt="Profil" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gray-700 flex items-center justify-center">
                    <span className="text-white text-lg font-bold">
                      {(() => {
                        try {
                          const userInfo = JSON.parse(Cookies.get("userInfo"));
                          return userInfo?.username?.[0]?.toUpperCase() || "?";
                        } catch {
                          return "?";
                        }
                      })()}
                    </span>
                  </div>
                )}
              </a>
            </li>
          )}
        </ul>
        <button className="md:hidden text-white focus:outline-none" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? "✖" : "☰"}
        </button>
      </nav>

      {/* Menu mobile */}
      {menuOpen && (
        <ul className="md:hidden flex flex-col space-y-2 mt-2 px-4">
          <li>
            <a href="/" className="block text-white font-bold hover:text-gray-400 transition duration-300">
              Accueil
            </a>
          </li>
          <li>
            <a href="/Oeuvres" className="block text-white font-bold hover:text-gray-400 transition duration-300">
              Œuvres
            </a>
          </li>
          {!isLoggedIn ? (
            <>
              <li>
                <a href="/Inscription" className="block text-white font-bold hover:text-gray-400 transition duration-300">
                  Inscription
                </a>
              </li>
              <li>
                <a href="/Connexion" className="block text-white font-bold hover:text-gray-400 transition duration-300">
                  Connexion
                </a>
              </li>
            </>
          ) : (
            <li>
              <a href="/Profil" className="block w-10 h-10 rounded-full overflow-hidden border-2 border-white hover:border-gray-400 transition duration-300">
                {userProfilePicture ? (
                  <img src={userProfilePicture} alt="Profil" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gray-700 flex items-center justify-center">
                    <span className="text-sm text-gray-400">Aucune image</span>
                  </div>
                )}
              </a>
            </li>
          )}
        </ul>
      )}
    </header>
  );
};

export default Menu;
