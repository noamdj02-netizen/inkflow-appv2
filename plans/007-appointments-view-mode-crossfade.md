# 007 — Crossfade Liste ↔ Planning (AppointmentsView)

- **Status**: DONE
- **Commit**: 993735b
- **Severity**: MEDIUM (missed opportunity — additive)
- **Category**: Missed opportunities / Purpose & frequency
- **Estimated scope**: 1 file, ~25 lines

## Problem

Bascule Liste ↔ Planning dans l’agenda dashboard = swap brutal sans transition. Occasionnel (2–5×/session) mais cœur produit.

`components/dashboard/AppointmentsView.tsx:665-951` — current:

```tsx
<div className="min-w-0 flex-1 space-y-2 sm:space-y-3">
  {viewMode === 'calendar' ? (
    <AppointmentCalendar ... />
  ) : filteredAppointments.length === 0 ? (
    ...
  ) : (
    <>...</>
  )}
</div>
```

Pas de Framer Motion importé dans ce fichier aujourd’hui.

## Target

`AnimatePresence mode="wait"` + `motion.div` `key={viewMode}` :

- **enter**: `opacity: 0 → 1`, `y: 8 → 0`
- **exit**: `opacity: 1 → 0`, `y: 0 → -6`
- **transition**: `inkflowTransition.panel(reduceMotion)` → **200ms**, ease `[0, 0, 0.2, 1]` (`INKFLOW_EASE_OUT`)
- **reduced motion**: `initial={false}`, exit `undefined`, transition `{ duration: 0.01 }`
- Pas de stagger par carte RDV
- Pas de blur, pas de `scale` depuis 0

## Repo conventions to follow

- Exemplar: `components/dashboard/requests/RequestsMotion.tsx:20-33` (`RequestsTabPanel`)
- Tokens: `lib/motion/inkflowMotion.ts` — `inkflowTransition.panel`, `useReducedMotion`

## Steps

1. `AppointmentsView.tsx` — imports : `AnimatePresence`, `motion`, `useReducedMotion` from `framer-motion` ; `inkflowTransition` from `@/lib/motion/inkflowMotion`.
2. Dans le composant, `const reduceMotion = useReducedMotion();`
3. Envelopper le contenu conditionnel (lignes ~666-950) dans :

```tsx
<AnimatePresence mode="wait">
  <motion.div
    key={viewMode}
    initial={reduceMotion ? false : { opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    exit={reduceMotion ? undefined : { opacity: 0, y: -6 }}
    transition={inkflowTransition.panel(Boolean(reduceMotion))}
    className="min-w-0"
  >
    {/* existing ternary unchanged */}
  </motion.div>
</AnimatePresence>
```

4. Conserver le wrapper parent `div.min-w-0.flex-1.space-y-2` inchangé.

## Boundaries

- Do NOT touch mini-cal panel (#009), filtres, KPI chips, ou `AgendaSummaryTab`.
- Do NOT ajouter stagger sur les lignes RDV.
- Do NOT ajouter GSAP/Lenis.

## Verification

- **Mechanical**: `npm run build` — exit 0.
- **Feel check** (dashboard → Agenda → planning complet, viewport desktop + mobile DevTools 390px):
  - Toggle Liste / Planning : fondu ~200ms, pas de flash blanc
  - Spam toggle 5× : pas de layout shift, pas de double panneau visible
  - `prefers-reduced-motion: reduce` : swap instantané (opacity only / 0.01s)
- **Done when**: crossfade actif sur `viewMode`, build OK.
