# À Faire - Modifications Strapi

## Priorité HAUTE - Système Licence

### Ajouter le champ `oeuvre_licence` sur Oeuvre

**Chemin** : Strapi Admin → Content-Type Builder → Oeuvre → Add another field

| Paramètre | Valeur |
|-----------|--------|
| Type | Relation |
| Relation type | Oeuvre has one Oeuvre (One-Way) |
| Nom du champ | `oeuvre_licence` |

**But** : Permet de lier une œuvre "team" (bloquée) vers son équivalent officiel (édition)

**Logique** :
- Quand `licence = true` ET `oeuvre_licence` est rempli → L'œuvre team est bloquée
- Les chapitres sont masqués
- Un lien redirige vers la fiche de l'œuvre officielle

---

## Priorité MOYENNE - Teams

### Ajouter des couvertures aux Teams

Actuellement toutes les teams ont `couverture: null`. 
Uploader des logos via :
- L'interface Strapi (Content Manager → Teams)
- Ou via le formulaire IndexeurTeams sur le site

---

## Notes

- Le code frontend gère déjà le cas où `oeuvre_licence` n'existe pas (graceful fallback)
- Une fois le champ ajouté, le système fonctionnera automatiquement
