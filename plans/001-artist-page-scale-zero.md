# 001 — Fix waitlist scale(0) on vitrine ArtistPage

- **Status**: DONE
- **Commit**: 993735b
- **Severity**: HIGH
- **Category**: Physicality & origin
- **Estimated scope**: 1 file, ~8 lines

## Problem

Waitlist button label swap uses `scale: 0` on enter/exit. Nothing in the real world appears from zero scale — the swap feels like a pop, not a morph.

`pages/vitrine/ArtistPage.tsx:408-422` — current:

```tsx
<motion.span
  key="ok"
  initial={{ scale: 0 }}
  animate={{ scale: 1 }}
  exit={{ scale: 0 }}
  className="flex items-center gap-2"
>
```

Same pattern on `key="w"` at lines 418-422.

## Target

Enter/exit with minimum scale 0.92 + opacity (AUDIT.md: target `scale(0.9–0.97)` + `opacity: 0`).

```tsx
initial={{ scale: 0.92, opacity: 0 }}
animate={{ scale: 1, opacity: 1 }}
exit={{ scale: 0.92, opacity: 0 }}
transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
```

Use cubic-bezier `[0.23, 1, 0.32, 1]` (= `--ease-out` from AUDIT.md strong ease-out).

Duration **180ms** — under 300ms UI budget.

## Repo conventions to follow

- Exemplar: `components/ui/Modal.tsx:86-88` — desktop modal uses `scale: 0.96`, not 0
- Easing aligned with `lib/motion/inkflowMotion.ts` `INKFLOW_EASE_OUT` `[0, 0, 0.2, 1]` is acceptable alternative; prefer AUDIT `--ease-out` cubic above for enter/exit

## Steps

1. Open `pages/vitrine/ArtistPage.tsx`.
2. Replace both `motion.span` blocks (keys `"ok"` and `"w"`) with the target initial/animate/exit/transition objects above.
3. Ensure `AnimatePresence mode="wait"` parent is unchanged.

## Boundaries

- Do NOT change waitlist logic, styles, or button layout.
- Do NOT add new dependencies.
- Do NOT touch other vitrine pages unless they share the same scale(0) pattern (grep first; only fix if found).

## Verification

- **Mechanical**: `npm run typecheck` — no new errors in `ArtistPage.tsx`.
- **Feel check**: Open a vitrine artist page with waitlist CTA; toggle waitlist state slowly (DevTools → Rendering → slow motion if available):
  - Label crossfade scales from ~92%, not from invisible point
  - No layout jump on the button
- Toggle `prefers-reduced-motion: reduce` — animation should still be brief opacity if you add `useReducedMotion` branch (optional LOW follow-up; not required for this plan).
- **Done when**: Both spans use scale ≥ 0.92 and duration ≤ 200ms.
