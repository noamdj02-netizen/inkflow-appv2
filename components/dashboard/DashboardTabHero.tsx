import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface DashboardTabHeroProps {
  title: string;
  description: string;
  /** Image de couverture vitrine — bandeau visuel léger */
  coverImageUrl?: string | null;
  className?: string;
  /**
   * Si renseigné, remplace le paragraphe statique par une rotation (Vue d’ensemble, md+).
   */
  rotatingTips?: string[];
  /** Intervalle entre deux conseils, en ms (défaut 20s). */
  rotatingIntervalMs?: number;
}

/**
 * Bandeau héros partagé entre les onglets Dashboard Pro.
 * Vue d’ensemble (md+) : `rotatingTips` affiche des conseils qui défilent ; les autres onglets : `description` fixe.
 */
export function DashboardTabHero({
  title,
  description,
  coverImageUrl,
  className,
  rotatingTips,
  rotatingIntervalMs = 20_000,
}: DashboardTabHeroProps) {
  const hasCover = Boolean(coverImageUrl?.trim());
  const reduceMotion = useReducedMotion();
  const tips = useMemo(
    () => rotatingTips?.filter((line): line is string => Boolean(line && line.trim())) ?? [],
    [rotatingTips]
  );
  const useRotating = tips.length > 0;
  const [tipIndex, setTipIndex] = useState(0);

  const interval = reduceMotion
    ? Math.max(rotatingIntervalMs, 60_000)
    : Math.min(Math.max(rotatingIntervalMs, 15_000), 30_000);

  useEffect(() => {
    if (!useRotating) return;
    setTipIndex(0);
  }, [useRotating, rotatingTips, tips.length]);

  useEffect(() => {
    if (!useRotating || tips.length === 0) return;
    const n = tips.length;
    const id = window.setInterval(() => {
      setTipIndex((i) => (i + 1) % n);
    }, interval);
    return () => window.clearInterval(id);
  }, [useRotating, tips.length, interval, rotatingTips]);

  return (
    <section
      className={cn(
        'relative mb-4 overflow-hidden rounded-2xl border border-zinc-200/80 dark:border-zinc-800 sm:mb-5 md:mb-6 lg:mb-7 lg:rounded-3xl dashboard-pro-ios-hero-card',
        hasCover &&
          'min-h-[8.5rem] sm:min-h-[9rem] md:min-h-[9.5rem] lg:min-h-[10rem] xl:min-h-[10.5rem]',
        !hasCover && 'min-h-0 bg-white/90 dark:bg-zinc-900/75 md:min-h-[5.5rem] lg:min-h-24',
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
            className="pointer-events-none absolute -left-6 -top-4 size-[7rem] rounded-full bg-blue-400/15 blur-3xl dark:bg-blue-500/12"
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
      <div
        className="dashboard-pro-ios-hero-film pointer-events-none absolute inset-0 z-[1] rounded-2xl opacity-70 lg:rounded-3xl"
        aria-hidden
      />
      <div
        className={cn(
          'relative z-10 flex min-h-0 flex-col justify-center px-4 py-3.5 sm:px-5 sm:py-4 md:px-6 md:py-4 lg:px-7 lg:py-4 xl:px-8 xl:py-4',
          hasCover && 'min-h-[inherit] text-white'
        )}
      >
        <h1
          id="dashboard-tab-hero-title"
          className={cn(
            'max-w-4xl font-display font-bold leading-[1.12] tracking-[-0.03em]',
            'text-[clamp(1.2rem,1.4vw+0.65rem,1.875rem)]',
            'md:leading-tight md:text-[clamp(1.2rem,1.1vw+0.9rem,1.75rem)]',
            'lg:text-[clamp(1.25rem,1vw+0.85rem,1.875rem)]',
            hasCover
              ? 'text-white [text-shadow:0_2px_14px_rgba(0,0,0,0.4),0_1px_2px_rgba(0,0,0,0.25)]'
              : 'text-zinc-900 dark:text-white'
          )}
        >
          {title}
        </h1>
        {useRotating ? (
          <div
            className={cn(
              'relative mt-1.5 min-h-[3.25rem] max-w-2xl sm:mt-2 md:mt-1.5 md:min-h-16 md:max-w-3xl',
              'lg:mt-2 lg:max-w-[44rem] lg:min-h-[3.5rem]',
              hasCover ? 'text-white/90' : 'text-zinc-600 dark:text-zinc-300'
            )}
            role="status"
            aria-live="polite"
            aria-atomic="true"
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.p
                key={tipIndex}
                id="dashboard-tab-hero-description"
                className={cn(
                  'm-0 max-w-2xl text-pretty text-sm leading-snug sm:text-[15px] md:max-w-3xl md:text-[0.9375rem] md:leading-normal',
                  'lg:max-w-[44rem] lg:text-[0.95rem] lg:leading-normal',
                  hasCover ? 'text-white/90' : 'text-zinc-600 dark:text-zinc-300'
                )}
                initial={reduceMotion ? false : { opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -4 }}
                transition={{
                  duration: reduceMotion ? 0.12 : 0.32,
                  ease: [0.25, 0.1, 0.25, 1],
                }}
              >
                {tips[tipIndex]}
              </motion.p>
            </AnimatePresence>
          </div>
        ) : (
          <p
            id="dashboard-tab-hero-description"
            className={cn(
              'mt-1.5 max-w-2xl text-pretty text-sm leading-snug sm:mt-2 sm:text-[15px] md:mt-1.5 md:max-w-3xl md:text-[0.9375rem] md:leading-normal',
              'lg:mt-2 lg:max-w-[44rem] lg:text-[0.95rem] lg:leading-normal',
              hasCover ? 'text-white/90' : 'text-zinc-600 dark:text-zinc-300'
            )}
          >
            {description}
          </p>
        )}
      </div>
    </section>
  );
}
