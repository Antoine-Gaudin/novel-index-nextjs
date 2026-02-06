"use client";

import { createContext, useContext, useState, useEffect } from "react";
import Cookies from "js-cookie";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [jwt, setJwt] = useState(null);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const isLoggedIn = !!jwt;
  const usernameInitial = user?.username?.[0]?.toUpperCase() || "?";

  // Hydrate state from cookies on mount
  useEffect(() => {
    const storedJwt = Cookies.get("jwt");
    if (storedJwt) {
      setJwt(storedJwt);
      try {
        const storedUser = JSON.parse(Cookies.get("userInfo") || "null");
        if (storedUser) setUser(storedUser);
      } catch {
        // ignore parse errors
      }
    }
    setIsLoading(false);
  }, []);

  const login = (newJwt, userInfo) => {
    Cookies.set("jwt", newJwt, { expires: 7 });
    Cookies.set("userInfo", JSON.stringify(userInfo), { expires: 7 });
    localStorage.setItem("jwt", newJwt);
    setJwt(newJwt);
    setUser(userInfo);
  };

  const logout = () => {
    Cookies.remove("jwt");
    Cookies.remove("userInfo");
    localStorage.removeItem("jwt");
    setJwt(null);
    setUser(null);
  };

  const refreshUser = async () => {
    if (!jwt) return;
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/users/me`,
        { headers: { Authorization: `Bearer ${jwt}` } }
      );
      if (res.ok) {
        const data = await res.json();
        setUser(data);
        Cookies.set("userInfo", JSON.stringify(data), { expires: 7 });
      }
    } catch (err) {
      console.error("Erreur refresh user:", err);
    }
  };

  return (
    <AuthContext.Provider
      value={{ isLoggedIn, user, jwt, isLoading, usernameInitial, login, logout, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
