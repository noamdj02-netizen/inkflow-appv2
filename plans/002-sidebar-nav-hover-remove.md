# 002 — Remove sidebar nav hover slide

- **Status**: DONE
- **Commit**: 993735b
- **Severity**: HIGH
- **Category**: Purpose & frequency
- **Estimated scope**: 2 files, ~6 lines

## Problem

Sidebar navigation is used tens of times per session. `whileHover={{ x: 2 }}` on every nav row adds motion on a high-frequency path without clear purpose (not spatial consistency — the row doesn't move anywhere meaningful).

`lib/motion/inkflowGestures.ts:35-38`:

```ts
export function inkflowGestureNavHover(
  reduceMotion: boolean | null
): TargetAndTransition | undefined {
  return reduceMotion ? undefined : { x: 2 };
}
```

`components/dashboard/DashboardSidebarNavButton.tsx:27-31`:

```tsx
<motion.button
  whileTap={navTap}
  whileHover={navHover}
  transition={transition}
```

Press feedback (`navTap` scale 0.96) is correct; hover slide is not.

## Target

- **Remove** `whileHover={navHover}` from `DashboardSidebarNavButton`.
- Keep `whileTap={navTap}` and `transition` (120ms, `[0, 0, 0.2, 1]`).
- Optionally deprecate `navHover` / `inkflowGestureNavHover` with a one-line comment "unused — high-frequency nav" or remove from `useInkflowGestures` return if nothing else imports it (grep `navHover` first).

## Repo conventions to follow

- Exemplar: Raycast-style nav — no hover motion, tap only
- `inkflowGestureNavTap` at `inkflowGestures.ts:23-26` — keep
- CSS hover for **color** only remains on button `className` from parent — do not remove background hover states

## Steps

1. `components/dashboard/DashboardSidebarNavButton.tsx`: remove `whileHover={navHover}`; remove `navHover` from destructuring if unused.
2. Grep repo for `navHover` / `inkflowGestureNavHover`. If only used here, remove export from `useInkflowGestures()` and delete `inkflowGestureNavHover` function OR leave function but document as deprecated.
3. `components/dashboard/DashboardSidebarSubnavButton.tsx` — if it uses `navHover`, apply same change.

## Boundaries

- Do NOT remove `whileTap` or haptic `hapticTabChange()`.
- Do NOT change sidebar layout or active-state styles.
- Do NOT add replacement hover animation.

## Verification

- **Mechanical**: `npm run typecheck`; `npm run lint` on touched files.
- **Feel check**: Dashboard desktop — hover sidebar items rapidly:
  - Background/active state still visible via CSS
  - No horizontal nudge on hover
  - Tap still scales subtly (~0.96)
- **Done when**: No `whileHover` on sidebar nav buttons; tap feedback preserved.
