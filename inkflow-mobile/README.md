# Inkflow Pro (mobile tatoueur)

Shell **Expo** qui embarque le dashboard web (`app.ink-flow.me`) + routes natives (dont **Tap to Pay**).

## Prérequis

- Node 20+
- Compte Expo / EAS pour les builds store
- Fichier **`.env`** à la racine de `inkflow-mobile/` (voir `.env.example`) : `EXPO_PUBLIC_SUPABASE_URL` + `EXPO_PUBLIC_SUPABASE_ANON_KEY` — **obligatoire** pour Tap to Pay (Edge `stripe-terminal`). Sinon : erreur *Supabase non configuré* puis *Couldn’t fetch connection token*. Après modification : `npx expo start --clear`.
- Builds **EAS** : déclarer les mêmes variables (`eas secret:create` ou `env` dans `eas.json`) pour que la release les embarque.

## Scripts

| Commande        | Rôle                          |
| --------------- | ----------------------------- |
| `npm start`     | Dev Expo                      |
| `npm run typecheck` | Vérif TypeScript          |
| `npm run ios` / `android` | Lanceur sim / appareil |

**Expo Go** : pas de module natif Stripe Terminal — la route Tap to Pay affiche un message d’info. Pour un vrai test encaissement : **development build** EAS + `.env` Supabase + session InkFlow valide.

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
