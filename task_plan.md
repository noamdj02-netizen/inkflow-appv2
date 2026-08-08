# Task Plan: Cohérence du flux de dates — Planning & Agenda InkFlow

## Goal

Rendre le **flux des dates** du planning agenda **prévisible et cohérent** entre vues (liste, bandeau semaine, grille mois, mini-calendrier, calendrier studio, sidebar) en unifiant la **semaine lundi→dimanche**, les **chaînes YYYY-MM-DD** locales, et la **synchronisation d’état** entre onglets.

## Current Phase

Phase 3 (Implémentation) — **en cours** → module `lib/agendaDates.ts` + calendriers alignés lundi

## Phases

### Phase 1: Requirements & Discovery

- [x] Comprendre l’intent : améliorer planning agenda + flux des dates + cohérence
- [x] Cartographier les composants et incohérences potentielles → voir `findings.md`
- [x] Noter absence du script `session-catchup.py` dans ce repo
- **Status:** complete

### Phase 2: Conception & périmètre

- [x] Module **`lib/agendaDates.ts`** : `toLocalYmd`, `parseLocalYmd`, `agendaWeekStart` / `agendaWeekEnd`, `mondayOffsetFromMonthFirst`, `addAgendaNavStep`
- [x] **État** : pas de context global dans cette itération (comportement inchangé ; documenté)
- [x] **Mini-calendrier** : grille **lundi en colonne 0** (padding `mondayOffsetFromMonthFirst`)
- **Status:** complete

### Phase 3: Implémentation

- [x] `AppointmentCalendar.tsx` : semaine via `agendaWeekStart`, navigation `addAgendaNavStep`, `toLocalYmd`, `weekDays` avec `addDays` + `startOfDay`
- [x] `AgendaSummaryTab.tsx` : import `toLocalYmd` / `parseLocalYmd` / `agendaWeekStart` / `agendaWeekEnd` (suppression des helpers locaux dupliqués)
- [x] **MiniCalendar** + **PlanningSidebar** : `mondayOffsetFromMonthFirst`, en-têtes lun→dim, week-end colonnes 5–6
- [ ] (Option) **URL query** / `sessionStorage` pour dates — reporté
- **Status:** complete (hors option URL)

### Phase 4: Tests & vérification

- [ ] Scénarios manuels : changement d’heure d’été, minuit, fuseau local (fr-FR)
- [ ] Cohérence **ICS** « Ajouter à mon agenda » / plage affichée (Synthèse)
- [ ] **Status:** pending

### Phase 5: Delivery

- [ ] PR / résumé pour l’équipe
- [ ] Mettre à jour `progress.md` avec résultat final
- **Status:** pending

## Key Questions

1. L’**état date** doit-il être **dans l’URL** (query `?date=2026-04-24`) pour partage / refresh sans perte ?
2. **Semaine** : toujours **ISO** lundi (FR) partout, y compris padding du calendrier mensuel ?
3. Faut-il **@tanstack/react-query** ou un **context** `AgendaDateContext` si plusieurs panneaux doivent rester alignés en live ?

## Decisions Made

| Decision                                                   | Rationale                                                    |
| ---------------------------------------------------------- | ------------------------------------------------------------ |
| `lib/agendaDates.ts` centralise YYYY-MM-DD + semaine lundi | Une seule sémantique vs `toISOString` UTC et maths manuelles |
| Grille mensuelle lundi colonne 0                           | Cohérent avec bandeau semaine FR et `date-fns`               |
| Pas de `AgendaDateContext` dans ce lot                     | Réduction du scope ; les vues gardent leur état local        |

## Errors Encountered

| Error                                                           | Attempt | Resolution                                        |
| --------------------------------------------------------------- | ------- | ------------------------------------------------- |
| `session-catchup.py` not found in `.cursor/skills/.../scripts/` | 1       | Noter ; pas bloquant — planning créé manuellement |

## Notes

- Re-lire ce plan avant toute grosse refacto d’agenda.
- Fichiers voisins : `AgendaSummaryTab.tsx`, `AppointmentCalendar.tsx`, `AppointmentsView.tsx`, `MiniCalendar.tsx`, `PlanningSidebar.tsx`, `lib/googleCalendar.ts`, `lib/appointmentTime.ts`.
