  ---
  Audit SEO - Novel-Index

  PROBLEME CRITIQUE #1 : Toute la metadata est client-side (cause racine)

  Le fichier src/app/layout.js:1 commence par "use client". C'est le probleme fondamental. Cela signifie :

  - Le HTML initial envoyé par le serveur contient TOUJOURS :
  <title>Novel-index</title>
  <link rel="canonical" href="https://novel-index.com" />
  <meta name="description" content="Trad-Index - Plateforme d'indexation collaborative..." />
  - Les pages /oeuvre/... et /Oeuvres modifient ces balises via document.querySelector dans des useEffect (exécution
  JavaScript cote client uniquement)
  - Googlebot fait du rendu JS, mais il n'est pas fiable a 100%. Si le JS ne s'exécute pas correctement ou si l'API
  Strapi est lente/down, Google voit le canonical par défaut (https://novel-index.com) pour TOUTES les pages

  Consequence directe : Google peut considérer que toutes vos pages d'oeuvres sont des doublons de la page d'accueil,
  car elles partagent le même canonical dans le HTML initial.

  ---
  PROBLEME CRITIQUE #2 : Incohérence de domaine www vs non-www
  ┌───────────────────────────────────────┬────────────────────────────────────────────────────┐
  │                Source                 │                  Domaine utilisé                   │
  ├───────────────────────────────────────┼────────────────────────────────────────────────────┤
  │ layout.js:64 canonical par défaut     │ https://novel-index.com (sans www)                 │
  ├───────────────────────────────────────┼────────────────────────────────────────────────────┤
  │ robots.txt:6 Host                     │ https://www.novel-index.com (avec www)             │
  ├───────────────────────────────────────┼────────────────────────────────────────────────────┤
  │ robots.txt:9 Sitemap                  │ https://www.novel-index.com/sitemap.xml (avec www) │
  ├───────────────────────────────────────┼────────────────────────────────────────────────────┤
  │ next-sitemap.config.js:31 siteUrl     │ https://www.novel-index.com (avec www)             │
  ├───────────────────────────────────────┼────────────────────────────────────────────────────┤
  │ oeuvre/page.js:63 canonical dynamique │ https://novel-index.com/oeuvre/... (sans www)      │
  ├───────────────────────────────────────┼────────────────────────────────────────────────────┤
  │ Oeuvres/page.js:43 canonical          │ https://novel-index.com/Oeuvres (sans www)         │
  └───────────────────────────────────────┴────────────────────────────────────────────────────┘
  Google voit deux domaines différents. Le sitemap dit www.novel-index.com, mais les canonicals dans le code disent
  novel-index.com. Cela crée une confusion massive pour l'indexation.

  ---
  PROBLEME CRITIQUE #3 : Pas de generateMetadata ni de SSR

  Next.js 13+ App Router offre generateMetadata() pour le rendu server-side des metadata. Votre projet n'utilise cette
  fonctionnalité nulle part. Chaque page est "use client" et manipule le DOM manuellement.

  Pages affectées :
  - src/app/layout.js - client component, pas de metadata export
  - src/app/oeuvre/[documentId]-[slug]/page.js - metadata via useEffect (lignes 36-63)
  - src/app/Oeuvres/page.js - metadata via useEffect (lignes 22-43)
  - src/app/tags-genres/[type]/[slug]/page.js - AUCUNE metadata du tout
  - src/app/tags-genres/[type]/page.js - AUCUNE metadata du tout
  - src/app/page.js (accueil) - AUCUNE metadata propre
  - src/app/Connexion/page.js - AUCUNE metadata propre

  ---
  PROBLEME #4 : Le not-found.js retourne un 200 au lieu d'un 404

  // src/app/not-found.js
  import { redirect } from 'next/navigation';
  export default function NotFound() {
    redirect('/Oeuvres');
  }

  Toute URL inexistante redirige vers /Oeuvres avec un statut 302/307. Google ne reçoit jamais de vrai 404, ce qui :
  - Pollue l'index avec des URLs fantômes
  - Empêche Google de nettoyer les URLs mortes
  - Crée du contenu dupliqué (toutes les mauvaises URLs = la page /Oeuvres)

  ---
  PROBLEME #5 : Slugs incohérents entre sitemap et code
  ┌───────────────────────────┬────────────────────────────────────────────────────────────────────┐
  │          Fichier          │                      Méthode de slugification                      │
  ├───────────────────────────┼────────────────────────────────────────────────────────────────────┤
  │ next-sitemap.config.js:20 │ .toLowerCase().replace(/\s+/g, '-')                                │
  ├───────────────────────────┼────────────────────────────────────────────────────────────────────┤
  │ Oeuvres/page.js:77        │ .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") │
  ├───────────────────────────┼────────────────────────────────────────────────────────────────────┤
  │ oeuvre/page.js:233        │ Full slugify avec normalize("NFD") et suppression accents          │
  └───────────────────────────┴────────────────────────────────────────────────────────────────────┘
  Un titre comme "L'Épée du Roi" donne :
  - Sitemap : l'épée-du-roi
  - Oeuvres listing : l-p-e-du-roi
  - Page oeuvre (slugify) : l-epee-du-roi

  Google voit des URLs dans le sitemap qui ne correspondent pas aux URLs réelles des liens internes.

  ---
  PROBLEME #6 : Pages tags/genres sans SEO

  src/app/tags-genres/[type]/[slug]/page.js et src/app/tags-genres/[type]/page.js n'ont :
  - Aucun <title> dynamique
  - Aucune meta description
  - Aucun canonical
  - Aucune entrée dans le sitemap

  ---
  PROBLEME #7 : Aucune donnée structurée (JSON-LD)

  Pas de schema.org markup pour :
  - Les oeuvres (Book, CreativeWork)
  - Les commentaires (Review)
  - La navigation (BreadcrumbList)
  - Le site (WebSite, Organization)

  ---
  PROBLEME #8 : Pas de balise Open Graph / Twitter Cards

  Aucune balise og:title, og:description, og:image, twitter:card n'est définie. Le partage social affiche un aperçu
  générique.

  ---
  RESUME PAR PRIORITE
  Priorité: P0
  Problème: Layout "use client" + metadata client-side
  Impact: Googlebot voit le mauvais canonical/titre sur toutes les pages
  ────────────────────────────────────────
  Priorité: P0
  Problème: Incohérence www vs non-www
  Impact: Google indexe deux versions du site
  ────────────────────────────────────────
  Priorité: P0
  Problème: Slugs incohérents sitemap vs code
  Impact: URLs du sitemap != URLs réelles
  ────────────────────────────────────────
  Priorité: P1
  Problème: Pas de generateMetadata SSR
  Impact: Metadata non garantie au crawl
  ────────────────────────────────────────
  Priorité: P1
  Problème: not-found.js redirige en 200
  Impact: Pas de vrai 404, pollution d'index
  ────────────────────────────────────────
  Priorité: P2
  Problème: Pages tags/genres sans metadata
  Impact: Pages non optimisées
  ────────────────────────────────────────
  Priorité: P2
  Problème: Aucun JSON-LD
  Impact: Pas de rich snippets
  ────────────────────────────────────────
  Priorité: P2
  Problème: Aucun Open Graph
  Impact: Mauvais aperçus sociaux
  ---
  Voulez-vous que je corrige ces problèmes ? La stratégie serait de :
  1. Séparer le layout en une partie server (metadata SSR) + une partie client (menu, animations)
  2. Implémenter generateMetadata() sur les pages dynamiques pour un rendu server-side des canonicals
  3. Unifier le domaine (www ou non-www) partout
  4. Unifier la fonction de slugification
  5. Corriger le not-found.js pour retourner un vrai 404