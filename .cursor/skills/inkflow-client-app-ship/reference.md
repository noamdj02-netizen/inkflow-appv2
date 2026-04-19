# Référence — app client InkFlow

## Périmètre typique

| Zone | Dossiers / entrées |
|------|---------------------|
| Web client | `pages/public/ClientDashboard.tsx`, booking public, vitrine |
| Mobile client | `inkflow-mobile/` (Expo Router) — ignorer doublons de dossier si présents (`docs/AGENTS-INKFLOW.md`) |
| Données | `lib/clientPortalProfile.ts`, `lib/clientHealthProfile.ts`, `lib/supabaseBookings.ts`, tables `inkflow_*` côté client |

## Checklist revue (approfondie)

- **Auth** : session requise là où nécessaire ; redirection login si anonyme sur route protégée.
- **Données** : `studio_id` / filtres RLS respectés ; pas de `select('*')` inutile sur données sensibles.
- **Formulaires** : validation côté UI + gestion erreur API ; bouton désactivé pendant `loading`.
- **Temps réel** : unsubscribe / `cancelled` dans les `useEffect` si abonnements.
- **Accessibilité** : `aria-label` sur icônes cliquables ; ordre de focus modales.

## Livraison « fiable »

- Une feature = un flux testable de bout en bout (même manuel).
- Documenter dans la PR : tables touchées, risque RLS, rollback si feature flag absent.

## Docs projet

- `docs/SECURITY-AUDIT-RLS.md` — RLS
- `docs/SIGNUP-DASHBOARD-QA.md` — tunnel auth (contexte proche)
- Conventions UI : `.cursor/rules/inkflow-saas-conventions.mdc` (sections pertinentes client)
