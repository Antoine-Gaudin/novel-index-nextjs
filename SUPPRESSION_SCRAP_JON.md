# Suppression de la route `/api/scrap-jon` — Rapport complet

**Date :** 23 février 2026  
**Urgence :** CRITIQUE — Saturation Vercel Edge Requests (800 517 requêtes sur 30 jours, pic à ~190k/jour à partir du 19 février)

---

## 1. Contexte — Pourquoi cette route saturait Vercel ?

### La preuve visuelle
Le graphique Vercel Edge Requests montre :
- Requêtes stables et basses (~quelques centaines/jour) jusqu'au **19 février**
- Explosion soudaine : **~160 000 → ~190 000 requêtes/jour** du 19 au 23 février
- Total sur 30 jours : **800 517 requêtes**

### La cause racine

La route `/api/scrap-jon` était le problème principal pour **3 raisons cumulées** :

#### Raison 1 — Puppeteer (navigateur headless) lancé sur Vercel
```js
// src/app/api/scrap-jon/route.js — ligne 11
async function launchBrowser() {
  return puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage", "--disable-gpu"],
  });
}
```
Puppeteer lance un **Chromium complet** à chaque requête. Sur Vercel (Edge/Serverless), cela :
- Consomme énormément de mémoire et CPU
- Génère **plusieurs sous-requêtes internes Vercel** par invocation (compté chacune dans les Edge Requests)
- Peut provoquer des timeouts → retries automatiques → encore plus de requêtes

#### Raison 2 — Appel automatique au chargement de la page (useEffect sans auth)
```js
// src/app/scrap-jon/page.js — ligne 15-28
useEffect(() => {
  const fetchOeuvres = async () => {
    const res = await fetch("/api/scrap-jon", { cache: "no-store" }); // ← DÉCLENCHE PUPPETEER
    ...
  };
  fetchOeuvres();
}, []); // ← Se lance AUTOMATIQUEMENT à chaque visite de /scrap-jon
```
**Chaque visite sur `/scrap-jon`** déclenchait automatiquement un lancement Puppeteer complet. Avec `cache: "no-store"`, aucun cache possible.

#### Raison 3 — Route publique, sans aucune protection d'authentification
La page `/scrap-jon` et l'endpoint `/api/scrap-jon` étaient **totalement publics**, accessibles sans token ni middleware. Les bots, crawlers SEO, et le sitemap Vercel peuvent avoir découvert et hit cette URL en boucle.

#### Raison 4 — Route de 1 802 lignes avec logiques complexes
La route contenait :
- Fuzzy matching (algorithme de Dice, Levenshtein)
- Pagination complète de noveldeglace.com
- Appels à l'API Strapi externe (`https://novel-index-strapi.onrender.com`)
- Chaque GET = scraping de toutes les œuvres + comparaison fuzzy = **route très longue à exécuter**

---

## 2. Fichiers supprimés

| Fichier | Lignes | Rôle | Raison de suppression |
|---------|--------|------|-----------------------|
| `src/app/api/scrap-jon/route.js` | 1 802 | Route API GET+POST avec Puppeteer scraping noveldeglace.com | Source principale de la saturation |
| `src/app/scrap-jon/page.js` | 251 | Page front appelant `/api/scrap-jon` automatiquement au montage | Déclencheur automatique de Puppeteer |

---

## 3. Actions effectuées

```
✅ Suppression de : src/app/api/scrap-jon/route.js
✅ Suppression de : src/app/api/scrap-jon/ (dossier)
✅ Suppression de : src/app/scrap-jon/page.js
✅ Suppression de : src/app/scrap-jon/ (dossier)
```

---

## 4. Autres routes API à surveiller

Ces routes existent encore et méritent surveillance :

| Route | Techno | Risque | Recommandation |
|-------|--------|--------|----------------|
| `api/scrapeul` | **Puppeteer** | ÉLEVÉ | Protéger avec un secret header ou supprimer si non utilisée |
| `api/scrapeauto` | axios + cheerio | MOYEN | Vérifier si appelée automatiquement quelque part |
| `api/scrapecron` | axios + cheerio | MOYEN | OK si uniquement appelée par un cron Vercel contrôlé |
| `api/scrape` | inconnu | À vérifier | Analyser le fichier |
| `api/sorties-jour` | fetch | FAIBLE | Utilise `cache: "no-store"` — envisager du caching |
| `api/data` | inconnu | FAIBLE | À surveiller |

### ⚠️ Action urgente recommandée sur `api/scrapeul`
Ce fichier utilise aussi **Puppeteer** :
```js
// src/app/api/scrapeul/route.js
import puppeteer from 'puppeteer';
const browser = await puppeteer.launch();
```
Si cette route est publique ou appelée automatiquement, elle peut reproduire exactement le même problème. **À sécuriser immédiatement.**

---

## 5. Recommandations pour éviter que cela se reproduise

1. **Ne jamais exposer une route Puppeteer sans authentification** — Toujours protéger avec `CRON_SECRET` ou un bearer token dans le header.

2. **Ne jamais appeler une route lourde dans un `useEffect` sans garde** — Utiliser une authentification ou un bouton manuel.

3. **Ajouter un middleware de protection** sur les routes `/api/scrape*` :
```js
// Vérification basique dans la route
const secret = req.headers.get("x-cron-secret");
if (secret !== process.env.CRON_SECRET) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
```

4. **Puppeteer n'est pas compatible avec Vercel Hobby/Pro standard** — Utiliser plutôt `puppeteer-core` + `@sparticuz/chromium` en serverless, ou externaliser le scraping sur un serveur dédié (VPS, Railway, etc.).

5. **Surveiller les Edge Requests Vercel régulièrement** dans le dashboard `Usage > Edge Requests`.

---

## 6. Impact attendu

Après le prochain déploiement sur Vercel :
- La route `/api/scrap-jon` retournera **404**
- La page `/scrap-jon` retournera **404**
- Les Edge Requests devraient redescendre au niveau pré-19 février (< 5 000/jour)
- Les coûts Vercel associés à la surconsommation disparaîtront

---

*Rapport généré automatiquement le 23 février 2026*
