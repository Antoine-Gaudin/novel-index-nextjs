'use client';  // Indique que ce code est exécuté côté client

import { useState } from 'react';

const ScrapePage = () => {
  const [loading, setLoading] = useState(false);
  const [chapters, setChapters] = useState([]);  // Initialisé à un tableau vide
  const [error, setError] = useState('');

  const handleScrape = async () => {
    setLoading(true);
    setChapters([]);
    setError('');

    try {
      const res = await fetch('/api/scrapeul', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await res.json();
      if (res.ok) {
        // Si les données sont récupérées correctement, on les stocke dans chapters
        console.log('🎯 Chapitres scrappés:', data.data);
        setChapters(data.data || []); // Toujours définir chapters comme un tableau
      } else {
        setError(data.message || 'Une erreur est survenue');
      }
    } catch (err) {
      setError('Erreur de connexion au serveur.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <h1>Scraping des Chapitres</h1>
      <button
        onClick={handleScrape}
        disabled={loading}
        className="btn"
      >
        {loading ? 'Chargement...' : 'Lancer le Scraping'}
      </button>

      {error && <p className="error">{error}</p>}

      <div>
        <h2>Résultats</h2>
        {chapters && chapters.length > 0 ? (
          <ul>
            {chapters.map((chapter, index) => (
              <li key={index}>{chapter.text}</li>
            ))}
          </ul>
        ) : (
          <p>Aucun chapitre récupéré.</p>
        )}
      </div>
    </div>
  );
};

export default ScrapePage;
