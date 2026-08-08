# SATELLITE-CLEANUP-REPORT

> Branche : `cleanup/remove-satellite-dirs`  
> Date : 2026-08-05  
> Base : suite de `cleanup/dead-code-audit`  
> **Pas de push / pas de merge**

---

## Vérification pré-suppression (règle 2)

| Dossier           | package.json / vercel / CI                                                                                                                         | Imports `components                                                                                                                                                               | pages        | lib | hooks | api` | Décision |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ | --- | ----- | ---- | -------- |
| `mon-app/`        | Exclu `tsconfig` + `eslint` + `.prettierignore` seulement — **pas** de script / workspace / vercel / `.github`                                     | Aucun                                                                                                                                                                             | **SUPPRIMÉ** |
| `inkflow/`        | Aucune (≠ `inkflow-mobile/`)                                                                                                                       | Aucun                                                                                                                                                                             | **SUPPRIMÉ** |
| `mobile/`         | Exclu `tsconfig` + `eslint`                                                                                                                        | Aucun                                                                                                                                                                             | **SUPPRIMÉ** |
| `_logo_variants/` | Aucun script npm. `scripts/generate-logo-variants.mjs` écrit dedans (hors périmètre import app ; script **non** listé dans `package.json` scripts) | Aucun                                                                                                                                                                             | **SUPPRIMÉ** |
| `_zip_10/`        | Aucune                                                                                                                                             | Aucun                                                                                                                                                                             | **SUPPRIMÉ** |
| `_design_import/` | Exclu lint/tsconfig                                                                                                                                | **OUI** — `components/dashboard/DashboardOverviewDesignSystem.ts` réexporte `../../_design_import/DESIGN_SYSTEM` → consommé par `DashboardOverviewTab` (lazy dans `DashboardPro`) | **GARDÉ**    |

---

## Dossiers effectivement supprimés (`git rm -r`)

| Dossier           | Taille disque (avant) | Fichiers trackés | Octets trackés (approx.) |
| ----------------- | --------------------: | ---------------: | -----------------------: |
| `mon-app/`        |                387 Mo |               33 |                  411 253 |
| `inkflow/`        |                370 Mo |               11 |                  517 627 |
| `mobile/`         |                 76 Ko |                6 |                   58 965 |
| `_logo_variants/` |                164 Ko |                6 |                  154 778 |
| `_zip_10/`        |                 40 Ko |                4 |                   28 993 |

### Taille totale gagnée

- **Disque local** : ~**757 Mo** (dont ~756 Mo de `node_modules` non trackés sous `mon-app/` + `inkflow/`, nettoyés après `git rm`)
- **Historique git / clone utile** : ~**1,12 Mo** de contenu tracké retiré (`~1 171 616` octets)

---

## Dossier gardé par précaution

### `_design_import/` (~52 Ko, 2 fichiers trackés)

**Pourquoi :** référence **active** runtime :

```ts
// components/dashboard/DashboardOverviewDesignSystem.ts
export { ... } from '../../_design_import/DESIGN_SYSTEM';
```

Utilisé par l’onglet Vue d’ensemble live. Suppression → build/typecheck cassés.  
_(L’audit précédent l’avait marqué « safe » — faux positif corrigé ici.)_

---

## Vérification finale

| Check                                | Résultat                                                                           |
| ------------------------------------ | ---------------------------------------------------------------------------------- |
| `npm run typecheck` (`tsc --noEmit`) | **PASS**                                                                           |
| `npm run build` (Vite + PWA)         | **PASS** (~12s ; warning chunks >800kB préexistant ; sitemap fetch placeholder OK) |
| Rollback d’un dossier                | **Non nécessaire**                                                                 |

Note : `tsconfig.json` / `eslint.config.js` gardent encore des excludes `mon-app` / `mobile` / `_design_import` — **non modifiés** (règle 6). Harmless.

Note : `scripts/generate-logo-variants.mjs` pointe encore vers `_logo_variants/` — script hors `package.json` scripts ; échec seulement si lancé manuellement. Non touché (règle 6).

---

## Statut `video/` (non touché)

|                                       |                                                                                                                                                                                                                                                                       |
| ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Taille disque                         | **~468 Mo**                                                                                                                                                                                                                                                           |
| Fichiers trackés                      | 14 (~1,7 Mo)                                                                                                                                                                                                                                                          |
| Scripts npm                           | `video:demo` → `npm run start --prefix video/inkflow-demo`                                                                                                                                                                                                            |
|                                       | `video:demo:render` → `npm run render --prefix video/inkflow-demo`                                                                                                                                                                                                    |
| Ajout des scripts dans `package.json` | **2026-04-15** (`5692fb4`)                                                                                                                                                                                                                                            |
| Dernier commit touchant `video/`      | **2026-05-06**                                                                                                                                                                                                                                                        |
| Utilité                               | Remotion demo marketing (`inkflow-remotion-demo`). Scripts **présents et valides** dans `package.json`, mais **hors CI** / hors Vercel. Utiles si tu génères encore des vidéos démo ; sinon candidats à un repo/submodule séparé plus tard — **pas dans ce passage**. |

---

## Récap commit

- Branche : `cleanup/remove-satellite-dirs`
- Contenu : `git rm -r` des 5 dossiers safe + ce rapport
- Non inclus : `_design_import/`, `video/`, autres fichiers dirty/untracked hors liste
