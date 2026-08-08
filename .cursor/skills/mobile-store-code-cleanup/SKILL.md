---
name: mobile-store-code-cleanup
description: Guides safe, incremental codebase cleanup to shrink bundle and repo weight before App Store and Google Play release. Enforces verify-then-edit, minimal diffs, and build checks. Use when preparing mobile store submission, reducing app size, removing dead code or assets, auditing dependencies, or when the user asks for non-breaking cleanup across the whole project.
---

# Nettoyage code — préparation stores (sans casser)

## Objectif

Réduire **poids bundle / stockage / dette** (web + `inkflow-mobile` ou équivalent) **sans régression**. Tout changement doit être **réversible**, **prouvé** (build / grep), et **minimal**.

## Déclencheurs

- « Préparer l’app pour l’App Store / Play Store »
- Réduire taille, bundle, assets, dépendances
- Nettoyer tout le repo **sans rien casser**
- Audit avant soumission store

## Principe : réfléchir avant d’agir

1. **Comprendre le périmètre** : web seul, mobile seul, ou les deux — ne pas mélanger les configs (Vite vs Expo/React Native).
2. **Cartographier** : `grep` / recherche références avant suppression (symboles, imports, routes, `require` dynamiques).
3. **Une couche à la fois** : une catégorie par passage (ex. assets OR deps OR dead exports), pas tout d’un coup.
4. **Vérifier après chaque lot** : build + typecheck du scope touché.

## Ce qui est généralement sûr (avec preuve)

| Cible | Action | Preuve minimale |
|-------|--------|-----------------|
| Fichiers non référencés | Supprimer seulement si 0 import / 0 lien public | `grep` sur le nom de fichier et chemins |
| Duplication évidente | Fusionner en réutilisant un module existant | Même comportement, tests ou smoke manuel |
| `console.*` bruyants | Retirer ou garder derrière `__DEV__` / flag | Pas de régression logique |
| Dépendances inutilisées | `depcheck` / analyse imports puis `package.json` | `npm run build` (ou équivalent mobile) |
| Images lourdes | Recompresser / WebP / tailles @2x @3x cohérentes | Visuel + poids fichier |
| Locales / JSON inutilisés | Supprimer si aucune clé lue | Recherche de chaînes |

## Interdit sans validation explicite

- Suppression massive de dossiers ou « nettoyage » global sans liste de fichiers + grep.
- Modifier API publique, routes, env secrets, ou contrats Supabase.
- Reformater tout le repo pour « plaire » au linter (diff énorme, risque de conflits).
- Retirer du code « moche » qui est encore branché (feature flag, fallback prod).

## Composition avec d’autres skills

Charger et suivre **en plus** des skills déjà présents dans le workspace quand le sujet touche :

- **Sécurité / auth / secrets** → `.cursor/skills/security/SKILL.md` ou `.agents/skills/vibe-security`
- **Qualité livraison client InkFlow** → `.cursor/skills/inkflow-client-app-ship/SKILL.md`
- **Coûts / infra** → `.cursor/skills/cost-reducer/SKILL.md`
- **UI / perf front** → `.cursor/skills/frontend-design/SKILL.md` ou `.cursor/skills/ui-ux-pro-max/SKILL.md`
- **Guidelines iOS (icônes, contrastes)** → skill iOS HIG si disponible dans l’environnement

Ne pas inventer de règles qui contredisent les **rules** du projet (`inkflow-saas-conventions`, etc.).

## Workflow recommandé (checklist)

```
- [ ] Périmètre défini (web / mobile / monorepo)
- [ ] Inventaire : ce qui part (fichiers ou deps) + raison
- [ ] grep / références pour chaque suppression prévue
- [ ] Diff minimal ; pas de changements hors sujet
- [ ] npm run build (racine et/ou inkflow-mobile selon le cas)
- [ ] Si TS : pas d’erreurs nouvelles sur les fichiers touchés
- [ ] Note courte pour le commit (pourquoi + quoi)
```

## Mobile (App Store / Play)

- **Bundle** : éviter libs lourdes dupliquées web/mobile ; préférer imports ciblés.
- **Assets** : pas de fichiers de design ou captures géantes dans `assets/` versionnés sans besoin runtime.
- **Natif** : ne pas toucher aux certificats / provisioning dans ce skill — seulement code et assets applicatifs.

## Rappel final

**Zéro casser** = preuve par build + références + petits pas. Si doute, **documenter le doute** et proposer une étape de validation humaine plutôt que supprimer.
