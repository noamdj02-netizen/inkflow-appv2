# 010 — PaymentSuccessModal reduced motion + tween

- **Status**: DONE
- **Commit**: 993735b
- **Severity**: MEDIUM (missed opportunity — a11y + rare delight)
- **Category**: Accessibility / Easing & duration
- **Estimated scope**: 1 file, ~25 lines

## Problem

Modale post-paiement rare mais sans branche `useReducedMotion` ; confetti tire toujours ; dialog panel utilise spring (`damping: 26, stiffness: 320`) au lieu du tween dashboard.

`components/dashboard/PaymentSuccessModal.tsx:65-83` — confetti sans guard.

`components/dashboard/PaymentSuccessModal.tsx:108-112` — current:

```tsx
<motion.div
  initial={{ opacity: 0, scale: 0.92 }}
  animate={{ opacity: 1, scale: 1 }}
  exit={{ opacity: 0, scale: 0.96 }}
  transition={{ type: 'spring', damping: 26, stiffness: 320 }}
```

## Target

- `useReducedMotion()` from `framer-motion`
- **Confetti**: skip entièrement si `reduceMotion === true`
- **Backdrop** (outer motion.div): unchanged `duration: 0.2` opacity
- **Dialog panel**:
  - normal: `scale: 0.96 → 1`, opacity 0→1, **220ms**, `ease: [0, 0, 0.2, 1]` (`INKFLOW_EASE_OUT`)
  - exit: `scale: 0.98`, opacity 0, **180ms**, same ease
  - reduced: opacity only, `duration: 0.01`, no scale change (`scale: 1` throughout)

Minimum scale **0.96** (not 0). Pas de blur.

## Repo conventions to follow

- `lib/motion/inkflowMotion.ts` — `INKFLOW_EASE_OUT`, `inkflowTransition.panel` pattern
- Exemplar modal scale: `components/ui/Modal.tsx:86-88` — `scale: 0.96`

## Steps

1. Import `useReducedMotion` ; import `INKFLOW_EASE_OUT` from `@/lib/motion/inkflowMotion`.
2. `const reduceMotion = useReducedMotion();` in component body.
3. Confetti `useEffect`: add guard `if (reduceMotion) return;` before firing.
4. Replace inner dialog `transition` spring with:

```tsx
initial={
  reduceMotion
    ? { opacity: 0 }
    : { opacity: 0, scale: 0.96 }
}
animate={
  reduceMotion
    ? { opacity: 1 }
    : { opacity: 1, scale: 1 }
}
exit={
  reduceMotion
    ? { opacity: 0 }
    : { opacity: 0, scale: 0.98 }
}
transition={
  reduceMotion
    ? { duration: 0.01 }
    : { duration: 0.22, ease: INKFLOW_EASE_OUT }
}
```

5. Exit transition can use `duration: 0.18` on exit via separate variant or accept single transition 0.22 for both (acceptable).

## Boundaries

- Do NOT change copy, benefits list, or confetti colors (when allowed).
- Do NOT add new dependencies.
- Do NOT touch Stripe redirect logic.

## Verification

- **Mechanical**: `npm run build` — exit 0.
- **Feel check**:
  - Trigger modal (Paramètres → abonnement success state or Storybook/dev toggle if available)
  - Normal: modal scales from 96%, ~220ms, confetti fires once
  - `prefers-reduced-motion: reduce`: no confetti, opacity-only ~instant open
- **Done when**: reduced motion respected, spring removed, build OK.
