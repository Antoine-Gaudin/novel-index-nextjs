"use client";

import React, { useState, useEffect } from "react";
import Cookies from "js-cookie";

const Commentaire = ({ oeuvre }) => {
  const [user, setUser] = useState(null);
  const [comments, setComments] = useState([]); // Initialisé en tant que tableau vide
  const [newComment, setNewComment] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [inputCode, setInputCode] = useState("");
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1); // Page actuelle
  const commentsPerPage = 5; // Nombre de commentaires par page

  const apiUrl = "http://localhost:1337";

  // Récupérer les informations de l'utilisateur
  useEffect(() => {
    const fetchUser = async () => {
      const jwt = Cookies.get("jwt");
      if (!jwt) {
        console.error("JWT introuvable.");
        return;
      }

      try {
        const res = await fetch(`${apiUrl}/api/users/me?populate=profil`, {
          headers: {
            Authorization: `Bearer ${jwt}`,
          },
        });
        const data = await res.json();
        setUser(data);
      } catch (err) {
        console.error("Erreur lors de la récupération des informations utilisateur :", err);
      }
    };

    fetchUser();
  }, []);

  useEffect(() => {
    const fetchComments = async () => {
      try {
        const res = await fetch(`${apiUrl}/api/commentaires?filters[oeuvres][documentId]=${oeuvre.documentId}&populate=users_permissions_users.profil`);
        const data = await res.json();
  
  
        const formattedComments = data.data.map((comment) => {
          const user = comment.users_permissions_users[0]; // Accès au premier utilisateur lié
          return {
            id: comment.id,
            commentaire: comment.commentaire,
            user: {
              username: user?.username || "Utilisateur inconnu",
              profil: user?.profil?.formats?.small?.url || null, // Récupérer l'image au format "small"
            },
          };
        });
  
        setComments(formattedComments);
      } catch (error) {
        console.error("Erreur lors de la récupération des commentaires :", error);
      }
    };
  
    fetchComments();
  }, [oeuvre.documentId]);
  

  // Générer un code à 6 chiffres pour la vérification
  useEffect(() => {
    const generateCode = () => {
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      setVerificationCode(code);
    };
  
    generateCode();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    if (inputCode !== verificationCode) {
      setError("Le code de vérification est incorrect.");
      return;
    }
  
    if (!newComment.trim()) {
      setError("Le commentaire ne peut pas être vide.");
      return;
    }
  
    const jwt = Cookies.get("jwt");
    if (!jwt) {
      setError("Vous devez être connecté pour poster un commentaire.");
      return;
    }
  
    try {
      const res = await fetch(`${apiUrl}/api/commentaires`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwt}`,
        },
        body: JSON.stringify({
          data: {
            commentaire: newComment,
            users_permissions_users: user.id,
            oeuvres: oeuvre.id,
          },
        }),
      });
  
      if (!res.ok) {
        throw new Error("Erreur lors de l'envoi du commentaire.");
      }
  
      const data = await res.json();
  
      // Nouveau commentaire formaté pour le `setComments`
      const newCommentData = {
        id: data.data.id,
        commentaire: data.data.commentaire,
        user: {
          username: user.username,
          profil: user.profil?.formats?.small?.url || null, // Vérifie si l'utilisateur a une photo de profil
        },
      };
  
      // Ajouter le nouveau commentaire formaté à l'état local
      setComments((prevComments) => {
        const updatedComments = [...prevComments, newCommentData];
        return updatedComments;
      });
  
      // Réinitialisation des champs
      setNewComment("");
      setInputCode("");
      setError(null);
    } catch (err) {
      console.error("Erreur lors de la soumission du commentaire :", err);
      setError("Impossible d'envoyer le commentaire.");
    }
  };
  
  const lastCommentIndex = currentPage * commentsPerPage;
const firstCommentIndex = lastCommentIndex - commentsPerPage;
const currentComments = comments.slice(firstCommentIndex, lastCommentIndex);

const totalPages = Math.ceil(comments.length / commentsPerPage);

const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage((prev) => prev + 1);
  };
  
  const handlePreviousPage = () => {
    if (currentPage > 1) setCurrentPage((prev) => prev - 1);
  };
  

  return (
    <div className="bg-gray-900 text-white p-6 rounded-lg shadow-lg space-y-6">
      <h2 className="text-2xl font-bold">Commentaires</h2>
  
      {/* Affichage des commentaires existants */}
      <div className="space-y-4">
        {comments && comments.length > 0 ? (
          currentComments.map((comment) => {
            const user = comment.user || {}; // Gérer les données utilisateur associées
            return (
              <div key={comment.id} className="bg-gray-800 p-4 rounded-md shadow-md">
                <div className="flex items-center space-x-4">
                  {/* Afficher la photo de profil de l'utilisateur */}
                  {user.profil ? (
                    <img
                      src={`${apiUrl}${user.profil}`}
                      alt={`${user.username}'s profile`}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center">
                      <span className="text-sm text-gray-400">
                        {user.username?.[0]?.toUpperCase() || "?"}
                      </span>
                    </div>
                  )}
                  <p className="font-bold">{user.username || "Utilisateur inconnu"}</p>
                </div>
                <p className="mt-2 text-gray-300">{comment.commentaire}</p>
              </div>
            );
          })
        ) : (
          <p className="text-gray-400">Aucun commentaire pour cette œuvre.</p>
        )}
      </div>
      {totalPages > 1 && (
  <div className="flex justify-between items-center mt-4">
    <button
      onClick={handlePreviousPage}
      disabled={currentPage === 1}
      className={`px-4 py-2 rounded-md ${currentPage === 1 ? "bg-gray-600" : "bg-indigo-600 hover:bg-indigo-700"} text-white`}
    >
      Précédent
    </button>
    <span>
      Page {currentPage} sur {totalPages}
    </span>
    <button
      onClick={handleNextPage}
      disabled={currentPage === totalPages}
      className={`px-4 py-2 rounded-md ${currentPage === totalPages ? "bg-gray-600" : "bg-indigo-600 hover:bg-indigo-700"} text-white`}
    >
      Suivant
    </button>
  </div>
)}

  
      {/* Formulaire pour poster un commentaire */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <h3 className="text-xl font-bold">Poster un commentaire</h3>
  
        <div className="flex items-center space-x-4">
          {/* Photo de profil de l'utilisateur */}
          {user?.profil?.url ? (
            <img
              src={`${apiUrl}${user.profil.url}`}
              alt="Photo de profil"
              className="w-12 h-12 rounded-full object-cover"
            />
          ) : (
            <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center">
              <span className="text-sm text-gray-400">{user?.username?.[0]?.toUpperCase()}</span>
            </div>
          )}
          <p className="font-bold">{user?.username || "Utilisateur inconnu"}</p>
        </div>
  
        {/* Code de vérification */}
        <div>
          <label htmlFor="verificationCode" className="block text-gray-400 mb-2">
            Code de vérification : <strong>{verificationCode}</strong>
          </label>
          <input
            type="text"
            id="verificationCode"
            value={inputCode}
            onChange={(e) => setInputCode(e.target.value)}
            className="w-full px-4 py-2 rounded-md bg-gray-800 border border-gray-700 text-white focus:outline-none"
            placeholder="Recopiez le code"
          />
        </div>
  
        {/* Champ de texte pour le commentaire */}
        <div>
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="w-full px-4 py-2 rounded-md bg-gray-800 border border-gray-700 text-white focus:outline-none"
            placeholder="Écrivez votre commentaire ici..."
          />
        </div>
  
        {/* Bouton de soumission */}
        <button
          type="submit"
          className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
        >
          Poster
        </button>
        {error && <p className="text-red-500">{error}</p>}
      </form>
    </div>
  );
  
};

export default Commentaire;
