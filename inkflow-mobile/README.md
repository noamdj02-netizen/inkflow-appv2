# Inkflow Pro (mobile tatoueur)

Shell **Expo** qui embarque le dashboard web (`app.ink-flow.me`) + routes natives (dont **Tap to Pay**).

## Prérequis

- Node 20+
- Compte Expo / EAS pour les builds store
- Fichier **`.env`** à la racine de `inkflow-mobile/` (voir `.env.example`) : `EXPO_PUBLIC_SUPABASE_URL` + `EXPO_PUBLIC_SUPABASE_ANON_KEY` — **obligatoire** pour Tap to Pay / Checkout (Edge `stripe-terminal`, `create-checkout-session`). Sinon : erreurs *Supabase non configuré* / *Couldn’t fetch connection token*. Après modification : `npx expo start --clear`.
- Builds **EAS** : déclarer les mêmes variables (`eas secret:create` ou `env` dans `eas.json`) pour que la release les embarque.

## Scripts

| Commande        | Rôle                          |
| --------------- | ----------------------------- |
| `npm start`     | Dev Expo                      |
| `npm run typecheck` | Vérif TypeScript          |
| `npm run ios` / `android` | Lanceur sim / appareil |

### WebView dashboard (même build que le web)

L’app charge **`https://app.ink-flow.me/dashboard`** (ou `EXPO_PUBLIC_WEB_APP_URL` en dev, ex. `http://localhost:3000` après `npm run dev` à la racine du monorepo).

Deep links `inkflowpro://` → onglets dashboard (`agenda`, `requests`, `stock`, `messaging`, `finance`, `clients`, …). Haptique sidebar : le web envoie `inkflow_haptic_selection` au shell natif.

**Expo Go** : pas de NFC Tap to Pay (Terminal natif). La modale propose **Stripe Checkout** (carte / Apple Pay) pour encaisser le solde tant que tu es connecté (session native synchronisée). Pour le **vrai** Tap to Pay iPhone : **development build ou prod** EAS + `.env` Supabase.

Build production (EAS est en **devDependency** du projet — pas besoin d’installer `eas` en global) :

```bash
npx eas-cli login          # une fois
npx eas-cli build --platform ios --profile production
npx eas-cli submit --platform ios --profile production
```

Équivalent : `npm run eas:build:ios` puis `npm run eas:submit:ios` (profils dans `eas.json`).

Si tu préfères une install globale : `npm install -g eas-cli` (peut exiger des droits — préfère `npx`).

## Tap to Pay (iPhone)

- Dépend de l’Edge Supabase **`stripe-terminal`** (déployée en prod : `npm run deploy:function:stripe-terminal` depuis la racine du monorepo).
- Stripe Dashboard : compte Connect du studio avec **Tap to Pay on iPhone** activé selon les règles Stripe / pays.
- Handoff depuis le web : `https://app.ink-flow.me/tap-to-pay?…` → nécessite **`apple-app-site-association`** valide (`REPLACE_WITH_APPLE_TEAM_ID` remplacé par ton Team ID Apple).

## Notes App Store

- Bundle iOS : `me.inkflow.studio` (`app.json`).
- Associated Domains : `applinks:app.ink-flow.me`, `applinks:ink-flow.me`.
- Déclarer les usages données (caméra, photo, paiements Stripe) alignés sur `app.json` / privacy manifest.

Voir aussi : `docs/APP-STORE-READINESS-ROADMAP.md`, `docs/WELL-KNOWN-LINKS.md`.
