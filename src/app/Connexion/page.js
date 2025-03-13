"use client";

import React, { useState } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation"; // Utilisé pour la redirection

const LoginPage = () => {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Appel à l'API Strapi pour authentification
      const response = await axios.post(
        `http://localhost:1337/api/auth/local`,
        {
          identifier,
          password,
        }
      );

// Stocker le JWT dans localStorage et Cookie
localStorage.setItem("jwt", response.data.jwt);
Cookies.set("jwt", response.data.jwt, { expires: 7 });


      // Récupérer les informations utilisateur
      const userInfoResponse = await axios.get(
        `http://localhost:1337/api/users/me`,
        {
          headers: {
            Authorization: `Bearer ${response.data.jwt}`,
          },
        }
      );

      const userInfo = userInfoResponse.data;

      // Stocker les informations utilisateur (optionnel)
      Cookies.set("userInfo", JSON.stringify(userInfo), { expires: 7 });

      // Rediriger vers la page profil
      router.push("/Profil");
    } catch (err) {
      console.error(err);
      setError("Identifiants invalides. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
      <div className="bg-gray-800 p-8 rounded-lg shadow-lg max-w-md w-full">
        <h2 className="text-2xl font-bold mb-6 text-center">Connexion</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="identifier"
              className="block text-sm font-medium text-gray-300"
            >
              Email:
            </label>
            <input
              type="text"
              id="identifier"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-700 rounded-md shadow-sm bg-gray-700 text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-300"
            >
              Mot de passe:
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-700 rounded-md shadow-sm bg-gray-700 text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            type="submit"
            className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            disabled={loading}
          >
            {loading ? "Connexion en cours..." : "Se connecter"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
