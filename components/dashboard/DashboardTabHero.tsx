import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { AlertCircle, Calendar, CalendarCheck, Home, Inbox } from 'lucide-react';
import { cn } from '@/lib/utils';

/** Métadonnées « Vue d’ensemble » (md+) : salutation + compteurs intégrés au bandeau, à côté des conseils animés. */
export interface DashboardOverviewHeroMeta {
  dateLabel: string;
  greeting: string;
  firstName: string;
  todayOrTomorrowCount: number;
  unpaidCount: number;
  todayRdvCount: number;
  pendingDemandesCount: number;
  studioName: string | null;
  onOpenAgenda: () => void;
  onOpenRequests: () => void;
}

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
  /** Quand fourni, affiche la date, la salutation et des pastilles d’activité + grille conseils (gauche) / stats (droite, lg+). */
  overviewMeta?: DashboardOverviewHeroMeta | null;
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
  overviewMeta = null,
}: DashboardTabHeroProps) {
  const hasCover = Boolean(coverImageUrl?.trim());
  const reduceMotion = useReducedMotion();
  const showOverviewMeta = Boolean(overviewMeta);
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
        'relative overflow-hidden rounded-2xl border border-zinc-200/80 dark:border-zinc-800 lg:rounded-3xl dashboard-pro-ios-hero-card',
        showOverviewMeta ? 'mb-3 sm:mb-4 md:mb-4 lg:mb-5' : 'mb-4 sm:mb-5 md:mb-6 lg:mb-7',
        hasCover &&
          (showOverviewMeta
            ? 'min-h-[9.25rem] sm:min-h-[9.75rem] md:min-h-[10rem] lg:min-h-[9.75rem] xl:min-h-[10.25rem]'
            : 'min-h-[8.5rem] sm:min-h-[9rem] md:min-h-[9.5rem] lg:min-h-[10rem] xl:min-h-[10.5rem]'),
        !hasCover &&
          (showOverviewMeta
            ? 'min-h-0 bg-white/90 dark:bg-zinc-900/75 py-0 md:min-h-0'
            : 'min-h-0 bg-white/90 dark:bg-zinc-900/75 md:min-h-[5.5rem] lg:min-h-24'),
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
            className="pointer-events-none absolute -right-4 bottom-0 size-24 rounded-full bg-blue-500/15 blur-2xl dark:bg-blue-500/10"
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
          'relative z-10 flex min-h-0 flex-col justify-center',
          showOverviewMeta
            ? 'px-3.5 py-2.5 sm:px-4 sm:py-3 md:px-5 md:py-3 lg:px-6 lg:py-3 xl:px-6 xl:py-3'
            : 'px-4 py-3.5 sm:px-5 sm:py-4 md:px-6 md:py-4 lg:px-7 lg:py-4 xl:px-8 xl:py-4',
          hasCover && 'min-h-[inherit] text-white'
        )}
      >
        <h1
          id="dashboard-tab-hero-title"
          className={cn(
            'max-w-4xl font-display font-bold leading-[1.12] tracking-[-0.03em]',
            showOverviewMeta
              ? 'text-[clamp(1.05rem,1.1vw+0.5rem,1.4rem)] md:leading-tight md:text-[clamp(1.08rem,0.95vw+0.55rem,1.45rem)] lg:text-[clamp(1.1rem,0.85vw+0.5rem,1.5rem)]'
              : 'text-[clamp(1.2rem,1.4vw+0.65rem,1.875rem)] md:leading-tight md:text-[clamp(1.2rem,1.1vw+0.9rem,1.75rem)] lg:text-[clamp(1.25rem,1vw+0.85rem,1.875rem)]',
            hasCover
              ? 'text-white [text-shadow:0_2px_14px_rgba(0,0,0,0.4),0_1px_2px_rgba(0,0,0,0.25)]'
              : 'text-zinc-900 dark:text-white'
          )}
        >
          {title}
        </h1>
        {showOverviewMeta && overviewMeta ? (
          <>
            <p
              className={cn(
                'mt-1 text-[11px] font-medium capitalize leading-none tracking-wide first-letter:uppercase sm:text-xs',
                hasCover
                  ? 'text-white/80 [text-shadow:0_1px_2px_rgba(0,0,0,0.45)]'
                  : 'text-zinc-500 dark:text-zinc-400'
              )}
            >
              {overviewMeta.dateLabel}
            </p>
            <p
              className={cn(
                'mt-1 max-w-3xl font-display text-[1.2rem] font-bold leading-tight tracking-[-0.04em] sm:text-[1.28rem] md:text-[1.32rem] lg:text-[1.38rem]',
                hasCover
                  ? 'text-white [text-shadow:0_2px_10px_rgba(0,0,0,0.45),0_1px_1px_rgba(0,0,0,0.3)]'
                  : 'text-zinc-900 dark:text-white'
              )}
            >
              {overviewMeta.greeting}
              {overviewMeta.firstName ? `, ${overviewMeta.firstName}` : ''}
            </p>
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5 sm:mt-1.5">
              {overviewMeta.unpaidCount > 0 && (
                <button
                  type="button"
                  onClick={overviewMeta.onOpenRequests}
                  className={cn(
                    'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 transition-all active:scale-[0.98] sm:gap-1.5 sm:px-2.5 sm:py-1 sm:text-xs',
                    hasCover
                      ? 'bg-amber-500/15 text-amber-50 ring-amber-300/30 hover:bg-amber-500/25'
                      : 'bg-amber-50/90 text-amber-900/85 ring-amber-100/90 hover:bg-amber-50 dark:bg-amber-500/10 dark:text-amber-100/90 dark:ring-amber-500/20'
                  )}
                >
                  <AlertCircle className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" strokeWidth={1.75} />
                  {overviewMeta.unpaidCount} sans acompte
                </button>
              )}
              {overviewMeta.todayOrTomorrowCount > 0 && (
                <button
                  type="button"
                  onClick={overviewMeta.onOpenAgenda}
                  className={cn(
                    'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 transition-all active:scale-[0.98] sm:gap-1.5 sm:px-2.5 sm:py-1 sm:text-xs',
                    hasCover
                      ? 'bg-white/10 text-zinc-100 ring-white/20 hover:bg-white/15'
                      : 'bg-zinc-100/90 text-zinc-600 ring-zinc-200/80 hover:bg-zinc-100 dark:bg-zinc-800/70 dark:text-zinc-300 dark:ring-zinc-700/60'
                  )}
                >
                  <CalendarCheck
                    className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4"
                    strokeWidth={1.75}
                  />
                  {overviewMeta.todayOrTomorrowCount} RDV bientôt
                </button>
              )}
            </div>
            {useRotating ? (
              <div
                className="mt-2 grid w-full min-w-0 grid-cols-1 items-start gap-2 sm:mt-2.5 lg:grid-cols-12 lg:gap-3 xl:gap-3.5"
                role="status"
                aria-label="Aperçu d’activité"
              >
                <div
                  className={cn(
                    'relative min-h-[2.75rem] min-w-0 sm:min-h-[2.9rem] md:min-h-[2.9rem]',
                    'lg:col-span-7',
                    hasCover ? 'text-white/90' : 'text-zinc-600 dark:text-zinc-300'
                  )}
                  aria-live="polite"
                  aria-atomic="true"
                >
                  <p
                    className={cn(
                      'mb-0.5 text-[9px] font-semibold uppercase tracking-wider',
                      hasCover ? 'text-white/50' : 'text-zinc-400 dark:text-zinc-500'
                    )}
                  >
                    Conseil du moment
                  </p>
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.p
                      key={tipIndex}
                      id="dashboard-tab-hero-description"
                      className={cn(
                        'm-0 text-pretty text-[13px] leading-snug sm:text-sm md:text-[0.9rem] md:leading-[1.45]',
                        'lg:text-[0.9rem] lg:leading-[1.45]',
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
                <div className="flex min-w-0 flex-col gap-1.5 lg:col-span-5">
                  {overviewMeta.studioName ? (
                    <span
                      className={cn(
                        'inline-flex w-fit min-w-0 max-w-md items-center gap-1.5 self-start rounded-lg border px-2 py-1 text-left text-[11px] font-medium sm:text-xs',
                        hasCover
                          ? 'border-sky-300/50 bg-sky-500/20 text-sky-50 shadow-[0_0_0_1px_rgba(14,165,233,0.12)]'
                          : 'border-blue-200/90 bg-blue-50/95 text-blue-900 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-200'
                      )}
                    >
                      <Home
                        className={cn(
                          'h-3.5 w-3.5 shrink-0',
                          hasCover ? 'text-sky-200' : 'text-blue-600 dark:text-blue-400'
                        )}
                        strokeWidth={2}
                      />
                      <span className="min-w-0 truncate">{overviewMeta.studioName}</span>
                    </span>
                  ) : null}
                  <div className="flex flex-col gap-1.5 min-[400px]:flex-row min-[400px]:flex-wrap min-[400px]:items-center">
                    <button
                      type="button"
                      onClick={overviewMeta.onOpenAgenda}
                      className={cn(
                        'inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-2 py-1 text-[11px] font-medium transition-all active:scale-[0.98] min-[400px]:min-w-0 min-[400px]:flex-1 sm:flex-initial sm:text-xs',
                        hasCover
                          ? 'border-emerald-300/50 bg-emerald-500/20 text-emerald-50 shadow-[0_0_0_1px_rgba(16,185,129,0.15)] hover:bg-emerald-500/30'
                          : 'border-emerald-200/90 bg-emerald-50 text-emerald-900 hover:border-emerald-300 hover:bg-emerald-100/90 dark:border-emerald-500/35 dark:bg-emerald-500/10 dark:text-emerald-200 dark:hover:bg-emerald-500/20'
                      )}
                    >
                      <Calendar
                        className={cn(
                          'h-3.5 w-3.5 shrink-0',
                          hasCover ? 'text-emerald-200' : 'text-emerald-600 dark:text-emerald-400'
                        )}
                        strokeWidth={2}
                      />
                      <span className="tabular-nums">
                        {overviewMeta.todayRdvCount} RDV aujourd’hui
                      </span>
                    </button>
                    {overviewMeta.pendingDemandesCount > 0 && (
                      <button
                        type="button"
                        onClick={overviewMeta.onOpenRequests}
                        className={cn(
                          'inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-2 py-1 text-[11px] font-semibold transition-all active:scale-[0.98] min-[400px]:min-w-0 min-[400px]:flex-1 sm:flex-initial sm:text-xs',
                          hasCover
                            ? 'border-amber-300/50 bg-amber-500/15 text-amber-50 hover:bg-amber-500/25'
                            : 'border-amber-200/80 bg-amber-50/95 text-amber-900 hover:bg-amber-100/90 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200 dark:hover:bg-amber-500/20'
                        )}
                      >
                        <Inbox className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
                        {overviewMeta.pendingDemandesCount} demande
                        {overviewMeta.pendingDemandesCount > 1 ? 's' : ''} en attente
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ) : null}
            {!useRotating && (
              <p
                id="dashboard-tab-hero-description"
                className={cn(
                  'mt-2 max-w-2xl text-pretty text-sm leading-snug sm:text-[15px] md:max-w-3xl md:text-[0.9375rem] md:leading-normal',
                  'lg:max-w-[44rem] lg:text-[0.95rem] lg:leading-normal',
                  hasCover ? 'text-white/90' : 'text-zinc-600 dark:text-zinc-300'
                )}
              >
                {description}
              </p>
            )}
          </>
        ) : useRotating ? (
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
