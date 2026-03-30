# Inkflow — Contexte Claude Code
> Colle ce fichier à la racine de `app.ink-flow.me/` (ton repo Next.js)

## Identité du Projet

Inkflow est un SaaS mobile-first pour tatoueurs. L'app tourne sur `app.ink-flow.me`.
La landing marketing est sur `ink-flow.me` (Framer, séparé).
**Deadline MVP : 29 mars 2026.**

## Stack Technique

- **Frontend** : Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **Backend** : Supabase (PostgreSQL + Auth + Edge Functions)
- **Paiements** : Stripe Checkout + Webhooks
- **Emails** : Resend (templates React)
- **SMS** : Twilio
- **Hosting** : Vercel (frontend) + Supabase (BDD)
- **PWA** : next-pwa

## Design System — Règle absolue

Toujours utiliser ces tokens. Aucune couleur en dur dans les composants.

```ts
// tailwind.config.ts → extend.colors
ink: {
  bg:      '#0d0d0d',   // fond principal
  surface: '#161616',   // cartes, drawers
  border:  '#2a2a2a',   // séparateurs
  text:    '#e8e3dc',   // texte principal (blanc cassé)
  muted:   '#6b6b6b',   // texte secondaire
  accent:  '#c9a96e',   // ocre/cuivre — UNIQUE couleur vive
}
```

**Jamais de fond blanc.** Si tu vois `bg-white` ou `background: white` dans du code généré, c'est une erreur.

## Conventions de Code

- Composants dans `src/components/` — nommage PascalCase
- Hooks dans `src/hooks/` — préfixe `use`
- API routes dans `src/app/api/` — REST conventionnel
- Types Supabase générés dans `src/types/database.ts` (via `supabase gen types`)
- Imports : toujours `@/` alias pour `src/`
- Pas de `any` TypeScript sauf cas extrême commenté
- Tailwind uniquement — pas de CSS modules, pas de styled-components

## Règles Mobile-First

- Toujours écrire le CSS mobile en premier (`sm:` pour les overrides desktop)
- Chaque zone cliquable : minimum `44px × 44px` (norme Apple HIG)
- Ajouter `safe-area-inset` sur tous les layouts root :
  ```tsx
  style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
  ```
- Jamais de `overflow-x` sur body ou html

## Modules MVP (scope 29 mars)

1. **CRM** — `src/app/(app)/clients/` — Fiches clients, statuts, projets
2. **Agenda** — `src/app/(app)/agenda/` — Vue jour, swipe, créneaux
3. **Réservation** — `src/app/book/[slug]/` — Page publique client
4. **Vitrine** — `src/app/p/[slug]/` — Page portfolio tatoueur
5. **Fidélité** — Edge functions Supabase — Emails J+1, J+7, J+30

## Commandes Utiles

```bash
npm run dev          # dev local
npm run build        # vérifier le build avant commit
supabase db push     # appliquer les migrations
supabase gen types typescript --local > src/types/database.ts
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

## Ce qu'on NE fait PAS avant le 29 mars

- Pas de plan Studio (99€) — trop complexe à supporter
- Pas de multi-langue
- Pas de dark/light toggle (100% dark)
- Pas de notifications push (PWA silent install suffit)
- Pas de tests E2E automatisés (tests manuels uniquement)

## 📋 Post-Deploy — Obligation Notion

Après chaque `git push` + build Vercel confirmé :

### 1. Créer un rapport de déploiement
Page parent : https://www.notion.so/332246970fa3819486a3c7a58dbf4bc3
Titre : `[YYYY-MM-DD HH:mm] Deploy — [SUCCESS/FAILED]`
Contenu (template) :
- Commit hash court
- Fichiers modifiés
- Features ajoutées / bugs corrigés
- Erreurs de build ou TypeScript (tsc --noEmit)
- Warnings runtime à surveiller
- Bugs à ouvrir dans le backlog

### 2. Ouvrir les bugs détectés dans le Backlog
Page : https://www.notion.so/b96b09ef9a6d4c0cb1b093a1bab786cc
Champs obligatoires : Titre, Type, Priorité, Module, Status="A trier", Date détection

### 3. Clore les items résolus
Mettre Status="Réglé" + "Résolu le" pour chaque INK-XXX traité dans ce push.
