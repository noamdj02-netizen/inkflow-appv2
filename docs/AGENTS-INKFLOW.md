# Agents InkFlow — Utilisation dans Cursor

Trois **personas** (règles Cursor optionnelles) complètent la règle toujours active `inkflow-saas-conventions.mdc`. Ils ne remplacent pas les conventions : ils ajoutent mission + format de livrable.

## Comment les invoquer

1. **Composer / Chat** : attache la règle correspondante via le sélecteur de règles (@), ou colle un rappel du type : « Agis selon l’agent Dev/QA InkFlow ».
2. **Tâche ciblée** : une seule persona par thread évite les mélanges de priorités (ex. ne pas mélanger audit RLS et refonte copy dans le même message si tu veux un livrable net).

## Fichiers

| Persona | Fichier | Usage typique |
|--------|---------|----------------|
| Dev / QA | [`.cursor/rules/inkflow-agent-dev-qa.mdc`](../.cursor/rules/inkflow-agent-dev-qa.mdc) | Routes, build, Supabase, RLS, régressions |
| Marketing / Produit | [`.cursor/rules/inkflow-agent-marketing-product.mdc`](../.cursor/rules/inkflow-agent-marketing-product.mdc) | Parcours, MVP, SEO, messaging |
| Design / UX | [`.cursor/rules/inkflow-agent-design-ux.mdc`](../.cursor/rules/inkflow-agent-design-ux.mdc) | Responsive, tactile, cohérence DS |

## Source de vérité — App mobile

- **Canonique** : le dossier [`inkflow-mobile/`](../inkflow-mobile/) à la racine du repo (scripts `npm run start`, `app/`, dépendances à jour : `expo-blur`, `lucide-react-native`, `moti`, etc.).
- L’ancienne copie emboîtée `inkflow-mobile/inkflow-mobile/` (doublon Expo) a été **supprimée du repo** pour alléger le stockage ; ne pas la recréer.

## Documents liés

- Tunnel inscription → dashboard (auth, RLS, slug) : [`SIGNUP-DASHBOARD-QA.md`](SIGNUP-DASHBOARD-QA.md)
- État MVP et inventaire : [`MVP-STATUS-AND-AUDIT.md`](MVP-STATUS-AND-AUDIT.md)
- Smoke HTTP (URLs publiques) : [`scripts/smoke-urls.mjs`](../scripts/smoke-urls.mjs) + section « Limites » dans le doc MVP
- Dashboard métier : [`AUDIT-DASHBOARD.md`](AUDIT-DASHBOARD.md)
- Roadmap : [`../inkflow-roadmap-29mars.md`](../inkflow-roadmap-29mars.md)
