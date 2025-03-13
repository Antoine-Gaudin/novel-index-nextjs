"use client";

import React, { useState, useEffect } from "react";
import Cookies from "js-cookie";
import NavigationProfil from "../components/NavigationProfil";
import Profil from "../components/Profil";
import Parametre from "../components/Parametre";
import Indexeur from "../components/Indexeur";
import Administration from "../components/Administration"; // Importez le composant Administration

const ProfilePage = () => {
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);
  const [activeMenu, setActiveMenu] = useState("profil"); // Vue active par défaut
  const apiUrl = "http://localhost:1337";

  useEffect(() => {
    const fetchUserData = async () => {
      const jwt = Cookies.get("jwt");
      if (!jwt) {
        console.log("JWT non trouvé, utilisateur non authentifié");
        return;
      }

      try {
        const res = await fetch(`${apiUrl}/api/users/me`, {
          headers: {
            Authorization: `Bearer ${jwt}` },
          cache: "no-store",
        });

        if (!res.ok) {
          console.log("Erreur lors de la récupération des données utilisateur");
          return;
        }

        const userData = await res.json();
        console.log("Données utilisateur récupérées :", userData);
        setUser(userData);
      } catch (error) {
        console.error("Erreur avec fetch :", error);
      }
    };

    fetchUserData();
  }, [apiUrl]);

  if (!user) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-900 text-white">
        <p>Chargement des informations utilisateur...</p>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeMenu) {
      case "parametre":
        return <Parametre user={user} />;
      case "indexeur":
        return <Indexeur user={user} />;
      case "administration": // Nouveau cas pour l'administration
        return <Administration user={user} />;
      case "profil":
      default:
        return <Profil user={user} />;
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-full">
      {/* Navigation latérale */}
      <div className="md:w-64 w-full bg-gray-800 text-white shadow-lg">
        <NavigationProfil onMenuSelect={setActiveMenu} user={user} />
      </div>

      {/* Contenu principal */}
      <main className="flex-grow bg-gray-900 text-white p-8">
        {renderContent()}
      </main>
    </div>
  );
};

export default ProfilePage;
