import React from 'react';
import { Check, Zap } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface FlashCardProps {
  /** Titre du design flash */
  title: string;
  imageUrl?: string | null;
  /** Prix affiché (EUR) */
  price?: number | null;
  /** Durée estimée (minutes), affichée sous le titre si défini */
  durationMinutes?: number | null;
  /** false → carte atténuée + mention « Réservé » */
  available?: boolean;
  /** Sélection (ex. grille de réservation) */
  selected?: boolean;
  onClick?: () => void;
  className?: string;
  /** `default` : palette zinc (dashboard / vitrine SaaS). `booking` : tunnel public (tokens ink-*). */
  variant?: 'default' | 'booking';
}

function formatPriceEUR(n: number | null | undefined): string {
  if (n == null || Number.isNaN(Number(n))) return '—';
  return `${Number(n).toLocaleString('fr-FR')} €`;
}

function formatDuration(min: number | null | undefined): string | null {
  if (min == null || Number.isNaN(Number(min)) || min <= 0) return null;
  return `~${Math.round(Number(min))} min`;
}

/**
 * Carte flash — design system InkFlow (bordures zinc, arrondi 2xl, emerald sélection).
 * Réutilisable grille réservation, vitrine, paramètres.
 */
export const FlashCard: React.FC<FlashCardProps> = ({
  title,
  imageUrl,
  price,
  durationMinutes,
  available = true,
  selected = false,
  onClick,
  className,
  variant = 'default',
}) => {
  const priceLabel = formatPriceEUR(price);
  const durationLabel = formatDuration(durationMinutes);
  const showImage = Boolean(imageUrl?.trim());
  const interactive = Boolean(onClick);

  const baseShell =
    variant === 'booking'
      ? cn(
          'group flex w-full min-w-0 flex-col rounded-2xl border text-left transition-all touch-manipulation shadow-sm',
          selected
            ? 'ring-2 ring-emerald-500 border-emerald-500/80 shadow-md'
            : 'border-ink-border/90 hover:border-ink-accent/50 hover:shadow-md',
          !available && 'opacity-70 pointer-events-none',
        )
      : cn(
          'group flex w-full min-w-0 flex-col rounded-2xl border border-zinc-200 bg-white text-left transition-all touch-manipulation shadow-sm dark:border-zinc-800 dark:bg-zinc-900/50',
          selected
            ? 'ring-2 ring-emerald-500 border-emerald-500/80 shadow-md dark:ring-emerald-500 dark:border-emerald-600/80'
            : 'hover:border-zinc-300 dark:hover:border-zinc-600',
          !available && 'opacity-60',
        );

  const focusRing =
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2 dark:focus-visible:ring-zinc-100';
  const bookingFocus =
    variant === 'booking'
      ? 'focus-visible:ring-offset-ink-bg focus-visible:ring-zinc-900'
      : 'dark:focus-visible:ring-offset-zinc-950';

  const inner = (
    <>
      {showImage ? (
        <div className="relative w-full min-h-[160px] aspect-[3/4] shrink-0 bg-zinc-100 overflow-hidden rounded-2xl dark:bg-zinc-900">
          <img
            src={imageUrl!}
            alt={title || 'Flash'}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.03]"
            loading="lazy"
          />
          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent"
            aria-hidden
          />
          {!available && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
              <span className="rounded-full bg-red-500/90 px-3 py-1 text-xs font-semibold text-white">
                Réservé
              </span>
            </div>
          )}
          {selected && (
            <div
              className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-white shadow-md ring-2 ring-white/90"
              aria-hidden
            >
              <Check className="h-4 w-4" strokeWidth={2.5} />
            </div>
          )}
          <div className="absolute bottom-0 left-0 right-0 p-3 pt-10">
            <p className="text-[13px] font-semibold leading-snug text-white drop-shadow-md line-clamp-2 font-display">
              {title || 'Flash'}
            </p>
            <p className="mt-1 text-base font-bold tabular-nums tracking-tight text-white drop-shadow-md">
              {priceLabel}
            </p>
            {durationLabel && (
              <p className="mt-0.5 text-xs text-white/90 tabular-nums">{durationLabel}</p>
            )}
          </div>
        </div>
      ) : (
        <div className="flex w-full min-w-0 flex-col overflow-hidden rounded-2xl">
          <div
            className={cn(
              'relative flex w-full min-h-[160px] aspect-[3/4] shrink-0 items-center justify-center',
              variant === 'booking'
                ? 'bg-gradient-to-br from-zinc-100 to-zinc-200/80 dark:from-zinc-800 dark:to-zinc-900/80'
                : 'bg-gradient-to-br from-zinc-100 to-zinc-200/80 dark:from-zinc-800 dark:to-zinc-900',
            )}
          >
            <Zap className="h-12 w-12 text-zinc-400 dark:text-zinc-500" strokeWidth={1.25} aria-hidden />
            {selected && (
              <div className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-white shadow-md ring-2 ring-white">
                <Check className="h-4 w-4" strokeWidth={2.5} />
              </div>
            )}
          </div>
          <div
            className={cn(
              'border-t p-3',
              variant === 'booking' ? 'border-ink-border bg-ink-bg/80' : 'border-zinc-200 bg-zinc-50/90 dark:border-zinc-800 dark:bg-zinc-900/80',
            )}
          >
            <p
              className={cn(
                'text-[13px] font-semibold leading-snug line-clamp-2 font-display',
                variant === 'booking' ? 'text-ink-text' : 'text-zinc-900 dark:text-zinc-100',
              )}
            >
              {title || 'Flash'}
            </p>
            <p
              className={cn(
                'mt-1 text-base font-bold tabular-nums',
                variant === 'booking' ? 'text-ink-text' : 'text-zinc-900 dark:text-zinc-100',
              )}
            >
              {priceLabel}
            </p>
            {durationLabel && (
              <p
                className={cn(
                  'mt-1 text-xs tabular-nums',
                  variant === 'booking' ? 'text-ink-muted' : 'text-zinc-500 dark:text-zinc-400',
                )}
              >
                {durationLabel}
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );

  if (interactive) {
    return (
      <button
        type="button"
        aria-pressed={selected}
        aria-label={`${title || 'Flash'}, ${priceLabel}${selected ? ', sélectionné' : ''}`}
        disabled={!available}
        onClick={onClick}
        className={cn(baseShell, focusRing, bookingFocus, 'active:scale-[0.99]', className)}
      >
        {inner}
      </button>
    );
  }

  return (
    <div
      className={cn(baseShell, className)}
      role="group"
      aria-label={title || 'Flash'}
    >
      {inner}
    </div>
  );
};
