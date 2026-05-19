import { useMemo } from 'react';
import { CalendarClock, CreditCard, Inbox, ArrowUpRight, Sparkles } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';

/** Créneau du jour — alimenté par `inkflow_appointments` + mapping */
export interface TodaySlot {
  id: string;
  start: string;
  end: string;
  title: string;
  clientName: string;
  status: 'confirmé' | 'provisoire' | 'en_attente';
}

/**
 * Encaissement Stripe — montant **toujours en centimes** côté UI.
 * (`inkflow_payments.amount` est en euros décimaux → conversion dans le hook.)
 */
export interface StripeDeposit {
  id: string;
  amountCents: number;
  currency: string;
  clientLabel: string;
  receivedAt: string;
  status: 'réussi' | 'en_cours' | 'remboursé';
}

export interface BookingRequest {
  id: string;
  clientName: string;
  motif: string;
  createdAt: string;
  urgency: 'bas' | 'normal' | 'haut';
  source: 'project' | 'booking';
}

export interface ArtistBentoOverviewProps {
  artistName?: string;
  /** `false` quand intégré sous un hero qui affiche déjà la salutation (ex. vue d’ensemble) */
  showGreeting?: boolean;
  todaySlots: TodaySlot[];
  stripeDeposits: StripeDeposit[];
  bookingRequests: BookingRequest[];
  className?: string;
  onOpenFinance?: () => void;
  onOpenAgenda?: () => void;
  onOpenRequests?: () => void;
}

function formatTimeRange(startIso: string, endIso: string): string {
  const start = new Date(startIso);
  const end = new Date(endIso);
  const opt: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit' };
  return `${start.toLocaleTimeString('fr-FR', opt)}–${end.toLocaleTimeString('fr-FR', opt)}`;
}

function formatMoney(amountCents: number, currency: string): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: currency.toUpperCase(),
    maximumFractionDigits: 2,
  }).format(amountCents / 100);
}

function formatRelativeShort(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString('fr-FR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const glassPanel =
  'rounded-2xl border border-zinc-200/70 bg-white/55 shadow-sm backdrop-blur-xl dark:border-zinc-800/80 dark:bg-zinc-950/40';

const microHover = 'transition-all duration-200 active:scale-[0.98]';

function statusChip(
  kind: 'slot' | 'pay' | 'req',
  value: string
): { label: string; className: string } {
  if (kind === 'slot') {
    if (value === 'confirmé')
      return {
        label: 'Confirmé',
        className:
          'bg-emerald-500/15 text-emerald-700 ring-1 ring-emerald-500/25 dark:text-emerald-300',
      };
    if (value === 'provisoire')
      return {
        label: 'Provisoire',
        className: 'bg-amber-500/15 text-amber-800 ring-1 ring-amber-500/20 dark:text-amber-200',
      };
    return {
      label: 'En attente',
      className: 'bg-zinc-500/10 text-zinc-600 ring-1 ring-zinc-500/15 dark:text-zinc-400',
    };
  }
  if (kind === 'pay') {
    if (value === 'réussi')
      return {
        label: 'Reçu',
        className:
          'bg-emerald-500/15 text-emerald-700 ring-1 ring-emerald-500/25 dark:text-emerald-300',
      };
    if (value === 'remboursé')
      return {
        label: 'Remboursé',
        className: 'bg-zinc-500/10 text-zinc-500 ring-1 ring-zinc-500/15',
      };
    return {
      label: 'Traitement',
      className: 'bg-sky-500/10 text-sky-700 ring-1 ring-sky-500/20 dark:text-sky-300',
    };
  }
  if (value === 'haut')
    return {
      label: 'Prioritaire',
      className: 'bg-rose-500/15 text-rose-700 ring-1 ring-rose-500/25 dark:text-rose-300',
    };
  if (value === 'bas')
    return {
      label: 'Calme',
      className: 'bg-zinc-500/10 text-zinc-500 ring-1 ring-zinc-500/15 dark:text-zinc-400',
    };
  return {
    label: 'Standard',
    className: 'bg-blue-500/10 text-blue-700 ring-1 ring-blue-500/20 dark:text-blue-300',
  };
}

export function ArtistBentoOverview({
  artistName,
  showGreeting = true,
  todaySlots,
  stripeDeposits,
  bookingRequests,
  className,
  onOpenFinance,
  onOpenAgenda,
  onOpenRequests,
}: ArtistBentoOverviewProps) {
  const reduceMotion = useReducedMotion();

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return 'Bonjour';
    if (h < 18) return 'Bon après-midi';
    return 'Bonsoir';
  }, []);

  const itemMotion = reduceMotion
    ? {}
    : {
        initial: { opacity: 0, y: 10 },
        animate: { opacity: 1, y: 0 },
        transition: { type: 'spring' as const, stiffness: 380, damping: 32 },
      };

  const containerMotion = reduceMotion
    ? {}
    : {
        initial: { opacity: 0, y: 6 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] as const },
      };

  const sortedSlots = [...todaySlots].sort(
    (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()
  );
  const sortedDeposits = [...stripeDeposits].sort(
    (a, b) => new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime()
  );
  const sortedRequests = [...bookingRequests].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const sectionHeadingId = showGreeting ? 'artist-bento-title' : 'artist-bento-pilotage';

  return (
    <motion.section
      {...containerMotion}
      className={['w-full', className].filter(Boolean).join(' ')}
      aria-labelledby={sectionHeadingId}
    >
      {showGreeting ? (
        <header className="mb-6 sm:mb-8">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
            Aujourd’hui
          </p>
          <h1
            id={sectionHeadingId}
            className="font-display text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-3xl"
          >
            {greeting}
            {artistName ? (
              <>
                , <span className="text-zinc-700 dark:text-zinc-200">{artistName}</span>
              </>
            ) : null}
          </h1>
          <p className="mt-1.5 max-w-2xl text-sm text-zinc-500 dark:text-zinc-400 sm:text-base">
            Planning compressé, encaissements et nouvelles demandes — tout ce qui fait tourner ta
            séance sans friction.
          </p>
        </header>
      ) : (
        <h2 id={sectionHeadingId} className="sr-only">
          Planning du jour, dépôts Stripe et demandes entrantes
        </h2>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-12 md:grid-rows-[minmax(0,1fr)_minmax(0,1fr)] md:gap-5">
        <motion.article
          {...itemMotion}
          transition={reduceMotion ? undefined : { ...itemMotion.transition, delay: 0.04 }}
          className={[
            glassPanel,
            'md:col-span-7 md:row-span-2',
            'flex min-h-[280px] flex-col p-4 sm:p-6',
          ].join(' ')}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-zinc-900/90 text-white shadow-sm dark:bg-white dark:text-zinc-900">
                <CalendarClock className="h-5 w-5" aria-hidden />
              </span>
              <div>
                <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  Planning du jour
                </h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {new Date().toLocaleDateString('fr-FR', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                  })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {onOpenAgenda ? (
                <button
                  type="button"
                  onClick={onOpenAgenda}
                  className={[
                    microHover,
                    'inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-zinc-200/80 bg-white/60 p-2 text-xs font-medium text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900/50 dark:text-zinc-200',
                  ].join(' ')}
                  aria-label="Ouvrir l’agenda"
                >
                  <ArrowUpRight className="h-4 w-4" aria-hidden />
                </button>
              ) : null}
              <span className="rounded-full bg-zinc-100/80 px-3 py-1 text-xs font-medium text-zinc-600 ring-1 ring-zinc-200/80 dark:bg-zinc-800/60 dark:text-zinc-300 dark:ring-zinc-700/80">
                {sortedSlots.length} créneau{sortedSlots.length > 1 ? 'x' : ''}
              </span>
            </div>
          </div>

          <ul className="mt-5 flex flex-1 flex-col gap-2 overflow-y-auto pr-1 sm:gap-3">
            {sortedSlots.length === 0 ? (
              <li className="flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-zinc-200/80 bg-white/40 py-12 text-center dark:border-zinc-700/70 dark:bg-zinc-950/20">
                <Sparkles className="mb-2 h-8 w-8 text-zinc-400 dark:text-zinc-500" />
                <p className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
                  Journée plus légère
                </p>
                <p className="mt-1 max-w-xs text-xs text-zinc-500 dark:text-zinc-400">
                  Ajoute un rendez-vous ou profite pour préparer tes flashs du jour.
                </p>
              </li>
            ) : (
              sortedSlots.map((slot, i) => {
                const chip = statusChip('slot', slot.status);
                return (
                  <motion.li
                    key={slot.id}
                    {...(reduceMotion
                      ? {}
                      : {
                          initial: { opacity: 0, x: -6 },
                          animate: { opacity: 1, x: 0 },
                          transition: { delay: 0.07 + i * 0.04, duration: 0.28 },
                        })}
                    className={[
                      microHover,
                      'group flex cursor-default items-center justify-between gap-3 rounded-xl border border-zinc-200/50 bg-white/50 px-3 py-3 sm:px-4 dark:border-zinc-800/60 dark:bg-zinc-950/35',
                    ].join(' ')}
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                        {slot.title}
                      </p>
                      <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                        {slot.clientName}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1.5">
                      <span className="font-mono text-xs font-medium tabular-nums text-zinc-600 dark:text-zinc-300">
                        {formatTimeRange(slot.start, slot.end)}
                      </span>
                      <span
                        className={[
                          'rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
                          chip.className,
                        ].join(' ')}
                      >
                        {chip.label}
                      </span>
                    </div>
                  </motion.li>
                );
              })
            )}
          </ul>
        </motion.article>

        <motion.article
          {...itemMotion}
          transition={reduceMotion ? undefined : { ...itemMotion.transition, delay: 0.1 }}
          className={[glassPanel, 'md:col-span-5', 'flex flex-col p-4 sm:p-6'].join(' ')}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-linear-to-br from-zinc-900 to-zinc-700 text-white shadow-sm dark:from-white dark:to-zinc-200 dark:text-zinc-900">
                <CreditCard className="h-5 w-5" aria-hidden />
              </span>
              <div>
                <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  Dépôts Stripe
                </h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Derniers encaissements (acomptes / solde)
                </p>
              </div>
            </div>
            {onOpenFinance ? (
              <button
                type="button"
                onClick={onOpenFinance}
                className={[
                  microHover,
                  'inline-flex min-h-[44px] items-center gap-1 rounded-xl border border-zinc-200/80 bg-white/60 px-2.5 py-1.5 text-xs font-medium text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900/50 dark:text-zinc-200',
                ].join(' ')}
              >
                Voir tout
                <ArrowUpRight className="h-3.5 w-3.5 opacity-70" aria-hidden />
              </button>
            ) : null}
          </div>

          <ul className="mt-4 flex flex-col gap-2">
            {sortedDeposits.length === 0 ? (
              <li className="rounded-xl border border-dashed border-zinc-200/80 px-4 py-8 text-center text-xs text-zinc-500 dark:border-zinc-700/70 dark:text-zinc-400">
                Aucun paiement récent dans cette fenêtre.
              </li>
            ) : (
              sortedDeposits.slice(0, 4).map((pay, i) => {
                const chip = statusChip('pay', pay.status);
                return (
                  <motion.li
                    key={pay.id}
                    {...(reduceMotion
                      ? {}
                      : {
                          initial: { opacity: 0, scale: 0.98 },
                          animate: { opacity: 1, scale: 1 },
                          transition: { delay: 0.09 + i * 0.05 },
                        })}
                    className="flex items-center justify-between gap-3 rounded-xl border border-zinc-200/45 bg-linear-to-br from-white/65 to-white/35 px-3 py-2.5 dark:border-zinc-800/55 dark:from-zinc-950/50 dark:to-zinc-950/25"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">
                        {pay.clientLabel}
                      </p>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                        {formatRelativeShort(pay.receivedAt)}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <span className="text-sm font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
                        +{formatMoney(pay.amountCents, pay.currency)}
                      </span>
                      <span
                        className={[
                          'rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
                          chip.className,
                        ].join(' ')}
                      >
                        {chip.label}
                      </span>
                    </div>
                  </motion.li>
                );
              })
            )}
          </ul>
        </motion.article>

        <motion.article
          {...itemMotion}
          transition={reduceMotion ? undefined : { ...itemMotion.transition, delay: 0.14 }}
          className={[glassPanel, 'md:col-span-5', 'flex flex-col p-4 sm:p-6'].join(' ')}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-zinc-200/80 bg-white/70 text-zinc-900 shadow-sm backdrop-blur-md dark:border-zinc-700/80 dark:bg-zinc-900/65 dark:text-zinc-100">
                <Inbox className="h-5 w-5" aria-hidden />
              </span>
              <div>
                <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  Prochaines demandes
                </h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Projets vitrine et réservations entrantes
                </p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {onOpenRequests ? (
                <button
                  type="button"
                  onClick={onOpenRequests}
                  className={[
                    microHover,
                    'inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-zinc-200/80 bg-white/60 dark:border-zinc-700 dark:bg-zinc-900/50',
                  ].join(' ')}
                  aria-label="Ouvrir les demandes"
                >
                  <ArrowUpRight className="h-4 w-4 text-zinc-700 dark:text-zinc-200" aria-hidden />
                </button>
              ) : null}
              <span className="rounded-full bg-amber-500/12 px-2.5 py-1 text-[11px] font-semibold text-amber-800 ring-1 ring-amber-500/20 dark:text-amber-200">
                {sortedRequests.length} en cours
              </span>
            </div>
          </div>

          <ul className="mt-4 flex flex-col gap-2">
            {sortedRequests.length === 0 ? (
              <li className="rounded-xl border border-dashed border-zinc-200/80 px-4 py-8 text-center text-xs text-zinc-500 dark:border-zinc-700/70 dark:text-zinc-400">
                Aucune nouvelle demande — ta vitrine ou ton book dort tranquille.
              </li>
            ) : (
              sortedRequests.slice(0, 5).map((req, i) => {
                const chip = statusChip('req', req.urgency);
                return (
                  <motion.li
                    key={req.id}
                    {...(reduceMotion
                      ? {}
                      : {
                          initial: { opacity: 0, y: 6 },
                          animate: { opacity: 1, y: 0 },
                          transition: { delay: 0.11 + i * 0.04 },
                        })}
                    tabIndex={0}
                    className={[
                      microHover,
                      'rounded-xl border border-zinc-200/50 bg-white/45 px-3 py-2.5 outline-none ring-emerald-500/0 transition-[box-shadow,transform] focus-visible:ring-2 dark:border-zinc-800/55 dark:bg-zinc-950/30',
                    ].join(' ')}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">
                          {req.clientName}
                          {req.source === 'booking' ? (
                            <span className="ml-1.5 text-[10px] font-normal text-zinc-400">
                              · Book
                            </span>
                          ) : null}
                        </p>
                        <p className="line-clamp-2 text-xs text-zinc-500 dark:text-zinc-400">
                          {req.motif}
                        </p>
                      </div>
                      <span
                        className={[
                          'shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
                          chip.className,
                        ].join(' ')}
                      >
                        {chip.label}
                      </span>
                    </div>
                    <p className="mt-1.5 text-[11px] text-zinc-400 dark:text-zinc-500">
                      Reçu {formatRelativeShort(req.createdAt)}
                    </p>
                  </motion.li>
                );
              })
            )}
          </ul>
        </motion.article>
      </div>
    </motion.section>
  );
}
