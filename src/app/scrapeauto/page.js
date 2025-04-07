'use client';

import { useEffect, useState } from 'react';

function extractPossibleTitles(rawTitle) {
  return rawTitle
    .replace(/\[.*?\]/g, '')
    .split(/[\/|_｜／、]/g)
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean);
}

async function getScrapedRows() {
  const res = await fetch('http://localhost:3000/api/scrapeauto', {
    cache: 'no-store',
  });
  const data = await res.json();
  return data.rows;
}

async function getStrapiOeuvres() {
  const res = await fetch('https://novel-index-strapi.onrender.com/api/oeuvres', {
    cache: 'no-store',
  });
  const data = await res.json();
  return data.data;
}

async function getFullOeuvre(documentId) {
  const url = `https://novel-index-strapi.onrender.com/api/oeuvres/${documentId}?populate=chapitres`;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) return null;
  const data = await res.json();
  return data;
}

export default function ScrapeAutoPage() {
  const [completedRows, setCompletedRows] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      const [rows, strapiOeuvres] = await Promise.all([
        getScrapedRows(),
        getStrapiOeuvres(),
      ]);

      const matchedRows = rows.map((row) => {
        const variants = extractPossibleTitles(row.rawTitle);
        const matched = strapiOeuvres.find((o) => {
          const titre = o.titre?.toLowerCase() || '';
          const alt = o.titrealt?.toLowerCase() || '';
          return variants.some((v) => titre.includes(v) || alt.includes(v));
        });

        return {
          ...row,
          matchedOeuvre: matched
            ? {
                documentId: matched.documentId,
                titre: matched.titre,
                titrealt: matched.titrealt,
              }
            : null,
        };
      });

      const fullRows = [];
      for (const row of matchedRows) {
        if (!row.matchedOeuvre) {
          fullRows.push({ ...row, fullOeuvre: null });
          continue;
        }
        const fullOeuvre = await getFullOeuvre(row.matchedOeuvre.documentId);
        fullRows.push({ ...row, fullOeuvre });
      }

      setCompletedRows(fullRows);
    };

    load();
  }, []);

  async function submitChapitresToStrapi() {
    const log = [];
    setLoading(true);

    const grouped = {};

    for (const row of completedRows) {
      if (!row.matchedOeuvre || !row.fullOeuvre?.data?.chapitres) continue;
      const oeuvreId = row.matchedOeuvre.documentId;

      if (!grouped[oeuvreId]) {
        grouped[oeuvreId] = {
          titre: row.matchedOeuvre.titre,
          chapitresExistants: row.fullOeuvre.data.chapitres || [],
          chapitresScrapes: [],
        };
      }

      grouped[oeuvreId].chapitresScrapes.push({
        titre: row.chapitre.text,
        url: row.chapitre.href,
        date: row.date.text, // <-- ici
      });
    }

    for (const [oeuvreId, group] of Object.entries(grouped)) {
        const existingUrls = group.chapitresExistants.map((c) => c.url);
        let currentOrder = group.chapitresExistants.reduce(
          (max, c) => Math.max(max, c.order || 0),
          0
        );
      
        // ✅ Trie les chapitres scrapés du plus ancien au plus récent
        group.chapitresScrapes.sort((a, b) => new Date(a.date) - new Date(b.date));
      
        for (const chap of group.chapitresScrapes) {
          if (existingUrls.includes(chap.url)) {
            log.push(`⚠️ [${group.titre}] "${chap.titre}" déjà existant`);
            continue;
          }
      
          currentOrder++;
      
          const payload = {
            data: {
              titre: chap.titre,
              url: chap.url,
              order: currentOrder,
              oeuvres: oeuvreId,
            },
          };
      
          try {
            const res = await fetch('https://novel-index-strapi.onrender.com/api/chapitres', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload),
            });
      
            if (res.ok) {
              log.push(`✅ [${group.titre}] "${chap.titre}" ajouté (order ${currentOrder})`);
            } else {
              log.push(`❌ Échec ajout "${chap.titre}" (${res.status})`);
            }
          } catch (err) {
            log.push(`💥 Erreur serveur "${chap.titre}" → ${err.message}`);
          }
        }
      }
      

      setLogs(log);
      setLoading(false);
      
      // 📨 Envoie le journal à la table "administration"
      try {
        await fetch('https://novel-index-strapi.onrender.com/api/administrations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            data: {
              titre: 'Ajout automatique de chapitres',
              contenu: log.join('\n'),
              signalement: false,
              origine: 'scrapeauto',
            },
          }),
        });
        log.push('📨 Journal envoyé à la table Administration');
      } catch (err) {
        log.push(`❌ Erreur envoi journal à Administration: ${err.message}`);
      }
      
  }

  return (
    <main className="p-8 bg-black min-h-screen text-white">
      <h1 className="text-3xl font-bold mb-6">Chapitres récents – Chireads</h1>

      <div className="overflow-auto">
        <table className="min-w-full border border-gray-700 text-sm">
          <thead className="bg-gray-800 text-gray-200">
            <tr>
              <th className="border px-4 py-2 text-left">Œuvre</th>
              <th className="border px-4 py-2 text-left">Chapitre</th>
              <th className="border px-4 py-2 text-left">Traducteur</th>
              <th className="border px-4 py-2 text-left">Date</th>
              <th className="border px-4 py-2 text-left">Œuvre Strapi</th>
              <th className="border px-4 py-2 text-left">Chapitres liés</th>
            </tr>
          </thead>
          <tbody>
            {completedRows.map((row, index) => {
              const chapitres = row.fullOeuvre?.data?.chapitres ?? [];
              return (
                <tr key={index} className="hover:bg-gray-900">
                  <td className="border px-4 py-2">
                    <a href={row.oeuvre.href} target="_blank" className="text-blue-400 hover:underline">
                      {row.oeuvre.text}
                    </a>
                  </td>
                  <td className="border px-4 py-2">
                    <a href={row.chapitre.href} target="_blank" className="text-blue-400 hover:underline">
                      {row.chapitre.text}
                    </a>
                  </td>
                  <td className="border px-4 py-2">
                    <a href={row.traducteur.href} target="_blank" className="text-blue-400 hover:underline">
                      {row.traducteur.text}
                    </a>
                  </td>
                  <td className="border px-4 py-2">{row.date.text}</td>
                  <td className="border px-4 py-2">
                    {row.matchedOeuvre ? (
                      <>
                        <div className="text-green-400 font-semibold">{row.matchedOeuvre.titre}</div>
                        <div className="text-xs text-gray-400">{row.matchedOeuvre.titrealt}</div>
                      </>
                    ) : (
                      <span className="text-red-400 italic">Non trouvé</span>
                    )}
                  </td>
                  <td className="border px-4 py-2 text-xs text-gray-300">
                    {chapitres.length > 0 ? (
                      <span>{chapitres.length} chapitres liés</span>
                    ) : (
                      <span className="text-gray-500 italic">Aucun</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-10">
        <button
          onClick={submitChapitresToStrapi}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-white"
        >
          {loading ? 'Ajout en cours...' : '➕ Ajouter chapitres à Strapi'}
        </button>
      </div>

      {logs.length > 0 && (
        <div className="mt-6 bg-gray-900 p-4 rounded shadow">
          <h2 className="text-lg font-semibold mb-3">📋 Journal des actions :</h2>
          <ul className="text-sm space-y-1">
            {logs.map((line, index) => (
              <li key={index} className="text-white">
                {line}
              </li>
            ))}
          </ul>
        </div>
      )}
    </main>
  );
}
