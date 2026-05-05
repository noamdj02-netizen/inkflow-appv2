# Inkflow — Contexte Claude Code

> Repo principal `app.ink-flow.me/` : ce dépôt est **Vite + React** avec routes dans **`App.tsx`** et dossier **`pages/`** (voir aussi `mon-app/` pour un petit Next isolé).

## Identité du Projet

Inkflow est un SaaS mobile-first pour tatoueurs. L'app tourne sur `app.ink-flow.me`.
La landing marketing est sur `ink-flow.me` (Framer, séparé).
**Deadline MVP : 29 mars 2026.**

## Stack Technique

- **Frontend** : **Vite + React** + TypeScript + Tailwind CSS (routage : `App.tsx` + sous-pages lazy dans `pages/`)
- **Backend** : Supabase (PostgreSQL + Auth + Edge Functions)
- **Paiements** : Stripe Checkout + Connect + Webhooks
- **Emails** : Resend (templates React)
- **SMS** : Twilio
- **Hosting** : Vercel (frontend) + Supabase (BDD)
- **PWA** : `vite-plugin-pwa` (voir `vite.config`)

## Dashboard Pro vs surfaces publiques

- **Vue tatoueur (`/dashboard`)** : peut utiliser **thème jour/nuit** (stockage utilisateur ; voir `App.tsx`, `InkflowThemeProvider`).
- **Surfaces vitrine/book/client forcées light** dans `App.tsx` — ne pas extrapoler uniquement depuis la charte tout-dark ci‑dessous.

---

## Charte foncée (landing / anciennes références)

Tokens historiques encore utiles pour **copy et emails foncés** :

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

Sur le dashboard shadcn + zinc (`inkflow-saas-conventions`), respecter les **tokens et patterns** déjà utilisés dans `components/dashboard/`.

## Conventions de Code

- Composants métier sous **`components/`** — PascalCase (`components/dashboard/`, `components/ui/`…).
- Hooks dans **`hooks/`** — préfixe `use`
- Routage SPA : liste des chemins dans **`App.tsx`** (voir routes `/dashboard`, `/book/:slug`, `/studio/:slug`, `/client/...`).
- Types Supabase dans **`types/database.ts`** (`supabase gen types`)
- Imports : alias **`@/`** depuis la racine du projet (`tsconfig.json`).
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

1. **CRM** — Clients dans le dashboard (`DashboardPro`, onglets clients / demandes).
2. **Agenda** — Vue agenda + rendez-vous (`components/dashboard/AppointmentsView`, `AgendaSummaryTab`).
3. **Réservation** — `/book/:slug` — `pages/public/PublicBookingPage.tsx` + `hooks/useBookingFlow.ts`.
4. **Vitrine** — `/studio/:slug` canonique (`PublicStudioPagePro.tsx`).
5. **Fidélité** — Edge functions Supabase (emails, tampons selon migrations).

## Commandes Utiles

```bash
npm run dev          # dev local Vite
npm run build        # vérifier le build avant commit
supabase db push     # appliquer les migrations
supabase gen types typescript --local > types/database.ts
# Webhook Stripe : URL Edge Supabase stripe-webhook (pas de route locale Next `/api/` dans ce repo)
```

## Stratégie offres Stripe / plans SaaS tattooer

Les **plans produit InkFlow sont définis en code** (`lib/subscriptionPlans.ts`, `subscriptionPlan`: **solo**, **pro**, **studio**, **enterprise**) et documentés avec les prix cibles dans **`docs/PLANS-PERMISSIONS.md`**.

- **Décision rollout** : jusqu’à quels paliers Stripe **facturer/activer en prod** (support, onboarding) est une **question business** distincte du code ;
- lorsque le plan **studio** ou **enterprise** **n’est pas encore en vente active**, désactiver côté **Stripe Dashboard / prix** ou feature flags plutôt qu’à supprimer l’entrée **`PLAN_CONFIG`** (pour garder frontend et Edge cohérents).

Voir aussi **`.cursor/rules/pricing-retention.mdc`** (ne pas changer les prix / price IDs sans validation fondateur).

## Ancienne note « hors scope MVP »

- ~~Pas de dark/light toggle sur tout le produit~~ : le dashboard Pro supporte désormais thème utilisateur (**light/dark**) sur `/dashboard`.

## Scope produit encore volontairement limité (à valider roadmap)

- **Pas de multi-langue complète produit avant décision Phase 2+** (`docs`/règle i18n).
- **Push** : Web Push **VAPID** sur PWA navigateur ; **Expo Push** pour l’app enveloppe **Inkflow Pro** (`inkflow-mobile`, UA `InkflowProShell`). Voir `docs/WEB-PUSH.md`.
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
