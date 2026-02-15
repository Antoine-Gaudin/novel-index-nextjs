# Audit & Plan — Page Profil : Nouveaux onglets

## Onglets existants

| # | Onglet | Clé | Contenu actuel | Accès |
|---|--------|-----|----------------|-------|
| 1 | **Profil** | `profil` | Carte profil (avatar, badges, stats), Sorties du jour, Oeuvres contribuées, Activité récente, Classement contributeurs | Tous |
| 2 | **Bibliothèque** | `bibliotheque` | 2 sous-onglets : Vos abonnements + Vos catégories. Compteurs stats. | Tous |
| 3 | **Indexeur** | `indexeur` | 5 sous-sections : Chapitres, Oeuvre, Teams, Modification, Tags & Genres | `indexeur` ou `proprietaire` |
| 4 | **Tags en masse** | `bulktags` | Ajout/gestion de tags et genres en masse | Admin uniquement |
| 5 | **Administration** | `administration` | Validation propriétaires, gestion éditions, achats, messages | `admin` |
| 6 | **Paramètres** | `parametre` | Infos compte (username/email), photo de profil, mot de passe, rôles | Tous |

## Constats & lacunes

| Domaine | Constat |
|---------|---------|
| **Commentaires** | L'utilisateur ne peut voir/gérer ses propres commentaires nulle part dans le profil |
| **Historique de lecture** | Aucun suivi de progression (chapitres lus, oeuvres en cours, etc.) |
| **Notifications** | Pas de centre de notifications (nouveaux chapitres, réponses aux commentaires) |
| **Statistiques avancées** | Les stats sont basiques (compteurs). Pas de graphiques d'activité, de tendances |
| **Social** | Pas de page publique / partage de profil, pas de système d'amis/follow |
| **Sécurité** | Pas de journal de connexions, pas de gestion 2FA, pas de suppression de compte |

## Nouveaux onglets proposés

| # | Onglet proposé | Emoji | Clé | Description | Contenu prévu | Accès | Complexité | Priorité |
|---|---------------|-------|-----|-------------|---------------|-------|------------|----------|
| 1 | **Mes commentaires** | 💬 | `commentaires` | Historique de tous les commentaires postés par l'utilisateur | Liste paginée des commentaires avec lien vers l'oeuvre, date relative, possibilité de supprimer/éditer | Tous | Moyenne | ⭐⭐⭐ Haute |
| 2 | **Notifications** | 🔔 | `notifications` | Centre de notifications centralisé | Nouveaux chapitres sur oeuvres suivies, réponses à commentaires, badges débloqués. Marquage lu/non-lu | Tous | Haute | ⭐⭐⭐ Haute |
| 3 | **Historique de lecture** | 📖 | `historique` | Suivi de progression de lecture | Oeuvres en cours / terminées / en pause, dernier chapitre lu, barre de progression, reprise rapide | Tous | Haute | ⭐⭐ Moyenne |
| 4 | **Statistiques** | 📊 | `statistiques` | Dashboard analytique détaillé | Graphiques d'activité (contributions/semaine), répartition par genre/type, temps de contribution, évolution mensuelle | Tous | Moyenne | ⭐⭐ Moyenne |
| 5 | **Profil public** | 🌐 | `profilpublic` | Prévisualisation et réglages du profil public | Aperçu de ce que les autres voient, toggle visibilité (stats, oeuvres, commentaires), lien partageable `/u/username` | Tous | Moyenne | ⭐ Basse |
| 6 | **Sécurité** | 🔒 | `securite` | Paramètres de sécurité avancés | Journal des connexions récentes, suppression de compte, export des données (RGPD), sessions actives | Tous | Haute | ⭐ Basse |

## Navigation proposée (ordre final)

| Position | Onglet | Type |
|----------|--------|------|
| 1 | 👤 Profil | Existant |
| 2 | 📚 Bibliothèque | Existant |
| 3 | 💬 Mes commentaires | **NOUVEAU** |
| 4 | 🔔 Notifications | **NOUVEAU** |
| 5 | 📖 Historique de lecture | **NOUVEAU** |
| 6 | 📊 Statistiques | **NOUVEAU** |
| — | *Séparateur conditionnel* | — |
| 7 | 🧩 Indexeur | Existant (conditionnel) |
| 8 | 🏷️ Tags en masse | Existant (conditionnel) |
| 9 | 🛠️ Administration | Existant (conditionnel) |
| — | *Séparateur* | — |
| 10 | 🌐 Profil public | **NOUVEAU** |
| 11 | 🔒 Sécurité | **NOUVEAU** |
| 12 | ⚙️ Paramètres | Existant |
