"use client";

import { useState, useEffect } from "react";
import Cookies from "js-cookie";

const ScrappingPage = () => {
  const [url, setUrl] = useState("");
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [globalDomain, setGlobalDomain] = useState("");
  const [sortDirection, setSortDirection] = useState("asc");
  const [user, setUser] = useState(null);
  const [oeuvreSearch, setOeuvreSearch] = useState("");
  const [oeuvreResults, setOeuvreResults] = useState([]);
  const [selectedOeuvre, setSelectedOeuvre] = useState(null);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState("");
  


  useEffect(() => {
    const fetchUser = async () => {
      const token = Cookies.get("jwt");
      if (!token) {
        console.log("❌ Aucun JWT trouvé dans les cookies");
        window.location.href = "/";
        return;
      }
  
      try {
        const res = await fetch("https://novel-index-strapi.onrender.com/api/users/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
  
        const data = await res.json();
        setUser(data);
        console.log("👤 Utilisateur connecté :", data);
  
        // ✅ Redirection si admin === false
        if (!data.admin) {
          console.log("🔒 Accès refusé — redirection");
          window.location.href = "/";
        }
      } catch (err) {
        console.error("❌ Erreur récupération utilisateur :", err);
      }
    };
  
    fetchUser();
  }, []);
  
  
  useEffect(() => {
    if (!oeuvreSearch.trim()) {
      setOeuvreResults([]);
      return;
    }
  
    


    const fetchOeuvres = async () => {
      try {
        const res = await fetch(
          `https://novel-index-strapi.onrender.com/api/oeuvres?filters[titre][$containsi]=${oeuvreSearch}`
        );
        const data = await res.json();
  
        if (data && Array.isArray(data.data)) {
          const mapped = data.data.map((item) => ({
            titre: item.titre,
            documentId: item.documentId,
          }));
          setOeuvreResults(mapped);
        } else {
          setOeuvreResults([]);
        }
      } catch (err) {
        console.error("❌ Erreur recherche œuvres :", err);
      }
    };
  
    const timer = setTimeout(fetchOeuvres, 300); // debounce
    return () => clearTimeout(timer);
  }, [oeuvreSearch]);
  

  useEffect(() => {
    if (!oeuvreSearch.trim()) {
      setOeuvreResults([]);
      return;
    }
  
    const fetchOeuvres = async () => {
      try {
        const res = await fetch(
          `https://novel-index-strapi.onrender.com/api/oeuvres?filters[titre][$containsi]=${oeuvreSearch}`
        );
        const data = await res.json();
  
        if (data && Array.isArray(data.data)) {
          const mapped = data.data.map((item) => ({
            titre: item.titre,
            documentId: item.documentId,
          }));
          setOeuvreResults(mapped);
        } else {
          setOeuvreResults([]);
        }
      } catch (err) {
        console.error("❌ Erreur recherche œuvres :", err);
      }
    };
  
    const timer = setTimeout(fetchOeuvres, 300); // debounce
    return () => clearTimeout(timer);
  }, [oeuvreSearch]);


  const handleScrape = async () => {
    setLoading(true);
    setLinks([]);
    setError("");

    try {
      const res = await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      const data = await res.json();
      if (res.ok) {
        // On enrichit chaque lien avec les champs personnalisés
        const enrichedLinks = data.links.map((link, index) => ({
          name: link.text || "",
          tome: "",
          domain: "",
          url: link.href,
          order: index + 1,
        }));

        setLinks(enrichedLinks);
      } else {
        setError(data.message || "Une erreur est survenue.");
      }
    } catch (err) {
      setError("Erreur de connexion au serveur.");
    } finally {
      setLoading(false);
    }
  };

  const updateLinkField = (index, field, value) => {
    const updatedLinks = [...links];
    updatedLinks[index][field] = value;
    setLinks(updatedLinks);
  };

  const handleDomainChange = (value) => {
    setGlobalDomain(value);
    const updated = links.map((link) => ({ ...link, domain: value }));
    setLinks(updated);
  };

  const removeLink = (index) => {
    const updated = [...links];
    updated.splice(index, 1);
    // Réindexe en interne
    const reindexed = updated.map((item, i) => ({ ...item, order: i + 1 }));
    setLinks(reindexed);
  };

  const recalculateOrder = (list) => {
    return list.map((item, index) => ({ ...item, order: index + 1 }));
  };

  const setOrderByDirection = (direction) => {
    const total = links.length;
    const updated = links.map((link, index) => ({
      ...link,
      order: direction === "asc" ? index + 1 : total - index,
    }));
    setLinks(updated);
    setSortDirection(direction);
  };
  
  const importScrapedChapters = async () => {
    if (!selectedOeuvre || links.length === 0) return;
  
    const jwt = Cookies.get("jwt");
    if (!jwt) {
      console.error("❌ Aucun JWT trouvé");
      return;
    }
  
    setImporting(true);
    setProgress(0);
    setStatusMessage("🚀 Importation en cours...");
  
    try {
      // Récupération des chapitres existants
      const res = await fetch(`https://novel-index-strapi.onrender.com/api/oeuvres/${selectedOeuvre.documentId}?populate=chapitres`, {
        headers: {
          Authorization: `Bearer ${jwt}`,
        },
      });
  
      const data = await res.json();
      const existingChaps = data.chapitres || [];
  
      let lastOrder = existingChaps.length > 0
        ? Math.max(...existingChaps.map((c) => parseInt(c.order, 10)))
        : 0;
  
      let successCount = 0;
      let total = links.length;
  
      for (let i = 0; i < total; i++) {
        const link = links[i];
        const fullUrl = link.domain ? link.domain + link.url : link.url;
  
        const payload = {
          data: {
            titre: link.name,
            order: lastOrder + i + 1,
            url: fullUrl,
            oeuvres: [selectedOeuvre.documentId],
            users_permissions_users: user ? [user.documentId] : [],
          },
        };
  
        try {
          await fetch("https://novel-index-strapi.onrender.com/api/chapitres", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${jwt}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
          });
  
          successCount++;
          setProgress(Math.round((successCount / total) * 100));
  
          if (successCount % 80 === 0) {
            setStatusMessage(`🛑 Pause 5 sec après ${successCount} chapitres...`);
            await new Promise((r) => setTimeout(r, 5000));
            setStatusMessage("✅ Reprise...");
          }
        } catch (err) {
          console.error(`❌ Erreur import chapitre ${link.name}`, err);
        }
      }
  
      setStatusMessage("🎉 Importation terminée !");
    } catch (err) {
      console.error("❌ Erreur globale :", err);
      setStatusMessage("❌ Erreur durant l’importation.");
    } finally {
      setImporting(false);
    }
  };
  
  
  return (
    <div className="max-w-5xl mx-auto p-6 bg-gray-900 text-white rounded-lg shadow-lg mt-8">
      <div className="mb-6">
  <label className="block text-sm font-semibold mb-1 text-white">🔍 Recherche d’œuvres</label>
  <input
    type="text"
    value={oeuvreSearch}
    onChange={(e) => setOeuvreSearch(e.target.value)}
    placeholder="Titre de l’œuvre"
    className="w-full px-4 py-2 rounded bg-gray-800 border border-gray-700 text-white"
  />

  {oeuvreResults.length > 0 && (
    <ul className="mt-2 bg-gray-800 border border-gray-700 rounded shadow max-h-60 overflow-y-auto">
      {oeuvreResults.map((oeuvre, index) => (
        <li
          key={index}
          onClick={() => {
            setSelectedOeuvre(oeuvre); // 🟢 IL MANQUAIT ÇA !
            console.log("🎯 Œuvre sélectionnée :", oeuvre.titre, "| Document ID :", oeuvre.documentId);
            setOeuvreSearch("");
            setOeuvreResults([]);
          }}
          
          className="px-4 py-2 cursor-pointer hover:bg-gray-700 text-white border-b border-gray-700"
        >
          {oeuvre.titre} — <span className="text-xs text-gray-400">{oeuvre.documentId}</span>
        </li>
      ))}
    </ul>
  )}
</div>


<h1 className="text-2xl font-bold mb-6 text-center">
  {selectedOeuvre
    ? <>🔍 Scrapper des liens pour Œuvre sélectionnée : <span className="font-bold">{selectedOeuvre.titre}</span></>
    : "🔍 Scrapper des liens"}
</h1>






      <div className="flex space-x-2 mb-4">
        <input
          type="text"
          placeholder="Entrez l'URL à scrapper"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="flex-1 px-4 py-2 rounded bg-gray-800 border border-gray-700 text-white"
        />
        <button
          onClick={handleScrape}
          disabled={loading || !url}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded text-white font-bold"
        >
          {loading ? "Chargement..." : "Scraper"}
        </button>
      </div>

      {importing && (
  <div className="mt-4">
    <div className="w-full bg-gray-700 rounded h-4 overflow-hidden">
      <div
        className="bg-green-500 h-full transition-all duration-300"
        style={{ width: `${progress}%` }}
      />
    </div>
    <p className="text-sm mt-2 text-white">{progress}% — {statusMessage}</p>
  </div>
)}



  <div className="mt-6 text-right">
    <button
      onClick={importScrapedChapters}
      className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded text-white font-bold"
    >
      📤 Importer les chapitres dans Strapi
    </button>
  </div>




      {error && <p className="text-red-500 mb-4">{error}</p>}
      {links.length > 0 && (
        <div className="overflow-x-auto mt-6">
          <div className="flex justify-end mb-2">
            <div className="flex justify-end mb-2">
              <button
                onClick={() => {
                  const newDirection = sortDirection === "asc" ? "desc" : "asc";
                  setOrderByDirection(newDirection);
                }}
                className="px-3 py-1 bg-indigo-700 hover:bg-indigo-800 rounded text-white font-semibold"
              >
                Trier la colonne ordre :{" "}
                {sortDirection === "asc" ? "⬇️ Desc" : "⬆️ Asc"}
              </button>
            </div>
          </div>

          <table className="w-full table-auto border-collapse">
            <thead>
              <tr className="bg-gray-800 text-left">
                <th className="p-2 border border-gray-700">Nom du lien</th>
                <th className="p-2 border border-gray-700">Ordre</th>
                <th className="p-2 border border-gray-700">Tome</th>
                <th className="p-2 border border-gray-700">
                  Nom de domaine
                  <input
                    type="text"
                    value={globalDomain}
                    onChange={(e) => handleDomainChange(e.target.value)}
                    className="mt-1 w-full px-2 py-1 rounded bg-gray-700 border border-gray-600 text-white"
                    placeholder="Appliquer à tous"
                  />
                </th>
                <th className="p-2 border border-gray-700">URL</th>
                <th className="p-2 border border-gray-700">Supprimer</th>
              </tr>
            </thead>
            <tbody>
              {links.map((link, index) => (
                <tr key={index} className="hover:bg-gray-800 transition">
                  <td className="p-2 border border-gray-700">
                    <input
                      type="text"
                      value={link.name}
                      onChange={(e) =>
                        updateLinkField(index, "name", e.target.value)
                      }
                      className="w-[300px] px-2 py-1 rounded bg-gray-700 border border-gray-600 text-white"
                    />
                  </td>
                  <td className="p-2 border border-gray-700 text-center">
                    {link.order}
                  </td>

                  <td className="p-2 border border-gray-700">
                    <input
                      type="text"
                      value={link.tome}
                      onChange={(e) =>
                        updateLinkField(index, "tome", e.target.value)
                      }
                      className="w-full px-2 py-1 rounded bg-gray-700 border border-gray-600 text-white"
                    />
                  </td>
                  <td className="p-2 border border-gray-700">
                    <input
                      type="text"
                      value={link.domain}
                      onChange={(e) =>
                        updateLinkField(index, "domain", e.target.value)
                      }
                      className="w-full px-2 py-1 rounded bg-gray-700 border border-gray-600 text-white"
                    />
                  </td>
                  <td className="p-2 border border-gray-700">
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 underline break-all"
                    >
                      {link.url}
                    </a>
                  </td>
                  <td className="p-2 border border-gray-700 text-center">
                    <button
                      onClick={() => removeLink(index)}
                      className="text-red-500 hover:text-red-700 font-bold"
                    >
                      ✖
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ScrappingPage;
