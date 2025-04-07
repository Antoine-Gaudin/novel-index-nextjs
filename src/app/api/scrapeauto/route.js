import axios from 'axios';
import * as cheerio from 'cheerio';

function extractPossibleTitles(rawTitle) {
    return rawTitle
      .replace(/\[.*?\]/g, '') // Supprime [T], [C], etc.
      .split(/[\/|_｜／、]/g)   // Split sur tous les types de séparateurs : ASCII et unicode
      .map(t => t.trim().toLowerCase())
      .filter(Boolean);
  }
  
  

export async function GET() {
  try {
    const { data: html } = await axios.get('https://chireads.com');
    const $ = cheerio.load(html);
    const rows = [];

    $('div.dernieres-tabel table tbody tr').each((_, row) => {
      const tds = $(row).find('td');

      const œuvreLink = $(tds[0]).find('a');
      const chapitreLink = $(tds[1]).find('a');
      const traducteurLink = $(tds[2]).find('a');
      const dateLink = $(tds[3]).find('a');

      const rawTitle = œuvreLink.text().trim();

      rows.push({
        rawTitle,
        extractedTitles: extractPossibleTitles(rawTitle),
        oeuvre: {
          text: rawTitle,
          href: œuvreLink.attr('href'),
        },
        chapitre: {
          text: chapitreLink.text().trim(),
          href: chapitreLink.attr('href'),
        },
        traducteur: {
          text: traducteurLink.text().trim(),
          href: traducteurLink.attr('href'),
        },
        date: {
          text: dateLink.text().trim(),
        },
      });
    });

    return new Response(JSON.stringify({ rows }, null, 2), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Erreur scraping:', error);
    return new Response(JSON.stringify({ error: 'Scraping failed' }), {
      status: 500,
    });
  }
}
