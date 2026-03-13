# Design System InkFlow — Alignement Framer ↔ App

Objectif : **zéro cassure visuelle** entre la landing (ink-flow.me) et l'app (app.ink-flow.me).

---

## 1. Typographie

| Usage | Police | Poids | Notes |
|-------|--------|-------|-------|
| **Par défaut** | Inter | 400, 500, 600, 700 | Corps de texte, UI |
| **Titres / Hero** | Plus Jakarta Sans | 600, 700, 800 | Titres H1, H2, accents |
| **Accent** | Playfair Display | 600, 700 | Optionnel (landing) |

**À faire sur Framer** : Vérifier le nom exact de la police dans les réglages texte.  
**Dans l'app** : Déjà importées via `@fontsource`. Définir `font-sans: ['Inter', ...]` et `font-hero: ['Plus Jakarta Sans', ...]` dans Tailwind.

---

## 2. Couleurs (mode sombre premium)

| Élément | Code HEX | Variable CSS | Tailwind |
|---------|----------|--------------|----------|
| **Fond principal (body)** | `#000000` | `--bg-primary` | `bg-black` |
| **Fond cartes / sidebars / modales** | `#09090b` | `--bg-card` | `bg-zinc-950` |
| **Fond inputs** | `#18181b` | `--bg-card-secondary` | `bg-zinc-900` |
| **Bordures** | `#27272a` | `--border` | `border-zinc-800` |
| **Bordures légères** | `#3f3f46` | `--border-light` | `border-zinc-700` |
| **Texte principal** | `#ffffff` | `--text-primary` | `text-white` |
| **Texte secondaire** | `#d4d4d8` | `--text-secondary` | `text-zinc-300` |
| **Texte tertiaire** | `#a1a1aa` | `--text-tertiary` | `text-zinc-400` |
| **Bouton primaire (fond)** | `#ffffff` | — | `bg-white` |
| **Bouton primaire (texte)** | `#000000` | — | `text-black` |
| **Bouton secondaire** | `border #3f3f46` | — | `border-zinc-700` |

**À faire sur Framer** : Noter les codes HEX exacts de ton fond, cartes, bordures et bouton principal.

---

## 3. Formes et rayons

| Élément | Valeur | Tailwind |
|---------|--------|----------|
| **Boutons** | Pilule complète | `rounded-full` |
| **Cartes** | Arrondi moyen | `rounded-2xl` |
| **Inputs** | Arrondi léger | `rounded-xl` ou `rounded-lg` |
| **Badges / pills** | Pilule | `rounded-full` |

---

## 4. Ombres

**Style flat dark mode** : Pas d'ombres sur cartes, boutons, modales.  
Utiliser uniquement des bordures fines (`border border-zinc-800`).

---

## 5. Glassmorphism (optionnel)

Pour navbar / header type Framer (flou transparent) :

```css
.nav-glass {
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}
```

Tailwind : `bg-black/60 backdrop-blur-md border-b border-white/10`

---

## 6. Espacements (respiration premium)

| Zone | Padding / Gap |
|------|---------------|
| **Contenu principal** | `p-4 sm:p-6 md:p-8` |
| **Grilles** | `gap-6 sm:gap-8` |
| **Cartes internes** | `p-6` ou `p-6 sm:p-8` |
| **Boutons** | `px-5 py-2.5` ou `px-6 py-3` |

---

## Checklist de vérification

- [ ] Police Framer = police app (Inter / Plus Jakarta Sans)
- [ ] Fond body = noir (#000000)
- [ ] Cartes = zinc-950 (#09090b)
- [ ] Bordures = zinc-800 (#27272a)
- [ ] Boutons primaires = pilule blanche (rounded-full)
- [ ] Boutons secondaires = bordure zinc-700, texte blanc
- [ ] Aucune ombre (shadow) sur composants
- [ ] Espacements généreux (gap, padding)
