# 005 — Dedupe ProcessSection GSAP + Framer

- **Status**: DONE
- **Commit**: 993735b
- **Severity**: MEDIUM
- **Category**: Cohesion & tokens
- **Estimated scope**: 1 file, 1 attribute

## Problem

`ProcessSection` animates twice on scroll:

1. GSAP `data-gsap-reveal` on `<section>` — whole block fade-up via `InkflowGsapScrollEffects`
2. Framer `whileInView` stagger on inner `motion.div`

`components/ProcessSection.tsx:136-146`:

```tsx
<section
  id="process"
  data-gsap-reveal
  className="relative overflow-hidden ..."
>
  <motion.div
    variants={containerVariants}
    initial="hidden"
    whileInView="visible"
    viewport={{ once: true, margin: '-80px' }}
```

User sees section-level GSAP then internal stagger — muddy, inconsistent timing.

## Target

Remove `data-gsap-reveal` from the `<section>` element. Keep Framer stagger (better suited for step cards grid).

Optional polish (same plan, same file): ensure `itemVariants` uses duration ≤ 0.55s and ease `[0.22, 1, 0.36, 1]` (landing hero ease) — only if current variants exceed 300ms on UI-like elements.

## Repo conventions to follow

- Exemplar: `components/landing/LandingDemoSection.tsx` — GSAP stagger group OR Framer, not both on same block
- Marketing may exceed 300ms; step cards stagger 500ms total is OK if inner steps are decorative

## Steps

1. Open `components/ProcessSection.tsx`.
2. Delete `data-gsap-reveal` attribute from `<section id="process">`.
3. Leave `motion.div` whileInView/stagger unchanged unless variant `duration` > 0.8 on individual steps — then cap to 0.5s.

## Boundaries

- Do NOT remove Framer stagger or step previews.
- Do NOT add GSAP to inner steps in this plan.
- Do NOT change copy or grid layout.

## Verification

- **Mechanical**: `npm run build`.
- **Feel check**: Landing `/` → scroll to section `#process`:
  - Single coordinated stagger of step cards
  - No whole-section fade before stagger starts
- **Done when**: Section has no `data-gsap-reveal`; Framer once-only viewport still works.
