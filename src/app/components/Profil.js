"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { slugify } from "@/utils/slugify";
import {
  FiBookOpen,
  FiEdit3,
  FiMessageSquare,
  FiFolder,
  FiStar,
  FiActivity,
  FiClock,
  FiAward,
  FiChevronUp,
  FiChevronDown,
  FiTrendingUp,
} from "react-icons/fi";
import AbonnementCard from "./AbonnementCard";

const SkeletonCard = () => (
  <div className="bg-gray-800 rounded-xl overflow-hidden shadow-md animate-pulse">
    <div className="w-full h-48 bg-gray-700" />
    <div className="p-4 space-y-3">
      <div className="h-5 bg-gray-700 rounded w-3/4" />
      <div className="h-4 bg-gray-700 rounded w-1/2" />
      <div className="h-4 bg-gray-700 rounded w-2/3" />
    </div>
  </div>
);

const StatCard = ({ icon: Icon, value, label, color }) => (
  <div className="bg-gray-900/50 rounded-xl p-4 text-center">
    <Icon className={`mx-auto text-xl mb-2 ${color}`} />
    <p className={`text-2xl font-bold ${color}`}>{value}</p>
    <p className="text-xs text-gray-400 mt-1">{label}</p>
  </div>
);

const Profil = ({ user }) => {
  const [abonnements, setAbonnements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [stats, setStats] = useState({
    oeuvres: 0,
    chapitres: 0,
    commentaires: 0,
    listes: 0,
  });
  const [contributedOeuvres, setContributedOeuvres] = useState([]);
  const [contributedTotal, setContributedTotal] = useState(0);
  const [oeuvresLoading, setOeuvresLoading] = useState(true);
  const [recentActivity, setRecentActivity] = useState([]);
  const [activityLoading, setActivityLoading] = useState(true);
  const [showAllOeuvres, setShowAllOeuvres] = useState(false);
  const [allOeuvresLoading, setAllOeuvresLoading] = useState(false);
  const [leaderboard, setLeaderboard] = useState([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(true);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    if (!user?.documentId) {
      setLoading(false);
      setStatsLoading(false);
      setOeuvresLoading(false);
      setActivityLoading(false);
      return;
    }

    const jwt = localStorage.getItem("jwt");

    // Fetch abonnements (existant)
    const fetchAbonnements = async () => {
      try {
        const res = await fetch(
          `${apiUrl}/api/checkoeuvretimes?filters[users_permissions_users][documentId][$eq]=${user.documentId}&populate[oeuvres][populate][0]=couverture&populate[oeuvres][populate][1]=chapitres`,
          { headers: { Authorization: `Bearer ${jwt}` } }
        );
        const data = await res.json();
        const abonnementsData = data.data || [];
        const abonnementsAvecChapitres = abonnementsData.map((a) => {
          const oeuvre = a.oeuvres?.[0];
          const chapitres = oeuvre?.chapitres || [];
          return { ...a, chapitres };
        });
        setAbonnements(abonnementsAvecChapitres);
      } catch (error) {
        console.error("Erreur fetch abonnements :", error);
      } finally {
        setLoading(false);
      }
    };

    // Fetch count stats
    const fetchStats = async () => {
      try {
        const [oeuvresRes, chapitresRes, commentairesRes, listesRes] =
          await Promise.all([
            fetch(
              `${apiUrl}/api/oeuvres?filters[users_permissions_users][documentId][$eq]=${user.documentId}&pagination[limit]=1`,
              { headers: { Authorization: `Bearer ${jwt}` } }
            ),
            fetch(
              `${apiUrl}/api/chapitres?filters[users_permissions_users][documentId][$eq]=${user.documentId}&pagination[limit]=1`,
              { headers: { Authorization: `Bearer ${jwt}` } }
            ),
            fetch(
              `${apiUrl}/api/commentaires?filters[users_permissions_users][documentId][$eq]=${user.documentId}&pagination[limit]=1`,
              { headers: { Authorization: `Bearer ${jwt}` } }
            ),
            fetch(
              `${apiUrl}/api/nameoeuvrelists?filters[users_permissions_users][documentId][$eq]=${user.documentId}&pagination[limit]=1`,
              { headers: { Authorization: `Bearer ${jwt}` } }
            ),
          ]);

        const [oeuvresData, chapitresData, commentairesData, listesData] =
          await Promise.all([
            oeuvresRes.json(),
            chapitresRes.json(),
            commentairesRes.json(),
            listesRes.json(),
          ]);

        setStats({
          oeuvres: oeuvresData?.meta?.pagination?.total ?? 0,
          chapitres: chapitresData?.meta?.pagination?.total ?? 0,
          commentaires: commentairesData?.meta?.pagination?.total ?? 0,
          listes: listesData?.meta?.pagination?.total ?? 0,
        });
      } catch (error) {
        console.error("Erreur fetch stats :", error);
      } finally {
        setStatsLoading(false);
      }
    };

    // Fetch oeuvres contribuees (si indexeur)
    const fetchContributedOeuvres = async () => {
      if (!user.indexeur) {
        setOeuvresLoading(false);
        return;
      }
      try {
        const res = await fetch(
          `${apiUrl}/api/oeuvres?filters[users_permissions_users][documentId][$eq]=${user.documentId}&populate=couverture&pagination[limit]=6&sort=createdAt:desc`,
          { headers: { Authorization: `Bearer ${jwt}` } }
        );
        const data = await res.json();
        setContributedOeuvres(data.data || []);
        setContributedTotal(data?.meta?.pagination?.total ?? 0);
      } catch (error) {
        console.error("Erreur fetch oeuvres contribuees :", error);
      } finally {
        setOeuvresLoading(false);
      }
    };

    // Fetch activite recente (si indexeur)
    const fetchRecentActivity = async () => {
      if (!user.indexeur) {
        setActivityLoading(false);
        return;
      }
      try {
        const res = await fetch(
          `${apiUrl}/api/chapitres?filters[users_permissions_users][documentId][$eq]=${user.documentId}&sort=createdAt:desc&pagination[limit]=5&populate=oeuvres`,
          { headers: { Authorization: `Bearer ${jwt}` } }
        );
        const data = await res.json();
        setRecentActivity(data.data || []);
      } catch (error) {
        console.error("Erreur fetch activite :", error);
      } finally {
        setActivityLoading(false);
      }
    };

    // Fetch leaderboard chapitres
    const fetchLeaderboard = async () => {
      try {
        // 1. Récupérer les utilisateurs indexeurs
        const usersRes = await fetch(
          `${apiUrl}/api/users?filters[indexeur][$eq]=true&fields[0]=username&fields[1]=id`,
          { headers: { Authorization: `Bearer ${jwt}` } }
        );
        const usersData = await usersRes.json();
        if (!usersData || !Array.isArray(usersData)) return;

        // 2. Compter les chapitres de chaque utilisateur en parallèle
        const countPromises = usersData.map(async (u) => {
          try {
            const countRes = await fetch(
              `${apiUrl}/api/chapitres?filters[users_permissions_users][id][$eq]=${u.id}&pagination[limit]=1`,
              { headers: { Authorization: `Bearer ${jwt}` } }
            );
            const countData = await countRes.json();
            return {
              id: u.id,
              username: u.username,
              chapitres: countData?.meta?.pagination?.total ?? 0,
            };
          } catch {
            return { id: u.id, username: u.username, chapitres: 0 };
          }
        });

        const results = await Promise.all(countPromises);
        const ranked = results
          .sort((a, b) => b.chapitres - a.chapitres)
          .slice(0, 20);
        setLeaderboard(ranked);
      } catch (error) {
        console.error("Erreur fetch leaderboard :", error);
      } finally {
        setLeaderboardLoading(false);
      }
    };

    fetchAbonnements();
    fetchStats();
    fetchContributedOeuvres();
    fetchRecentActivity();
    fetchLeaderboard();
  }, [user?.documentId, apiUrl, user?.indexeur]);

  // Charger toutes les oeuvres
  const handleShowAllOeuvres = async () => {
    setAllOeuvresLoading(true);
    try {
      const jwt = localStorage.getItem("jwt");
      const res = await fetch(
        `${apiUrl}/api/oeuvres?filters[users_permissions_users][documentId][$eq]=${user.documentId}&populate=couverture&pagination[limit]=100&sort=createdAt:desc`,
        { headers: { Authorization: `Bearer ${jwt}` } }
      );
      const data = await res.json();
      setContributedOeuvres(data.data || []);
      setShowAllOeuvres(true);
    } catch (error) {
      console.error("Erreur fetch all oeuvres :", error);
    } finally {
      setAllOeuvresLoading(false);
    }
  };

  // Protection : si pas d'utilisateur, afficher un loader
  if (!user) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="bg-gray-800 rounded-2xl p-6 animate-pulse">
          <div className="h-24 w-24 bg-gray-700 rounded-full mx-auto mb-4" />
          <div className="h-6 bg-gray-700 rounded w-1/3 mx-auto mb-2" />
          <div className="h-4 bg-gray-700 rounded w-1/4 mx-auto" />
        </div>
      </div>
    );
  }

  const isToday = (dateString) => {
    const today = new Date();
    const date = new Date(dateString);
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const formatRelativeDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays < 7) return `Il y a ${diffDays}j`;
    return date.toLocaleDateString("fr-FR");
  };

  const abonnementsDuJour = abonnements.filter((a) => {
    const chapitres = a.chapitres || [];
    return chapitres.some((ch) => isToday(ch.createdAt));
  });

  const memberSince = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString("fr-FR", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  // Badges roles
  const roleBadges = [];
  if (user.indexeur)
    roleBadges.push({ label: "Indexeur", color: "bg-indigo-600/20 text-indigo-300 border-indigo-500/30" });
  if (user.proprietaire)
    roleBadges.push({ label: "Propriétaire", color: "bg-purple-600/20 text-purple-300 border-purple-500/30" });
  if (user.admin)
    roleBadges.push({ label: "Admin", color: "bg-red-600/20 text-red-300 border-red-500/30" });

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* Section 1 : Carte profil */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-gray-800 rounded-2xl p-6"
      >
        <div className="flex flex-col sm:flex-row items-center gap-6 mb-6">
          {/* Avatar */}
          <div className="shrink-0">
            {user.profil?.url ? (
              <Image
                src={user.profil.url}
                alt={user.username}
                width={96}
                height={96}
                className="w-24 h-24 rounded-full object-cover border-2 border-indigo-500"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-indigo-600 flex items-center justify-center text-3xl font-bold text-white">
                {user.username?.charAt(0).toUpperCase() || "?"}
              </div>
            )}
          </div>

          {/* Infos */}
          <div className="flex-grow text-center sm:text-left space-y-2">
            <h1 className="text-2xl font-bold text-white">{user.username}</h1>
            {roleBadges.length > 0 && (
              <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                {roleBadges.map((badge) => (
                  <span
                    key={badge.label}
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${badge.color}`}
                  >
                    {badge.label}
                  </span>
                ))}
              </div>
            )}
            <p className="text-gray-400 text-sm">{user.email}</p>
            {memberSince && (
              <p className="text-gray-500 text-xs">
                Membre depuis le {memberSince}
              </p>
            )}
          </div>
        </div>

        {/* Stats grille 6 */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <StatCard
            icon={FiStar}
            value={loading ? "-" : abonnements.length}
            label="Abonnements"
            color="text-indigo-400"
          />
          <StatCard
            icon={FiActivity}
            value={loading ? "-" : abonnementsDuJour.length}
            label="Sorties du jour"
            color="text-green-400"
          />
          <StatCard
            icon={FiBookOpen}
            value={statsLoading ? "-" : stats.oeuvres}
            label="Oeuvres contribuées"
            color="text-blue-400"
          />
          <StatCard
            icon={FiEdit3}
            value={statsLoading ? "-" : stats.chapitres}
            label="Chapitres ajoutés"
            color="text-yellow-400"
          />
          <StatCard
            icon={FiMessageSquare}
            value={statsLoading ? "-" : stats.commentaires}
            label="Commentaires"
            color="text-pink-400"
          />
          <StatCard
            icon={FiFolder}
            value={statsLoading ? "-" : stats.listes}
            label="Listes créées"
            color="text-orange-400"
          />
        </div>
      </motion.div>

      {/* Section 2 : Sorties du jour de vos abonnements */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.05 }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <FiActivity className="text-green-400" />
            Sorties du jour
            {!loading && abonnementsDuJour.length > 0 && (
              <span className="ml-1 px-2 py-0.5 bg-green-500/20 text-green-400 text-xs font-bold rounded-full border border-green-500/30">
                {abonnementsDuJour.length}
              </span>
            )}
          </h2>
        </div>

        {loading ? (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : abonnementsDuJour.length === 0 ? (
          <div className="bg-gray-800/50 rounded-xl p-8 text-center border border-gray-700/30">
            <FiActivity className="mx-auto text-3xl text-gray-600 mb-3" />
            <p className="text-gray-400 font-medium">Aucune sortie aujourd&apos;hui</p>
            <p className="text-gray-500 text-sm mt-1">
              Les nouveaux chapitres de vos abonnements apparaîtront ici.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {abonnementsDuJour.map((abonnement) => (
              <AbonnementCard
                key={abonnement.documentId}
                abonnement={abonnement}
              />
            ))}
          </div>
        )}
      </motion.div>

      {/* Section 3 : Oeuvres contribuees (indexeur only) */}
      {user.indexeur && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <FiBookOpen className="text-blue-400" />
            Vos oeuvres contribuées
          </h2>

          {oeuvresLoading ? (
            <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-gray-800 rounded-xl overflow-hidden animate-pulse"
                >
                  <div className="w-full h-32 bg-gray-700" />
                  <div className="p-3">
                    <div className="h-4 bg-gray-700 rounded w-3/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : contributedOeuvres.length === 0 ? (
            <div className="bg-gray-800/50 rounded-xl p-8 text-center">
              <FiBookOpen className="mx-auto text-3xl text-gray-600 mb-3" />
              <p className="text-gray-400">
                Vous n&apos;avez pas encore contribué à une oeuvre.
              </p>
            </div>
          ) : (
            <>
              <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-6">
                {contributedOeuvres.map((oeuvre) => (
                  <Link
                    key={oeuvre.documentId}
                    href={`/oeuvre/${oeuvre.documentId}-${slugify(oeuvre.titre)}`}
                    className="group bg-gray-800/50 border border-gray-700/50 rounded-xl overflow-hidden hover:border-indigo-500/50 transition-all"
                  >
                    {oeuvre.couverture?.url ? (
                      <Image
                        src={oeuvre.couverture.url}
                        alt={oeuvre.titre}
                        width={200}
                        height={128}
                        className="w-full h-32 object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-32 bg-gray-700/50 flex items-center justify-center">
                        <FiBookOpen className="text-2xl text-gray-600" />
                      </div>
                    )}
                    <div className="p-3">
                      <p className="text-sm font-medium text-white truncate">
                        {oeuvre.titre}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
              {contributedTotal > 6 && !showAllOeuvres && (
                <p className="text-center mt-4">
                  <button
                    onClick={handleShowAllOeuvres}
                    disabled={allOeuvresLoading}
                    className="text-indigo-400 text-sm hover:underline disabled:opacity-50 flex items-center gap-1 mx-auto"
                  >
                    {allOeuvresLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-indigo-400/30 border-t-indigo-400 rounded-full animate-spin" />
                        Chargement...
                      </>
                    ) : (
                      <>
                        <FiChevronDown className="text-sm" />
                        Voir toutes vos oeuvres ({contributedTotal})
                      </>
                    )}
                  </button>
                </p>
              )}
              {showAllOeuvres && contributedTotal > 6 && (
                <p className="text-center mt-4">
                  <button
                    onClick={() => {
                      setContributedOeuvres((prev) => prev.slice(0, 6));
                      setShowAllOeuvres(false);
                    }}
                    className="text-gray-400 text-sm hover:underline flex items-center gap-1 mx-auto"
                  >
                    <FiChevronUp className="text-sm" />
                    Réduire
                  </button>
                </p>
              )}
            </>
          )}
        </motion.div>
      )}

      {/* Section 4 : Activite recente (indexeur only) */}
      {user.indexeur && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <FiActivity className="text-green-400" />
            Activité récente
          </h2>

          {activityLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-gray-800 rounded-xl p-4 animate-pulse flex gap-4"
                >
                  <div className="w-8 h-8 bg-gray-700 rounded-full shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-700 rounded w-3/4" />
                    <div className="h-3 bg-gray-700 rounded w-1/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : recentActivity.length === 0 ? (
            <div className="bg-gray-800/50 rounded-xl p-8 text-center">
              <FiActivity className="mx-auto text-3xl text-gray-600 mb-3" />
              <p className="text-gray-400">Aucune activité récente.</p>
            </div>
          ) : (
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-700" />

              <div className="space-y-3">
                {recentActivity.map((chapitre) => {
                  const oeuvre = chapitre.oeuvres?.[0];
                  return (
                    <div
                      key={chapitre.documentId}
                      className="relative flex items-start gap-4 pl-1"
                    >
                      {/* Timeline dot */}
                      <div className="relative z-10 w-8 h-8 bg-indigo-600/20 border-2 border-indigo-500 rounded-full flex items-center justify-center shrink-0">
                        <FiEdit3 className="text-xs text-indigo-400" />
                      </div>

                      {/* Content */}
                      <div className="bg-gray-800/50 rounded-xl p-4 flex-1 border border-gray-700/30">
                        <p className="text-sm text-white">
                          Chapitre{" "}
                          <span className="font-semibold text-indigo-300">
                            {chapitre.titre || chapitre.numero}
                          </span>
                          {oeuvre && (
                            <>
                              {" "}ajouté à{" "}
                              <Link
                                href={`/oeuvre/${oeuvre.documentId}-${slugify(oeuvre.titre)}`}
                                className="font-semibold text-indigo-400 hover:underline"
                              >
                                {oeuvre.titre}
                              </Link>
                            </>
                          )}
                        </p>
                        <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                          <FiClock className="text-xs" />
                          {formatRelativeDate(chapitre.createdAt)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Section 5 : Classement contributeurs */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.25 }}
      >
        <button
          onClick={() => setShowLeaderboard(!showLeaderboard)}
          className="w-full flex items-center justify-between mb-4 group"
        >
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <FiAward className="text-yellow-400" />
            Classement des contributeurs
          </h2>
          <span className="text-gray-400 group-hover:text-white transition-colors">
            {showLeaderboard ? <FiChevronUp /> : <FiChevronDown />}
          </span>
        </button>

        <AnimatePresence>
          {showLeaderboard && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              {leaderboardLoading ? (
                <div className="bg-gray-800/50 rounded-xl p-6 space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-4 animate-pulse">
                      <div className="w-8 h-8 bg-gray-700 rounded-full" />
                      <div className="flex-1 h-4 bg-gray-700 rounded" />
                      <div className="w-16 h-4 bg-gray-700 rounded" />
                    </div>
                  ))}
                </div>
              ) : leaderboard.length === 0 ? (
                <div className="bg-gray-800/50 rounded-xl p-8 text-center">
                  <FiAward className="mx-auto text-3xl text-gray-600 mb-3" />
                  <p className="text-gray-400">Aucun classement disponible.</p>
                </div>
              ) : (
                <div className="bg-gray-800/50 rounded-xl border border-gray-700/30 overflow-hidden">
                  {/* Header */}
                  <div className="grid grid-cols-12 gap-2 px-5 py-3 bg-gray-800/80 text-xs text-gray-400 font-medium uppercase">
                    <div className="col-span-1">#</div>
                    <div className="col-span-7">Utilisateur</div>
                    <div className="col-span-4 text-right">Chapitres</div>
                  </div>

                  {/* Rows */}
                  {leaderboard.map((entry, index) => {
                    const isCurrentUser = entry.id === user.id;
                    const rank = index + 1;
                    const medalColor =
                      rank === 1
                        ? "text-yellow-400"
                        : rank === 2
                        ? "text-gray-300"
                        : rank === 3
                        ? "text-orange-400"
                        : "text-gray-500";

                    return (
                      <div
                        key={entry.id}
                        className={`grid grid-cols-12 gap-2 px-5 py-3 items-center border-t border-gray-700/20 transition-colors ${
                          isCurrentUser
                            ? "bg-indigo-600/10 border-l-2 border-l-indigo-500"
                            : "hover:bg-gray-700/20"
                        }`}
                      >
                        <div className="col-span-1">
                          {rank <= 3 ? (
                            <FiAward className={`text-lg ${medalColor}`} />
                          ) : (
                            <span className="text-sm text-gray-500 font-medium">{rank}</span>
                          )}
                        </div>
                        <div className="col-span-7 flex items-center gap-2 min-w-0">
                          <span
                            className={`text-sm font-medium truncate ${
                              isCurrentUser ? "text-indigo-300" : "text-white"
                            }`}
                          >
                            {entry.username}
                          </span>
                          {isCurrentUser && (
                            <span className="text-xs bg-indigo-600/30 text-indigo-300 px-1.5 py-0.5 rounded-full">
                              vous
                            </span>
                          )}
                        </div>
                        <div className="col-span-4 text-right">
                          <span className="text-sm font-bold text-yellow-400 flex items-center gap-1 justify-end">
                            <FiTrendingUp className="text-xs" />
                            {entry.chapitres.toLocaleString("fr-FR")}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

    </div>
  );
};

export default Profil;
