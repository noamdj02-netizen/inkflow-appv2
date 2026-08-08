# InkFlow — Animation improvement plans

Audit motion **deep** · commit `993735b` · skill `improve-animations`

## Findings (vetted, by leverage)

| #   | Severity   | Category            | Location                                                                   | Finding                                                                                                               | Fix summary                                                           |
| --- | ---------- | ------------------- | -------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| 1   | **HIGH**   | Physicality         | `pages/vitrine/ArtistPage.tsx:410-422`                                     | `initial/exit={{ scale: 0 }}` on waitlist label swap                                                                  | ✅ **DONE** — scale 0.92 + opacity                                    |
| 2   | **HIGH**   | Purpose & frequency | `lib/motion/inkflowGestures.ts:35-38` + `DashboardSidebarNavButton.tsx:30` | `navHover: { x: 2 }` on every sidebar nav item — tens of clicks/day, motion adds latency feel                         | ✅ **DONE** — tap only                                                |
| 3   | **HIGH**   | Performance         | `components/dashboard/FloatingActionMenu.tsx:130-132`                      | FAB menu uses `filter: blur(10px)` + `duration: 0.6` spring — expensive blur, slow for occasional but repeated action | Drop blur; cap menu layer at 250ms ease-out; items 180ms stagger 40ms |
| 4   | **MEDIUM** | Performance + A11y  | `components/ui/notification-popover.tsx:43-45`                             | Notification rows animate `filter: blur(6px)` with no `useReducedMotion`                                              | Opacity + x only; branch reduced motion; drop blur                    |
| 5   | **MEDIUM** | Cohesion            | `components/ProcessSection.tsx:138-146`                                    | Section has `data-gsap-reveal` **and** Framer `whileInView` stagger — double entrance                                 | Remove outer `data-gsap-reveal`; keep Framer stagger inside           |
| 6   | **MEDIUM** | Performance         | `lib/inkDesignTokens.ts:116-120`, `index.css:225-231`                      | Shared button classes use `transition-all` — animates layout/colors off-GPU                                           | Replace with explicit `transform` + `opacity` + color tokens          |
| 7   | **MEDIUM** | Easing & duration   | `components/ThemeToggle.tsx:224`                                           | Appearance segments `transition-all duration-300 ease-in-out` — ease-in-out on UI state, 300ms at cap                 | `transition-colors duration-200` + `--ease-out` token                 |
| 8   | **LOW**    | Cohesion            | Landing hero + demo                                                        | Marketing uses 4 stacks (Framer load, BlurText, GSAP scrub, GSAP stagger) — OK if scoped; document in skill           | No code change; document boundaries                                   |
| 9   | **LOW**    | Interruptibility    | `RequestsInboxStagger`                                                     | Inbox stagger replays on every remount when switching Demandes sub-tabs                                               | Gate stagger with `initial={false}` after first show                  |

## Missed opportunities (additive)

1. **Payment success** (`PaymentSuccessModal.tsx`) — rare, high-emotion; allow slightly longer spring + confetti already present; verify reduced-motion path.
2. **Dashboard overview bento** — first visit of the day: subtle stagger on tiles (already partial in `DashboardBentoUnified`); extend once-per-session flag.
3. **Booking step shell** (`BookingMotion.tsx`) — ensure step forward/back uses asymmetric timing (user action slower, system response snap).
4. **Explorer discover cards** — `data-gsap-reveal-item` stagger on city grids (marketing surface).

## Exemplars (already correct — do not “fix”)

- `lib/motion/inkflowMotion.ts` — panel 200ms `INKFLOW_EASE_OUT`, toast spring, reduced-motion branches
- `components/dashboard/DashboardPro.tsx:3884-3890` — tab panel 200ms fade-up
- `components/ui/Modal.tsx:86-88` — desktop modal `scale: 0.96` not zero
- `components/motion/AppPageTransition.tsx` — skips initial load animation
- `contexts/ToastContext.tsx` — single toast, spring, reduced motion

## Dashboard audit (standard)

Voir [`dashboard-audit-standard.md`](./dashboard-audit-standard.md) — scope `components/dashboard`, 8 findings, prochaine priorité **003**.

## Plans

| Plan                                             | Title                                          | Severity | Status   |
| ------------------------------------------------ | ---------------------------------------------- | -------- | -------- |
| [001](./001-artist-page-scale-zero.md)           | Fix waitlist scale(0) on vitrine ArtistPage    | HIGH     | **DONE** |
| [002](./002-sidebar-nav-hover-remove.md)         | Remove sidebar nav hover slide                 | HIGH     | **DONE** |
| [003](./003-fab-menu-blur-duration.md)           | Trim FAB menu blur and duration                | HIGH     | **DONE** |
| [004](./004-notification-popover-motion.md)      | Notification list motion + a11y                | MEDIUM   | **DONE** |
| [005](./005-process-section-double-reveal.md)    | Dedupe ProcessSection GSAP + Framer            | MEDIUM   | **DONE** |
| [006](./006-transition-all-button-tokens.md)     | Replace transition-all on shared buttons       | MEDIUM   | TODO     |
| [007](./007-appointments-view-mode-crossfade.md) | Crossfade Liste ↔ Planning (AppointmentsView)  | MEDIUM   | **DONE** |
| [008](./008-agenda-summary-range-crossfade.md)   | Crossfade Jour/Semaine/Mois (AgendaSummaryTab) | MEDIUM   | **DONE** |
| [009](./009-appointments-mini-cal-expand.md)     | Mini-cal mobile expand animation               | MEDIUM   | **DONE** |
| [010](./010-payment-success-reduced-motion.md)   | PaymentSuccessModal a11y + tween               | MEDIUM   | **DONE** |

## Dashboard agenda opportunities (find-animation-opportunities)

| Opp   | Plan | Title                                  | Status       |
| ----- | ---- | -------------------------------------- | ------------ |
| #1    | 007  | Liste ↔ Planning crossfade             | **DONE**     |
| #2    | 008  | Jour/Semaine/Mois bridge               | **DONE**     |
| #3    | —    | Day strip list crossfade (agenda v2)   | **DEFERRED** |
| #4    | 009  | Mini-cal mobile expand                 | **DONE**     |
| #5    | 010  | PaymentSuccess reduced motion          | **DONE**     |
| #6–#7 | —    | Ticket enter / badge morph (agenda v2) | **DEFERRED** |

## Recommended execution order

1. **001** — isolated, 1 file, zero regression risk on dashboard
2. **002** — high-frequency feel win, 2 files
3. **003** — dashboard mobile FAB (bottom nav)
4. **004** — header notifications (dashboard + client shells)
5. **005** — landing only
6. **006** — shared tokens; run after 002–004 so new patterns propagate
7. **007 → 008 → 009 → 010** — dashboard agenda batch (007/009 same file; run 007 before 009)

**Dependencies:** 006 should reference easing values from `index.css` (`--ease-ios`) and `inkflowMotion.ts` (`INKFLOW_EASE_OUT`). No plan depends on another except 006 benefits from 002–004 being done first.

## Recon snapshot

| Item             | Value                                                                                   |
| ---------------- | --------------------------------------------------------------------------------------- |
| Stack            | Vite + React 19, Tailwind 4, Framer Motion 12, GSAP 3.15, Lenis 1.3                     |
| Marketing scroll | `.landing-scroll` + Lenis + GSAP ScrollTrigger proxy                                    |
| Dashboard scroll | `.app-shell-content` — **no Lenis/GSAP**                                                |
| Motion hub       | `lib/motion/inkflowMotion.ts`, `lib/motion/inkflowGestures.ts`                          |
| CSS tokens       | `index.css` `--ease-ios`, `--duration-press/release`, `@media (prefers-reduced-motion)` |
| Framer usage     | ~80 files; dashboard bento, modals, requests, booking                                   |
| GSAP             | `data-gsap-*` marketing only via `InkflowGsapScrollEffects`                             |
