/**
 * Tokens partagés — pages dashboard alignées sur Vue d’ensemble / pilotage table.
 * Réutiliser pour Demandes, Clients et futures listes CRM.
 */
import { KPI_SHELLS } from '../DashboardOverviewDesignSystem';

export const dashboardPageCardTitle = 'font-display text-xl font-bold tracking-tight sm:text-2xl';

export const dashboardFilterPillContainer =
  'rounded-2xl border border-zinc-200/60 bg-zinc-100/80 p-1 dark:border-zinc-800 dark:bg-zinc-900/50';

export const dashboardFilterPillActive =
  'border border-zinc-200/80 bg-white text-zinc-900 shadow-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-white';

export const dashboardFilterPillInactive =
  'border border-transparent text-zinc-600 hover:bg-zinc-100/80 dark:text-zinc-400 dark:hover:bg-zinc-800/60';

export const dashboardFilterChipTrack =
  'flex gap-1 overflow-x-auto overscroll-x-contain scrollbar-hide touch-pan-x rounded-xl border border-zinc-200/60 bg-zinc-50/60 p-1 dark:border-zinc-800 dark:bg-zinc-900/30';

export const dashboardFilterChipActive = 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900';

export const dashboardFilterChipInactive =
  'text-zinc-600 hover:bg-zinc-100/90 dark:text-zinc-400 dark:hover:bg-zinc-800/80';

export const dashboardPrimaryBtn =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-zinc-800 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100';

export const dashboardSecondaryBtn =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold text-foreground transition-all hover:bg-zinc-50 active:scale-[0.98] dark:hover:bg-zinc-800/80';

export const dashboardListAvatarFrame =
  'flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-zinc-100 transition-all dark:bg-zinc-800';

export const dashboardListRowHover =
  'transition-colors hover:bg-zinc-50/80 dark:hover:bg-zinc-900/40';

export const dashboardTreatNextBar =
  'rounded-2xl border border-border border-l-4 border-l-emerald-500 bg-card p-3.5 sm:p-4';

export const dashboardInboxSectionTitle =
  'text-xs font-semibold uppercase tracking-wide text-muted-foreground';

/** Tuiles KPI mobile — bande primary à gauche (Vue d’ensemble). */
export const dashboardKpiMobile = KPI_SHELLS.mobile;
