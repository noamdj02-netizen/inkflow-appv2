# Configuration Framer ↔ InkFlow App

## Contexte

- **Landing** : https://ink-flow.me (hébergée sur Framer)
- **App** : `https://app.ink-flow.me`

---

## 1. Bouton « Essai gratuit » sur Framer

Pour que le bouton « Essai gratuit » / « Démarrer gratuitement » redirige vers l'inscription de l'app :

1. Dans Framer, sélectionne le bouton
2. Dans les propriétés du lien, définis l'URL vers ton app :
   - **URL** : `https://app.ink-flow.me/signup`

3. Vérifie que l'ID `#pricing` existe sur ta page Framer pour les liens « Voir les tarifs » depuis l'app.

---

## 2. Bouton « Mon compte » / « Tableau de bord » sur Framer

**Réglage crucial pour le tunnel de conversion** : ajoute un bouton « Mon compte » ou « Tableau de bord » sur ta landing Framer.

- **URL** : `https://app.ink-flow.me/dashboard` (ou `https://app.ink-flow.me/login` si tu préfères rediriger vers la connexion)
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
| Landing (Framer) → Clic « Essai gratuit » → App `/signup` | L'utilisateur arrive sur l'app, s'inscrit. La session est stockée dans le **localStorage du domaine de l'app** (app.ink-flow.me). |
| App → Déconnexion | Redirection vers `https://ink-flow.me` (landing). |
| Landing → App (connexion) | Si l'utilisateur a déjà une session sur l'app, elle reste valide tant qu'il reste sur le même domaine. |

**Important** : La landing est sur `ink-flow.me` et l'app sur `app.ink-flow.me`. Ce sont des sous-domaines différents, la session ne se partage pas entre eux. L'utilisateur doit se connecter sur l'app pour avoir une session active.

---

## 5. Mobile : mode app sans barre de tâches

Quand l'utilisateur arrive depuis ink-flow.me (Framer) sur la page Connexion de l'app, une bannière « Ajouter à l'écran d'accueil » s'affiche. Pour une expérience plein écran (sans barre d'adresse) :

1. **iOS** : Menu Safari → « Sur l'écran d'accueil » → l'app s'ouvre en mode standalone
2. **Android** : Menu Chrome → « Ajouter à l'écran d'accueil » → l'app s'ouvre en mode standalone

L'app doit être ajoutée depuis l'URL de l'app (app.ink-flow.me), pas depuis ink-flow.me. Les notifications push ne fonctionnent qu'en mode app installée sur mobile.

---

## 6. URLs configurées dans le code

| Constante | Valeur |
|-----------|--------|
| `LANDING_URL` | `https://ink-flow.me` |
| `APP_URL` | `https://app.ink-flow.me` |
| `LANDING_PRICING_URL` | `https://ink-flow.me/#pricing` |
| `LANDING_PRIVACY_URL` | `https://ink-flow.me/politique-confidentialite` |
| `LANDING_TERMS_URL` | `https://ink-flow.me/conditions-utilisation` |
| `LANDING_LEGAL_URL` | `https://ink-flow.me/mentions-legales` |

Fichier : `lib/urls.ts`

**Voir aussi** : `docs/FRAMER-APP-URLS.md` pour la liste des URLs à copier dans Framer (signup, login, dashboard).

**Important** : Crée ces pages sur Framer pour que les liens fonctionnent :
- `/politique-confidentialite`
- `/conditions-utilisation`
- `/mentions-legales`
