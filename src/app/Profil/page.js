"use client";

import React, { useState, useEffect } from "react";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation"; // 🆕 import du router
import NavigationProfil from "../components/NavigationProfil";
import Profil from "../components/Profil";
import Parametre from "../components/Parametre";
import Indexeur from "../components/Indexeur";
import Administration from "../components/Administration";
import Bibliotheque from "../components/bibliotheque";

const ProfilePage = () => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true); // 🔄 gestion du chargement
  const [activeMenu, setActiveMenu] = useState("profil");
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const router = useRouter(); // ✅ init du router

  useEffect(() => {
    const fetchUserData = async () => {
      const jwt = Cookies.get("jwt");
      if (!jwt) {
        console.log("JWT non trouvé, redirection vers l'accueil");
        router.push("/Connexion");
        return; // Ne pas mettre isLoading = false, on redirige
      }

      try {
        const res = await fetch(`${apiUrl}/api/users/me`, {
          headers: {
            Authorization: `Bearer ${jwt}`,
          },
          cache: "no-store",
        });

        if (!res.ok) {
          console.log("Erreur utilisateur → redirection");
          // Token invalide, supprimer les cookies
          Cookies.remove("jwt");
          Cookies.remove("userInfo");
          router.push("/Connexion");
          return; // Ne pas mettre isLoading = false, on redirige
        }

        const userData = await res.json();
        setUser(userData);
        setIsLoading(false); // Seulement si succès
      } catch (error) {
        console.error("Erreur avec fetch :", error);
        Cookies.remove("jwt");
        Cookies.remove("userInfo");
        router.push("/Connexion");
        // Ne pas mettre isLoading = false, on redirige
      }
    };

    fetchUserData();
  }, [apiUrl, router]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-900 text-white">
        <p>Chargement des informations utilisateur...</p>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeMenu) {
      case "parametre":
        return <Parametre user={user} onUserUpdate={setUser} />;
      case "indexeur":
        return <Indexeur user={user} />;
      case "administration":
        return <Administration user={user} />;
      case "bibliotheque":
        return <Bibliotheque user={user} />;
      case "profil":
      default:
        return <Profil user={user} />;
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-full">
      <div>
        <NavigationProfil onMenuSelect={setActiveMenu} user={user} activeMenu={activeMenu} />
      </div>
      <main className="flex-grow bg-gray-900 text-white p-8">
        {renderContent()}
      </main>
    </div>
  );
};

export default ProfilePage;
