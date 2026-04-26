On change de sujet, enfin, on va aller sur une oeuvre, et je veut une analyse de ta part
  concernant, les pages d'oeuvre, je cherche a bien plus enrichir les pages pour du SEO,
  http://localhost:3000/oeuvre/dff6s77limbn1gpejnj5lhjh-reincarnation-of-the-strongest-sword-god

● Je regarde la structure des pages d'œuvre, leur metadata, leur rendu côté serveur et ce qui est
  exposé aux crawlers.

  Read 4 files, listed 2 directories (ctrl+o to expand)

● J'ai aussi besoin de voir ce que le crawler voit réellement (HTML servi par le SSR) avant de
  conclure. Je récupère le HTML brut servi par Next.

● Bash(curl -s
      "http://localhost:3000/oeuvre/dff6s77limbn1gpejnj5lhjh-reincarnation-of-the-strongest-sword-god"
       -o /tmp/sword-god.html; wc -c /tmp/sword-god.html; echo…)
  ⎿  517758 /tmp/sword-god.html
     ---HEAD META---
     <!DOCTYPE html><html lang="fr" class="__variable_f367f3 __variable_188709 __variable_9a8899"
     … +322 lines (ctrl+o to expand)

  Searched for 3 patterns (ctrl+o to expand)

● Bash(grep -oE 'rel="canonical"[^>]*' /tmp/sword-god.html; echo "---"; echo "Number of <script
      application/ld+json>:"; grep -oE 'application/ld\+json' /tmp/sword-god.…)
  ⎿  rel="canonical" href="https://www.novel-index.com/oeuvre/dff6s77limbn1gpejnj5lhjh-reincarnat
     ion-of-the-strongest-sword-god"/
     ---
     … +4 lines (ctrl+o to expand)

  Searched for 1 pattern (ctrl+o to expand)

● Analyse complète. J'ai croisé le code des fichiers (page.js, layout.js, OeuvreClient.js,
  Affichapitre.js) avec ce que le crawler reçoit réellement (HTML SSR de l'URL fournie).

  Analyse SEO des pages d'œuvre

  🟢 Ce qui est en place (à conserver)

  - SSR + metadata côté serveur : generateMetadata + canonical correct
  (https://www.novel-index.com/oeuvre/{id}-{slug}).
  - Open Graph + Twitter Card présents avec image cover.
  - JSON-LD : Book, CreativeWork, BreadcrumbList, Review, WebSite/SearchAction (10 blocs).
  - H1 unique = titre de l'œuvre. Lang fr + og:locale fr_FR.
  - Synopsis dans le HTML SSR (les crawlers le voient).
  - Cover en priority (LCP).
  - Cache fetch dédupliqué entre layout et metadata via cache(getOeuvre) — bonne pratique.

  🔴 Problèmes critiques (gaspillent ton SEO actuel)

  1. La liste des chapitres est invisible au crawler

  - AffiChapitre est un composant client qui refait son propre fetch au mount. Résultat dans le HTML
  SSR : 0 chapitre rendu, juste un loader. Sur une œuvre à 1000 chapitres, c'est 1000 titres de
  chapitres + dates + URL qui n'atteignent jamais Google. C'est du long-tail SEO perdu en masse (par
  ex. quelqu'un cherchant "reincarnation strongest sword god chapitre 47" ne tombera jamais sur ta
  page).
  - En plus, ce fetch duplique celui déjà fait par page.js (qui passe pourtant initialChapitres au
  client). AffiChapitre ignore les chapitres déjà fournis et refait la requête.

  2. "Œuvres similaires" = 0 lien interne dans le SSR

  - Idem, ça part en useEffect côté client. Le HTML servi à Googlebot a 0 lien /oeuvre/... sortant. Tu
   rates le maillage interne entre œuvres, qui est probablement le facteur SEO le plus important pour
  un catalogue.

  3. Titre, og:title, keywords avec espace de tête

  - HTML rendu : <title> Reincarnation of the strongest sword god - Novel-Index</title> (espace au
  début), idem og:title et keywords. Le titre en BDD a une espace, jamais trimmé. À traiter dans la
  requête ou dans generateMetadata (oeuvre.titre.trim()).

  4. Schéma JSON-LD doublon et incohérent

  - layout.js émet un schéma (Book si type === "Roman" sinon CreativeWork) + reviews + breadcrumb.
  - page.js émet un autre schéma Book (toujours, peu importe le type) avec d'autres champs.
  - Sur l'URL testée, on a Book + CreativeWork pour la même entité → ambigüité, possible dilution.
  - En plus numberOfPages: chapitres.length = abus sémantique (le numberOfPages de schema.org
  représente des pages de livre, pas des chapitres). Google peut l'ignorer, mais ça envoie un mauvais
  signal.
  - Action : un seul JSON-LD principal, géré dans layout.js uniquement. Supprimer celui de page.js.

  5. Deux generateMetadata en concurrence

  - layout.js et page.js exportent tous deux generateMetadata. Next.js prend celui le plus profond
  (page.js). Le code de metadata du layout ne sert plus → mort, mais source de confusion. Le titre
  sortant utilise donc le format ${titre} - Novel-Index (page.js), pas le ${titre}${typeLabel} |
  Novel-Index du layout.
  - Action : centraliser dans layout.js et supprimer generateMetadata de page.js.

  6. Bug de regex sur le synopsis

  - Dans page.js:25 : str.replace(/\\r\\n|\\n|\\r/g, " ") et dans OeuvreClient.js:643 :
  .replace(/\\r\\n|\\n|\\r/g, "<br>"). Le double backslash matche le texte littéral \r\n, pas un saut
  de ligne réel. Donc les retours à la ligne du synopsis ne sont jamais convertis en <br> dans le
  rendu, ni nettoyés dans la meta description. À corriger : /\r?\n/g.

  7. Pas de redirection slug-canonique

  - /oeuvre/dff6s77limbn1gpejnj5lhjh-WRONGSLUG charge la même page que le bon slug. Duplicate content
  : tout slug valide colle, et chaque variante peut être indexée. À corriger : si
  slugify(oeuvre.titre) !== slugFromUrl, faire une 301 vers le slug canonique côté serveur.

  8. Folder [documentId]-[slug] → param literalement documentId]-[slug

  - Hack Next.js : la clé du param est le string littéral documentId]-[slug (c'est ce qu'on voit dans
  le code). Fonctionnel mais fragile. Mieux : un seul segment [slug] et parser le documentId à partir
  du préfixe.

  🟡 Contenu manquant pour enrichir le SEO

  C'est le cœur de ce que tu demandes. La page actuelle, dépouillée, fait à peine 300-400 mots
  indexables une fois HTML, scripts et boilerplate retirés. Pour ranker, il faut 600-1500 mots unique
  par page. Pistes :

  A. Sortir la liste des chapitres en SSR

  - Rendre côté serveur (depuis initialChapitres) au moins les 20 derniers + les 20 premiers chapitres
   avec : numéro + titre + date + lien externe + rel="noopener nofollow" (puisqu'externe). Le reste
  peut rester en client. Ça ajoute des centaines de mots utiles + des dates fraîches (signal de
  fraîcheur).

  B. Bloc "À propos de cette œuvre" éditorial unique

  - Section longue (200-400 mots) générée à partir des champs : type, genre dominant, public cible,
  ambiance, équivalences ("si tu as aimé X, tu aimeras…"). Peut être rédigée à la main ou semi-générée
   par un LLM puis revue. Un seul paragraphe générique de 150 mots pour les œuvres "vides" en synopsis
   évite de servir des pages quasi-vides.

  C. FAQ structurée avec FAQPage schema

  - Questions type : "Combien de chapitres ?", "Statut de la traduction ?", "Où lire ?", "Œuvre
  licenciée ?", "Date de publication ?", "Auteur original ?". Génère des rich results Google
  (accordion direct dans la SERP).

  D. Section "Statistiques" visible

  - Nombre de chapitres, durée de lecture estimée, date du premier/dernier chapitre, fréquence de
  publication. Tu calcules déjà tout ça dans OeuvreClient mais c'est minuscule visuellement. Élargir.

  E. Auteur lié

  - oeuvre.auteur est juste du texte. Si tu peux créer une route /auteur/[slug], ça crée un nouveau
  hub interne et tu peux lister toutes les œuvres du même auteur. Énorme pour le maillage.

  F. Œuvres similaires SSR

  - Même requête, mais côté serveur dans page.js, et passer initialSimilar au client. Ces 5-6 liens
  internes par page sont du jus PageRank gratuit.

  G. Translator/Team SSR

  - Le bloc team est fetché client-side. Le déplacer en SSR. Le lien /Teams/{id}-{slug} est un autre
  maillage interne perdu actuellement.

  H. Reviews/notes

  - Si tu peux ajouter un système de notes (juste 1-5 étoiles), tu débloques aggregateRating dans le
  JSON-LD → étoiles dans la SERP. Énorme effet sur le CTR.

  I. Tags et genres SSR (vérifier)

  - Sur l'œuvre testée, le HTML SSR a 0 lien /tags-genres/. Soit l'œuvre n'en a pas (à vérifier en
  BDD), soit la populate Strapi n'arrive pas. À tester sur une œuvre qui a clairement des genres.

  🟠 Optimisations techniques SEO

  Performance / Core Web Vitals

  - OeuvreClient enchaîne 6 useEffect au mount (user, enrichments, abonnement, lastChecked, share
  menu, dernier chapitre). Pour un visiteur non-authentifié (cas typique d'un crawler ou d'un nouveau
  visiteur), les checks JWT/abonnement partent quand même puis no-op. Ils alourdissent l'hydration.
  - AffiChapitre re-fetch inutile (cf. critique #1). À supprimer.
  - og:image sans dimensions → ajouter og:image:width / og:image:height (Cloudinary les fournit).
  - twitter:description absent du HTML SSR. À ajouter.

  Maillage interne

  - Pas de section "Voir aussi par genre principal" (par ex. "Plus d'œuvres en Web novel"). Une simple
   grille de 5 œuvres SSR du même type/genre = +5 liens internes.
  - Pas de lien vers une page parente type catalogue genre principal.

  Sitemap

  - Vérifier que next-sitemap.config.js génère bien un sitemap qui liste toutes les œuvres avec leur
  lastmod (basé sur la date du dernier chapitre, pas sur updatedAt de l'œuvre sinon les œuvres ne
  signalent jamais leur fraîcheur quand un nouveau chapitre tombe).

  Robots / Indexation

  - Penser à déclarer une politique noindex ciblée pour les pages d'œuvres qui ont 0 chapitre ou un
  synopsis < 50 caractères, sinon Google va indexer des pages quasi-vides et baisser la qualité
  globale du domaine.

  ⚡ Quick wins (impact / effort)

  ┌─────┬─────────────────────────────────────────────────────────┬──────────────┬───────────────┐
  │  #  │                         Action                          │    Effort    │    Impact     │
  ├─────┼─────────────────────────────────────────────────────────┼──────────────┼───────────────┤
  │ 1   │ Supprimer le fetch redondant d'AffiChapitre, utiliser   │ XS           │ M             │
  │     │ initialChapitres                                        │              │               │
  ├─────┼─────────────────────────────────────────────────────────┼──────────────┼───────────────┤
  │ 2   │ Trimmer oeuvre.titre dans metadata + h1                 │ XS           │ S             │
  ├─────┼─────────────────────────────────────────────────────────┼──────────────┼───────────────┤
  │ 3   │ Fixer la regex /\r?\n/g (synopsis affiché + meta)       │ XS           │ S             │
  ├─────┼─────────────────────────────────────────────────────────┼──────────────┼───────────────┤
  │ 4   │ Centraliser metadata + JSON-LD dans layout.js, retirer  │ S            │ M             │
  │     │ le doublon de page.js                                   │              │               │
  ├─────┼─────────────────────────────────────────────────────────┼──────────────┼───────────────┤
  │ 5   │ Rendre la liste des 20 derniers chapitres en SSR        │ S            │ L             │
  ├─────┼─────────────────────────────────────────────────────────┼──────────────┼───────────────┤
  │ 6   │ Passer similarOeuvres et team en SSR via page.js        │ S            │ L             │
  ├─────┼─────────────────────────────────────────────────────────┼──────────────┼───────────────┤
  │ 7   │ Ajouter une redirection 301 quand le slug ne matche pas │ S            │ M             │
  ├─────┼─────────────────────────────────────────────────────────┼──────────────┼───────────────┤
  │ 8   │ Bloc FAQ + FAQPage JSON-LD                              │ M            │ L             │
  ├─────┼─────────────────────────────────────────────────────────┼──────────────┼───────────────┤
  │ 9   │ Bloc éditorial "À propos" 200 mots                      │ M            │ L             │
  │     │                                                         │ (rédaction)  │               │
  ├─────┼─────────────────────────────────────────────────────────┼──────────────┼───────────────┤
  │ 10  │ Système de notes + aggregateRating JSON-LD              │ L            │ XL (étoiles   │
  │     │                                                         │              │ SERP)         │
  └─────┴─────────────────────────────────────────────────────────┴──────────────┴───────────────┘

  Ce que je recommanderais en priorité

  Sprint 1 (gros levier, peu d'effort) : #1, #5, #6, #4. Tu fais passer le HTML SSR de ~300 mots
  utiles à ~800-1500, tu débloques le maillage interne (similar + team), tu nettoies le schema. C'est
  probablement 3-4h de boulot et l'impact est mesurable en quelques semaines une fois recrawlé.

  Sprint 2 (qualité / éditorial) : #8 + #9. Là tu commences à ranker sur des longues traînes ("est-ce
  que XXX est licencié ?", "résumé de YYY", "qui traduit ZZZ"). Ce travail-là est aussi celui qui te
  différencie d'un simple agrégateur.

  Sprint 3 (signaux qualité) : #10 (notes/aggregateRating). C'est ce qui te fait gagner du CTR avec
  les étoiles dans la SERP.

  Je peux commencer par n'importe lequel quand tu veux — dis-moi par où on attaque.

✻ Churned for 5m 8s · 1 shell still running

※ recap: On enrichit le SEO des pages d'œuvre (`/oeuvre/[id]-[slug]`) après avoir audité le SSR et le
  code. Prochaine étape : choisir par quel sprint commencer, je recommande le Sprint 1 (chapitres +
  similaires + team en SSR, schema dédupliqué).

──────────────────────────────────────────────────────────────────────────────────────────────────────
❯ 
──────────────────────────────────────────────────────────────────────────────────────────────────────
  ⏵⏵ accept edits on · 1 shell · ↓ to manage
  │ 10  │ Système de notes + aggregateRating JSON-LD                             │ L            │ XL (étoiles      │
  │     │                                                                        │              │ SERP)            │
  └─────┴────────────────────────────────────────────────────────────────────────┴──────────────┴──────────────────┘

  Ce que je recommanderais en priorité

  Sprint 1 (gros levier, peu d'effort) : #1, #5, #6, #4. Tu fais passer le HTML SSR de ~300 mots utiles à ~800-1500, tu
  débloques le maillage interne (similar + team), tu nettoies le schema. C'est probablement 3-4h de boulot et l'impact
  est mesurable en quelques semaines une fois recrawlé.

  Sprint 2 (qualité / éditorial) : #8 + #9. Là tu commences à ranker sur des longues traînes ("est-ce que XXX est
  licencié ?", "résumé de YYY", "qui traduit ZZZ"). Ce travail-là est aussi celui qui te différencie d'un simple
  agrégateur.

  Sprint 3 (signaux qualité) : #10 (notes/aggregateRating). C'est ce qui te fait gagner du CTR avec les étoiles dans la
  SERP.

  Je peux commencer par n'importe lequel quand tu veux — dis-moi par où on attaque.

✻ Churned for 5m 8s · 1 shell still running

※ recap: On enrichit le SEO des pages d'œuvre (`/oeuvre/[id]-[slug]`) après avoir audité le SSR et le code. Prochaine
  étape : choisir par quel sprint commencer, je recommande le Sprint 1 (chapitres + similaires + team en SSR, schema
  dédupliqué).

────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
❯ 
────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
  ⏵⏵ accept edits on · 1 shell · ↓ to manage
  - Penser à déclarer une politique noindex ciblée pour les pages d'œuvres qui ont 0 chapitre ou un synopsis < 50 caractères, sinon Google va indexer des pages quasi-vides et baisser la qualité globale du
  domaine.

  ⚡ Quick wins (impact / effort)

  ┌─────┬──────────────────────────────────────────────────────────────────────────────┬───────────────┬───────────────────┐
  │  #  │                                    Action                                    │    Effort     │      Impact       │
  ├─────┼──────────────────────────────────────────────────────────────────────────────┼───────────────┼───────────────────┤
  │ 1   │ Supprimer le fetch redondant d'AffiChapitre, utiliser initialChapitres       │ XS            │ M                 │
  ├─────┼──────────────────────────────────────────────────────────────────────────────┼───────────────┼───────────────────┤
  │ 2   │ Trimmer oeuvre.titre dans metadata + h1                                      │ XS            │ S                 │
  ├─────┼──────────────────────────────────────────────────────────────────────────────┼───────────────┼───────────────────┤
  │ 3   │ Fixer la regex /\r?\n/g (synopsis affiché + meta)                            │ XS            │ S                 │
  ├─────┼──────────────────────────────────────────────────────────────────────────────┼───────────────┼───────────────────┤
  │ 4   │ Centraliser metadata + JSON-LD dans layout.js, retirer le doublon de page.js │ S             │ M                 │
  ├─────┼──────────────────────────────────────────────────────────────────────────────┼───────────────┼───────────────────┤
  │ 5   │ Rendre la liste des 20 derniers chapitres en SSR                             │ S             │ L                 │
  ├─────┼──────────────────────────────────────────────────────────────────────────────┼───────────────┼───────────────────┤
  │ 6   │ Passer similarOeuvres et team en SSR via page.js                             │ S             │ L                 │
  ├─────┼──────────────────────────────────────────────────────────────────────────────┼───────────────┼───────────────────┤
  │ 7   │ Ajouter une redirection 301 quand le slug ne matche pas                      │ S             │ M                 │
  ├─────┼──────────────────────────────────────────────────────────────────────────────┼───────────────┼───────────────────┤
  │ 8   │ Bloc FAQ + FAQPage JSON-LD                                                   │ M             │ L                 │
  ├─────┼──────────────────────────────────────────────────────────────────────────────┼───────────────┼───────────────────┤
  │ 9   │ Bloc éditorial "À propos" 200 mots                                           │ M (rédaction) │ L                 │
  ├─────┼──────────────────────────────────────────────────────────────────────────────┼───────────────┼───────────────────┤
  │ 10  │ Système de notes + aggregateRating JSON-LD                                   │ L             │ XL (étoiles SERP) │
  └─────┴──────────────────────────────────────────────────────────────────────────────┴───────────────┴───────────────────┘

  Ce que je recommanderais en priorité

  Sprint 1 (gros levier, peu d'effort) : #1, #5, #6, #4. Tu fais passer le HTML SSR de ~300 mots utiles à ~800-1500, tu débloques le maillage interne (similar + team), tu nettoies le schema. C'est probablement
   3-4h de boulot et l'impact est mesurable en quelques semaines une fois recrawlé.

  Sprint 2 (qualité / éditorial) : #8 + #9. Là tu commences à ranker sur des longues traînes ("est-ce que XXX est licencié ?", "résumé de YYY", "qui traduit ZZZ"). Ce travail-là est aussi celui qui te
  différencie d'un simple agrégateur.

  Sprint 3 (signaux qualité) : #10 (notes/aggregateRating). C'est ce qui te fait gagner du CTR avec les étoiles dans la SERP.

  Je peux commencer par n'importe lequel quand tu veux — dis-moi par où on attaque.

✻ Churned for 5m 8s · 1 shell still running

※ recap: On enrichit le SEO des pages d'œuvre (`/oeuvre/[id]-[slug]`) après avoir audité le SSR et le code. Prochaine étape : choisir par quel sprint commencer, je recommande le Sprint 1 (chapitres +
  similaires + team en SSR, schema dédupliqué).

❯ va y , fait, on va voir ce que ca fait.

* Prestidigitating… (27s · still thinking)
         i  t              still thinking
────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
─────────────────────────────────────────────────────────────────────────────────────────
❯ 
────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
─────────────────────────────────────────────────────────────────────────────────────────
  ⏵⏵ accept edits on · 1 shell · esc to interrupt · ↓ to manage
     ---
     … +4 lines (ctrl+o to expand)

  Searched for 1 pattern (ctrl+o to expand)

● Analyse complète. J'ai croisé le code des fichiers (page.js, layout.js, OeuvreClient.js, Affichapitre.js) avec ce que
  le crawler reçoit réellement (HTML SSR de l'URL fournie).

  Analyse SEO des pages d'œuvre

  🟢 Ce qui est en place (à conserver)

  - SSR + metadata côté serveur : generateMetadata + canonical correct (https://www.novel-index.com/oeuvre/{id}-{slug}).
  - Open Graph + Twitter Card présents avec image cover.
  - JSON-LD : Book, CreativeWork, BreadcrumbList, Review, WebSite/SearchAction (10 blocs).
  - H1 unique = titre de l'œuvre. Lang fr + og:locale fr_FR.
  - Synopsis dans le HTML SSR (les crawlers le voient).
  - Cover en priority (LCP).
  - Cache fetch dédupliqué entre layout et metadata via cache(getOeuvre) — bonne pratique.

  🔴 Problèmes critiques (gaspillent ton SEO actuel)

  1. La liste des chapitres est invisible au crawler

  - AffiChapitre est un composant client qui refait son propre fetch au mount. Résultat dans le HTML SSR : 0 chapitre
  rendu, juste un loader. Sur une œuvre à 1000 chapitres, c'est 1000 titres de chapitres + dates + URL qui n'atteignent
  jamais Google. C'est du long-tail SEO perdu en masse (par ex. quelqu'un cherchant "reincarnation strongest sword god
  chapitre 47" ne tombera jamais sur ta page).
  - En plus, ce fetch duplique celui déjà fait par page.js (qui passe pourtant initialChapitres au client). AffiChapitre
   ignore les chapitres déjà fournis et refait la requête.

  2. "Œuvres similaires" = 0 lien interne dans le SSR

  - Idem, ça part en useEffect côté client. Le HTML servi à Googlebot a 0 lien /oeuvre/... sortant. Tu rates le maillage
   interne entre œuvres, qui est probablement le facteur SEO le plus important pour un catalogue.

  3. Titre, og:title, keywords avec espace de tête

  - HTML rendu : <title> Reincarnation of the strongest sword god - Novel-Index</title> (espace au début), idem og:title
   et keywords. Le titre en BDD a une espace, jamais trimmé. À traiter dans la requête ou dans generateMetadata
  (oeuvre.titre.trim()).

  4. Schéma JSON-LD doublon et incohérent

  - layout.js émet un schéma (Book si type === "Roman" sinon CreativeWork) + reviews + breadcrumb.
  - page.js émet un autre schéma Book (toujours, peu importe le type) avec d'autres champs.
  - Sur l'URL testée, on a Book + CreativeWork pour la même entité → ambigüité, possible dilution.
  - En plus numberOfPages: chapitres.length = abus sémantique (le numberOfPages de schema.org représente des pages de
  livre, pas des chapitres). Google peut l'ignorer, mais ça envoie un mauvais signal.
  - Action : un seul JSON-LD principal, géré dans layout.js uniquement. Supprimer celui de page.js.

  5. Deux generateMetadata en concurrence

  - layout.js et page.js exportent tous deux generateMetadata. Next.js prend celui le plus profond (page.js). Le code de
   metadata du layout ne sert plus → mort, mais source de confusion. Le titre sortant utilise donc le format ${titre} -
  Novel-Index (page.js), pas le ${titre}${typeLabel} | Novel-Index du layout.
  - Action : centraliser dans layout.js et supprimer generateMetadata de page.js.

  6. Bug de regex sur le synopsis

  - Dans page.js:25 : str.replace(/\\r\\n|\\n|\\r/g, " ") et dans OeuvreClient.js:643 : .replace(/\\r\\n|\\n|\\r/g,
  "<br>"). Le double backslash matche le texte littéral \r\n, pas un saut de ligne réel. Donc les retours à la ligne du
  synopsis ne sont jamais convertis en <br> dans le rendu, ni nettoyés dans la meta description. À corriger : /\r?\n/g.

  7. Pas de redirection slug-canonique

  - /oeuvre/dff6s77limbn1gpejnj5lhjh-WRONGSLUG charge la même page que le bon slug. Duplicate content : tout slug valide
   colle, et chaque variante peut être indexée. À corriger : si slugify(oeuvre.titre) !== slugFromUrl, faire une 301
  vers le slug canonique côté serveur.

  8. Folder [documentId]-[slug] → param literalement documentId]-[slug

  - Hack Next.js : la clé du param est le string littéral documentId]-[slug (c'est ce qu'on voit dans le code).
  Fonctionnel mais fragile. Mieux : un seul segment [slug] et parser le documentId à partir du préfixe.

  🟡 Contenu manquant pour enrichir le SEO

  C'est le cœur de ce que tu demandes. La page actuelle, dépouillée, fait à peine 300-400 mots indexables une fois HTML,
   scripts et boilerplate retirés. Pour ranker, il faut 600-1500 mots unique par page. Pistes :

  A. Sortir la liste des chapitres en SSR

  - Rendre côté serveur (depuis initialChapitres) au moins les 20 derniers + les 20 premiers chapitres avec : numéro +
  titre + date + lien externe + rel="noopener nofollow" (puisqu'externe). Le reste peut rester en client. Ça ajoute des
  centaines de mots utiles + des dates fraîches (signal de fraîcheur).

  B. Bloc "À propos de cette œuvre" éditorial unique

  - Section longue (200-400 mots) générée à partir des champs : type, genre dominant, public cible, ambiance,
  équivalences ("si tu as aimé X, tu aimeras…"). Peut être rédigée à la main ou semi-générée par un LLM puis revue. Un
  seul paragraphe générique de 150 mots pour les œuvres "vides" en synopsis évite de servir des pages quasi-vides.

  C. FAQ structurée avec FAQPage schema

  - Questions type : "Combien de chapitres ?", "Statut de la traduction ?", "Où lire ?", "Œuvre licenciée ?", "Date de
  publication ?", "Auteur original ?". Génère des rich results Google (accordion direct dans la SERP).

  D. Section "Statistiques" visible

  - Nombre de chapitres, durée de lecture estimée, date du premier/dernier chapitre, fréquence de publication. Tu
  calcules déjà tout ça dans OeuvreClient mais c'est minuscule visuellement. Élargir.

  E. Auteur lié

  - oeuvre.auteur est juste du texte. Si tu peux créer une route /auteur/[slug], ça crée un nouveau hub interne et tu
  peux lister toutes les œuvres du même auteur. Énorme pour le maillage.

  F. Œuvres similaires SSR

  - Même requête, mais côté serveur dans page.js, et passer initialSimilar au client. Ces 5-6 liens internes par page
  sont du jus PageRank gratuit.

  G. Translator/Team SSR

  - Le bloc team est fetché client-side. Le déplacer en SSR. Le lien /Teams/{id}-{slug} est un autre maillage interne
  perdu actuellement.

  H. Reviews/notes

  - Si tu peux ajouter un système de notes (juste 1-5 étoiles), tu débloques aggregateRating dans le JSON-LD → étoiles
  dans la SERP. Énorme effet sur le CTR.

  I. Tags et genres SSR (vérifier)

  - Sur l'œuvre testée, le HTML SSR a 0 lien /tags-genres/. Soit l'œuvre n'en a pas (à vérifier en BDD), soit la
  populate Strapi n'arrive pas. À tester sur une œuvre qui a clairement des genres.

  🟠 Optimisations techniques SEO

  Performance / Core Web Vitals

  - OeuvreClient enchaîne 6 useEffect au mount (user, enrichments, abonnement, lastChecked, share menu, dernier
  chapitre). Pour un visiteur non-authentifié (cas typique d'un crawler ou d'un nouveau visiteur), les checks
  JWT/abonnement partent quand même puis no-op. Ils alourdissent l'hydration.
  - AffiChapitre re-fetch inutile (cf. critique #1). À supprimer.
  - og:image sans dimensions → ajouter og:image:width / og:image:height (Cloudinary les fournit).
  - twitter:description absent du HTML SSR. À ajouter.

  Maillage interne

  - Pas de section "Voir aussi par genre principal" (par ex. "Plus d'œuvres en Web novel"). Une simple grille de 5
  œuvres SSR du même type/genre = +5 liens internes.
  - Pas de lien vers une page parente type catalogue genre principal.

  Sitemap

  - Vérifier que next-sitemap.config.js génère bien un sitemap qui liste toutes les œuvres avec leur lastmod (basé sur
  la date du dernier chapitre, pas sur updatedAt de l'œuvre sinon les œuvres ne signalent jamais leur fraîcheur quand un
   nouveau chapitre tombe).

  Robots / Indexation

  - Penser à déclarer une politique noindex ciblée pour les pages d'œuvres qui ont 0 chapitre ou un synopsis < 50
  caractères, sinon Google va indexer des pages quasi-vides et baisser la qualité globale du domaine.

  ⚡ Quick wins (impact / effort)

  ┌─────┬────────────────────────────────────────────────────────────────────────┬──────────────┬──────────────────┐
  │  #  │                                 Action                                 │    Effort    │      Impact      │
  ├─────┼────────────────────────────────────────────────────────────────────────┼──────────────┼──────────────────┤
  │ 1   │ Supprimer le fetch redondant d'AffiChapitre, utiliser initialChapitres │ XS           │ M                │
  ├─────┼────────────────────────────────────────────────────────────────────────┼──────────────┼──────────────────┤
  │ 2   │ Trimmer oeuvre.titre dans metadata + h1                                │ XS           │ S                │
  ├─────┼────────────────────────────────────────────────────────────────────────┼──────────────┼──────────────────┤
  │ 3   │ Fixer la regex /\r?\n/g (synopsis affiché + meta)                      │ XS           │ S                │
  ├─────┼────────────────────────────────────────────────────────────────────────┼──────────────┼──────────────────┤
  │ 4   │ Centraliser metadata + JSON-LD dans layout.js, retirer le doublon de   │ S            │ M                │
  │     │ page.js                                                                │              │                  │
  ├─────┼────────────────────────────────────────────────────────────────────────┼──────────────┼──────────────────┤
  │ 5   │ Rendre la liste des 20 derniers chapitres en SSR                       │ S            │ L                │
  ├─────┼────────────────────────────────────────────────────────────────────────┼──────────────┼──────────────────┤
  │ 6   │ Passer similarOeuvres et team en SSR via page.js                       │ S            │ L                │
  ├─────┼────────────────────────────────────────────────────────────────────────┼──────────────┼──────────────────┤
  │ 7   │ Ajouter une redirection 301 quand le slug ne matche pas                │ S            │ M                │
  ├─────┼────────────────────────────────────────────────────────────────────────┼──────────────┼──────────────────┤
  │ 8   │ Bloc FAQ + FAQPage JSON-LD                                             │ M            │ L                │
  ├─────┼────────────────────────────────────────────────────────────────────────┼──────────────┼──────────────────┤
  │ 9   │ Bloc éditorial "À propos" 200 mots                                     │ M            │ L                │
  │     │                                                                        │ (rédaction)  │                  │
  ├─────┼────────────────────────────────────────────────────────────────────────┼──────────────┼──────────────────┤
  │ 10  │ Système de notes + aggregateRating JSON-LD                             │ L            │ XL (étoiles      │
  │     │                                                                        │              │ SERP)            │
  └─────┴────────────────────────────────────────────────────────────────────────┴──────────────┴──────────────────┘

  Ce que je recommanderais en priorité

  Sprint 1 (gros levier, peu d'effort) : #1, #5, #6, #4. Tu fais passer le HTML SSR de ~300 mots utiles à ~800-1500, tu
  débloques le maillage interne (similar + team), tu nettoies le schema. C'est probablement 3-4h de boulot et l'impact
  est mesurable en quelques semaines une fois recrawlé.

  Sprint 2 (qualité / éditorial) : #8 + #9. Là tu commences à ranker sur des longues traînes ("est-ce que XXX est
  licencié ?", "résumé de YYY", "qui traduit ZZZ"). Ce travail-là est aussi celui qui te différencie d'un simple
  agrégateur.

  Sprint 3 (signaux qualité) : #10 (notes/aggregateRating). C'est ce qui te fait gagner du CTR avec les étoiles dans la
  SERP.

  Je peux commencer par n'importe lequel quand tu veux — dis-moi par où on attaque.

✻ Churned for 5m 8s · 1 shell still running

※ recap: On enrichit le SEO des pages d'œuvre (`/oeuvre/[id]-[slug]`) après avoir audité le SSR et le code. Prochaine
  étape : choisir par quel sprint commencer, je recommande le Sprint 1 (chapitres + similaires + team en SSR, schema
  dédupliqué).

❯ va y , fait, on va voir ce que ca fait.

● Sprint 1 lancé. Je récupère le reste d'Affichapitre.js puis j'attaque les modifs.

  Read 1 file (ctrl+o to expand)

● OK, j'attaque Sprint 1. 4 fichiers à modifier dans cet ordre : Affichapitre.js → OeuvreClient.js → page.js →
  layout.js.

  1/4 — Affichapitre.js : accepte initialChapitres, plus de fetch redondant

● Update(novel-index-v2-project\src\app\components\Affichapitre.js)
  ⎿  Added 34 lines, removed 48 lines
       2
       3  import React, { useState, useEffect } from "react";
       4  import { motion, AnimatePresence } from "framer-motion";
       5 -const AffiChapitre = ({ documentId, licence, totalChapitres }) => {
       6 -  const [items, setItems] = useState([]);
       7 -  const [filteredItems, setFilteredItems] = useState([]);
       5 +const mapAndSortItems = (raw, licence) => {
       6 +  const mapped = (raw || []).map((it) =>
       7 +    licence
       8 +      ? { id: it.id, titre: it.titre, url: it.url, tome: it.tome, publishedAt: it.publishedAt, order: i
         +t.order || 0 }
       9 +      : { id: it.id, titre: it.titre, url: it.url, tome: it.tome, publishedAt: it.publishedAt, order: i
         +t.order || 0 }
      10 +  );
      11 +  const sorted = mapped.sort((a, b) => b.order - a.order);
      12 +  const today = new Date().toISOString().split("T")[0];
      13 +  return sorted.map((item) => ({
      14 +    ...item,
      15 +    isNew: item.publishedAt && new Date(item.publishedAt).toISOString().split("T")[0] === today,
      16 +  }));
      17 +};
      18 +
      19 +const AffiChapitre = ({ documentId, licence, totalChapitres, initialItems }) => {
      20 +  const itemsPerPage = 10;
      21 +  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      22 +  const seeded = Array.isArray(initialItems) ? mapAndSortItems(initialItems, licence) : null;
      23 +
      24 +  const [items, setItems] = useState(seeded || []);
      25 +  const [filteredItems, setFilteredItems] = useState(seeded || []);
      26    const [searchTerm, setSearchTerm] = useState("");
      27    const [error, setError] = useState(null);
      10 -  const [selectedItem, setSelectedItem] = useState(null); // Élément sélectionné pour le pop-up
      11 -  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      28 +  const [selectedItem, setSelectedItem] = useState(null);
      29    const [currentPage, setCurrentPage] = useState(1);
      13 -  const itemsPerPage = 10;
      14 -  const [totalPages, setTotalPages] = useState(1);
      30 +  const [totalPages, setTotalPages] = useState(seeded ? Math.max(1, Math.ceil(seeded.length / itemsPerP
         +age)) : 1);
      31    const [pageJump, setPageJump] = useState("");
      32
      17 -
      18 -
      33    useEffect(() => {
      34 +    if (seeded) return; // données déjà fournies par le SSR, pas de fetch
      35 +    if (!documentId) return;
      36 +
      37      const fetchData = async () => {
      38        try {
      39          const url = licence
      40            ? `${apiUrl}/api/oeuvres?filters[documentId][$eq]=${documentId}&populate=achatlivres`
      41            : `${apiUrl}/api/oeuvres?filters[documentId][$eq]=${documentId}&populate=chapitres`;
      25 -
      42 +
      43          const res = await fetch(url);
      44          const data = await res.json();
      28 -
      45          const oeuvre = data.data?.[0];
      46
      47          if (!oeuvre) {
      32 -          console.warn("⛔ Aucune œuvre trouvée !");
      48            setItems([]);
      49            setFilteredItems([]);
      50            setTotalPages(1);
      51            return;
      52          }
      38 -
      39 -        const fetchedItems = licence
      40 -          ? (oeuvre.achatlivres || []).map((achat) => ({
      41 -              id: achat.id,
      42 -              titre: achat.titre,
      43 -              url: achat.url,
      44 -              tome: achat.tome,
      45 -              publishedAt: achat.publishedAt,
      46 -              order: achat.order || 0,
      47 -            }))
      48 -          : (oeuvre.chapitres || []).map((chapitre) => ({
      49 -              id: chapitre.id,
      50 -              titre: chapitre.titre,
      51 -              url: chapitre.url,
      52 -              tome: chapitre.tome,
      53 -              publishedAt: chapitre.publishedAt,
      54 -              order: chapitre.order || 0,
      55 -            }));
      56 -
      57 -        const sortedItems = fetchedItems.sort((a, b) => b.order - a.order);
      58 -
      59 -        const today = new Date().toISOString().split("T")[0];
      60 -        const itemsWithNewFlag = sortedItems.map((item) => ({
      61 -          ...item,
      62 -          isNew:
      63 -            item.publishedAt &&
      64 -            new Date(item.publishedAt).toISOString().split("T")[0] === today,
      65 -        }));
      66 -
      53 +
      54 +        const raw = licence ? oeuvre.achatlivres : oeuvre.chapitres;
      55 +        const itemsWithNewFlag = mapAndSortItems(raw, licence);
      56          setItems(itemsWithNewFlag);
      57          setFilteredItems(itemsWithNewFlag);
      69 -        setTotalPages(Math.ceil(itemsWithNewFlag.length / itemsPerPage));
      58 +        setTotalPages(Math.max(1, Math.ceil(itemsWithNewFlag.length / itemsPerPage)));
      59        } catch (err) {
      60          console.error("Erreur lors de la récupération des données :", err);
      61          setError("Impossible de charger les données.");
      62        }
      63      };
      64 +
      65 +    fetchData();
      66 +  }, [documentId, licence, apiUrl, seeded]);
      67
      76 -    if (documentId) {
      77 -      fetchData();
      78 -    } else {
      79 -    }
      80 -  }, [documentId, licence]);
      68
      82 -
      69
      70    const handleSearch = (e) => {
      71      const term = e.target.value.toLowerCase();

● 2/4 — OeuvreClient.js : props initiales SSR + plus de fetch enrichissements

● Update(novel-index-v2-project\src\app\oeuvre\[documentId]-[slug]\OeuvreClient.js)
  ⎿  Added 11 lines, removed 4 lines
      19  import { motion, AnimatePresence } from "framer-motion";
      20  import { FiShare2, FiCopy, FiCheck, FiClock, FiUsers, FiBookOpen, FiCalendar, FiTrendingUp } from "reac
          t-icons/fi";
      21
      22 -export default function OeuvreClient({ initialOeuvre, initialChapitres, documentId }) {
      22 +export default function OeuvreClient({
      23 +  initialOeuvre,
      24 +  initialChapitres,
      25 +  documentId,
      26 +  initialTeam = null,
      27 +  initialSimilar = [],
      28 +  initialSubscribers = 0,
      29 +}) {
      30    const router = useRouter();
      31    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      32
     ...
      39    const [showAllGenres, setShowAllGenres] = useState(false);
      40    const [user, setUser] = useState(null);
      41
      35 -  const [team, setTeam] = useState(null);
      36 -  const [subscribersCount, setSubscribersCount] = useState(0);
      37 -  const [similarOeuvres, setSimilarOeuvres] = useState([]);
      42 +  const [team] = useState(initialTeam);
      43 +  const [subscribersCount] = useState(initialSubscribers);
      44 +  const [similarOeuvres] = useState(initialSimilar);
      45    const [lastChapterDate, setLastChapterDate] = useState(null);
      46    const [showShareMenu, setShowShareMenu] = useState(false);
      47    const [copied, setCopied] = useState(false);

● Update(novel-index-v2-project\src\app\oeuvre\[documentId]-[slug]\OeuvreClient.js)
  ⎿  Added 1 line, removed 36 lines
       81      fetchUser();
       82    }, [apiUrl]);
       83
       84 -  useEffect(() => {
       85 -    if (!oeuvre) return;
       84 +  // team / similar / subscribersCount sont fournis par le SSR (page.js) — plus de fetch côté client.
       85
       87 -    const fetchEnrichments = async () => {
       88 -      try {
       89 -        const [teamRes, subscribersRes, similarRes] = await Promise.all([
       90 -          oeuvre.traduction
       91 -            ? fetch(`${apiUrl}/api/teams?filters[titre][$eqi]=${encodeURIComponent(oeuvre.traduction)}
          -&populate=couverture&pagination[limit]=1`)
       92 -            : Promise.resolve({ json: () => ({ data: [] }) }),
       93 -          fetch(`${apiUrl}/api/checkoeuvretimes?filters[oeuvres][documentId][$eq]=${oeuvre.documentId}
          -&pagination[limit]=1`),
       94 -          oeuvre.genres?.length > 0
       95 -            ? fetch(`${apiUrl}/api/oeuvres?populate=couverture&filters[genres][titre][$in]=${oeuvre.ge
          -nres.slice(0, 3).map(g => encodeURIComponent(g.titre)).join(',')}&filters[documentId][$ne]=${oeuvre.do
          -cumentId}&pagination[limit]=6`)
       96 -            : Promise.resolve({ json: () => ({ data: [] }) })
       97 -        ]);
       98 -
       99 -        const [teamData, subscribersData, similarData] = await Promise.all([
      100 -          teamRes.json ? teamRes.json() : { data: [] },
      101 -          subscribersRes.json(),
      102 -          similarRes.json ? similarRes.json() : { data: [] }
      103 -        ]);
      104 -
      105 -        if (teamData.data?.[0]) {
      106 -          setTeam(teamData.data[0]);
      107 -        }
      108 -
      109 -        setSubscribersCount(subscribersData.meta?.pagination?.total || 0);
      110 -
      111 -        const similaires = (similarData.data || []).filter(o => o.documentId !== oeuvre.documentId);
      112 -        setSimilarOeuvres(similaires.slice(0, 5));
      113 -      } catch (err) {
      114 -        console.error("Erreur enrichissements:", err);
      115 -      }
      116 -    };
      117 -
      118 -    fetchEnrichments();
      119 -  }, [oeuvre, apiUrl]);
      120 -
       86    useEffect(() => {
       87      const checkAbonnement = async () => {
       88        const jwt = Cookies.get("jwt");

● Update(novel-index-v2-project\src\app\oeuvre\[documentId]-[slug]\OeuvreClient.js)
  ⎿  Added 2 lines, removed 1 line
      733            <AffiChapitre
      734              documentId={oeuvre.documentId}
      735              licence={oeuvre.licence}
      736 -            totalChapitres={chapitres.length}
      736 +            totalChapitres={oeuvre.licence ? (oeuvre.achatlivres?.length || 0) : chapitres.length}
      737 +            initialItems={oeuvre.licence ? oeuvre.achatlivres : chapitres}
      738            />
      739          </div>
      740

● Update(novel-index-v2-project\src\app\oeuvre\[documentId]-[slug]\OeuvreClient.js)
  ⎿  Added 1 line, removed 1 line
      612                style={{ whiteSpace: "pre-wrap" }}
      613                dangerouslySetInnerHTML={{
      614                  __html: sanitizeHtml(
      615 -                  oeuvre.synopsis.replace(/\\r\\n|\\n|\\r/g, "<br>")
      615 +                  oeuvre.synopsis.replace(/\r?\n/g, "<br>")
      616                  ),
      617                }}
      618              ></div>

● 3/4 — page.js : SSR pour team / similar / subscribers, suppression metadata + JsonLd doublons

● Write(novel-index-v2-project\src\app\oeuvre\[documentId]-[slug]\page.js)
  ⎿  Added 56 lines, removed 86 lines
       1  import { notFound } from "next/navigation";
       2 -import { slugify } from "@/utils/slugify";
       3 -import JsonLd from "../../components/JsonLd";
       2  import OeuvreClient from "./OeuvreClient";
       3
       4  const STRAPI = process.env.NEXT_PUBLIC_API_URL;
       7 -const SITE_URL = "https://www.novel-index.com";
       5
       6  async function fetchOeuvre(documentId) {
       7    try {
       8      const res = await fetch(
      12 -      `${STRAPI}/api/oeuvres/${documentId}?populate[0]=couverture&populate[1]=tags&populate[2]=genres&p
         -opulate[3]=chapitres&populate[4]=achatlivres`,
       9 +      `${STRAPI}/api/oeuvres/${documentId}?populate[0]=couverture&populate[1]=tags&populate[2]=genres&p
         +opulate[3]=chapitres&populate[4]=achatlivres&populate[5]=oeuvre_licence`,
      10        { next: { revalidate: 3600 } }
      11      );
      12      if (!res.ok) return null;
     ...
      17    }
      18  }
      19
      23 -function stripHtml(str) {
      24 -  if (!str) return "";
      25 -  return str.replace(/<[^>]*>/g, "").replace(/\\r\\n|\\n|\\r/g, " ").trim();
      20 +async function fetchTeam(traduction) {
      21 +  if (!traduction) return null;
      22 +  try {
      23 +    const res = await fetch(
      24 +      `${STRAPI}/api/teams?filters[titre][$eqi]=${encodeURIComponent(traduction)}&populate=couverture&p
         +agination[limit]=1`,
      25 +      { next: { revalidate: 3600 } }
      26 +    );
      27 +    if (!res.ok) return null;
      28 +    const data = await res.json();
      29 +    return data.data?.[0] || null;
      30 +  } catch {
      31 +    return null;
      32 +  }
      33  }
      34
      28 -function extractDocumentId(rawSegment) {
      29 -  const firstHyphen = rawSegment.indexOf("-");
      30 -  return firstHyphen > 0 ? rawSegment.substring(0, firstHyphen) : rawSegment;
      35 +async function fetchSimilar(genres, currentDocumentId) {
      36 +  if (!genres?.length) return [];
      37 +  try {
      38 +    const titres = genres.slice(0, 3).map((g) => encodeURIComponent(g.titre)).join(",");
      39 +    const res = await fetch(
      40 +      `${STRAPI}/api/oeuvres?populate=couverture&filters[genres][titre][$in]=${titres}&filters[document
         +Id][$ne]=${currentDocumentId}&pagination[limit]=6`,
      41 +      { next: { revalidate: 3600 } }
      42 +    );
      43 +    if (!res.ok) return [];
      44 +    const data = await res.json();
      45 +    return (data.data || []).filter((o) => o.documentId !== currentDocumentId).slice(0, 5);
      46 +  } catch {
      47 +    return [];
      48 +  }
      49  }
      50
      33 -export async function generateMetadata({ params }) {
      34 -  const resolvedParams = await params;
      35 -  const rawSegment = resolvedParams["documentId]-[slug"];
      36 -  const documentId = extractDocumentId(rawSegment);
      37 -  const oeuvre = await fetchOeuvre(documentId);
      38 -
      39 -  if (!oeuvre) {
      40 -    return { title: "Œuvre introuvable - Novel-Index" };
      51 +async function fetchSubscribersCount(documentId) {
      52 +  try {
      53 +    const res = await fetch(
      54 +      `${STRAPI}/api/checkoeuvretimes?filters[oeuvres][documentId][$eq]=${documentId}&pagination[limit]
         +=1`,
      55 +      { next: { revalidate: 600 } }
      56 +    );
      57 +    if (!res.ok) return 0;
      58 +    const data = await res.json();
      59 +    return data.meta?.pagination?.total || 0;
      60 +  } catch {
      61 +    return 0;
      62    }
      63 +}
      64
      43 -  const title = `${oeuvre.titre} - Novel-Index`;
      44 -  const rawSynopsis = stripHtml(oeuvre.synopsis);
      45 -  const description = rawSynopsis
      46 -    ? rawSynopsis.slice(0, 160) + (rawSynopsis.length > 160 ? "..." : "")
      47 -    : `Découvrez ${oeuvre.titre} sur Novel-Index — traduction française, chapitres, genres et informati
         -ons.`;
      48 -  const image = oeuvre.couverture?.url;
      49 -  const url = `${SITE_URL}/oeuvre/${documentId}-${slugify(oeuvre.titre)}`;
      50 -
      51 -  return {
      52 -    title,
      53 -    description,
      54 -    keywords: [
      55 -      oeuvre.titre,
      56 -      oeuvre.titrealt,
      57 -      oeuvre.type,
      58 -      oeuvre.auteur,
      59 -      ...(oeuvre.genres || []).map((g) => g.titre),
      60 -      "traduction française",
      61 -      "novel-index",
      62 -    ].filter(Boolean),
      63 -    alternates: {
      64 -      canonical: url,
      65 -    },
      66 -    openGraph: {
      67 -      title: oeuvre.titre,
      68 -      description,
      69 -      url,
      70 -      siteName: "Novel-Index",
      71 -      images: image ? [{ url: image, alt: oeuvre.titre }] : [],
      72 -      locale: "fr_FR",
      73 -      type: "article",
      74 -    },
      75 -    twitter: {
      76 -      card: image ? "summary_large_image" : "summary",
      77 -      title: oeuvre.titre,
      78 -      description,
      79 -      images: image ? [image] : [],
      80 -    },
      81 -  };
      65 +function extractDocumentId(rawSegment) {
      66 +  const firstHyphen = rawSegment.indexOf("-");
      67 +  return firstHyphen > 0 ? rawSegment.substring(0, firstHyphen) : rawSegment;
      68  }
      69
      70  export default async function OeuvrePage({ params }) {
     ...
       79
       80    const chapitres = (oeuvre.chapitres || []).sort((a, b) => a.order - b.order);
       81
       96 -  const jsonLd = {
       97 -    "@context": "https://schema.org",
       98 -    "@type": "Book",
       99 -    name: oeuvre.titre,
      100 -    alternateName: oeuvre.titrealt || undefined,
      101 -    author: oeuvre.auteur
      102 -      ? { "@type": "Person", name: oeuvre.auteur }
      103 -      : undefined,
      104 -    image: oeuvre.couverture?.url,
      105 -    description: stripHtml(oeuvre.synopsis)?.slice(0, 500),
      106 -    genre: (oeuvre.genres || []).map((g) => g.titre),
      107 -    inLanguage:
      108 -      oeuvre.langage === "Francais"
      109 -        ? "fr"
      110 -        : oeuvre.langage === "Anglais"
      111 -          ? "en"
      112 -          : "fr",
      113 -    url: `${SITE_URL}/oeuvre/${documentId}-${slugify(oeuvre.titre)}`,
      114 -    numberOfPages: chapitres.length > 0 ? chapitres.length : undefined,
      115 -    keywords: (oeuvre.tags || []).map((t) => t.titre).join(", ") || undefined,
      116 -  };
       82 +  const [team, similar, subscribers] = await Promise.all([
       83 +    fetchTeam(oeuvre.traduction),
       84 +    fetchSimilar(oeuvre.genres, oeuvre.documentId),
       85 +    fetchSubscribersCount(oeuvre.documentId),
       86 +  ]);
       87
       88    return (
      119 -    <>
      120 -      <JsonLd data={jsonLd} />
      121 -      <OeuvreClient
      122 -        initialOeuvre={oeuvre}
      123 -        initialChapitres={chapitres}
      124 -        documentId={documentId}
      125 -      />
      126 -    </>
       89 +    <OeuvreClient
       90 +      initialOeuvre={oeuvre}
       91 +      initialChapitres={chapitres}
       92 +      documentId={documentId}
       93 +      initialTeam={team}
       94 +      initialSimilar={similar}
       95 +      initialSubscribers={subscribers}
       96 +    />
       97    );
       98  }

● 4/4 — layout.js : metadata propre, JSON-LD unique et cohérent, genres dans keywords

✶ Prestidigitating… (3m 57s · ↓ 17.0k tokens · thought for 17s)
  ⎿  Tip: Use /btw to ask a quick side question without interrupting Claude's current work

────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
❯ 
────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
  ⏵⏵ accept edits on · 1 shell · esc to interrupt · ↓ to manage
      102 -      ? { "@type": "Person", name: oeuvre.auteur }
      103 -      : undefined,
      104 -    image: oeuvre.couverture?.url,
      105 -    description: stripHtml(oeuvre.synopsis)?.slice(0, 500),
      106 -    genre: (oeuvre.genres || []).map((g) => g.titre),
      107 -    inLanguage:
      108 -      oeuvre.langage === "Francais"
      109 -        ? "fr"
      110 -        : oeuvre.langage === "Anglais"
      111 -          ? "en"
      112 -          : "fr",
      113 -    url: `${SITE_URL}/oeuvre/${documentId}-${slugify(oeuvre.titre)}`,
      114 -    numberOfPages: chapitres.length > 0 ? chapitres.length : undefined,
      115 -    keywords: (oeuvre.tags || []).map((t) => t.titre).join(", ") || undefined,
      116 -  };
       82 +  const [team, similar, subscribers] = await Promise.all([
       83 +    fetchTeam(oeuvre.traduction),
       84 +    fetchSimilar(oeuvre.genres, oeuvre.documentId),
       85 +    fetchSubscribersCount(oeuvre.documentId),
       86 +  ]);
       87
       88    return (
      119 -    <>
      120 -      <JsonLd data={jsonLd} />
      121 -      <OeuvreClient
      122 -        initialOeuvre={oeuvre}
      123 -        initialChapitres={chapitres}
      124 -        documentId={documentId}
      125 -      />
      126 -    </>
       89 +    <OeuvreClient
       90 +      initialOeuvre={oeuvre}
       91 +      initialChapitres={chapitres}
       92 +      documentId={documentId}
       93 +      initialTeam={team}
       94 +      initialSimilar={similar}
       95 +      initialSubscribers={subscribers}
       96 +    />
       97    );
       98  }

● 4/4 — layout.js : metadata propre, JSON-LD unique et cohérent, genres dans keywords

● Write(novel-index-v2-project\src\app\oeuvre\[documentId]-[slug]\layout.js)
  ⎿  Added 147 lines, removed 134 lines
        2  import { slugify } from "@/utils/slugify";
        3  import JsonLd from "@/app/components/JsonLd";
        4
        5 -// Dédupliquer le fetch oeuvre entre generateMetadata et OeuvreLayout
        5 +const SITE_URL = "https://www.novel-index.com";
        6 +const FALLBACK_IMAGE = `${SITE_URL}/logo.png`;
        7 +
        8 +// Dédupliqué via React cache pour éviter les doubles fetchs entre generateMetadata et le rendu du layout.
        9  const getOeuvre = cache(async (id) => {
       10    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        8 -  const fetchUrl = `${apiUrl}/api/oeuvres/${id}?populate[0]=couverture&populate[1]=tags&populate[2]=genres`;
        9 -  const res = await fetch(fetchUrl, { next: { revalidate: 3600 } });
       11 +  const url = `${apiUrl}/api/oeuvres/${id}?populate[0]=couverture&populate[1]=tags&populate[2]=genres`;
       12 +  const res = await fetch(url, { next: { revalidate: 3600 } });
       13    if (!res.ok) return null;
       14    const data = await res.json();
       15    return data.data || null;
       16  });
       17
       15 -// ✅ SSR Metadata - Génération côté serveur
       18 +function stripHtml(str) {
       19 +  if (!str) return "";
       20 +  return str
       21 +    .replace(/<[^>]*>/g, " ")
       22 +    .replace(/\r?\n/g, " ")
       23 +    .replace(/\s+/g, " ")
       24 +    .trim();
       25 +}
       26 +
       27 +function getSegment(resolvedParams) {
       28 +  return (
       29 +    resolvedParams?.["documentId]-[slug"] ||
       30 +    resolvedParams?.documentId ||
       31 +    Object.values(resolvedParams || {})[0] ||
       32 +    null
       33 +  );
       34 +}
       35 +
       36  export async function generateMetadata({ params }) {
       37    try {
       38      const resolvedParams = await params;
       19 -
       20 -    // Next.js avec le dossier [documentId]-[slug] renvoie le segment complet
       21 -    const fullSegment = resolvedParams?.['documentId]-[slug'] ||
       22 -                        resolvedParams?.documentId ||
       23 -                        Object.values(resolvedParams || {})[0];
       24 -
       25 -    if (!fullSegment || typeof fullSegment !== 'string') {
       26 -      return {
       27 -        title: "Novel-Index",
       28 -        description: "Plateforme d'indexation collaborative.",
       29 -      };
       39 +    const fullSegment = getSegment(resolvedParams);
       40 +    if (!fullSegment || typeof fullSegment !== "string") {
       41 +      return { title: "Novel-Index", description: "Plateforme d'indexation collaborative." };
       42      }
       31 -
       32 -    // Extraire le documentId (partie avant le premier tiret)
       43 +
       44      const id = fullSegment.split("-")[0];
       34 -
       45      const oeuvre = await getOeuvre(id);
       46
       47      if (!oeuvre) {
       48        return {
       39 -        title: "Œuvre introuvable | Novel-Index",
       49 +        title: "Œuvre introuvable - Novel-Index",
       50          description: "Cette œuvre n'existe pas ou a été supprimée.",
       51        };
       52      }
       53
       44 -    const slug = slugify(oeuvre.titre);
       45 -    const canonicalUrl = `https://www.novel-index.com/oeuvre/${oeuvre.documentId}-${slug}`;
       54 +    const titre = (oeuvre.titre || "").trim();
       55      const typeLabel = oeuvre.type ? ` - ${oeuvre.type}` : "";
       47 -    const rawDesc = oeuvre.synopsis || "Découvrez cette œuvre sur Novel-Index.";
       48 -    const description = rawDesc.length > 155 ? rawDesc.substring(0, 152) + "..." : rawDesc;
       49 -    const imageUrl = oeuvre.couverture?.url || "https://www.novel-index.com/logo.png";
       56 +    const cleanSynopsis = stripHtml(oeuvre.synopsis);
       57 +    const description = cleanSynopsis
       58 +      ? cleanSynopsis.length > 155
       59 +        ? cleanSynopsis.slice(0, 152) + "..."
       60 +        : cleanSynopsis
       61 +      : `Découvrez ${titre} sur Novel-Index — traduction française, chapitres, genres et informations.`;
       62
       63 +    const slug = slugify(titre);
       64 +    const canonicalUrl = `${SITE_URL}/oeuvre/${oeuvre.documentId}-${slug}`;
       65 +    const cover = oeuvre.couverture;
       66 +    const imageUrl = cover?.url || FALLBACK_IMAGE;
       67 +    const imageWidth = cover?.width || 800;
       68 +    const imageHeight = cover?.height || 1200;
       69 +
       70 +    const keywords = [
       71 +      titre,
       72 +      (oeuvre.titrealt || "").trim() || null,
       73 +      oeuvre.type,
       74 +      (oeuvre.auteur || "").trim() || null,
       75 +      ...(oeuvre.genres || []).map((g) => g.titre),
       76 +      ...(oeuvre.tags || []).slice(0, 8).map((t) => t.titre),
       77 +      "traduction française",
       78 +      "novel-index",
       79 +    ].filter(Boolean);
       80 +
       81      return {
       52 -      title: `${oeuvre.titre}${typeLabel} | Novel-Index`,
       82 +      title: `${titre}${typeLabel} - Novel-Index`,
       83        description,
       54 -      alternates: {
       55 -        canonical: canonicalUrl,
       56 -      },
       84 +      keywords,
       85 +      alternates: { canonical: canonicalUrl },
       86        openGraph: {
       58 -        title: `${oeuvre.titre}${typeLabel} | Novel-Index`,
       87 +        title: `${titre}${typeLabel} | Novel-Index`,
       88          description,
       89          url: canonicalUrl,
       90          siteName: "Novel-Index",
       62 -        images: [{ url: imageUrl, alt: oeuvre.titre }],
       91 +        images: [
       92 +          {
       93 +            url: imageUrl,
       94 +            alt: titre,
       95 +            width: imageWidth,
       96 +            height: imageHeight,
       97 +          },
       98 +        ],
       99          locale: "fr_FR",
      100          type: "article",
      101        },
      102        twitter: {
      103          card: "summary_large_image",
       68 -        title: `${oeuvre.titre}${typeLabel} | Novel-Index`,
      104 +        title: `${titre}${typeLabel} | Novel-Index`,
      105          description,
      106          images: [imageUrl],
      107        },
      108      };
      109    } catch (error) {
      110      console.error("[Metadata] Erreur generateMetadata:", error);
       75 -    return {
       76 -      title: "Novel-Index",
       77 -      description: "Plateforme d'indexation collaborative.",
       78 -    };
      111 +    return { title: "Novel-Index", description: "Plateforme d'indexation collaborative." };
      112    }
      113  }
      114
      115  export default async function OeuvreLayout({ children, params }) {
       83 -  // Récupérer les données de l'œuvre pour le JSON-LD
      116    try {
      117      const resolvedParams = await params;
       86 -    const fullSegment = resolvedParams?.['documentId]-[slug'] ||
       87 -                        resolvedParams?.documentId ||
       88 -                        Object.values(resolvedParams || {})[0];
       89 -
       90 -    if (fullSegment && typeof fullSegment === 'string') {
      118 +    const fullSegment = getSegment(resolvedParams);
      119 +
      120 +    if (fullSegment && typeof fullSegment === "string") {
      121        const id = fullSegment.split("-")[0];
      122        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
       93 -
       94 -      // Utilise le cache dédupliqué — même fetch que generateMetadata
      123 +
      124        const oeuvre = await getOeuvre(id);
       96 -
       97 -        if (oeuvre) {
       98 -          const slug = slugify(oeuvre.titre);
       99 -          const canonicalUrl = `https://www.novel-index.com/oeuvre/${oeuvre.documentId}-${slug}`;
      100 -
      101 -          // Construire l'URL de l'image de couverture
      102 -          const imageUrl = oeuvre.couverture?.url
      103 -            ? (oeuvre.couverture.url.startsWith('http') ? oeuvre.couverture.url : `${apiUrl}${oeuvre.couverture.url}`)
      104 -            : "https://www.novel-index.com/logo.png";
      125
      106 -          // Récupérer les commentaires pour le JSON-LD Review
      107 -          let reviews = [];
      108 -          try {
      109 -            const commentsRes = await fetch(
      110 -              `${apiUrl}/api/commentaires?filters[oeuvres][documentId]=${oeuvre.documentId}&populate=users_permissions_users`,
      111 -              { next: { revalidate: 3600 } }
      112 -            );
      113 -            if (commentsRes.ok) {
      114 -              const commentsData = await commentsRes.json();
      115 -              reviews = commentsData.data?.slice(0, 10).map((comment) => ({
      126 +      if (oeuvre) {
      127 +        const titre = (oeuvre.titre || "").trim();
      128 +        const slug = slugify(titre);
      129 +        const canonicalUrl = `${SITE_URL}/oeuvre/${oeuvre.documentId}-${slug}`;
      130 +
      131 +        const imageUrl = oeuvre.couverture?.url
      132 +          ? oeuvre.couverture.url.startsWith("http")
      133 +            ? oeuvre.couverture.url
      134 +            : `${apiUrl}${oeuvre.couverture.url}`
      135 +          : FALLBACK_IMAGE;
      136 +
      137 +        const cleanSynopsis = stripHtml(oeuvre.synopsis);
      138 +
      139 +        // Reviews à partir des commentaires (cache 1h)
      140 +        let reviews = [];
      141 +        try {
      142 +          const commentsRes = await fetch(
      143 +            `${apiUrl}/api/commentaires?filters[oeuvres][documentId]=${oeuvre.documentId}&populate=users_permissions_users&pagination[limit]=10`,
      144 +            { next: { revalidate: 3600 } }
      145 +          );
      146 +          if (commentsRes.ok) {
      147 +            const commentsData = await commentsRes.json();
      148 +            reviews =
      149 +              commentsData.data?.map((comment) => ({
      150                  "@type": "Review",
      117 -                "author": {
      151 +                author: {
      152                    "@type": "Person",
      119 -                  "name": comment.users_permissions_users?.[0]?.username || "Utilisateur"
      153 +                  name: comment.users_permissions_users?.[0]?.username || "Utilisateur",
      154                  },
      121 -                "reviewBody": comment.commentaire,
      122 -                "datePublished": comment.createdAt
      155 +                reviewBody: comment.commentaire,
      156 +                datePublished: comment.createdAt,
      157                })) || [];
      124 -            }
      125 -          } catch (error) {
      126 -            console.error("[OeuvreLayout] Erreur récupération commentaires:", error);
      158            }
      159 +        } catch (error) {
      160 +          console.error("[OeuvreLayout] Erreur récupération commentaires:", error);
      161 +        }
      162
      129 -          // JSON-LD pour Book/CreativeWork
      130 -          const bookJsonLd = {
      131 -            "@context": "https://schema.org",
      132 -            "@type": oeuvre.type === "Roman" ? "Book" : "CreativeWork",
      133 -            "name": oeuvre.titre,
      134 -            "description": oeuvre.synopsis || `Découvrez ${oeuvre.titre} sur Novel-Index`,
      135 -            "url": canonicalUrl,
      136 -            "image": imageUrl,
      137 -            "inLanguage": "fr",
      138 -            "genre": oeuvre.genres?.map(g => g.titre).join(", ") || undefined,
      139 -            "keywords": oeuvre.tags?.map(t => t.titre).join(", ") || undefined,
      140 -            "workExample": oeuvre.statut ? {
      141 -              "@type": "Book",
      142 -              "bookFormat": "https://schema.org/EBook",
      143 -              "inLanguage": "fr"
      144 -            } : undefined,
      145 -            "datePublished": oeuvre.createdAt,
      146 -            "dateModified": oeuvre.updatedAt,
      147 -            "publisher": {
      148 -              "@type": "Organization",
      149 -              "name": "Novel-Index",
      150 -              "url": "https://www.novel-index.com"
      151 -            },
      152 -            // Ajouter les reviews s'il y en a
      153 -            "review": reviews.length > 0 ? reviews : undefined
      154 -          };
      163 +        const bookJsonLd = {
      164 +          "@context": "https://schema.org",
      165 +          "@type": "Book",
      166 +          name: titre,
      167 +          alternateName: (oeuvre.titrealt || "").trim() || undefined,
      168 +          description: cleanSynopsis || `Découvrez ${titre} sur Novel-Index`,
      169 +          url: canonicalUrl,
      170 +          image: imageUrl,
      171 +          inLanguage: "fr",
      172 +          author: oeuvre.auteur
      173 +            ? { "@type": "Person", name: (oeuvre.auteur || "").trim() }
      174 +            : undefined,
      175 +          genre: oeuvre.genres?.length ? oeuvre.genres.map((g) => g.titre).join(", ") : undefined,
      176 +          keywords: oeuvre.tags?.length ? oeuvre.tags.map((t) => t.titre).join(", ") : undefined,
      177 +          datePublished: oeuvre.createdAt,
      178 +          dateModified: oeuvre.updatedAt,
      179 +          publisher: {
      180 +            "@type": "Organization",
      181 +            name: "Novel-Index",
      182 +            url: SITE_URL,
      183 +          },
      184 +          review: reviews.length > 0 ? reviews : undefined,
      185 +        };
      186
      156 -          // Nettoyer les propriétés undefined
      157 -          Object.keys(bookJsonLd).forEach(key =>
      158 -            bookJsonLd[key] === undefined && delete bookJsonLd[key]
      159 -          );
      187 +        Object.keys(bookJsonLd).forEach(
      188 +          (key) => bookJsonLd[key] === undefined && delete bookJsonLd[key]
      189 +        );
      190
      161 -          // JSON-LD pour BreadcrumbList (fil d'Ariane)
      162 -          const breadcrumbJsonLd = {
      163 -            "@context": "https://schema.org",
      164 -            "@type": "BreadcrumbList",
      165 -            "itemListElement": [
      166 -              {
      167 -                "@type": "ListItem",
      168 -                "position": 1,
      169 -                "name": "Accueil",
      170 -                "item": "https://www.novel-index.com"
      171 -              },
      172 -              {
      173 -                "@type": "ListItem",
      174 -                "position": 2,
      175 -                "name": "Œuvres",
      176 -                "item": "https://www.novel-index.com/Oeuvres"
      177 -              },
      178 -              {
      179 -                "@type": "ListItem",
      180 -                "position": 3,
      181 -                "name": oeuvre.titre,
      182 -                "item": canonicalUrl
      183 -              }
      184 -            ]
      185 -          };
      191 +        const breadcrumbJsonLd = {
      192 +          "@context": "https://schema.org",
      193 +          "@type": "BreadcrumbList",
      194 +          itemListElement: [
      195 +            { "@type": "ListItem", position: 1, name: "Accueil", item: SITE_URL },
      196 +            { "@type": "ListItem", position: 2, name: "Œuvres", item: `${SITE_URL}/Oeuvres` },
      197 +            { "@type": "ListItem", position: 3, name: titre, item: canonicalUrl },
      198 +          ],
      199 +        };
      200
      187 -          return (
      188 -            <>
      189 -              <JsonLd data={bookJsonLd} />
      190 -              <JsonLd data={breadcrumbJsonLd} />
      191 -              {children}
      192 -            </>
      193 -          );
      194 -        }
      201 +        return (
      202 +          <>
      203 +            <JsonLd data={bookJsonLd} />
      204 +            <JsonLd data={breadcrumbJsonLd} />
      205 +            {children}
      206 +          </>
      207 +        );
      208 +      }
      209      }
      210    } catch (error) {
      211      console.error("[OeuvreLayout] Erreur lors de la génération du JSON-LD:", error);
      212    }
      213
      200 -  // Fallback si erreur ou pas de données
      214    return children;
      202 -}
      215   No newline at end of file
      216 +}

● Je vérifie la compilation et le rendu HTML SSR sur l'URL de test.

● Bash(sleep 4; tail -25 "C:/Users/agaud/AppData/Local/Temp/claude/C--Users-agaud-OneDrive-Desktop-sites-novel-index-v2/197a02a6-34f6-4a17-957d-66a39674026c/tasks/b9wm…)
  ⎿   ✓ Compiled in 2.1s (1649 modules)
      GET /Oeuvres 200 in 233ms
      ✓ Compiled in 1279ms (1649 modules)
     … +22 lines (ctrl+o to expand)

● Bash(curl -s "http://localhost:3000/oeuvre/dff6s77limbn1gpejnj5lhjh-reincarnation-of-the-strongest-sword-god" -o /tmp/sword-god2.html
      echo "===AUDIT APRÈS SPRINT 1==…)
  ⎿  ===AUDIT APRÈS SPRINT 1===

     Title:
     … +40 lines (ctrl+o to expand)

● Bash(echo "===Mots clés explicites du titre AffiChapitre==="
      grep -c "Chapitres disponibles" /tmp/sword-god2.html…)
  ⎿  ===Mots clés explicites du titre AffiChapitre===
     0
     occurrences de 'Chapitres disponibles'
     … +12 lines (ctrl+o to expand)

● Bash(echo "===Headings dans le HTML rendu==="
      grep -oE '<h[1-3][^>]*>[^<]*' /tmp/sword-god2.html | head -20…)
  ⎿  ===Headings dans le HTML rendu===
     <h3 class="text-white font-semibold mb-3">Navigation
     <h3 class="text-white font-semibold mb-3">Catégories
     … +22 lines (ctrl+o to expand)

● Bash(echo "===Strings spécifiques OeuvreClient==="
      for s in "Commencer à lire" "Dernier chapitre" "S'abonner" "Informations" "Synopsis" "Genres" "Tags" "Œuvres simil…)
  ⎿  ===Strings spécifiques OeuvreClient===
       'Commencer à lire': 0
       'Dernier chapitre': 0
     … +47 lines (ctrl+o to expand)

  Read 1 file (ctrl+o to expand)

● Bash(echo "===Total bytes==="
      wc -c /tmp/sword-god2.html…)
  ⎿  ===Total bytes===
     72821 /tmp/sword-god2.html
     … +148 lines (ctrl+o to expand)

● Bash(echo "===Recherche cover image dans HTML==="
      grep -c "Reincarnation_of_the_strongest" /tmp/sword-god2.html…)
  ⎿  ===Recherche cover image dans HTML===
     2
     occurrences cloudinary cover
     … +22 lines (ctrl+o to expand)

● Bash(echo "===Contenu des templates Suspense (ce que JS hydrate)==="
      grep -oE '<template id="[^"]*">[^<]{1,500}' /tmp/sword-god2.html | head -3…)
  ⎿  Error: Exit code 3
     ===Contenu des templates Suspense (ce que JS hydrate)===

     ===Contenu après templates : recherche du h1 dans les templates===
     0
     (0 = body OeuvreClient pas dans HTML servi)

     ===Test : la version actuelle de page.js attend trop, suspend en loading.js===

     ===Temps de réponse moyenne pour un fetch direct Strapi team/similar===
     … +9 lines (ctrl+o to expand)

● Bash(echo "===Direct Strapi avec mes populates exacts==="
      curl -s "https://novel-index-strapi.onrender.com/api/oeuvres/dff6s77limbn1gpejnj5lhjh?populate%5B0%5D=couve…)
  ⎿  Error: Exit code 49
     ===Direct Strapi avec mes populates exacts===
     Python est introuvable ; ex�cutez sans arguments � installer � partir du Microsoft Store ou d�sactivez ce raccourci dans Param�tres > Applications > param�tres d

● Bash(curl -s "https://novel-index-strapi.onrender.com/api/oeuvres/dff6s77limbn1gpejnj5lhjh?populate%5B0%5D=couverture&populate%5B1%5D=tags&populate%5B2%5D=genres&pop…)
  ⎿  Error: Exit code 1
     node:fs:441
         return binding.readFileUtf8(path, stringToFlags(options.flag));
                        ^

     Error: ENOENT: no such file or directory, open 'C:\tmp\oeuvre-strapi.json'
         at Object.readFileSync (node:fs:441:20)
         at [eval]:1:36
         at runScriptInThisContext (node:internal/vm:209:10)
         at node:internal/process/execution:446:12
     … +12 lines (ctrl+o to expand)

● Bash(TMPF="$TEMP/oeuvre-strapi.json"
      curl -s "https://novel-index-strapi.onrender.com/api/oeuvres/dff6s77limbn1gpejnj5lhjh?populate%5B0%5D=couverture&populate%5B1%5D…)
  ⎿  Interrupted · What should Claude do instead?

❯ Désoler de t'interrompre, mais je crois que tu n'y arrive pas car ma page est en 404, tu devrais corriger cette partie je pense

● Tu as raison. Le 404 vient probablement de mon populate[5]=oeuvre_licence que j'ai ajouté et qui n'existait pas dans la version originale — si Strapi rejette ce populate, fetchOeuvre retourne null et
  notFound() déclenche le 404. Je le retire.

● Update(novel-index-v2-project\src\app\oeuvre\[documentId]-[slug]\page.js)
  ⎿  Added 1 line, removed 1 line
       6  async function fetchOeuvre(documentId) {
       7    try {
       8      const res = await fetch(
       9 -      `${STRAPI}/api/oeuvres/${documentId}?populate[0]=couverture&populate[1]=tags&populate[2]=genres&populate[3]=chapitres&populate[4]=achatlivres&populate[5]=oeuvre_licence`,
       9 +      `${STRAPI}/api/oeuvres/${documentId}?populate[0]=couverture&populate[1]=tags&populate[2]=genres&populate[3]=chapitres&populate[4]=achatlivres`,
      10        { next: { revalidate: 3600 } }
      11      );
      12      if (!res.ok) return null;

● Bash(sleep 4
      echo "===Recompile log==="…)
  ⎿  ===Recompile log===
      GET /oeuvre/dff6s77limbn1gpejnj5lhjh-reincarnation-of-the-strongest-sword-god 200 in 197ms
      GET /oeuvre/dff6s77limbn1gpejnj5lhjh-reincarnation-of-the-strongest-sword-god 200 in 114ms
     … +13 lines (ctrl+o to expand)

● Page revenue à 200, 510KB de HTML rendu. Je relance l'audit SEO complet.

─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
 Bash command

   curl -s "http://localhost:3000/oeuvre/dff6s77limbn1gpejnj5lhjh-reincarnation-of-the-strongest-sword-god" -o /tmp/sword-god3.html
   echo "===AUDIT FINAL SPRINT 1==="
   echo ""
   echo "--- Title ---"
   grep -oE '<title[^>]*>[^<]*</title>' /tmp/sword-god3.html
   echo ""
   echo "--- Meta description (preview) ---"
   echo "--- Title ---"
   grep -oE '<title[^>]*>[^<]*</title>' /tmp/sword-god3.html
   echo ""
   echo "--- Meta description (preview) ---"
   grep -oE 'name="description" content="[^"]{0,120}' /tmp/sword-god3.html
   echo ""
   echo "--- og:image dimensions ---"
   grep -oE 'og:image:(width|height)" content="[^"]*"' /tmp/sword-god3.html
   echo ""
   echo "--- twitter:description ---"
   grep -oE 'twitter:description" content="[^"]{0,80}' /tmp/sword-god3.html | head -1
   echo ""
   echo "--- Keywords (genres présents ?) ---"
   grep -oE 'name="keywords" content="[^"]*"' /tmp/sword-god3.html | head -1
   echo ""
   echo "--- H1 ---"
   grep -oE '<h1[^>]*>[^<]*</h1>' /tmp/sword-god3.html | head -3
   echo ""
   echo "--- Liens internes /oeuvre/ (similaires SSR) ---"
   grep -oE 'href="/oeuvre/[^"]*"' /tmp/sword-god3.html | grep -v "dff6s77limbn1gpejnj5lhjh" | sort -u | wc -l
   echo "(0 = pas de similar ; >0 = similar SSR ✓)"
   echo ""
   echo "--- Liens internes /tags-genres/ (genres + tags SSR) ---"
   grep -oE 'href="/tags-genres/[a-z]+/[^"]*"' /tmp/sword-god3.html | sort -u | wc -l
   echo ""
   echo "--- Liens internes /Teams/ (translator SSR) ---"
   grep -oE 'href="/Teams/[^"]*"' /tmp/sword-god3.html | sort -u | wc -l
   echo ""
   echo "--- Mention 'Chapitres disponibles' (AffiChapitre) ---"
   grep -c "Chapitres disponibles" /tmp/sword-god3.html
   echo ""
   echo "--- Nombre d'éléments li chapitre (page 1 affichée en SSR) ---"
   grep -oE '<li[^>]*class="group flex justify-between' /tmp/sword-god3.html | wc -l
   echo ""
   echo "--- Section similar / team / commentaires ---"
   for s in "Œuvres similaires" "Traduit par" "Commentaires" "Commencer à lire" "Synopsis"; do
     count=$(grep -c "$s" /tmp/sword-god3.html)
     echo "  '$s': $count"
   done
   echo ""
   echo "--- JSON-LD types (1 Book + Breadcrumb attendus) ---"
   grep -oE '<script type="application/ld\+json">[^<]*</script>' /tmp/sword-god3.html | grep -oE '"@type":"[^"]+"' | sort | uniq -c
   echo ""
   echo "--- Taille HTML ---"
   wc -c /tmp/sword-god3.html
   Full SEO audit after fix

 Unhandled node type: string

 Do you want to proceed?
 ❯ 1. Yes
   2. No

 Esc to cancel · Tab to amend · ctrl+e to explain
         return binding.readFileUtf8(path, stringToFlags(options.flag));
                        ^

     Error: ENOENT: no such file or directory, open 'C:\tmp\oeuvre-strapi.json'
         at Object.readFileSync (node:fs:441:20)
         at [eval]:1:36
         at runScriptInThisContext (node:internal/vm:209:10)
         at node:internal/process/execution:446:12
     … +12 lines (ctrl+o to expand)

● Bash(TMPF="$TEMP/oeuvre-strapi.json"
      curl -s "https://novel-index-strapi.onrender.com/api/oeuvres/dff6s77limbn1gpejnj5lhjh?populate%5B0%5D=couverture&populate%5B1%5D…)
  ⎿  Interrupted · What should Claude do instead?

❯ Désoler de t'interrompre, mais je crois que tu n'y arrive pas car ma page est en 404, tu devrais corriger cette partie je pense

● Tu as raison. Le 404 vient probablement de mon populate[5]=oeuvre_licence que j'ai ajouté et qui n'existait pas dans la version originale — si Strapi rejette ce populate, fetchOeuvre retourne null et
  notFound() déclenche le 404. Je le retire.

● Update(novel-index-v2-project\src\app\oeuvre\[documentId]-[slug]\page.js)
  ⎿  Added 1 line, removed 1 line
       6  async function fetchOeuvre(documentId) {
       7    try {
       8      const res = await fetch(
       9 -      `${STRAPI}/api/oeuvres/${documentId}?populate[0]=couverture&populate[1]=tags&populate[2]=genres&populate[3]=chapitres&populate[4]=achatlivres&populate[5]=oeuvre_licence`,
       9 +      `${STRAPI}/api/oeuvres/${documentId}?populate[0]=couverture&populate[1]=tags&populate[2]=genres&populate[3]=chapitres&populate[4]=achatlivres`,
      10        { next: { revalidate: 3600 } }
      11      );
      12      if (!res.ok) return null;

● Bash(sleep 4
      echo "===Recompile log==="…)
  ⎿  ===Recompile log===
      GET /oeuvre/dff6s77limbn1gpejnj5lhjh-reincarnation-of-the-strongest-sword-god 200 in 197ms
      GET /oeuvre/dff6s77limbn1gpejnj5lhjh-reincarnation-of-the-strongest-sword-god 200 in 114ms
     … +13 lines (ctrl+o to expand)

● Page revenue à 200, 510KB de HTML rendu. Je relance l'audit SEO complet.

● Bash(curl -s "http://localhost:3000/oeuvre/dff6s77limbn1gpejnj5lhjh-reincarnation-of-the-strongest-sword-god" -o /tmp/sword-god3.html
      echo "===AUDIT FINAL SPRINT 1==…)
  ⎿  ===AUDIT FINAL SPRINT 1===

     --- Title ---
     … +54 lines (ctrl+o to expand)

● Reste un détail : le h1 a encore l'espace de tête (le titre n'est trimmé que dans la metadata, pas dans le body). Je trim au niveau de page.js avant de passer à OeuvreClient.

● Update(novel-index-v2-project\src\app\oeuvre\[documentId]-[slug]\page.js)
  ⎿  Added 9 lines, removed 2 lines
      71    const resolvedParams = await params;
      72    const rawSegment = resolvedParams["documentId]-[slug"];
      73    const documentId = extractDocumentId(rawSegment);
      74 -  const oeuvre = await fetchOeuvre(documentId);
      74 +  const raw = await fetchOeuvre(documentId);
      75
      76 -  if (!oeuvre) {
      76 +  if (!raw) {
      77      notFound();
      78    }
      79
      80 +  const oeuvre = {
      81 +    ...raw,
      82 +    titre: (raw.titre || "").trim(),
      83 +    titrealt: (raw.titrealt || "").trim() || raw.titrealt,
      84 +    auteur: (raw.auteur || "").trim() || raw.auteur,
      85 +  };
      86 +
      87    const chapitres = (oeuvre.chapitres || []).sort((a, b) => a.order - b.order);
      88
      89    const [team, similar, subscribers] = await Promise.all([

● Bash(sleep 4
      curl -s "http://localhost:3000/oeuvre/dff6s77limbn1gpejnj5lhjh-reincarnation-of-the-strongest-sword-god" -o /tmp/sword-god4.html…)
  ⎿  ===Vérif H1 trimé===
     <h1 class="text-3xl sm:text-4xl font-bold leading-tight">Reincarnation of the strongest sword god</h1>
     … +9 lines (ctrl+o to expand)

● H1 propre, page 200. Sprint 1 stabilisé. Voici le bilan complet.

  Bilan Sprint 1 — comparé à l'état initial

  ┌─────────────────────────────────────────────────────────────────────────────┬───────────────────────────────────────────────────────────────┬────────────────────────────────────────────────────────────┐
  │                                Métrique SEO                                 │                             Avant                             │                           Après                            │
  ├─────────────────────────────────────────────────────────────────────────────┼───────────────────────────────────────────────────────────────┼────────────────────────────────────────────────────────────┤
  │ <title>                                                                     │  Reincarnation of the strongest sword god - Novel-Index       │ Reincarnation of the strongest sword god - Web novel -     │
  │                                                                             │ (espace de tête)                                              │ Novel-Index ✓                                              │
  ├─────────────────────────────────────────────────────────────────────────────┼───────────────────────────────────────────────────────────────┼────────────────────────────────────────────────────────────┤
  │ <h1>                                                                        │  Reincarnation of... (espace)                                 │ Reincarnation of... ✓                                      │
  ├─────────────────────────────────────────────────────────────────────────────┼───────────────────────────────────────────────────────────────┼────────────────────────────────────────────────────────────┤
  │ og:image:width/height                                                       │ absent                                                        │ 600 / 800 ✓                                                │
  ├─────────────────────────────────────────────────────────────────────────────┼───────────────────────────────────────────────────────────────┼────────────────────────────────────────────────────────────┤
  │ twitter:description                                                         │ absent                                                        │ présent ✓                                                  │
  ├─────────────────────────────────────────────────────────────────────────────┼───────────────────────────────────────────────────────────────┼────────────────────────────────────────────────────────────┤
  │ Liens internes /Teams/ SSR                                                  │ 0                                                             │ 1 ✓                                                        │
  ├─────────────────────────────────────────────────────────────────────────────┼───────────────────────────────────────────────────────────────┼────────────────────────────────────────────────────────────┤
  │ Chapitres rendus dans le HTML SSR                                           │ 0                                                             │ 10 (la page 1 d'AffiChapitre) ✓                            │
  ├─────────────────────────────────────────────────────────────────────────────┼───────────────────────────────────────────────────────────────┼────────────────────────────────────────────────────────────┤
  │ Sections Synopsis / Commencer à lire / Commentaires SSR                     │ 0                                                             │ toutes présentes ✓                                         │
  ├─────────────────────────────────────────────────────────────────────────────┼───────────────────────────────────────────────────────────────┼────────────────────────────────────────────────────────────┤
  │ JSON-LD doublon (Book + CreativeWork pour la même entité)                   │ oui                                                           │ 1 seul Book cohérent ✓                                     │
  ├─────────────────────────────────────────────────────────────────────────────┼───────────────────────────────────────────────────────────────┼────────────────────────────────────────────────────────────┤
  │ Bug regex synopsis (/\\r\\n.../)                                            │ présent                                                       │ corrigé en /\r?\n/g ✓                                      │
  ├─────────────────────────────────────────────────────────────────────────────┼───────────────────────────────────────────────────────────────┼────────────────────────────────────────────────────────────┤
  │ Fetch redondant AffiChapitre (re-télécharge tous les chapitres déjà chargés │ oui                                                           │ supprimé via initialItems ✓                                │
  │  par page.js)                                                               │                                                               │                                                            │
  ├─────────────────────────────────────────────────────────────────────────────┼───────────────────────────────────────────────────────────────┼────────────────────────────────────────────────────────────┤
  │ Fetch enrichments client-side (team / similar / subscribers)                │ 3 round-trips après mount                                     │ 0 round-trip — tout SSR ✓                                  │
  ├─────────────────────────────────────────────────────────────────────────────┼───────────────────────────────────────────────────────────────┼────────────────────────────────────────────────────────────┤
  │ HTML servi                                                                  │ ~503KB (avec données chapitres inlinées)                      │ ~522KB (avec en plus team SSR + chapitres rendus visibles) │
  └─────────────────────────────────────────────────────────────────────────────┴───────────────────────────────────────────────────────────────┴────────────────────────────────────────────────────────────┘

  Ce qui reste à 0 et qui n'est PAS un bug

  - Œuvres similaires SSR : 0
  - Liens /tags-genres/ SSR : 0
  - Genres dans keywords : 0

  Cause : cette œuvre spécifique n'a pas de genres assignés en base. Ça se confirme parce que le fetch oeuvre.genres revient vide → fetchSimilar ne s'exécute pas → 0 similaires. Sur une œuvre avec des genres,
  ces sections vont apparaître automatiquement. À tester sur une autre œuvre.

  Ce qui a causé le 404

  J'avais ajouté populate[5]=oeuvre_licence dans la requête Strapi parce que le code original référençait oeuvre.oeuvre_licence. Strapi a rejeté ce populate (relation peut-être inexistante dans le schéma),
  fetchOeuvre a renvoyé null, notFound() a déclenché le 404. Retiré.

  Conséquence acceptée : sur les œuvres licenciées, le bloc "Voir la version officielle" affichait déjà juste la référence non populée avant — pas de régression. Si tu veux activer ce lien, il faudra vérifier
  le nom exact de la relation côté Strapi (peut-être oeuvre_licenciee ou version_officielle selon le modèle).

  Fichiers modifiés

  - src/app/components/Affichapitre.js : accepte initialItems, skip son fetch si fourni.
  - src/app/oeuvre/[documentId]-[slug]/OeuvreClient.js : props initialTeam / initialSimilar / initialSubscribers, useEffect enrichments retiré, initialItems passé à AffiChapitre, regex synopsis corrigée.
  - src/app/oeuvre/[documentId]-[slug]/page.js : SSR fetch parallèle pour team/similar/subscribers, metadata et JsonLd retirés (centralisés dans le layout), trim du titre/auteur/titrealt.
  - src/app/oeuvre/[documentId]-[slug]/layout.js : metadata propre (titre trimé, format consistant, og:image dimensions, twitter:description), keywords enrichi avec genres + tags, JSON-LD Book unique nettoyé
  (numberOfPages bidon supprimé, workExample bidon supprimé).

  Prochaines étapes (Sprint 2)

  Quand tu veux : redirection 301 sur slug non-canonique, bloc FAQ + FAQPage schema, bloc éditorial 200 mots. Dis-moi par où on continue.

✻ Cooked for 2m 27s · 1 shell still running

※ recap: On enrichit le SEO des pages d'œuvre ; le Sprint 1 vient d'être livré et la page rend en 200 avec contenu complet en SSR. Prochaine action : valider en navigateur puis attaquer Sprint 2 (redirection
  301, FAQ, bloc éditorial).

❯ go sprint deux

● Sprint 2 lancé. 3 actions : redirect 301 sur slug non-canonique, bloc éditorial "À propos", section FAQ avec FAQPage JSON-LD.

  1/3 — page.js : redirect 301 sur slug non-canonique

● Update(novel-index-v2-project\src\app\oeuvre\[documentId]-[slug]\page.js)
  ⎿  Added 2 lines, removed 1 line
      1 -import { notFound } from "next/navigation";
      1 +import { notFound, permanentRedirect } from "next/navigation";
      2 +import { slugify } from "@/utils/slugify";
      3  import OeuvreClient from "./OeuvreClient";
      4
      5  const STRAPI = process.env.NEXT_PUBLIC_API_URL;

● Update(novel-index-v2-project\src\app\oeuvre\[documentId]-[slug]\page.js)
  ⎿  Added 6 lines
      85      auteur: (raw.auteur || "").trim() || raw.auteur,
      86    };
      87
      88 +  // Redirection 308 si le slug de l'URL ne correspond pas au slug canonique
      89 +  const canonicalSlug = slugify(oeuvre.titre);
      90 +  if (canonicalSlug && rawSegment !== `${documentId}-${canonicalSlug}`) {
      91 +    permanentRedirect(`/oeuvre/${documentId}-${canonicalSlug}`);
      92 +  }
      93 +
      94    const chapitres = (oeuvre.chapitres || []).sort((a, b) => a.order - b.order);
      95
      96    const [team, similar, subscribers] = await Promise.all([

● 2/3 + 3/3 — OeuvreClient.js : helpers, bloc éditorial, FAQ + JSON-LD

● Update(novel-index-v2-project\src\app\oeuvre\[documentId]-[slug]\OeuvreClient.js)
  ⎿  Added 95 lines
       11    if (typeof window === "undefined") return html;
       12    return DOMPurify.sanitize(html);
       13  }
       14 +
       15 +function buildEditorial({ titre, type, auteur, traduction, titrealt, categorie, genres, annee, etat, totalCh, readLabel, majLabel, licence, team }) {
       16 +  const typeName = type ? type.toLowerCase() : "œuvre";
       17 +  const article = type ? "un" : "une";
       18 +
       19 +  let intro = `${titre} est ${article} ${typeName}`;
       20 +  if (auteur) intro += ` de ${auteur}`;
       21 +  if (traduction) intro += `, dont la traduction française est assurée par ${traduction}`;
       22 +  intro += ".";
       23 +  if (titrealt) intro += ` Cette œuvre est également connue sous le titre alternatif « ${titrealt} ».`;
       24 +
       25 +  const genresList = genres?.length > 0 ? genres.slice(0, 5).map((g) => g.titre).join(", ") : null;
       26 +  let corps = categorie ? `Classée dans la catégorie ${categorie}, cette œuvre` : "Cette œuvre";
       27 +  if (genresList) corps += ` explore les genres ${genresList}`;
       28 +  corps += ".";
       29 +  if (annee) corps += ` Publiée pour la première fois en ${annee}`;
       30 +  if (etat) corps += `${annee ? "," : "."} elle est actuellement ${etat.toLowerCase()}`;
       31 +  if (annee || etat) corps += ".";
       32 +
       33 +  let stats = totalCh > 0
       34 +    ? `À ce jour, ${totalCh} chapitre${totalCh > 1 ? "s" : ""} sont disponibles en français sur Novel-Index, soit environ ${readLabel} de lecture.`
       35 +    : "Aucun chapitre n'est encore disponible en français pour le moment.";
       36 +  if (majLabel) stats += ` La dernière mise à jour des chapitres date de ${majLabel.toLowerCase()}.`;
       37 +  if (team?.titre) stats += ` La traduction est portée par l'équipe ${team.titre}.`;
       38 +
       39 +  const cta = licence
       40 +    ? `${titre} a été officiellement licenciée. Pour soutenir l'auteur original et son éditeur, nous vous invitons à acquérir la version officielle.`
       41 +    : null;
       42 +
       43 +  return { intro, corps, stats, cta };
       44 +}
       45 +
       46 +function buildFaq({ titre, auteur, traduction, etat, totalCh, genres, licence, annee, team }) {
       47 +  const items = [];
       48 +
       49 +  items.push({
       50 +    q: `Combien de chapitres compte ${titre} ?`,
       51 +    a: totalCh > 0
       52 +      ? `${titre} compte actuellement ${totalCh} chapitre${totalCh > 1 ? "s" : ""} disponible${totalCh > 1 ? "s" : ""} en français sur Novel-Index.`
       53 +      : `Aucun chapitre de ${titre} n'est encore disponible en français.`,
       54 +  });
       55 +
       56 +  items.push({
       57 +    q: `Qui est l'auteur de ${titre} ?`,
       58 +    a: auteur
       59 +      ? `${titre} a été écrit par ${auteur}.`
       60 +      : `L'auteur original de ${titre} n'est pas renseigné sur Novel-Index pour le moment.`,
       61 +  });
       62 +
       63 +  items.push({
       64 +    q: `Qui traduit ${titre} en français ?`,
       65 +    a: team?.titre
       66 +      ? `La traduction française de ${titre} est assurée par l'équipe ${team.titre}.`
       67 +      : traduction
       68 +        ? `La traduction française de ${titre} est assurée par ${traduction}.`
       69 +        : `Aucune équipe de traduction n'est référencée pour ${titre}.`,
       70 +  });
       71 +
       72 +  if (etat) {
       73 +    items.push({
       74 +      q: `Quel est le statut de ${titre} ?`,
       75 +      a: `${titre} est actuellement ${etat.toLowerCase()}.`,
       76 +    });
       77 +  }
       78 +
       79 +  if (genres?.length > 0) {
       80 +    items.push({
       81 +      q: `Quels sont les genres de ${titre} ?`,
       82 +      a: `${titre} relève des genres suivants : ${genres.map((g) => g.titre).join(", ")}.`,
       83 +    });
       84 +  }
       85 +
       86 +  items.push({
       87 +    q: `${titre} est-elle une œuvre licenciée ?`,
       88 +    a: licence
       89 +      ? `Oui, ${titre} a été officiellement licenciée. La traduction amateur n'est plus disponible — vous pouvez retrouver l'édition officielle chez l'éditeur.`
       90 +      : `Non, ${titre} n'a pas été officiellement licenciée à ce jour.`,
       91 +  });
       92 +
       93 +  items.push({
       94 +    q: `Où peut-on lire ${titre} en français ?`,
       95 +    a: licence
       96 +      ? `${titre} étant licenciée, nous vous invitons à acquérir l'édition officielle pour la lire.`
       97 +      : `Vous pouvez lire ${titre} directement depuis Novel-Index : cliquez sur un chapitre dans la liste de cette page pour être redirigé vers le site du traducteur.`,
       98 +  });
       99 +
      100 +  if (annee) {
      101 +    items.push({
      102 +      q: `Quand ${titre} a-t-elle été publiée ?`,
      103 +      a: `${titre} a été publiée pour la première fois en ${annee}.`,
      104 +    });
      105 +  }
      106 +
      107 +  return items;
      108 +}
      109  import Image from "next/image";
      110  import Link from "next/link";
      111  import { slugify } from "@/utils/slugify";
  ⎿  You've hit your limit · resets 3:30am (Europe/Paris)
     /upgrade to increase your usage limit.