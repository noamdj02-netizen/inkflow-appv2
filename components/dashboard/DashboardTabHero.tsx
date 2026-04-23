import React from 'react';
import { cn } from '@/lib/utils';

export interface DashboardTabHeroProps {
  title: string;
  description: string;
  /** Image de couverture vitrine — bandeau visuel léger */
  coverImageUrl?: string | null;
  className?: string;
}

/**
 * Bandeau héros partagé entre les onglets Dashboard Pro (hors vue d’ensemble, qui a son propre hero).
 * Même langage visuel que le hero mobile overview : cartouche, grain optionnel, texte lisible.
 */
export function DashboardTabHero({ title, description, coverImageUrl, className }: DashboardTabHeroProps) {
  const hasCover = Boolean(coverImageUrl?.trim());

  return (
    <section
      className={cn(
        'relative mb-4 overflow-hidden rounded-2xl border border-zinc-200/80 dark:border-zinc-800 sm:mb-5 md:mb-6 dashboard-pro-ios-hero-card',
        !hasCover && 'bg-white/90 dark:bg-zinc-900/75',
        className
      )}
      aria-labelledby="dashboard-tab-hero-title"
    >
      {hasCover && (
        <>
          <div
            className="absolute inset-0 bg-cover bg-center scale-105"
            style={{ backgroundImage: `url(${coverImageUrl})` }}
            aria-hidden
          />
          <div
            className="absolute inset-0 bg-gradient-to-br from-black/55 via-black/40 to-black/70 dark:from-black/65 dark:via-black/50 dark:to-black/80"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -left-6 -top-4 size-[7rem] rounded-full bg-emerald-400/15 blur-3xl dark:bg-emerald-500/12"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -right-4 bottom-0 size-24 rounded-full bg-violet-500/15 blur-2xl dark:bg-violet-500/10"
            aria-hidden
          />
        </>
      )}
      {!hasCover && (
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-br from-zinc-100/90 via-white to-zinc-50/90 dark:from-zinc-900/90 dark:via-zinc-950 dark:to-black/80"
          aria-hidden
        />
      )}
      <div className="dashboard-pro-ios-hero-film pointer-events-none absolute inset-0 z-[1] rounded-2xl opacity-70" aria-hidden />
      <div className={cn('relative z-10 px-4 py-4 sm:px-5 sm:py-5 md:px-6 md:py-5', hasCover && 'text-white')}>
        <h1
          id="dashboard-tab-hero-title"
          className={cn(
            'text-[clamp(1.25rem,4vw,1.85rem)] font-bold tracking-[-0.03em] leading-tight font-display',
            hasCover ? 'text-white [text-shadow:0_2px_12px_rgba(0,0,0,0.35)]' : 'text-zinc-900 dark:text-white'
          )}
        >
          {title}
        </h1>
        <p
          className={cn(
            'mt-1.5 max-w-2xl text-sm sm:text-[15px] leading-snug',
            hasCover ? 'text-white/88' : 'text-zinc-600 dark:text-zinc-400'
          )}
        >
          {description}
        </p>
      </div>
    </section>
  );
}
