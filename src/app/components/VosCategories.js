"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import AjouterOeuvresPopup from "./AjouterOeuvresPopup";
import Image from "next/image";
import { slugify } from "@/utils/slugify";
import {
  Plus,
  Check,
  Trash2,
  MoreHorizontal,
  BookOpen,
  FolderPlus,
  Bell,
  CheckCircle,
  Clock,
  X as XIcon,
} from "lucide-react";

const SkeletonCategory = () => (
  <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-5 animate-pulse space-y-4">
    <div className="flex items-center justify-between">
      <div className="h-6 w-32 bg-gray-700/50 rounded" />
      <div className="h-8 w-8 bg-gray-700/50 rounded" />
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="bg-gray-700/30 rounded-lg overflow-hidden">
          <div className="w-full h-40 bg-gray-700/50" />
          <div className="p-3 space-y-2">
            <div className="h-4 w-3/4 bg-gray-700/50 rounded" />
            <div className="h-3 w-1/2 bg-gray-700/50 rounded" />
          </div>
        </div>
      ))}
    </div>
  </div>
);

const VosCategories = ({ user }) => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [newCatColor, setNewCatColor] = useState("#4f46e5");
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const router = useRouter();
  const [openMenuId, setOpenMenuId] = useState(null);
  const menuRef = useRef(null);

  // Fermer le menu au clic extérieur
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpenMenuId(null);
      }
    };
    if (openMenuId !== null) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [openMenuId]);

  const fetchCategories = async () => {
    try {
      const jwt = localStorage.getItem("jwt");

      const [catRes, checkRes] = await Promise.all([
        fetch(
          `${apiUrl}/api/nameoeuvrelists?filters[users_permissions_users][documentId][$eq]=${user.documentId}&populate[oeuvres][populate][0]=couverture&populate[oeuvres][populate][1]=chapitres`,
          { headers: { Authorization: `Bearer ${jwt}` } }
        ),
        fetch(
          `${apiUrl}/api/checkoeuvretimes?filters[users_permissions_users][documentId][$eq]=${user.documentId}`,
          { headers: { Authorization: `Bearer ${jwt}` } }
        ),
      ]);

      const catData = await catRes.json();
      const checkData = await checkRes.json();

      const checks = checkData.data || [];

      const categoriesEnrichies = (catData.data || []).map((cat) => {
        const enrichedOeuvres = (cat.oeuvres || []).map((oeuvre) => {
          const matchedCheck = checks.find(
            (check) => check.oeuvres?.[0]?.documentId === oeuvre.documentId
          );
          return {
            ...oeuvre,
            lastChecked: matchedCheck?.lastChecked || null,
            archived: matchedCheck?.archived || false,
            chapitres: oeuvre.chapitres || [],
          };
        });

        return {
          ...cat,
          oeuvres: enrichedOeuvres,
        };
      });

      setCategories(categoriesEnrichies);
    } catch (err) {
      console.error("Erreur lors du fetch enrichi :", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [user.documentId]);

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    // Vérif doublon
    const nameExists = categories.some(
      (c) => c.name?.toLowerCase() === newCatName.trim().toLowerCase()
    );
    if (nameExists) {
      alert("Une catégorie avec ce nom existe déjà.");
      return;
    }

    const jwt = localStorage.getItem("jwt");

    const res = await fetch(`${apiUrl}/api/nameoeuvrelists`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${jwt}`,
      },
      body: JSON.stringify({
        data: {
          name: newCatName.trim(),
          couleur: newCatColor,
          users_permissions_users: [user.id],
        },
      }),
    });

    const data = await res.json();
    if (data?.data) {
      setCategories((prev) => [...prev, { ...data.data, oeuvres: [] }]);
      setSelectedCategory(data.data);
      setNewCatName("");
      setShowForm(false);
      setShowPopup(true);
    }
  };

  const handleDeleteCategory = async (catId) => {
    const jwt = localStorage.getItem("jwt");
    const confirmDelete = confirm("Supprimer cette catégorie ?");

    if (!confirmDelete) return;

    try {
      const res = await fetch(`${apiUrl}/api/nameoeuvrelists/${catId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${jwt}`,
        },
      });

      if (res.ok) {
        setCategories((prev) => prev.filter((c) => c.documentId !== catId));
      } else {
        console.error("Erreur lors de la suppression");
      }
    } catch (error) {
      console.error("Erreur réseau :", error);
    }
  };


  const handleRemoveOeuvre = async (catDocumentId, oeuvreDocumentId) => {
    const jwt = localStorage.getItem("jwt");
    try {
      const cat = categories.find((c) => c.documentId === catDocumentId);
      if (!cat) return;
      const remainingIds = (cat.oeuvres || [])
        .filter((o) => o.documentId !== oeuvreDocumentId)
        .map((o) => o.documentId);

      await fetch(`${apiUrl}/api/nameoeuvrelists/${catDocumentId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwt}`,
        },
        body: JSON.stringify({
          data: { oeuvres: remainingIds },
        }),
      });

      setCategories((prev) =>
        prev.map((c) =>
          c.documentId === catDocumentId
            ? { ...c, oeuvres: (c.oeuvres || []).filter((o) => o.documentId !== oeuvreDocumentId) }
            : c
        )
      );
    } catch (error) {
      console.error("Erreur retrait oeuvre :", error);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Jamais";
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffDays < 1) return "Aujourd'hui";
    if (diffDays < 7) return `Il y a ${diffDays}j`;
    return date.toLocaleDateString("fr-FR");
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {Array.from({ length: 2 }).map((_, i) => (
          <SkeletonCategory key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Bouton créer */}
      <div className="flex justify-end">
        <button
          onClick={() => setShowForm(!showForm)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
            showForm
              ? "bg-gray-700 text-gray-300"
              : "bg-indigo-600 hover:bg-indigo-500 text-white"
          }`}
        >
          {showForm ? (
            <>
              <XIcon className="w-4 h-4" />
              Annuler
            </>
          ) : (
            <>
              <FolderPlus className="w-4 h-4" />
              Créer une catégorie
            </>
          )}
        </button>
      </div>

      {/* Formulaire */}
      <AnimatePresence>
        {showForm && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleCreateCategory}
            className="overflow-hidden"
          >
            <div className="bg-gray-800/50 border border-gray-700/50 p-5 rounded-xl">
              <div className="flex flex-col sm:flex-row gap-4 items-end">
                <div className="flex-grow">
                  <label className="block text-xs text-gray-400 mb-1.5">Nom de la catégorie</label>
                  <input
                    type="text"
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    placeholder="Ex : À lire, Favoris, En cours..."
                    className="w-full p-2.5 rounded-lg bg-gray-900 text-white border border-gray-700 text-sm focus:border-indigo-500 focus:outline-none transition-colors"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">Couleur</label>
                  <input
                    type="color"
                    value={newCatColor}
                    onChange={(e) => setNewCatColor(e.target.value)}
                    className="w-12 h-[42px] rounded-lg border border-gray-700 cursor-pointer"
                  />
                </div>
                <button
                  type="submit"
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors"
                >
                  <Check className="w-4 h-4" />
                  Créer
                </button>
              </div>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Liste des catégories */}
      {categories.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="p-4 bg-gray-800/50 rounded-full mb-4">
            <FolderPlus className="w-10 h-10 text-gray-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-300 mb-2">Aucune catégorie</h3>
          <p className="text-gray-500 text-sm max-w-sm">
            Créez des catégories pour organiser vos œuvres (À lire, Favoris, En cours...).
          </p>
        </div>
      ) : (
        categories.map((cat) => {
          const nom = cat.name;
          const couleur = cat.couleur || "#4f46e5";
          const oeuvres = Array.isArray(cat.oeuvres)
            ? cat.oeuvres
            : cat.oeuvres
            ? [cat.oeuvres]
            : [];

          return (
            <motion.div
              key={cat.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gray-800/50 border border-gray-700/50 rounded-xl overflow-hidden"
            >
              {/* Header catégorie avec bordure couleur */}
              <div
                className="flex items-center justify-between px-5 py-4 border-l-4"
                style={{ borderLeftColor: couleur }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: couleur }}
                  />
                  <h2 className="text-lg font-bold text-white">{nom}</h2>
                  <span className="text-xs text-gray-500 bg-gray-700/50 px-2 py-0.5 rounded">
                    {oeuvres.length} œuvre{oeuvres.length > 1 ? "s" : ""}
                  </span>
                </div>

                <div className="relative" ref={openMenuId === cat.id ? menuRef : null}>
                  <button
                    onClick={() =>
                      setOpenMenuId(openMenuId === cat.id ? null : cat.id)
                    }
                    className="p-2 rounded-lg hover:bg-gray-700/50 text-gray-400 hover:text-white transition-colors"
                  >
                    <MoreHorizontal className="w-5 h-5" />
                  </button>

                  <AnimatePresence>
                    {openMenuId === cat.id && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -5 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -5 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 mt-1 w-52 bg-gray-800 border border-gray-700 rounded-xl shadow-xl z-10 overflow-hidden"
                      >
                        <button
                          onClick={() => {
                            setSelectedCategory(cat);
                            setShowPopup(true);
                            setOpenMenuId(null);
                          }}
                          className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-gray-700/50 text-sm text-gray-200 transition-colors"
                        >
                          <Plus className="w-4 h-4 text-indigo-400" />
                          Ajouter des œuvres
                        </button>
                        <button
                          onClick={() => {
                            handleDeleteCategory(cat.documentId);
                            setOpenMenuId(null);
                          }}
                          className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-red-500/10 text-sm text-red-400 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                          Supprimer la catégorie
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Contenu */}
              <div className="px-5 pb-5 pt-2">
                {oeuvres.length === 0 ? (
                  <div className="flex flex-col items-center py-8 text-center">
                    <BookOpen className="w-8 h-8 text-gray-600 mb-2" />
                    <p className="text-gray-500 text-sm">Aucune œuvre dans cette catégorie.</p>
                    <button
                      onClick={() => {
                        setSelectedCategory(cat);
                        setShowPopup(true);
                      }}
                      className="mt-3 text-indigo-400 hover:text-indigo-300 text-sm font-medium transition-colors"
                    >
                      Ajouter des œuvres
                    </button>
                  </div>
                ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {oeuvres.map((oeuvre) => {
                    const cover = oeuvre.couverture?.url;
                    const titre = oeuvre.titre || "Sans titre";
                    const slug = slugify(titre);

                    const chapitres = oeuvre.chapitres || [];
                    const lastCheckedDate = oeuvre.lastChecked
                      ? new Date(oeuvre.lastChecked)
                      : null;
                    const nouveauxChapitres = lastCheckedDate
                      ? chapitres.filter(
                          (ch) => new Date(ch.createdAt) > lastCheckedDate
                        )
                      : [];
                    const nbNouveaux = nouveauxChapitres.length;

                      return (
                        <div
                          key={oeuvre.documentId}
                          className="group relative bg-gray-900/50 border border-gray-700/30 rounded-lg overflow-hidden hover:border-gray-600/50 transition-all cursor-pointer"
                          onClick={() =>
                            router.push(`/oeuvre/${oeuvre.documentId}-${slug}`)
                          }
                        >
                          {/* Bouton retirer */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveOeuvre(cat.documentId, oeuvre.documentId);
                            }}
                            className="absolute top-2 left-2 z-10 p-1.5 bg-gray-900/80 hover:bg-red-500 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                            title="Retirer de la catégorie"
                          >
                            <XIcon className="w-3.5 h-3.5 text-white" />
                          </button>

                          {/* Badge non lu */}
                          {nbNouveaux > 0 && (
                            <div className="absolute top-2 right-2 z-10 flex items-center gap-1 px-2 py-0.5 bg-green-500 text-white text-xs font-bold rounded-full">
                              <Bell className="w-3 h-3" />
                              {nbNouveaux}
                            </div>
                          )}

                          {cover ? (
                            <Image
                              src={cover}
                              alt={titre}
                              width={300}
                              height={160}
                              className="w-full h-40 object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                          ) : (
                            <div className="w-full h-40 bg-gray-700/30 flex items-center justify-center">
                              <BookOpen className="w-8 h-8 text-gray-600" />
                            </div>
                          )}
                          <div className="p-3 space-y-1.5">
                            <h3 className="text-white text-sm font-semibold truncate">{titre}</h3>
                            <div className="flex items-center gap-1.5 text-xs text-gray-500">
                              <Clock className="w-3 h-3" />
                              <span>{formatDate(oeuvre.lastChecked)}</span>
                            </div>
                            {nbNouveaux > 0 ? (
                              <p className="text-xs text-green-400 font-medium">
                                {nbNouveaux} nouveau{nbNouveaux > 1 ? "x" : ""} chapitre{nbNouveaux > 1 ? "s" : ""}
                              </p>
                            ) : (
                              <div className="flex items-center gap-1 text-xs text-gray-500">
                                <CheckCircle className="w-3 h-3" />
                                <span>À jour</span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                  })}
                </div>
                )}
              </div>
            </motion.div>
          );
        })
      )}

      {/* Popup ajout d'œuvres */}
      <AnimatePresence>
        {showPopup && selectedCategory && (
          <AjouterOeuvresPopup
            user={user}
            onClose={() => setShowPopup(false)}
            category={selectedCategory}
            onOeuvreAjoutee={() => {
              setShowPopup(false);
              fetchCategories();
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default VosCategories;
