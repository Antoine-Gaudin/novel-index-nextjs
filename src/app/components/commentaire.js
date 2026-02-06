"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Cookies from "js-cookie";

const Commentaire = ({ oeuvre, user: parentUser }) => {
  const [user, setUser] = useState(parentUser || null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const commentsPerPage = 5;

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  // Récupérer les informations de l'utilisateur seulement si non fourni par le parent
  useEffect(() => {
    if (parentUser) {
      setUser(parentUser);
      return;
    }
    const fetchUser = async () => {
      const jwt = Cookies.get("jwt");
      if (!jwt) {
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
  }, [parentUser]);



  useEffect(() => {
    const fetchComments = async () => {
      try {
        const res = await fetch(`${apiUrl}/api/commentaires?filters[oeuvres][documentId]=${oeuvre.documentId}&populate=users_permissions_users.profil`);
        const data = await res.json();
  
  
        const formattedComments = data.data.map((comment) => {
          const user = comment.users_permissions_users[0];
          return {
            id: comment.id,
            commentaire: comment.commentaire,
            createdAt: comment.createdAt,
            user: {
              username: user?.username || "Utilisateur inconnu",
              profil: user?.profil?.url || null,
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

  const handleSubmit = async (e) => {
    e.preventDefault();
  
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
            oeuvres: [oeuvre.documentId],
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
        createdAt: data.data.createdAt || new Date().toISOString(),
        user: {
          username: user.username,
          profil: user.profil?.formats?.small?.url || null,
        },
      };
  
      // Ajouter le nouveau commentaire formaté à l'état local
      setComments((prevComments) => {
        const updatedComments = [...prevComments, newCommentData];
        return updatedComments;
      });
  
      // Réinitialisation des champs
      setNewComment("");
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

// Formater la date d'un commentaire
const formatDate = (dateString) => {
  if (!dateString) return null;
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "À l'instant";
  if (diffMins < 60) return `Il y a ${diffMins} min`;
  if (diffHours < 24) return `Il y a ${diffHours}h`;
  if (diffDays < 7) return `Il y a ${diffDays}j`;
  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
};

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
                    <Image
                      src={user.profil}
                      alt={`${user.username}'s profile`}
                      width={48}
                      height={48}
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
                  {comment.createdAt && (
                    <span className="text-xs text-gray-500">{formatDate(comment.createdAt)}</span>
                  )}
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
            <Image
              src={user.profil.url}
              alt="Photo de profil"
              width={48}
              height={48}
              className="w-12 h-12 rounded-full object-cover"
            />
          ) : (
            <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center">
              <span className="text-sm text-gray-400">{user?.username?.[0]?.toUpperCase()}</span>
            </div>
          )}
          <p className="font-bold">{user?.username || "Utilisateur inconnu"}</p>
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
