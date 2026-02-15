"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { FiUsers, FiBook, FiCheck, FiX, FiRefreshCw, FiLink, FiAlertTriangle } from "react-icons/fi";

const STRAPI_URL = "https://novel-index-strapi.onrender.com";

export default function AdminTeamsRelationsPage() {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState({});
  const [stats, setStats] = useState({ total: 0, linked: 0, errors: 0 });
  const [jwt, setJwt] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("jwt");
    setJwt(token);
    if (token) {
      fetchTeamsWithSuggestions();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchTeamsWithSuggestions = async () => {
    setLoading(true);
    try {
      // Fetch all teams
      const teamsRes = await fetch(
        `${STRAPI_URL}/api/teams?populate[0]=couverture&populate[1]=oeuvres.couverture&pagination[pageSize]=100`
      );
      const teamsData = await teamsRes.json();
      const allTeams = teamsData.data || [];

      // For each team, find suggested oeuvres
      const teamsWithSuggestions = await Promise.all(
        allTeams.map(async (team) => {
          const suggestions = await searchOeuvresForTeam(team.titre, team.oeuvres || []);
          return {
            ...team,
            suggestions,
            existingCount: team.oeuvres?.length || 0,
          };
        })
      );

      // Filter to only show teams with suggestions
      const teamsNeedingLinks = teamsWithSuggestions.filter(t => t.suggestions.length > 0);
      
      setTeams(teamsNeedingLinks);
      setStats({
        total: allTeams.length,
        needsLinks: teamsNeedingLinks.length,
        totalSuggestions: teamsNeedingLinks.reduce((sum, t) => sum + t.suggestions.length, 0),
      });
    } catch (err) {
      console.error("Erreur fetch teams:", err);
    } finally {
      setLoading(false);
    }
  };

  const searchOeuvresForTeam = async (teamTitle, existingOeuvres) => {
    try {
      const normalizedTitle = teamTitle.toLowerCase().trim();
      const searchTerms = new Set();
      
      // Full name
      searchTerms.add(normalizedTitle);
      
      // Without common suffixes
      const withoutSuffix = normalizedTitle
        .replace(/\s*(trad|team|scan|scans|translation|translations)s?$/i, '')
        .trim();
      if (withoutSuffix.length >= 3) searchTerms.add(withoutSuffix);
      
      // Individual words (3+ chars)
      normalizedTitle.split(/\s+/).forEach(word => {
        if (word.length >= 3) searchTerms.add(word);
      });

      const existingIds = existingOeuvres.map(o => o.documentId);
      const allResults = new Map();

      for (const term of searchTerms) {
        try {
          const res = await fetch(
            `${STRAPI_URL}/api/oeuvres?filters[traduction][$containsi]=${encodeURIComponent(term)}&populate=couverture&pagination[pageSize]=50`
          );
          if (res.ok) {
            const data = await res.json();
            (data.data || []).forEach(oeuvre => {
              if (!existingIds.includes(oeuvre.documentId) && !allResults.has(oeuvre.documentId)) {
                allResults.set(oeuvre.documentId, oeuvre);
              }
            });
          }
        } catch (e) {
          console.error('Search error:', e);
        }
      }

      return Array.from(allResults.values());
    } catch (err) {
      console.error('Erreur recherche:', err);
      return [];
    }
  };

  const linkOeuvreToTeam = async (teamDocId, oeuvreDocId, teamIndex, oeuvreIndex) => {
    const key = `${teamDocId}-${oeuvreDocId}`;
    setProcessing(prev => ({ ...prev, [key]: 'loading' }));

    try {
      const token = localStorage.getItem("jwt");
      
      // Get current team oeuvres
      const teamRes = await fetch(
        `${STRAPI_URL}/api/teams/${teamDocId}?populate=oeuvres`
      );
      const teamData = await teamRes.json();
      const currentOeuvres = teamData.data?.oeuvres?.map(o => o.documentId) || [];
      
      // Add new oeuvre
      const updatedOeuvres = [...currentOeuvres, oeuvreDocId];

      // Update team
      const res = await fetch(`${STRAPI_URL}/api/teams/${teamDocId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: {
            oeuvres: updatedOeuvres,
          },
        }),
      });

      if (res.ok) {
        setProcessing(prev => ({ ...prev, [key]: 'success' }));
        
        // Remove from suggestions
        setTeams(prev => prev.map((team, i) => {
          if (i === teamIndex) {
            return {
              ...team,
              suggestions: team.suggestions.filter((_, j) => j !== oeuvreIndex),
              existingCount: team.existingCount + 1,
            };
          }
          return team;
        }));

        setTimeout(() => {
          setProcessing(prev => {
            const newState = { ...prev };
            delete newState[key];
            return newState;
          });
        }, 2000);
      } else {
        throw new Error('Erreur API');
      }
    } catch (err) {
      console.error('Erreur liaison:', err);
      setProcessing(prev => ({ ...prev, [key]: 'error' }));
    }
  };

  const linkAllForTeam = async (team, teamIndex) => {
    const key = `all-${team.documentId}`;
    setProcessing(prev => ({ ...prev, [key]: 'loading' }));

    try {
      const token = localStorage.getItem("jwt");
      
      // Get current team oeuvres
      const teamRes = await fetch(
        `${STRAPI_URL}/api/teams/${team.documentId}?populate=oeuvres`
      );
      const teamData = await teamRes.json();
      const currentOeuvres = teamData.data?.oeuvres?.map(o => o.documentId) || [];
      
      // Add all suggested oeuvres
      const newOeuvreIds = team.suggestions.map(o => o.documentId);
      const updatedOeuvres = [...new Set([...currentOeuvres, ...newOeuvreIds])];

      // Update team
      const res = await fetch(`${STRAPI_URL}/api/teams/${team.documentId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: {
            oeuvres: updatedOeuvres,
          },
        }),
      });

      if (res.ok) {
        setProcessing(prev => ({ ...prev, [key]: 'success' }));
        
        // Clear suggestions for this team
        setTeams(prev => prev.map((t, i) => {
          if (i === teamIndex) {
            return {
              ...t,
              suggestions: [],
              existingCount: t.existingCount + newOeuvreIds.length,
            };
          }
          return t;
        }));

        setTimeout(() => {
          setProcessing(prev => {
            const newState = { ...prev };
            delete newState[key];
            return newState;
          });
        }, 2000);
      } else {
        throw new Error('Erreur API');
      }
    } catch (err) {
      console.error('Erreur liaison multiple:', err);
      setProcessing(prev => ({ ...prev, [key]: 'error' }));
    }
  };

  const dismissSuggestion = (teamIndex, oeuvreIndex) => {
    setTeams(prev => prev.map((team, i) => {
      if (i === teamIndex) {
        return {
          ...team,
          suggestions: team.suggestions.filter((_, j) => j !== oeuvreIndex),
        };
      }
      return team;
    }));
  };

  if (!jwt) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">
        <div className="text-center">
          <FiAlertTriangle className="text-6xl text-yellow-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Accès restreint</h1>
          <p className="text-gray-400">Vous devez être connecté pour accéder à cette page.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-500 mx-auto mb-4"></div>
          <p>Analyse des relations teams-oeuvres en cours...</p>
          <p className="text-sm text-gray-400 mt-2">Cela peut prendre quelques instants</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <FiLink className="text-indigo-400" />
            Admin - Relations Teams / Oeuvres
          </h1>
          <p className="text-gray-400">
            Page temporaire pour rétablir les relations entre teams et oeuvres basé sur le champ "traduction"
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-gray-800 rounded-xl p-4">
            <div className="text-3xl font-bold text-indigo-400">{stats.total}</div>
            <div className="text-sm text-gray-400">Teams au total</div>
          </div>
          <div className="bg-gray-800 rounded-xl p-4">
            <div className="text-3xl font-bold text-yellow-400">{stats.needsLinks}</div>
            <div className="text-sm text-gray-400">Teams avec suggestions</div>
          </div>
          <div className="bg-gray-800 rounded-xl p-4">
            <div className="text-3xl font-bold text-green-400">{stats.totalSuggestions}</div>
            <div className="text-sm text-gray-400">Liaisons suggérées</div>
          </div>
        </div>

        {/* Refresh button */}
        <div className="mb-6">
          <button
            onClick={fetchTeamsWithSuggestions}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
          >
            <FiRefreshCw /> Rafraîchir l'analyse
          </button>
        </div>

        {/* Teams list */}
        {teams.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <FiCheck className="text-6xl mx-auto mb-4 text-green-500" />
            <p className="text-xl">Toutes les relations sont à jour !</p>
            <p className="text-sm">Aucune suggestion de liaison trouvée.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {teams.map((team, teamIndex) => (
              team.suggestions.length > 0 && (
                <div key={team.documentId} className="bg-gray-800 rounded-xl p-6">
                  {/* Team header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-700 flex-shrink-0">
                        {team.couverture?.url ? (
                          <Image
                            src={team.couverture.url}
                            alt={team.titre}
                            width={48}
                            height={48}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <FiUsers className="text-gray-500" />
                          </div>
                        )}
                      </div>
                      <div>
                        <h2 className="text-xl font-bold">{team.titre}</h2>
                        <p className="text-sm text-gray-400">
                          {team.existingCount} oeuvres liées • {team.suggestions.length} suggestions
                        </p>
                      </div>
                    </div>

                    {/* Link all button */}
                    <button
                      onClick={() => linkAllForTeam(team, teamIndex)}
                      disabled={processing[`all-${team.documentId}`] === 'loading'}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                        processing[`all-${team.documentId}`] === 'success'
                          ? 'bg-green-600'
                          : processing[`all-${team.documentId}`] === 'error'
                          ? 'bg-red-600'
                          : 'bg-indigo-600 hover:bg-indigo-700'
                      }`}
                    >
                      {processing[`all-${team.documentId}`] === 'loading' ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Liaison...
                        </>
                      ) : processing[`all-${team.documentId}`] === 'success' ? (
                        <>
                          <FiCheck /> Liées !
                        </>
                      ) : (
                        <>
                          <FiLink /> Lier toutes ({team.suggestions.length})
                        </>
                      )}
                    </button>
                  </div>

                  {/* Suggestions grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    {team.suggestions.map((oeuvre, oeuvreIndex) => {
                      const key = `${team.documentId}-${oeuvre.documentId}`;
                      const status = processing[key];

                      return (
                        <div
                          key={oeuvre.documentId}
                          className={`relative bg-gray-700 rounded-lg overflow-hidden transition-all ${
                            status === 'success' ? 'ring-2 ring-green-500' : ''
                          }`}
                        >
                          {/* Cover */}
                          <div className="aspect-[3/4] relative">
                            {oeuvre.couverture?.url ? (
                              <Image
                                src={oeuvre.couverture.url}
                                alt={oeuvre.titre}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-gray-600 flex items-center justify-center">
                                <FiBook className="text-2xl text-gray-500" />
                              </div>
                            )}

                            {/* Action buttons overlay */}
                            <div className="absolute inset-0 bg-black/60 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                              <button
                                onClick={() => linkOeuvreToTeam(team.documentId, oeuvre.documentId, teamIndex, oeuvreIndex)}
                                disabled={status === 'loading'}
                                className="p-2 bg-green-600 hover:bg-green-700 rounded-full transition-colors"
                                title="Lier cette oeuvre"
                              >
                                {status === 'loading' ? (
                                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                ) : (
                                  <FiCheck className="text-lg" />
                                )}
                              </button>
                              <button
                                onClick={() => dismissSuggestion(teamIndex, oeuvreIndex)}
                                className="p-2 bg-red-600 hover:bg-red-700 rounded-full transition-colors"
                                title="Ignorer cette suggestion"
                              >
                                <FiX className="text-lg" />
                              </button>
                            </div>

                            {/* Status badge */}
                            {status === 'success' && (
                              <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded">
                                Liée !
                              </div>
                            )}
                            {status === 'error' && (
                              <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded">
                                Erreur
                              </div>
                            )}
                          </div>

                          {/* Info */}
                          <div className="p-2">
                            <p className="text-xs font-medium truncate" title={oeuvre.titre}>
                              {oeuvre.titre}
                            </p>
                            <p className="text-xs text-yellow-400/80 truncate" title={oeuvre.traduction}>
                              {oeuvre.traduction}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
