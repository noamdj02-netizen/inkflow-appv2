---
name: aso-audit
description: Audit ASO App Store structuré via l’API Appeeky (métadonnées, mots-clés, avis, concurrents), grille de notation et livrables actionnables.
user-invocable: true
---

# Audit ASO (iOS) — Workflow agent

Utiliser ce skill lorsque l’utilisateur demande un **audit ASO**, une **revue des mots-clés**, une **revue de fiche App Store** ou une **comparaison ASO concurrentielle** pour une **app iOS** (par nom ou **track ID** App Store numérique).

---

## Prérequis

| Exigence | Notes |
|----------|--------|
| **Clé API Appeeky** | Variable d’environnement `APPEEKY_API_KEY`, ou clé fournie une fois par l’utilisateur. En-tête : `X-API-Key: <clé>` |
| **URL de base** | `https://api.appeeky.com` — toutes les routes sont préfixées par `/v1` |
| **Pays** | Par défaut `country=us` sauf si l’utilisateur précise (ex. `fr` pour la France) |

Si l’API est **indisponible** (pas de clé, quota, erreur) : le **dire explicitement** et réaliser un **audit public limité** via l’API iTunes lookup Apple / la page produit publique uniquement, avec une **confiance plus faible** et **pas** de classements mots-clés numériques.

---

## Étapes agent (ordre strict)

### 1. Lire ce skill

Charger la **grille de notation** et le **modèle de sortie** ci-dessous. Ne pas sauter de sections.

### 2. Résoudre l’app

- Si l’utilisateur donne un **ID numérique** (ex. `1617391485`) : utiliser `GET /v1/apps/{id}?country={cc}`.
- Si l’utilisateur donne un **nom** (ex. « Headspace ») : utiliser `GET /v1/search` (selon la doc Appeeky) pour trouver le `trackId`, puis appeler le même endpoint app.
- En parallèle si utile :
  - `GET /v1/apps/{id}?country={cc}` — titre, sous-titre, description, URLs captures, version, indices IAP, etc.
  - `GET /v1/apps/{id}/keywords?country={cc}` — classements organiques / compétitivité (si présent dans la réponse).
  - `GET /v1/apps/{id}/intelligence` — estimations, apps similaires (amorce concurrents).
  - `GET /v1/apps/{id}/reviews?country={cc}` (ou route avis documentée) — distribution des notes, thèmes récents.
  - Optionnel : `GET /v1/keywords/compare` avec les track ID concurrents si l’utilisateur a nommé des concurrents ou qu’ils apparaissent dans « similar apps ».

Utiliser l’enveloppe JSON **`data`** (`{ "data": { ... } }`).

### 3. Noter chaque facteur (0–10)

Appliquer la **grille** de la section suivante. Utiliser des demi-points si besoin (ex. 7,5). **Documenter une ligne de preuve** par note (citer un champ ou une métrique).

### 4. Restituer la sortie

Produire **exactement** ces quatre blocs (titres comme ci-dessous) **en français** :

1. **Carte de score ASO** — tableau + score **global pondéré** /100 (voir pondérations).
2. **Gains rapides** — ≤ 7 jours, faible effort (micro-copy, ordre des mots-clés, termes évidents manquants).
3. **Changements à fort impact** — captures, sous-titre, rafraîchissement du jeu de mots-clés, localisation — effort plus élevé.
4. **Recommandations stratégiques** — positionnement catégorie, thèmes Apple Search Ads, saisonnalité, réponse aux avis, rythme.

Ton : direct, actionnable, sans remplissage. **Ne pas inventer** les chiffres API ; si un champ manque, indiquer **« non disponible dans la réponse API »** et réduire la confiance.

---

## Grille de notation (0–10 chacun)

| Facteur | Quoi évaluer | 8–10 | 4–7 | 0–3 |
|---------|----------------|------|-----|-----|
| **Titre (30 car.)** | Marque + mot-clé d’intention principal ; pas de bourrage ; lisible | Valeur claire + adéquation mot-clé | Mot-clé faible ou titre chargé | Bourré, confus, hors marque |
| **Sous-titre (30 car.)** | Bénéfice secondaire + mot-clé ; complémentaire du titre | Renforce le titre | Redondant ou générique | Vide, trompeur |
| **Champ mots-clés** (si déductible des rangs/API) | Couverture vs intention ; compétitivité maîtrisée | Bon mix tête + milieu de queue | Lacunes vs concurrents | Oublis évidents ou marque seule |
| **Description (2–3 premières lignes)** | Accroche, clarté, preuve sociale | Accroche + preuve solides | Entrée en matière faible | Pavé, pas d’accroche |
| **Créatifs (captures / vidéo)** | Proposition de valeur, lisibilité, ordre, localisation | Récit clair, 3–5 visuels forts | Ordre / textes moyens | Générique, illisible en miniature |
| **Notes et avis** | Moyenne, volume, récence, thèmes | 4,5+ et volume sain ou en hausse | Thèmes mitigés / stagnation | Faible volume ou forte baisse |
| **Catégorie et positionnement** | Adéquation catégorie, parité fonctionnelle vs leaders | Niche crédible | Dérive ou mauvaise catégorie | — |
| **Écart concurrents** (si données compare) | Chevauchement vs lacunes vs 2–3 pairs | Lacunes exploitables | Copie des leaders | Pas de données → N/A (noter 5 neutre et expliquer) |

**Pondérations (pour le /100 global) :**  
Titre 15, Sous-titre 15, Mots-clés 20, Description 10, Créatifs 15, Notes 15, Catégorie 5, Écart concurrents 5.  
`Global = Σ (note_i × poids_i / 10)`.

---

## Modèle de sortie

```markdown
## Carte de score ASO — {Nom de l’app} (`{trackId}`) · {pays}

| Facteur | Note | Poids | Pondéré | Preuve |
|---------|------|-------|---------|--------|
| Titre | x/10 | 15 % | … | … |
| … | … | … | … | … |
| **Global** | — | 100 % | **NN/100** | — |

## Gains rapides
- …

## Changements à fort impact
- …

## Recommandations stratégiques
- …
```

---

## Exemples d’appels API (référence)

```http
GET https://api.appeeky.com/v1/apps/{trackId}?country=us
X-API-Key: ${APPEEKY_API_KEY}

GET https://api.appeeky.com/v1/apps/{trackId}/keywords?country=us
X-API-Key: ${APPEEKY_API_KEY}
```

(Ajuster les chemins selon la doc Appeeky actuelle si elle diffère.)

---

## Exemples d’invocation

- « Lance un audit ASO pour Headspace » → recherche app → fetch → notation → modèle.
- « Audit ASO app id 1617391485 » → `GET /v1/apps/1617391485` direct.

---

## Divulgation progressive

- **Inkflow** : ce skill est un **ASO iOS générique** ; ne pas le confondre avec le skill captures App Store produit (`aso-appstore-screenshots`).
- Préférer les **données API réelles** à l’invention ; en cas d’hypothèse, étiqueter **Hypothèse** et **À vérifier via ASC / Appeeky**.
