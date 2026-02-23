"use client";

import { motion, AnimatePresence } from "framer-motion";
import React, { useState, useEffect } from "react";
import AffiChapitre from "./Affichapitre";
import Commentaire from "./commentaire";
import DOMPurify from "dompurify";
import Cookies from "js-cookie";
import Image from "next/image";
import Link from "next/link";
import { slugify } from "@/utils/slugify";
import { FiX, FiBook, FiChevronsRight, FiStar, FiUser, FiGlobe, FiInfo, FiFileText, FiMessageCircle, FiTag, FiFolder, FiExternalLink } from "react-icons/fi";
import KanveoBanner from "./KanveoBanner";

const FicheOeuvre = ({ oeuvre, onClose }) => {
  const [chapitres, setChapitres] = useState([]);
  const [selectedChapter, setSelectedChapter] = useState(null);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const [isVisible, setIsVisible] = useState(true);
  const [oeuvreDetails, setOeuvreDetails] = useState(null);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscriptionId, setSubscriptionId] = useState(null);

  // State pour voir + tags/genres
  const [showAllGenres, setShowAllGenres] = useState(false);
  const [showAllTags, setShowAllTags] = useState(false);

  // E2: Fermeture par Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsVisible(false);
        setTimeout(() => onClose(), 300);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // E3: Verrouiller le scroll du body
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  useEffect(() => {
    const fetchChapitres = async () => {
      try {
        const res = await fetch(
          `${apiUrl}/api/oeuvres/${oeuvre.documentId}?populate[0]=chapitres&populate[1]=tags&populate[2]=genres`
        );
        if (!res.ok) throw new Error("Erreur API");
        const data = await res.json();

        // Trier les chapitres
        const sortedChapitres = data.data.chapitres.sort(
          (a, b) => a.order - b.order
        );
        setChapitres(sortedChapitres);

        // Enregistrer les détails enrichis de l'œuvre
        setOeuvreDetails(data.data);
      } catch (err) {
        console.error("Erreur lors de la récupération des chapitres :", err);
      }
    };

    if (oeuvre.documentId) {
      fetchChapitres();
    }
  }, [oeuvre.documentId, apiUrl]);

  useEffect(() => {
    const checkAbonnement = async () => {
      const jwt = Cookies.get("jwt");
      const userInfo = Cookies.get("userInfo");
      let userId = null;
      try {
        userId = userInfo ? JSON.parse(userInfo)?.documentId : null;
      } catch {
        return;
      }

      if (!jwt || !userId || !oeuvre?.documentId) {
        return;
      }

      const url = `${apiUrl}/api/checkoeuvretimes?filters[oeuvres][documentId][$eq]=${oeuvre.documentId}&filters[users_permissions_users][documentId][$eq]=${userId}`;

      try {
        const res = await fetch(url, {
          headers: {
            Authorization: `Bearer ${jwt}`,
          },
        });

        if (!res.ok) {
          // Token expiré ou endpoint refusé — on ignore silencieusement
          return;
        }

        const data = await res.json();

        const abonnement = data?.data?.[0];
        if (abonnement) {
          setIsSubscribed(true);
          setSubscriptionId(abonnement.documentId);
        } else {
          setIsSubscribed(false);
          setSubscriptionId(null);
        }
      } catch (err) {
        console.error("❌ Erreur pendant checkAbonnement :", err);
      }
    };

    if (oeuvre?.documentId) {
      checkAbonnement();
    }
  }, [oeuvre?.documentId, apiUrl]);

  useEffect(() => {
    const updateLastChecked = async () => {
      const jwt = Cookies.get("jwt");
      if (!jwt || !subscriptionId) return;

      try {
        await fetch(`${apiUrl}/api/checkoeuvretimes/${subscriptionId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${jwt}`,
          },
          body: JSON.stringify({
            data: {
              lastChecked: new Date().toISOString(),
            },
          }),
        });
      } catch (err) {
        console.error("❌ Erreur lors de la mise à jour de lastChecked :", err);
      }
    };

    if (subscriptionId) {
      updateLastChecked();
    }
  }, [subscriptionId, apiUrl]);

  const handleSubscribe = async () => {
    const jwt = Cookies.get("jwt");
    if (!jwt) return; // garde : non connecté

    let userId = null;
    try {
      const userInfo = Cookies.get("userInfo");
      userId = userInfo ? JSON.parse(userInfo)?.documentId : null;
    } catch {
      return;
    }
    if (!userId) return;

    try {
      const res = await fetch(`${apiUrl}/api/checkoeuvretimes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwt}`,
        },
        body: JSON.stringify({
          data: {
            oeuvres: [oeuvre.documentId],
            users_permissions_users: [userId],
            lastChecked: new Date().toISOString(),
            notification: true,
            archived: false,
          },
        }),
      });
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      const data = await res.json();
      setIsSubscribed(true);
      setSubscriptionId(data.data.documentId);
    } catch (err) {
      console.error("❌ Erreur lors de l'abonnement :", err);
    }
  };

  const handleUnsubscribe = async () => {
    if (!subscriptionId) return;

    const jwt = Cookies.get("jwt");
    if (!jwt) return; // garde : non connecté

    try {
      const res = await fetch(`${apiUrl}/api/checkoeuvretimes/${subscriptionId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${jwt}`,
        },
      });
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      setIsSubscribed(false);
      setSubscriptionId(null);
    } catch (err) {
      console.error("❌ Erreur lors du désabonnement :", err);
    }
  };

  useEffect(() => {
    setIsVisible(true);
  }, [oeuvre]);

  const handleReadClick = (type) => {
    if (!chapitres.length) return;

    const selectedChapitre =
      type === "first" ? chapitres[0] : chapitres[chapitres.length - 1];

    setSelectedChapter(selectedChapitre);
  };

  const closePopup = () => {
    setSelectedChapter(null);
  };

  if (!oeuvre) {
    return null;
  }

  // Récupérer l'URL de la couverture
  const coverUrl = typeof oeuvre.couverture === "string" 
    ? oeuvre.couverture 
    : oeuvre.couverture?.url;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key={oeuvre.documentId}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => {
            setIsVisible(false);
            setTimeout(() => onClose(), 300);
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25 }}
            className="relative bg-gray-900 text-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden border border-gray-700/50"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Scrollable content */}
            <div className="overflow-y-auto max-h-[90vh]">
              
              {/* Header avec couverture floue en fond */}
              <div className="relative h-48 md:h-56">
                {/* Background flou */}
                <div
                  className="absolute inset-0"
                  style={{
                    backgroundImage: coverUrl
                      ? `linear-gradient(to bottom, rgba(17, 24, 39, 0.4), rgba(17, 24, 39, 1)), url('${coverUrl}')`
                      : `linear-gradient(to bottom, rgba(17, 24, 39, 0.4), rgba(17, 24, 39, 1))`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    filter: "blur(2px)",
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-gray-900/60 to-gray-900" />
              </div>

              {/* Zone d'informations principales */}
              <div className="relative px-6 md:px-8 -mt-32">
                <div className="flex flex-col md:flex-row items-center md:items-end gap-6">
                  {/* Couverture avec effet glow */}
                  <div className="relative group flex-shrink-0">
                    <div className="absolute -inset-3 bg-gradient-to-b from-indigo-500/30 to-purple-500/30 rounded-xl blur-2xl opacity-60 group-hover:opacity-80 transition-opacity" />
                    {coverUrl ? (
                      <Image
                        src={coverUrl}
                        alt={oeuvre.titre || "Image non disponible"}
                        width={180}
                        height={260}
                        className="relative w-36 h-52 md:w-44 md:h-64 object-cover rounded-xl shadow-2xl shadow-black/70 ring-1 ring-white/10 group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="relative w-36 h-52 md:w-44 md:h-64 bg-gray-700/50 backdrop-blur flex items-center justify-center rounded-xl text-gray-400 border border-gray-600/30">
                        <FiBook className="text-4xl" />
                      </div>
                    )}
                    {chapitres.length > 0 && (
                      <span className="absolute -top-2 -right-2 bg-indigo-600 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">
                        {chapitres.length} ch.
                      </span>
                    )}
                  </div>

                  {/* Infos principales */}
                  <div className="flex flex-col space-y-4 text-center md:text-left flex-1 pb-4">
                    <h1 className="text-2xl md:text-3xl font-bold leading-tight">
                      {oeuvre.titre || "Titre non disponible"}
                    </h1>
                    
                    {/* Auteur & Traducteur */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-gray-300 text-sm">
                      <div className="flex items-center gap-2 justify-center md:justify-start">
                        <FiUser className="text-indigo-400" />
                        <span><strong>Auteur :</strong> {oeuvreDetails?.auteur || "Inconnu"}</span>
                      </div>
                      <div className="flex items-center gap-2 justify-center md:justify-start">
                        <FiGlobe className="text-green-400" />
                        <span><strong>Trad :</strong> {oeuvre.traduction || "Inconnue"}</span>
                      </div>
                    </div>

                    {/* Boutons d'action */}
                    <div className="flex flex-wrap justify-center md:justify-start gap-2">
                      <button
                        className="px-4 py-2.5 bg-indigo-600 text-white rounded-lg shadow-lg hover:bg-indigo-700 hover:shadow-indigo-500/25 transition-all flex items-center gap-2 font-medium text-sm"
                        onClick={() => handleReadClick("first")}
                      >
                        <FiBook className="text-lg" />
                        Commencer
                      </button>
                      <button
                        className="px-4 py-2.5 bg-green-600 text-white rounded-lg shadow-lg hover:bg-green-700 hover:shadow-green-500/25 transition-all flex items-center gap-2 font-medium text-sm"
                        onClick={() => handleReadClick("last")}
                      >
                        <FiChevronsRight className="text-lg" />
                        Dernier ch.
                      </button>
                      <button
                        className={`px-4 py-2.5 text-white rounded-lg shadow-lg transition-all flex items-center gap-2 font-medium text-sm ${
                          isSubscribed
                            ? "bg-red-600 hover:bg-red-700 hover:shadow-red-500/25"
                            : "bg-yellow-600 hover:bg-yellow-700 hover:shadow-yellow-500/25"
                        }`}
                        onClick={isSubscribed ? handleUnsubscribe : handleSubscribe}
                      >
                        <FiStar className={`text-lg ${isSubscribed ? "fill-current" : ""}`} />
                        {isSubscribed ? "Désabonner" : "S'abonner"}
                      </button>
                      <Link
                        href={`/oeuvre/${oeuvre.documentId}-${slugify(oeuvre.titre || '')}`}
                        className="px-4 py-2.5 bg-gray-600 text-white rounded-lg shadow-lg hover:bg-gray-500 hover:shadow-gray-500/25 transition-all flex items-center gap-2 font-medium text-sm"
                      >
                        <FiExternalLink className="text-lg" />
                        Page complète
                      </Link>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bouton Fermer */}
              <button
                className="absolute top-4 right-4 bg-gray-800/80 hover:bg-red-600 text-white rounded-full w-10 h-10 flex items-center justify-center transition-colors z-10 backdrop-blur-sm border border-gray-700/50"
                onClick={() => {
                  setIsVisible(false);
                  setTimeout(() => onClose(), 300);
                }}
              >
                <FiX className="text-xl" />
              </button>

              {/* Contenu Principal */}
              <div className="px-6 md:px-8 py-6 space-y-6">
                
                {/* Informations supplémentaires */}
                <div className="bg-gray-800/40 backdrop-blur-md rounded-xl p-4 border border-gray-700/30">
                  <h3 className="text-base font-semibold mb-3 flex items-center gap-2">
                    <FiInfo className="text-blue-400" />
                    Informations
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                    {oeuvreDetails?.titrealt && (
                      <div className="bg-yellow-600/20 border border-yellow-600/30 text-yellow-200 px-3 py-2 rounded-lg text-xs">
                        <p className="text-yellow-400 mb-0.5">Titre alt.</p>
                        <p className="font-medium truncate" title={oeuvreDetails.titrealt}>{oeuvreDetails.titrealt}</p>
                      </div>
                    )}
                    {oeuvreDetails?.categorie && (
                      <div className="bg-blue-600/20 border border-blue-600/30 text-blue-200 px-3 py-2 rounded-lg text-xs">
                        <p className="text-blue-400 mb-0.5">Catégorie</p>
                        <p className="font-medium">{oeuvreDetails.categorie}</p>
                      </div>
                    )}
                    <div className={`${oeuvre.licence === true ? 'bg-green-600/20 border-green-600/30 text-green-200' : 'bg-red-600/20 border-red-600/30 text-red-200'} border px-3 py-2 rounded-lg text-xs`}>
                      <p className={`${oeuvre.licence === true ? 'text-green-400' : 'text-red-400'} mb-0.5`}>Licence</p>
                      <p className="font-medium">{oeuvre.licence === true ? '✅ Licencié' : '❌ Non licencié'}</p>
                    </div>
                    {oeuvreDetails?.langage && (
                      <div className="bg-purple-600/20 border border-purple-600/30 text-purple-200 px-3 py-2 rounded-lg text-xs">
                        <p className="text-purple-400 mb-0.5">Langage</p>
                        <p className="font-medium">{oeuvreDetails.langage}</p>
                      </div>
                    )}
                    {oeuvreDetails?.etat && (
                      <div className="bg-gray-600/20 border border-gray-500/30 text-gray-200 px-3 py-2 rounded-lg text-xs">
                        <p className="text-gray-400 mb-0.5">État</p>
                        <p className="font-medium">{oeuvreDetails.etat}</p>
                      </div>
                    )}
                    {oeuvreDetails?.type && (
                      <div className="bg-gray-600/20 border border-gray-500/30 text-gray-200 px-3 py-2 rounded-lg text-xs">
                        <p className="text-gray-400 mb-0.5">Type</p>
                        <p className="font-medium">{oeuvreDetails.type}</p>
                      </div>
                    )}
                    {oeuvreDetails?.annee && (
                      <div className="bg-gray-600/20 border border-gray-500/30 text-gray-200 px-3 py-2 rounded-lg text-xs">
                        <p className="text-gray-400 mb-0.5">Année</p>
                        <p className="font-medium">{oeuvreDetails.annee}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Synopsis */}
                {oeuvreDetails?.synopsis && (
                  <div className="bg-gray-800/40 backdrop-blur-md rounded-xl p-4 border border-gray-700/30">
                    <h3 className="text-base font-semibold mb-3 flex items-center gap-2">
                      <FiFileText className="text-green-400" />
                      Synopsis
                    </h3>
                    <div
                      className="text-gray-300 text-sm leading-relaxed"
                      style={{ whiteSpace: "pre-wrap" }}
                      dangerouslySetInnerHTML={{
                        __html: DOMPurify.sanitize(
                          typeof oeuvreDetails.synopsis === "string"
                            ? oeuvreDetails.synopsis.replace(/\\r\\n|\\n|\\r/g, "<br>")
                            : ""
                        ),
                      }}
                    />
                  </div>
                )}

                {/* Tags & Genres */}
                <div className="grid md:grid-cols-2 gap-4">
                  {/* GENRES */}
                  {oeuvreDetails?.genres?.length > 0 && (
                    <div className="bg-gray-800/40 backdrop-blur-md rounded-xl p-4 border border-gray-700/30">
                      <h3 className="text-base font-semibold mb-3 flex items-center gap-2 text-pink-400">
                        <FiFolder />
                        Genres
                        <span className="text-xs font-normal text-gray-400">({oeuvreDetails.genres.length})</span>
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {(showAllGenres ? oeuvreDetails.genres : oeuvreDetails.genres.slice(0, 10)).map((genre, idx) => (
                          <Link
                            key={`genre-${idx}`}
                            href={`/tags-genres/genre/${slugify(genre.titre)}`}
                            className="cursor-pointer bg-pink-600 hover:bg-pink-500 text-white px-2.5 py-1 rounded-full text-xs transition"
                            title={genre.description}
                          >
                            {genre.titre}
                          </Link>
                        ))}
                      </div>
                      {oeuvreDetails.genres.length > 10 && (
                        <button
                          onClick={() => setShowAllGenres((prev) => !prev)}
                          className="text-pink-300 hover:underline text-xs mt-2"
                        >
                          {showAllGenres ? "Réduire" : `Voir tous (${oeuvreDetails.genres.length})`}
                        </button>
                      )}
                    </div>
                  )}

                  {/* TAGS */}
                  {oeuvreDetails?.tags?.length > 0 && (
                    <div className="bg-gray-800/40 backdrop-blur-md rounded-xl p-4 border border-gray-700/30">
                      <h3 className="text-base font-semibold mb-3 flex items-center gap-2 text-indigo-400">
                        <FiTag />
                        Tags
                        <span className="text-xs font-normal text-gray-400">({oeuvreDetails.tags.length})</span>
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {(showAllTags ? oeuvreDetails.tags : oeuvreDetails.tags.slice(0, 10)).map((tag, idx) => (
                          <Link
                            key={`tag-${idx}`}
                            href={`/tags-genres/tag/${slugify(tag.titre)}`}
                            className="cursor-pointer bg-indigo-600 hover:bg-indigo-500 text-white px-2.5 py-1 rounded-full text-xs transition"
                            title={tag.description}
                          >
                            {tag.titre}
                          </Link>
                        ))}
                      </div>
                      {oeuvreDetails.tags.length > 10 && (
                        <button
                          onClick={() => setShowAllTags((prev) => !prev)}
                          className="text-indigo-300 hover:underline text-xs mt-2"
                        >
                          {showAllTags ? "Réduire" : `Voir tous (${oeuvreDetails.tags.length})`}
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Popup de redirection */}
                <AnimatePresence>
                  {selectedChapter && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex justify-center items-center z-[60] p-4"
                      onClick={closePopup}
                    >
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        transition={{ type: "spring", damping: 25 }}
                        className="bg-gray-800 text-white p-6 rounded-2xl shadow-2xl w-full max-w-md space-y-4 border border-gray-700"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-indigo-600 rounded-lg">
                            <FiExternalLink className="text-xl" />
                          </div>
                          <h2 className="text-xl font-bold">Redirection externe</h2>
                        </div>
                        <p className="text-gray-300">
                          Vous allez être redirigé vers le site de traduction pour lire ce chapitre.
                        </p>
                        <div className="bg-gray-900 p-3 rounded-lg">
                          <p className="text-sm text-gray-400">Chapitre</p>
                          <p className="font-semibold truncate">{selectedChapter.titre || "Titre non disponible"}</p>
                        </div>
                        <div className="flex gap-3 pt-2">
                          <button
                            className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition font-medium"
                            onClick={closePopup}
                          >
                            Annuler
                          </button>
                          <button
                            className="flex-1 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-lg transition font-medium flex items-center justify-center gap-2"
                            onClick={() => {
                              window.open(selectedChapter.url, "_blank");
                              closePopup();
                            }}
                          >
                            <span>Continuer</span>
                            <FiChevronsRight />
                          </button>
                        </div>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Publicité Kanveo */}
                <KanveoBanner format="mini" className="py-2" delay={1500} />

                {/* Chapitres */}
                <div className="bg-gray-800/40 backdrop-blur-md rounded-xl p-4 border border-gray-700/30">
                  <h3 className="text-base font-semibold mb-3 flex items-center gap-2">
                    <FiBook className="text-indigo-400" />
                    Chapitres
                    {chapitres.length > 0 && (
                      <span className="text-xs font-normal text-gray-400">({chapitres.length} disponibles)</span>
                    )}
                  </h3>
                  <AffiChapitre
                    documentId={oeuvre.documentId}
                    licence={oeuvre.licence}
                  />
                </div>

                {/* Commentaires */}
                <div className="bg-gray-800/40 backdrop-blur-md rounded-xl p-4 border border-gray-700/30">
                  <h3 className="text-base font-semibold mb-3 flex items-center gap-2">
                    <FiMessageCircle className="text-yellow-400" />
                    Commentaires
                  </h3>
                  <Commentaire oeuvre={oeuvre} />
                </div>

              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default FicheOeuvre;
