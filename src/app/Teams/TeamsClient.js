"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { slugify } from "@/utils/slugify";
import CoverBackground from "@/app/components/CoverBackground";
import {
  FiUsers,
  FiSearch,
  FiBook,
  FiCheckCircle,
  FiClock,
  FiHome,
  FiChevronRight,
  FiTrendingUp,
  FiHelpCircle,
  FiLayers,
  FiExternalLink,
  FiCalendar,
} from "react-icons/fi";

function getCoverUrl(team) {
  const c = team?.couverture;
  if (!c) return null;
  if (typeof c === "string") return c;
  return c.formats?.medium?.url || c.formats?.small?.url || c.url || null;
}

function FilterButton({ active, onClick, color, icon: Icon, children, count }) {
  const palette = {
    indigo: "bg-indigo-500/30 text-indigo-200 border-indigo-400/50",
    emerald: "bg-emerald-500/30 text-emerald-200 border-emerald-400/50",
    gray: "bg-gray-600/30 text-gray-200 border-gray-500/50",
  };
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors flex items-center gap-1.5 ${
        active
          ? palette[color]
          : "bg-gray-800/40 text-gray-400 border-gray-700/40 hover:bg-gray-700/40"
      }`}
    >
      {Icon && <Icon className="w-4 h-4" />}
      {children}
      <span className="text-xs opacity-70">({count})</span>
    </button>
  );
}

function StatCard({ icon: Icon, label, value, color }) {
  const palette = {
    indigo: "text-indigo-300",
    emerald: "text-emerald-300",
    gray: "text-gray-300",
    amber: "text-amber-300",
  };
  return (
    <div className="bg-gray-800/40 backdrop-blur-md rounded-xl p-4 border border-gray-700/30 shadow-lg">
      <div className={`flex items-center gap-2 text-xs uppercase tracking-wider ${palette[color]}`}>
        <Icon className="w-4 h-4" />
        <span>{label}</span>
      </div>
      <div className="text-2xl md:text-3xl font-bold text-white mt-1">{value}</div>
    </div>
  );
}

function TeamCard({ team }) {
  const cover = getCoverUrl(team);
  const oeuvresCount = team.oeuvres?.length || 0;
  const liensCount = team.teamliens?.length || 0;
  const isActive = team.etat === true;

  return (
    <Link
      href={`/Teams/${team.documentId}-${slugify(team.titre || "")}`}
      title={`${team.titre} — ${oeuvresCount} œuvre(s) traduite(s) en français`}
      className="group bg-gray-800/40 backdrop-blur-md rounded-xl overflow-hidden border border-gray-700/30 hover:border-indigo-400/40 transition-all flex flex-col"
    >
      <div className="relative h-32 bg-gradient-to-br from-gray-700 to-gray-800 overflow-hidden">
        {cover ? (
          <Image
            src={cover}
            alt={`Logo de la team ${team.titre} — équipe de traduction française`}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <FiUsers className="text-5xl text-gray-600" />
          </div>
        )}
        <span
          className={`absolute top-2 right-2 px-2 py-0.5 text-[10px] font-bold rounded-full border ${
            isActive
              ? "bg-emerald-500/90 text-white border-emerald-300"
              : "bg-gray-700/90 text-gray-200 border-gray-500"
          }`}
        >
          {isActive ? "Active" : "Inactive"}
        </span>
      </div>
      <div className="p-3 flex-1 flex flex-col">
        <h3 className="text-base font-semibold text-white truncate group-hover:text-indigo-200 transition-colors">
          {team.titre}
        </h3>
        <p className="text-xs text-gray-400 line-clamp-2 mt-1 flex-1">
          {team.description ? (
            team.description.replace(/\s+/g, " ").trim().slice(0, 90) + "…"
          ) : (
            <span className="italic">Aucune description renseignée.</span>
          )}
        </p>
        <div className="flex items-center justify-between text-[11px] text-gray-500 mt-2 pt-2 border-t border-gray-700/30">
          <span className="flex items-center gap-1">
            <FiBook className="text-amber-400" /> {oeuvresCount} œuvre{oeuvresCount > 1 ? "s" : ""}
          </span>
          <span className="flex items-center gap-1">
            <FiExternalLink className="text-indigo-400" /> {liensCount}
          </span>
        </div>
      </div>
    </Link>
  );
}

export default function TeamsClient({
  initialTeams = [],
  stats = { total: 0, actives: 0, inactives: 0, oeuvres: 0 },
  topTeams = [],
  formatList = [],
  lastModified = null,
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all"); // all | active | inactive

  const filteredTeams = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return initialTeams.filter((t) => {
      if (filter === "active" && t.etat !== true) return false;
      if (filter === "inactive" && t.etat === true) return false;
      if (!q) return true;
      const hay = `${t.titre || ""} ${t.description || ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [initialTeams, searchTerm, filter]);

  const lastModifiedFr = lastModified
    ? new Date(lastModified).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <div className="relative bg-gray-900 text-white min-h-screen">
      {/* Hero background */}
      <div className="absolute inset-x-0 top-0 h-[700px] overflow-hidden">
        <CoverBackground />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-transparent z-[5]"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-gray-900/20 to-gray-900/60 z-[6]"></div>
        <div className="absolute bottom-0 left-0 right-0 h-96 bg-gradient-to-t from-gray-900 via-gray-900/95 to-transparent z-[7]"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-2">
        <nav
          aria-label="Fil d'Ariane"
          className="flex items-center text-sm text-gray-300 gap-2 bg-gray-800/40 backdrop-blur-md px-4 py-2 rounded-xl w-fit border border-gray-700/30 shadow-lg mb-6"
        >
          <Link href="/" className="hover:text-white transition flex items-center gap-1">
            <FiHome className="w-4 h-4" /> Accueil
          </Link>
          <FiChevronRight className="text-gray-500" />
          <span className="text-white">Teams</span>
        </nav>

        <header className="text-center mb-8">
          <div className="inline-flex items-center gap-2 text-xs uppercase tracking-wider text-indigo-300 mb-3 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-400/30">
            <FiUsers />
            <span>Annuaire des teams</span>
          </div>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-3 flex items-center justify-center gap-3 flex-wrap">
            <FiUsers className="text-indigo-400" />
            Équipes de traduction françaises
          </h1>
          <p className="text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Découvrez les{" "}
            <strong className="text-white">{stats.total} teams</strong> de traduction de
            webnovels, light novels et romans web asiatiques (chinois, coréens, japonais)
            référencées sur Novel-Index. Au total{" "}
            <strong className="text-white">{stats.actives} sont actives</strong> et
            traduisent <strong className="text-white">{stats.oeuvres} œuvres</strong> en
            français.
            {lastModifiedFr && (
              <>
                {" "}
                <span className="text-gray-400 text-sm">
                  Mis à jour le {lastModifiedFr}.
                </span>
              </>
            )}
          </p>
        </header>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8 max-w-4xl mx-auto">
          <StatCard icon={FiUsers} label="Total" value={stats.total} color="indigo" />
          <StatCard icon={FiCheckCircle} label="Actives" value={stats.actives} color="emerald" />
          <StatCard icon={FiClock} label="Inactives" value={stats.inactives} color="gray" />
          <StatCard icon={FiBook} label="Œuvres" value={stats.oeuvres} color="amber" />
        </div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 space-y-8">
        {/* Top teams (cross-linking SEO) */}
        {topTeams.length > 0 && (
          <section className="bg-gray-800/40 backdrop-blur-md rounded-xl p-5 border border-gray-700/30">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <FiTrendingUp className="text-amber-400" />
              Top {topTeams.length} des teams les plus actives
            </h2>
            <p className="text-sm text-gray-400 mb-4">
              Les équipes francophones qui traduisent le plus de webnovels et light novels
              sur Novel-Index.
            </p>
            <ol className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {topTeams.map((t, i) => {
                const cover = getCoverUrl(t);
                const count = t.oeuvres?.length || 0;
                return (
                  <li key={t.documentId}>
                    <Link
                      href={`/Teams/${t.documentId}-${slugify(t.titre || "")}`}
                      title={`${t.titre} — ${count} œuvre(s)`}
                      className="group flex items-center gap-3 bg-gray-900/40 hover:bg-gray-900/60 rounded-lg p-2.5 border border-gray-700/30 hover:border-amber-400/40 transition-colors"
                    >
                      <span className="text-xs font-bold text-amber-300 w-5 text-center flex-shrink-0">
                        #{i + 1}
                      </span>
                      <div className="w-10 h-10 rounded-md overflow-hidden bg-gray-800 flex-shrink-0 relative">
                        {cover ? (
                          <Image
                            src={cover}
                            alt={`Logo ${t.titre}`}
                            fill
                            sizes="40px"
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <FiUsers className="text-gray-600 text-sm" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-semibold text-white truncate group-hover:text-amber-200">
                          {t.titre}
                        </div>
                        <div className="text-[11px] text-gray-400">
                          {count} œuvre{count > 1 ? "s" : ""}
                        </div>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ol>
          </section>
        )}

        {/* Répartition par format (signaux sémantiques) */}
        {formatList.length > 0 && (
          <section className="bg-gray-800/40 backdrop-blur-md rounded-xl p-5 border border-gray-700/30">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <FiLayers className="text-purple-400" />
              Œuvres traduites par format
            </h2>
            <div className="flex flex-wrap gap-2">
              {formatList.map(([type, count]) => (
                <span
                  key={type}
                  className="px-3 py-1.5 bg-purple-500/10 text-purple-200 border border-purple-400/30 rounded-full text-sm flex items-center gap-2"
                >
                  <strong className="text-white">{count}</strong> {type}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Filtres + recherche */}
        <section className="bg-gray-800/40 backdrop-blur-md rounded-xl p-4 border border-gray-700/30">
          <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
            <div className="relative flex-1 max-w-md">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="search"
                placeholder="Rechercher une team…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 bg-gray-900/60 border border-gray-700/40 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-400/60"
                aria-label="Rechercher une team de traduction"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <FilterButton
                active={filter === "all"}
                onClick={() => setFilter("all")}
                color="indigo"
                icon={FiUsers}
                count={stats.total}
              >
                Toutes
              </FilterButton>
              <FilterButton
                active={filter === "active"}
                onClick={() => setFilter("active")}
                color="emerald"
                icon={FiCheckCircle}
                count={stats.actives}
              >
                Actives
              </FilterButton>
              <FilterButton
                active={filter === "inactive"}
                onClick={() => setFilter("inactive")}
                color="gray"
                icon={FiClock}
                count={stats.inactives}
              >
                Inactives
              </FilterButton>
            </div>
          </div>
        </section>

        {/* Liste */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <FiUsers className="text-indigo-400" />
              {filter === "active"
                ? "Teams actives"
                : filter === "inactive"
                  ? "Teams inactives"
                  : "Toutes les teams"}{" "}
              <span className="text-sm font-normal text-gray-400">
                ({filteredTeams.length})
              </span>
            </h2>
          </div>

          {filteredTeams.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredTeams.map((t) => (
                <TeamCard key={t.documentId} team={t} />
              ))}
            </div>
          ) : (
            <div className="bg-gray-800/40 backdrop-blur-md rounded-xl p-8 border border-gray-700/30 text-center text-gray-400">
              Aucune team ne correspond à votre recherche.
            </div>
          )}
        </section>

        {/* Bloc contenu SEO + FAQ */}
        <section className="bg-gray-800/40 backdrop-blur-md rounded-xl p-5 border border-gray-700/30">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <FiHelpCircle className="text-emerald-400" />
            Questions fréquentes sur les teams de traduction
          </h2>
          <div className="space-y-4">
            <details className="group bg-gray-900/40 rounded-lg p-4 border border-gray-700/30">
              <summary className="cursor-pointer font-semibold text-white flex items-center justify-between">
                Qu&apos;est-ce qu&apos;une team de traduction de webnovels&nbsp;?
                <FiChevronRight className="group-open:rotate-90 transition-transform text-gray-400" />
              </summary>
              <p className="text-gray-300 text-sm mt-3 leading-relaxed">
                Une <strong>team de traduction</strong> est un groupe de bénévoles
                francophones qui traduisent gratuitement des <em>webnovels</em>,{" "}
                <em>light novels</em> et romans web asiatiques (chinois, coréens, japonais)
                vers le français, chapitre par chapitre, généralement publiés sur leur site
                ou sur des plateformes communautaires.
              </p>
            </details>
            <details className="group bg-gray-900/40 rounded-lg p-4 border border-gray-700/30">
              <summary className="cursor-pointer font-semibold text-white flex items-center justify-between">
                Combien y a-t-il de teams sur Novel-Index&nbsp;?
                <FiChevronRight className="group-open:rotate-90 transition-transform text-gray-400" />
              </summary>
              <p className="text-gray-300 text-sm mt-3 leading-relaxed">
                Novel-Index recense actuellement <strong>{stats.total} teams</strong> de
                traduction françaises, dont <strong>{stats.actives} sont actives</strong>{" "}
                et publient régulièrement de nouveaux chapitres. Au total, elles traduisent{" "}
                <strong>{stats.oeuvres} œuvres</strong>.
              </p>
            </details>
            <details className="group bg-gray-900/40 rounded-lg p-4 border border-gray-700/30">
              <summary className="cursor-pointer font-semibold text-white flex items-center justify-between">
                Comment soutenir une team de traduction&nbsp;?
                <FiChevronRight className="group-open:rotate-90 transition-transform text-gray-400" />
              </summary>
              <p className="text-gray-300 text-sm mt-3 leading-relaxed">
                Vous pouvez soutenir une team via leur Discord, leur Patreon, ou simplement
                en partageant leurs traductions. La plupart des teams listent leurs liens
                officiels (site, Discord, réseaux sociaux) sur leur page Novel-Index dédiée.
              </p>
            </details>
            <details className="group bg-gray-900/40 rounded-lg p-4 border border-gray-700/30">
              <summary className="cursor-pointer font-semibold text-white flex items-center justify-between">
                Comment savoir si une team est encore active&nbsp;?
                <FiChevronRight className="group-open:rotate-90 transition-transform text-gray-400" />
              </summary>
              <p className="text-gray-300 text-sm mt-3 leading-relaxed">
                Chaque team affiche un badge <strong>« Active »</strong> ou{" "}
                <strong>« Inactive »</strong>. Les teams actives publient régulièrement,
                les teams inactives ont mis leurs projets en pause ou les ont abandonnés.
                Vous pouvez filtrer la liste ci-dessus selon ce critère.
              </p>
            </details>
          </div>
        </section>

        {lastModifiedFr && (
          <p className="text-xs text-gray-500 text-center flex items-center justify-center gap-1">
            <FiCalendar /> Dernière mise à jour de l&apos;annuaire&nbsp;: {lastModifiedFr}
          </p>
        )}
      </div>
    </div>
  );
}
