"use client";

import React, { useState, useRef } from "react";
import Cookies from "js-cookie";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { 
  FiUser, FiMail, FiShield, FiCamera, FiUpload, FiCheck, FiX, 
  FiEdit3, FiUsers, FiAlertCircle, FiSettings, FiToggleLeft, FiToggleRight 
} from "react-icons/fi";

const Parametre = ({ user, onUserUpdate }) => {
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [profilePicture, setProfilePicture] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(false);
  const fileInputRef = useRef(null);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  // Protection si user n'existe pas
  if (!user) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-gray-800/50 rounded-2xl p-8 animate-pulse">
          <div className="h-8 bg-gray-700 rounded w-1/3 mb-6" />
          <div className="space-y-4">
            <div className="h-20 bg-gray-700/50 rounded-xl" />
            <div className="h-20 bg-gray-700/50 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  // Configuration des toggles avec descriptions
  const togglesConfig = {
    indexeur: {
      label: "Mode Indexeur",
      description: "Participez au référencement des œuvres et chapitres sur la plateforme",
      icon: FiEdit3,
      activeColor: "indigo",
      activeMessage: "Bienvenue parmi les participants au référencement !",
      inactiveMessage: "Vous avez quitté l'équipe de référencement."
    },
    proprietaire: {
      label: "Mode Propriétaire",
      description: "Déclarez-vous en tant que traducteur ou éditeur d'œuvres",
      icon: FiUsers,
      activeColor: "purple",
      activeMessage: "Bienvenue en tant que propriétaire référencé !",
      inactiveMessage: "Vous n'êtes plus référencé en tant que propriétaire."
    }
  };

  const handleToggle = async (key) => {
    const jwt = Cookies.get("jwt");
    if (!jwt) {
      setError("Session expirée. Veuillez vous reconnecter.");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const updatedValue = !user[key];

      const res = await fetch(`${apiUrl}/api/users/${user.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwt}`,
        },
        body: JSON.stringify({ [key]: updatedValue }),
      });

      if (!res.ok) {
        throw new Error("Erreur lors de la mise à jour");
      }

      if (onUserUpdate) onUserUpdate((prev) => ({ ...prev, [key]: updatedValue }));

      const config = togglesConfig[key];
      if (config) {
        setFeedbackMessage(updatedValue ? config.activeMessage : config.inactiveMessage);
      }

      // Clear feedback after 3s
      setTimeout(() => setFeedbackMessage(""), 3000);
    } catch (err) {
      console.error("Erreur :", err);
      setError("Erreur lors de la mise à jour. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfilePicture(file);
      // Créer une preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
      setError(null);
    }
  };

  const handleProfilePictureSubmit = async (e) => {
    e.preventDefault();

    const jwt = Cookies.get("jwt");
    if (!jwt) {
      setError("Session expirée. Veuillez vous reconnecter.");
      return;
    }

    if (!profilePicture) {
      setError("Veuillez sélectionner une image.");
      return;
    }

    try {
      setUploadProgress(true);
      setError(null);

      const formData = new FormData();
      formData.append("files", profilePicture);
      formData.append("ref", "plugin::users-permissions.user");
      formData.append("refId", user.id);
      formData.append("field", "profil");

      const response = await fetch(`${apiUrl}/api/upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${jwt}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Erreur lors du téléchargement");
      }

      setFeedbackMessage("Photo de profil mise à jour avec succès !");
      setProfilePicture(null);
      setPreviewUrl(null);
      
      // Rafraîchir les données utilisateur
      if (onUserUpdate) {
        const userRes = await fetch(`${apiUrl}/api/users/me?populate=profil`, {
          headers: { Authorization: `Bearer ${jwt}` }
        });
        if (userRes.ok) {
          const userData = await userRes.json();
          onUserUpdate(userData);
        }
      }

      setTimeout(() => setFeedbackMessage(""), 3000);
    } catch (err) {
      console.error("Erreur :", err);
      setError("Erreur lors du téléchargement. Vérifiez le format de l'image.");
    } finally {
      setUploadProgress(false);
    }
  };

  const cancelPreview = () => {
    setProfilePicture(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Filtrer les toggles disponibles
  const availableToggles = Object.keys(togglesConfig).filter(key => 
    typeof user[key] === "boolean"
  );

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3"
      >
        <div className="p-3 bg-indigo-600/20 rounded-xl">
          <FiSettings className="text-2xl text-indigo-400" />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">Paramètres</h1>
          <p className="text-gray-400 text-sm">Gérez votre compte et vos préférences</p>
        </div>
      </motion.div>

      {/* Messages de feedback */}
      <AnimatePresence>
        {feedbackMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="bg-green-600/20 border border-green-600/30 text-green-300 px-4 py-3 rounded-xl flex items-center gap-3"
          >
            <FiCheck className="text-xl flex-shrink-0" />
            <span>{feedbackMessage}</span>
          </motion.div>
        )}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="bg-red-600/20 border border-red-600/30 text-red-300 px-4 py-3 rounded-xl flex items-center gap-3"
          >
            <FiAlertCircle className="text-xl flex-shrink-0" />
            <span>{error}</span>
            <button onClick={() => setError(null)} className="ml-auto hover:text-white transition">
              <FiX />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Section Informations du compte */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/30"
        >
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <FiUser className="text-indigo-400" />
            Informations du compte
          </h2>

          <div className="space-y-4">
            {/* Nom d'utilisateur */}
            <div className="bg-gray-900/50 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-600/20 rounded-lg">
                  <FiUser className="text-indigo-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-400 mb-0.5">Nom d'utilisateur</p>
                  <p className="text-white font-medium truncate">{user.username}</p>
                </div>
              </div>
            </div>

            {/* Email */}
            <div className="bg-gray-900/50 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-600/20 rounded-lg">
                  <FiMail className="text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-400 mb-0.5">Email</p>
                  <p className="text-white font-medium truncate">{user.email}</p>
                </div>
              </div>
            </div>

            {/* Statut du compte */}
            <div className="bg-gray-900/50 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${user.restreint ? 'bg-red-600/20' : 'bg-green-600/20'}`}>
                  <FiShield className={user.restreint ? 'text-red-400' : 'text-green-400'} />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-400 mb-0.5">Statut du compte</p>
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                      user.restreint 
                        ? 'bg-red-600/20 text-red-300 border border-red-600/30' 
                        : 'bg-green-600/20 text-green-300 border border-green-600/30'
                    }`}>
                      {user.restreint ? (
                        <>
                          <span className="w-1.5 h-1.5 bg-red-400 rounded-full" />
                          Restreint
                        </>
                      ) : (
                        <>
                          <span className="w-1.5 h-1.5 bg-green-400 rounded-full" />
                          Actif
                        </>
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Section Photo de profil */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/30"
        >
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <FiCamera className="text-purple-400" />
            Photo de profil
          </h2>

          <form onSubmit={handleProfilePictureSubmit} className="space-y-4">
            {/* Preview zone */}
            <div className="flex items-center gap-4">
              {/* Avatar actuel ou preview */}
              <div className="relative group">
                <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-700 border-2 border-gray-600 group-hover:border-indigo-500 transition-colors">
                  {previewUrl ? (
                    <img 
                      src={previewUrl} 
                      alt="Preview" 
                      className="w-full h-full object-cover"
                    />
                  ) : user.profil?.url ? (
                    <Image 
                      src={user.profil.url} 
                      alt={user.username}
                      width={96}
                      height={96}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-indigo-600 text-3xl font-bold text-white">
                      {user.username?.charAt(0).toUpperCase() || "?"}
                    </div>
                  )}
                </div>
                {previewUrl && (
                  <button
                    type="button"
                    onClick={cancelPreview}
                    className="absolute -top-1 -right-1 p-1 bg-red-600 hover:bg-red-500 rounded-full text-white transition"
                  >
                    <FiX className="text-sm" />
                  </button>
                )}
              </div>

              {/* Upload zone */}
              <div className="flex-1">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                  id="profile-upload"
                />
                <label
                  htmlFor="profile-upload"
                  className="block w-full p-4 border-2 border-dashed border-gray-600 rounded-xl text-center cursor-pointer hover:border-indigo-500 hover:bg-indigo-500/5 transition-all"
                >
                  <FiUpload className="mx-auto text-2xl text-gray-400 mb-2" />
                  <span className="text-sm text-gray-400">
                    Cliquez pour choisir une image
                  </span>
                  <span className="block text-xs text-gray-500 mt-1">
                    PNG, JPG, WEBP (max 2MB)
                  </span>
                </label>
              </div>
            </div>

            {/* Bouton submit */}
            {profilePicture && (
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                type="submit"
                disabled={uploadProgress}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-600/50 text-white font-medium rounded-xl transition-all flex items-center justify-center gap-2"
              >
                {uploadProgress ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Envoi en cours...
                  </>
                ) : (
                  <>
                    <FiUpload />
                    Mettre à jour la photo
                  </>
                )}
              </motion.button>
            )}
          </form>
        </motion.div>
      </div>

      {/* Section Rôles et permissions */}
      {availableToggles.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/30"
        >
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <FiToggleRight className="text-green-400" />
            Rôles et permissions
          </h2>

          <div className="space-y-3">
            {availableToggles.map((key) => {
              const config = togglesConfig[key];
              const Icon = config.icon;
              const isActive = user[key];
              const isDisabled = loading || user.restreint;

              return (
                <motion.div
                  key={key}
                  whileHover={{ scale: isDisabled ? 1 : 1.01 }}
                  className={`bg-gray-900/50 rounded-xl p-4 transition-all ${
                    isDisabled ? 'opacity-60' : ''
                  }`}
                >
                  <div className="flex items-center gap-4">
                    {/* Icône */}
                    <div className={`p-3 rounded-xl ${
                      isActive 
                        ? `bg-${config.activeColor}-600/20` 
                        : 'bg-gray-700/50'
                    }`}>
                      <Icon className={`text-xl ${
                        isActive 
                          ? `text-${config.activeColor}-400` 
                          : 'text-gray-400'
                      }`} />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-white">{config.label}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{config.description}</p>
                    </div>

                    {/* Toggle switch */}
                    <button
                      onClick={() => handleToggle(key)}
                      disabled={isDisabled}
                      className={`relative w-14 h-8 rounded-full transition-all duration-300 ${
                        isActive 
                          ? 'bg-indigo-600' 
                          : 'bg-gray-600'
                      } ${isDisabled ? 'cursor-not-allowed' : 'cursor-pointer hover:opacity-80'}`}
                    >
                      <motion.div
                        layout
                        className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-lg ${
                          isActive ? 'left-7' : 'left-1'
                        }`}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      />
                    </button>
                  </div>

                  {/* Avertissement si restreint */}
                  {user.restreint && (
                    <div className="mt-3 flex items-center gap-2 text-xs text-yellow-400 bg-yellow-600/10 px-3 py-2 rounded-lg">
                      <FiAlertCircle />
                      <span>Votre compte est restreint. Vous ne pouvez pas modifier cette option.</span>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Section Informations sur les rôles */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-gradient-to-r from-indigo-600/10 to-purple-600/10 rounded-2xl p-6 border border-indigo-500/20"
      >
        <h3 className="text-base font-semibold text-white mb-3 flex items-center gap-2">
          <FiAlertCircle className="text-indigo-400" />
          À propos des rôles
        </h3>
        <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-300">
          <div className="space-y-2">
            <p className="flex items-start gap-2">
              <FiEdit3 className="text-indigo-400 mt-0.5 flex-shrink-0" />
              <span><strong>Indexeur :</strong> Permet d'ajouter et modifier des œuvres, chapitres et informations sur la plateforme.</span>
            </p>
          </div>
          <div className="space-y-2">
            <p className="flex items-start gap-2">
              <FiUsers className="text-purple-400 mt-0.5 flex-shrink-0" />
              <span><strong>Propriétaire :</strong> Si vous êtes traducteur ou éditeur, activez ce mode pour gérer vos œuvres.</span>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Parametre;
