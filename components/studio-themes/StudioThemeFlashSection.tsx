import React from 'react';
import { Clock, Sparkles } from 'lucide-react';
import type { FlashItem } from '../../types/studio-theme';

type FlashVariant = 'classic' | 'split' | 'vintage';

const VARIANT = {
  classic: {
    section: 'mb-12',
    headerRow: 'text-neutral-500',
    title: 'text-lg font-semibold text-white',
    subtitle: 'text-xs text-neutral-500 sm:text-sm max-w-xl',
    grid: 'grid grid-cols-2 md:grid-cols-3 gap-4',
    card: 'group block rounded-2xl overflow-hidden bg-neutral-900/80 border border-neutral-800 shadow-sm transition-all hover:shadow-lg hover:border-violet-500/40 hover:-translate-y-0.5 active:scale-[0.98]',
    imageWrap: 'aspect-[4/5] sm:aspect-square bg-neutral-950',
    img: 'w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]',
    body: 'p-3 sm:p-4 space-y-1.5',
    itemTitle: 'font-semibold text-sm text-white leading-snug line-clamp-2 min-h-[2.5rem]',
    meta: 'flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-neutral-400',
    price: 'text-sm font-semibold text-violet-400 tabular-nums',
    badgeOn: 'inline-flex items-center rounded-full bg-emerald-500/15 text-emerald-400 px-2 py-0.5 font-medium',
    badgeOff: 'inline-flex items-center rounded-full bg-neutral-700/80 text-neutral-300 px-2 py-0.5 font-medium',
    styleTag: 'text-neutral-500 truncate max-w-[8rem]',
  },
  split: {
    section: 'mb-12',
    headerRow: 'text-neutral-500',
    title: 'text-xl font-semibold text-white',
    subtitle: 'text-sm text-neutral-500 max-w-xl mb-6',
    grid: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5',
    card: 'group block rounded-2xl overflow-hidden bg-neutral-900/90 border border-neutral-800 shadow-sm transition-all hover:shadow-md hover:border-violet-500/35 active:scale-[0.98]',
    imageWrap: 'aspect-[4/5] sm:aspect-square bg-neutral-950',
    img: 'w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]',
    body: 'p-4 space-y-2',
    itemTitle: 'font-semibold text-sm text-white leading-snug line-clamp-2 min-h-[2.5rem]',
    meta: 'flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-neutral-400',
    price: 'text-sm font-semibold text-violet-400 tabular-nums',
    badgeOn: 'inline-flex items-center rounded-full bg-emerald-500/15 text-emerald-400 px-2 py-0.5 font-medium',
    badgeOff: 'inline-flex items-center rounded-full bg-neutral-700/80 text-neutral-300 px-2 py-0.5 font-medium',
    styleTag: 'text-neutral-500 truncate max-w-[9rem]',
  },
  vintage: {
    section: 'mb-16',
    headerRow: 'text-stone-500',
    title: 'font-serif text-3xl font-normal tracking-wide text-amber-950',
    subtitle: 'text-sm text-stone-600 max-w-xl mb-8',
    grid: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8',
    card: 'group block bg-white border border-stone-300 shadow-sm overflow-hidden hover:shadow-md transition-shadow active:scale-[0.99]',
    imageWrap: 'aspect-[4/5] sm:aspect-square bg-stone-100',
    img: 'w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]',
    body: 'p-4 space-y-2 border-t border-stone-200',
    itemTitle: 'font-medium text-amber-950 leading-snug line-clamp-2 min-h-[2.75rem]',
    meta: 'flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-stone-600',
    price: 'text-sm font-semibold text-amber-900 tabular-nums',
    badgeOn: 'inline-flex items-center rounded-sm bg-emerald-100 text-emerald-900 px-2 py-0.5 font-medium',
    badgeOff: 'inline-flex items-center rounded-sm bg-stone-200 text-stone-700 px-2 py-0.5 font-medium',
    styleTag: 'text-stone-500 truncate max-w-[8rem]',
  },
} as const;

export interface StudioThemeFlashSectionProps {
  items: FlashItem[];
  bookingUrl: string;
  variant: FlashVariant;
}

/**
 * Grille flash partagée entre les thèmes structurels (meilleure lisibilité mobile + méta durée / dispo).
 */
export const StudioThemeFlashSection: React.FC<StudioThemeFlashSectionProps> = ({ items, bookingUrl, variant }) => {
  if (items.length === 0) return null;
  const c = VARIANT[variant];

  return (
    <section className={c.section} aria-labelledby={`flash-heading-${variant}`}>
      <div className="mb-6 sm:mb-8 flex flex-col gap-1.5">
        <div className={`flex items-center gap-2 ${c.headerRow}`}>
          <Sparkles className="w-4 h-4 shrink-0 opacity-80" strokeWidth={1.75} aria-hidden />
          <h2 id={`flash-heading-${variant}`} className={c.title}>
            Flashs disponibles
          </h2>
        </div>
        <p className={c.subtitle}>
          {items.length} design{items.length > 1 ? 's' : ''} — Cliquez pour réserver avec acompte en ligne.
        </p>
      </div>
      <div className={c.grid}>
        {items.map((item) => (
          <a
            key={item.id}
            href={`${bookingUrl}?flash=${encodeURIComponent(item.id)}`}
            className={c.card}
          >
            <div className={c.imageWrap}>
              <img
                src={item.imageUrl}
                alt=""
                loading="lazy"
                decoding="async"
                className={c.img}
              />
            </div>
            <div className={c.body}>
              <p className={c.itemTitle}>{item.title ?? 'Flash'}</p>
              <div className={c.meta}>
                <span className={item.isAvailable ? c.badgeOn : c.badgeOff}>
                  {item.isAvailable ? 'Disponible' : 'Indisponible'}
                </span>
                {item.duration != null && item.duration > 0 && (
                  <span className="inline-flex items-center gap-1 tabular-nums">
                    <Clock className="w-3.5 h-3.5 shrink-0 opacity-70" aria-hidden />
                    {item.duration} min
                  </span>
                )}
                {item.style ? <span className={c.styleTag}>{item.style}</span> : null}
              </div>
              {item.price != null && (
                <p className={c.price}>{item.price}€</p>
              )}
            </div>
          </a>
        ))}
      </div>
    </section>
  );
};
