"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import Cookies from "js-cookie";
import DOMPurify from "dompurify";
import { motion, AnimatePresence } from "framer-motion";
import { FiShare2, FiCopy, FiCheck, FiClock, FiUsers, FiBookOpen, FiCalendar, FiTrendingUp, FiChevronDown, FiHelpCircle, FiEdit3, FiTag, FiHash } from "react-icons/fi";
import AffiChapitre from "../../components/Affichapitre";
import Commentaire from "../../components/commentaire";
import CoverBackground from "../../components/CoverBackground";
import AdBanner from "../../components/AdBanner";
import TaxonomyChip from "../../components/TaxonomyChip";
import { slugify } from "@/utils/slugify";
import { auteurSlug } from "@/utils/auteurSlug";

function sanitizeHtml(html) {
  if (typeof window === "undefined") return html;
  return DOMPurify.sanitize(html);
}

function buildEditorial({ titre, type, auteur, traduction, titrealt, categorie, genres, annee, etat, totalCh, readLabel, majLabel, licence, team }) {
  const typeName = type ? type.toLowerCase() : "œuvre";
  const article = type ? "un" : "une";

  let intro = `${titre} est ${article} ${typeName}`;
  if (auteur) intro += ` de ${auteur}`;
  if (traduction) intro += `, dont la traduction française est assurée par ${traduction}`;
  intro += ".";
  if (titrealt) intro += ` Cette œuvre est également connue sous le titre alternatif « ${titrealt} ».`;

  const genresList = genres?.length > 0 ? genres.slice(0, 5).map((g) => g.titre).join(", ") : null;
  let corps = categorie ? `Classée dans la catégorie ${categorie}, cette œuvre` : "Cette œuvre";
  if (genresList) corps += ` explore les genres ${genresList}`;
  corps += ".";
  if (annee) corps += ` Publiée pour la première fois en ${annee}`;
  if (etat) corps += `${annee ? "," : "."} elle est actuellement ${etat.toLowerCase()}`;
  if (annee || etat) corps += ".";

  let stats = totalCh > 0
    ? `À ce jour, ${totalCh} chapitre${totalCh > 1 ? "s" : ""} sont disponibles en français sur Novel-Index, soit environ ${readLabel} de lecture.`
    : "Aucun chapitre n'est encore disponible en français pour le moment.";
  if (majLabel) stats += ` La dernière mise à jour des chapitres date de ${majLabel.toLowerCase()}.`;
  if (team?.titre) stats += ` La traduction est portée par l'équipe ${team.titre}.`;

  const cta = licence
    ? `${titre} a été officiellement licenciée. Pour soutenir l'auteur original et son éditeur, nous vous invitons à acquérir la version officielle.`
    : null;

  return { intro, corps, stats, cta };
}

function buildFaq({ titre, auteur, traduction, etat, totalCh, genres, licence, annee, team }) {
  const items = [];

  items.push({
    q: `Combien de chapitres compte ${titre} ?`,
    a: totalCh > 0
      ? `${titre} compte actuellement ${totalCh} chapitre${totalCh > 1 ? "s" : ""} disponible${totalCh > 1 ? "s" : ""} en français sur Novel-Index.`
      : `Aucun chapitre de ${titre} n'est encore disponible en français.`,
  });

  items.push({
    q: `Qui est l'auteur de ${titre} ?`,
    a: auteur
      ? `${titre} a été écrit par ${auteur}.`
      : `L'auteur original de ${titre} n'est pas renseigné sur Novel-Index pour le moment.`,
  });

  items.push({
    q: `Qui traduit ${titre} en français ?`,
    a: team?.titre
      ? `La traduction française de ${titre} est assurée par l'équipe ${team.titre}.`
      : traduction
        ? `La traduction française de ${titre} est assurée par ${traduction}.`
        : `Aucune équipe de traduction n'est référencée pour ${titre}.`,
  });

  if (etat) {
    items.push({
      q: `Quel est le statut de ${titre} ?`,
      a: `${titre} est actuellement ${etat.toLowerCase()}.`,
    });
  }

  if (genres?.length > 0) {
    items.push({
      q: `Quels sont les genres de ${titre} ?`,
      a: `${titre} relève des genres suivants : ${genres.map((g) => g.titre).join(", ")}.`,
    });
  }

  items.push({
    q: `${titre} est-elle une œuvre licenciée ?`,
    a: licence
      ? `Oui, ${titre} a été officiellement licenciée. La traduction amateur n'est plus disponible — vous pouvez retrouver l'édition officielle chez l'éditeur.`
      : `Non, ${titre} n'a pas été officiellement licenciée à ce jour.`,
  });

  items.push({
    q: `Où peut-on lire ${titre} en français ?`,
    a: licence
      ? `${titre} étant licenciée, nous vous invitons à acquérir l'édition officielle pour la lire.`
      : `Vous pouvez lire ${titre} directement depuis Novel-Index : cliquez sur un chapitre dans la liste de cette page pour être redirigé vers le site du traducteur.`,
  });

  if (annee) {
    items.push({
      q: `Quand ${titre} a-t-elle été publiée ?`,
      a: `${titre} a été publiée pour la première fois en ${annee}.`,
    });
  }

  return items;
}

export default function OeuvreClient({
  initialOeuvre,
  initialChapitres,
  documentId,
  initialTeam = null,
  initialSimilar = [],
  initialSubscribers = 0,
  initialByType = [],
  initialByGenre = [],
  initialByTag = [],
  initialByAuthor = [],
  initialByTeam = [],
  initialSimilarAuthor = null,
  primaryGenre = null,
  primaryTag = null,
}) {
  const router = useRouter();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  const [oeuvre] = useState(initialOeuvre);
  const [chapitres] = useState(initialChapitres);
  const [selectedChapter, setSelectedChapter] = useState(null);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscriptionId, setSubscriptionId] = useState(null);
  const [showAllTags, setShowAllTags] = useState(false);
  const [showAllGenres, setShowAllGenres] = useState(false);
  const [user, setUser] = useState(null);

  const [team] = useState(initialTeam);
  const [subscribersCount] = useState(initialSubscribers);
  const [similarOeuvres] = useState(initialSimilar);
  const [byTypeOeuvres] = useState(initialByType);
  const [byGenreOeuvres] = useState(initialByGenre);
  const [byTagOeuvres] = useState(initialByTag);
  const [byAuthorOeuvres] = useState(initialByAuthor);
  const [byTeamOeuvres] = useState(initialByTeam);
  const [similarAuthor] = useState(initialSimilarAuthor);
  const [lastChapterDate, setLastChapterDate] = useState(() => {
    if (initialChapitres && initialChapitres.length > 0) {
      const lastCh = initialChapitres[initialChapitres.length - 1];
      const d = lastCh.publishedAt || lastCh.createdAt;
      return d ? new Date(d) : null;
    }
    return null;
  });
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [copied, setCopied] = useState(false);
  const [faqOpenIndex, setFaqOpenIndex] = useState(null);

  // Upload couverture (admin uniquement, si pas de couverture)
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const isAdmin = user?.admin === true;

  const handleCoverUpload = async (file) => {
    if (!file) return;
    setUploadError(null);
    setUploadingCover(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("documentId", documentId);
      const jwt = Cookies.get("jwt");
      const res = await fetch("/api/upload-cover", {
        method: "POST",
        headers: jwt ? { Authorization: `Bearer ${jwt}` } : {},
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Échec upload");
      router.refresh();
    } catch (e) {
      setUploadError(e.message);
    } finally {
      setUploadingCover(false);
    }
  };

  // Recalcul si la liste de chapitres change après mount (revalidate)
  useEffect(() => {
    if (chapitres.length > 0) {
      const lastCh = chapitres[chapitres.length - 1];
      if (lastCh.publishedAt || lastCh.createdAt) {
        setLastChapterDate(new Date(lastCh.publishedAt || lastCh.createdAt));
      }
    }
  }, [chapitres]);

  useEffect(() => {
    const handleClickOutside = () => setShowShareMenu(false);
    if (showShareMenu) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showShareMenu]);

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
  }, [apiUrl]);

  // team / similar / subscribersCount sont fournis par le SSR (page.js) — plus de fetch côté client.

  useEffect(() => {
    const checkAbonnement = async () => {
      const jwt = Cookies.get("jwt");
      const userInfo = Cookies.get("userInfo");
      const userId = userInfo ? JSON.parse(userInfo)?.documentId : null;

      if (!jwt || !userId || !oeuvre?.documentId) return;

      const url = `${apiUrl}/api/checkoeuvretimes?filters[oeuvres][documentId][$eq]=${oeuvre.documentId}&filters[users_permissions_users][documentId][$eq]=${userId}`;

      try {
        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${jwt}` },
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
        console.error("Erreur pendant checkAbonnement :", err);
      }
    };

    if (oeuvre?.documentId) {
      checkAbonnement();
    }
  }, [oeuvre?.documentId, apiUrl]);

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
        console.error("Erreur lors de la mise à jour de lastChecked :", err);
      }
    };

    if (subscriptionId) {
      updateLastChecked();
    }
  }, [subscriptionId, oeuvre?.documentId, apiUrl]);

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

  const handleShare = async (e) => {
    e.stopPropagation();
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: oeuvre?.titre,
          text: `Découvrez "${oeuvre?.titre}" sur Novel Index`,
          url: url,
        });
      } catch (err) {
        // L'utilisateur a annulé ou erreur
      }
    } else {
      setShowShareMenu(!showShareMenu);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Erreur copie:", err);
    }
  };

  const estimatedReadingTime = chapitres.length * 5;
  const formatReadingTime = (minutes) => {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
  };

  const formatRelativeDate = (date) => {
    if (!date) return null;
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Aujourd'hui";
    if (diffDays === 1) return "Hier";
    if (diffDays < 7) return `Il y a ${diffDays} jours`;
    if (diffDays < 30) return `Il y a ${Math.floor(diffDays / 7)} semaines`;
    if (diffDays < 365) return `Il y a ${Math.floor(diffDays / 30)} mois`;
    return `Il y a ${Math.floor(diffDays / 365)} ans`;
  };

  // Données pour le bloc éditorial et la FAQ (uniquement si oeuvre est défini)
  const totalCh = oeuvre?.licence
    ? oeuvre?.achatlivres?.length || 0
    : chapitres.length;
  const readLabel = totalCh > 0 ? formatReadingTime(totalCh * 5) : null;
  const majLabel = lastChapterDate ? formatRelativeDate(lastChapterDate) : null;

  // Date du premier chapitre + fréquence moyenne de publication
  const firstChapterDate =
    chapitres.length > 0 && (chapitres[0].publishedAt || chapitres[0].createdAt)
      ? new Date(chapitres[0].publishedAt || chapitres[0].createdAt)
      : null;

  const frequencyLabel = (() => {
    if (!firstChapterDate || !lastChapterDate || chapitres.length < 2) return null;
    const diffDays = Math.max(
      1,
      Math.round((lastChapterDate - firstChapterDate) / (1000 * 60 * 60 * 24))
    );
    const chapPerWeek = (chapitres.length / diffDays) * 7;
    if (chapPerWeek >= 5) return `~${Math.round(chapPerWeek)} chapitres / semaine`;
    if (chapPerWeek >= 1) return `~${chapPerWeek.toFixed(1)} chapitres / semaine`;
    const daysPerChap = Math.round(diffDays / chapitres.length);
    if (daysPerChap <= 14) return `~1 chapitre tous les ${daysPerChap} jours`;
    const weeksPerChap = Math.round(daysPerChap / 7);
    return `~1 chapitre toutes les ${weeksPerChap} semaines`;
  })();

  const formatAbsoluteDate = (date) => {
    if (!date) return null;
    return date.toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const editorial = oeuvre
    ? buildEditorial({
        titre: oeuvre.titre,
        type: oeuvre.type,
        auteur: oeuvre.auteur,
        traduction: oeuvre.traduction,
        titrealt: oeuvre.titrealt,
        categorie: oeuvre.categorie,
        genres: oeuvre.genres,
        annee: oeuvre.annee,
        etat: oeuvre.etat,
        totalCh,
        readLabel,
        majLabel,
        licence: oeuvre.licence,
        team,
      })
    : null;

  const faqItems = oeuvre
    ? buildFaq({
        titre: oeuvre.titre,
        auteur: oeuvre.auteur,
        traduction: oeuvre.traduction,
        etat: oeuvre.etat,
        totalCh,
        genres: oeuvre.genres,
        licence: oeuvre.licence,
        annee: oeuvre.annee,
        team,
      })
    : [];

  if (!oeuvre)
    return (
      <div className="bg-gray-900 text-white min-h-screen flex flex-col items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">📚</div>
          <h1 className="text-2xl font-bold mb-2">Œuvre introuvable</h1>
          <p className="text-gray-400 mb-6">
            Cette œuvre n'existe pas ou a été supprimée.
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/Oeuvres"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
            >
              Voir les œuvres
            </Link>
            <button
              onClick={() => window.history.back()}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
            >
              Retour
            </button>
          </div>
        </div>
      </div>
    );

  const handleReadClick = (type) => {
    if (!chapitres.length) return;

    const selectedChapitre =
      type === "first"
        ? chapitres[0]
        : chapitres[chapitres.length - 1];

    setSelectedChapter(selectedChapitre);
  };

  const closePopup = () => {
    setSelectedChapter(null);
  };

  return (
    <div className="bg-gray-900 text-white min-h-screen">
      <div className="relative">
        <div className="absolute inset-x-0 top-0 h-[900px] overflow-hidden">
          <CoverBackground />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-transparent z-[5]"></div>
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-gray-900/20 to-gray-900/60 z-[6]"></div>
          <div className="absolute bottom-0 left-0 right-0 h-96 bg-gradient-to-t from-gray-900 via-gray-900/95 to-transparent z-[7]"></div>
        </div>

        <div className="relative z-20 pt-8">
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

          <div className="max-w-6xl mx-auto px-4 space-y-8">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
              {oeuvre.couverture?.url ? (
                <div className="relative group flex-shrink-0">
                  <div className="absolute -inset-4 bg-gradient-to-b from-indigo-500/30 to-purple-500/30 rounded-2xl blur-3xl opacity-60 group-hover:opacity-80 transition-opacity"></div>
                  <Image
                    src={oeuvre.couverture.url}
                    alt={`Couverture de ${oeuvre.titre}${oeuvre.type ? ` — ${oeuvre.type}` : ""}${oeuvre.auteur ? ` par ${oeuvre.auteur}` : ""}`}
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
                <div className="w-64 h-96 bg-gray-700/50 backdrop-blur flex flex-col items-center justify-center rounded-xl text-gray-400 flex-shrink-0 border border-gray-600/30 p-4 text-center gap-3">
                  {isAdmin ? (
                    <>
                      <span className="text-sm">Aucune couverture</span>
                      <label
                        className={`cursor-pointer px-3 py-2 rounded-lg text-xs font-medium transition ${
                          uploadingCover
                            ? "bg-gray-600 text-gray-300 cursor-wait"
                            : "bg-indigo-600 hover:bg-indigo-500 text-white"
                        }`}
                      >
                        {uploadingCover ? "Envoi…" : "+ Ajouter une image"}
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          disabled={uploadingCover}
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) handleCoverUpload(f);
                            e.target.value = "";
                          }}
                        />
                      </label>
                      {uploadError && (
                        <span className="text-xs text-red-400 break-words">
                          {uploadError}
                        </span>
                      )}
                    </>
                  ) : (
                    "Pas de couverture"
                  )}
                </div>
              )}

              <div className="flex flex-col space-y-4 text-center md:text-left flex-1">
            <h1 className="text-3xl sm:text-4xl font-bold leading-tight">
              {oeuvre.titre || "Titre non disponible"}
            </h1>

            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-gray-300">
              <div className="flex items-center gap-2 justify-center sm:justify-start">
                <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span>
                  <strong>Auteur :</strong>{" "}
                  {oeuvre.auteur ? (
                    <Link
                      href={`/auteur/${auteurSlug(oeuvre.auteur)}`}
                      className="text-indigo-300 hover:text-indigo-200 underline-offset-4 hover:underline transition-colors"
                      title={`Voir toutes les œuvres de ${oeuvre.auteur} traduites en français`}
                    >
                      {oeuvre.auteur}
                    </Link>
                  ) : (
                    "Inconnu"
                  )}
                </span>
              </div>
              <div className="flex items-center gap-2 justify-center sm:justify-start">
                <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                </svg>
                <span>
                  <strong>Traduction :</strong>{" "}
                  {oeuvre.traduction ? (
                    team?.documentId ? (
                      <Link
                        href={`/Teams/${team.documentId}-${slugify(team.titre || oeuvre.traduction)}`}
                        className="text-green-300 hover:text-green-200 underline-offset-4 hover:underline transition-colors"
                        title={`Voir la fiche de l'équipe ${oeuvre.traduction} et toutes ses traductions`}
                      >
                        {oeuvre.traduction}
                      </Link>
                    ) : (
                      oeuvre.traduction
                    )
                  ) : (
                    "Inconnue"
                  )}
                </span>
              </div>
            </div>

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
                </svg>                {isSubscribed ? "Se désabonner" : "S'abonner"}
              </button>

              <div className="relative">
                <button
                  className="px-5 py-3 bg-gray-700 text-white rounded-lg shadow-lg hover:bg-gray-600 transition-all flex items-center gap-2 font-medium"
                  onClick={(e) => handleShare(e)}
                >
                  <FiShare2 className="w-5 h-5" />
                  Partager
                </button>

                {showShareMenu && (
                  <div
                    className="absolute top-full left-0 mt-2 bg-gray-800 border border-gray-700 rounded-xl shadow-xl p-3 space-y-2 z-50 min-w-[200px]"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => {
                        copyToClipboard();
                        setShowShareMenu(false);
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-700 rounded-lg transition-colors text-left"
                    >
                      {copied ? <FiCheck className="text-green-400" /> : <FiCopy />}
                      <span>{copied ? "Copié !" : "Copier le lien"}</span>
                    </button>
                    <a
                      href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Découvrez "${oeuvre?.titre}" sur Novel Index`)}&url=${encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-700 rounded-lg transition-colors"
                      onClick={() => setShowShareMenu(false)}
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                      <span>Twitter / X</span>
                    </a>
                    <a
                      href={`https://www.reddit.com/submit?url=${encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '')}&title=${encodeURIComponent(oeuvre?.titre || '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-700 rounded-lg transition-colors"
                      onClick={() => setShowShareMenu(false)}
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/></svg>
                      <span>Reddit</span>
                    </a>
                    <button
                      onClick={() => setShowShareMenu(false)}
                      className="w-full text-center text-sm text-gray-500 hover:text-gray-300 pt-2 border-t border-gray-700"
                    >
                      Fermer
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-wrap justify-center md:justify-start gap-4 pt-2">
              {subscribersCount > 0 && (
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <FiUsers className="text-pink-400" />
                  <span><strong className="text-white">{subscribersCount}</strong> abonné{subscribersCount > 1 ? 's' : ''}</span>
                </div>
              )}
              {chapitres.length > 0 && (
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <FiClock className="text-blue-400" />
                  <span>~<strong className="text-white">{formatReadingTime(estimatedReadingTime)}</strong> de lecture</span>
                </div>
              )}
              {lastChapterDate && (
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <FiCalendar className="text-green-400" />
                  <span>MAJ <strong className="text-white">{formatRelativeDate(lastChapterDate)}</strong></span>
                </div>
              )}
            </div>

            {team && (
              <Link
                href={`/Teams/${team.documentId}-${slugify(team.titre)}`}
                className="inline-flex items-center gap-3 bg-gray-800/60 hover:bg-gray-700/60 border border-gray-700/50 hover:border-indigo-500/50 rounded-xl px-4 py-3 transition-all group"
              >
                {(team.couverture?.formats?.small?.url || team.couverture?.url) ? (
                  <Image
                    src={team.couverture?.formats?.small?.url || team.couverture.url}
                    alt={team.titre}
                    width={32}
                    height={32}
                    className="w-8 h-8 rounded-lg object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 bg-indigo-600/30 rounded-lg flex items-center justify-center">
                    <FiUsers className="text-indigo-400" />
                  </div>
                )}
                <div className="text-left">
                  <p className="text-xs text-gray-400">Traduit par</p>
                  <p className="font-medium group-hover:text-indigo-400 transition-colors">{team.titre}</p>
                </div>
                <svg className="w-4 h-4 text-gray-500 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            )}
          </div>
        </div>

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
              <p className="font-medium">{oeuvre.licence === true ? 'Licencié' : 'Non licencié'}</p>
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

        <AdBanner format="banner" className="py-2" delay={1000} />

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
                __html: sanitizeHtml(
                  oeuvre.synopsis.replace(/\r?\n/g, "<br>")
                ),
              }}
            ></div>
          </div>
        )}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 pb-8 space-y-8">
        {editorial && (
          <section className="bg-gray-800/40 backdrop-blur-md rounded-xl p-5 border border-gray-700/30">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <FiBookOpen className="w-5 h-5 text-indigo-400" />
              À propos de {oeuvre.titre}
            </h2>
            <div className="text-gray-300 leading-relaxed space-y-3">
              <p>{editorial.intro}</p>
              <p>{editorial.corps}</p>
              <p>{editorial.stats}</p>
              {editorial.cta && (
                <p className="text-amber-300/90 italic">{editorial.cta}</p>
              )}
            </div>
          </section>
        )}

        {totalCh > 0 && (
          <section className="bg-gray-800/40 backdrop-blur-md rounded-xl p-5 border border-gray-700/30">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <FiTrendingUp className="w-5 h-5 text-emerald-400" />
              Statistiques de {oeuvre.titre}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              <div className="bg-gray-900/40 rounded-lg p-3 border border-gray-700/30">
                <p className="text-xs text-gray-400 mb-1 flex items-center gap-1">
                  <FiBookOpen className="w-3.5 h-3.5" /> Chapitres
                </p>
                <p className="text-lg font-semibold text-white">{totalCh}</p>
              </div>
              {readLabel && (
                <div className="bg-gray-900/40 rounded-lg p-3 border border-gray-700/30">
                  <p className="text-xs text-gray-400 mb-1 flex items-center gap-1">
                    <FiClock className="w-3.5 h-3.5" /> Lecture estimée
                  </p>
                  <p className="text-lg font-semibold text-white">{readLabel}</p>
                </div>
              )}
              {firstChapterDate && (
                <div className="bg-gray-900/40 rounded-lg p-3 border border-gray-700/30">
                  <p className="text-xs text-gray-400 mb-1 flex items-center gap-1">
                    <FiCalendar className="w-3.5 h-3.5" /> Premier chapitre
                  </p>
                  <p className="text-sm font-semibold text-white">{formatAbsoluteDate(firstChapterDate)}</p>
                </div>
              )}
              {lastChapterDate && (
                <div className="bg-gray-900/40 rounded-lg p-3 border border-gray-700/30">
                  <p className="text-xs text-gray-400 mb-1 flex items-center gap-1">
                    <FiCalendar className="w-3.5 h-3.5" /> Dernier chapitre
                  </p>
                  <p className="text-sm font-semibold text-white">{formatAbsoluteDate(lastChapterDate)}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{formatRelativeDate(lastChapterDate)}</p>
                </div>
              )}
              {frequencyLabel && (
                <div className="bg-gray-900/40 rounded-lg p-3 border border-gray-700/30 sm:col-span-2">
                  <p className="text-xs text-gray-400 mb-1 flex items-center gap-1">
                    <FiTrendingUp className="w-3.5 h-3.5" /> Fréquence de publication
                  </p>
                  <p className="text-sm font-semibold text-white">{frequencyLabel}</p>
                </div>
              )}
              {subscribersCount > 0 && (
                <div className="bg-gray-900/40 rounded-lg p-3 border border-gray-700/30">
                  <p className="text-xs text-gray-400 mb-1 flex items-center gap-1">
                    <FiUsers className="w-3.5 h-3.5" /> Abonnés
                  </p>
                  <p className="text-lg font-semibold text-white">{subscribersCount}</p>
                </div>
              )}
              {oeuvre.etat && (
                <div className="bg-gray-900/40 rounded-lg p-3 border border-gray-700/30">
                  <p className="text-xs text-gray-400 mb-1">Statut</p>
                  <p className="text-sm font-semibold text-white">{oeuvre.etat}</p>
                </div>
              )}
            </div>
          </section>
        )}

        <div className="grid md:grid-cols-2 gap-4">
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
                  <TaxonomyChip
                    key={`genre-${idx}`}
                    type="genre"
                    label={genre.titre}
                    title={genre.description || `Découvrir toutes les œuvres du genre ${genre.titre} sur Novel-Index`}
                  />
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
                  <TaxonomyChip
                    key={`tag-${idx}`}
                    type="tag"
                    label={tag.titre}
                    title={tag.description || `Découvrir toutes les œuvres avec la thématique ${tag.titre} sur Novel-Index`}
                  />
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

        {oeuvre.licence && (
          <div className="bg-gradient-to-r from-amber-600/30 to-orange-600/30 border border-amber-500 rounded-xl p-4 mb-4">
            <div className="flex items-start gap-3">
              <svg className="w-6 h-6 text-amber-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div className="flex-1">
                <h4 className="font-bold text-amber-400 text-lg">Oeuvre sous licence officielle</h4>
                <p className="text-gray-300 text-sm mt-1">
                  Cette oeuvre a été licenciée. Les chapitres de la traduction amateur ne sont plus disponibles.
                </p>
                {oeuvre.oeuvre_licence && (
                  <Link
                    href={`/oeuvre/${oeuvre.oeuvre_licence.documentId}-${slugify(oeuvre.oeuvre_licence.titre)}`}
                    className="inline-flex items-center gap-2 mt-3 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-medium transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                    Voir la version officielle : {oeuvre.oeuvre_licence.titre}
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="bg-gray-800/50 rounded-xl p-4 space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            {oeuvre.licence ? "Où acheter" : "Chapitres"}
            {!oeuvre.licence && chapitres.length > 0 && (
              <span className="text-sm font-normal text-gray-400">({chapitres.length} disponibles)</span>
            )}
          </h3>
          <AffiChapitre
            documentId={oeuvre.documentId}
            licence={oeuvre.licence}
            totalChapitres={oeuvre.licence ? (oeuvre.achatlivres?.length || 0) : chapitres.length}
            initialItems={oeuvre.licence ? oeuvre.achatlivres : chapitres}
          />

          {!oeuvre.licence && chapitres.length > 10 && (
            <details className="mt-2 group">
              <summary className="cursor-pointer text-sm text-indigo-300 hover:text-indigo-200 transition-colors py-2 select-none">
                Voir l'index complet des chapitres ({chapitres.length})
              </summary>
              <div className="mt-3 space-y-4 text-sm">
                {(() => {
                  const sorted = [...chapitres].sort((a, b) => (a.order || 0) - (b.order || 0));
                  const firstN = sorted.slice(0, 20);
                  const lastN = sorted.slice(-20).reverse();
                  const overlap = chapitres.length <= 40;
                  return (
                    <>
                      <div>
                        <p className="text-xs uppercase tracking-wide text-gray-500 mb-2">
                          Derniers chapitres publiés
                        </p>
                        <ul className="grid sm:grid-cols-2 gap-x-4 gap-y-1">
                          {lastN.map((ch) => (
                            <li key={`last-${ch.id}`} className="truncate">
                              <a
                                href={ch.url}
                                target="_blank"
                                rel="noopener nofollow"
                                className="text-gray-300 hover:text-indigo-300 transition-colors"
                                title={ch.titre}
                              >
                                {ch.titre || `Chapitre ${ch.order}`}
                              </a>
                            </li>
                          ))}
                        </ul>
                      </div>
                      {!overlap && (
                        <div>
                          <p className="text-xs uppercase tracking-wide text-gray-500 mb-2">
                            Premiers chapitres
                          </p>
                          <ul className="grid sm:grid-cols-2 gap-x-4 gap-y-1">
                            {firstN.map((ch) => (
                              <li key={`first-${ch.id}`} className="truncate">
                                <a
                                  href={ch.url}
                                  target="_blank"
                                  rel="noopener nofollow"
                                  className="text-gray-300 hover:text-indigo-300 transition-colors"
                                  title={ch.titre}
                                >
                                  {ch.titre || `Chapitre ${ch.order}`}
                                </a>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            </details>
          )}
        </div>

        {similarOeuvres.length > 0 && (
          <div className="bg-gray-800/50 rounded-xl p-4 space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <FiTrendingUp className="w-5 h-5 text-purple-400" />
              Œuvres similaires
              <span className="text-sm font-normal text-gray-400">
                Basées sur les genres communs
              </span>
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
              {similarOeuvres.map((similar) => (
                <Link
                  key={similar.documentId}
                  href={`/oeuvre/${similar.documentId}-${slugify(similar.titre)}`}
                  className="group"
                  title={`Lire ${similar.titre}${similar.type ? ` (${similar.type})` : ""} sur Novel-Index`}
                >
                  <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-gray-700">
                    {similar.couverture?.url ? (
                      <Image
                        src={similar.couverture.url}
                        alt={`Couverture de ${similar.titre}`}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <FiBookOpen className="text-3xl text-gray-600" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      <p className="text-sm font-medium line-clamp-2 group-hover:text-indigo-300 transition-colors">
                        {similar.titre}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">{similar.type || "Novel"}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {byTypeOeuvres.length > 0 && (
          <div className="bg-gray-800/50 rounded-xl p-4 space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <FiBookOpen className="w-5 h-5 text-cyan-400" />
              Plus d'œuvres en {oeuvre.type || "même type"}
              <span className="text-sm font-normal text-gray-400">
                Suggestions par type
              </span>
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
              {byTypeOeuvres.map((item) => (
                <Link
                  key={item.documentId}
                  href={`/oeuvre/${item.documentId}-${slugify(item.titre)}`}
                  className="group"
                  title={`Lire ${item.titre}${item.type ? ` (${item.type})` : ""} sur Novel-Index`}
                >
                  <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-gray-700">
                    {item.couverture?.url ? (
                      <Image
                        src={item.couverture.url}
                        alt={`Couverture de ${item.titre}`}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <FiBookOpen className="text-3xl text-gray-600" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      <p className="text-sm font-medium line-clamp-2 group-hover:text-cyan-300 transition-colors">
                        {item.titre}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">{item.type || "Novel"}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {byGenreOeuvres.length > 0 && primaryGenre && (
          <div className="bg-gray-800/50 rounded-xl p-4 space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2 flex-wrap">
              <FiTag className="w-5 h-5 text-pink-400" />
              <span>Plus d'œuvres en</span>
              <Link
                href={`/tags-genres/genre/${slugify(primaryGenre)}`}
                className="inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium bg-gradient-to-r from-pink-500/90 to-rose-600/90 hover:from-pink-400 hover:to-rose-500 text-white shadow-sm shadow-pink-900/30 ring-1 ring-pink-400/20 transition-all"
              >
                {primaryGenre}
              </Link>
              <span className="text-sm font-normal text-gray-400">— Le genre principal</span>
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
              {byGenreOeuvres.map((item) => (
                <Link
                  key={item.documentId}
                  href={`/oeuvre/${item.documentId}-${slugify(item.titre)}`}
                  className="group"
                  title={`Lire ${item.titre} (${primaryGenre}) sur Novel-Index`}
                >
                  <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-gray-700">
                    {item.couverture?.url ? (
                      <Image
                        src={item.couverture.url}
                        alt={`Couverture de ${item.titre}`}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <FiBookOpen className="text-3xl text-gray-600" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      <p className="text-sm font-medium line-clamp-2 group-hover:text-pink-300 transition-colors">
                        {item.titre}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">{item.type || "Novel"}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {byTagOeuvres.length > 0 && primaryTag && (
          <div className="bg-gray-800/50 rounded-xl p-4 space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2 flex-wrap">
              <FiHash className="w-5 h-5 text-indigo-400" />
              <span>Œuvres explorant</span>
              <Link
                href={`/tags-genres/tag/${slugify(primaryTag)}`}
                className="inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium bg-gradient-to-r from-indigo-500/90 to-violet-600/90 hover:from-indigo-400 hover:to-violet-500 text-white shadow-sm shadow-indigo-900/30 ring-1 ring-indigo-400/20 transition-all"
              >
                {primaryTag}
              </Link>
              <span className="text-sm font-normal text-gray-400">— Thématique commune</span>
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
              {byTagOeuvres.map((item) => (
                <Link
                  key={item.documentId}
                  href={`/oeuvre/${item.documentId}-${slugify(item.titre)}`}
                  className="group"
                  title={`Lire ${item.titre} (${primaryTag}) sur Novel-Index`}
                >
                  <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-gray-700">
                    {item.couverture?.url ? (
                      <Image
                        src={item.couverture.url}
                        alt={`Couverture de ${item.titre}`}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <FiBookOpen className="text-3xl text-gray-600" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      <p className="text-sm font-medium line-clamp-2 group-hover:text-indigo-300 transition-colors">
                        {item.titre}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">{item.type || "Novel"}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {byAuthorOeuvres.length > 0 && oeuvre.auteur && (
          <div className="rounded-xl p-5 space-y-4 bg-gradient-to-br from-amber-900/20 via-gray-800/50 to-gray-800/50 border border-amber-500/20">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-amber-900/40">
                <FiEdit3 className="w-6 h-6 text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-wider text-amber-300/80 font-semibold">Du même auteur</p>
                <Link
                  href={`/auteur/${auteurSlug(oeuvre.auteur)}`}
                  className="text-xl font-bold text-white hover:text-amber-300 transition-colors inline-flex items-center gap-1.5"
                  title={`Voir la fiche de ${oeuvre.auteur}`}
                >
                  {oeuvre.auteur}
                </Link>
                <p className="text-xs text-gray-400 mt-0.5">
                  {byAuthorOeuvres.length} autre{byAuthorOeuvres.length > 1 ? "s" : ""} œuvre{byAuthorOeuvres.length > 1 ? "s" : ""} disponible{byAuthorOeuvres.length > 1 ? "s" : ""}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
              {byAuthorOeuvres.map((item) => (
                <Link
                  key={item.documentId}
                  href={`/oeuvre/${item.documentId}-${slugify(item.titre)}`}
                  className="group"
                  title={`Lire ${item.titre} de ${oeuvre.auteur}`}
                >
                  <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-gray-700 ring-1 ring-amber-500/10 group-hover:ring-amber-400/40 transition-all">
                    {item.couverture?.url ? (
                      <Image
                        src={item.couverture.url}
                        alt={`Couverture de ${item.titre}`}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <FiBookOpen className="text-3xl text-gray-600" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      <p className="text-sm font-medium line-clamp-2 group-hover:text-amber-300 transition-colors">
                        {item.titre}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">{item.type || "Novel"}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {byTeamOeuvres.length > 0 && oeuvre.traduction && (
          <div className="bg-gray-800/50 rounded-xl p-4 space-y-4 border border-emerald-500/15">
            <h3 className="text-lg font-semibold flex items-center gap-2 flex-wrap">
              <FiUsers className="w-5 h-5 text-emerald-400" />
              <span>Autres œuvres traduites par</span>
              <Link
                href={`/Teams/${team?.documentId ? `${team.documentId}-${slugify(oeuvre.traduction)}` : slugify(oeuvre.traduction)}`}
                className="text-emerald-300 hover:text-emerald-200 transition-colors font-bold"
              >
                {oeuvre.traduction}
              </Link>
              <span className="text-sm font-normal text-gray-400">— Même équipe</span>
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
              {byTeamOeuvres.map((item) => (
                <Link
                  key={item.documentId}
                  href={`/oeuvre/${item.documentId}-${slugify(item.titre)}`}
                  className="group"
                  title={`Lire ${item.titre} (traduit par ${oeuvre.traduction})`}
                >
                  <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-gray-700">
                    {item.couverture?.url ? (
                      <Image
                        src={item.couverture.url}
                        alt={`Couverture de ${item.titre}`}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <FiBookOpen className="text-3xl text-gray-600" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      <p className="text-sm font-medium line-clamp-2 group-hover:text-emerald-300 transition-colors">
                        {item.titre}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">{item.type || "Novel"}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {similarAuthor && similarAuthor.oeuvres?.length > 0 && (
          <div className="rounded-xl overflow-hidden bg-gradient-to-br from-fuchsia-900/25 via-purple-900/20 to-gray-800/60 border border-fuchsia-500/25 shadow-lg shadow-fuchsia-900/10">
            <div className="p-5 sm:p-6 space-y-5">
              <div className="flex items-start gap-4 flex-wrap sm:flex-nowrap">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-fuchsia-500 via-purple-500 to-violet-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-fuchsia-900/40 ring-2 ring-fuchsia-400/20">
                  <FiTrendingUp className="w-7 h-7 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] uppercase tracking-widest text-fuchsia-300/80 font-bold mb-1">
                    Auteur à découvrir · Affinité thématique forte
                  </p>
                  <h3 className="text-2xl sm:text-3xl font-black text-white leading-tight">
                    <Link
                      href={`/auteur/${auteurSlug(similarAuthor.auteur)}`}
                      className="bg-gradient-to-r from-fuchsia-300 to-purple-300 bg-clip-text text-transparent hover:from-fuchsia-200 hover:to-purple-200 transition-all"
                      title={`Voir la fiche de ${similarAuthor.auteur}`}
                    >
                      {similarAuthor.auteur}
                    </Link>
                  </h3>
                  <p className="text-sm text-gray-300 mt-2 leading-relaxed">
                    Si tu aimes <span className="font-semibold text-white">{oeuvre.titre}</span>, son univers et ses thématiques pourraient te plaire. Son œuvre la mieux assortie partage{" "}
                    <span className="font-bold text-fuchsia-300">
                      {similarAuthor.bestScore} thématique{similarAuthor.bestScore > 1 ? "s" : ""} commune{similarAuthor.bestScore > 1 ? "s" : ""}
                    </span>{" "}
                    avec celle-ci.
                  </p>
                  {similarAuthor.bestMatchedTags?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {similarAuthor.bestMatchedTags.slice(0, 6).map((t) => (
                        <span
                          key={t}
                          className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs rounded-full bg-fuchsia-500/15 border border-fuchsia-400/30 text-fuchsia-200"
                        >
                          <FiHash className="w-3 h-3" />
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className={`grid gap-4 ${similarAuthor.oeuvres.length === 1 ? "grid-cols-1 sm:grid-cols-2" : similarAuthor.oeuvres.length === 2 ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-2 sm:grid-cols-3 md:grid-cols-4"}`}>
                {similarAuthor.oeuvres.map((item) => (
                  <Link
                    key={item.documentId}
                    href={`/oeuvre/${item.documentId}-${slugify(item.titre)}`}
                    className="group flex gap-3 p-3 rounded-xl bg-gray-900/40 hover:bg-gray-900/70 border border-fuchsia-500/10 hover:border-fuchsia-400/40 transition-all"
                    title={`Lire ${item.titre} de ${similarAuthor.auteur}`}
                  >
                    <div className="relative w-20 h-28 sm:w-24 sm:h-32 flex-shrink-0 rounded-lg overflow-hidden bg-gray-700">
                      {item.couverture?.url ? (
                        <Image
                          src={item.couverture.url}
                          alt={`Couverture de ${item.titre}`}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <FiBookOpen className="text-2xl text-gray-600" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1 flex flex-col">
                      <p className="text-sm font-semibold text-white line-clamp-2 group-hover:text-fuchsia-300 transition-colors">
                        {item.titre}
                      </p>
                      <p className="text-[11px] text-gray-400 mt-0.5">{item.type || "Novel"}</p>
                      {item._matchedTags?.length > 0 && (
                        <div className="mt-auto pt-2 flex flex-wrap gap-1">
                          {item._matchedTags.slice(0, 3).map((t) => (
                            <span
                              key={t}
                              className="text-[10px] px-1.5 py-0.5 rounded-full bg-fuchsia-500/20 text-fuchsia-200 border border-fuchsia-400/20"
                              title={`Thématique partagée : ${t}`}
                            >
                              {t}
                            </span>
                          ))}
                          {item._matchedTags.length > 3 && (
                            <span className="text-[10px] text-fuchsia-300/70">+{item._matchedTags.length - 3}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </Link>
                ))}
              </div>

              <div className="pt-1">
                <Link
                  href={`/auteur/${auteurSlug(similarAuthor.auteur)}`}
                  className="inline-flex items-center gap-2 text-sm font-medium text-fuchsia-300 hover:text-fuchsia-200 transition-colors group"
                >
                  Découvrir tout ce que {similarAuthor.auteur} a écrit
                  <span className="transition-transform group-hover:translate-x-1">→</span>
                </Link>
              </div>
            </div>
          </div>
        )}

        {faqItems.length > 0 && (
          <section className="bg-gray-800/50 rounded-xl p-4 space-y-3">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <FiHelpCircle className="w-5 h-5 text-amber-400" />
              Questions fréquentes
            </h2>
            <div className="divide-y divide-gray-700/50">
              {faqItems.map((item, idx) => {
                const open = faqOpenIndex === idx;
                return (
                  <div key={`faq-${idx}`} className="py-2">
                    <button
                      type="button"
                      onClick={() => setFaqOpenIndex(open ? null : idx)}
                      aria-expanded={open}
                      className="w-full flex items-center justify-between gap-4 text-left py-2 hover:text-indigo-300 transition-colors"
                    >
                      <span className="font-medium text-white">{item.q}</span>
                      <FiChevronDown
                        className={`w-5 h-5 flex-shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
                      />
                    </button>
                    <div
                      className={`overflow-hidden transition-all ${open ? "max-h-96 mt-2" : "max-h-0"}`}
                    >
                      <p className="text-gray-300 text-sm leading-relaxed pb-2">
                        {item.a}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

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
}
