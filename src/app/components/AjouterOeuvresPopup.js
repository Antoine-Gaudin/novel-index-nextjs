// extrait popup dans VosCategories
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const AjouterOeuvresPopup = ({ user, onClose, category, onOeuvreAjoutee }) => {
  const [abonnements, setAbonnements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDocumentIds, setSelectedDocumentIds] = useState([]);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  const toggleSelection = (docId) => {
    setSelectedDocumentIds((prev) =>
      prev.includes(docId)
        ? prev.filter((id) => id !== docId)
        : [...prev, docId]
    );
  };

  useEffect(() => {
    const fetchAbonnements = async () => {
      try {
        const jwt = localStorage.getItem("jwt");
        const res = await fetch(
          `${apiUrl}/api/checkoeuvretimes?filters[users_permissions_users][documentId][$eq]=${user.documentId}&populate[oeuvres][populate][0]=couverture`,
          {
            headers: { Authorization: `Bearer ${jwt}` },
          }
        );
        const data = await res.json();
        const mapped = data.data.map((a) => a.oeuvres?.[0]).filter(Boolean);
        setAbonnements(mapped);
      } catch (err) {
        console.error("Erreur fetch abonnements:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAbonnements();
  }, [user.documentId]);

  const handleAjouterOeuvres = async () => {
    const jwt = localStorage.getItem("jwt");
    try {
      await fetch(`${apiUrl}/api/nameoeuvrelists/${category.documentId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwt}`,
        },
        body: JSON.stringify({
          data: {
            oeuvre: selectedDocumentIds,
          },
        }),
      });
      setSelectedDocumentIds([]);
      onOeuvreAjoutee();
    } catch (e) {
      console.error("Erreur ajout œuvres:", e);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex justify-center items-center z-50">
      <div className="bg-gray-900 rounded-lg p-6 w-full max-w-4xl relative">
        <button
          className="absolute top-2 right-3 text-gray-400 hover:text-white text-xl"
          onClick={onClose}
        >
          ✖
        </button>
        <h3 className="text-white text-xl font-bold mb-4">
          Ajouter des œuvres à "{category.name}"
        </h3>

        {loading ? (
          <p className="text-gray-400">Chargement...</p>
        ) : abonnements.length === 0 ? (
          <p className="text-gray-400">Aucun abonnement trouvé.</p>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 max-h-[70vh] overflow-y-auto">
              {abonnements.map((oeuvre) => {
                const docId = oeuvre.documentId;
                const isSelected = selectedDocumentIds.includes(docId);
                const titreSlug = oeuvre.titre
                  .toLowerCase()
                  .normalize("NFD")
                  .replace(/\p{Diacritic}/gu, "")
                  .replace(/[^a-z0-9]+/g, "-")
                  .replace(/^-+|-+$/g, "");

                return (
                  <div
                    key={docId}
                    onClick={() => toggleSelection(docId)}
                    className={`bg-gray-800 rounded-xl overflow-hidden shadow-md transition cursor-pointer border-2 ${
                      isSelected ? "border-indigo-500" : "border-transparent"
                    }`}
                  >
                    {oeuvre?.couverture?.url ? (
                      <img
                        src={oeuvre.couverture.url}
                        alt={oeuvre.titre}
                        className="w-full h-48 object-cover"
                      />
                    ) : (
                      <div className="w-full h-48 bg-gray-700 flex items-center justify-center text-gray-400">
                        Pas de visuel
                      </div>
                    )}
                    <div className="p-4 space-y-2">
                      <h2 className="text-lg font-semibold text-white">
                        {oeuvre.titre}
                      </h2>
                      {isSelected && (
                        <p className="text-sm text-green-400 font-medium">
                          ✔ Sélectionné
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 text-right">
              <button
                onClick={handleAjouterOeuvres}
                disabled={selectedDocumentIds.length === 0}
                className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                ➕ Ajouter {selectedDocumentIds.length} œuvre
                {selectedDocumentIds.length > 1 ? "s" : ""} à la catégorie
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AjouterOeuvresPopup;
