# FIXES — Pricing final (arbitrage fondateur 2026-08-07)

**Statut global : fait** (code + migration + Stripe TEST + landing + secrets Edge) — **reste** : smoke checkout fondateur si `STRIPE_SECRET_KEY` pas encore en `sk_test_…`.

---

## Décisions fondateur appliquées

| #   | Décision                                              | Action                                                                                              |
| --- | ----------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| 1   | Registre traçabilité légal = socle tous plans payants | Migration Supabase appliquée ; `traceabilite_simple` sur Essentiel+ (solo, pro, studio, enterprise) |
| 2   | Grille **14 / 37 / 99 €** sans grandfathering         | Aucun abonné Live — pas de logique legacy prix ; doc mise à jour                                    |
| 3   | **`stock_complet` retiré** (option 1)                 | Supprimé de `PlanFeatureKey`, `PRO_FEATURES`, `PLANS-PERMISSIONS.md`                                |

---

## Migration Supabase — traçabilité

| Étape                                                                                                     | Résultat                                                 |
| --------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| `supabase db push`                                                                                        | ✗ Échec — décalage historique migrations remote vs local |
| `supabase db query --linked --file supabase/migrations/20260807120000_traceability_register_simplify.sql` | ✓ **Appliqué** sur le projet lié                         |

Contenu : commentaires DEPRECATED sur tables stock commercial + index `idx_consumable_lots_studio_created`. Aucun DROP.

---

## Code modifié (arbitrage)

| Fichier                               | Changement                                                                          |
| ------------------------------------- | ----------------------------------------------------------------------------------- |
| `lib/subscriptionPlans.ts`            | Retrait `stock_complet` de `PRO_FEATURES`                                           |
| `types/index.ts`                      | Retrait union `'stock_complet'`                                                     |
| `hooks/useSubscriptionPermissions.ts` | Commentaire flags                                                                   |
| `docs/PLANS-PERMISSIONS.md`           | Matrice Pro sans stock complet ; traçabilité = tous payants ; pas de grandfathering |
| `.env.example`                        | Price IDs TEST réels (commentés)                                                    |

**Non touché (volontaire)** : `BillingSettings.tsx`, gating sidebar, landing, `PricingSection.tsx`.

---

## Grille Pro après arbitrage

| Plan      | Slug     | €/mois | Différenciation vs Essentiel                                          |
| --------- | -------- | ------ | --------------------------------------------------------------------- |
| Essentiel | `solo`   | 14     | Socle + traçabilité légale                                            |
| Pro       | `pro`    | 37     | + `stats_avancees`, `fidelite`, `multi_calendriers`, `themes_premium` |
| Studio    | `studio` | 99     | + `equipe_roles`, `api_access`                                        |

---

## Stripe — price IDs **mode TEST confirmé**

Création via **Stripe CLI profile test** (`livemode=false` vérifié sur chaque price).  
**.env.local** contient une clé `sk_live_*` — **non utilisée** pour cette opération.

| Secret Supabase Edge          | Price ID (TEST)                  | Montant      |
| ----------------------------- | -------------------------------- | ------------ |
| `STRIPE_PRICE_SOLO_MONTHLY`   | `price_1U1rLc5JVD1yZUQvCUjoA00X` | 14,00 €/mois |
| `STRIPE_PRICE_SOLO_ANNUAL`    | `price_1U1rLc5JVD1yZUQvyEnJ1Ae5` | 144,00 €/an  |
| `STRIPE_PRICE_PRO_MONTHLY`    | `price_1U1rLd5JVD1yZUQviBCz7ltF` | 37,00 €/mois |
| `STRIPE_PRICE_PRO_ANNUAL`     | `price_1U1rLd5JVD1yZUQv5s4gR3Yk` | 372,00 €/an  |
| `STRIPE_PRICE_STUDIO_MONTHLY` | `price_1U1rLe5JVD1yZUQvt9zMpeYv` | 99,00 €/mois |
| `STRIPE_PRICE_STUDIO_ANNUAL`  | `price_1U1rLf5JVD1yZUQvxyVnRGY4` | 948,00 €/an  |

Produits TEST créés : **InkFlow Essentiel**, **InkFlow Pro**, **InkFlow Studio** (metadata `plan` = slug).

### Action fondateur — secrets Edge

~~Dans Supabase Dashboard → Edge Functions → Secrets~~ **Appliqué 2026-08-07** via `bash scripts/set-stripe-test-price-secrets.sh` (projet lié `jnrprkdueseahfrguhvt`).

Vérifier manuellement :

1. `STRIPE_SECRET_KEY` = `sk_test_…` (pas `sk_live_…`)
2. Smoke : checkout Essentiel → webhook → `inkflow_subscriptions.plan = solo`

**Live** : ne pas remplacer les price IDs Live tant qu’aucun abonné n’existe — recréer en Live au moment du go prod si besoin.

---

## Build

```bash
npm run build
```

- Bundle Vite : **OK**
- PWA `stats.html` > 2 Mo : échec **préexistant**

---

## Prochaines étapes (ordre convenu)

1. **Gating dashboard** — `fidelite`, `equipe_roles`, sidebar traçabilité, aligner `BillingSettings` sur 14/37/99 €
2. **Landing pricing** — copy alignée sur flags réels (pas de stock complet, pas de grandfathering)
3. (Optionnel) Réparer historique migrations pour que `supabase db push` refonctionne

---

## Références

- `FIXES-STOCK-2026-08-07.md` — registre traçabilité UI
- `FIXES-PRICING-BACKEND-2026-08-07.md` — travail Agent 2 initial (partiellement supersédé par ce doc)
