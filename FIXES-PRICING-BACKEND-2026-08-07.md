# FIXES — Pricing backend (3 paliers commerciaux)

**Date** : 2026-08-07  
**Agent** : AGENT 2 — Pricing / plans backend  
**Statut global** : **partiel** — config + doc + scaffolding TEST faits ; gating dashboard complet et price IDs Stripe TEST réels = **besoin arbitrage fondateur** pour Live.

---

## Résumé exécutif

Restructuration documentée et codée vers **3 paliers commerciaux** (Essentiel / Pro / Studio) en **conservant les slugs** `solo` | `pro` | `studio` | `enterprise`. Nouveaux flags `PlanFeatureKey` pour facturation, stock (simple vs complet), fidélité et équipe. **Aucun price ID Live modifié.** Le dashboard n’a pas été re-câblé sur les nouveaux flags (hors `stats_avancees` déjà en place).

---

## Matrice plans — avant vs cible

|                      | **Avant (PLAN_CONFIG)**      | **Cible (2026-08)**                                         |
| -------------------- | ---------------------------- | ----------------------------------------------------------- |
| **Palier 1**         | Solo · 29€ · slug `solo`     | **Essentiel** · ~14€ · slug `solo` (inchangé)               |
| **Palier 2**         | Pro · 49€ · slug `pro`       | **Pro** · ~37€ · slug `pro`                                 |
| **Palier 3**         | Studio · 99€ · slug `studio` | **Studio** · 99€ · slug `studio`                            |
| **Palier 4**         | Enterprise · devis           | Enterprise · devis (inchangé)                               |
| **Limites artistes** | 1 / 3 / 5 / ∞                | Inchangé                                                    |
| **Limites CRM**      | 100 / 300 / ∞ / ∞            | Inchangé                                                    |
| **API**              | Studio+                      | Studio+ (inchangé)                                          |
| **Équipe / rôles**   | Implicite (limite sièges)    | Flag explicite `equipe_roles` (Studio+)                     |
| **Fidélité**         | Non flaggée                  | `fidelite` (Pro+)                                           |
| **Stock**            | Non flaggée                  | `traceabilite_simple` (Essentiel+) · `stock_complet` (Pro+) |
| **Facturation**      | Non flaggée                  | `facturation` (Essentiel+)                                  |

---

## Feature flags par tier

### Essentiel (`solo`)

| Flag                  |     |
| --------------------- | --- |
| `reservations_online` | ✓   |
| `stripe_payments`     | ✓   |
| `paypal_payments`     | ✓   |
| `vitrine_public`      | ✓   |
| `crm_clients`         | ✓   |
| `galerie_flash`       | ✓   |
| `app_mobile`          | ✓   |
| `facturation`         | ✓   |
| `traceabilite_simple` | ✓   |

### Pro (`pro`)

Tout Essentiel **+**

| Flag                |     |
| ------------------- | --- |
| `stats_avancees`    | ✓   |
| `fidelite`          | ✓   |
| `stock_complet`     | ✓   |
| `multi_calendriers` | ✓   |
| `themes_premium`    | ✓   |

### Studio (`studio`)

Tout Pro **+**

| Flag           |     |
| -------------- | --- |
| `equipe_roles` | ✓   |
| `api_access`   | ✓   |

### Enterprise

Tout Studio **+** `white_label`

---

## Alignement stock / traçabilité (interface Agent 1)

Flags pour le module Stock — gating **panel** fait (Agent 1) ; sidebar Traçabilité toujours visible :

| Flag                  | Tier min  | Comportement UI                                                           |
| --------------------- | --------- | ------------------------------------------------------------------------- |
| `traceabilite_simple` | Essentiel | Registre légal dans `StockAndTraceabilityPanel` (upsell si absent)        |
| `stock_complet`       | Pro       | **Orphelin UI** — décision fondateur : retirer flag, Phase 2, ou renommer |

---

## Fichiers modifiés

| Fichier                                           | Changement                                                                      |
| ------------------------------------------------- | ------------------------------------------------------------------------------- |
| `lib/subscriptionPlans.ts`                        | Grille 3 paliers, `PLAN_DISPLAY_NAMES`, `PLAN_TARGET_PRICE_EUR`, nouveaux flags |
| `types/index.ts`                                  | Extension `PlanFeatureKey` (5 flags)                                            |
| `docs/PLANS-PERMISSIONS.md`                       | Matrice complète, Stripe TEST, migration                                        |
| `hooks/useSubscriptionPermissions.ts`             | Commentaire flags récents                                                       |
| `.env.example`                                    | Placeholders `STRIPE_PRICE_*` TEST + MRR fondateur                              |
| `supabase/functions/create-subscription/index.ts` | Commentaires prix cible par slug                                                |

**Non modifiés (volontairement)** : `BillingSettings.tsx`, landing, `PricingSection.tsx`, migrations, webhook Live.

---

## Checklist Stripe TEST

À exécuter dans **Stripe Dashboard → mode TEST** :

1. [ ] Produit **InkFlow Essentiel** — récurrent mensuel **14,00 €** → copier `price_…` → secret `STRIPE_PRICE_SOLO_MONTHLY`
2. [ ] Même produit — récurrent annuel (ex. **144 €/an**, ~12 €/mois) → `STRIPE_PRICE_SOLO_ANNUAL`
3. [ ] Produit **InkFlow Pro** — mensuel **37,00 €** → `STRIPE_PRICE_PRO_MONTHLY`
4. [ ] Pro — annuel (ex. **372 €/an**) → `STRIPE_PRICE_PRO_ANNUAL`
5. [ ] Produit **InkFlow Studio** — mensuel **99,00 €** → `STRIPE_PRICE_STUDIO_MONTHLY`
6. [ ] Studio — annuel (ex. **948 €/an**) → `STRIPE_PRICE_STUDIO_ANNUAL`
7. [ ] Metadata abonnement : `plan` = `solo` | `pro` | `studio` (déjà posé par `create-subscription`)
8. [ ] Secrets Supabase Edge (TEST keys `sk_test_…`) — **pas** de `sk_live_`
9. [ ] Smoke : POST `create-subscription` avec plan `solo` → Checkout TEST → webhook → `inkflow_subscriptions.plan = solo`

**Placeholders doc** : voir `.env.example` (`price_TEST_*_REPLACE_ME`).

**Live existant** : si des `STRIPE_PRICE_*` Live sont déjà en prod (29 / 49 / 99 €), **ne pas les remplacer** sans validation fondateur — grandfathering documenté dans `docs/PLANS-PERMISSIONS.md`.

---

## Breaking changes / migration abonnés

| Risque                                                      | Mitigation                                                                                               |
| ----------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Libellé « Solo » → « Essentiel »                            | Affichage via `PLAN_DISPLAY_NAMES` ; slug DB inchangé                                                    |
| Prix affichés dashboard (`BillingSettings` encore 29/49/99) | **Incohérence connue** — mise à jour UI hors scope Agent 2                                               |
| Essentiel sans `fidelite` / `stock_complet`                 | Abonnés `solo` actuels n’avaient déjà pas ces flags ; pas de régression code tant que gating non branché |
| Studios Pro payant 49€ Live                                 | Conserver price ID Live jusqu’à communication + portail Stripe                                           |
| `equipe_roles` nouveau                                      | Collaborateurs déjà gérés par permissions artiste — flag prêt pour paywall Studio                        |

**Recommandation fondateur** : décider date bascule prix TEST → Live et politique grandfathering (prix bloqué vs upgrade volontaire).

---

## Ce qui n’a PAS été fait

| Item                                                                  | Raison                                                                                                                 |
| --------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Landing / Framer / `PricingSection.tsx`                               | Scope explicite interdit                                                                                               |
| Price IDs Stripe Live                                                 | Règle `pricing-retention.mdc` — validation fondateur requise                                                           |
| Gating dashboard `fidelite`, `stock_*`, `facturation`, `equipe_roles` | Préférence doc vs edits larges `DashboardPro` ; seul `stats_avancees` déjà câblé sidebar                               |
| Gating traçabilité dans le panel                                      | **Fait par Agent 1 (reprise)** — `StockAndTraceabilityPanel` + upsell Essentiel ; sidebar Traçabilité toujours visible |
| `BillingSettings` cartes tarifaires                                   | Copy/prix UI hors scope ; incohérence temporaire avec `PLAN_CONFIG`                                                    |
| Edge enforcement backend (403 sur APIs stock/fidélité)                | Hors scope minimal ; flags prêts pour phase suivante                                                                   |
| Commit git                                                            | Consigne tâche                                                                                                         |

---

## Build

```bash
npm run build
```

**Résultat** : bundle Vite **OK** (6898 modules, ~21 s). Échec **post-build PWA** préexistant : `stats.html` (3,52 Mo) dépasse `maximumFileSizeToCacheInBytes` (2 Mo) — **non lié** aux changements pricing. TypeScript / compilation : **OK**.

---

## Prochaines étapes suggérées

1. Fondateur : créer price IDs **TEST** + valider fourchettes 12–15 / 35–39 / 99 €.
2. Agent dashboard : brancher `canAccessFeature('fidelite'|'stock_complet'|'traceabilite_simple'|'facturation'|'equipe_roles')` dans `DashboardPro` / sidebar.
3. Aligner `BillingSettings` sur `PLAN_CONFIG` + `PLAN_DISPLAY_NAMES` (Agent UI ou fondateur).
4. Décision Live : grandfathering vs migration price IDs.
