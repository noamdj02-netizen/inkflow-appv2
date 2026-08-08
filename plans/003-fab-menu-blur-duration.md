# 003 — Trim FAB menu blur and duration

- **Status**: DONE
- **Commit**: 993735b
- **Severity**: HIGH
- **Category**: Performance + Easing & duration
- **Estimated scope**: 1 file, ~15 lines

## Problem

Mobile dashboard FAB (`FloatingActionMenu`) opens several times per session. Menu layer uses heavy blur and slow spring:

`components/dashboard/FloatingActionMenu.tsx:36-42`:

```ts
const menuLayerTransition = {
  duration: 0.6,
  type: 'spring' as const,
  stiffness: 300,
  damping: 20,
  delay: 0.1,
};
```

`components/dashboard/FloatingActionMenu.tsx:130-132`:

```tsx
initial={reduceMotion ? { opacity: 0 } : { opacity: 0, x: 10, y: 10, filter: 'blur(10px)' }}
animate={reduceMotion ? { opacity: 1 } : { opacity: 1, x: 0, y: 0, filter: 'blur(0px)' }}
exit={reduceMotion ? { opacity: 0 } : { opacity: 0, x: 10, y: 10, filter: 'blur(10px)' }}
```

AUDIT: blur > 20px expensive; UI animations > 300ms on interactive elements; entering UI should use **ease-out**.

## Target

**Menu layer** (no blur, faster):

```tsx
initial={{ opacity: 0, y: 8, scale: 0.97 }}
animate={{ opacity: 1, y: 0, scale: 1 }}
exit={{ opacity: 0, y: 8, scale: 0.98 }}
transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
```

**Menu items** — keep stagger but tighten:

```ts
{ duration: 0.18, delay: index * 0.04, ease: [0.23, 1, 0.32, 1] }
```

**Plus rotation** — fix conflicting transition (currently mixes `duration: 0.3`, `ease: 'easeInOut'`, AND spring):

```ts
const plusRotateTransition = {
  duration: 0.2,
  ease: [0.23, 1, 0.32, 1] as const,
};
```

Remove `type: 'spring'` from `plusRotateTransition` unless rotate uses spring intentionally — pick **one** model.

Reduced-motion paths stay ≤ 120ms opacity-only.

## Repo conventions to follow

- Exemplar: `inkflowTransition.panel` — 200ms ease-out in `lib/motion/inkflowMotion.ts:9-10`
- Scale minimum 0.97 on enter (not 0)

## Steps

1. Edit `menuLayerTransition` / `layerTrans` to 220ms ease-out; remove `delay: 0.1` or cap at 0.04.
2. Replace blur initial/animate/exit on menu `motion.div` with opacity + y + scale above.
3. Update `itemTrans` to 180ms, stagger 40ms.
4. Simplify `plusRotateTransition` to duration-only ease-out 200ms.
5. Verify `reduceMotion` branches still skip blur/movement.

## Boundaries

- Do NOT change FAB position, options list, or badge logic.
- Do NOT add GSAP or new deps.
- Do NOT animate `width`/`height`.

## Verification

- **Mechanical**: `npm run build` succeeds.
- **Feel check**: Dashboard mobile / bottom nav FAB:
  - Open/close 5× rapidly — menu does not feel sluggish; no restart-from-zero blur flash
  - DevTools Performance: no long `filter` tasks on open
  - `prefers-reduced-motion`: instant opacity fade only
- **Done when**: No `filter: blur` in FAB menu motion; max duration 250ms on layer.
