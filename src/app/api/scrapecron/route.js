import { NextResponse } from 'next/server';
import axios from 'axios';
import * as cheerio from 'cheerio';

function extractPossibleTitles(rawTitle) {
  return rawTitle
    .replace(/\[.*?\]/g, '')
    .split(/[\/|_｜／、]/g)
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean);
}

export async function GET(req) {
  const log = [];

  try {
    // 1. Scrap les chapitres
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
          text: dateLink.text().trim(), // format genre "2025-04-06 17:00:06"
        },
      });
    });

    // 2. Récupère toutes les œuvres dans Strapi
    const oeuvreRes = await fetch('https://novel-index-strapi.onrender.com/api/oeuvres');
    const { data: strapiOeuvres } = await oeuvreRes.json();

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

    // 3. Récupère les chapitres existants pour chaque œuvre matched
    const completedRows = await Promise.all(
      matchedRows.map(async (row) => {
        if (!row.matchedOeuvre) return { ...row, fullOeuvre: null };
    
        const res = await fetch(
          `https://novel-index-strapi.onrender.com/api/oeuvres/${row.matchedOeuvre.documentId}?populate=chapitres`
        );
        const data = await res.json();
        return { ...row, fullOeuvre: data };
      })
    );
    

    // 4. Traitement de l’ajout des chapitres
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
        date: row.date.text,
      });
    }

    for (const [oeuvreId, group] of Object.entries(grouped)) {
      const existingUrls = group.chapitresExistants.map((c) => c.url);
      let currentOrder = group.chapitresExistants.reduce(
        (max, c) => Math.max(max, c.order || 0),
        0
      );

      // 🔁 Trie les chapitres par date
      group.chapitresScrapes.sort((a, b) => new Date(a.date) - new Date(b.date));

      const requests = [];

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
      
        const req = fetch('https://novel-index-strapi.onrender.com/api/chapitres', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }).then((res) => {
          if (res.ok) {
            log.push(`✅ [${group.titre}] "${chap.titre}" ajouté (order ${currentOrder})`);
          } else {
            log.push(`❌ Échec ajout "${chap.titre}" (${res.status})`);
          }
        });
      
        requests.push(req);
      }
      
      await Promise.all(requests);
      
    }

    // 5. Ajoute dans la table administration
    await fetch('https://novel-index-strapi.onrender.com/api/administrations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        data: {
          titre: 'Ajout automatique de chapitres',
          contenu: log.join('\n'),
          signalement: false,
          origine: 'scrapecron',
        },
      }),
    });

    return NextResponse.json({ success: true, log });
  } catch (err) {
    log.push(`💥 Erreur globale : ${err.message}`);
    return NextResponse.json({ success: false, log }, { status: 500 });
  }
}
