---
name: inkflow-demandes-inbox
description: Patterns UI/IA pour la boîte Demandes (RequestsDashboard) — trois sources (agenda, page book, brief sans date), onglets, cartes accent border-l-4, en-tête fixe + scroll liste interne, cohérence avec AppointmentsView. À utiliser lors de changements sur components/dashboard/RequestsDashboard.tsx, RequestQuickViewSheet, sous-nav Demandes du shell, ou quand l’utilisateur parle d’inbox tatoueur, file d’attente demandes, ou clarification agenda vs /book vs brief.
---

# InkFlow — Boîte Demandes (inbox)

## Fichier principal

- `components/dashboard/RequestsDashboard.tsx`
- Navigation latérale alignée : `components/dashboard/DashboardPro.tsx` (libellés des sous-onglets)

## Modèle mental (à ne pas casser)

Trois **entrées** distinctes pour le tatoueur :

| Onglet | Source | Accent gauche (`SOURCE_ACCENT`) |
|--------|--------|----------------------------------|
| Créneaux agenda | RDV déjà posé dans l’agenda, pas encore validé | `agenda` → `border-l-amber-500` |
| Page book | Réservation /book (flash ou sur-mesure avec créneau) | flash → `vitrineFlash`, custom → `vitrineCustom` |
| Brief sans date | Formulaire projet sans date (≠ sur-mesure daté /book) | `brief` → `border-l-violet-600` |
| Historique | RDV agenda dont le statut n’est plus `pending` (traités / archivés) | même repère que **agenda** : `SOURCE_ACCENT.agenda` |

Les libellés courts côté navigation doivent rester **parallèles** à ce tableau (pas de synonymes ambigus entre sidebar et page).

## Cartes liste (pattern)

- Conteneur : `rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 shadow-sm`
- **Bordure gauche** : `border-l-4` + une clé de `SOURCE_ACCENT` (ne pas inventer de nouvelles couleurs vives hors zinc / amber / violet / sky déjà utilisés)
- Hover : `hover:bg-zinc-50/80 dark:hover:bg-zinc-800/25 transition-colors`
- Grille liste : `p-3 sm:p-4 space-y-3` sous le panneau d’onglets
- Avatar : `w-12 h-12 rounded-xl` + anneau `ring-1 ring-zinc-300/80 dark:ring-zinc-600/80`
- Prix : `font-semibold tabular-nums text-emerald-700 dark:text-emerald-400` (aligné liste RDV « agenda »)
- Boutons : `min-h-[44px]`, `rounded-xl`, `active:scale-[0.98]`, primaire `bg-zinc-900 dark:bg-white` ou sémantique (emerald / rouge) selon l’action

## Zone titre + liste (scroll interne — pas de sticky dans `.app-shell-content`)

- **Onglet Demandes** : le scroll **ne doit pas** être celui de `.app-shell-content` (sinon le bandeau « Page book » + onglets défilent avec la liste ou se chevauchent mal). Dans **`DashboardPro`**, pour `activeTab === 'requests'` : `.app-shell-content` reçoit `data-inkflow-requests-scroll="true"`, `flex min-h-0 flex-col overflow-hidden` ; **`index.css`** impose `overflow: hidden` sur ce sélecteur (priorité sur la règle globale `.app-shell-content { overflow-y: auto }`). Le **`motion.div`** du panneau et le wrapper autour de **`RequestsDashboard`** : `flex min-h-0 flex-1 flex-col`.
- **`RequestsDashboard`** racine : `isolate flex min-h-0 flex-1 flex-col overflow-hidden` ; **en-tête** (titre, grille sources, onglets, encart) : `shrink-0` (plus de `position: sticky` ici) ; **liste** : conteneur `flex-1 min-h-0 touch-pan-y overflow-y-auto overscroll-y-contain` autour de `#requests-panel` ; animation liste : `animate-fade-in motion-reduce:animate-none`.
- Sur les **autres** onglets, `.app-shell-content` garde `overflow-y: auto` (comportement inchangé).
- **Ne pas** envelopper l’en-tête dans un parent avec `animate-fade-in` : le `transform` de l’animation peut gêner le layout. Garder `animate-fade-in` sur le bloc liste / `#requests-panel` si besoin.
- **Chevauchement visuel** (flou / transparence) : sur **mobile**, fond **opaque** sur l’en-tête (`max-sm:bg-zinc-50 max-sm:dark:bg-black`) ; à partir de **`sm:`**, `backdrop-blur-md` + fond légèrement translucide ; ombre sous l’en-tête pour séparer de la liste.

## Historique

- Données : filtre sur `appointments` avec statut **≠** `pending`, tri récent d’abord.
- Même **carte accentuée** que les créneaux agenda (bordure gauche amber), pas de liste `divide-y` plate.
- Réutiliser les blocs **fidélité tampons** (`stampRewardForEmail`) si présents, comme sur l’onglet agenda.

## Icônes & feedback

- Uniquement **`lucide-react`**
- Toasts via `useToast` après actions métier critiques

## Fichiers voisins

- `RequestQuickViewSheet.tsx` — aperçu rapide au clic
- `inkflow-appointments-view-style` — liste RDV agenda (AppointmentsView) ; garder la cohérence des accents et badges statut
- `inkflow-manual-booking` — si le sujet touche créneaux, dispo vitrine et chevauchement
- **Clients** (`components/crm/ClientList.tsx`) — même hiérarchie titre : mobile **Liste clients** + eyebrow « Clients », desktop **Clients** ; cartes mobile `border-l-4` via `getClientCardLeftAccent` ; montants en **emerald** comme les listes RDV.

## Mobile — titre (pas de double « Demandes »)

Le **shell** (top bar / bottom nav) affiche déjà « Demandes ». Sur **`sm:` non atteint** :

- Un libellé discret **« Demandes »** (`text-[11px] uppercase`) au-dessus du **`h1`** qui porte le **nom de l’onglet actif** (`Créneaux agenda`, `Page book`, `Brief sans date`, `Historique`) — pas un second titre « Demandes » en `text-2xl`.
- À partir de **`sm:`**, le **`h1`** redevient **« Demandes »** comme sur le web desktop.

## Mobile & « slide » horizontal

- Conteneur racine : `flex min-w-0 flex-1 flex-col overflow-hidden` ; le **scroll vertical** est dans la région liste (`flex-1 min-h-0 overflow-y-auto`), pas dans `.app-shell-content` sur l’onglet Demandes.
- Rangée de **sous-filtres** (Flash / Sur-mesure) : `overflow-x-auto overscroll-x-contain touch-pan-x scrollbar-hide` pour un défilement horizontal maîtrisé sans bloquer le scroll vertical de la page.
- **Réduire le bruit** sous `sm:` : grille des 3 sources en `hidden sm:grid` + une phrase courte en `sm:hidden` ; paragraphe « Ordre conseillé » en `hidden sm:flex`.
- **Cartes Page book** : avatar plus petit, email `truncate`, description `line-clamp-1` → `sm:line-clamp-2`, badges emplacement / taille en `hidden sm:inline-flex`, bloc fidélité raccourci sur mobile, paddings `p-3.5 sm:p-5`.

## Checklist avant merge

1. [ ] Nouvelle liste = **cartes** + `SOURCE_ACCENT` sauf cas documenté
2. [ ] En-tête Demandes non enveloppé par un parent `transform` (animation) ; scroll liste = `overflow-y-auto` interne, pas scroll global du shell
3. [ ] Libellés sidebar = page Demandes pour les 4 onglets
4. [ ] Cibles tactiles ≥ 44px sur les actions principales
5. [ ] Pas de débordement horizontal : `min-w-0` sur les flex internes des cartes
