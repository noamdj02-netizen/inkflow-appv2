---
name: inkflow-appointments-view-style
description: Styles and layout patterns for InkFlow dashboard appointment lists (AppointmentsView mobile cards and desktop table). Use when editing components/dashboard/AppointmentsView.tsx, planning rendez-vous UI, RDV row/card combos, status badges, or when the user asks to improve appointment list styling, density, or visual hierarchy.
---

# InkFlow — AppointmentsView (liste RDV)

## Scope

- **Fichier principal :** `components/dashboard/AppointmentsView.tsx`
- **Deux surfaces :** cartes **mobile** (`md:hidden`) et **tableau desktop** (`hidden md:block`)
- **Design system :** palette zinc, accents statut (emerald / amber / rose), `rounded-2xl`, `lucide-react` uniquement

## En-tête page (shell mobile)

La bottom bar affiche déjà **« Agenda »** : **pas d’eyebrow** « Agenda » au-dessus du titre (évite le doublon). Sur **&lt; `sm`**, le seul **`h1`** porte **« Liste & semaine »** ou **« Vue mois »** (selon `planningView`) ; **`sm+`** le **`h1`** affiche **« Rendez-vous »**. Conteneur racine : **`<section aria-labelledby="appointments-heading">`** avec **`id="appointments-heading"`** sur le **`h1`**. Le bloc **KPI + Aperçu** reste hors du wrapper `animate-fade-in` ; l’animation s’applique à la barre d’outils + liste pour éviter les effets `transform` sur un futur sticky.

## Cartes mobile (combo ligne)

Chaque RDV est un `<button>` pleine largeur avec :

- **Bordure gauche** : `border-l-4` + `CARD_LEFT_ACCENT[status]` (repère statut sans relire le badge)
- **Conteneur :** `rounded-2xl`, `border`, ombre légère, `active:scale-[0.99]`, `touch-manipulation`
- **Bloc haut :** avatar `rounded-2xl` + nom (truncate) + **prix** aligné à droite (`tabular-nums`)
- **Ligne meta :** date/heure `tabular-nums`, **badge statut** (`STATUS_STYLES` + `STATUS_DOT`), chip **Acompte** si `needsDepositAttention`
- **Bloc bas (export) :** séparé par `border-t`, actions **min-h-11** (cible tactile ≥ 44px), `stopPropagation` sur liens/boutons secondaires

## Tableau desktop

- **Carte englobante :** `rounded-2xl border shadow` légère, en-tête avec compteur « N rendez-vous »
- **En-têtes colonnes :** `text-[10px] uppercase tracking-wider text-zinc-500`
- **Lignes :** `group cursor-pointer`, `hover:bg-zinc-50`, séparateurs `border-b` sauf dernière ligne
- **Client :** avatar `rounded-xl` + nom + email secondaire
- **Date :** icône `Clock` + texte `tabular-nums`
- **Prix :** `font-bold text-emerald-700 dark:text-emerald-400 tabular-nums` (mobile + desktop)
- **Statut + acompte :** mêmes `STATUS_*` que le mobile
- **Colonne actions :** `opacity-0 group-hover:opacity-100`, boutons Confirmer / Terminer selon statut, liens Agenda / .ics

## Cartes de statut (à ne pas dupliquer en dur)

Réutiliser les maps existantes : `STATUS_LABELS`, `STATUS_DOT`, `STATUS_STYLES`, `CARD_LEFT_ACCENT`. Tout nouveau statut = une entrée dans **chaque** map.

## Checklist d’amélioration « combo »

1. **Hiérarchie :** titre client > date > service ; prix visible en un scan (droite ou colonne dédiée)
2. **Densité :** `py-3.5` / `gap-3` cohérents ; éviter les lignes trop hautes sur mobile
3. **Contrastes :** `text-zinc-500` pour secondaire ; jamais gris trop clair sur fond clair sans `dark:`
4. **Numéros :** dates, heures, prix en `tabular-nums` où c’est pertinent
5. **Actions :** zones cliquables ≥ 44px en mobile ; `stopPropagation` pour ne pas ouvrir la fiche RDV en même temps
6. **Parité mobile/desktop :** même infos (ou équivalent compact) ; badges statut identiques

## Anti-patterns

- Ne pas introduire d’autre lib d’icônes que `lucide-react`
- Ne pas casser le clic ligne (table `onClick` sur `<tr>`) : toujours `stopPropagation` sur actions inline
- Éviter `bg-white` seul sans variante `dark:` sur les cartes (utiliser les classes déjà présentes sur la zone)

## Fichiers voisins (contexte)

- `MiniCalendar`, `AppointmentCalendar` — filtres et vue calendrier
- Types : `Appointment`, `Client` dans `types/`

Pour le détail des tokens globaux InkFlow SaaS, se référer aux règles projet (`.cursor/rules/inkflow-saas-conventions.mdc`).
