# Gestion des permissions par plan d'abonnement (Stripe)

Configuration centralisée des plans **Solo**, **Studio** et **Enterprise** pour `canAccessFeature()` et `hasReachedLimit()` (frontend et backend).

---

## Règles par plan

| Plan        | Prix  | Artistes | Clients CRM | Features autorisées |
|------------|-------|----------|-------------|----------------------|
| **Solo**   | 29€   | 1        | 100         | Galerie Flash, App mobile |
| **Studio** | 79€   | 3        | Illimité    | Solo + Multi-calendriers, Stats avancées, API |
| **Enterprise** | Sur devis | Illimité | Illimité | Studio + White-label |

Features **interdites** en Solo : API, Stats avancées (elles ne sont pas dans la liste du plan).

---

## Fichiers

- **`lib/subscriptionPlans.ts`** : config `PLAN_CONFIG`, `canAccessFeature(plan, feature)`, `hasReachedLimit(plan, limitKey, currentCount)`, `getPlanLimit()`, `getPlanConfig()`.
- **`lib/subscriptionGuard.ts`** : réexporte ces helpers + `getSubscription(studioId)`, `canAddArtist()`, `isSubscriptionActive()`.
- **`types/index.ts`** : `PlanFeatureKey`, `PlanLimitKey`, `SubscriptionPlan`.
- **`hooks/useSubscriptionPermissions.ts`** : hook frontend qui charge l’abonnement du studio et expose `canAccessFeature`, `hasReachedLimit`, `getLimit`.

---

## Utilisation côté frontend

### Avec le hook (recommandé)

```tsx
import { useSubscriptionPermissions } from '../hooks/useSubscriptionPermissions';

function MyComponent() {
  const { studioId } = useSupabaseSync();
  const { plan, canAccessFeature, hasReachedLimit, getLimit, loading } = useSubscriptionPermissions(studioId);

  if (loading) return <Spinner />;

  // Masquer le lien "API" si le plan n'inclut pas l'accès API
  if (!canAccessFeature('api_access')) return null;

  // Désactiver le bouton "Ajouter un artiste" si limite atteinte
  const artistLimit = getLimit('artists');
  const canAdd = !hasReachedLimit('artists', artists.length);
}
```

### Clés des features (`PlanFeatureKey`)

- `galerie_flash` — Galerie Flash
- `app_mobile` — App mobile
- `api_access` — Accès API
- `stats_avancees` — Statistiques avancées
- `multi_calendriers` — Multi-calendriers
- `white_label` — White-label (Enterprise)

### Clés des limites (`PlanLimitKey`)

- `artists` — Nombre d’artistes
- `clients_crm` — Nombre de clients dans le CRM

---

## Utilisation côté backend (Edge Functions / API)

Importer les helpers depuis la config (ou depuis un module partagé) :

```ts
import { canAccessFeature, hasReachedLimit, getPlanConfig } from './subscriptionPlans';

// Après récupération du plan (ex. depuis inkflow_subscriptions)
const plan = 'solo';
if (!canAccessFeature(plan, 'api_access')) {
  return new Response(JSON.stringify({ error: 'Plan non éligible à l’API' }), { status: 403 });
}

if (hasReachedLimit(plan, 'artists', currentArtistCount)) {
  return new Response(JSON.stringify({ error: 'Limite artistes atteinte' }), { status: 403 });
}
```

---

## Intégration avec les composants existants

- **ArtistManager** : déjà utilisé avec `maxArtists`. Passer `maxArtists={getLimit('artists') === -1 ? 999 : getLimit('artists')}` (ou équivalent) depuis le parent qui utilise `useSubscriptionPermissions`.
- **BillingSettings** : utilise déjà `getSubscription(studioId)` et affiche le plan ; les mêmes données alimentent le plan utilisé par `canAccessFeature` / `hasReachedLimit`.
- **Menus / routes** : conditionner l’affichage des liens "Stats avancées", "API", "White-label" avec `canAccessFeature(plan, 'stats_avancees')`, etc.
