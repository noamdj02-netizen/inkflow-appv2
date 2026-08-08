---
name: react-bits
description: >-
  React Bits — composants animés copy-paste pour InkFlow (Vite + React + Tailwind).
  Registry shadcn @react-bits déjà configuré. Use for text animations, backgrounds,
  marketing polish. Triggers: react-bits, reactbits, BlurText, text animation, background.
user-invocable: true
---

# React Bits — InkFlow

Bibliothèque : [DavidHDev/react-bits](https://github.com/DavidHDev/react-bits) · docs [reactbits.dev](https://reactbits.dev).

**165+ composants** (texte, UI, backgrounds) — variante recommandée InkFlow : **`TS-TW`** (TypeScript + Tailwind).

## Installation CLI (déjà configuré)

`components.json` expose le registry :

```json
"@react-bits": "https://reactbits.dev/r/{name}.json"
```

Ajouter un composant :

```bash
npx shadcn@latest add @react-bits/BlurText-TS-TW
npx shadcn@latest add @react-bits/ShinyText-TS-TW
```

Les fichiers vont dans `components/` (shadcn) — **déplacer ou re-exporter** depuis `components/react-bits/` pour garder l’ordre InkFlow.

## Composants installés

| Composant | Chemin | Usage |
|-----------|--------|--------|
| **BlurText** | `components/react-bits/BlurText.tsx` | Titres marketing, hero |

Barrel : `import { BlurText } from '@/components/react-bits'`.

## Conventions InkFlow

| Surface | React Bits ? | Notes |
|---------|--------------|-------|
| Landing, explorer, vitrine | **Oui** | Texte, backgrounds, reveals |
| Dashboard, booking, auth forms | **Non** | Framer Motion + DS zinc existant |

### Scroll `.landing-scroll`

InkFlow ne scroll pas sur `window`. Pour les composants avec **IntersectionObserver** :

- Hero above-the-fold : `animateOnMount`
- Sections scroll : `observeRoot={scrollContainer}` via `useInkflowLenis()`

```tsx
const { scrollContainer } = useInkflowLenis();

<BlurText
  as="span"
  text="Les demandes Insta"
  animateOnMount
  observeRoot={scrollContainer}
/>
```

### Stack motion

| Outil | Rôle |
|-------|------|
| **React Bits** | Effets texte / backgrounds marketing |
| **Framer Motion** | Layout, hero stagger, dashboard |
| **GSAP ScrollTrigger** | Reveals `data-gsap-reveal` au scroll |
| **Lenis** | Smooth scroll marketing |

Ne pas empiler 3 animations sur le même élément.

### Accessibilité

- `prefers-reduced-motion` : BlurText InkFlow skip l’animation
- Balise sémantique : `as="span"` dans `<h1>`, pas un `<p>` dans un titre

## Skills agents (repo react-bits)

Installés dans `.agents/skills/` :

- `improve-animations` — audit motion + plans
- `review-animations` — review diff animation
- `find-animation-opportunities` — repérage opportunités
- `apple-design` — patterns Apple-like

## Exemples utiles landing

```bash
npx shadcn@latest add @react-bits/ShinyText-TS-TW
npx shadcn@latest add @react-bits/GradientText-TS-TW
npx shadcn@latest add @react-bits/Particles-TS-TW
```

Parcourir le catalogue : https://reactbits.dev

## Références

- Lenis : `.cursor/skills/lenis/SKILL.md`
- GSAP : `.cursor/skills/gsap/SKILL.md`
- Design SaaS : `.cursor/rules/inkflow-saas-conventions.mdc`
