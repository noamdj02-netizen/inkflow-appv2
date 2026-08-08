---
name: ui-ux-pro-max
description: >-
  Provides design intelligence for web and mobile UIs via a BM25 search over curated CSV data
  (styles, color palettes, typography pairings, UX guidelines, charts, stack-specific notes).
  Use for new pages or components, design-system exploration, UX/accessibility reviews, responsive
  layout, or choosing palettes and patterns. Requires Python 3. Run scripts from the repository root;
  paths below are relative to the project root.
---

# UI UX Pro Max (Cursor / Inkflow)

Upstream project: [ui-ux-pro-max-skill](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) (search engine + datasets). This folder mirrors the **Cursor** layout: `.cursor/skills/ui-ux-pro-max/`.

## When to read this skill

- New page, landing, dashboard, mobile layout, or visual refresh
- Choosing style, palette, type, structure, or chart type
- UX, accessibility, or UI performance review before shipping
- Aligning hierarchy, states, motion, and responsive behavior

**Skip** for pure backend, SQL, or tasks with no UI impact.

---

## Inkflow (project) rules — still mandatory

This skill **adds** signal; it does **not** override repo conventions.

- **Colors / surfaces**: follow project tokens (`zinc`, CSS variables, **ink** palette from project docs). Palette output from `--design-system` is a **proposal**—map it to existing tokens.
- **Icons**: **`lucide-react`** only (Inkflow), not emoji as structural icons.
- **Stack**: this repo is **React + TypeScript + Tailwind**. For searches, prefer **`--stack react`** and/or **`--stack html-tailwind`** (and **`nextjs`** if you work in Next patterns). Do **not** default to React Native unless the task is native mobile.

---

## Prerequisites

Python 3 installed. From the repo root:

```powershell
python --version
```

Use `python3` on macOS/Linux if `python` is not Python 3.

---

## Commands (repo root)

Replace `python` with `python3` if needed. Script path:

`python .cursor/skills/ui-ux-pro-max/scripts/search.py`

### Design system (recommended first step)

```text
python .cursor/skills/ui-ux-pro-max/scripts/search.py "<product> <industry> <keywords>" --design-system -p "Project Name"
```

Markdown output:

```text
python .cursor/skills/ui-ux-pro-max/scripts/search.py "<query>" --design-system -f markdown -p "Project Name"
```

### Domain search

```text
python .cursor/skills/ui-ux-pro-max/scripts/search.py "<keywords>" --domain <domain> [-n 5]
```

Valid `--domain` values match the engine: `style`, `color`, `typography`, `ux`, `landing`, `product`, `chart`, `icons`, `react`, `web`, `google-fonts`. (Style data also covers CSS/prompt-style keywords.)

### Stack guidelines (web)

```text
python .cursor/skills/ui-ux-pro-max/scripts/search.py "<keywords>" --stack react
python .cursor/skills/ui-ux-pro-max/scripts/search.py "<keywords>" --stack html-tailwind
python .cursor/skills/ui-ux-pro-max/scripts/search.py "<keywords>" --stack nextjs
```

### Persist design system (optional)

Writes `design-system/MASTER.md` and optional `design-system/pages/<page>.md`:

```text
python .cursor/skills/ui-ux-pro-max/scripts/search.py "<query>" --design-system --persist -p "Name" --page "dashboard"
```

Add `design-system/` to `.gitignore` if generated files should stay local.

---

## Agent workflow

1. Clarify product, audience, constraints, and Inkflow tokens.
2. Run **`--design-system`** with a rich query (product + tone + context).
3. If something is still unclear, run **`--domain ux`** or **`--domain style`** (or another domain).
4. For implementation details in this repo, add **`--stack react`** / **`html-tailwind`** / **`nextjs`** as needed.
5. Ship UI that still matches Inkflow rules (touch targets, `prefers-reduced-motion`, no stray `bg-white`, etc.).

---

## Progressive disclosure

- **Deep checklist and rule tables** (priority matrix, quick reference bullets): see [quick-reference.md](quick-reference.md) in this folder. Load it when doing a full UX pass or audit.

---

## Data and scripts

| Item | Path |
|------|------|
| CLI | `.cursor/skills/ui-ux-pro-max/scripts/search.py` |
| Engine | `.cursor/skills/ui-ux-pro-max/scripts/core.py`, `design_system.py` |
| CSV data | `.cursor/skills/ui-ux-pro-max/data/` |

---

## Quality bar (short)

- Text contrast ≥ 4.5:1 for body copy; interactive targets ≥ 44×44px; respect `prefers-reduced-motion`.
- No horizontal scroll on `body`; visible hover/focus/disabled states.
- For more nuance, run:  
  `python .cursor/skills/ui-ux-pro-max/scripts/search.py "accessibility focus motion" --domain ux -n 5`
