---
name: lenis
description: >-
  Integrate Lenis smooth scroll (darkroomengineering/lenis) in InkFlow Vite+React.
  Use when adding smooth scroll, parallax, GSAP ScrollTrigger sync, landing polish,
  or fixing janky scroll. Triggers on lenis, smooth scroll, scroll sync, ReactLenis.
user-invocable: true
---

# Lenis — InkFlow (Vite + React)

Official library: [darkroomengineering/lenis](https://github.com/darkroomengineering/lenis) · npm `lenis@^1.3.26` (already in `package.json`).

## When to use Lenis in InkFlow

| Surface | Lenis ? | Why |
|---------|---------|-----|
| Landing `/`, marketing pages | **Yes** | Premium scroll feel |
| Dashboard `/dashboard`, booking `/book` | **No** | Native scroll, modals, nested lists — use `data-lenis-prevent` if Lenis is global |
| PWA mobile | **Careful** | Respect `prefers-reduced-motion`; test iOS safe-area |

## Required CSS

```ts
import 'lenis/dist/lenis.css';
```

Import once in `index.tsx` or a layout wrapper.

## Recommended setup — `lenis/react`

Prefer the official React adapter over manual `new Lenis()`:

```tsx
import { ReactLenis } from 'lenis/react';
import type { LenisRef } from 'lenis/react';

// Root marketing layout only (not whole App.tsx if dashboard shares tree)
export function MarketingScrollRoot({ children }: { children: React.ReactNode }) {
  return (
    <ReactLenis
      root
      options={{
        autoRaf: true,
        lerp: 0.1,
        smoothWheel: true,
        respectReducedMotion: true,
        anchors: true,
      }}
    >
      {children}
    </ReactLenis>
  );
}
```

## Framer Motion (already in stack)

```tsx
import { ReactLenis } from 'lenis/react';
import type { LenisRef } from 'lenis/react';
import { cancelFrame, frame } from 'framer-motion';
import { useEffect, useRef } from 'react';

function ScrollRoot({ children }: { children: React.ReactNode }) {
  const lenisRef = useRef<LenisRef>(null);

  useEffect(() => {
    function update(data: { timestamp: number }) {
      lenisRef.current?.lenis?.raf(data.timestamp);
    }
    frame.update(update, true);
    return () => cancelFrame(update);
  }, []);

  return (
    <ReactLenis root options={{ autoRaf: false }} ref={lenisRef}>
      {children}
    </ReactLenis>
  );
}
```

## Nested scroll / modals / drawers

Use attributes (preferred over `allowNestedScroll: true` for perf):

```html
<div data-lenis-prevent>…modal scroll…</div>
```

Or `prevent: (node) => node.closest('[data-lenis-prevent]') != null`.

## InkFlow conventions

- Never enable Lenis on `html`/`body` if it breaks dashboard nested scroll — scope to landing route wrapper.
- Keep `overflow-x: hidden` on marketing layouts (project rule).
- Cleanup: `lenis.destroy()` on unmount (handled by `ReactLenis`).
- No CSS `scroll-snap` with Lenis — use `lenis/snap` plugin if needed.

## Troubleshooting

1. Import `lenis.css`
2. Use `autoRaf: true` OR wire `raf()` in animation loop
3. Test without Lenis if page won't scroll
4. GSAP: `lenis.on('scroll', ScrollTrigger.update)` + ticker sync (see official README)

## Implémentation InkFlow (repo)

- Provider : `contexts/InkflowLenisContext.tsx` (`InkflowLenisProvider`)
- Config routes : `lib/lenis/inkflowLenis.ts` (`shouldEnableInkflowLenis`, `INKFLOW_LENIS_PREVENT_SELECTORS`)
- Scroll dashboard natif : `hooks/useDashboardScroll.ts` (`data-dashboard-scroll-root`, `data-lenis-prevent`)
- Navigation ancres : `components/motion/InkflowRouterNavigation.tsx`
- Navbar landing : `useLandingScrollTop()` (scroll sur `.landing-scroll`, plus `window`)
- CSS : `import 'lenis/dist/lenis.css'` dans `index.tsx`

**Activé** : `/`, `/explorer/*`, vitrine `/studio/*`, pages SEO, légal, demo.  
**Désactivé** : `/dashboard`, `/admin`, `/book/*`, `/client/*`, login/signup/auth.

**DashboardPro** : pas de Lenis — scroll natif sur `[data-dashboard-scroll-root]` ; modales/sidebar avec `data-lenis-prevent`.

## References

- Repo: https://github.com/darkroomengineering/lenis
- React: `packages/react/README.md` in repo
- Companion skill: `.agents/skills/implement_lenis_scroll/`
