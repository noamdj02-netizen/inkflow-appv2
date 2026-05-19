import { cn } from '@/lib/utils';

/** Fond page dashboard mobile (light). */
export const dashboardPageBg = 'bg-zinc-50 dark:bg-zinc-950';

/** Carte light — blanc pur + bordure zinc-100. */
export const dashboardCard =
  'overflow-hidden rounded-2xl border border-zinc-100 bg-white dark:border-white/10 dark:bg-zinc-900/30 dark:backdrop-blur-md';

/** Groupe type Réglages iOS / liste native — une carte, séparateurs internes. */
export const dashboardSettingsGroup = cn(
  dashboardCard,
  'dark:bg-zinc-950/40 dark:backdrop-blur-none'
);

export const dashboardSettingsDivide = 'divide-y divide-zinc-100 dark:divide-zinc-900/50';

/** Liste — bloc parent unique (Demandes, dépôts, réglages). */
export const dashboardListPanel = cn(dashboardSettingsGroup, dashboardSettingsDivide);

/** Ligne dans une liste groupée. */
export const dashboardListRow =
  'flex w-full flex-col gap-3 px-4 py-3.5 text-left transition-colors hover:bg-zinc-50/90 active:scale-[0.99] dark:hover:bg-zinc-900/50 sm:flex-row sm:items-start sm:gap-4';

export const dashboardListRowCompact =
  'flex w-full min-h-[52px] items-center gap-3 px-4 py-3.5 transition-colors hover:bg-zinc-50/90 dark:hover:bg-zinc-900/50';

/** Icône ligne réglages — monochrome (spec mobile premium). */
export const dashboardSettingsRowIcon =
  'flex size-9 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100';

/** Icône ligne réglages — accent bleu électrique uniquement. */
export const dashboardSettingsRowIconAccent =
  'flex size-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400';

/** Icône tuile header — monochrome (pas d’avatar). */
export const dashboardTileIcon =
  'flex size-10 shrink-0 items-center justify-center rounded-xl border border-zinc-100 bg-zinc-100 text-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100';

/** Icône accent bleu électrique (seul accent couleur autorisé hors badges pastel). */
export const dashboardTileIconAccent =
  'flex size-10 shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-blue-600 dark:border-blue-900/50 dark:bg-blue-950/40 dark:text-blue-400';

/** Avatar / initiales — cercle parfait. */
export const dashboardAvatarFrame =
  'relative shrink-0 overflow-hidden rounded-full bg-zinc-100 ring-1 ring-zinc-100 dark:bg-zinc-900 dark:ring-zinc-800';

export const dashboardAvatarSm = 'size-12';
export const dashboardAvatarMd = 'size-14 sm:size-16';

export const dashboardBtnPrimary =
  'inline-flex min-h-11 items-center justify-center rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition-all hover:bg-zinc-800 active:scale-[0.98] disabled:opacity-50 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100';

export const dashboardBtnAccent =
  'inline-flex min-h-11 items-center justify-center rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-all hover:bg-blue-700 active:scale-[0.98] disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-400';

export const dashboardBtnSecondary =
  'inline-flex min-h-11 items-center justify-center rounded-xl border border-zinc-100 bg-white px-4 py-2.5 text-sm font-medium text-zinc-900 transition-all hover:bg-zinc-50 active:scale-[0.98] dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:hover:bg-zinc-900';

export const dashboardBtnDanger =
  'inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-zinc-100 bg-white px-4 py-2.5 text-sm font-medium text-rose-600 transition-all hover:bg-rose-50 active:scale-[0.98] dark:border-zinc-800 dark:bg-zinc-950 dark:text-rose-400 dark:hover:bg-rose-950/30';

/** Barre d’actions fixe bas d’écran (fiche détail mobile). */
export const dashboardStickyActionBar =
  'shrink-0 border-t border-zinc-100 bg-white/95 px-4 pt-3 backdrop-blur-md dark:border-zinc-900 dark:bg-zinc-950/95 pb-[max(12px,env(safe-area-inset-bottom,0px))]';

/** Tuile KPI pilotage (sans ombre / dégradé). */
export const dashboardStatTile =
  'relative flex min-h-[108px] w-full flex-col justify-end overflow-hidden rounded-2xl border border-zinc-100 bg-white p-4 text-left transition-colors active:scale-[0.98] dark:border-zinc-900 dark:bg-zinc-950/40';

export const dashboardStatIconBadge =
  'absolute right-3 top-3 flex size-8 items-center justify-center rounded-full border border-zinc-100 bg-zinc-50 text-zinc-800 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200';

/** Badges statut — pill pastel, texte contrasté. */
export const dashboardStatusBadge = {
  new: 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400',
  pending:
    'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/35 dark:text-amber-300',
  active:
    'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400',
  neutral:
    'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-zinc-100 text-zinc-600 dark:bg-zinc-800/80 dark:text-zinc-400',
  danger:
    'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-rose-50 text-rose-700 dark:bg-rose-950/35 dark:text-rose-400',
} as const;

export function bookingStatusBadgeClass(status: string): string {
  if (status === 'pending') return dashboardStatusBadge.pending;
  if (status === 'confirmed' || status === 'accepted' || status === 'deposit_paid')
    return dashboardStatusBadge.active;
  if (status === 'rejected' || status === 'cancelled') return dashboardStatusBadge.danger;
  return dashboardStatusBadge.neutral;
}

export function projectStatusBadgeClass(status: string): string {
  if (status === 'pending') return dashboardStatusBadge.new;
  if (status === 'accepted') return dashboardStatusBadge.active;
  if (status === 'rejected') return dashboardStatusBadge.danger;
  return dashboardStatusBadge.neutral;
}

/** En-tête de page dashboard (Paramètres, CRM, etc.). */
export const dashboardPageHeader =
  'font-display text-2xl font-bold tracking-tight text-zinc-900 dark:text-white sm:text-3xl';

export const dashboardPageSubtitle =
  'mt-1.5 max-w-2xl text-sm text-zinc-500 dark:text-zinc-400 sm:text-base';

/** Titre de section (uppercase discret). */
export const dashboardSectionTitle =
  'text-[10px] font-bold uppercase tracking-[0.12em] text-zinc-400 dark:text-zinc-500';

/** Icône inline monochrome (lucide dans listes / labels). */
export const dashboardIconMuted = 'size-4 shrink-0 text-zinc-500 dark:text-zinc-400';

export const dashboardIconStrong = 'size-4 shrink-0 text-zinc-900 dark:text-zinc-100';

/** Bouton icône 44px (fiche client, actions ligne). */
export const dashboardIconButton =
  'inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-xl border border-zinc-100 bg-white text-zinc-900 transition-all hover:bg-zinc-50 active:scale-[0.98] dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:hover:bg-zinc-900';

/** Surface carte CRM (sans ombre lourde). */
export const dashboardCardSurface = dashboardCard;
