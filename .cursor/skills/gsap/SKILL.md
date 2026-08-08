---
name: gsap
description: >-
  GSAP + ScrollTrigger pour InkFlow (Vite + React), sync avec Lenis sur `.landing-scroll`.
  Use for scroll reveals, parallax, pinned sections, timelines. Triggers: gsap, ScrollTrigger,
  scroll animation, parallax, timeline, greensock.
user-invocable: true
---

# GSAP — InkFlow (Vite + React + Lenis)

Official library: [greensock/GSAP](https://github.com/greensock/GSAP) · npm `gsap` (free, all plugins).

Skills installés : `.agents/skills/gsap-scrolltrigger`, `.agents/skills/gsap-frameworks`.

## Stack InkFlow

| Outil | Rôle |
|-------|------|
| **Framer Motion** | Hero load, modales, dashboard, micro-interactions |
| **Lenis** | Smooth scroll marketing (`.landing-scroll`) |
| **GSAP ScrollTrigger** | Reveals au scroll, scrub, pin — **sync Lenis** |

Ne pas remplacer Framer sur le dashboard. GSAP = surfaces marketing long-scroll.

## Sync Lenis + ScrollTrigger (obligatoire)

Implémenté dans `lib/gsap/syncLenisScrollTrigger.ts` :

- `ScrollTrigger.scrollerProxy` sur `.landing-scroll`
- `lenis.on('scroll', ScrollTrigger.update)`
- `ScrollTrigger.defaults({ scroller })`
- rAF Lenis reste sur Framer `frame` (pas `gsap.ticker`)

## Marquer des reveals

```html
<section data-gsap-reveal>...</section>
```

Groupe stagger :

```html
<div data-gsap-reveal-group>
  <article data-gsap-reveal-item>...</article>
</div>
```

Hero parallax scrub :

```html
<section data-gsap-hero>
  <div data-gsap-hero-content data-gsap-scrub-y="28">...</div>
  <div data-gsap-hero-scrub data-gsap-scrub-y="88">mockup</div>
</section>
```

Parallax section (ex. vidéo `#demo`) :

```html
<section data-gsap-section="demo">
  <div data-gsap-scrub data-gsap-scrub-y="56">...</div>
</section>
```

Orchestrateur : `components/motion/InkflowGsapScrollEffects.tsx` — init incrémentale + MutationObserver (sections lazy Suspense).

## Où c’est actif

Même routes que Lenis (`lib/lenis/inkflowLenis.ts`) — pas dashboard, pas `/book/*`.

## React cleanup

Toujours `gsap.context(() => { ... }, scroller)` + `ctx.revert()` au unmount.  
Pour composants isolés, voir skill **gsap-frameworks** (`useGSAP` de `@gsap/react` si besoin futur).

## Exemple timeline scrub (futur)

```ts
gsap.to('.parallax-bg', {
  y: 120,
  ease: 'none',
  scrollTrigger: {
    trigger: '.parallax-section',
    scroller: scrollContainer,
    scrub: true,
  },
});
```

## Références

- Docs : https://gsap.com/docs/v3/
- Lenis + GSAP : README [darkroomengineering/lenis](https://github.com/darkroomengineering/lenis)
- InkFlow Lenis skill : `.cursor/skills/lenis/SKILL.md`
