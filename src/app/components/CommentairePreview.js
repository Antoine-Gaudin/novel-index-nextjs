"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Cookies from "js-cookie";
import { FiUser, FiSend, FiChevronLeft, FiChevronRight, FiMessageCircle } from "react-icons/fi";

export default function CommentairePreview({ oeuvre }) {
  const [user, setUser] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [error, setError] = useState(null);
  const [sending, setSending] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const perPage = 4;
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    const jwt = Cookies.get("jwt");
    if (!jwt) return;
    (async () => {
      try {
        const res = await fetch(`${apiUrl}/api/users/me?populate=profil`, {
          headers: { Authorization: `Bearer ${jwt}` },
        });
        setUser(await res.json());
      } catch {}
    })();
  }, [apiUrl]);

  useEffect(() => {
    if (!oeuvre?.documentId) return;
    (async () => {
      try {
        const res = await fetch(
          `${apiUrl}/api/commentaires?filters[oeuvres][documentId]=${oeuvre.documentId}&populate=users_permissions_users.profil`
        );
        const data = await res.json();
        setComments(
          (data.data || []).map((c) => {
            const u = c.users_permissions_users?.[0];
            return {
              id: c.id,
              commentaire: c.commentaire,
              createdAt: c.createdAt,
              user: {
                username: u?.username || "Anonyme",
                profil: u?.profil?.url || null,
              },
            };
          })
        );
      } catch {}
    })();
  }, [oeuvre?.documentId, apiUrl]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return setError("Commentaire vide.");
    const jwt = Cookies.get("jwt");
    if (!jwt) return setError("Connectez-vous pour commenter.");
    setSending(true);
    try {
      const res = await fetch(`${apiUrl}/api/commentaires`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${jwt}` },
        body: JSON.stringify({
          data: {
            commentaire: newComment,
            users_permissions_users: user.id,
            oeuvres: [oeuvre.documentId],
          },
        }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setComments((prev) => [
        ...prev,
        {
          id: data.data.id,
          commentaire: data.data.commentaire,
          createdAt: data.data.createdAt || new Date().toISOString(),
          user: { username: user.username, profil: user.profil?.formats?.small?.url || null },
        },
      ]);
      setNewComment("");
      setError(null);
    } catch {
      setError("Impossible d'envoyer.");
    } finally {
      setSending(false);
    }
  };

  const timeLabel = (d) => {
    if (!d) return "";
    const diff = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
    if (diff < 1) return "À l'instant";
    if (diff < 60) return `${diff}min`;
    const h = Math.floor(diff / 60);
    if (h < 24) return `${h}h`;
    const days = Math.floor(h / 24);
    if (days < 7) return `${days}j`;
    return new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
  };

  const totalPages = Math.ceil(comments.length / perPage);
  const visible = comments.slice((currentPage - 1) * perPage, currentPage * perPage);

  const Avatar = ({ username, profil, size = 32 }) =>
    profil ? (
      <Image src={profil} alt="" width={size} height={size} className="rounded-full object-cover" style={{ width: size, height: size }} />
    ) : (
      <div
        className="rounded-full bg-gradient-to-br from-indigo-500/30 to-purple-500/20 flex items-center justify-center text-white/60 font-bold border border-white/[0.06]"
        style={{ width: size, height: size, fontSize: size * 0.38 }}
      >
        {username?.[0]?.toUpperCase() || "?"}
      </div>
    );

  return (
    <div className="space-y-4">
      {/* Liste commentaires */}
      {comments.length > 0 ? (
        <div className="space-y-2.5">
          {visible.map((c) => (
            <div
              key={c.id}
              className="group relative bg-white/[0.025] hover:bg-white/[0.04] border border-white/[0.05] hover:border-white/[0.09] rounded-xl px-4 py-3 transition-all duration-200"
            >
              <div className="flex items-start gap-3">
                <Avatar username={c.user.username} profil={c.user.profil} size={34} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[13px] font-semibold text-white/75">{c.user.username}</span>
                    <span className="text-[10px] text-white/20">{timeLabel(c.createdAt)}</span>
                  </div>
                  <p className="text-[13px] text-white/50 leading-relaxed">{c.commentaire}</p>
                </div>
              </div>
            </div>
          ))}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 pt-1">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-white/30 hover:text-white/60 disabled:opacity-20 disabled:cursor-default transition border border-white/[0.04]"
              >
                <FiChevronLeft className="text-xs" />
              </button>
              <span className="text-[11px] text-white/25 tabular-nums">
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-white/30 hover:text-white/60 disabled:opacity-20 disabled:cursor-default transition border border-white/[0.04]"
              >
                <FiChevronRight className="text-xs" />
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-6 gap-2">
          <div className="w-10 h-10 rounded-full bg-white/[0.03] flex items-center justify-center border border-white/[0.05]">
            <FiMessageCircle className="text-white/15 text-lg" />
          </div>
          <p className="text-[12px] text-white/20">Aucun commentaire pour le moment</p>
        </div>
      )}

      {/* Formulaire */}
      <form onSubmit={handleSubmit} className="relative">
        <div className="flex items-start gap-3 bg-white/[0.025] border border-white/[0.06] focus-within:border-indigo-500/30 rounded-xl px-4 py-3 transition-colors">
          <Avatar username={user?.username} profil={user?.profil?.url} size={30} />
          <div className="flex-1 min-w-0">
            <p className="text-[11px] text-white/25 mb-1.5 font-medium">
              {user?.username || "Connectez-vous pour commenter"}
            </p>
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Votre avis sur cette œuvre..."
              rows={2}
              className="w-full bg-transparent text-[13px] text-white/70 placeholder:text-white/15 resize-none focus:outline-none leading-relaxed"
            />
          </div>
          <button
            type="submit"
            disabled={sending || !newComment.trim()}
            className="flex-shrink-0 mt-4 w-8 h-8 flex items-center justify-center rounded-lg bg-indigo-500/15 hover:bg-indigo-500/30 text-indigo-400/60 hover:text-indigo-300 disabled:opacity-20 disabled:cursor-default transition-all border border-indigo-500/10 hover:border-indigo-500/25"
          >
            <FiSend className="text-sm" />
          </button>
        </div>
        {error && <p className="text-[11px] text-red-400/70 mt-1.5 pl-1">{error}</p>}
      </form>
    </div>
  );
}
