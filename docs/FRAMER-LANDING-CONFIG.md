# Configuration Framer ↔ InkFlow App

## Contexte

- **Landing** : https://ink-flow.me (hébergée sur Framer)
- **App** : Vercel (ex. `https://inkflow-xxx.vercel.app` ou `https://app.ink-flow.me`)

---

## 1. Bouton « Essai gratuit » sur Framer

Pour que le bouton « Essai gratuit » / « Démarrer gratuitement » redirige vers l'inscription de l'app :

1. Dans Framer, sélectionne le bouton
2. Dans les propriétés du lien, définis l'URL vers ton app :
   - **Si l'app est sur Vercel** : `https://ton-projet.vercel.app/signup`
   - **Exemple** : `https://inkflow-hlag75vyx-noam-brochets-projects-2ea9c979.vercel.app/signup`
   - **Si tu as un domaine dédié** (ex. `app.ink-flow.me`) : `https://app.ink-flow.me/signup`

3. Vérifie que l'ID `#pricing` existe sur ta page Framer pour les liens « Voir les tarifs » depuis l'app.

---

## 2. Bouton « Mon compte » / « Tableau de bord » sur Framer

**Réglage crucial pour le tunnel de conversion** : ajoute un bouton « Mon compte » ou « Tableau de bord » sur ta landing Framer.

- **URL** : `https://ton-app.vercel.app/dashboard` (ou `/login` si tu préfères rediriger vers la connexion)
- **Comportement** : L'utilisateur clique depuis `ink-flow.me` → il arrive sur l'app. Le `localStorage` est vide sur ce nouveau domaine, donc il devra **se reconnecter**. C'est normal.
- **Conseil** : Assure-toi que ta page de login soit aussi soignée que ta landing — c'est la première impression des utilisateurs déjà inscrits qui reviennent.

---

## 3. Vérifier l'ancre #pricing sur Framer

Les liens « Voir les tarifs » depuis l'app pointent vers `https://ink-flow.me/#pricing`.

Dans Framer :
1. Sélectionne la section Tarifs
2. Dans **Settings** → **Element** → **ID**, ajoute `pricing` (sans le #)

---

## 4. Gestion des sessions (Landing ↔ App)

Supabase Auth utilise **localStorage** (et non des cookies) pour stocker la session.

| Parcours | Comportement |
|----------|--------------|
| Landing (Framer) → Clic « Essai gratuit » → App `/signup` | L'utilisateur arrive sur l'app, s'inscrit. La session est stockée dans le **localStorage du domaine de l'app** (ex. `xxx.vercel.app`). |
| App → Déconnexion | Redirection vers `https://ink-flow.me` (landing). |
| Landing → App (connexion) | Si l'utilisateur a déjà une session sur l'app, elle reste valide tant qu'il reste sur le même domaine. |

**Important** : Si la landing est sur `ink-flow.me` et l'app sur `xxx.vercel.app`, ce sont des domaines différents. La session ne se partage pas entre eux. L'utilisateur doit se connecter sur l'app pour avoir une session active.

**Recommandation** : Utiliser un sous-domaine pour l'app (ex. `app.ink-flow.me`) et configurer le domaine personnalisé dans Vercel. Ainsi, `ink-flow.me` et `app.ink-flow.me` partagent le même domaine de premier niveau, ce qui peut faciliter la gestion des cookies si tu passes à des cookies plus tard.

---

## 5. URLs configurées dans le code

| Constante | Valeur |
|-----------|--------|
| `LANDING_URL` | `https://ink-flow.me` |
| `LANDING_PRICING_URL` | `https://ink-flow.me/#pricing` |
| `LANDING_PRIVACY_URL` | `https://ink-flow.me/politique-confidentialite` |
| `LANDING_TERMS_URL` | `https://ink-flow.me/conditions-utilisation` |
| `LANDING_LEGAL_URL` | `https://ink-flow.me/mentions-legales` |

Fichier : `lib/urls.ts`

**Important** : Crée ces pages sur Framer pour que les liens fonctionnent :
- `/politique-confidentialite`
- `/conditions-utilisation`
- `/mentions-legales`
