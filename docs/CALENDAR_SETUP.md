# Configuration Google Calendar & Apple Calendar — InkFlow

## Vue d'ensemble

L'intégration calendrier permet :
- **Google Agenda** : OAuth + sync bidirectionnelle (push/pull) via Edge Functions Supabase
- **Apple Calendrier** : Export .ics par rendez-vous (sans OAuth)

---

## 1. Variables d'environnement

### Pour Supabase Edge Functions (Secrets)

Dans **Supabase Dashboard → Project Settings → Edge Functions → Secrets** :

| Secret | Valeur | Obligatoire |
|-------|--------|-------------|
| `GOOGLE_CLIENT_ID` | Votre Client ID Google (ex: `xxx.apps.googleusercontent.com`) | Oui |
| `GOOGLE_CLIENT_SECRET` | Votre Client Secret Google | Oui |
| `GOOGLE_REDIRECT_URI` | `http://localhost:5173/dashboard` (dev) ou `https://ink-flow.me/dashboard` (prod) | Oui |
| `SITE_URL` | `https://ink-flow.me` (pour redirections post-OAuth) | Optionnel |

### Pour développement local (.env.local)

Si tu utilises un serveur Next.js ou autre backend local, ajoute :

```env
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxx
GOOGLE_REDIRECT_URI=http://localhost:5173/dashboard
```

**Important** : `GOOGLE_REDIRECT_URI` doit correspondre **exactement** à une URI configurée dans Google Cloud Console.

---

## 2. Google Cloud Console

1. Aller sur [Google Cloud Console](https://console.cloud.google.com)
2. Créer un projet "INKFLOW" (ou utiliser un existant)
3. **APIs & Services → Library** → activer **Google Calendar API**
4. **APIs & Services → Credentials** → **Create Credentials** → **OAuth Client ID**
   - Type : **Web application**
   - Authorized redirect URIs :
     - `http://localhost:5173/dashboard` (dev)
     - `https://votre-domaine.com/dashboard` (prod)
5. Copier **Client ID** et **Client Secret**
6. **OAuth consent screen** : ajouter les scopes `https://www.googleapis.com/auth/calendar` et `https://www.googleapis.com/auth/calendar.events`
7. **Vérification du branding** : pour la validation Google, fournir les URLs publiques :
   - Politique de confidentialité : `https://ink-flow.me/politique-confidentialite`
   - Conditions d'utilisation : `https://ink-flow.me/conditions-utilisation`

---

## 3. Déploiement des Edge Functions

```bash
# Depuis la racine du projet
supabase functions deploy google-calendar-auth
supabase functions deploy google-calendar-sync
supabase functions deploy google-calendar-webhook
```

---

## 4. Utilisation

### Paramètres → Calendrier

- **Connecter Google Agenda** : lance le flux OAuth, redirige vers Google puis revient sur le dashboard
- **Pousser vers Google** : envoie tous les RDV non synchronisés vers Google Calendar
- **Importer de Google** : récupère les événements Google (hors ceux créés par InkFlow)
- **Déconnecter** : supprime les tokens et révoque l'accès

### Sur chaque rendez-vous (liste RDV)

- Icône **lien** : ouvre Google Calendar avec un lien "Ajouter à l'agenda" (sans OAuth)
- Icône **téléchargement** : télécharge un fichier .ics (Apple Calendar, Outlook, etc.)

---

## 5. Sécurité

- Les tokens OAuth sont stockés dans `inkflow_studios` (colonnes `google_access_token`, `google_refresh_token`)
- En production : activer HTTPS, limiter les scopes OAuth au minimum
- Les Edge Functions utilisent `verify_jwt: false` pour permettre l'appel depuis le client ; l'authentification est gérée côté app
