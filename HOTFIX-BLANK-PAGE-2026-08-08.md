# HOTFIX — page blanche prod ink-flow.me — 2026-08-08

## Symptôme prod

- **URL :** https://ink-flow.me
- **Effet :** page blanche pour tous les visiteurs
- **Console :** `TypeError: Cannot read properties of undefined (reading 'createContext')` dans `vendor-motion-*.js`

## Cause racine

`inkflowManualChunks` dans `vite.config.ts` isolait React (`vendor-react`), Framer Motion (`vendor-motion`) et un catch-all `vendor-others` (~1,2 Mo) en chunks séparés avec **imports circulaires** :

```
vendor-react  →  vendor-others
vendor-others →  vendor-react, vendor-motion, vendor-radix
vendor-motion →  vendor-react, vendor-others
```

Au chargement, `vendor-motion` exécutait `React.createContext` alors que l'export `react` de `vendor-react` n'était pas encore initialisé → `undefined.createContext`.

## Reproduction locale (AVANT fix)

```bash
npm run build && npm run preview -- --port 4173 --strictPort
# Playwright headless sur http://localhost:4173/
```

| Métrique          | Résultat                                                            |
| ----------------- | ------------------------------------------------------------------- |
| `#root` innerHTML | **0** (vide)                                                        |
| Erreur console    | **`Cannot read properties of undefined (reading 'createContext')`** |

## Correctif

Dans `vite.config.ts` :

1. **Ne plus isoler** React, react-dom, scheduler, framer-motion, motion-dom, radix-ui en chunks manuels (`return undefined`).
2. **Supprimer** le catch-all `vendor-others` (source du cycle).
3. **Conserver** uniquement les splits indépendants (supabase, sentry, pdf, charts, leaflet, gsap, analytics, icons, antd-mobile).

Chunks supprimés du build : `vendor-motion`, `vendor-react`, `vendor-radix`, `vendor-others`.

## Vérification locale (APRÈS fix — avant push)

```bash
npm run build && npm run preview -- --port 4173 --strictPort
# Playwright headless sur http://localhost:4173/
```

| Métrique          | Résultat                                                                |
| ----------------- | ----------------------------------------------------------------------- |
| Titre page        | `InkFlow \| Logiciel tatoueur France — agenda et réservations en ligne` |
| `#root` innerHTML | **201 101 caractères** (React monté)                                    |
| Erreurs console   | **Aucune**                                                              |

**Confirmation explicite : `npm run preview` affiche la landing sans erreur console — OK pour push.**

## Déploiement

- Commit : `fix: vendor chunk load order breaking production`
- Push : `origin/main` (hotfix urgent)
