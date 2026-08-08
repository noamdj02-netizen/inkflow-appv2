# Gestion des permissions par plan d'abonnement (Stripe)

Configuration centralisée des plans **Essentiel** (slug `solo`), **Pro**, **Studio** et **Enterprise** pour `canAccessFeature()` et `hasReachedLimit()` (frontend et backend).

### Taxonomie marketing vs code Stripe

Les **valeurs canoniques dans le dépôt** restent les enums TypeScript **`SubscriptionPlan`** : `solo` | `pro` | `studio` | `enterprise` (voir **`lib/subscriptionPlans.ts`**).

| Libellé commercial | Slug code / Stripe metadata | Prix cible (€/mois) |
| ------------------ | --------------------------- | ------------------- |
| **Essentiel**      | `solo`                      | ~12–15 (cible 14)   |
| **Pro**            | `pro`                       | ~35–39 (cible 37)   |
| **Studio**         | `studio`                    | ~99                 |
| **Enterprise**     | `enterprise`                | Sur devis           |

En messaging public (pricing, landing, emails), tu peux utiliser les libellés commerciaux ci-dessus tant que :

1. **`plan`** / **`plan_type`** (Stripe / `inkflow_subscriptions`) est **mappé explicitement** vers un des quatre slugs.
2. **Prix affichés** et **Stripe price IDs** correspondent à cette ligne — pas de confusion entre deux grilles différentes.
3. **Aucun price ID Live** n’est modifié sans validation fondateur (voir `.cursor/rules/pricing-retention.mdc`).

Document de détail métier prix / features : tableau ci‑dessous aligné **`PLAN_CONFIG`**.

---

## Règles par plan (grille cible 2026-08)

| Plan           | Slug         | Prix cible | Artistes | Clients CRM | Résumé fonctionnel                                                                 |
| -------------- | ------------ | ---------- | -------- | ----------- | ---------------------------------------------------------------------------------- |
| **Essentiel**  | `solo`       | ~14€       | 1        | 100         | Agenda, CRM, vitrine + acompte Stripe, facturation, **registre traçabilité légal** |
| **Pro**        | `pro`        | ~37€       | 3        | 300         | Essentiel + stats avancées, fidélité, multi-cal., thèmes premium                   |
| **Studio**     | `studio`     | ~99€       | 5        | Illimité    | Pro + **équipe / droits par rôle**, accès API                                      |
| **Enterprise** | `enterprise` | Sur devis  | Illimité | Illimité    | Studio + white-label                                                               |

---

## Matrice des feature flags (`PlanFeatureKey`)

| Feature               | Essentiel (`solo`) | Pro | Studio | Enterprise | Usage produit (cible gating)                         |
| --------------------- | :----------------: | :-: | :----: | :--------: | ---------------------------------------------------- |
| `reservations_online` |         ✓          |  ✓  |   ✓    |     ✓      | Agenda / book / RDV                                  |
| `stripe_payments`     |         ✓          |  ✓  |   ✓    |     ✓      | Acomptes Stripe Connect                              |
| `paypal_payments`     |         ✓          |  ✓  |   ✓    |     ✓      | PayPal via Stripe Checkout                           |
| `vitrine_public`      |         ✓          |  ✓  |   ✓    |     ✓      | Page studio publique                                 |
| `crm_clients`         |         ✓          |  ✓  |   ✓    |     ✓      | CRM (limite `clients_crm`)                           |
| `galerie_flash`       |         ✓          |  ✓  |   ✓    |     ✓      | Galerie Flash vitrine                                |
| `app_mobile`          |         ✓          |  ✓  |   ✓    |     ✓      | Parcours mobile / shell Inkflow Pro                  |
| `facturation`         |         ✓          |  ✓  |   ✓    |     ✓      | Module finance / facturation électronique (pilotage) |
| `traceabilite_simple` |         ✓          |  ✓  |   ✓    |     ✓      | Registre traçabilité légal (tous plans payants)      |
| `stats_avancees`      |                    |  ✓  |   ✓    |     ✓      | Onglet Statistiques dashboard                        |
| `fidelite`            |                    |  ✓  |   ✓    |     ✓      | Programme fidélité (tampons, points, emails)         |
| `multi_calendriers`   |                    |  ✓  |   ✓    |     ✓      | Agendas multiples / équipe légère                    |
| `themes_premium`      |                    |  ✓  |   ✓    |     ✓      | Thèmes vitrine premium                               |
| `equipe_roles`        |                    |     |   ✓    |     ✓      | Multi-artistes + permissions collaborateur           |
| `api_access`          |                    |     |   ✓    |     ✓      | Clés API / intégrations                              |
| `white_label`         |                    |     |        |     ✓      | White-label Enterprise                               |

**Note stock** : `traceabilite_simple` = registre légal (art. R.513-10-15 CSP) sur **tous les plans payants** — ce n’est pas un upsell Pro. Pro se différencie par stats + fidélité (+ multi-cal., thèmes).

---

## Fichiers

- **`lib/subscriptionPlans.ts`** : `PLAN_CONFIG`, `PLAN_DISPLAY_NAMES`, `PLAN_TARGET_PRICE_EUR`, `canAccessFeature()`, `hasReachedLimit()`, `getPlanLimit()`, `getPlanConfig()`.
- **`lib/subscriptionGuard.ts`** : réexporte ces helpers + `getSubscription(studioId)`, `canAddArtist()`, `isSubscriptionActive()`.
- **`types/index.ts`** : `PlanFeatureKey`, `PlanLimitKey`, `SubscriptionPlan`.
- **`hooks/useSubscriptionPermissions.ts`** : hook frontend qui charge l’abonnement du studio et expose `canAccessFeature`, `hasReachedLimit`, `getLimit`.
- **`supabase/functions/create-subscription/index.ts`** : Checkout abonnement — secrets `STRIPE_PRICE_*` (TEST jusqu’à validation fondateur).

---

## Utilisation côté frontend

### Avec le hook (recommandé)

```tsx
import { useSubscriptionPermissions } from '../hooks/useSubscriptionPermissions';

function MyComponent() {
  const { studioId } = useSupabaseSync();
  const { plan, canAccessFeature, hasReachedLimit, getLimit, loading } =
    useSubscriptionPermissions(studioId);

  if (loading) return <Spinner />;

  if (!canAccessFeature('fidelite')) return <Paywall feature="fidelite" />;

  const canAddArtist = !hasReachedLimit('artists', artists.length);
}
```

### Gating dashboard (état actuel vs cible)

| Zone dashboard               | Flag recommandé            | Câblé aujourd’hui                          |
| ---------------------------- | -------------------------- | ------------------------------------------ |
| Statistiques (`analytics`)   | `stats_avancees`           | ✓ `DashboardPro`                           |
| Fidélité (`clients/loyalty`) | `fidelite`                 | ☐ préférence module uniquement             |
| Stock traçabilité            | `traceabilite_simple`      | ✓ gate panel (`StockAndTraceabilityPanel`) |
| Finance / facturation        | `facturation`              | ☐ préférence module uniquement             |
| Artistes / permissions       | `equipe_roles` + `artists` | ☐ limite sièges via `hasReachedLimit` seul |

---

## Utilisation côté backend (Edge Functions / API)

```ts
import { canAccessFeature, hasReachedLimit } from './subscriptionPlans';

const plan = 'solo';
if (!canAccessFeature(plan, 'fidelite')) {
  return new Response(JSON.stringify({ error: 'Fidélité réservée au plan Pro' }), { status: 403 });
}
```

---

## Stripe TEST — secrets Edge (placeholders)

Créer en **mode TEST** Stripe Dashboard → Product catalog :

| Produit Stripe (TEST) | Slug metadata | Secret mensuel                | Secret annuel                |
| --------------------- | ------------- | ----------------------------- | ---------------------------- |
| InkFlow Essentiel     | `solo`        | `STRIPE_PRICE_SOLO_MONTHLY`   | `STRIPE_PRICE_SOLO_ANNUAL`   |
| InkFlow Pro           | `pro`         | `STRIPE_PRICE_PRO_MONTHLY`    | `STRIPE_PRICE_PRO_ANNUAL`    |
| InkFlow Studio        | `studio`      | `STRIPE_PRICE_STUDIO_MONTHLY` | `STRIPE_PRICE_STUDIO_ANNUAL` |

Valeurs placeholder documentées dans `.env.example` — **ne pas** committer de vrais `price_` Live.

---

## Migration abonnés existants

| Situation            | Action recommandée                                                                               |
| -------------------- | ------------------------------------------------------------------------------------------------ |
| Abonnés Live         | **Aucun abonné Live au 2026-08-07** — pas de grandfathering ; nouvelle grille 14/37/99 € directe |
| Slug `solo` en base  | **Aucun rename** — seul le libellé affiché passe à « Essentiel »                                 |
| Flag `stock_complet` | **Retiré** (2026-08-07) — UI comparateur/catalogue supprimée ; pas de flag fantôme               |
| Nouveaux flags       | Brancher le gating UI progressivement (`fidelite`, `equipe_roles`, etc.)                         |
