"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AjouterOeuvresPopup from "./AjouterOeuvresPopup"; // adapte le chemin
import Image from "next/image";
import { slugify } from "@/utils/slugify";

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

  useEffect(() => {
    const fetchCategoriesAndChecks = async () => {
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

        // Associe chaque œuvre avec son suivi
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

    fetchCategoriesAndChecks();
  }, [user.documentId]);

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    const jwt = localStorage.getItem("jwt");

    const res = await fetch(`${apiUrl}/api/nameoeuvrelists`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${jwt}`,
      },
      body: JSON.stringify({
        data: {
          name: newCatName,
          couleur: newCatColor,
          users_permissions_users: [user.id],
        },
      }),
    });

    const data = await res.json();
    if (data?.data) {
      setCategories((prev) => [...prev, data.data]);
      setSelectedCategory(data.data);
      setNewCatName("");
      setShowForm(false);
      setShowPopup(true); // 👈 Ouvre la popup
    }
  };

  if (loading) {
    return (
      <p className="text-center text-gray-400">
        Chargement de vos catégories...
      </p>
    );
  }

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


  

  return (
    <div className="space-y-8">
      {/* Formulaire de création */}
      <div className="mb-6 text-right">
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
        >
          ➕ Créer une catégorie
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleCreateCategory}
          className="bg-gray-800 p-4 rounded-lg mb-8"
        >
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <input
              type="text"
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              placeholder="Nom de la catégorie"
              className="flex-grow p-2 rounded-lg bg-gray-900 text-white border border-gray-700"
              required
            />
            <input
              type="color"
              value={newCatColor}
              onChange={(e) => setNewCatColor(e.target.value)}
              className="w-12 h-10 rounded-lg border border-gray-700"
            />
            <button
              type="submit"
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
            >
              ✅ Créer
            </button>
          </div>
        </form>
      )}

      {/* Liste des catégories */}
      {categories.length === 0 ? (
        <p className="text-center text-gray-400">
          Vous n’avez pas encore créé de catégories personnalisées.
        </p>
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
            <div key={cat.id} className="bg-gray-800 p-4 rounded-xl shadow-md">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold" style={{ color: couleur }}>
                  {nom}
                </h2>

                <div className="relative">
                  <button
                    onClick={() =>
                      setOpenMenuId(openMenuId === cat.id ? null : cat.id)
                    }
                    className="text-white text-xl px-2 hover:text-indigo-400"
                  >
                    ⋯
                  </button>

                  {openMenuId === cat.id && (
                    <div className="absolute right-0 mt-2 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow z-10">
                      <button
                        onClick={() => {
                          setSelectedCategory(cat);
                          setShowPopup(true);
                          setOpenMenuId(null);
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-gray-700 text-white"
                      >
                        ➕ Ajouter des œuvres
                      </button>
                      <button
                        onClick={() => handleDeleteCategory(cat.documentId)}
                        className="w-full text-left px-4 py-2 hover:bg-red-600 text-red-400"
                      >
                        🗑️ Supprimer
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {oeuvres.length === 0 ? (
                <p className="text-gray-400 italic">
                  Aucune œuvre dans cette catégorie.
                </p>
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
                        className="bg-gray-900 rounded-lg overflow-hidden shadow hover:shadow-lg cursor-pointer transition"
                        onClick={() =>
                          router.push(`/oeuvre/${oeuvre.documentId}-${slug}`)
                        }
                      >
                        {cover ? (
                          <Image
                            src={cover}
                            alt={titre}
                            width={300}
                            height={160}
                            className="w-full h-40 object-cover"
                          />
                        ) : (
                          <div className="w-full h-40 bg-gray-700 flex items-center justify-center text-gray-400">
                            Pas de visuel
                          </div>
                        )}
                        <div className="p-3 space-y-1">
                          <h3 className="text-white font-semibold">{titre}</h3>
                          <p className="text-sm text-gray-400">
                            Dernier acc&egrave;s :{" "}
                            {lastCheckedDate
                              ? lastCheckedDate.toLocaleString("fr-FR")
                              : "Jamais"}
                          </p>
                          {nbNouveaux > 0 ? (
                            <p className="text-sm text-green-400 font-semibold">
                              {nbNouveaux} nouveau{nbNouveaux > 1 ? "x" : ""}{" "}
                              chapitre
                              {nbNouveaux > 1 ? "s" : ""} depuis votre visite
                            </p>
                          ) : (
                            <p className="text-sm text-gray-400">
                              Vous &ecirc;tes &agrave; jour sur cette oeuvre
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })
      )}

      {/* TODO : popup ajout d'œuvres sous abonnements */}
      {showPopup && selectedCategory && (
        <AjouterOeuvresPopup
          user={user}
          onClose={() => setShowPopup(false)}
          category={selectedCategory}
          onOeuvreAjoutee={() => {
            setShowPopup(false);
            // refresh des catégories si tu veux ici
          }}
        />
      )}
    </div>
  );
};

export default VosCategories;
