# 008 — Crossfade Jour / Semaine / Mois (AgendaSummaryTab)

- **Status**: DONE
- **Commit**: 993735b
- **Severity**: MEDIUM (missed opportunity — additive)
- **Category**: Missed opportunities / Cohesion
- **Estimated scope**: 1 file, ~30 lines

## Problem

Changement de période (Jour / Semaine / Mois) remplace la zone contenu (strip jour, grille mois, liste) sans transition.

`components/dashboard/AgendaSummaryTab.tsx:795-835` — bloc `mt-3 flex flex-col gap-3` contient strip, grille mois et `renderGroupedList()` sans animation.

## Target

`AnimatePresence mode="wait"` + `motion.div` `key={range}` autour du contenu variable (strip + month grid + liste) :

- **enter**: `opacity: 0 → 1`, `y: 8 → 0`
- **exit**: `opacity: 1 → 0`, `y: 0 → -6`
- **transition**: `inkflowTransition.panel(reduceMotion)` — **200ms**, `INKFLOW_EASE_OUT`
- **reduced motion**: même branche que `RequestsTabPanel`
- **Pas** de stagger par ticket/carte

## Repo conventions to follow

- Exemplar: `components/dashboard/requests/RequestsMotion.tsx:20-33`
- Tokens: `lib/motion/inkflowMotion.ts`

## Steps

1. `AgendaSummaryTab.tsx` — imports Framer + `inkflowTransition`.
2. `const reduceMotion = useReducedMotion();` dans le composant exporté.
3. Dans le `return`, remplacer le bloc interne de `<div className="mt-3 flex flex-col gap-3 md:mt-5 md:gap-4">` (contenu entre les lignes ~796-858, **sans** le bouton « Ouvrir le planning complet ») par :

```tsx
<div className="mt-3 flex flex-col gap-3 md:mt-5 md:gap-4">
  <AnimatePresence mode="wait">
    <motion.div
      key={range}
      initial={reduceMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduceMotion ? undefined : { opacity: 0, y: -6 }}
      transition={inkflowTransition.panel(Boolean(reduceMotion))}
      className="flex flex-col gap-3 md:gap-4"
    >
      {/* showDayStrip block */}
      {/* range === 'month' block */}
      <div className="flex flex-col gap-3">{renderGroupedList()}</div>
    </motion.div>
  </AnimatePresence>
  {/* inPeriod > 0 → Ouvrir le planning complet — OUTSIDE AnimatePresence */}
</div>
```

4. Le CTA « Ouvrir le planning complet » reste hors animation (évite re-mount inutile).

## Boundaries

- Do NOT touch `AppointmentsView`, day-strip crossfade (#3 — agenda v2), ou `AgendaDayStrip` layoutId.
- Do NOT stagger les cartes RDV individuelles.

## Verification

- **Mechanical**: `npm run build` — exit 0.
- **Feel check** (dashboard → Accueil agenda summary, mobile 390px + desktop):
  - Toggle Jour / Semaine / Mois : fondu conteneur ~200ms
  - Grille mois + liste : pas de double scroll bizarre
  - Reduced motion : swap instantané
- **Done when**: `key={range}` crossfade actif, CTA planning intact, build OK.
