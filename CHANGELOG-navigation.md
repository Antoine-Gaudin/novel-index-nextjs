# Changelog — Amelioration navigation & transitions

Date: 2026-04-18

## Fichiers CREES (supprimer pour revenir en arriere)
- `src/app/components/PageLoader.js` — Composant loader partage
- `src/app/Oeuvres/loading.js` — Loading route catalogue
- `src/app/actualites/loading.js` — Loading route actus
- `src/app/actualites/[slug]/loading.js` — Loading article detail
- `src/app/oeuvre/[documentId]-[slug]/loading.js` — Loading page oeuvre
- `src/app/Teams/loading.js` — Loading page teams
- `src/app/Teams/TeamsClient.js` — Logique client Teams extraite

## Fichiers MODIFIES (voir git diff pour revenir en arriere)
- `src/app/components/Menu.js` — Logo router.push remplace par Link + header shell au lieu de return null
- `src/app/components/ClientLayout.js` — Ajout ProgressBar (next-nprogress-bar)
- `src/app/Teams/page.js` — Converti en server component SSR
- `src/app/components/HeroSection.js` — Cache sessionStorage sur les stats

## Package ajoute
- `next-nprogress-bar` — npm uninstall next-nprogress-bar pour retirer

## Pour revenir en arriere
```bash
git diff HEAD  # voir les changements
git checkout -- .  # annuler tout
# OU supprimer les fichiers crees et git checkout les fichiers modifies
```
