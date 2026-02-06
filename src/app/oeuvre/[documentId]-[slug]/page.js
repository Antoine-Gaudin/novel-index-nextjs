"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Cookies from "js-cookie";
import AffiChapitre from "../../components/Affichapitre";
import Commentaire from "../../components/commentaire";
import DOMPurify from "dompurify";
import Image from "next/image";
import Link from "next/link";
import { slugify } from "@/utils/slugify";
import CoverBackground from "../../components/CoverBackground";
import { motion, AnimatePresence } from "framer-motion";

const OeuvrePage = () => {
  const pathname = usePathname();
  const parts = pathname.split("/");
  const documentId = parts[2].split("-")[0];
  const [oeuvre, setOeuvre] = useState(null);
  const [chapitres, setChapitres] = useState([]); // Liste des chapitres
  const [selectedChapter, setSelectedChapter] = useState(null); // Chapitre sélectionné pour le pop-up
  const [loading, setLoading] = useState(true);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscriptionId, setSubscriptionId] = useState(null);
  const [showAllTags, setShowAllTags] = useState(false);
  const [showAllGenres, setShowAllGenres] = useState(false);
  const [user, setUser] = useState(null);

  // Récupérer l'utilisateur connecté
  useEffect(() => {
    const fetchUser = async () => {
      const jwt = Cookies.get("jwt");
      if (!jwt) return;
      try {
        const res = await fetch(`${apiUrl}/api/users/me?populate=profil`, {
          headers: { Authorization: `Bearer ${jwt}` },
        });
        const data = await res.json();
        setUser(data);
      } catch (err) {
        console.error("Erreur récupération utilisateur :", err);
      }
    };
    fetchUser();
  }, []);

  useEffect(() => {
    const fetchOeuvre = async () => {
      try {
        const res = await fetch(
          `${apiUrl}/api/oeuvres/${documentId}?populate[0]=couverture&populate[1]=tags&populate[2]=genres&populate[3]=chapitres`
        );
        if (!res.ok) throw new Error("Erreur API");
        const data = await res.json();
        setOeuvre(data.data);
        const sortedChapitres = (data.data.chapitres || []).sort(
          (a, b) => a.order - b.order
        );
        setChapitres(sortedChapitres);
      } catch (err) {
        console.error("Erreur lors de la récupération de l'œuvre :", err);
      } finally {
        setLoading(false);
      }
    };

    if (documentId) {
      fetchOeuvre();
    }
  }, [documentId]);

  useEffect(() => {
    const checkAbonnement = async () => {
      const jwt = Cookies.get("jwt");
      const userInfo = Cookies.get("userInfo");
      const userId = userInfo ? JSON.parse(userInfo)?.documentId : null;

      if (!jwt || !userId || !oeuvre?.documentId) {
        console.warn(
          "❌ Paramètres manquants pour checkAbonnement, annulation."
        );
        return;
      }

      const url = `${apiUrl}/api/checkoeuvretimes?filters[oeuvres][documentId][$eq]=${oeuvre.documentId}&filters[users_permissions_users][documentId][$eq]=${userId}`;

      try {
        const res = await fetch(url, {
          headers: {
            Authorization: `Bearer ${jwt}`,
          },
        });

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
  }, [oeuvre?.documentId]);

  useEffect(() => {
    const updateLastChecked = async () => {
      const jwt = Cookies.get("jwt");
      const userInfo = Cookies.get("userInfo");
      const userId = userInfo ? JSON.parse(userInfo)?.documentId : null;

      if (!jwt || !userId || !oeuvre?.documentId || !subscriptionId) return;

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
  }, [subscriptionId]);

  const handleSubscribe = async () => {
    const jwt = localStorage.getItem("jwt");
    const userInfo = Cookies.get("userInfo");
    const userId = userInfo ? JSON.parse(userInfo)?.documentId : null;

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

    const data = await res.json();
    setIsSubscribed(true);
    setSubscriptionId(data.data.documentId);
  };

  const handleUnsubscribe = async () => {
    if (!subscriptionId) return;

    const jwt = localStorage.getItem("jwt");
    await fetch(`${apiUrl}/api/checkoeuvretimes/${subscriptionId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${jwt}`,
      },
    });

    setIsSubscribed(false);
    setSubscriptionId(null);
  };

  if (loading)
    return (
      <div className="bg-gray-900 text-white min-h-screen relative">
        {/* Skeleton Bannière */}
        <div className="absolute inset-x-0 top-0 h-[900px] bg-gradient-to-b from-gray-800 to-gray-900 animate-pulse"></div>
        <div className="relative z-10 max-w-6xl mx-auto p-4 pt-16 space-y-8">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
            {/* Skeleton Couverture */}
            <div className="w-64 h-96 bg-gray-700/50 rounded-xl animate-pulse"></div>
            <div className="flex flex-col space-y-4 flex-1 mt-4 md:mt-0">
              {/* Skeleton Titre */}
              <div className="h-10 bg-gray-700 rounded w-3/4 animate-pulse"></div>
              {/* Skeleton Auteur */}
              <div className="h-6 bg-gray-700 rounded w-1/2 animate-pulse"></div>
              {/* Skeleton Boutons */}
              <div className="flex flex-wrap gap-3">
                <div className="h-12 w-40 bg-gray-700 rounded-md animate-pulse"></div>
                <div className="h-12 w-44 bg-gray-700 rounded-md animate-pulse"></div>
                <div className="h-12 w-32 bg-gray-700 rounded-md animate-pulse"></div>
              </div>
            </div>
          </div>
          {/* Skeleton Badges */}
          <div className="flex flex-wrap gap-4">
            <div className="h-7 w-28 bg-gray-700 rounded-md animate-pulse"></div>
            <div className="h-7 w-24 bg-gray-700 rounded-md animate-pulse"></div>
            <div className="h-7 w-20 bg-gray-700 rounded-md animate-pulse"></div>
          </div>
          {/* Skeleton Synopsis */}
          <div className="space-y-2">
            <div className="h-4 bg-gray-700 rounded w-full animate-pulse"></div>
            <div className="h-4 bg-gray-700 rounded w-5/6 animate-pulse"></div>
            <div className="h-4 bg-gray-700 rounded w-4/6 animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  if (!oeuvre)
    return <p className="text-center text-red-500 mt-10">Œuvre introuvable.</p>;

  // Gestion de la redirection avec pop-up
  const handleReadClick = (type) => {
    if (!chapitres.length) return;

    const selectedChapitre =
      type === "first"
        ? chapitres[0] // Premier chapitre
        : chapitres[chapitres.length - 1]; // Dernier chapitre

    setSelectedChapter(selectedChapitre);
  };

  // Fermer le pop-up
  const closePopup = () => {
    setSelectedChapter(null);
  };

  return (
    <div className="bg-gray-900 text-white min-h-screen">
      {/* Wrapper pour le CoverBackground qui descend jusqu'au synopsis */}
      <div className="relative">
        {/* CoverBackground en fond absolu - descend très bas */}
        <div className="absolute inset-x-0 top-0 h-[900px] overflow-hidden">
          <CoverBackground />
          {/* Dégradés multiples pour effet de profondeur */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-transparent z-[5]"></div>
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-gray-900/20 to-gray-900/60 z-[6]"></div>
          <div className="absolute bottom-0 left-0 right-0 h-96 bg-gradient-to-t from-gray-900 via-gray-900/95 to-transparent z-[7]"></div>
        </div>

        {/* Contenu par-dessus le background */}
        <div className="relative z-20 pt-8">
          {/* Fil d'Ariane */}
          <div className="max-w-6xl mx-auto px-4 mb-6">
            <nav className="flex items-center text-sm text-gray-300 gap-2 bg-gray-800/40 backdrop-blur-md px-4 py-2 rounded-xl w-fit border border-gray-700/30 shadow-lg">
              <Link href="/" className="hover:text-white transition flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                Accueil
              </Link>
              <span className="text-gray-500">›</span>
              <Link href="/Oeuvres" className="hover:text-white transition">Œuvres</Link>
              <span className="text-gray-500">›</span>
              <span className="text-white truncate max-w-[200px]">{oeuvre.titre}</span>
            </nav>
          </div>

          {/* Contenu Principal */}
          <div className="max-w-6xl mx-auto px-4 space-y-8">
            {/* Présentation de l'œuvre */}
            <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
              {/* Image de couverture avec effet de profondeur */}
              {oeuvre.couverture?.url ? (
                <div className="relative group flex-shrink-0">
                  {/* Reflet flou derrière la couverture */}
                  <div className="absolute -inset-4 bg-gradient-to-b from-indigo-500/30 to-purple-500/30 rounded-2xl blur-3xl opacity-60 group-hover:opacity-80 transition-opacity"></div>
                  <Image
                    src={oeuvre.couverture.url}
                    alt={oeuvre.titre || "Image non disponible"}
                    width={256}
                    height={384}
                    className="relative w-64 h-96 object-cover rounded-xl shadow-2xl shadow-black/70 ring-1 ring-white/10 group-hover:scale-105 group-hover:shadow-indigo-500/30 transition-all duration-300"
                    priority
                  />
                  {chapitres.length > 0 && (
                    <span className="absolute -top-2 -right-2 bg-indigo-600 text-white text-sm font-bold px-3 py-1 rounded-full shadow-lg">
                      {chapitres.length} ch.
                    </span>
                  )}
                </div>
              ) : (
                <div className="w-64 h-96 bg-gray-700/50 backdrop-blur flex items-center justify-center rounded-xl text-gray-400 flex-shrink-0 border border-gray-600/30">
                  Pas de couverture
                </div>
              )}

              {/* Informations principales */}
              <div className="flex flex-col space-y-4 text-center md:text-left flex-1">
            <h1 className="text-3xl sm:text-4xl font-bold leading-tight">
              {oeuvre.titre || "Titre non disponible"}
            </h1>
            
            {/* Auteur & Traducteur */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-gray-300">
              <div className="flex items-center gap-2 justify-center sm:justify-start">
                <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span><strong>Auteur :</strong> {oeuvre.auteur || "Inconnu"}</span>
              </div>
              <div className="flex items-center gap-2 justify-center sm:justify-start">
                <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                </svg>
                <span><strong>Traduction :</strong> {oeuvre.traduction || "Inconnue"}</span>
              </div>
            </div>

            {/* Boutons d'action */}
            <div className="flex flex-wrap justify-center md:justify-start gap-3 pt-2">
              <button
                className="px-5 py-3 bg-indigo-600 text-white rounded-lg shadow-lg hover:bg-indigo-700 hover:shadow-indigo-500/25 transition-all flex items-center gap-2 font-medium"
                onClick={() => handleReadClick("first")}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                Commencer à lire
              </button>
              <button
                className="px-5 py-3 bg-green-600 text-white rounded-lg shadow-lg hover:bg-green-700 hover:shadow-green-500/25 transition-all flex items-center gap-2 font-medium"
                onClick={() => handleReadClick("last")}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                </svg>
                Dernier chapitre
              </button>
              <button
                className={`px-5 py-3 text-white rounded-lg shadow-lg transition-all flex items-center gap-2 font-medium ${
                  isSubscribed
                    ? "bg-red-600 hover:bg-red-700 hover:shadow-red-500/25"
                    : "bg-yellow-600 hover:bg-yellow-700 hover:shadow-yellow-500/25"
                }`}
                onClick={isSubscribed ? handleUnsubscribe : handleSubscribe}
              >                <svg className="w-5 h-5" fill={isSubscribed ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>                {isSubscribed ? "Se désabonner" : "S’abonner"}
              </button>
            </div>
          </div>
        </div>

        {/* Fenêtre Pop-up avec animation */}
        <AnimatePresence>
          {selectedChapter && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm flex justify-center items-center z-50 p-4"
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
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
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
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Informations supplémentaires */}
        <div className="bg-gray-800/40 backdrop-blur-md rounded-xl p-4 border border-gray-700/30">
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Informations
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {oeuvre.titrealt && (
              <div className="bg-yellow-600/20 border border-yellow-600/30 text-yellow-200 px-3 py-2 rounded-lg text-sm">
                <p className="text-xs text-yellow-400 mb-1">Titre alt.</p>
                <p className="font-medium truncate" title={oeuvre.titrealt}>{oeuvre.titrealt}</p>
              </div>
            )}
            {oeuvre.categorie && (
              <div className="bg-blue-600/20 border border-blue-600/30 text-blue-200 px-3 py-2 rounded-lg text-sm">
                <p className="text-xs text-blue-400 mb-1">Catégorie</p>
                <p className="font-medium">{oeuvre.categorie}</p>
              </div>
            )}
            <div className={`${oeuvre.licence === true ? 'bg-green-600/20 border-green-600/30 text-green-200' : 'bg-red-600/20 border-red-600/30 text-red-200'} border px-3 py-2 rounded-lg text-sm`}>
              <p className={`text-xs ${oeuvre.licence === true ? 'text-green-400' : 'text-red-400'} mb-1`}>Licence</p>
              <p className="font-medium">{oeuvre.licence === true ? '✅ Licencié' : '❌ Non licencié'}</p>
            </div>
            {oeuvre.langage && (
              <div className="bg-purple-600/20 border border-purple-600/30 text-purple-200 px-3 py-2 rounded-lg text-sm">
                <p className="text-xs text-purple-400 mb-1">Langage</p>
                <p className="font-medium">{oeuvre.langage}</p>
              </div>
            )}
            {oeuvre.etat && (
              <div className="bg-gray-600/20 border border-gray-500/30 text-gray-200 px-3 py-2 rounded-lg text-sm">
                <p className="text-xs text-gray-400 mb-1">État</p>
                <p className="font-medium">{oeuvre.etat}</p>
              </div>
            )}
            {oeuvre.type && (
              <div className="bg-gray-600/20 border border-gray-500/30 text-gray-200 px-3 py-2 rounded-lg text-sm">
                <p className="text-xs text-gray-400 mb-1">Type</p>
                <p className="font-medium">{oeuvre.type}</p>
              </div>
            )}
            {oeuvre.annee && (
              <div className="bg-gray-600/20 border border-gray-500/30 text-gray-200 px-3 py-2 rounded-lg text-sm">
                <p className="text-xs text-gray-400 mb-1">Année</p>
                <p className="font-medium">{oeuvre.annee}</p>
              </div>
            )}
          </div>
        </div>

        {oeuvre.synopsis && (
          <div className="bg-gray-800/40 backdrop-blur-md rounded-xl p-4 border border-gray-700/30">
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Synopsis
            </h3>
            <div
              className="text-gray-300 leading-relaxed"
              style={{ whiteSpace: "pre-wrap" }}
              dangerouslySetInnerHTML={{
                __html: DOMPurify.sanitize(
                  oeuvre.synopsis.replace(/\\r\\n|\\n|\\r/g, "<br>")
                ),
              }}
            ></div>
          </div>
        )}
          </div>
        </div>
      </div>
      {/* Fin du wrapper CoverBackground */}

      {/* Reste du contenu sur fond gris classique */}
      <div className="max-w-6xl mx-auto px-4 pb-8 space-y-8">
        {/* Tags & Genres séparés avec styles */}
        <div className="grid md:grid-cols-2 gap-4">
          {/* GENRES */}
          {oeuvre.genres?.length > 0 && (
            <div className="bg-gray-800/50 rounded-xl p-4">
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2 text-pink-400">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                Genres
                <span className="text-sm font-normal text-gray-400">({oeuvre.genres.length})</span>
              </h3>
              <div className="flex flex-wrap gap-2">
                {(showAllGenres ? oeuvre.genres : oeuvre.genres.slice(0, 15)).map((genre, idx) => (
                  <Link
                    key={`genre-${idx}`}
                    href={`/tags-genres/genre/${slugify(genre.titre)}`}
                    className="cursor-pointer bg-pink-600 hover:bg-pink-500 text-white px-3 py-1 rounded-full text-sm transition"
                    title={genre.description}
                  >
                    {genre.titre}
                  </Link>
                ))}
              </div>
              {oeuvre.genres.length > 15 && (
                <div className="mt-3">
                  <button
                    onClick={() => setShowAllGenres((prev) => !prev)}
                    className="text-pink-300 hover:underline text-sm"
                  >
                    {showAllGenres ? "Réduire" : `Voir tous (${oeuvre.genres.length})`}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAGS */}
          {oeuvre.tags?.length > 0 && (
            <div className="bg-gray-800/50 rounded-xl p-4">
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2 text-indigo-400">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                Tags
                <span className="text-sm font-normal text-gray-400">({oeuvre.tags.length})</span>
              </h3>
              <div className="flex flex-wrap gap-2">
                {(showAllTags ? oeuvre.tags : oeuvre.tags.slice(0, 15)).map((tag, idx) => (
                  <Link
                    key={`tag-${idx}`}
                    href={`/tags-genres/tag/${slugify(tag.titre)}`}
                    className="cursor-pointer bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1 rounded-full text-sm transition"
                    title={tag.description}
                  >
                    {tag.titre}
                  </Link>
                ))}
              </div>
              {oeuvre.tags.length > 15 && (
                <div className="mt-3">
                  <button
                    onClick={() => setShowAllTags((prev) => !prev)}
                    className="text-indigo-300 hover:underline text-sm"
                  >
                    {showAllTags ? "Réduire" : `Voir tous (${oeuvre.tags.length})`}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Chapitres et Achats */}
        <div className="bg-gray-800/50 rounded-xl p-4 space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            Chapitres
            {chapitres.length > 0 && (
              <span className="text-sm font-normal text-gray-400">({chapitres.length} disponibles)</span>
            )}
          </h3>
          <AffiChapitre
            documentId={oeuvre.documentId}
            licence={oeuvre.licence}
            totalChapitres={chapitres.length}
          />
        </div>

        {/* Section Commentaires */}
        <div className="bg-gray-800/50 rounded-xl p-4 space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <svg className="w-5 h-5 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            Commentaires
          </h3>
          <Commentaire oeuvre={oeuvre} user={user} />
        </div>
      </div>
    </div>
  );
};

export default OeuvrePage;
