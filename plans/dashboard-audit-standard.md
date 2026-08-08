# Audit motion — `components/dashboard` (standard)

- **Date**: 2026-08-07
- **Commit**: 993735b (+ exécution plans 001–002)
- **Scope**: `components/dashboard/**` (Framer Motion, CSS transitions, pas Lenis/GSAP)

## Recon dashboard

| Item            | Détail                                                                             |
| --------------- | ---------------------------------------------------------------------------------- |
| Scroll          | `.app-shell-content` — natif                                                       |
| Motion hub      | `lib/motion/inkflowMotion.ts`, `inkflowGestures.ts`, `requests/RequestsMotion.tsx` |
| Framer fichiers | ~20 composants dashboard avec `motion.`                                            |
| Personnalité    | SaaS pro crisp — panel 200ms, tap 120ms                                            |
| Exemplars       | `DashboardPro.tsx:3884-3890` (onglets), `Modal.tsx`, `RequestsMotion.tsx`          |

## Findings (vetted)

| #   | Sév.       | Catégorie           | Location                               | Finding                                                            | Fix / plan                                           |
| --- | ---------- | ------------------- | -------------------------------------- | ------------------------------------------------------------------ | ---------------------------------------------------- |
| D1  | **HIGH**   | Performance         | `FloatingActionMenu.tsx:130-132`       | Menu FAB `blur(10px)` + spring 600ms                               | → **Plan 003**                                       |
| D2  | **HIGH**   | Purpose & frequency | `DashboardSidebarNavButton.tsx`        | `whileHover x:2` sur nav                                           | → **Plan 002** ✅ DONE                               |
| D3  | **MEDIUM** | Performance         | `RequestsDashboard.tsx` (+15 fichiers) | `transition-all` sur pills/boutons inbox                           | → **Plan 006** (phase tokens)                        |
| D4  | **MEDIUM** | Performance         | `FinancePilotagePanel.tsx:592`         | Barre progress `transition-all` (width animée = layout)            | Plan dédié ou 006 étendu : `transition-[width]` only |
| D5  | **MEDIUM** | Easing              | `FloatingActionMenu.tsx:27-33`         | Transition plus : `easeInOut` + spring mélangés                    | Corrigé avec **003**                                 |
| D6  | **MEDIUM** | Interruptibility    | `RequestsInboxStagger`                 | Stagger rejoue à chaque remount sous-onglet                        | `initial={false}` après 1ère visite (plan LOW futur) |
| D7  | **LOW**    | Cohesion            | `DashboardOverviewTab` / bento         | Tiles OK avec `useReducedMotion`; stagger pourrait être 1×/session | Opportunité additive                                 |
| D8  | **LOW**    | Physicality         | `PendingCriticalWritesBanner.tsx:96`   | Pulse 2.8s easeInOut — acceptable (alerte rare)                    | Aucune action                                        |

## Déjà correct (ne pas toucher)

- Transitions onglets `DashboardPro` — 200ms `[0,0,0.2,1]`
- `DashboardSidebarSubnavButton` — tap seul, pas de hover motion
- `RequestsTabPanel` — `inkflowTransition.panel`
- Bento tiles — `useReducedMotion` présent
- Pas de GSAP/Lenis dans dashboard (intentionnel)

## Missed opportunities (dashboard)

1. **PaymentSuccessModal** — célébration acompte (rare) — spring légèrement plus visible OK
2. **Changement d’onglet sidebar** — crossfade hero tab (`DashboardTabHero`) déjà partiel
3. **Empty states** CRM/agenda — fade-up unique au premier affichage

## Prochaines exécutions recommandées

1. **003** — FAB mobile (blur + durée)
2. **004** — Notification popover (header dashboard)
3. **006** — `transition-all` tokens partagés
4. Plan ad hoc **D4** — barres width `FinancePilotagePanel` / `FirstBookingGoalCard`

## Plans status (dashboard-related)

| Plan                      | Status   |
| ------------------------- | -------- |
| 002 Sidebar nav hover     | **DONE** |
| 003 FAB menu              | TODO     |
| 004 Notifications         | TODO     |
| 006 transition-all tokens | TODO     |
