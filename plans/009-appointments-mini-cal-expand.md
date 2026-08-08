# 009 — Expand mini-calendrier mobile (AppointmentsView)

- **Status**: DONE
- **Commit**: 993735b
- **Severity**: MEDIUM (missed opportunity — additive)
- **Category**: Missed opportunities / Spatial consistency
- **Estimated scope**: 1 file, ~20 lines

## Problem

Volet mini-calendrier mobile (`#agenda-mini-calendar-panel`) bascule via `hidden`/`block` — apparition/disparition instantanée.

`components/dashboard/AppointmentsView.tsx:631-663` — current:

```tsx
<aside
  id="agenda-mini-calendar-panel"
  className={`flex-shrink-0 lg:hidden ${showCalendarMobile ? 'block' : 'hidden'}`}
>
```

## Target

`AnimatePresence initial={false}` + `motion.aside` conditionnel `{showCalendarMobile && (...)}` :

- **enter** (normal): `opacity: 0 → 1`, `height: 0 → auto`
- **exit** (normal): inverse
- **transition**: `inkflowTransition.panel(reduceMotion)` — **200ms** max
- **reduced motion**: opacity only (no height tween) — enter `{ opacity: 1 }`, exit `{ opacity: 0 }`
- `className`: `flex-shrink-0 lg:hidden overflow-hidden` (retirer hidden/block toggle)
- Conserver `id`, `aria-controls` sur le bouton toggle existant

Pas de blur. Pas de scale depuis 0.

## Repo conventions to follow

- Exemplar panel: `RequestsTabPanel` pour reduced-motion branch
- `inkflowTransition.panel` from `lib/motion/inkflowMotion.ts`

## Steps

1. Réutiliser `useReducedMotion` + imports Framer si pas déjà présents après plan 007.
2. Remplacer `<aside className={... hidden/block}>` par :

```tsx
<AnimatePresence initial={false}>
  {showCalendarMobile && (
    <motion.aside
      id="agenda-mini-calendar-panel"
      initial={reduceMotion ? false : { opacity: 0, height: 0 }}
      animate={reduceMotion ? { opacity: 1 } : { opacity: 1, height: 'auto' }}
      exit={reduceMotion ? { opacity: 0 } : { opacity: 0, height: 0 }}
      transition={inkflowTransition.panel(Boolean(reduceMotion))}
      className="flex-shrink-0 overflow-hidden lg:hidden"
    >
      {/* existing inner div + MiniCalendar unchanged */}
    </motion.aside>
  )}
</AnimatePresence>
```

## Boundaries

- Do NOT touch desktop sidebar calendar (`lg:` layout).
- Do NOT change `MiniCalendar` props/logic.
- Do NOT exceed 300ms duration.

## Verification

- **Mechanical**: `npm run build` — exit 0.
- **Feel check** (Agenda planning complet, viewport **390px** iPhone — critical):
  - Tap « Mini cal. » : panneau s’ouvre en ~200ms (opacity + height)
  - Re-tap / sélection date : panneau se ferme proprement
  - Pas de overflow horizontal, pas de calendrier coupé
  - `lg:` desktop : panneau toujours absent (lg:hidden)
  - Reduced motion : opacity only, pas de height animation
- **Done when**: expand/collapse animé, mobile OK, build OK.
