# 006 — Replace transition-all on shared buttons

- **Status**: TODO
- **Commit**: 993735b
- **Severity**: MEDIUM
- **Category**: Performance
- **Estimated scope**: 2 files (phase 1), optional follow-up grep

## Problem

Shared button utilities animate every property via `transition-all`, causing layout-adjacent repaints:

`index.css:225-231`:

```css
@apply ... transition-all hover:bg-zinc-800 active:scale-[0.98] ...;
```

`lib/inkDesignTokens.ts:116-120`:

```ts
'... transition-all hover:bg-zinc-100 active:scale-[0.98] ...';
```

AUDIT: **`transition: all` is always a finding** — target explicit GPU-friendly properties.

## Target

Replace `transition-all` with:

```css
transition-property: transform, opacity, background-color, border-color, color, box-shadow;
transition-duration: 160ms;
transition-timing-function: cubic-bezier(0.23, 1, 0.32, 1);
```

In Tailwind `@apply` context (index.css):

```css
transition-[transform,opacity,background-color,border-color,color,box-shadow]
duration-150
ease-out
```

Or use existing token from `index.css:1057-1059`:

```css
transition-[transform,opacity,background-color] duration-[var(--duration-release)] ease-[var(--ease-ios)]
```

For `inkDesignTokens.ts` strings, mirror the same explicit list (Tailwind arbitrary property or split to `transition-colors transition-transform duration-150 ease-out`).

Press feedback stays `active:scale-[0.98]` with `motion-reduce:active:scale-100` where already present.

## Repo conventions to follow

- Exemplar: `lib/motion/inkflowGestures.ts:5` — `GESTURE_TRANSITION` 120ms explicit ease
- CSS tokens: `--ease-ios`, `--duration-press`, `--duration-release` in `index.css:56+`

## Steps

1. Edit `index.css` — find `.btn-primary`, `.btn-secondary`, `.btn-outline` (or equivalent @apply blocks ~lines 225-231); replace `transition-all` with explicit properties above.
2. Edit `lib/inkDesignTokens.ts` — update `INK_SHELL_ICON_BTN`, `INK_PRIMARY_BTN` (or matching exports at lines 116-120).
3. Grep `lib/inkDesignTokens.ts` and `index.css` for remaining `transition-all` in button tokens only (phase 1 scope).
4. Do NOT bulk-replace entire repo in this plan — document follow-up grep in plan comment if >20 files.

## Boundaries

- Phase 1: **shared tokens only** (`index.css` button utilities + `inkDesignTokens.ts`).
- Do NOT change colors, radii, or padding.
- Do NOT add dependencies.

## Verification

- **Mechanical**: `npm run build`; visual regression spot-check dashboard buttons.
- **Feel check**: Dashboard — hover primary/secondary buttons:
  - Background still transitions smoothly
  - Active scale still works
  - DevTools → Elements → Computed: `transition-property` does NOT include `all`
- **Done when**: Zero `transition-all` in the two target files' button utility strings.
