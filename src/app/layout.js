"use client";

import "./globals.css";
import { Geist, Geist_Mono } from "next/font/google";
import { useEffect, useState } from "react";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import { GoogleAnalytics } from "nextjs-google-analytics";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({ children }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userProfilePicture, setUserProfilePicture] = useState(null); // État pour l'image de profil
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const jwt = Cookies.get("jwt");
    setIsLoggedIn(!!jwt);

    if (jwt) {
      // Récupérer l'image de profil de l'utilisateur
      const fetchUserProfile = async () => {
        try {
          const response = await fetch("https://novel-index-strapi.onrender.com/api/users/me?populate=profil", {
            headers: {
              Authorization: `Bearer ${jwt}`,
            },
          });

          if (response.ok) {
            const userData = await response.json();
            console.log("Données utilisateur récupérées :", userData);

            // Accéder à l'URL de l'image au format "small"
            const profilePictureUrl = userData?.profil?.formats?.small?.url;
            if (profilePictureUrl) {
              setUserProfilePicture(`${profilePictureUrl}`);
            }
          } else {
            console.error("Erreur lors de la récupération des données utilisateur");
          }
        } catch (error) {
          console.error("Erreur lors de la récupération de l'image de profil :", error);
        }
      };

      fetchUserProfile();
    }
  }, []);


  return (
    <html lang="fr" className={`${geistSans.variable} ${geistMono.variable}`}>
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta
          name="description"
          content="Trad-Index - Plateforme d'indexation collaborative des traductions."
        />
        <meta name="keywords" content="traductions, index, œuvres, Trad-Index" />
        <meta name="author" content="Trad-Index" />
        <title>Novel-index</title>
      </head>
      <body className="bg-gray-900 text-white">
        <GoogleAnalytics gaMeasurementId="G-7MK34RRGND" trackPageViews />
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
                <a
                  href="/"
                  className="text-white font-bold no-underline hover:text-gray-400 transition duration-300"
                >
                  Accueil
                </a>
              </li>
              <li>
                <a
                  href="/Oeuvres"
                  className="text-white font-bold no-underline hover:text-gray-400 transition duration-300"
                >
                  Œuvres
                </a>
              </li>
              {!isLoggedIn ? (
                <>
                  <li>
                    <a
                      href="/Inscription"
                      className="text-white font-bold no-underline hover:text-gray-400 transition duration-300"
                    >
                      Inscription
                    </a>
                  </li>
                  <li>
                    <a
                      href="/Connexion"
                      className="text-white font-bold no-underline hover:text-gray-400 transition duration-300"
                    >
                      Connexion
                    </a>
                  </li>
                </>
              ) : (
<li>
  <a
    href="/Profil"
    className="block w-10 h-10 rounded-full overflow-hidden border-2 border-white hover:border-gray-400 transition duration-300"
  >
    {userProfilePicture ? (
      <img
        src={userProfilePicture}
        alt="Photo de profil"
        className="w-full h-full object-cover"
      />
    ) : (
      <div className="w-full h-full bg-gray-700 flex items-center justify-center">
        <span className="text-white text-lg font-bold">
          {/* Extraire la première lettre du nom d'utilisateur */}
          {(() => {
            try {
              const userInfo = JSON.parse(Cookies.get("userInfo"));
              return userInfo?.username?.[0]?.toUpperCase() || "?";
            } catch {
              return "?"; // Si une erreur survient, afficher un point d'interrogation
            }
          })()}
        </span>
      </div>
    )}
  </a>
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
                <a
                  href="/"
                  className="block text-white font-bold no-underline hover:text-gray-400 transition duration-300"
                >
                  Accueil
                </a>
              </li>
              <li>
                <a
                  href="/Oeuvres"
                  className="block text-white font-bold no-underline hover:text-gray-400 transition duration-300"
                >
                  Œuvres
                </a>
              </li>
              {!isLoggedIn ? (
                <>
                  <li>
                    <a
                      href="/Inscription"
                      className="block text-white font-bold no-underline hover:text-gray-400 transition duration-300"
                    >
                      Inscription
                    </a>
                  </li>
                  <li>
                    <a
                      href="/Connexion"
                      className="block text-white font-bold no-underline hover:text-gray-400 transition duration-300"
                    >
                      Connexion
                    </a>
                  </li>
                </>
              ) : (
                <li>
                  <a
                    href="/Profil"
                    className="block w-10 h-10 rounded-full overflow-hidden border-2 border-white hover:border-gray-400 transition duration-300"
                  >
                    {userProfilePicture ? (
                      <img
                        src={userProfilePicture}
                        alt="Photo de profil"
                        className="w-full h-full object-cover"
                      />
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
        <main className="min-h-screen">{children}</main>
        <footer className="bg-gray-800 text-gray-400 py-4 mt-8">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center">
            <p>&copy; {new Date().getFullYear()} Novel-index. Tous droits réservés.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
