"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation"; // Utiliser le routeur de Next.js
import axios from "axios";

const SignupPage = () => {
  const router = useRouter(); // Initialiser le routeur
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const [passwordValidations, setPasswordValidations] = useState({
    hasUpperCase: false,
    hasNumber: false,
    hasSpecialChar: false,
    hasMinLength: false,
  });

  const validatePassword = (password) => {
    const validations = {
      hasUpperCase: /[A-Z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password),
      hasMinLength: password.length >= 5,
    };
    setPasswordValidations(validations);
    return Object.values(validations).every(Boolean);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    if (!validatePassword(password)) {
      setError(
        "Le mot de passe doit contenir au moins 5 caractères, une majuscule, un chiffre et un caractère spécial (!/@/#, etc.)."
      );
      return;
    }

    try {
      const authenticatedRoleId = 2;

      const response = await axios.post(`https://novel-index-strapi.onrender.com/api/users`, {
        username,
        email,
        password,
        role: authenticatedRoleId,
      });

      setSuccess(true);
      setError(null);
      console.log("Inscription réussie :", response.data);

      // Redirection après un délai de 3 secondes
      setTimeout(() => {
        router.push("/Connexion"); // Remplacez "/login" par la route de votre page de connexion
      }, 3000);
    } catch (err) {
      setError(err.response?.data?.error?.message || "Erreur lors de l'inscription. Veuillez réessayer.");
      setSuccess(false);
      console.error(err);
    }
  };

  const handlePasswordChange = (value) => {
    setPassword(value);
    validatePassword(value);
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-900 text-white">
      <div className="w-full max-w-md bg-gray-800 p-6 rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold mb-6 text-center">Créer un compte</h1>
        {error && <div className="text-red-500 text-sm mb-4">{error}</div>}
        {success && (
          <div className="text-green-500 text-sm mb-4">
            Inscription réussie ! Vous serez redirigé vers la page de connexion dans quelques secondes...
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="username" className="block text-sm font-medium">
              Nom d'utilisateur
            </label>
            <input
              type="text"
              id="username"
              className="w-full mt-1 p-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div className="mb-4">
            <label htmlFor="email" className="block text-sm font-medium">
              Email
            </label>
            <input
              type="email"
              id="email"
              className="w-full mt-1 p-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="mb-4">
            <label htmlFor="password" className="block text-sm font-medium">
              Mot de passe
            </label>
            <input
              type="password"
              id="password"
              className="w-full mt-1 p-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              value={password}
              onChange={(e) => handlePasswordChange(e.target.value)}
              required
            />
            <ul className="text-sm mt-2">
              <li className={passwordValidations.hasUpperCase ? "text-green-500" : "text-red-500"}>
                - Contient une majuscule
              </li>
              <li className={passwordValidations.hasNumber ? "text-green-500" : "text-red-500"}>
                - Contient un chiffre
              </li>
              <li className={passwordValidations.hasSpecialChar ? "text-green-500" : "text-red-500"}>
                - Contient un caractère spécial (!, @, #, etc.)
              </li>
              <li className={passwordValidations.hasMinLength ? "text-green-500" : "text-red-500"}>
                - Au moins 5 caractères
              </li>
            </ul>
          </div>
          <div className="mb-6">
            <label htmlFor="confirmPassword" className="block text-sm font-medium">
              Confirmer le mot de passe
            </label>
            <input
              type="password"
              id="confirmPassword"
              className="w-full mt-1 p-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            className="w-full p-2 bg-purple-600 hover:bg-purple-700 rounded-lg font-semibold transition-colors"
          >
            S'inscrire
          </button>
        </form>
      </div>
    </div>
  );
};

export default SignupPage;
