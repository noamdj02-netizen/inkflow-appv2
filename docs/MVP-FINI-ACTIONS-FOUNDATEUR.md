# MVP InkFlow « fini » — actions fondateur

Ce document définit ce qui constitue un **MVP vendable et opérable**, ce qui est **déjà couvert par le code**, et **exactement ce que toi (fondateur / ops)** dois faire. Le dépôt ne peut pas remplacer la configuration des comptes Stripe, Supabase ou Vercel.

**Documents de référence (à garder ouverts pendant le go-live) :**

- [`PRODUCTION-READINESS-CHECKLIST.md`](./PRODUCTION-READINESS-CHECKLIST.md) — checklist détaillée + tickets Linear types INK-\*
- [`ENV-PRODUCTION.md`](./ENV-PRODUCTION.md) — liste des variables Vercel vs secrets Edge
- [`STRIPE-P0-PRODUCTION.md`](./STRIPE-P0-PRODUCTION.md) — Stripe Live, webhook, idempotence
- [`MONITORING-P0.md`](./MONITORING-P0.md) — Sentry, alertes, uptime
- [`MVP-STATUS-AND-AUDIT.md`](./MVP-STATUS-AND-AUDIT.md) — écarts long terme (mobile, fidélité, rappels) pour après MVP

---

## 1. Définition : « MVP fini » (InkFlow)

Pour ce document, le MVP est **fini** lorsque :

1. Un tatoueur peut **s’inscrire**, **configurer** studio + créneaux + (si activé) **Stripe Connect**, **publier** des flashs.
2. Un client peut **réserver** via `/book/:slug` ou **voir la vitrine** `/studio/:slug`, payer un **acompte** quand c’est prévu, et le tatoueur **voit** la demande / le RDV dans le dashboard.
3. Les **emails critiques** (confirmation, erreurs évidentes) partent via **Resend** + configuration domaine utilisable.
4. **Aucun no-go** de la section 6 de `PRODUCTION-READINESS-CHECKLIST.md` (URLs, Stripe Test/Live mélangés, Connect manquant si tu encaisses en ligne, `SITE_URL` encore en localhost en prod).

**Hors scope MVP strict** (tu peux les faire après la première vague clients) : parité complète **app Expo**, **fidélité J+7/J+30** parfaitement instrumentée en prod, **rappels SMS** partout, polish **PWA** sur tous les appareils, synchro multi-appareils de **chaque** sous-onglet paramètres (voir [`AUDIT-DASHBOARD.md`](./AUDIT-DASHBOARD.md)).

---

## 2. Déjà fait côté produit / code (rien à réinventer)

| Domaine                                                                 | État                                                                                   |
| ----------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| App web **Vite + React** (`App.tsx`, `pages/`, `components/dashboard/`) | Prête fonctionnellement pour démo SaaS avancée                                         |
| **Supabase** (auth, tables `inkflow_*`, Edge Functions)                 | Implémenté ; **RLS** documenté dans [`SECURITY-AUDIT-RLS.md`](./SECURITY-AUDIT-RLS.md) |
| **Stripe** (Checkout, Connect, webhook `stripe-webhook` avec signature) | Code de référence en place — **à brancher en Live** + secrets                          |
| **Types TypeScript BDD**                                                | Régénérables avec `npm run db:types:linked` (projet CLI `supabase link`)               |
| **Build**                                                               | `npm run ci` (lint + typecheck + check Supabase client + build)                        |

---

## 3. Ce que **tu** dois faire — P0 (bloquant « MVP prod »)

Coche dans l’ordre. Détail des cases : `PRODUCTION-READINESS-CHECKLIST.md`.

### 3.1 Supabase (Auth + secrets Edge)

- [ ] **Authentication → URL configuration** : Site URL = **`https://app.ink-flow.me`** (l’app Vite, pas seulement la landing). Redirect URLs : `http://localhost:3000/**`, `https://app.ink-flow.me/**` (et previews si tu en as besoin).
- [ ] **SMTP Auth** (emails de confirmation / reset) : configurer **Custom SMTP** (souvent Resend) — [`SUPABASE-AUTH-SMTP.md`](./SUPABASE-AUTH-SMTP.md).
- [ ] **Edge Functions → Secrets** : au minimum `STRIPE_SECRET_KEY` (Live si prod), `STRIPE_WEBHOOK_SECRET`, `SITE_URL` ou `APP_URL` (URL **https** réelle), `RESEND_API_KEY`, etc. — tableau complet dans [`ENV-PRODUCTION.md`](./ENV-PRODUCTION.md).

### 3.2 Vercel (frontend)

- [ ] Variables **`VITE_*`** : `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, et selon besoin `VITE_STRIPE_PUBLISHABLE_KEY`, `VITE_SENTRY_DSN`, cartes, etc.
- [ ] **Redéployer** après chaque changement de variable `VITE_*` (nouveau build).

### 3.3 Stripe (Live + webhook)

- [ ] Clés **Live** alignées avec le mode du compte et des prix.
- [ ] Webhook **Live** pointant vers  
       `https://<project-ref>.supabase.co/functions/v1/stripe-webhook`  
       et secret `STRIPE_WEBHOOK_SECRET` = **`whsec_`** de **cet** endpoint.
- [ ] **Test paiement réel** ou faible montant + vérifier une seule application métier (idempotence — voir `STRIPE-P0-PRODUCTION.md`).

### 3.4 Déploiement des fonctions critiques

- [ ] Déployer le **paquet** listé dans `PRODUCTION-READINESS-CHECKLIST.md` §7 (au minimum : `stripe-webhook`, `create-checkout-session`, `get-studio-availability`, `notify-new-booking`, puis calendrier si tu vends la feature Google).

### 3.5 Tests manuels minimum (une fois prod branchée)

- [ ] Inscription / login tatoueur.
- [ ] Création **flash** + **créneaux** + vitrine visible.
- [ ] Parcours **client** : `/book/:slug` ou équivalent jusqu’à confirmation (et paiement si activé).
- [ ] **Studio B** (ou second compte) : pas de fuite de données (aperçu — vrai durcissement = respect RLS + pas d’usage admin anon).

### 3.6 Monitoring

- [ ] `VITE_SENTRY_DSN` + **au moins une alerte e-mail** dans Sentry.
- [ ] **Uptime** sur `https://app.ink-flow.me` (outil externe).

### 3.7 Juridique / confiance (minimum)

- [ ] Pages **confidentialité** / **CGU** à jour pour l’URL et l’activité réelles (relecture humaine recommandée).

---

## 4. P1 — Semaine suivante (qualité & résilience)

- [ ] [`BACKUP-RECOVERY-DR.md`](./BACKUP-RECOVERY-DR.md) — PITR, export, test de restauration.
- [ ] `RESEND_WEBHOOK_SECRET` + fonction `resend-webhook` (bounces / plaintes).
- [ ] `AUTH-HARDENING.md` — Turnstile + Upstash si tu exposes beaucoup le login.
- [ ] Repasser **`npm audit`** : suivre la stratégie pour `xlsx` / dépendances (import CSV).

---

## 5. Commandes utiles (machine locale)

```bash
# Santé code avant push
npm run ci

# Types BDD (après supabase link)
npm run db:types:linked

# Secrets / readiness (si scripts configurés)
npm run readiness:env
npm run readiness:sentry
```

Déploiement Edge (adapter les noms) :

```bash
npx supabase functions deploy stripe-webhook --no-verify-jwt
```

(Bloc complet : `PRODUCTION-READINESS-CHECKLIST.md` §7.)

---

## 6. Définition de « terminé » pour la milestone MVP

Tu peux considérer le **MVP livré** lorsque :

- Toutes les cases **§3** ci-dessus sont cochées.
- La checklist **§6 « go / no-go »** de `PRODUCTION-READINESS-CHECKLIST.md` est verte.
- Tu as une **trace écrite** (Notion / Linear) du dernier test booking + webhook.

---

## 7. Après le premier push prod (obligation interne InkFlow)

Voir `CLAUDE.md` — rapport Notion de déploiement + backlog bugs si besoin.

---

_Dernière mise à jour : lien avec la préparation prod InkFlow (Vite port 3000, Supabase Edge, Vercel)._
