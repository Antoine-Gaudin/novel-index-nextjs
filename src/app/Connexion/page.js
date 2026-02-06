"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { User, Mail, Lock, Eye, EyeOff, Check, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import CoverBackground from "@/app/components/CoverBackground";

const AuthPageContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  // Mode : "connexion" ou "inscription"
  const [mode, setMode] = useState(
    searchParams.get("mode") === "inscription" ? "inscription" : "connexion"
  );

  // States login
  const [identifier, setIdentifier] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  // States signup
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [signupError, setSignupError] = useState(null);
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [signupLoading, setSignupLoading] = useState(false);
  const [passwordValidations, setPasswordValidations] = useState({
    hasUpperCase: false,
    hasNumber: false,
    hasSpecialChar: false,
    hasMinLength: false,
  });

  // === Handlers ===

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError("");

    try {
      const authRes = await fetch(`${apiUrl}/api/auth/local`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password: loginPassword }),
      });

      if (!authRes.ok) {
        throw new Error("Identifiants invalides");
      }

      const authData = await authRes.json();

      const userRes = await fetch(`${apiUrl}/api/users/me`, {
        headers: { Authorization: `Bearer ${authData.jwt}` },
      });

      if (!userRes.ok) {
        throw new Error("Erreur lors de la recuperation du profil");
      }

      const userInfo = await userRes.json();
      login(authData.jwt, userInfo);
      router.back();
    } catch (err) {
      console.error(err);
      setLoginError("Identifiants invalides. Veuillez reessayer.");
    } finally {
      setLoginLoading(false);
    }
  };

  const validatePassword = (pwd) => {
    const validations = {
      hasUpperCase: /[A-Z]/.test(pwd),
      hasNumber: /[0-9]/.test(pwd),
      hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(pwd),
      hasMinLength: pwd.length >= 5,
    };
    setPasswordValidations(validations);
    return Object.values(validations).every(Boolean);
  };

  const handlePasswordChange = (value) => {
    setSignupPassword(value);
    validatePassword(value);
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setSignupLoading(true);
    setSignupError(null);

    if (signupPassword !== confirmPassword) {
      setSignupError("Les mots de passe ne correspondent pas.");
      setSignupLoading(false);
      return;
    }

    if (!validatePassword(signupPassword)) {
      setSignupError(
        "Le mot de passe doit contenir au moins 5 caracteres, une majuscule, un chiffre et un caractere special (!/@/#, etc.)."
      );
      setSignupLoading(false);
      return;
    }

    try {
      const authenticatedRoleId = 2;

      const res = await fetch(`${apiUrl}/api/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          email,
          password: signupPassword,
          role: authenticatedRoleId,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(
          errData?.error?.message || "Erreur lors de l'inscription."
        );
      }

      setSignupSuccess(true);
      setSignupError(null);

      // Auto-switch vers connexion apres 2s, pre-remplir l'email
      setTimeout(() => {
        setIdentifier(email);
        setMode("connexion");
        setSignupSuccess(false);
      }, 2000);
    } catch (err) {
      setSignupError(
        err.message || "Erreur lors de l'inscription. Veuillez reessayer."
      );
      setSignupSuccess(false);
      console.error(err);
    } finally {
      setSignupLoading(false);
    }
  };

  const switchMode = (newMode) => {
    setMode(newMode);
    setLoginError("");
    setSignupError(null);
    setSignupSuccess(false);
  };

  // === Sous-composants ===

  const ValidationItem = ({ valid, label }) => (
    <li
      className={`flex items-center gap-2 ${
        valid ? "text-green-400" : "text-red-400"
      }`}
    >
      {valid ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
      <span>{label}</span>
    </li>
  );

  const slideVariants = {
    enterFromLeft: { x: -20, opacity: 0 },
    enterFromRight: { x: 20, opacity: 0 },
    center: { x: 0, opacity: 1 },
    exitToRight: { x: 20, opacity: 0 },
    exitToLeft: { x: -20, opacity: 0 },
  };

  return (
    <div className="relative min-h-screen overflow-hidden flex items-center justify-center px-4">
      <CoverBackground />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative z-10 w-full max-w-md bg-gray-800/80 backdrop-blur-xl p-8 rounded-2xl border border-gray-700/50 shadow-2xl"
      >
        {/* Titre dynamique */}
        <h2 className="text-3xl font-bold mb-2 text-center text-white">
          {mode === "connexion" ? "Connexion" : "Creer un compte"}
        </h2>
        <p className="text-gray-400 text-center mb-6">
          {mode === "connexion"
            ? "Connectez-vous a votre compte"
            : "Rejoignez Novel-Index"}
        </p>

        {/* Toggle Tabs */}
        <div className="bg-gray-700/50 rounded-lg p-1 flex mb-6">
          <button
            type="button"
            onClick={() => switchMode("connexion")}
            className={`flex-1 py-2.5 rounded-md text-sm font-semibold transition-all duration-300 ${
              mode === "connexion"
                ? "bg-indigo-600 text-white shadow-lg"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Connexion
          </button>
          <button
            type="button"
            onClick={() => switchMode("inscription")}
            className={`flex-1 py-2.5 rounded-md text-sm font-semibold transition-all duration-300 ${
              mode === "inscription"
                ? "bg-purple-600 text-white shadow-lg"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Inscription
          </button>
        </div>

        {/* Forms avec animation */}
        <AnimatePresence mode="wait">
          {mode === "connexion" ? (
            <motion.form
              key="login"
              initial="enterFromLeft"
              animate="center"
              exit="exitToRight"
              variants={slideVariants}
              transition={{ duration: 0.3 }}
              onSubmit={handleLogin}
              className="space-y-5"
            >
              <div>
                <label
                  htmlFor="identifier"
                  className="block text-sm font-medium text-gray-300 mb-1"
                >
                  Email ou nom d&apos;utilisateur
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    id="identifier"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    required
                    placeholder="votre@email.com"
                    className="w-full pl-10 pr-4 py-3 border border-gray-600 rounded-lg bg-gray-700/50 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="loginPassword"
                  className="block text-sm font-medium text-gray-300 mb-1"
                >
                  Mot de passe
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type={showLoginPassword ? "text" : "password"}
                    id="loginPassword"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                    placeholder="Votre mot de passe"
                    className="w-full pl-10 pr-12 py-3 border border-gray-600 rounded-lg bg-gray-700/50 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition"
                  >
                    {showLoginPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              {loginError && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-red-400 text-sm text-center"
                >
                  {loginError}
                </motion.p>
              )}

              <button
                type="submit"
                className="w-full py-3 px-4 rounded-lg font-semibold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loginLoading}
              >
                {loginLoading ? "Connexion en cours..." : "Se connecter"}
              </button>
            </motion.form>
          ) : (
            <motion.form
              key="signup"
              initial="enterFromRight"
              animate="center"
              exit="exitToLeft"
              variants={slideVariants}
              transition={{ duration: 0.3 }}
              onSubmit={handleSignup}
              className="space-y-5"
            >
              {signupError && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-red-400 text-sm text-center"
                >
                  {signupError}
                </motion.div>
              )}
              {signupSuccess && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-green-400 text-sm text-center"
                >
                  Inscription reussie ! Redirection vers connexion...
                </motion.div>
              )}

              <div>
                <label
                  htmlFor="username"
                  className="block text-sm font-medium text-gray-300 mb-1"
                >
                  Nom d&apos;utilisateur
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    id="username"
                    placeholder="Votre pseudo"
                    className="w-full pl-10 pr-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-300 mb-1"
                >
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    id="email"
                    placeholder="votre@email.com"
                    className="w-full pl-10 pr-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="signupPassword"
                  className="block text-sm font-medium text-gray-300 mb-1"
                >
                  Mot de passe
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type={showSignupPassword ? "text" : "password"}
                    id="signupPassword"
                    placeholder="Votre mot de passe"
                    className="w-full pl-10 pr-12 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                    value={signupPassword}
                    onChange={(e) => handlePasswordChange(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowSignupPassword(!showSignupPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition"
                  >
                    {showSignupPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
                <ul className="text-sm mt-2 space-y-1">
                  <ValidationItem
                    valid={passwordValidations.hasUpperCase}
                    label="Contient une majuscule"
                  />
                  <ValidationItem
                    valid={passwordValidations.hasNumber}
                    label="Contient un chiffre"
                  />
                  <ValidationItem
                    valid={passwordValidations.hasSpecialChar}
                    label="Contient un caractere special (!, @, #, etc.)"
                  />
                  <ValidationItem
                    valid={passwordValidations.hasMinLength}
                    label="Au moins 5 caracteres"
                  />
                </ul>
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-gray-300 mb-1"
                >
                  Confirmer le mot de passe
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    id="confirmPassword"
                    placeholder="Confirmez votre mot de passe"
                    className="w-full pl-10 pr-12 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setShowConfirmPassword(!showConfirmPassword)
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 px-4 bg-purple-600 hover:bg-purple-700 rounded-lg font-semibold text-white transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={signupLoading || signupSuccess}
              >
                {signupLoading ? "Inscription en cours..." : "S'inscrire"}
              </button>
            </motion.form>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

const AuthPage = () => {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
          Chargement...
        </div>
      }
    >
      <AuthPageContent />
    </Suspense>
  );
};

export default AuthPage;
