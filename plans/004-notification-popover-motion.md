# 004 — Notification popover motion + a11y

- **Status**: DONE
- **Commit**: 993735b
- **Severity**: MEDIUM
- **Category**: Performance + Accessibility
- **Estimated scope**: 1 file, ~25 lines

## Problem

Notification rows use blur filter animation without reduced-motion guard:

`components/ui/notification-popover.tsx:42-45`:

```tsx
<motion.div
  initial={{ opacity: 0, x: 12, filter: 'blur(6px)' }}
  animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
  transition={{ duration: 0.22, delay: staggerDelay }}
```

Popover panel (`lines 307-310`) is reasonable (`scale: 0.98`, 180ms) but lacks `useReducedMotion`.

## Target

**NotificationItem** — transform + opacity only:

```tsx
initial={{ opacity: 0, x: 8 }}
animate={{ opacity: 1, x: 0 }}
transition={{ duration: 0.2, delay: staggerDelay, ease: [0.23, 1, 0.32, 1] }}
```

Cap `staggerDelay` at `Math.min(index * 0.04, 0.24)` (was 0.06 / 0.36 — slightly faster).

Add at top of `NotificationItem`:

```tsx
const reduceMotion = useReducedMotion();
// ...
initial={reduceMotion ? false : { opacity: 0, x: 8 }}
animate={{ opacity: 1, x: 0 }}
transition={reduceMotion ? { duration: 0.01 } : { duration: 0.2, delay: staggerDelay, ease: [0.23, 1, 0.32, 1] }}
```

**Popover panel** — import `useReducedMotion` in parent; when true:

```tsx
initial={{ opacity: 0 }}
animate={{ opacity: 1 }}
exit={{ opacity: 0 }}
transition={{ duration: 0.12 }}
```

## Repo conventions to follow

- Exemplar: `contexts/ToastContext.tsx:45-48` — `useReducedMotion` + variant branching
- `inkflowTransition.toast` spring pattern for panel optional; 180ms ease-out is fine for popover

## Steps

1. Import `useReducedMotion` from `framer-motion` in `notification-popover.tsx`.
2. Update `NotificationItem` motion props per target.
3. In `NotificationPopover`, read `reduceMotion` and branch panel `motion.div` transitions.
4. Remove all `filter: 'blur(...)'` from this file.

## Boundaries

- Do NOT change notification data, mark-read logic, or mobile fixed positioning.
- Do NOT add stagger on every popover open if list unchanged (future optimization — out of scope).

## Verification

- **Mechanical**: `npm run typecheck` on `notification-popover.tsx`.
- **Feel check**: Dashboard header → open notifications:
  - Rows slide in subtly without blur haze
  - Toggle reduced motion — list appears without horizontal slide
- **Done when**: Zero `filter: blur` in notification motion; `useReducedMotion` on panel + items.
