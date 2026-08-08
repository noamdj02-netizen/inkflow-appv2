# Thème shadcn/ui InkFlow — 7 août 2026

Configuration shadcn pour le dashboard **sans** preset Maia/Mist (`base-maia` + `mist` du projet de référence). On conserve la **structure composants** (`radix-nova` + `baseColor: neutral`) et les **tokens couleur InkFlow**.

---

## Init shadcn

| Élément       | Valeur                                                                 |
| ------------- | ---------------------------------------------------------------------- |
| Commande init | **Non relancée** — déjà initialisé (`components.json` présent)         |
| Style         | `radix-nova` (≠ `base-maia` / ≠ `mist`)                                |
| Template      | Vite (repo actuel)                                                     |
| CSS variables | `true`                                                                 |
| Fichier CSS   | `index.css`                                                            |
| Utils         | `@/lib/utils` (`cn` + `safeJsonParse` / `toLocalDateString` préservés) |

Référence rejetée : `/Users/noambrochet/Downloads/new-base-maia-project` (`style: base-maia`, `baseColor: mist`).

---

## Composants identifiés & installés

### Déjà présents (dashboard actif)

| Composant               | Usage dashboard                        |
| ----------------------- | -------------------------------------- |
| `button`                | CTA, actions (Overview, Billing, FAB…) |
| `card`                  | KPI, tuiles bento, réglages            |
| `badge`                 | Statuts, compteurs                     |
| `alert`                 | Banners erreur / info                  |
| `avatar`                | Clients, agenda                        |
| `tabs` / `toggle-group` | Filtres agenda, vues                   |
| `select`                | Filtres, formulaires                   |
| `separator`             | Sections Billing                       |
| `sidebar`               | Navigation `DashboardProSidebar`       |
| `dropdown-menu`         | Menus contextuels                      |
| `sheet` / `drawer`      | Panneaux latéraux mobile               |
| `tooltip`               | Aide contextuelle (`App.tsx`)          |
| `checkbox` / `toggle`   | Préférences                            |
| `input` / `label`       | Formulaires                            |
| `table`                 | Listes données                         |
| `empty`                 | États vides agenda                     |
| `chart`                 | Graphiques overview                    |
| `sonner`                | Toasts                                 |
| `skeleton`              | Chargement                             |

### Ajoutés cette session

| Composant      | Usage prévu                                                  |
| -------------- | ------------------------------------------------------------ |
| `dialog`       | Modales shadcn (remplace progressivement les modales custom) |
| `alert-dialog` | Confirmations destructives                                   |
| `popover`      | Menus flottants (notifications, filtres)                     |
| `slider`       | Filtres numériques (finance, plages)                         |
| `progress`     | Barres progression (onboarding, objectifs)                   |
| `switch`       | Toggles paramètres                                           |
| `scroll-area`  | Listes longues sidebar / palette                             |
| `command`      | `StudioCommandPalette` (⌘K)                                  |
| `accordion`    | Sections paramètres repliables                               |
| `radio-group`  | Choix exclusifs formulaires                                  |
| `collapsible`  | Groupes sidebar                                              |
| `textarea`     | Dépendance `command`                                         |
| `input-group`  | Dépendance `command`                                         |

Commande :

```bash
npx shadcn@latest add dialog alert-dialog popover slider progress switch scroll-area command accordion radio-group collapsible -y --overwrite
```

---

## Thème Vercel (21st.dev) — 7 août 2026

Source : [21st.dev/@serafimcloud/themes/vercel](https://21st.dev/@serafimcloud/themes/vercel)  
Install CLI équivalente (21st renvoie 404) :

```bash
npx shadcn@latest add "https://tweakcn.com/r/themes/vercel.json" -y
```

| Élément          | Valeur                                                                                                                |
| ---------------- | --------------------------------------------------------------------------------------------------------------------- |
| Palette          | Noir / blanc / gris neutres (OKLCH)                                                                                   |
| Primary light    | `oklch(0 0 0)` — CTA noir                                                                                             |
| Primary dark     | `oklch(1 0 0)` — CTA blanc                                                                                            |
| Radius           | `0.5rem`                                                                                                              |
| Fonts            | **Geist** + **Geist Mono**                                                                                            |
| Typo             | `.type-heading` · `.type-subtitle` · `.type-body` · `.type-caption` · `.type-heading-sm` · `.type-stat`               |
| Constantes       | `dashboardPageHeader`, `dashboardPageSubtitle`, `dashboardBodyText`, `dashboardCaptionText` dans `dashboardChrome.ts` |
| Blocs mis à jour | `:root`, `:root[data-theme='light']`, `:root[data-theme='dark']`, `.dark`                                             |

Registry `components.json` : `@tweakcn` → `https://tweakcn.com/r/{name}.json`

**Hors scope tokens** : surfaces `/book` et vitrine avec classes `ink-*` hardcodées conservent leur charte tant qu’elles n’utilisent pas les variables shadcn.

---

## Fichier de thème modifié

**Fichier principal :** `index.css`

| Bloc CSS                             | Rôle                                            |
| ------------------------------------ | ----------------------------------------------- |
| `:root`                              | Tokens shadcn **jour** (fallback) + fonts       |
| `:root[data-theme='light']`          | Jour Vercel + legacy `--bg-*` / `--text-*`      |
| `:root[data-theme='dark']`           | Nuit Vercel (noir pur + gris)                   |
| `.dark, :root[data-theme='dark']`    | Miroir nuit shadcn                              |
| `@theme inline`                      | `--font-sans: Geist`, `--font-mono: Geist Mono` |
| `.dashboard-pro-shell [data-slot]`   | Geist sur composants shadcn dashboard           |
| `.dashboard-pro-shell .font-numeric` | Geist Mono pour chiffres                        |

**Anti-flash :** `index.html` — à aligner sur `#000` (dark) / `#fcfcfc` (light) si besoin.

**Police ajoutée :** `@fontsource/jetbrains-mono` (400–700).

---

## Tokens shadcn InkFlow

### Mode dark (défaut dashboard nuit)

| Variable                                            | Valeur                                        |
| --------------------------------------------------- | --------------------------------------------- |
| `--background`                                      | `#0d0d0d`                                     |
| `--foreground`                                      | `#e8e3dc`                                     |
| `--card` / `--popover` / `--secondary` / `--accent` | `#161616`                                     |
| `--muted`                                           | `#1c1c1c`                                     |
| `--muted-foreground`                                | `#6b6b6b`                                     |
| `--border` / `--input`                              | `#2a2a2a`                                     |
| `--primary` / `--ring`                              | `#00D4FF` (cyan flash — défaut)               |
| `--primary-foreground`                              | `#0d0d0d`                                     |
| `--destructive`                                     | `#e2574c`                                     |
| `--radius`                                          | `0.375rem` (6px — ticket/tampon, pas soft-UI) |

Accents alternatifs documentés (non câblés UI) : Amber `#C9A84C`, Red `#DC2626`, Violet `#7C3AED` — remplacer `--primary` / `--ring` / `--pro-accent` si besoin.

### Mode light (jour — aligné maquette agenda v2 jour)

| Variable               | Valeur    |
| ---------------------- | --------- |
| `--background`         | `#f6f3ec` |
| `--foreground`         | `#0d0d0d` |
| `--card`               | `#ffffff` |
| `--border` / `--input` | `#ddd6c6` |
| `--muted-foreground`   | `#8a8578` |
| `--primary` / `--ring` | `#00738f` |

---

## Avant / après (visuel)

| Aspect        | Avant (preset b0)                        | Après (InkFlow)                              |
| ------------- | ---------------------------------------- | -------------------------------------------- |
| Primary dark  | Blanc/gris `oklch(0.922 0 0)`            | Cyan `#00D4FF` sur fond `#0d0d0d`            |
| Fond dark     | Zinc `#09090b` / oklch neutre            | Ink `#0d0d0d` + cartes `#161616`             |
| Fond light    | `#fafafa` neutre                         | Crème `#f6f3ec` + cartes blanches            |
| Radius        | `0.625rem` (10px)                        | `0.375rem` (6px)                             |
| Police shadcn | Geist (via `@fontsource-variable/geist`) | **Inter** body + **JetBrains Mono** chiffres |
| Charts        | Échelle grise monochrome                 | Cyan / amber / rouge / violet InkFlow        |

**Non modifié (scope respecté) :**

- `inkflow-mobile/` — agenda natif / ticket-tampon
- Composants legacy ticket : `ink-button`, `ink-card`, `ink-badge`, surfaces `/book` et `/studio` (tokens `ink-*`)
- Cartes OLED `.ink-oled-*` (agenda dashboard stylé à part)

---

## Vérification

```bash
npm run build   # ✓ OK (7 août 2026)
```

Tester manuellement :

1. `/dashboard` — mode sombre : sidebar, cards overview, boutons primary cyan
2. Toggle jour/nuit — fond crème `#f6f3ec`, primary `#00738f`
3. Composants shadcn neufs disponibles à l'import depuis `@/components/ui/*`

---

## Prochaines étapes (optionnel)

- Migrer `StudioCommandPalette` vers `<Command>` shadcn
- Remplacer `Modal.tsx` / `ConfirmModal.tsx` par `dialog` / `alert-dialog` progressivement
- Brancher `data-dashboard-accent` sur `--primary` si choix accent tatoueur en prod
