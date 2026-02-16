"use client";

import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import axios from "axios";
import Image from "next/image";
import { FiSearch, FiX, FiBook, FiPlus } from "react-icons/fi";

const STRAPI_URL = "https://novel-index-strapi.onrender.com";

const excludedFields = [
  "id",
  "documentId",
  "createdAt",
  "updatedAt",
  "publishedAt",
  "couverture",
];

// Champs connus avec config
const knownFields = {
  titre: { label: "Titre", type: "text", colSpan: 2 },
  description: { label: "Description", type: "textarea", colSpan: 2 },
  etat: { label: "Etat (actif)", type: "toggle" },
};

const MoTeams = ({ user, team, onDirty }) => {
  const [teamData, setTeamData] = useState({});
  const [originalData, setOriginalData] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [preview, setPreview] = useState(null);
  const [newCouverture, setNewCouverture] = useState(null);
  const previewUrlRef = useRef(null);

  // Oeuvres association states
  const [associatedOeuvres, setAssociatedOeuvres] = useState([]);
  const [originalOeuvres, setOriginalOeuvres] = useState([]);
  const [oeuvreSearch, setOeuvreSearch] = useState("");
  const [oeuvreResults, setOeuvreResults] = useState([]);
  const [searchingOeuvres, setSearchingOeuvres] = useState(false);
  const searchTimeoutRef = useRef(null);

  useEffect(() => {
    const fetchTeam = async () => {
      setLoading(true);
      try {
        const jwt = localStorage.getItem("jwt");
        const response = await axios.get(
          `${STRAPI_URL}/api/teams/${team.documentId}?populate[0]=couverture&populate[1]=oeuvres.couverture`,
          { headers: { Authorization: `Bearer ${jwt}` } }
        );

        const data = response.data.data || {};
        setTeamData(data);
        setOriginalData(data);
        setPreview(data?.couverture?.formats?.medium?.url || data?.couverture?.formats?.small?.url || data?.couverture?.url || null);
        setNewCouverture(null);

        // Set associated oeuvres
        const oeuvres = data?.oeuvres || [];
        setAssociatedOeuvres(oeuvres);
        setOriginalOeuvres(oeuvres);
      } catch (error) {
        console.error("Erreur fetch team:", error);
        setFeedback({
          type: "error",
          message: "Erreur lors de la recuperation des donnees.",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchTeam();

    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
      }
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [team]);

  // Debounced oeuvre search
  useEffect(() => {
    if (!oeuvreSearch.trim()) {
      setOeuvreResults([]);
      return;
    }

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(async () => {
      setSearchingOeuvres(true);
      try {
        const response = await axios.get(
          `${STRAPI_URL}/api/oeuvres?filters[titre][$containsi]=${encodeURIComponent(oeuvreSearch)}&populate=couverture&pagination[pageSize]=10`
        );
        const results = response.data.data || [];
        // Filter out already associated oeuvres
        const associatedIds = associatedOeuvres.map(o => o.documentId);
        setOeuvreResults(results.filter(o => !associatedIds.includes(o.documentId)));
      } catch (error) {
        console.error("Erreur recherche oeuvres:", error);
      } finally {
        setSearchingOeuvres(false);
      }
    }, 300);
  }, [oeuvreSearch, associatedOeuvres]);

  // Check if oeuvres have been modified
  const oeuvresModified = useMemo(() => {
    const originalIds = originalOeuvres.map(o => o.documentId).sort();
    const currentIds = associatedOeuvres.map(o => o.documentId).sort();
    return JSON.stringify(originalIds) !== JSON.stringify(currentIds);
  }, [originalOeuvres, associatedOeuvres]);

  const addOeuvre = (oeuvre) => {
    setAssociatedOeuvres(prev => [...prev, oeuvre]);
    setOeuvreSearch("");
    setOeuvreResults([]);
    onDirty?.(true);
  };

  const removeOeuvre = (documentId) => {
    setAssociatedOeuvres(prev => prev.filter(o => o.documentId !== documentId));
    onDirty?.(true);
  };

  const isModified = (field) => {
    if (!originalData || Object.keys(originalData).length === 0) return false;
    return teamData[field] !== originalData[field];
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setTeamData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    onDirty?.(true);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
      }
      const blobUrl = URL.createObjectURL(file);
      previewUrlRef.current = blobUrl;
      setPreview(blobUrl);
      setNewCouverture(file);
      onDirty?.(true);
    }
  };

  const handleSave = useCallback(async () => {
    if (saving) return;
    setSaving(true);
    setFeedback(null);

    try {
      const jwt = localStorage.getItem("jwt");
      let uploadedCouvertureId = null;

      // 1. Upload nouvelle couverture si elle existe
      if (newCouverture instanceof File) {
        const uploadForm = new FormData();
        uploadForm.append("files", newCouverture);

        const uploadRes = await axios.post(`${STRAPI_URL}/api/upload`, uploadForm, {
          headers: { Authorization: `Bearer ${jwt}` },
        });

        uploadedCouvertureId = uploadRes.data[0]?.id;
      }

      // 2. Mise a jour des champs texte + relations oeuvres
      const filtered = Object.keys(teamData)
        .filter((key) => !excludedFields.includes(key))
        .reduce((obj, key) => ({ ...obj, [key]: teamData[key] }), {});

      // Add oeuvres relation
      filtered.oeuvres = associatedOeuvres.map(o => o.documentId);

      // Associer la nouvelle couverture si elle a ete uploadee
      if (uploadedCouvertureId) {
        filtered.couverture = uploadedCouvertureId;
      }

      await axios.put(
        `${STRAPI_URL}/api/teams/${team.documentId}`,
        { data: filtered },
        { headers: { Authorization: `Bearer ${jwt}` } }
      );

      setFeedback({
        type: "success",
        message: "Team mise a jour avec succes.",
      });
      setOriginalData({ ...teamData });
      setOriginalOeuvres([...associatedOeuvres]);
      setNewCouverture(null);
      onDirty?.(false);

      setTimeout(() => setFeedback(null), 4000);
    } catch (error) {
      console.error("Erreur save team:", error.response?.data || error.message);
      setFeedback({
        type: "error",
        message: "Erreur lors de la mise a jour.",
      });
    } finally {
      setSaving(false);
    }
  }, [teamData, team, saving, onDirty, newCouverture]);

  // Ctrl+S shortcut
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleSave]);

  const fieldClass = (field) =>
    `bg-gray-800 border rounded-lg p-2 w-full transition ${
      isModified(field)
        ? "border-indigo-400 ring-1 ring-indigo-400/30"
        : "border-gray-600"
    }`;

  // Champs dynamiques (pas dans knownFields ni exclus)
  const extraFields = Object.keys(teamData).filter(
    (key) =>
      !excludedFields.includes(key) &&
      !knownFields[key] &&
      typeof teamData[key] !== "object"
  );

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="w-8 h-8 border-[3px] border-indigo-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-gray-900 p-6 rounded-2xl text-white">
      {/* Feedback */}
      {feedback && (
        <div
          className={`mb-4 p-3 rounded-lg text-sm font-medium ${
            feedback.type === "success"
              ? "bg-green-600/20 text-green-400 border border-green-600/30"
              : "bg-red-600/20 text-red-400 border border-red-600/30"
          }`}
        >
          {feedback.message}
        </div>
      )}

      <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
        {/* Champs connus structures */}
        <fieldset className="border border-gray-700 p-6 rounded-xl">
          <legend className="text-lg font-semibold px-2 text-indigo-400">
            Informations de la team
          </legend>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
            {/* Titre */}
            <div className="md:col-span-2">
              <label
                htmlFor="team-titre"
                className="block text-sm font-medium mb-1"
              >
                Titre
                {isModified("titre") && (
                  <span className="ml-2 text-xs text-indigo-400">modifie</span>
                )}
              </label>
              <input
                type="text"
                id="team-titre"
                name="titre"
                value={teamData.titre || ""}
                onChange={handleChange}
                disabled={saving}
                className={fieldClass("titre")}
              />
            </div>

            {/* Description */}
            <div className="md:col-span-2">
              <label
                htmlFor="team-description"
                className="block text-sm font-medium mb-1"
              >
                Description
                {isModified("description") && (
                  <span className="ml-2 text-xs text-indigo-400">modifie</span>
                )}
              </label>
              <textarea
                id="team-description"
                name="description"
                rows="4"
                value={teamData.description || ""}
                onChange={handleChange}
                disabled={saving}
                className={fieldClass("description")}
              />
            </div>

            {/* Etat */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Etat (actif)
                {isModified("etat") && (
                  <span className="ml-2 text-xs text-indigo-400">modifie</span>
                )}
              </label>
              <div className="flex items-center space-x-3 mt-1">
                <span className="text-sm text-gray-400">Inactif</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="etat"
                    checked={teamData.etat || false}
                    onChange={handleChange}
                    disabled={saving}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-600 peer-checked:bg-green-500 rounded-full transition-all" />
                  <div className="absolute w-4 h-4 bg-white rounded-full shadow left-1 top-1 transition-transform peer-checked:translate-x-full" />
                </label>
                <span className="text-sm text-gray-400">Actif</span>
              </div>
            </div>
          </div>
        </fieldset>

        {/* Couverture / Logo */}
        <fieldset className="border border-gray-700 p-6 rounded-xl">
          <legend className="text-lg font-semibold px-2 text-indigo-400">
            Logo / Couverture
          </legend>

          <div className="mt-4">
            <div
              className={`relative border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center transition-all duration-200 ${
                newCouverture
                  ? "border-indigo-500 bg-indigo-500/5"
                  : "border-gray-600 bg-gray-800 hover:border-indigo-500"
              }`}
            >
              {preview ? (
                <div className="flex flex-col items-center gap-3">
                  <img
                    src={preview}
                    alt="Couverture de la team"
                    className="max-w-full max-h-48 object-contain rounded-lg"
                  />
                  {newCouverture && (
                    <span className="text-xs text-indigo-400">
                      Nouvelle image selectionnee - sera uploadee a la
                      sauvegarde
                    </span>
                  )}
                  <span className="text-xs text-gray-500">
                    Cliquer pour changer
                  </span>
                </div>
              ) : (
                <>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-10 w-10 text-indigo-400 mb-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 16V4m0 0L3 8m4-4l4 4M21 12v8a2 2 0 01-2 2H5a2 2 0 01-2-2v-8"
                    />
                  </svg>
                  <p className="text-sm text-gray-400 mb-1 text-center">
                    Aucune couverture. Cliquez pour ajouter une image.
                  </p>
                </>
              )}

              <input
                type="file"
                onChange={handleFileChange}
                disabled={saving}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                accept="image/*"
              />
            </div>
          </div>
        </fieldset>

        {/* Section Oeuvres associees */}
        <fieldset className="border border-gray-700 p-6 rounded-xl">
          <legend className="text-lg font-semibold px-2 text-indigo-400">
            <FiBook className="inline mr-2" />
            Oeuvres associees
            {oeuvresModified && (
              <span className="ml-2 text-xs text-indigo-400">modifie</span>
            )}
          </legend>

          {/* Recherche d'oeuvres */}
          <div className="mt-4 mb-4">
            <label className="block text-sm font-medium mb-2">
              Ajouter une oeuvre
            </label>
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher une oeuvre par titre..."
                value={oeuvreSearch}
                onChange={(e) => setOeuvreSearch(e.target.value)}
                disabled={saving}
                className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-600 rounded-lg focus:border-indigo-500 focus:outline-none"
              />
              {searchingOeuvres && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>

            {/* Resultats de recherche */}
            {oeuvreResults.length > 0 && (
              <div className="mt-2 bg-gray-800 border border-gray-600 rounded-lg max-h-60 overflow-y-auto">
                {oeuvreResults.map((oeuvre) => (
                  <button
                    key={oeuvre.documentId}
                    type="button"
                    onClick={() => addOeuvre(oeuvre)}
                    className="w-full flex items-center gap-3 p-3 hover:bg-gray-700 transition-colors text-left border-b border-gray-700 last:border-b-0"
                  >
                    <div className="w-10 h-14 flex-shrink-0 bg-gray-700 rounded overflow-hidden">
                      {oeuvre.couverture?.url ? (
                        <Image
                          src={oeuvre.couverture.url}
                          alt={oeuvre.titre}
                          width={40}
                          height={56}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-500">
                          <FiBook />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{oeuvre.titre}</p>
                      <p className="text-xs text-gray-400 truncate">{oeuvre.type || "Novel"}</p>
                    </div>
                    <FiPlus className="text-indigo-400 flex-shrink-0" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Liste des oeuvres associees */}
          <div className="space-y-2">
            <p className="text-sm text-gray-400">
              {associatedOeuvres.length} oeuvre{associatedOeuvres.length !== 1 ? "s" : ""} associee{associatedOeuvres.length !== 1 ? "s" : ""}
            </p>
            {associatedOeuvres.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FiBook className="mx-auto text-3xl mb-2" />
                <p>Aucune oeuvre associee a cette team</p>
                <p className="text-xs">Utilisez la recherche ci-dessus pour ajouter des oeuvres</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {associatedOeuvres.map((oeuvre) => (
                  <div
                    key={oeuvre.documentId}
                    className="flex items-center gap-3 bg-gray-800 p-3 rounded-lg border border-gray-700"
                  >
                    <div className="w-10 h-14 flex-shrink-0 bg-gray-700 rounded overflow-hidden">
                      {oeuvre.couverture?.url ? (
                        <Image
                          src={oeuvre.couverture.url}
                          alt={oeuvre.titre}
                          width={40}
                          height={56}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-500">
                          <FiBook />
                        </div>
                      )}
                    </div>
                    <p className="flex-1 font-medium truncate text-sm">{oeuvre.titre}</p>
                    <button
                      type="button"
                      onClick={() => removeOeuvre(oeuvre.documentId)}
                      disabled={saving}
                      className="p-1.5 text-red-400 hover:bg-red-400/20 rounded transition-colors"
                      title="Retirer cette oeuvre"
                    >
                      <FiX />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </fieldset>

        {/* Champs dynamiques supplementaires */}
        {extraFields.length > 0 && (
          <fieldset className="border border-gray-700 p-6 rounded-xl">
            <legend className="text-lg font-semibold px-2 text-indigo-400">
              Autres informations
            </legend>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
              {extraFields.map((key) => (
                <div key={key}>
                  <label
                    htmlFor={`team-${key}`}
                    className="block text-sm font-medium mb-1"
                  >
                    {key.charAt(0).toUpperCase() + key.slice(1)}
                    {isModified(key) && (
                      <span className="ml-2 text-xs text-indigo-400">
                        modifie
                      </span>
                    )}
                  </label>
                  {typeof teamData[key] === "boolean" ? (
                    <div className="flex items-center space-x-3 mt-1">
                      <span className="text-sm text-gray-400">Non</span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          name={key}
                          checked={teamData[key] || false}
                          onChange={handleChange}
                          disabled={saving}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-600 peer-checked:bg-green-500 rounded-full transition-all" />
                        <div className="absolute w-4 h-4 bg-white rounded-full shadow left-1 top-1 transition-transform peer-checked:translate-x-full" />
                      </label>
                      <span className="text-sm text-gray-400">Oui</span>
                    </div>
                  ) : (
                    <input
                      type="text"
                      id={`team-${key}`}
                      name={key}
                      value={teamData[key] || ""}
                      onChange={handleChange}
                      disabled={saving}
                      className={fieldClass(key)}
                    />
                  )}
                </div>
              ))}
            </div>
          </fieldset>
        )}

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-bold text-white transition flex items-center justify-center gap-2"
        >
          {saving ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Enregistrement...
            </>
          ) : (
            "Enregistrer les modifications"
          )}
        </button>
      </form>
    </div>
  );
};

export default MoTeams;
