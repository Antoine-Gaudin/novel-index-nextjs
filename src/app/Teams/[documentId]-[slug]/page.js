"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { slugify } from "@/utils/slugify";
import CoverBackground from "@/app/components/CoverBackground";
import {
  FiUsers,
  FiBook,
  FiExternalLink,
  FiArrowLeft,
  FiCheckCircle,
  FiXCircle,
  FiGlobe,
  FiMail,
  FiMessageCircle
} from "react-icons/fi";
import {
  FaDiscord,
  FaTwitter,
  FaFacebook,
  FaInstagram,
  FaPatreon,
  FaTiktok,
  FaYoutube
} from "react-icons/fa";

// Détecte le type de lien pour afficher la bonne icône
function getLinkIcon(url, titre) {
  const lowerUrl = url?.toLowerCase() || "";
  const lowerTitre = titre?.toLowerCase() || "";
  
  if (lowerUrl.includes("discord") || lowerTitre.includes("discord")) return <FaDiscord className="text-indigo-400" />;
  if (lowerUrl.includes("twitter") || lowerUrl.includes("x.com") || lowerTitre.includes("twitter")) return <FaTwitter className="text-blue-400" />;
  if (lowerUrl.includes("facebook") || lowerTitre.includes("facebook")) return <FaFacebook className="text-blue-600" />;
  if (lowerUrl.includes("instagram") || lowerTitre.includes("instagram")) return <FaInstagram className="text-pink-500" />;
  if (lowerUrl.includes("patreon") || lowerTitre.includes("patreon")) return <FaPatreon className="text-orange-500" />;
  if (lowerUrl.includes("tiktok") || lowerTitre.includes("tiktok")) return <FaTiktok className="text-white" />;
  if (lowerUrl.includes("youtube") || lowerTitre.includes("youtube")) return <FaYoutube className="text-red-500" />;
  if (lowerTitre.includes("mail") || lowerTitre.includes("contact")) return <FiMail className="text-gray-400" />;
  return <FiGlobe className="text-gray-400" />;
}

export default function TeamPage() {
  const pathname = usePathname();
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  // Extraire le documentId depuis l'URL (format: /Teams/documentId-slug)
  const parts = pathname.split("/");
  const documentId = parts[2]?.split("-")[0];

  useEffect(() => {
    if (!documentId) {
      setError("ID de team invalide");
      setLoading(false);
      return;
    }

    const fetchTeam = async () => {
      try {
        const res = await fetch(
          `${apiUrl}/api/teams/${documentId}?populate[0]=couverture&populate[1]=oeuvres.couverture&populate[2]=teamliens&populate[3]=users_permissions_user`
        );
        
        if (!res.ok) {
          if (res.status === 404) {
            setError("Team non trouvée");
          } else {
            throw new Error("Erreur API");
          }
          return;
        }

        const data = await res.json();
        setTeam(data.data);
      } catch (err) {
        console.error("Erreur lors de la récupération de la team:", err);
        setError("Impossible de charger cette team");
      } finally {
        setLoading(false);
      }
    };

    fetchTeam();
  }, [documentId, apiUrl]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error || !team) {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center text-white">
        <FiUsers className="text-6xl text-gray-600 mb-4" />
        <h1 className="text-2xl font-bold mb-2">{error || "Team non trouvée"}</h1>
        <Link href="/Teams" className="text-indigo-400 hover:underline flex items-center gap-2 mt-4">
          <FiArrowLeft /> Retour à la liste des teams
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header avec bannière */}
      <div className="relative">
        {/* Bannière/Couverture */}
        <div className="h-64 md:h-80 relative overflow-hidden">
          <CoverBackground />
          {team.couverture?.url && (
            <Image
              src={team.couverture.url}
              alt={team.titre}
              fill
              className="object-cover opacity-30 z-[1]"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-gray-900/40 via-gray-900/30 to-gray-900 z-[2]" />
        </div>

        {/* Contenu du header */}
        <div className="max-w-7xl mx-auto px-4 relative -mt-32">
          <div className="flex flex-col md:flex-row gap-6 items-end md:items-end">
            {/* Logo/Avatar */}
            <div className="w-40 h-40 rounded-xl overflow-hidden border-4 border-gray-900 bg-gray-800 shadow-xl flex-shrink-0">
              {team.couverture?.url ? (
                <Image
                  src={team.couverture.url}
                  alt={team.titre}
                  width={160}
                  height={160}
                  className="object-cover w-full h-full"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <FiUsers className="text-5xl text-gray-600" />
                </div>
              )}
            </div>

            {/* Infos principales */}
            <div className="flex-1 pb-4">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl md:text-4xl font-bold">{team.titre}</h1>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    team.etat
                      ? "bg-green-500/20 text-green-400 border border-green-500/30"
                      : "bg-red-500/20 text-red-400 border border-red-500/30"
                  }`}
                >
                  {team.etat ? (
                    <span className="flex items-center gap-1">
                      <FiCheckCircle /> Active
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <FiXCircle /> Inactive
                    </span>
                  )}
                </span>
              </div>

              {/* Stats rapides */}
              <div className="flex gap-4 text-gray-400">
                <span className="flex items-center gap-1">
                  <FiBook /> {team.oeuvres?.length || 0} œuvres
                </span>
                <span className="flex items-center gap-1">
                  <FiExternalLink /> {team.teamliens?.length || 0} liens
                </span>
              </div>
            </div>

            {/* Bouton retour */}
            <Link
              href="/Teams"
              className="hidden md:flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <FiArrowLeft /> Toutes les teams
            </Link>
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Colonne principale - Description + Œuvres */}
          <div className="lg:col-span-2 space-y-8">
            {/* Description */}
            {team.description && (
              <div className="bg-gray-800 rounded-xl p-6">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <FiMessageCircle /> À propos
                </h2>
                <p className="text-gray-300 whitespace-pre-wrap leading-relaxed">
                  {team.description}
                </p>
              </div>
            )}

            {/* Liste des œuvres */}
            <div className="bg-gray-800 rounded-xl p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <FiBook /> Œuvres traduites ({team.oeuvres?.length || 0})
              </h2>

              {team.oeuvres?.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {team.oeuvres.map((oeuvre) => (
                    <Link
                      key={oeuvre.documentId}
                      href={`/oeuvre/${oeuvre.documentId}-${slugify(oeuvre.titre)}`}
                      className="group"
                    >
                      <div className="bg-gray-700 rounded-lg overflow-hidden hover:ring-2 hover:ring-indigo-500 transition-all">
                        <div className="aspect-[3/4] relative">
                          {oeuvre.couverture?.url ? (
                            <Image
                              src={oeuvre.couverture.url}
                              alt={oeuvre.titre}
                              fill
                              className="object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full bg-gray-600 flex items-center justify-center">
                              <FiBook className="text-3xl text-gray-500" />
                            </div>
                          )}
                        </div>
                        <div className="p-2">
                          <p className="text-sm font-medium truncate group-hover:text-indigo-400 transition-colors">
                            {oeuvre.titre}
                          </p>
                          {oeuvre.type && (
                            <p className="text-xs text-gray-500">{oeuvre.type}</p>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">
                  Aucune œuvre référencée pour cette team.
                </p>
              )}
            </div>
          </div>

          {/* Colonne latérale - Liens */}
          <div className="space-y-6">
            {/* Liens officiels */}
            <div className="bg-gray-800 rounded-xl p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <FiExternalLink /> Liens officiels
              </h2>

              {team.teamliens?.length > 0 ? (
                <div className="space-y-3">
                  {team.teamliens.map((lien, index) => (
                    <a
                      key={index}
                      href={lien.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors group"
                    >
                      <span className="text-xl">{getLinkIcon(lien.url, lien.titre)}</span>
                      <span className="flex-1 truncate group-hover:text-indigo-400 transition-colors">
                        {lien.titre}
                      </span>
                      <FiExternalLink className="text-gray-500 group-hover:text-indigo-400" />
                    </a>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">
                  Aucun lien disponible.
                </p>
              )}
            </div>

            {/* Informations */}
            <div className="bg-gray-800 rounded-xl p-6">
              <h2 className="text-xl font-bold mb-4">Informations</h2>
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <dt className="text-gray-500">Statut</dt>
                  <dd className={team.etat ? "text-green-400" : "text-red-400"}>
                    {team.etat ? "Active" : "Inactive"}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Œuvres</dt>
                  <dd>{team.oeuvres?.length || 0}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Liens</dt>
                  <dd>{team.teamliens?.length || 0}</dd>
                </div>
              </dl>
            </div>

            {/* Bouton retour mobile */}
            <Link
              href="/Teams"
              className="lg:hidden flex items-center justify-center gap-2 w-full px-4 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <FiArrowLeft /> Toutes les teams
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
