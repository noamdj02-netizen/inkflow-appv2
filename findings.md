# Findings & Decisions — Agenda / planning / dates

## Requirements (capturées)

- **Améliorer** le planning agenda : **flux des dates** et **cohérence** entre les vues.
- Utilisateur francophone (semaine **lundi** déjà implicite dans plusieurs écrans).

## Research Findings

### 1. Deux « langages » pour le lundi de semaine

- **`AgendaSummaryTab.tsx`** : `date-fns` — `startOfWeek(d, { weekStartsOn: 1 })`, `endOfWeek`, `format` / `parse` pour `yyyy-MM-dd`.
- **`AppointmentsView.tsx`** : `startOfWeek` / `endOfWeek` (date-fns) pour bornes type « cette semaine ».
- **`AppointmentCalendar.tsx`** : **logique manuelle** `d.setDate(d.getDate() - (d.getDay() || 7) + 1)` — équivalent lundi, mais **dupliquée** et plus fragile (tests, changements de règles).
- **Risque** : écarts subtils si on modifie un seul endroit, ou si `Date` mutée incorrectement.

### 2. Chaînes jour `YYYY-MM-DD`

- **`AppointmentCalendar`** : `toLocalDateStr` (correct — évite UTC de `toISOString`).
- **`AgendaSummaryTab`** : `ymd` via `format(d, 'yyyy-MM-dd')` (date-fns, cohérent en local).
- **À faire** : **un seul module exporté** pour toute l’app (naming explicite, JSDoc).

### 3. Grilles calendrier (padding du 1er du mois)

- **`PlanningSidebar`** / **`MiniCalendar`** : `startPad = first.getDay()` — **dimanche = 0** (grille type US).
- Les **clics** et **comparaisons** utilisent `YYYY-MM-DD` ; l’**alignement visuel** des jours du mois peut ne pas coller à un calendrier mural FR **lundi en tête** si on ne convertit pas le padding en « offset depuis lundi ».
- **À vérifier** : est-ce que la colonne du « 1 » correspond bien au bon jour de la semaine affiché en en-têtes ?

### 4. État fragmenté

- `selectedDate` (AppointmentsView + sidebars)
- `anchor` + `range` (AgendaSummaryTab)
- `weekStart` (AppointmentCalendar)
- `currentMonth` (PlanningSidebar)
- Pas de **source unique** documentée : changement d’onglet peut donner l’impression de « sauter » de date si l’utilisateur s’y attend autrement.

### 5. Outils / skill

- Script **`.cursor/skills/planning-with-files/scripts/session-catchup.py`** : **absent** de ce dépôt (commande a échoué). Récupérer le script depuis le template skill ou retirer la référence si inutile ici.

## Technical Decisions

| Question                   | Proposition                                                                                     |
| -------------------------- | ----------------------------------------------------------------------------------------------- |
| Module central date agenda | Créer `lib/agendaDates.ts` (ou étendre `appointmentTime.ts` si vous préférez moins de fichiers) |
| Semaine                    | Toujours `weekStartsOn: 1` via date-fns                                                         |
| Calendrier mois            | Calculer `startPad` = `(getDay() + 6) % 7` si la grille est **lundi-colonne-0**                 |

## Open Questions

- Synchronisation **URL** / **contexte React** pour l’agenda (priorité produit) ?
- Tests automatisés (Vitest) sur fonctions pures de dates ?
