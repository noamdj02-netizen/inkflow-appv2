# Inkflow Pro (mobile tatoueur)

Shell **Expo** qui embarque le dashboard web (`app.ink-flow.me`) + routes natives (dont **Tap to Pay**).

## Prérequis

- Node 20+
- Compte Expo / EAS pour les builds store
- Variables décrites dans `.env.example` (copier vers `.env`)

## Scripts

| Commande        | Rôle                          |
| --------------- | ----------------------------- |
| `npm start`     | Dev Expo                      |
| `npm run typecheck` | Vérif TypeScript          |
| `npm run ios` / `android` | Lanceur sim / appareil |

Build production : `eas build` (profils dans `eas.json`).

## Tap to Pay (iPhone)

- Dépend de l’Edge Supabase **`stripe-terminal`** (déployée en prod : `npm run deploy:function:stripe-terminal` depuis la racine du monorepo).
- Stripe Dashboard : compte Connect du studio avec **Tap to Pay on iPhone** activé selon les règles Stripe / pays.
- Handoff depuis le web : `https://app.ink-flow.me/tap-to-pay?…` → nécessite **`apple-app-site-association`** valide (`REPLACE_WITH_APPLE_TEAM_ID` remplacé par ton Team ID Apple).

## Notes App Store

- Bundle iOS : `me.inkflow.studio` (`app.json`).
- Associated Domains : `applinks:app.ink-flow.me`, `applinks:ink-flow.me`.
- Déclarer les usages données (caméra, photo, paiements Stripe) alignés sur `app.json` / privacy manifest.

Voir aussi : `docs/APP-STORE-READINESS-ROADMAP.md`, `docs/WELL-KNOWN-LINKS.md`.
