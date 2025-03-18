"use client";

import { createContext, useContext, useEffect, useState } from "react";
import Cookies from "js-cookie";

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userProfilePicture, setUserProfilePicture] = useState(null);

  useEffect(() => {
    const jwt = Cookies.get("jwt");
    console.log("JWT récupéré :", jwt); // 🔥 Vérifie si le token est bien récupéré
    
    if (jwt) {
      setIsLoggedIn(true);
      const fetchUserProfile = async () => {
        try {
          const response = await fetch(
            "https://novel-index-strapi.onrender.com/api/users/me?populate=profil",
            { headers: { Authorization: `Bearer ${jwt}` } }
          );
  
          if (response.ok) {
            const userData = await response.json();
            console.log("Données utilisateur récupérées :", userData); // 🔥 Vérifie les données récupérées
  
            const profilePictureUrl = userData?.profil?.formats?.small?.url;
            setUserProfilePicture(profilePictureUrl);
          }
        } catch (error) {
          console.error("Erreur récupération profil :", error);
        }
      };
      fetchUserProfile();
    }
  }, []);
  

  return (
    <UserContext.Provider value={{ isLoggedIn, setIsLoggedIn, userProfilePicture, setUserProfilePicture }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
