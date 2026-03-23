"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import Image from "next/image";
import { Editor } from "@tinymce/tinymce-react";
import {
  FiEdit3, FiTrash2, FiEye, FiEyeOff, FiCheck, FiAlertCircle,
  FiUpload, FiX, FiSearch, FiPlus, FiChevronDown, FiLoader,
  FiArrowLeft, FiImage, FiTag, FiBook,
} from "react-icons/fi";

const API = process.env.NEXT_PUBLIC_API_URL;

const CATEGORIES = [
  { value: "actualite", label: "Actualité" },
  { value: "guide", label: "Guide" },
  { value: "analyse", label: "Analyse" },
  { value: "interview", label: "Interview" },
  { value: "annonce", label: "Annonce" },
];

function slugify(str) {
  if (!str) return "";
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// ══════════════════════════════════════
// COMPOSANT PRINCIPAL
// ══════════════════════════════════════

const IndexeurArticle = ({ user }) => {
  // ── State: mode ──
  const [mode, setMode] = useState("list"); // "list" | "create" | "edit"
  const [editingArticle, setEditingArticle] = useState(null);

  // ── State: liste ──
  const [articles, setArticles] = useState([]);
  const [loadingList, setLoadingList] = useState(true);

  // ── State: formulaire ──
  const [form, setForm] = useState({
    titre: "",
    slug: "",
    categorie: "actualite",
    extrait: "",
    contenu: "",
    couverture: null,
  });
  const [slugManual, setSlugManual] = useState(false);
  const [preview, setPreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);
  const [messageType, setMessageType] = useState(null);

  // ── State: tags ──
  const [allTags, setAllTags] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [tagSearch, setTagSearch] = useState("");

  // ── State: oeuvres liées ──
  const [oeuvreSearch, setOeuvreSearch] = useState("");
  const [oeuvreResults, setOeuvreResults] = useState([]);
  const [selectedOeuvres, setSelectedOeuvres] = useState([]);
  const [searchingOeuvres, setSearchingOeuvres] = useState(false);
  const oeuvreTimeoutRef = useRef(null);

  const editorRef = useRef(null);

  const jwt = typeof window !== "undefined" ? localStorage.getItem("jwt") : null;
  const headers = { Authorization: `Bearer ${jwt}` };

  // ══════════════════════════════════════
  // CHARGEMENT INITIAL
  // ══════════════════════════════════════

  const loadArticles = useCallback(async () => {
    if (!jwt || !user) return;
    setLoadingList(true);
    try {
      const res = await axios.get(
        `${API}/api/articles?filters[auteur][id][$eq]=${user.id}&populate[0]=couverture&populate[1]=tags&sort=createdAt:desc&pagination[pageSize]=50&status=draft&status=published`,
        { headers }
      );
      setArticles(res.data.data || []);
    } catch (err) {
      console.error("Erreur chargement articles:", err);
    } finally {
      setLoadingList(false);
    }
  }, [jwt, user]);

  useEffect(() => {
    loadArticles();
  }, [loadArticles]);

  // Charger les tags
  useEffect(() => {
    if (!jwt) return;
    async function loadTags() {
      try {
        let tags = [];
        let page = 1;
        let hasMore = true;
        while (hasMore) {
          const res = await axios.get(
            `${API}/api/tags?pagination[page]=${page}&pagination[pageSize]=100`,
            { headers }
          );
          tags = [...tags, ...(res.data.data || [])];
          const pagination = res.data.meta?.pagination;
          hasMore = pagination && page < pagination.pageCount;
          page++;
        }
        setAllTags(tags);
      } catch (err) {
        console.error("Erreur chargement tags:", err);
      }
    }
    loadTags();
  }, [jwt]);

  // ══════════════════════════════════════
  // HANDLERS FORMULAIRE
  // ══════════════════════════════════════

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => {
      const next = { ...prev, [name]: value };
      if (name === "titre" && !slugManual) {
        next.slug = slugify(value);
      }
      return next;
    });
  };

  const handleSlugChange = (e) => {
    setSlugManual(true);
    setForm((prev) => ({ ...prev, slug: slugify(e.target.value) }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setForm((prev) => ({ ...prev, couverture: file }));
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setForm((prev) => ({ ...prev, couverture: null }));
    setPreview(null);
  };

  // ── Tags ──
  const toggleTag = (tag) => {
    setSelectedTags((prev) =>
      prev.find((t) => t.documentId === tag.documentId)
        ? prev.filter((t) => t.documentId !== tag.documentId)
        : [...prev, tag]
    );
  };

  const filteredTags = tagSearch
    ? allTags.filter((t) => t.titre?.toLowerCase().includes(tagSearch.toLowerCase()))
    : allTags;

  // ── Oeuvres recherche ──
  useEffect(() => {
    if (!oeuvreSearch || oeuvreSearch.length < 2) {
      setOeuvreResults([]);
      return;
    }
    if (oeuvreTimeoutRef.current) clearTimeout(oeuvreTimeoutRef.current);
    oeuvreTimeoutRef.current = setTimeout(async () => {
      setSearchingOeuvres(true);
      try {
        const res = await axios.get(
          `${API}/api/oeuvres?filters[titre][$containsi]=${encodeURIComponent(oeuvreSearch)}&fields[0]=titre&fields[1]=documentId&populate[couverture][fields][0]=url&pagination[limit]=10`,
          { headers }
        );
        setOeuvreResults(res.data.data || []);
      } catch (err) {
        console.error("Erreur recherche oeuvres:", err);
      } finally {
        setSearchingOeuvres(false);
      }
    }, 300);
    return () => { if (oeuvreTimeoutRef.current) clearTimeout(oeuvreTimeoutRef.current); };
  }, [oeuvreSearch]);

  const addOeuvre = (oeuvre) => {
    if (!selectedOeuvres.find((o) => o.documentId === oeuvre.documentId)) {
      setSelectedOeuvres((prev) => [...prev, oeuvre]);
    }
    setOeuvreSearch("");
    setOeuvreResults([]);
  };

  const removeOeuvre = (docId) => {
    setSelectedOeuvres((prev) => prev.filter((o) => o.documentId !== docId));
  };

  // ══════════════════════════════════════
  // RESET / EDIT
  // ══════════════════════════════════════

  const resetForm = () => {
    setForm({ titre: "", slug: "", categorie: "actualite", extrait: "", contenu: "", couverture: null });
    setSlugManual(false);
    setPreview(null);
    setSelectedTags([]);
    setSelectedOeuvres([]);
    setMessage(null);
    setMessageType(null);
    setEditingArticle(null);
  };

  const startCreate = () => {
    resetForm();
    setMode("create");
  };

  const startEdit = (article) => {
    setEditingArticle(article);
    setForm({
      titre: article.titre || "",
      slug: article.slug || "",
      categorie: article.categorie || "actualite",
      extrait: article.extrait || "",
      contenu: article.contenu || "",
      couverture: null,
    });
    setSlugManual(true);
    setSelectedTags(article.tags || []);
    setSelectedOeuvres(article.oeuvres_liees || []);

    const coverUrl = article.couverture?.url;
    if (coverUrl) {
      setPreview(coverUrl.startsWith("http") ? coverUrl : `${API}${coverUrl}`);
    } else {
      setPreview(null);
    }

    setMessage(null);
    setMessageType(null);
    setMode("edit");
  };

  const backToList = () => {
    resetForm();
    setMode("list");
    loadArticles();
  };

  // ══════════════════════════════════════
  // SUBMIT
  // ══════════════════════════════════════

  const handleSubmit = async (publish = true) => {
    if (!form.titre.trim()) {
      setMessage("Le titre est obligatoire.");
      setMessageType("error");
      return;
    }
    if (!form.slug.trim()) {
      setMessage("Le slug est obligatoire.");
      setMessageType("error");
      return;
    }

    // Récupérer le contenu depuis TinyMCE
    const contenu = editorRef.current ? editorRef.current.getContent() : form.contenu;

    setSubmitting(true);
    setMessage(null);

    try {
      const payload = {
        data: {
          titre: form.titre.trim(),
          slug: form.slug.trim(),
          categorie: form.categorie,
          extrait: form.extrait.trim() || undefined,
          contenu,
          auteur: user.documentId || user.id,
          tags: selectedTags.map((t) => t.documentId),
          oeuvres_liees: selectedOeuvres.map((o) => o.documentId),
        },
      };

      let articleId;
      let articleDocId;

      if (mode === "edit" && editingArticle) {
        // PUT
        const docId = editingArticle.documentId || editingArticle.id;
        const statusParam = publish ? "published" : "draft";
        const res = await axios.put(`${API}/api/articles/${docId}?status=${statusParam}`, payload, { headers });
        articleId = res.data?.data?.id;
        articleDocId = res.data?.data?.documentId;
        setMessage(publish ? "Article mis à jour et publié !" : "Brouillon sauvegardé !");
      } else {
        // POST
        const statusParam = publish ? "published" : "draft";
        const res = await axios.post(`${API}/api/articles?status=${statusParam}`, payload, { headers });
        articleId = res.data?.data?.id;
        articleDocId = res.data?.data?.documentId;
        setMessage(publish ? "Article créé et publié !" : "Brouillon sauvegardé !");
      }

      setMessageType("success");

      // Upload couverture si nouveau fichier
      if (form.couverture && articleId) {
        const uploadData = new FormData();
        uploadData.append("files", form.couverture);
        uploadData.append("ref", "api::article.article");
        uploadData.append("refId", articleId);
        uploadData.append("field", "couverture");

        try {
          await axios.post(`${API}/api/upload`, uploadData, {
            headers: { Authorization: `Bearer ${jwt}` },
          });
        } catch (err) {
          console.warn("Erreur upload couverture:", err.response?.data || err.message);
          setMessage((prev) => prev + " (Erreur upload image)");
          setMessageType("warning");
        }
      }

      // Retour à la liste après 1.5s
      setTimeout(() => backToList(), 1500);
    } catch (err) {
      console.error("Erreur soumission article:", err);
      const detail = err.response?.data?.error?.message || err.message;
      setMessage(`Erreur : ${detail}`);
      setMessageType("error");
    } finally {
      setSubmitting(false);
    }
  };

  // ══════════════════════════════════════
  // ACTIONS LISTE
  // ══════════════════════════════════════

  const handleTogglePublish = async (article) => {
    const docId = article.documentId || article.id;
    const isPublished = !!article.publishedAt;
    const newStatus = isPublished ? "draft" : "published";
    try {
      await axios.put(
        `${API}/api/articles/${docId}?status=${newStatus}`,
        { data: {} },
        { headers }
      );
      loadArticles();
    } catch (err) {
      console.error("Erreur toggle publish:", err);
    }
  };

  const handleDelete = async (article) => {
    if (!window.confirm(`Supprimer "${article.titre}" définitivement ?`)) return;
    const docId = article.documentId || article.id;
    try {
      await axios.delete(`${API}/api/articles/${docId}`, { headers });
      loadArticles();
    } catch (err) {
      console.error("Erreur suppression:", err);
    }
  };

  // ══════════════════════════════════════
  // RENDU : LISTE
  // ══════════════════════════════════════

  if (mode === "list") {
    return (
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-white">Mes articles</h2>
            <p className="text-sm text-gray-400 mt-1">Créez et gérez vos articles pour la page Actualités.</p>
          </div>
          <button
            onClick={startCreate}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-medium transition-all"
          >
            <FiPlus className="text-base" /> Nouvel article
          </button>
        </div>

        {/* Liste */}
        {loadingList ? (
          <div className="flex justify-center py-16">
            <FiLoader className="text-2xl text-indigo-400 animate-spin" />
          </div>
        ) : articles.length === 0 ? (
          <div className="text-center py-16 bg-gray-800/30 rounded-2xl border border-gray-800">
            <FiEdit3 className="text-4xl text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 mb-2">Aucun article pour le moment.</p>
            <button onClick={startCreate} className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors">
              Créer votre premier article
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {articles.map((art) => {
              const isPublished = !!art.publishedAt;
              const coverUrl = art.couverture?.url
                ? (art.couverture.url.startsWith("http") ? art.couverture.url : `${API}${art.couverture.url}`)
                : null;
              const catLabel = CATEGORIES.find((c) => c.value === art.categorie)?.label || art.categorie;

              return (
                <div
                  key={art.documentId || art.id}
                  className="flex items-center gap-4 p-4 bg-gray-800/50 rounded-xl border border-gray-800 hover:border-gray-700 transition-all"
                >
                  {/* Miniature */}
                  <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-gray-700/50 shrink-0">
                    {coverUrl ? (
                      <Image src={coverUrl} alt={art.titre} fill className="object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <FiImage className="text-gray-600" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-white truncate">{art.titre}</h3>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                      <span className={`px-2 py-0.5 rounded-full border ${isPublished ? "text-green-400 bg-green-500/10 border-green-500/20" : "text-yellow-400 bg-yellow-500/10 border-yellow-500/20"}`}>
                        {isPublished ? "Publié" : "Brouillon"}
                      </span>
                      <span>{catLabel}</span>
                      {art.createdAt && (
                        <span>{new Date(art.createdAt).toLocaleDateString("fr-FR")}</span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => startEdit(art)}
                      className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-all"
                      title="Modifier"
                    >
                      <FiEdit3 className="text-sm" />
                    </button>
                    <button
                      onClick={() => handleTogglePublish(art)}
                      className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-all"
                      title={isPublished ? "Dépublier" : "Publier"}
                    >
                      {isPublished ? <FiEyeOff className="text-sm" /> : <FiEye className="text-sm" />}
                    </button>
                    <button
                      onClick={() => handleDelete(art)}
                      className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                      title="Supprimer"
                    >
                      <FiTrash2 className="text-sm" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // ══════════════════════════════════════
  // RENDU : FORMULAIRE (CREATE / EDIT)
  // ══════════════════════════════════════

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={backToList}
          className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-all"
        >
          <FiArrowLeft />
        </button>
        <h2 className="text-xl font-bold text-white">
          {mode === "edit" ? "Modifier l'article" : "Nouvel article"}
        </h2>
      </div>

      {/* Messages */}
      {message && (
        <div className={`mb-6 flex items-start gap-3 p-4 rounded-xl text-sm font-medium ${
          messageType === "success"
            ? "bg-green-500/10 text-green-400 border border-green-500/20"
            : messageType === "warning"
            ? "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"
            : "bg-red-500/10 text-red-400 border border-red-500/20"
        }`}>
          {messageType === "success" ? <FiCheck className="mt-0.5 shrink-0" /> : <FiAlertCircle className="mt-0.5 shrink-0" />}
          <span>{message}</span>
        </div>
      )}

      <div className="space-y-6">
        {/* ── Titre ── */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Titre <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            name="titre"
            value={form.titre}
            onChange={handleChange}
            placeholder="Le titre de votre article"
            maxLength={255}
            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
          />
        </div>

        {/* ── Slug ── */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Slug <span className="text-red-400">*</span>
            <span className="text-xs text-gray-500 ml-2">(URL de l&apos;article)</span>
          </label>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500 shrink-0">/actualites/</span>
            <input
              type="text"
              value={form.slug}
              onChange={handleSlugChange}
              placeholder="mon-article"
              className="flex-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
            />
          </div>
        </div>

        {/* ── Catégorie ── */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Catégorie</label>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                type="button"
                onClick={() => setForm((prev) => ({ ...prev, categorie: cat.value }))}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  form.categorie === cat.value
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Extrait ── */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Extrait
            <span className="text-xs text-gray-500 ml-2">(affiché sur la page Actualités et pour le SEO)</span>
          </label>
          <textarea
            name="extrait"
            value={form.extrait}
            onChange={handleChange}
            rows={3}
            maxLength={300}
            placeholder="Un résumé court de votre article..."
            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all resize-none"
          />
          <p className="text-xs text-gray-600 mt-1 text-right">{form.extrait.length}/300</p>
        </div>

        {/* ── Couverture ── */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Image de couverture
          </label>
          {preview ? (
            <div className="relative w-full h-48 rounded-xl overflow-hidden border border-gray-700">
              <Image src={preview} alt="Aperçu couverture" fill className="object-cover" />
              <button
                type="button"
                onClick={removeImage}
                className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-red-600 text-white rounded-lg transition-all"
              >
                <FiX className="text-sm" />
              </button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-gray-700 rounded-xl cursor-pointer hover:border-indigo-500 transition-all bg-gray-800/30">
              <FiUpload className="text-2xl text-gray-500 mb-2" />
              <span className="text-sm text-gray-500">Cliquez pour ajouter une image</span>
              <span className="text-xs text-gray-600 mt-1">JPG, PNG ou WebP — max 5 Mo</span>
              <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
            </label>
          )}
        </div>

        {/* ── Contenu (TinyMCE) ── */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Contenu <span className="text-red-400">*</span>
          </label>
          <div className="rounded-xl overflow-hidden border border-gray-700">
            <Editor
              onInit={(evt, editor) => (editorRef.current = editor)}
              initialValue={form.contenu}
              tinymceScriptSrc="/tinymce/tinymce.min.js"
              init={{
                height: 450,
                menubar: true,
                skin: "oxide-dark",
                content_css: "dark",
                plugins: [
                  "advlist", "autolink", "lists", "link", "image", "charmap",
                  "anchor", "searchreplace", "visualblocks", "code",
                  "insertdatetime", "media", "table", "help", "wordcount",
                ],
                toolbar:
                  "undo redo | blocks | bold italic forecolor | " +
                  "alignleft aligncenter alignright alignjustify | " +
                  "bullist numlist outdent indent | link image | removeformat | help",
                content_style: "body { font-family: system-ui, sans-serif; font-size: 15px; color: #d1d5db; background: #1f2937; }",
                placeholder: "Rédigez votre article ici...",
                branding: false,
                promotion: false,
                license_key: "gpl",
              }}
            />
          </div>
        </div>

        {/* ── Tags ── */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            <FiTag className="inline mr-1.5" />Tags
          </label>

          {/* Tags sélectionnés */}
          {selectedTags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {selectedTags.map((tag) => (
                <span
                  key={tag.documentId}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-500/15 text-indigo-300 border border-indigo-500/25 rounded-full text-xs font-medium"
                >
                  {tag.titre}
                  <button type="button" onClick={() => toggleTag(tag)} className="hover:text-white transition-colors">
                    <FiX className="text-[10px]" />
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Recherche tags */}
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm" />
            <input
              type="text"
              value={tagSearch}
              onChange={(e) => setTagSearch(e.target.value)}
              placeholder="Rechercher un tag..."
              className="w-full pl-9 pr-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-sm text-white placeholder-gray-500 focus:border-indigo-500 outline-none transition-all"
            />
          </div>

          {/* Tags disponibles */}
          {(tagSearch || selectedTags.length === 0) && (
            <div className="flex flex-wrap gap-1.5 mt-3 max-h-32 overflow-y-auto">
              {filteredTags.slice(0, 30).map((tag) => {
                const isSelected = selectedTags.some((t) => t.documentId === tag.documentId);
                return (
                  <button
                    key={tag.documentId}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                      isSelected
                        ? "bg-indigo-600 text-white"
                        : "bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700"
                    }`}
                  >
                    {tag.titre}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Oeuvres liées ── */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            <FiBook className="inline mr-1.5" />Oeuvres liées
          </label>

          {/* Oeuvres sélectionnées */}
          {selectedOeuvres.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {selectedOeuvres.map((o) => (
                <span
                  key={o.documentId}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-500/15 text-purple-300 border border-purple-500/25 rounded-full text-xs font-medium"
                >
                  {o.titre}
                  <button type="button" onClick={() => removeOeuvre(o.documentId)} className="hover:text-white transition-colors">
                    <FiX className="text-[10px]" />
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Recherche oeuvres */}
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm" />
            <input
              type="text"
              value={oeuvreSearch}
              onChange={(e) => setOeuvreSearch(e.target.value)}
              placeholder="Rechercher une oeuvre..."
              className="w-full pl-9 pr-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-sm text-white placeholder-gray-500 focus:border-indigo-500 outline-none transition-all"
            />
            {searchingOeuvres && (
              <FiLoader className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 animate-spin" />
            )}
          </div>

          {/* Résultats */}
          {oeuvreResults.length > 0 && (
            <div className="mt-2 bg-gray-800 border border-gray-700 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
              {oeuvreResults.map((o) => {
                const already = selectedOeuvres.some((s) => s.documentId === o.documentId);
                return (
                  <button
                    key={o.documentId}
                    type="button"
                    onClick={() => !already && addOeuvre(o)}
                    disabled={already}
                    className={`w-full text-left px-4 py-2.5 text-sm transition-all ${
                      already
                        ? "text-gray-600 cursor-not-allowed"
                        : "text-gray-300 hover:bg-gray-700 hover:text-white"
                    }`}
                  >
                    {o.titre}
                    {already && <span className="text-xs text-gray-600 ml-2">(déjà ajoutée)</span>}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Boutons soumission ── */}
        <div className="flex items-center gap-3 pt-4 border-t border-gray-800">
          <button
            type="button"
            onClick={() => handleSubmit(false)}
            disabled={submitting}
            className="flex items-center gap-2 px-5 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl text-sm font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {submitting ? <FiLoader className="animate-spin" /> : <FiEyeOff />}
            Sauvegarder en brouillon
          </button>
          <button
            type="button"
            onClick={() => handleSubmit(true)}
            disabled={submitting}
            className="flex items-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {submitting ? <FiLoader className="animate-spin" /> : <FiCheck />}
            {mode === "edit" ? "Mettre à jour" : "Publier"}
          </button>
          <button
            type="button"
            onClick={backToList}
            className="ml-auto text-sm text-gray-500 hover:text-white transition-colors"
          >
            Annuler
          </button>
        </div>
      </div>
    </div>
  );
};

export default IndexeurArticle;
