import { useMemo } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { BarChart3, Loader2, Sparkles } from 'lucide-react';
import { LANDING_PRICING_URL } from '@/lib/urls';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { glassPanel, microHover, subscriptionPill } from './bentoStyles';

export interface BentoHeroCardProps {
  firstName?: string;
  studioSubscriptionStatus?: string | null;
  trialBannerMessage?: string | null;
  onOpenBilling?: () => void;
  className?: string;
  /** Pleine immersion mobile — date locale affichée en en-tête */
  referenceDate?: Date | null;
  /** Image vitrine ou couverture (full-bleed mobile) */
  headerBackgroundUrl?: string | null;
  /** Texte sous la salutation (ex. période CRM) */
  heroSubtitle?: string;
  heroTips?: string[];
  heroTipIndex?: number;
  onOpenFinance?: () => void;
  userAvatarUrl?: string | null;
  avatarUploading?: boolean;
  onAvatarPress?: () => void;
}

export function BentoHeroCard({
  firstName,
  studioSubscriptionStatus,
  trialBannerMessage,
  onOpenBilling,
  className = '',
  referenceDate,
  headerBackgroundUrl = null,
  heroSubtitle = '',
  heroTips = [],
  heroTipIndex = 0,
  onOpenFinance,
  userAvatarUrl = null,
  avatarUploading = false,
  onAvatarPress,
}: BentoHeroCardProps) {
  const reduceMotion = useReducedMotion();
  const prefersReducedMotion = Boolean(reduceMotion);

  const greetingWord = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return 'Bonjour';
    if (h < 18) return 'Bon après-midi';
    return 'Bonsoir';
  }, []);

  const motionProps = reduceMotion
    ? {}
    : {
        initial: { opacity: 0, y: 8 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] as const },
      };

  const sub = subscriptionPill(studioSubscriptionStatus);

  const displayName = firstName?.trim() || 'toi';

  const showMobileImmersive = Boolean(referenceDate != null && onOpenFinance);

  const dateCaption = referenceDate
    ? referenceDate
        .toLocaleDateString('fr-FR', {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
        })
        .toUpperCase()
    : '';

  const tipText = heroTips.length > 0 ? heroTips[heroTipIndex % heroTips.length] : '';

  const desktopStack = (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
          Accueil studio
        </p>
        <h2
          id="bento-hero-title"
          className="font-display mt-2 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-3xl"
        >
          {greetingWord}, <span className="text-zinc-700 dark:text-zinc-200">{displayName}</span>
        </h2>
        <p className="mt-1.5 max-w-2xl text-sm text-zinc-500 dark:text-zinc-400 sm:text-base">
          Pilotage du jour : créneaux, acomptes et file d’attente — sans requêtes en double.
        </p>
        {trialBannerMessage ? (
          <p className="mt-3 flex items-start gap-2 text-sm font-medium text-zinc-800 dark:text-zinc-200">
            <Sparkles
              className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400"
              aria-hidden
            />
            <span>{trialBannerMessage}</span>
          </p>
        ) : null}
      </div>
      <div className="flex shrink-0 flex-col items-stretch gap-2 sm:items-end">
        <span
          className={`inline-flex w-fit rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wide ${sub.className}`}
        >
          {sub.label}
        </span>
        <div className="flex flex-wrap gap-2 sm:justify-end">
          <Button
            asChild
            variant="outline"
            size="sm"
            className={`min-h-11 rounded-xl ${microHover}`}
          >
            <a href={LANDING_PRICING_URL} target="_blank" rel="noopener noreferrer">
              Formules
            </a>
          </Button>
          {onOpenBilling ? (
            <Button
              type="button"
              size="sm"
              className={`min-h-11 rounded-xl ${microHover}`}
              onClick={onOpenBilling}
            >
              Facturation
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );

  return (
    <motion.header {...motionProps} className={cn('w-full', className)}>
      {showMobileImmersive ? (
        <>
          <div className="relative isolate w-full overflow-hidden rounded-b-[2.5rem] pb-6 md:hidden">
            {headerBackgroundUrl ? (
              <img
                src={headerBackgroundUrl}
                alt=""
                loading="lazy"
                decoding="async"
                className="pointer-events-none absolute inset-0 z-0 size-full object-cover object-[center_24%]"
              />
            ) : (
              <div className="pointer-events-none absolute inset-0 z-0 bg-zinc-950" aria-hidden />
            )}
            <div className="pointer-events-none absolute inset-0 z-[1] bg-black/35" aria-hidden />

            <div className="relative z-[2] mb-2 px-5 pt-[max(3rem,env(safe-area-inset-top,0px))]">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-400">
                    {dateCaption}
                  </p>
                  <h1
                    id="dashboard-overview-mobile-title"
                    className="font-display text-xl font-bold leading-tight tracking-tight text-white"
                  >
                    {firstName?.trim()
                      ? `${greetingWord} ${firstName.trim()} 👋`
                      : `${greetingWord} 👋`}
                  </h1>
                  <p className="mt-1 text-sm leading-snug text-zinc-300">{heroSubtitle}</p>
                </div>
                <div className="flex shrink-0 flex-row items-center gap-1.5">
                  <motion.button
                    type="button"
                    onClick={onOpenFinance}
                    whileTap={prefersReducedMotion ? undefined : { scale: 0.96 }}
                    className="flex size-10 items-center justify-center rounded-xl border border-white/10 bg-zinc-900/30 text-blue-400 backdrop-blur-md transition-all active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50"
                    aria-label="Finance"
                  >
                    <BarChart3 className="size-5 shrink-0" strokeWidth={2} aria-hidden />
                  </motion.button>
                  <motion.button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onAvatarPress?.();
                    }}
                    disabled={avatarUploading || !onAvatarPress}
                    whileTap={prefersReducedMotion ? undefined : { scale: 0.96 }}
                    className={cn(
                      'relative flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-zinc-900/30 backdrop-blur-md transition-all touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/25 active:scale-[0.98]',
                      !onAvatarPress && 'opacity-80'
                    )}
                    aria-label="Profil"
                  >
                    {userAvatarUrl ? (
                      <img src={userAvatarUrl} alt="" className="size-full object-cover" />
                    ) : (
                      <span className="flex size-full items-center justify-center bg-zinc-900/60 text-sm font-bold text-white">
                        {firstName ? firstName[0].toUpperCase() : '?'}
                      </span>
                    )}
                    {avatarUploading ? (
                      <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/45">
                        <Loader2 className="size-4 animate-spin text-white" aria-hidden />
                      </span>
                    ) : null}
                  </motion.button>
                </div>
              </div>
            </div>

            {heroTips.length > 0 ? (
              <motion.div
                role="status"
                aria-live="polite"
                aria-atomic="true"
                className="relative z-[2] mx-4 mt-4 rounded-2xl border border-white/10 bg-zinc-950/30 p-4 backdrop-blur-md"
              >
                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Conseil du moment
                </p>
                <AnimatePresence mode="wait" initial={false}>
                  <motion.p
                    key={heroTipIndex}
                    className="mt-3 text-sm leading-relaxed text-white/90"
                    initial={prefersReducedMotion ? false : { opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -4 }}
                    transition={{
                      duration: prefersReducedMotion ? 0.12 : 0.28,
                      ease: [0.25, 0.1, 0.25, 1],
                    }}
                  >
                    {tipText}
                  </motion.p>
                </AnimatePresence>
              </motion.div>
            ) : null}
          </div>

          <div className={cn('hidden md:block', glassPanel, 'p-4 sm:p-6')}>{desktopStack}</div>
        </>
      ) : (
        <div className={cn(glassPanel, 'p-4 sm:p-6')}>{desktopStack}</div>
      )}
    </motion.header>
  );
}
