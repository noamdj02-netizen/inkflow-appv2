import { inkOledCard, inkOledStack } from '@/lib/inkDesignTokens';
import { cn } from '@/lib/utils';

/** Fond page dashboard — OLED true black */
export const dashboardPageBg = 'bg-zinc-50 dark:bg-black';

/** Carte flottante — 20px, sans bordure en dark */
export const dashboardCard = cn(inkOledCard);

/** Groupe liste — espacement, pas de dividers en dark */
export const dashboardSettingsGroup = cn(dashboardCard, 'dark:divide-y-0');

export const dashboardSettingsDivide = 'divide-y divide-zinc-100 dark:divide-y-0';

/** Liste — bloc parent */
export const dashboardListPanel = cn(dashboardSettingsGroup, 'dark:flex dark:flex-col dark:gap-3');

/** Ligne dans une liste groupée */
export const dashboardListRow =
  'flex w-full flex-col gap-3 px-4 py-4 text-left transition-colors hover:bg-zinc-50/90 active:scale-[0.99] dark:hover:bg-white/[0.04] sm:flex-row sm:items-start sm:gap-4';

export const dashboardListRowCompact =
  'flex w-full min-h-[52px] items-center gap-3 px-4 py-4 transition-colors hover:bg-zinc-50/90 dark:hover:bg-white/[0.04]';

export const dashboardSettingsRowIcon =
  'flex size-9 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-zinc-900 dark:bg-white/[0.06] dark:text-[#3b82f6]';

export const dashboardSettingsRowIconAccent = dashboardSettingsRowIcon;

export const dashboardTileIcon =
  'flex size-10 shrink-0 items-center justify-center rounded-xl border border-zinc-200 bg-zinc-100 text-zinc-900 dark:border-0 dark:bg-white/[0.05] dark:text-[#3b82f6]';

export const dashboardTileIconAccent = dashboardTileIcon;

export const dashboardAvatarFrame =
  'relative shrink-0 overflow-hidden rounded-full bg-zinc-100 ring-0 dark:bg-white/[0.06]';

export const dashboardAvatarSm = 'size-12';
export const dashboardAvatarMd = 'size-14 sm:size-16';

export const dashboardBtnPrimary =
  'inline-flex min-h-11 items-center justify-center rounded-[20px] border-0 bg-[#3b82f6] px-4 py-2.5 text-sm font-medium text-white transition-all hover:bg-blue-500 active:scale-[0.98] disabled:opacity-50';

export const dashboardBtnAccent = dashboardBtnPrimary;

export const dashboardBtnSecondary =
  'inline-flex min-h-11 items-center justify-center rounded-[20px] border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-900 transition-all hover:bg-zinc-50 active:scale-[0.98] dark:border-0 dark:bg-white/[0.05] dark:text-white dark:hover:bg-white/[0.08]';

export const dashboardBtnDanger =
  'inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-[20px] border-0 bg-black px-4 py-2.5 text-sm font-medium text-[#ef4444] transition-all hover:bg-white/[0.04] active:scale-[0.98]';

export const dashboardStickyActionBar =
  'shrink-0 border-0 bg-white/95 px-4 pt-3 backdrop-blur-md dark:bg-black/90 pb-[max(12px,env(safe-area-inset-bottom,0px))]';

export const dashboardStatTile =
  'relative flex min-h-[108px] w-full flex-col justify-end overflow-hidden rounded-[20px] border border-zinc-200 bg-white p-4 text-left transition-colors active:scale-[0.98] dark:border-0 dark:bg-black ink-oled-card';

export const dashboardStatIconBadge =
  'absolute right-3 top-3 flex size-8 items-center justify-center rounded-full border-0 bg-zinc-50 text-[#3b82f6] dark:bg-white/[0.06] dark:text-[#3b82f6]';

export const dashboardStatusBadge = {
  new: 'inline-flex items-center rounded-lg px-2.5 py-0.5 text-xs font-semibold bg-zinc-100 text-zinc-700 dark:bg-white/5 dark:text-[#737373]',
  pending:
    'inline-flex items-center rounded-lg px-2.5 py-0.5 text-xs font-semibold bg-amber-50 text-amber-800 dark:bg-amber-500/15 dark:text-amber-400',
  active:
    'inline-flex items-center rounded-lg px-2.5 py-0.5 text-xs font-semibold bg-blue-50 text-blue-800 dark:bg-[#3b82f6]/15 dark:text-[#3b82f6]',
  neutral:
    'inline-flex items-center rounded-lg px-2.5 py-0.5 text-xs font-semibold bg-zinc-100 text-zinc-600 dark:bg-white/5 dark:text-[#737373]',
  danger:
    'inline-flex items-center rounded-lg px-2.5 py-0.5 text-xs font-semibold bg-rose-50 text-rose-800 dark:bg-[#ef4444]/15 dark:text-[#ef4444]',
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

export const dashboardPageHeader = 'type-heading';

export const dashboardPageSubtitle = cn('type-subtitle mt-1.5 max-w-2xl');

export const dashboardBodyText = 'type-body';

export const dashboardCaptionText = 'type-caption';

export const dashboardSectionHeading = 'type-heading-sm';

export const dashboardSectionTitle =
  'text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-400 dark:text-[#737373]';

export const dashboardIconMuted = 'size-4 shrink-0 text-zinc-500 dark:text-[#737373]';

export const dashboardIconStrong = 'size-4 shrink-0 text-zinc-900 dark:text-white';

export const dashboardIconButton =
  'inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-xl border-0 bg-white text-[#3b82f6] transition-all hover:bg-zinc-50 active:scale-[0.98] dark:bg-white/[0.05] dark:text-[#3b82f6] dark:hover:bg-white/[0.08]';

export const dashboardCardSurface = dashboardCard;

export { inkOledStack };
