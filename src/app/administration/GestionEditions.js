"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import { 
  FiBookOpen, 
  FiShoppingCart, 
  FiLock, 
  FiPlus, 
  FiTrash2, 
  FiEdit2, 
  FiSearch, 
  FiCheck, 
  FiX,
  FiExternalLink,
  FiLink,
  FiAlertTriangle
} from "react-icons/fi";

const API_URL = "https://novel-index-strapi.onrender.com";

const GestionEditions = () => {
  const [activeTab, setActiveTab] = useState("editions");
  const [message, setMessage] = useState(null);
  const [messageType, setMessageType] = useState("info"); // info, success, error

  // États pour les éditions
  const [editions, setEditions] = useState([]);
  const [loadingEditions, setLoadingEditions] = useState(false);
  const [editionForm, setEditionForm] = useState({ titre: "", description: "", url: "", logo: null });
  const [editingEdition, setEditingEdition] = useState(null);

  // États pour les liens d'achat
  const [achatlivres, setAchatlivres] = useState([]);
  const [loadingAchats, setLoadingAchats] = useState(false);
  const [achatForm, setAchatForm] = useState({ titre: "", url: "", order: 1, oeuvres: [], editions: [] });
  const [editingAchat, setEditingAchat] = useState(null);

  // États pour le blocage licence
  const [searchTeamOeuvre, setSearchTeamOeuvre] = useState("");
  const [searchLicenceOeuvre, setSearchLicenceOeuvre] = useState("");
  const [teamOeuvreResults, setTeamOeuvreResults] = useState([]);
  const [licenceOeuvreResults, setLicenceOeuvreResults] = useState([]);
  const [selectedTeamOeuvre, setSelectedTeamOeuvre] = useState(null);
  const [selectedLicenceOeuvre, setSelectedLicenceOeuvre] = useState(null);
  const [oeuvresLicenciees, setOeuvresLicenciees] = useState([]);
  const [loadingLicence, setLoadingLicence] = useState(false);

  // Recherche commune pour oeuvres/editions
  const [searchOeuvreGeneral, setSearchOeuvreGeneral] = useState("");
  const [oeuvreGeneralResults, setOeuvreGeneralResults] = useState([]);
  const [searchEditionGeneral, setSearchEditionGeneral] = useState("");
  const [editionGeneralResults, setEditionGeneralResults] = useState([]);

  const showMessage = (msg, type = "info") => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => setMessage(null), 5000);
  };

  const getJwt = () => localStorage.getItem("jwt");

  // ========== ÉDITIONS ==========
  const fetchEditions = async () => {
    setLoadingEditions(true);
    try {
      const res = await axios.get(`${API_URL}/api/editions?populate=*&sort=titre:asc`, {
        headers: { Authorization: `Bearer ${getJwt()}` }
      });
      setEditions(res.data.data || []);
    } catch (error) {
      console.error("Erreur fetch editions:", error);
    } finally {
      setLoadingEditions(false);
    }
  };

  const handleSubmitEdition = async (e) => {
    e.preventDefault();
    try {
      const jwt = getJwt();
      if (!jwt) return showMessage("Vous devez être connecté", "error");

      const payload = {
        data: {
          titre: editionForm.titre,
          description: editionForm.description,
          url: editionForm.url,
        }
      };

      let response;
      if (editingEdition) {
        response = await axios.put(`${API_URL}/api/editions/${editingEdition.documentId}`, payload, {
          headers: { Authorization: `Bearer ${jwt}`, "Content-Type": "application/json" }
        });
        showMessage("Édition mise à jour avec succès", "success");
      } else {
        response = await axios.post(`${API_URL}/api/editions`, payload, {
          headers: { Authorization: `Bearer ${jwt}`, "Content-Type": "application/json" }
        });
        
        // Upload logo si présent
        if (editionForm.logo && response.data?.data?.id) {
          const uploadData = new FormData();
          uploadData.append("files", editionForm.logo);
          uploadData.append("ref", "api::edition.edition");
          uploadData.append("refId", response.data.data.id);
          uploadData.append("field", "logo");
          await axios.post(`${API_URL}/api/upload`, uploadData, {
            headers: { Authorization: `Bearer ${jwt}` }
          });
        }
        showMessage("Édition créée avec succès", "success");
      }

      setEditionForm({ titre: "", description: "", url: "", logo: null });
      setEditingEdition(null);
      fetchEditions();
    } catch (error) {
      console.error("Erreur:", error);
      showMessage("Erreur lors de l'opération", "error");
    }
  };

  const handleDeleteEdition = async (documentId) => {
    if (!confirm("Supprimer cette édition ?")) return;
    try {
      await axios.delete(`${API_URL}/api/editions/${documentId}`, {
        headers: { Authorization: `Bearer ${getJwt()}` }
      });
      showMessage("Édition supprimée", "success");
      fetchEditions();
    } catch (error) {
      showMessage("Erreur lors de la suppression", "error");
    }
  };

  // ========== LIENS D'ACHAT ==========
  const fetchAchatlivres = async () => {
    setLoadingAchats(true);
    try {
      const res = await axios.get(`${API_URL}/api/achatlivres?populate=*&sort=order:asc`, {
        headers: { Authorization: `Bearer ${getJwt()}` }
      });
      setAchatlivres(res.data.data || []);
    } catch (error) {
      console.error("Erreur fetch achatlivres:", error);
    } finally {
      setLoadingAchats(false);
    }
  };

  const searchOeuvres = async (term, setter) => {
    if (!term.trim()) return;
    try {
      const res = await axios.get(`${API_URL}/api/oeuvres?filters[titre][$containsi]=${term}&pagination[pageSize]=10`, {
        headers: { Authorization: `Bearer ${getJwt()}` }
      });
      setter(res.data.data || []);
    } catch (error) {
      console.error("Erreur recherche:", error);
    }
  };

  const searchEditionsApi = async (term) => {
    if (!term.trim()) return;
    try {
      const res = await axios.get(`${API_URL}/api/editions?filters[titre][$containsi]=${term}&pagination[pageSize]=10`, {
        headers: { Authorization: `Bearer ${getJwt()}` }
      });
      setEditionGeneralResults(res.data.data || []);
    } catch (error) {
      console.error("Erreur recherche editions:", error);
    }
  };

  const handleSubmitAchat = async (e) => {
    e.preventDefault();
    try {
      const jwt = getJwt();
      if (!jwt) return showMessage("Vous devez être connecté", "error");

      const payload = {
        data: {
          titre: achatForm.titre,
          url: achatForm.url,
          order: parseInt(achatForm.order) || 1,
          oeuvres: achatForm.oeuvres.map(o => o.documentId),
          editions: achatForm.editions.map(e => e.documentId),
        }
      };

      if (editingAchat) {
        await axios.put(`${API_URL}/api/achatlivres/${editingAchat.documentId}`, payload, {
          headers: { Authorization: `Bearer ${jwt}`, "Content-Type": "application/json" }
        });
        showMessage("Lien d'achat mis à jour", "success");
      } else {
        await axios.post(`${API_URL}/api/achatlivres`, payload, {
          headers: { Authorization: `Bearer ${jwt}`, "Content-Type": "application/json" }
        });
        showMessage("Lien d'achat créé", "success");
      }

      setAchatForm({ titre: "", url: "", order: 1, oeuvres: [], editions: [] });
      setEditingAchat(null);
      fetchAchatlivres();
    } catch (error) {
      console.error("Erreur:", error);
      showMessage("Erreur lors de l'opération", "error");
    }
  };

  const handleDeleteAchat = async (documentId) => {
    if (!confirm("Supprimer ce lien d'achat ?")) return;
    try {
      await axios.delete(`${API_URL}/api/achatlivres/${documentId}`, {
        headers: { Authorization: `Bearer ${getJwt()}` }
      });
      showMessage("Lien supprimé", "success");
      fetchAchatlivres();
    } catch (error) {
      showMessage("Erreur lors de la suppression", "error");
    }
  };

  // ========== BLOCAGE LICENCE ==========
  const fetchOeuvresLicenciees = async () => {
    setLoadingLicence(true);
    try {
      const res = await axios.get(`${API_URL}/api/oeuvres?filters[licence][$eq]=true&populate=oeuvre_licence&pagination[pageSize]=100`, {
        headers: { Authorization: `Bearer ${getJwt()}` }
      });
      setOeuvresLicenciees(res.data.data || []);
    } catch (error) {
      console.error("Erreur fetch oeuvres licenciées:", error);
    } finally {
      setLoadingLicence(false);
    }
  };

  const searchTeamOeuvres = async () => {
    if (!searchTeamOeuvre.trim()) return;
    try {
      const res = await axios.get(`${API_URL}/api/oeuvres?filters[titre][$containsi]=${searchTeamOeuvre}&filters[licence][$ne]=true&pagination[pageSize]=10`, {
        headers: { Authorization: `Bearer ${getJwt()}` }
      });
      setTeamOeuvreResults(res.data.data || []);
    } catch (error) {
      console.error("Erreur recherche team:", error);
    }
  };

  const searchLicenceOeuvres = async () => {
    if (!searchLicenceOeuvre.trim()) return;
    try {
      const res = await axios.get(`${API_URL}/api/oeuvres?filters[titre][$containsi]=${searchLicenceOeuvre}&pagination[pageSize]=10`, {
        headers: { Authorization: `Bearer ${getJwt()}` }
      });
      setLicenceOeuvreResults(res.data.data || []);
    } catch (error) {
      console.error("Erreur recherche licence:", error);
    }
  };

  const handleBloquerOeuvre = async () => {
    if (!selectedTeamOeuvre) {
      return showMessage("Sélectionnez une œuvre à bloquer", "error");
    }

    try {
      const jwt = getJwt();
      const payload = {
        data: {
          licence: true,
          // oeuvre_licence sera ajouté quand le champ existera dans Strapi
          ...(selectedLicenceOeuvre && { oeuvre_licence: selectedLicenceOeuvre.documentId })
        }
      };

      await axios.put(`${API_URL}/api/oeuvres/${selectedTeamOeuvre.documentId}`, payload, {
        headers: { Authorization: `Bearer ${jwt}`, "Content-Type": "application/json" }
      });

      showMessage(`"${selectedTeamOeuvre.titre}" est maintenant sous licence`, "success");
      setSelectedTeamOeuvre(null);
      setSelectedLicenceOeuvre(null);
      setTeamOeuvreResults([]);
      setLicenceOeuvreResults([]);
      setSearchTeamOeuvre("");
      setSearchLicenceOeuvre("");
      fetchOeuvresLicenciees();
    } catch (error) {
      console.error("Erreur blocage:", error);
      showMessage("Erreur lors du blocage", "error");
    }
  };

  const handleDebloquerOeuvre = async (oeuvre) => {
    if (!confirm(`Débloquer "${oeuvre.titre}" ?`)) return;
    try {
      const jwt = getJwt();
      await axios.put(`${API_URL}/api/oeuvres/${oeuvre.documentId}`, {
        data: { licence: false, oeuvre_licence: null }
      }, {
        headers: { Authorization: `Bearer ${jwt}`, "Content-Type": "application/json" }
      });
      showMessage(`"${oeuvre.titre}" débloquée`, "success");
      fetchOeuvresLicenciees();
    } catch (error) {
      showMessage("Erreur lors du déblocage", "error");
    }
  };

  // Chargement initial
  useEffect(() => {
    if (activeTab === "editions") fetchEditions();
    if (activeTab === "achats") fetchAchatlivres();
    if (activeTab === "licence") fetchOeuvresLicenciees();
  }, [activeTab]);

  const tabs = [
    { id: "editions", label: "Maisons d'édition", icon: <FiBookOpen /> },
    { id: "achats", label: "Liens d'achat", icon: <FiShoppingCart /> },
    { id: "licence", label: "Blocage licence", icon: <FiLock /> },
  ];

  return (
    <div className="w-full max-w-5xl mx-auto bg-gray-800 rounded-xl shadow-lg text-white">
      {/* Message */}
      {message && (
        <div className={`p-4 text-center font-medium ${
          messageType === "success" ? "bg-green-600" : 
          messageType === "error" ? "bg-red-600" : "bg-blue-600"
        }`}>
          {message}
        </div>
      )}

      {/* Onglets */}
      <div className="flex border-b border-gray-700">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-2 py-4 px-6 font-medium transition-colors ${
              activeTab === tab.id 
                ? "bg-indigo-600 text-white" 
                : "text-gray-400 hover:text-white hover:bg-gray-700"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      <div className="p-6">
        {/* ========== ONGLET ÉDITIONS ========== */}
        {activeTab === "editions" && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <FiBookOpen /> {editingEdition ? "Modifier l'édition" : "Ajouter une maison d'édition"}
            </h2>

            <form onSubmit={handleSubmitEdition} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Titre *</label>
                <input
                  type="text"
                  value={editionForm.titre}
                  onChange={(e) => setEditionForm({...editionForm, titre: e.target.value})}
                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">URL du site</label>
                <input
                  type="url"
                  value={editionForm.url}
                  onChange={(e) => setEditionForm({...editionForm, url: e.target.value})}
                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg"
                  placeholder="https://"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={editionForm.description}
                  onChange={(e) => setEditionForm({...editionForm, description: e.target.value})}
                  rows={3}
                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg"
                />
              </div>
              {!editingEdition && (
                <div>
                  <label className="block text-sm font-medium mb-1">Logo</label>
                  <input
                    type="file"
                    onChange={(e) => setEditionForm({...editionForm, logo: e.target.files[0]})}
                    className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-400"
                    accept="image/*"
                  />
                </div>
              )}
              <div className="md:col-span-2 flex gap-2">
                <button type="submit" className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-lg font-bold flex items-center justify-center gap-2">
                  {editingEdition ? <><FiCheck /> Mettre à jour</> : <><FiPlus /> Ajouter</>}
                </button>
                {editingEdition && (
                  <button type="button" onClick={() => { setEditingEdition(null); setEditionForm({ titre: "", description: "", url: "", logo: null }); }} className="px-6 py-3 bg-gray-600 hover:bg-gray-500 rounded-lg">
                    Annuler
                  </button>
                )}
              </div>
            </form>

            {/* Liste des éditions */}
            <div className="mt-8">
              <h3 className="text-lg font-semibold mb-4">Éditions existantes ({editions.length})</h3>
              {loadingEditions ? (
                <p className="text-gray-400">Chargement...</p>
              ) : editions.length === 0 ? (
                <p className="text-gray-400">Aucune édition enregistrée</p>
              ) : (
                <div className="space-y-2">
                  {editions.map(edition => (
                    <div key={edition.documentId} className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium">{edition.titre}</p>
                        {edition.url && (
                          <a href={edition.url} target="_blank" rel="noopener noreferrer" className="text-sm text-indigo-400 hover:underline flex items-center gap-1">
                            <FiExternalLink className="text-xs" /> {edition.url}
                          </a>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => { setEditingEdition(edition); setEditionForm({ titre: edition.titre, description: edition.description || "", url: edition.url || "", logo: null }); }}
                          className="p-2 bg-blue-600 hover:bg-blue-700 rounded"
                        >
                          <FiEdit2 />
                        </button>
                        <button onClick={() => handleDeleteEdition(edition.documentId)} className="p-2 bg-red-600 hover:bg-red-700 rounded">
                          <FiTrash2 />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========== ONGLET LIENS D'ACHAT ========== */}
        {activeTab === "achats" && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <FiShoppingCart /> {editingAchat ? "Modifier le lien" : "Ajouter un lien d'achat"}
            </h2>

            <form onSubmit={handleSubmitAchat} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Titre * (ex: Amazon, Fnac)</label>
                  <input
                    type="text"
                    value={achatForm.titre}
                    onChange={(e) => setAchatForm({...achatForm, titre: e.target.value})}
                    className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">URL</label>
                  <input
                    type="url"
                    value={achatForm.url}
                    onChange={(e) => setAchatForm({...achatForm, url: e.target.value})}
                    className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg"
                    placeholder="https://"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Ordre d'affichage</label>
                  <input
                    type="number"
                    value={achatForm.order}
                    onChange={(e) => setAchatForm({...achatForm, order: e.target.value})}
                    className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg"
                    min="1"
                  />
                </div>
              </div>

              {/* Recherche œuvres */}
              <div>
                <label className="block text-sm font-medium mb-1">Lier à des œuvres</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={searchOeuvreGeneral}
                    onChange={(e) => setSearchOeuvreGeneral(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), searchOeuvres(searchOeuvreGeneral, setOeuvreGeneralResults))}
                    className="flex-1 p-3 bg-gray-700 border border-gray-600 rounded-lg"
                    placeholder="Rechercher une œuvre..."
                  />
                  <button type="button" onClick={() => searchOeuvres(searchOeuvreGeneral, setOeuvreGeneralResults)} className="px-4 bg-indigo-600 hover:bg-indigo-700 rounded-lg">
                    <FiSearch />
                  </button>
                </div>
                {oeuvreGeneralResults.length > 0 && (
                  <div className="mt-2 max-h-40 overflow-y-auto bg-gray-700 rounded-lg">
                    {oeuvreGeneralResults.map(o => (
                      <button
                        key={o.documentId}
                        type="button"
                        onClick={() => {
                          if (!achatForm.oeuvres.find(x => x.documentId === o.documentId)) {
                            setAchatForm({...achatForm, oeuvres: [...achatForm.oeuvres, o]});
                          }
                          setOeuvreGeneralResults([]);
                          setSearchOeuvreGeneral("");
                        }}
                        className="w-full p-2 text-left hover:bg-gray-600 flex justify-between"
                      >
                        <span>{o.titre}</span>
                        <FiPlus className="text-green-400" />
                      </button>
                    ))}
                  </div>
                )}
                {achatForm.oeuvres.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {achatForm.oeuvres.map(o => (
                      <span key={o.documentId} className="px-3 py-1 bg-indigo-600 rounded-full text-sm flex items-center gap-2">
                        {o.titre}
                        <button type="button" onClick={() => setAchatForm({...achatForm, oeuvres: achatForm.oeuvres.filter(x => x.documentId !== o.documentId)})}>
                          <FiX />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Recherche éditions */}
              <div>
                <label className="block text-sm font-medium mb-1">Lier à des éditions</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={searchEditionGeneral}
                    onChange={(e) => setSearchEditionGeneral(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), searchEditionsApi(searchEditionGeneral))}
                    className="flex-1 p-3 bg-gray-700 border border-gray-600 rounded-lg"
                    placeholder="Rechercher une édition..."
                  />
                  <button type="button" onClick={() => searchEditionsApi(searchEditionGeneral)} className="px-4 bg-indigo-600 hover:bg-indigo-700 rounded-lg">
                    <FiSearch />
                  </button>
                </div>
                {editionGeneralResults.length > 0 && (
                  <div className="mt-2 max-h-40 overflow-y-auto bg-gray-700 rounded-lg">
                    {editionGeneralResults.map(e => (
                      <button
                        key={e.documentId}
                        type="button"
                        onClick={() => {
                          if (!achatForm.editions.find(x => x.documentId === e.documentId)) {
                            setAchatForm({...achatForm, editions: [...achatForm.editions, e]});
                          }
                          setEditionGeneralResults([]);
                          setSearchEditionGeneral("");
                        }}
                        className="w-full p-2 text-left hover:bg-gray-600 flex justify-between"
                      >
                        <span>{e.titre}</span>
                        <FiPlus className="text-green-400" />
                      </button>
                    ))}
                  </div>
                )}
                {achatForm.editions.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {achatForm.editions.map(e => (
                      <span key={e.documentId} className="px-3 py-1 bg-green-600 rounded-full text-sm flex items-center gap-2">
                        {e.titre}
                        <button type="button" onClick={() => setAchatForm({...achatForm, editions: achatForm.editions.filter(x => x.documentId !== e.documentId)})}>
                          <FiX />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <button type="submit" className="flex-1 py-3 bg-green-600 hover:bg-green-700 rounded-lg font-bold flex items-center justify-center gap-2">
                  {editingAchat ? <><FiCheck /> Mettre à jour</> : <><FiPlus /> Ajouter</>}
                </button>
                {editingAchat && (
                  <button type="button" onClick={() => { setEditingAchat(null); setAchatForm({ titre: "", url: "", order: 1, oeuvres: [], editions: [] }); }} className="px-6 py-3 bg-gray-600 hover:bg-gray-500 rounded-lg">
                    Annuler
                  </button>
                )}
              </div>
            </form>

            {/* Liste des liens */}
            <div className="mt-8">
              <h3 className="text-lg font-semibold mb-4">Liens d'achat existants ({achatlivres.length})</h3>
              {loadingAchats ? (
                <p className="text-gray-400">Chargement...</p>
              ) : achatlivres.length === 0 ? (
                <p className="text-gray-400">Aucun lien d'achat enregistré</p>
              ) : (
                <div className="space-y-2">
                  {achatlivres.map(achat => (
                    <div key={achat.documentId} className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium">{achat.titre} <span className="text-gray-400 text-sm">(ordre: {achat.order})</span></p>
                        {achat.url && (
                          <a href={achat.url} target="_blank" rel="noopener noreferrer" className="text-sm text-green-400 hover:underline">{achat.url}</a>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => { 
                            setEditingAchat(achat); 
                            setAchatForm({ 
                              titre: achat.titre, 
                              url: achat.url || "", 
                              order: achat.order || 1, 
                              oeuvres: achat.oeuvres || [], 
                              editions: achat.editions || [] 
                            }); 
                          }}
                          className="p-2 bg-blue-600 hover:bg-blue-700 rounded"
                        >
                          <FiEdit2 />
                        </button>
                        <button onClick={() => handleDeleteAchat(achat.documentId)} className="p-2 bg-red-600 hover:bg-red-700 rounded">
                          <FiTrash2 />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========== ONGLET BLOCAGE LICENCE ========== */}
        {activeTab === "licence" && (
          <div className="space-y-6">
            <div className="bg-yellow-600/20 border border-yellow-600 rounded-lg p-4 flex items-start gap-3">
              <FiAlertTriangle className="text-yellow-500 text-xl flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-yellow-500">Attention</p>
                <p className="text-sm text-gray-300">Le blocage d'une œuvre masque ses chapitres et affiche un message "Œuvre sous licence". Assurez-vous que c'est intentionnel.</p>
              </div>
            </div>

            <h2 className="text-xl font-bold flex items-center gap-2">
              <FiLock /> Bloquer une œuvre (licence)
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Colonne gauche : œuvre à bloquer */}
              <div className="space-y-4">
                <h3 className="font-semibold text-indigo-400">1. Œuvre à bloquer (version team)</h3>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={searchTeamOeuvre}
                    onChange={(e) => setSearchTeamOeuvre(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && searchTeamOeuvres()}
                    className="flex-1 p-3 bg-gray-700 border border-gray-600 rounded-lg"
                    placeholder="Rechercher une œuvre non licenciée..."
                  />
                  <button onClick={searchTeamOeuvres} className="px-4 bg-indigo-600 hover:bg-indigo-700 rounded-lg">
                    <FiSearch />
                  </button>
                </div>
                {teamOeuvreResults.length > 0 && (
                  <div className="max-h-48 overflow-y-auto bg-gray-700 rounded-lg">
                    {teamOeuvreResults.map(o => (
                      <button
                        key={o.documentId}
                        onClick={() => { setSelectedTeamOeuvre(o); setTeamOeuvreResults([]); }}
                        className={`w-full p-3 text-left hover:bg-gray-600 border-b border-gray-600 last:border-0 ${selectedTeamOeuvre?.documentId === o.documentId ? 'bg-indigo-600' : ''}`}
                      >
                        {o.titre}
                      </button>
                    ))}
                  </div>
                )}
                {selectedTeamOeuvre && (
                  <div className="p-4 bg-indigo-600/30 border border-indigo-500 rounded-lg">
                    <p className="font-medium">Sélectionné : {selectedTeamOeuvre.titre}</p>
                    <button onClick={() => setSelectedTeamOeuvre(null)} className="text-sm text-red-400 hover:underline mt-1">Retirer</button>
                  </div>
                )}
              </div>

              {/* Colonne droite : œuvre de redirection */}
              <div className="space-y-4">
                <h3 className="font-semibold text-green-400">2. Œuvre de redirection (optionnel)</h3>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={searchLicenceOeuvre}
                    onChange={(e) => setSearchLicenceOeuvre(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && searchLicenceOeuvres()}
                    className="flex-1 p-3 bg-gray-700 border border-gray-600 rounded-lg"
                    placeholder="Rechercher l'œuvre officielle..."
                  />
                  <button onClick={searchLicenceOeuvres} className="px-4 bg-green-600 hover:bg-green-700 rounded-lg">
                    <FiSearch />
                  </button>
                </div>
                {licenceOeuvreResults.length > 0 && (
                  <div className="max-h-48 overflow-y-auto bg-gray-700 rounded-lg">
                    {licenceOeuvreResults.map(o => (
                      <button
                        key={o.documentId}
                        onClick={() => { setSelectedLicenceOeuvre(o); setLicenceOeuvreResults([]); }}
                        className={`w-full p-3 text-left hover:bg-gray-600 border-b border-gray-600 last:border-0 ${selectedLicenceOeuvre?.documentId === o.documentId ? 'bg-green-600' : ''}`}
                      >
                        {o.titre}
                      </button>
                    ))}
                  </div>
                )}
                {selectedLicenceOeuvre && (
                  <div className="p-4 bg-green-600/30 border border-green-500 rounded-lg">
                    <p className="font-medium">Redirection vers : {selectedLicenceOeuvre.titre}</p>
                    <button onClick={() => setSelectedLicenceOeuvre(null)} className="text-sm text-red-400 hover:underline mt-1">Retirer</button>
                  </div>
                )}
              </div>
            </div>

            {/* Bouton de blocage */}
            <button
              onClick={handleBloquerOeuvre}
              disabled={!selectedTeamOeuvre}
              className={`w-full py-4 rounded-lg font-bold flex items-center justify-center gap-2 ${
                selectedTeamOeuvre 
                  ? 'bg-red-600 hover:bg-red-700' 
                  : 'bg-gray-600 cursor-not-allowed'
              }`}
            >
              <FiLock />
              {selectedTeamOeuvre && selectedLicenceOeuvre 
                ? `Bloquer "${selectedTeamOeuvre.titre}" → Rediriger vers "${selectedLicenceOeuvre.titre}"`
                : selectedTeamOeuvre 
                  ? `Bloquer "${selectedTeamOeuvre.titre}" (sans redirection)`
                  : "Sélectionnez une œuvre à bloquer"
              }
            </button>

            {/* Liste des œuvres bloquées */}
            <div className="mt-8">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <FiLock className="text-red-500" />
                Œuvres actuellement bloquées ({oeuvresLicenciees.length})
              </h3>
              {loadingLicence ? (
                <p className="text-gray-400">Chargement...</p>
              ) : oeuvresLicenciees.length === 0 ? (
                <p className="text-gray-400">Aucune œuvre bloquée</p>
              ) : (
                <div className="space-y-2">
                  {oeuvresLicenciees.map(oeuvre => (
                    <div key={oeuvre.documentId} className="flex items-center justify-between p-4 bg-red-900/30 border border-red-800 rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium">{oeuvre.titre}</p>
                        {oeuvre.oeuvre_licence && (
                          <p className="text-sm text-green-400 flex items-center gap-1">
                            <FiLink /> Redirige vers : {oeuvre.oeuvre_licence.titre}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => handleDebloquerOeuvre(oeuvre)}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg flex items-center gap-2"
                      >
                        <FiCheck /> Débloquer
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GestionEditions;
