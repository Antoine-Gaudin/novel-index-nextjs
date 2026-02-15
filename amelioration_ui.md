  Audit du sous-menu Indexeur

  Structure actuelle

  Profil (sidebar) → clic "Indexeur" → Indexeur.js
    → Grille de 6 cartes (menu principal)
      → clic "Commencer" → remplace la grille par le composant
        → certains composants ont LEUR PROPRE sous-menu interne
          ex: IndexeurChapitre → 4 boutons (OneChapitre, Plusieurs, Info, Remonter)
          ex: IndexeurModification → 2 cartes (Oeuvres, Teams)

  Problèmes d'ergonomie identifiés
  #: 1
  Problème: 3 niveaux de navigation imbriqués : sidebar profil → grille indexeur → sous-menu du
    composant. L'utilisateur se perd facilement
  Impact: UX critique
  ────────────────────────────────────────
  #: 2
  Problème: Bouton "Retour" incohérent : chaque niveau a son propre bouton retour avec un style
    différent ("Retour", "Retour a la recherche", "Retour")
  Impact: Confusion
  ────────────────────────────────────────
  #: 3
  Problème: Aucun indicateur de position : on ne sait jamais où on est dans l'arborescence
  Impact: UX
  ────────────────────────────────────────
  #: 4
  Problème: La grille de 6 cartes est lourde : chaque carte a un titre, une description ET un bouton
    "Commencer" - c'est beaucoup de surface pour un simple menu
  Impact: Encombrement
  ────────────────────────────────────────
  #: 5
  Problème: IndexeurChapitre a un double workflow : d'abord chercher une oeuvre, puis choisir parmi 4
    actions, puis le formulaire. 3 étapes avant d'agir
  Impact: Lenteur
  ────────────────────────────────────────
  #: 6
  Problème: Code mort / doublon : Tag.js, Genre.js et AjoutTagGenre.js ne sont plus utilisés
  (remplacés
     par TagsGenre.js + TagGenreSearch.js)
  Impact: Code inutile
  ────────────────────────────────────────
  #: 7
  Problème: Propriétaire pointe vers localhost (http://localhost:1337) au lieu de l'API de prod
  Impact: Bug
  ────────────────────────────────────────
  #: 8
  Problème: Pas de breadcrumb : impossible de naviguer rapidement entre les sous-sections sans tout
    remonter
  Impact: UX
  Améliorations proposées
  #: 1
  Amélioration: Remplacer la grille de cartes par un sidebar/tabs horizontal persistant en haut :
    l'utilisateur voit toujours les 6 sections et peut switcher directement
  Difficulté: Moyenne
  ────────────────────────────────────────
  #: 2
  Amélioration: Ajouter un breadcrumb en haut (ex: Profil > Indexeur > Chapitres > Solo Piece)
  Difficulté: Facile
  ────────────────────────────────────────
  #: 3
  Amélioration: Supprimer le double niveau dans IndexeurChapitre : mettre les 4 actions directement
    comme tabs sous la barre de recherche
  Difficulté: Facile
  ────────────────────────────────────────
  #: 4
  Amélioration: Uniformiser les boutons retour : un seul style, toujours au même endroit
  Difficulté: Facile
  ────────────────────────────────────────
  #: 5
  Amélioration: Supprimer les fichiers morts : Tag.js, Genre.js, AjoutTagGenre.js
  Difficulté: Trivial
  ────────────────────────────────────────
  #: 6
  Amélioration: Corriger le bug localhost dans IndexeurPropriétaire.js
  Difficulté: Trivial
  ────────────────────────────────────────
  #: 7
  Amélioration: Highlight de l'onglet actif dans le menu indexeur
  Difficulté: Facile
  Estimation tokens