"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import Image from "next/image";
import {
  FiSearch,
  FiX,
  FiUsers,
  FiInfo,
  FiAlertCircle,
  FiCheck,
  FiUpload,
  FiTag,
} from "react-icons/fi";

const STRAPI_URL = "https://novel-index-strapi.onrender.com";

const IndexeurOeuvre = ({ user }) => {
  const [formData, setFormData] = useState({
    titre: "",
    titrealt: "",
    auteur: "",
    synopsis: "",
    annee: "",
    etat: "",
    type: "",
    categorie: "",
    licence: false,
    langage: "Français",
    couverture: null,
  });

  const [message, setMessage] = useState(null);
  const [messageType, setMessageType] = useState(null);
  const [preview, setPreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Team autocomplete
  const [teamSearch, setTeamSearch] = useState("");
  const [teamResults, setTeamResults] = useState([]);
  const [searchingTeams, setSearchingTeams] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [teamError, setTeamError] = useState(false);
  const searchTimeoutRef = useRef(null);
  const dropdownRef = useRef(null);

  // Tags & Genres
  const [allTags, setAllTags] = useState([]);
  const [allGenres, setAllGenres] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [searchTag, setSearchTag] = useState("");
  const [searchGenre, setSearchGenre] = useState("");
  const [loadingTagsGenres, setLoadingTagsGenres] = useState(true);
  const [tagsGenresError, setTagsGenresError] = useState(false);

  // Charger tous les tags et genres au montage
  useEffect(() => {
    const fetchAllTagsGenres = async () => {
      setLoadingTagsGenres(true);
      try {
        const jwt = localStorage.getItem("jwt");
        const headers = { Authorization: `Bearer ${jwt}` };

        // Fetch all tags (paginated)
        let tags = [];
        let page = 1;
        let hasMore = true;
        while (hasMore) {
          const res = await axios.get(
            `${STRAPI_URL}/api/tags?pagination[page]=${page}&pagination[pageSize]=100&sort=titre:asc`,
            { headers }
          );
          tags = [...tags, ...res.data.data];
          const pagination = res.data.meta?.pagination;
          hasMore = pagination && page < pagination.pageCount;
          page++;
        }
        setAllTags(tags);

        // Fetch all genres (paginated)
        let genres = [];
        page = 1;
        hasMore = true;
        while (hasMore) {
          const res = await axios.get(
            `${STRAPI_URL}/api/genres?pagination[page]=${page}&pagination[pageSize]=100&sort=titre:asc`,
            { headers }
          );
          genres = [...genres, ...res.data.data];
          const pagination = res.data.meta?.pagination;
          hasMore = pagination && page < pagination.pageCount;
          page++;
        }
        setAllGenres(genres);
      } catch (error) {
        console.error("Erreur chargement tags/genres:", error);
      } finally {
        setLoadingTagsGenres(false);
      }
    };

    fetchAllTagsGenres();
  }, []);

  // Fermer le dropdown team quand on clique en dehors
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setTeamResults([]);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Recherche debounced team
  useEffect(() => {
    if (!teamSearch.trim()) {
      setTeamResults([]);
      return;
    }

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(async () => {
      setSearchingTeams(true);
      try {
        const res = await axios.get(
          `${STRAPI_URL}/api/teams?filters[titre][$containsi]=${encodeURIComponent(teamSearch)}&populate=couverture&pagination[pageSize]=10`
        );
        setTeamResults(res.data.data || []);
      } catch (error) {
        console.error("Erreur recherche teams:", error);
      } finally {
        setSearchingTeams(false);
      }
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [teamSearch]);

  // Filtrage tags/genres par recherche
  const filteredTags = useMemo(() => {
    if (!searchTag.trim()) return allTags;
    return allTags.filter((t) =>
      t.titre?.toLowerCase().includes(searchTag.toLowerCase())
    );
  }, [allTags, searchTag]);

  const filteredGenres = useMemo(() => {
    if (!searchGenre.trim()) return allGenres;
    return allGenres.filter((g) =>
      g.titre?.toLowerCase().includes(searchGenre.toLowerCase())
    );
  }, [allGenres, searchGenre]);

  const toggleTag = (tag) => {
    setSelectedTags((prev) =>
      prev.find((t) => t.documentId === tag.documentId)
        ? prev.filter((t) => t.documentId !== tag.documentId)
        : [...prev, tag]
    );
    setTagsGenresError(false);
  };

  const toggleGenre = (genre) => {
    setSelectedGenres((prev) =>
      prev.find((g) => g.documentId === genre.documentId)
        ? prev.filter((g) => g.documentId !== genre.documentId)
        : [...prev, genre]
    );
    setTagsGenresError(false);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" || type === "radio" ? checked : value,
    });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, couverture: file });
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (submitting) return;

    // Validation team
    if (teamSearch.trim() && !selectedTeam) {
      setTeamError(true);
      setMessage(
        "Veuillez sélectionner une team dans la liste ou videz le champ de recherche."
      );
      setMessageType("error");
      return;
    }

    // Validation tags & genres (minimum 2 de chaque)
    if (selectedTags.length < 2 || selectedGenres.length < 2) {
      setTagsGenresError(true);
      setMessage(
        `Vous devez sélectionner au minimum 2 tags et 2 genres. (Actuellement : ${selectedTags.length} tag${selectedTags.length !== 1 ? "s" : ""}, ${selectedGenres.length} genre${selectedGenres.length !== 1 ? "s" : ""})`
      );
      setMessageType("error");
      return;
    }

    setSubmitting(true);
    setMessage(null);
    setTeamError(false);
    setTagsGenresError(false);

    try {
      const jwt = localStorage.getItem("jwt");

      if (!jwt) {
        setMessage("Vous devez être connecté pour ajouter une œuvre.");
        setMessageType("error");
        setSubmitting(false);
        return;
      }

      const headers = {
        Authorization: `Bearer ${jwt}`,
        "Content-Type": "application/json",
      };

      const payload = {
        data: {
          titre: formData.titre,
          titrealt: formData.titrealt,
          auteur: formData.auteur,
          traduction: selectedTeam ? selectedTeam.titre : "",
          synopsis: formData.synopsis,
          annee: formData.annee,
          etat: formData.etat,
          type: formData.type,
          categorie: formData.categorie,
          licence: Boolean(formData.licence),
          langage: formData.langage,
          users_permissions_users: [user.documentId],
        },
      };

      const response = await axios.post(
        `${STRAPI_URL}/api/oeuvres`,
        payload,
        { headers }
      );

      const newOeuvreId = response.data?.data?.id;
      const newOeuvreDocumentId = response.data?.data?.documentId;

      // Upload couverture
      if (formData.couverture && newOeuvreId) {
        const uploadData = new FormData();
        uploadData.append("files", formData.couverture);
        uploadData.append("ref", "api::oeuvre.oeuvre");
        uploadData.append("refId", newOeuvreId);
        uploadData.append("field", "couverture");

        try {
          await axios.post(`${STRAPI_URL}/api/upload`, uploadData, {
            headers: { Authorization: `Bearer ${jwt}` },
          });
        } catch (error) {
          console.warn("Erreur upload couverture:", error.response?.data || error.message);
        }
      }

      // Relation team-oeuvre
      if (selectedTeam && newOeuvreDocumentId) {
        try {
          const teamRes = await axios.get(
            `${STRAPI_URL}/api/teams/${selectedTeam.documentId}?populate=oeuvres`,
            { headers }
          );
          const currentOeuvres =
            teamRes.data.data?.oeuvres?.map((o) => o.documentId) || [];
          await axios.put(
            `${STRAPI_URL}/api/teams/${selectedTeam.documentId}`,
            { data: { oeuvres: [...currentOeuvres, newOeuvreDocumentId] } },
            { headers }
          );
        } catch (error) {
          console.warn("Erreur liaison team-oeuvre:", error.response?.data || error.message);
        }
      }

      // Relations tags
      if (newOeuvreDocumentId) {
        for (const tag of selectedTags) {
          try {
            const tagRes = await axios.get(
              `${STRAPI_URL}/api/tags/${tag.documentId}?populate[oeuvres][fields][0]=documentId`,
              { headers }
            );
            const existingIds =
              tagRes.data.data?.oeuvres?.map((o) => o.documentId) || [];
            await axios.put(
              `${STRAPI_URL}/api/tags/${tag.documentId}`,
              {
                data: {
                  oeuvres: [...new Set([...existingIds, newOeuvreDocumentId])],
                },
              },
              { headers }
            );
          } catch (error) {
            console.warn(`Erreur liaison tag "${tag.titre}":`, error.response?.data || error.message);
          }
        }

        // Relations genres
        for (const genre of selectedGenres) {
          try {
            const genreRes = await axios.get(
              `${STRAPI_URL}/api/genres/${genre.documentId}?populate[oeuvres][fields][0]=documentId`,
              { headers }
            );
            const existingIds =
              genreRes.data.data?.oeuvres?.map((o) => o.documentId) || [];
            await axios.put(
              `${STRAPI_URL}/api/genres/${genre.documentId}`,
              {
                data: {
                  oeuvres: [...new Set([...existingIds, newOeuvreDocumentId])],
                },
              },
              { headers }
            );
          } catch (error) {
            console.warn(`Erreur liaison genre "${genre.titre}":`, error.response?.data || error.message);
          }
        }
      }

      // Message succes
      const teamMsg = selectedTeam
        ? ` et liée à la team « ${selectedTeam.titre} »`
        : "";
      setMessage(
        `Œuvre ajoutée${teamMsg} avec ${selectedTags.length} tags et ${selectedGenres.length} genres !`
      );
      setMessageType("success");

      // Reset
      setFormData({
        titre: "",
        titrealt: "",
        auteur: "",
        synopsis: "",
        annee: "",
        etat: "",
        type: "",
        categorie: "",
        licence: false,
        langage: "Français",
        couverture: null,
      });
      setSelectedTeam(null);
      setTeamSearch("");
      setPreview(null);
      setSelectedTags([]);
      setSelectedGenres([]);
      setSearchTag("");
      setSearchGenre("");
    } catch (error) {
      console.error("Erreur ajout:", error.response?.data || error.message);
      setMessage("Erreur lors de l'ajout de l'œuvre.");
      setMessageType("error");
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass =
    "w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 focus:outline-none transition-colors";
  const labelClass = "block text-sm font-medium text-gray-300 mb-1.5";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
      className="w-full max-w-4xl mx-auto bg-gray-900 p-8 rounded-2xl shadow-2xl text-white"
    >
      <h1 className="text-2xl font-bold mb-6 text-center">
        Ajouter une œuvre
      </h1>

      {/* Message feedback */}
      {message && (
        <div
          className={`mb-6 flex items-start gap-3 p-4 rounded-xl text-sm font-medium ${
            messageType === "success"
              ? "bg-green-500/10 text-green-400 border border-green-500/20"
              : messageType === "warning"
              ? "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"
              : "bg-red-500/10 text-red-400 border border-red-500/20"
          }`}
        >
          {messageType === "success" ? (
            <FiCheck className="mt-0.5 flex-shrink-0 text-lg" />
          ) : (
            <FiAlertCircle className="mt-0.5 flex-shrink-0 text-lg" />
          )}
          <span>{message}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1 : Informations principales */}
        <fieldset className="border border-gray-700/50 p-6 rounded-xl bg-gray-800/20">
          <legend className="text-base font-semibold px-3 text-indigo-400">
            Informations principales
          </legend>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-4">
            {/* Titre */}
            <div>
              <label htmlFor="titre" className={labelClass}>
                Titre <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                id="titre"
                name="titre"
                required
                disabled={submitting}
                placeholder="Ex : Solo Leveling"
                value={formData.titre}
                onChange={handleChange}
                className={inputClass}
              />
            </div>

            {/* Titre alternatif */}
            <div>
              <label htmlFor="titrealt" className={labelClass}>
                Titre alternatif
              </label>
              <input
                type="text"
                id="titrealt"
                name="titrealt"
                disabled={submitting}
                placeholder="Ex : 나 혼자만 레벨업"
                value={formData.titrealt}
                onChange={handleChange}
                className={inputClass}
              />
            </div>

            {/* Auteur */}
            <div>
              <label htmlFor="auteur" className={labelClass}>
                Auteur <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                id="auteur"
                name="auteur"
                required
                disabled={submitting}
                placeholder="Ex : Chugong"
                value={formData.auteur}
                onChange={handleChange}
                className={inputClass}
              />
            </div>

            {/* Team de traduction */}
            <div className="relative" ref={dropdownRef}>
              <label className={labelClass}>Team de traduction</label>

              <div className="flex items-start gap-2 px-3 py-2 mb-2 bg-indigo-500/10 border border-indigo-500/20 rounded-lg">
                <FiInfo className="mt-0.5 flex-shrink-0 text-indigo-400" />
                <span className="text-xs text-indigo-300/90">
                  Vous devez d'abord créer votre team dans l'onglet « Teams »
                  avant de pouvoir la rattacher ici.
                </span>
              </div>

              {selectedTeam ? (
                <div className="flex items-center gap-3 bg-gray-800 border border-green-500/30 rounded-lg px-3 py-2.5">
                  <div className="w-7 h-7 rounded-md overflow-hidden bg-gray-700 flex-shrink-0">
                    {selectedTeam.couverture?.url ? (
                      <Image
                        src={selectedTeam.couverture.url}
                        alt={selectedTeam.titre}
                        width={28}
                        height={28}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <FiUsers className="text-gray-500 text-xs" />
                      </div>
                    )}
                  </div>
                  <span className="flex-1 text-sm font-medium truncate">
                    {selectedTeam.titre}
                  </span>
                  <FiCheck className="text-green-400 flex-shrink-0" />
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedTeam(null);
                      setTeamError(false);
                    }}
                    disabled={submitting}
                    className="p-1 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded transition-colors"
                  >
                    <FiX size={14} />
                  </button>
                </div>
              ) : (
                <>
                  <div className="relative">
                    <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input
                      type="text"
                      placeholder="Rechercher une team..."
                      value={teamSearch}
                      disabled={submitting}
                      onChange={(e) => {
                        setTeamSearch(e.target.value);
                        setTeamError(false);
                      }}
                      className={`${inputClass} pl-9 ${
                        teamError
                          ? "!border-red-500 !ring-1 !ring-red-500/50"
                          : ""
                      }`}
                    />
                    {searchingTeams && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                      </div>
                    )}
                  </div>

                  {teamError && (
                    <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1">
                      <FiAlertCircle size={12} />
                      Sélectionnez une team dans la liste ou videz le champ.
                    </p>
                  )}

                  {teamSearch.trim() &&
                    !searchingTeams &&
                    teamResults.length === 0 && (
                      <p className="mt-1.5 text-xs text-gray-500">
                        Aucune team trouvée pour « {teamSearch} »
                      </p>
                    )}

                  {teamResults.length > 0 && (
                    <div className="absolute z-20 left-0 right-0 mt-1 bg-gray-800 border border-gray-600 rounded-lg max-h-52 overflow-y-auto shadow-2xl">
                      {teamResults.map((team) => (
                        <button
                          key={team.documentId}
                          type="button"
                          onClick={() => {
                            setSelectedTeam(team);
                            setTeamSearch("");
                            setTeamResults([]);
                            setTeamError(false);
                          }}
                          className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-indigo-600/20 transition-colors text-left border-b border-gray-700/50 last:border-b-0"
                        >
                          <div className="w-8 h-8 flex-shrink-0 bg-gray-700 rounded-md overflow-hidden">
                            {team.couverture?.url ? (
                              <Image
                                src={team.couverture.url}
                                alt={team.titre}
                                width={32}
                                height={32}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-500">
                                <FiUsers size={14} />
                              </div>
                            )}
                          </div>
                          <span className="text-sm font-medium truncate">
                            {team.titre}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </fieldset>

        {/* Section 2 : Tags & Genres */}
        <fieldset
          className={`border p-6 rounded-xl bg-gray-800/20 ${
            tagsGenresError
              ? "border-red-500/50"
              : "border-gray-700/50"
          }`}
        >
          <legend className="text-base font-semibold px-3 text-indigo-400 flex items-center gap-2">
            <FiTag className="inline" />
            Tags & Genres
            <span className="text-red-400 text-sm">*</span>
          </legend>

          {/* Compteur + info minimum */}
          <div className="mt-3 mb-4 flex items-center gap-3 flex-wrap">
            <span
              className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                selectedTags.length >= 2
                  ? "bg-green-500/15 text-green-400"
                  : "bg-red-500/15 text-red-400"
              }`}
            >
              {selectedTags.length}/2 tags min.
            </span>
            <span
              className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                selectedGenres.length >= 2
                  ? "bg-green-500/15 text-green-400"
                  : "bg-red-500/15 text-red-400"
              }`}
            >
              {selectedGenres.length}/2 genres min.
            </span>
            {tagsGenresError && (
              <span className="text-xs text-red-400 flex items-center gap-1">
                <FiAlertCircle size={12} />
                Minimum 2 tags et 2 genres requis
              </span>
            )}
          </div>

          {loadingTagsGenres ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
              <span className="ml-3 text-sm text-gray-400">
                Chargement des tags & genres...
              </span>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-5">
              {/* Tags */}
              <div className="bg-gray-800/60 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-white mb-3">Tags</h3>

                {/* Tags selectionnees */}
                {selectedTags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {selectedTags.map((t) => (
                      <span
                        key={t.documentId}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-indigo-600 text-white"
                      >
                        {t.titre}
                        <button
                          type="button"
                          onClick={() => toggleTag(t)}
                          disabled={submitting}
                          className="hover:text-red-300 transition-colors"
                        >
                          <FiX size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {/* Recherche tag */}
                <div className="relative mb-3">
                  <FiSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500 w-3.5 h-3.5" />
                  <input
                    type="text"
                    value={searchTag}
                    onChange={(e) => setSearchTag(e.target.value)}
                    disabled={submitting}
                    placeholder="Filtrer les tags..."
                    className="w-full pl-8 pr-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white text-xs focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                {/* Liste des tags cliquables */}
                <div className="max-h-44 overflow-y-auto flex flex-wrap gap-1.5">
                  {filteredTags.map((t) => {
                    const isSelected = selectedTags.some(
                      (s) => s.documentId === t.documentId
                    );
                    return (
                      <button
                        key={t.documentId}
                        type="button"
                        onClick={() => toggleTag(t)}
                        disabled={submitting}
                        className={`px-2.5 py-1 rounded-full text-xs transition-colors ${
                          isSelected
                            ? "bg-indigo-600 text-white"
                            : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                        }`}
                      >
                        {t.titre}
                      </button>
                    );
                  })}
                  {filteredTags.length === 0 && (
                    <p className="text-xs text-gray-500 py-2">
                      Aucun tag trouvé
                    </p>
                  )}
                </div>
              </div>

              {/* Genres */}
              <div className="bg-gray-800/60 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-white mb-3">
                  Genres
                </h3>

                {/* Genres selectionnees */}
                {selectedGenres.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {selectedGenres.map((g) => (
                      <span
                        key={g.documentId}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-indigo-600 text-white"
                      >
                        {g.titre}
                        <button
                          type="button"
                          onClick={() => toggleGenre(g)}
                          disabled={submitting}
                          className="hover:text-red-300 transition-colors"
                        >
                          <FiX size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {/* Recherche genre */}
                <div className="relative mb-3">
                  <FiSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500 w-3.5 h-3.5" />
                  <input
                    type="text"
                    value={searchGenre}
                    onChange={(e) => setSearchGenre(e.target.value)}
                    disabled={submitting}
                    placeholder="Filtrer les genres..."
                    className="w-full pl-8 pr-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white text-xs focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                {/* Liste des genres cliquables */}
                <div className="max-h-44 overflow-y-auto flex flex-wrap gap-1.5">
                  {filteredGenres.map((g) => {
                    const isSelected = selectedGenres.some(
                      (s) => s.documentId === g.documentId
                    );
                    return (
                      <button
                        key={g.documentId}
                        type="button"
                        onClick={() => toggleGenre(g)}
                        disabled={submitting}
                        className={`px-2.5 py-1 rounded-full text-xs transition-colors ${
                          isSelected
                            ? "bg-indigo-600 text-white"
                            : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                        }`}
                      >
                        {g.titre}
                      </button>
                    );
                  })}
                  {filteredGenres.length === 0 && (
                    <p className="text-xs text-gray-500 py-2">
                      Aucun genre trouvé
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </fieldset>

        {/* Section 3 : Details */}
        <fieldset className="border border-gray-700/50 p-6 rounded-xl bg-gray-800/20">
          <legend className="text-base font-semibold px-3 text-indigo-400">
            Détails de l'œuvre
          </legend>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-4">
            <div className="md:col-span-2">
              <label htmlFor="synopsis" className={labelClass}>
                Synopsis
              </label>
              <textarea
                id="synopsis"
                name="synopsis"
                value={formData.synopsis}
                onChange={handleChange}
                disabled={submitting}
                rows="4"
                placeholder="Résumé de l'œuvre..."
                className={`${inputClass} resize-none`}
              />
            </div>

            <div>
              <label htmlFor="annee" className={labelClass}>
                Année
              </label>
              <input
                type="number"
                id="annee"
                name="annee"
                disabled={submitting}
                placeholder="Ex : 2024"
                value={formData.annee}
                onChange={handleChange}
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="etat" className={labelClass}>
                État
              </label>
              <select
                id="etat"
                name="etat"
                value={formData.etat}
                onChange={handleChange}
                disabled={submitting}
                className={inputClass}
              >
                <option value="">-- Sélectionnez --</option>
                <option value="En cours">En cours</option>
                <option value="Terminé">Terminé</option>
                <option value="Abandonné">Abandonné</option>
                <option value="Libre">Libre</option>
                <option value="En pause">En pause</option>
                <option value="En attente">En attente</option>
              </select>
            </div>

            <div>
              <label htmlFor="type" className={labelClass}>
                Type
              </label>
              <select
                id="type"
                name="type"
                value={formData.type}
                onChange={handleChange}
                disabled={submitting}
                className={inputClass}
              >
                <option value="">-- Sélectionnez --</option>
                <option value="Light novel">Light novel</option>
                <option value="Web novel">Web novel</option>
                <option value="Scan">Scan</option>
                <option value="Webtoon">Webtoon</option>
              </select>
            </div>

            <div>
              <label htmlFor="categorie" className={labelClass}>
                Catégorie
              </label>
              <select
                id="categorie"
                name="categorie"
                value={formData.categorie}
                onChange={handleChange}
                disabled={submitting}
                className={inputClass}
              >
                <option value="">-- Sélectionnez --</option>
                <option value="Shonen">Shonen</option>
                <option value="Seinen">Seinen</option>
                <option value="Shojo">Shojo</option>
                <option value="Isekai">Isekai</option>
              </select>
            </div>
          </div>
        </fieldset>

        {/* Section 4 : Autres infos */}
        <fieldset className="border border-gray-700/50 p-6 rounded-xl bg-gray-800/20">
          <legend className="text-base font-semibold px-3 text-indigo-400">
            Autres informations
          </legend>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-4">
            <div>
              <label className={labelClass}>Œuvre licenciée en France ?</label>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-sm text-gray-400">Non</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="licence"
                    checked={formData.licence === true}
                    disabled={submitting}
                    onChange={(e) =>
                      handleChange({
                        target: { name: "licence", value: e.target.checked },
                      })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-600 peer-checked:bg-green-500 rounded-full transition-all" />
                  <div className="absolute w-4 h-4 bg-white rounded-full shadow left-1 top-1 transition-transform peer-checked:translate-x-full" />
                </label>
                <span className="text-sm text-gray-400">Oui</span>
              </div>
            </div>

            <div>
              <label htmlFor="langage" className={labelClass}>
                Langage
              </label>
              <input
                type="text"
                id="langage"
                name="langage"
                disabled={submitting}
                value={formData.langage}
                onChange={handleChange}
                className={inputClass}
              />
            </div>

            <div className="md:col-span-2">
              <label htmlFor="couverture" className={labelClass}>
                Couverture
              </label>

              <div
                className={`relative border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center transition-all duration-200 ${
                  preview
                    ? "border-green-500/40 bg-green-500/5"
                    : "border-gray-600 bg-gray-800/50 hover:border-indigo-500 hover:bg-gray-800"
                }`}
              >
                {preview ? (
                  <div className="flex flex-col items-center gap-3">
                    <img
                      src={preview}
                      alt="Prévisualisation"
                      className="max-h-48 object-contain rounded-lg"
                    />
                    <div className="flex items-center gap-2 text-green-400 text-xs">
                      <FiCheck />
                      <span>{formData.couverture?.name}</span>
                    </div>
                    <span className="text-xs text-gray-500">
                      Cliquez pour changer
                    </span>
                  </div>
                ) : (
                  <>
                    <FiUpload className="h-8 w-8 text-indigo-400 mb-2" />
                    <p className="text-sm text-gray-400 text-center">
                      Glissez-déposez une image ou cliquez pour choisir
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      PNG, JPG, WebP
                    </p>
                  </>
                )}

                <input
                  type="file"
                  id="couverture"
                  name="couverture"
                  disabled={submitting}
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  accept="image/*"
                />
              </div>
            </div>
          </div>
        </fieldset>

        {/* Bouton submit */}
        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-xl font-bold text-white transition-colors flex items-center justify-center gap-2"
        >
          {submitting ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Ajout en cours...
            </>
          ) : (
            "Ajouter l'œuvre"
          )}
        </button>
      </form>
    </motion.div>
  );
};

export default IndexeurOeuvre;
