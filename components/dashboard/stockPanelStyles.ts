import { cn } from '@/lib/utils';

/** Charte Stock & traçabilité — Premium Minimaliste Noir Luxe */

export const stockPage = cn('space-y-8 max-w-4xl animate-fade-in', 'bg-zinc-50 dark:bg-black');

export const stockCard = cn(
  'rounded-2xl border p-5 sm:p-6 space-y-4',
  'border-zinc-200/80 bg-white dark:border-zinc-800 dark:bg-zinc-950',
  'shadow-sm dark:shadow-[0_0_20px_rgba(255,255,255,0.02)]'
);

export const stockCardTitle = 'font-semibold tracking-tight text-zinc-900 dark:text-zinc-100';

export const stockMuted = 'text-xs text-zinc-500 dark:text-zinc-500';

export const stockInput = cn(
  'rounded-xl border px-3 py-2.5 text-sm transition-colors',
  'border-zinc-200 bg-white text-zinc-900 placeholder:text-zinc-400',
  'dark:border-zinc-800 dark:bg-black dark:text-zinc-100 dark:placeholder:text-zinc-600',
  'focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:focus:ring-zinc-700'
);

export const stockSelect = cn(stockInput, 'min-h-[44px]');

export const btnPrimary = cn(
  'inline-flex items-center justify-center gap-2 min-h-[44px] px-4 rounded-xl text-sm font-semibold',
  'bg-zinc-900 text-white hover:bg-zinc-800',
  'dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200',
  'active:scale-[0.98] transition-all disabled:opacity-45'
);

export const btnSecondary = cn(
  'inline-flex items-center justify-center gap-2 min-h-[44px] px-4 rounded-xl text-sm font-medium',
  'border border-zinc-200 text-zinc-800 hover:bg-zinc-50',
  'dark:border-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-900',
  'active:scale-[0.98] transition-all disabled:opacity-45'
);

export const btnGhost = cn(
  'inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-[11px] font-medium',
  'text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100',
  'dark:text-zinc-400 dark:hover:text-zinc-200 dark:hover:bg-zinc-900',
  'active:scale-[0.98] transition-all'
);

export const pillNavWrap = cn(
  'inline-flex flex-wrap gap-1 rounded-2xl p-1',
  'bg-zinc-100/80 border border-zinc-200/60',
  'dark:bg-zinc-950 dark:border-zinc-800'
);

export function pillNavBtn(active: boolean): string {
  return cn(
    'min-h-[40px] px-4 rounded-xl text-sm font-medium transition-all active:scale-[0.98]',
    active
      ? 'bg-white text-zinc-900 shadow-[0_0_20px_rgba(0,0,0,0.06)] border border-zinc-200/80 dark:bg-zinc-900 dark:text-zinc-100 dark:border-zinc-700 dark:shadow-[0_0_20px_rgba(255,255,255,0.04)]'
      : 'text-zinc-600 border border-transparent dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300'
  );
}

export const badgeOptimal = cn(
  'inline-flex items-center gap-1.5 text-[10px] font-medium tracking-wide',
  'text-zinc-200 bg-white/10 rounded-full px-2 py-0.5'
);

export const badgeDot = 'size-1.5 shrink-0 rounded-full bg-white/80';

export const badgeDelta = 'text-[10px] tabular-nums text-zinc-500 font-mono';

export const listRow = cn(
  'flex items-start justify-between gap-4 py-3',
  'border-b border-zinc-100 last:border-0 dark:border-zinc-900'
);

export const aiTerminal = cn(
  'text-sm text-zinc-600 dark:text-zinc-300 whitespace-pre-wrap font-mono leading-relaxed',
  'rounded-xl border p-4 max-h-64 overflow-y-auto',
  'border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-black'
);

export const scanVideoWrap = (scanning: boolean): string =>
  cn(
    'relative w-full max-w-sm aspect-square overflow-hidden rounded-2xl bg-black',
    scanning && 'ring-1 ring-white/20 shadow-[0_0_24px_rgba(255,255,255,0.06)]'
  );

export const presetChip = (exists: boolean): string =>
  cn(
    'min-h-[40px] px-3 rounded-xl border text-xs font-medium transition-all active:scale-[0.98]',
    exists
      ? 'border-zinc-200 text-zinc-400 cursor-not-allowed bg-zinc-100/50 dark:border-zinc-900 dark:bg-zinc-950/50 dark:text-zinc-600'
      : 'border-zinc-200 text-zinc-700 bg-white hover:border-zinc-300 dark:border-zinc-800 dark:text-zinc-300 dark:bg-black dark:hover:border-zinc-700'
  );
