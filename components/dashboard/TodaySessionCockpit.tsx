import React, { useEffect, useMemo, useRef } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  Check,
  CalendarDays,
  CheckCircle2,
  Clock,
  CreditCard,
  FileSignature,
  HeartPulse,
  Package,
  ReceiptText,
  ShieldCheck,
} from 'lucide-react';
import { Alert, AlertDescription } from '../ui/alert';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import type { Appointment, Client, FlashDesign } from '../../types';
import { appointmentRemainingBalanceEuros } from '../../lib/appointmentBalance';
import {
  appointmentWithResolvedFlashPrice,
  buildPriceSyncUpdates,
  resolveCanonicalFlashPrice,
  stripEmbeddedPriceFromService,
} from '../../lib/flashAppointmentPrice';
import { cn } from '../../lib/utils';

interface TodaySessionCockpitProps {
  today: string;
  appointments: Appointment[];
  /** RDV actif calculé en temps réel (useLiveActiveAppointment). */
  activeAppointment?: Appointment | null;
  clients: Client[];
  flashDesigns?: FlashDesign[];
  stripeConnectReady: boolean;
  onSyncAppointmentPrice?: (appointment: Appointment, updates: Partial<Appointment>) => void;
  onSelectAppointment: (appointment: Appointment) => void;
  onOpenCloseout: (appointment: Appointment) => void;
  onOpenStockTrace: (appointmentId: string, clientId: string | null) => void;
  onOpenAgenda: () => void;
  /** Accueil mobile — chrome aligné maquette (clair, cartes blanches 32px, label indigo). */
  mobileMinimalChrome?: boolean;
}

function formatEuro(value: number): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value);
}

function clientForAppointment(appointment: Appointment, clients: Client[]): Client | null {
  const email = appointment.clientEmail?.trim().toLowerCase();
  return (
    clients.find((client) => {
      const clientEmail = client.email?.trim().toLowerCase();
      return (
        (email && clientEmail === email) ||
        client.id === appointment.clientId ||
        client.name?.trim().toLowerCase() === appointment.clientName?.trim().toLowerCase()
      );
    }) ?? null
  );
}

function statusLabel(status: Appointment['status']): string {
  switch (status) {
    case 'pending':
      return 'À confirmer';
    case 'confirmed':
      return 'Confirmé';
    case 'in_progress':
      return 'En séance';
    case 'completed':
      return 'Terminé';
    case 'cancelled':
      return 'Annulé';
    case 'no_show':
      return 'No-show';
    default:
      return status;
  }
}

export const TodaySessionCockpit: React.FC<TodaySessionCockpitProps> = ({
  today,
  appointments,
  activeAppointment: activeAppointmentProp,
  clients,
  flashDesigns = [],
  stripeConnectReady,
  onSyncAppointmentPrice,
  onSelectAppointment,
  onOpenCloseout,
  onOpenStockTrace,
  onOpenAgenda,
  mobileMinimalChrome = false,
}) => {
  const syncedAppointmentIdsRef = useRef<Set<string>>(new Set());
  const todaysAppointments = useMemo(
    () =>
      appointments
        .filter((appointment) => appointment.date === today && appointment.status !== 'cancelled')
        .sort((a, b) => `${a.time}`.localeCompare(`${b.time}`)),
    [appointments, today]
  );

  const focusAppointment = useMemo(() => {
    if (activeAppointmentProp) return activeAppointmentProp;
    const active = todaysAppointments.find((appointment) => appointment.status === 'in_progress');
    if (active) return active;
    const next = todaysAppointments.find((appointment) =>
      ['pending', 'confirmed'].includes(appointment.status)
    );
    return next ?? todaysAppointments[0] ?? null;
  }, [activeAppointmentProp, todaysAppointments]);

  const focusClient = focusAppointment ? clientForAppointment(focusAppointment, clients) : null;
  const canonicalFlashPrice = focusAppointment
    ? resolveCanonicalFlashPrice(focusAppointment, flashDesigns)
    : null;
  const hasPriceMismatch = Boolean(
    focusAppointment &&
    canonicalFlashPrice &&
    Math.abs((Number(focusAppointment.price) || 0) - canonicalFlashPrice.price) >= 0.01
  );
  const displayedAppointment = useMemo<Appointment | null>(() => {
    if (!focusAppointment) return null;
    if (!hasPriceMismatch || !canonicalFlashPrice) return focusAppointment;
    return appointmentWithResolvedFlashPrice(focusAppointment, flashDesigns);
  }, [canonicalFlashPrice, flashDesigns, focusAppointment, hasPriceMismatch]);
  const remainingBalance = displayedAppointment
    ? appointmentRemainingBalanceEuros(displayedAppointment)
    : 0;
  const hasHealthSnapshot = Boolean(focusClient?.healthProfileSnapshot);
  const needsBalance = remainingBalance >= 1 && !displayedAppointment?.balancePaidAt;
  const sessionsToClose = todaysAppointments.filter(
    (appointment) => appointment.status === 'completed' && !appointment.balancePaidAt
  ).length;
  const readyForSession = Boolean(
    displayedAppointment?.consentFormSigned && hasHealthSnapshot && displayedAppointment.depositPaid
  );

  const remainingBalanceToCollect = useMemo(
    () =>
      todaysAppointments.reduce((sum, apt) => {
        if (apt.balancePaidAt) return sum;
        return sum + appointmentRemainingBalanceEuros(apt);
      }, 0),
    [todaysAppointments]
  );

  const handleLaunchSessionFlow = () => {
    if (displayedAppointment) onSelectAppointment(displayedAppointment);
    else onOpenAgenda();
  };

  useEffect(() => {
    if (!focusAppointment || !canonicalFlashPrice || !hasPriceMismatch || !onSyncAppointmentPrice) {
      return;
    }
    if (syncedAppointmentIdsRef.current.has(focusAppointment.id)) return;
    syncedAppointmentIdsRef.current.add(focusAppointment.id);
    onSyncAppointmentPrice(
      focusAppointment,
      buildPriceSyncUpdates(focusAppointment, canonicalFlashPrice.price)
    );
  }, [canonicalFlashPrice, focusAppointment, hasPriceMismatch, onSyncAppointmentPrice]);

  if (mobileMinimalChrome) {
    const sessionChecks = [
      { label: 'Consentement signé', done: Boolean(displayedAppointment?.consentFormSigned) },
      { label: 'Questionnaire médical validé', done: hasHealthSnapshot },
      { label: 'Acompte Stripe perçu', done: Boolean(displayedAppointment?.depositPaid) },
    ] as const;

    return (
      <div className="space-y-2 w-full">
        <div className="flex items-center gap-2 px-1">
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-400 dark:text-zinc-500">
            Cockpit de contrôle
          </span>
          <span className="size-1.5 rounded-full bg-blue-600" aria-hidden />
        </div>
        <div className="rounded-2xl border border-zinc-100 bg-white p-5 dark:border-zinc-900 dark:bg-zinc-950/40 space-y-5">
          <div className="grid grid-cols-2 gap-4 pb-4 border-b border-zinc-100 dark:border-zinc-900/60">
            <div className="space-y-1">
              <p className="text-xs font-medium text-zinc-400 dark:text-zinc-500">
                Session du jour
              </p>
              <p className="type-stat">{todaysAppointments.length}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-zinc-400 dark:text-zinc-500">
                Reste à encaisser
              </p>
              <p className="type-stat text-blue-600 dark:text-blue-400">
                {formatEuro(remainingBalanceToCollect)}
              </p>
            </div>
          </div>
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-800 dark:text-zinc-200">
              Vérifications obligatoires
            </h4>
            <div className="space-y-2">
              {sessionChecks.map((check) => (
                <div key={check.label} className="flex items-center justify-between py-1 text-sm">
                  <span className="font-medium text-zinc-500 dark:text-zinc-400">
                    {check.label}
                  </span>
                  {check.done ? (
                    <span className="flex size-5 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
                      <Check className="size-3" aria-hidden strokeWidth={2.5} />
                    </span>
                  ) : (
                    <span className="flex size-5 items-center justify-center rounded-full bg-zinc-100 text-zinc-500 dark:bg-zinc-900 dark:text-zinc-500">
                      <AlertCircle className="size-3" aria-hidden strokeWidth={2.5} />
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
          <button
            type="button"
            onClick={handleLaunchSessionFlow}
            className="flex h-11 w-full items-center justify-center rounded-xl bg-zinc-900 text-sm font-medium text-white transition-all active:scale-[0.98] dark:bg-white dark:text-zinc-950"
          >
            Ouvrir la fiche de session
          </button>
        </div>
      </div>
    );
  }

  return (
    <Card
      size="sm"
      className={cn(
        'ds-glass-widget mb-3 shadow-none ring-0 sm:mb-4',
        /** Évite bg-card (~blanc en dark) qui recouvre le shell glass du DS */
        'border-0 bg-transparent',
        mobileMinimalChrome && 'mb-0 sm:mb-4'
      )}
    >
      <CardHeader className="space-y-0 px-3.5 pb-2.5 pt-3.5 sm:space-y-2 sm:px-4 sm:pb-3 sm:pt-4">
        <div className="flex min-w-0 items-start justify-between gap-3">
          <div className="min-w-0 flex-1 space-y-1.5 sm:space-y-2">
            {mobileMinimalChrome ? (
              <div className="flex max-w-[min(100%,220px)] items-center gap-2">
                <ShieldCheck className="size-3 shrink-0 text-indigo-600 dark:text-indigo-400" />
                <span className="truncate text-[11px] font-bold uppercase tracking-[0.1em] text-indigo-600 dark:text-indigo-400">
                  Cockpit du jour
                </span>
              </div>
            ) : (
              <Badge
                variant="secondary"
                className="max-w-[min(100%,220px)] gap-1 truncate py-0 text-[10px] font-semibold text-blue-700 dark:text-blue-300 sm:gap-1.5 sm:text-xs"
              >
                <ShieldCheck data-icon="inline-start" className="size-3 shrink-0 sm:size-3.5" />
                <span className="truncate">Cockpit du jour</span>
              </Badge>
            )}
            <div className="min-w-0 pr-0 sm:pr-1">
              <CardTitle
                className={cn(
                  'text-base font-display font-bold leading-tight tracking-tight text-zinc-950 dark:text-white sm:text-lg md:text-xl',
                  mobileMinimalChrome &&
                    'type-stat text-slate-900 dark:text-white sm:text-lg md:text-xl'
                )}
              >
                {focusAppointment ? 'Prochaine séance' : 'Journée prête'}
              </CardTitle>
              <CardDescription
                className={cn(
                  'mt-1 text-[11px] leading-snug text-zinc-500 dark:text-zinc-400 sm:text-sm sm:leading-5',
                  mobileMinimalChrome &&
                    'mt-2 text-sm leading-relaxed text-slate-400 dark:text-zinc-500'
                )}
              >
                {mobileMinimalChrome ? (
                  'Consentement, santé, paiement et stock — même écran.'
                ) : (
                  <>
                    <span className="sm:hidden">
                      Consentement, santé, paiement et stock — même écran.
                    </span>
                    <span className="hidden sm:inline">
                      Consentement, santé, paiement et stock sans changer d’écran.
                    </span>
                  </>
                )}
              </CardDescription>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            size="icon-lg"
            onClick={onOpenAgenda}
            aria-label="Ouvrir l’agenda"
            className={cn(
              'mt-0.5 shrink-0 rounded-xl border-zinc-200 dark:border-zinc-700 sm:rounded-2xl',
              mobileMinimalChrome &&
                'size-10 rounded-xl border-zinc-100 bg-white shadow-sm dark:border-zinc-700 dark:bg-zinc-900'
            )}
          >
            <CalendarDays className="size-[18px] sm:size-5" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-0 px-3.5 pb-4 pt-0 sm:px-4 sm:pb-5">
        <div
          className={cn(mobileMinimalChrome ? 'bg-transparent p-0' : 'ds-glass-panel p-2.5 sm:p-3')}
        >
          <p
            className={cn(
              'mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground sm:mb-2.5',
              mobileMinimalChrome &&
                'mb-4 text-[10px] font-bold tracking-[0.05em] text-slate-400 dark:text-zinc-500'
            )}
          >
            Aujourd’hui
          </p>
          <div
            className={cn(
              'grid grid-cols-2 gap-2 sm:grid-cols-4',
              mobileMinimalChrome && 'grid-cols-2 gap-4'
            )}
          >
            <MetricCard
              icon={<CalendarDays />}
              label="RDV"
              value={todaysAppointments.length.toString()}
              surfaceClass={mobileMinimalChrome ? 'metric-figma-mobile' : undefined}
            />
            <MetricCard
              icon={<ReceiptText />}
              label="Solde"
              value={sessionsToClose.toString()}
              tone={sessionsToClose > 0 ? 'amber' : 'zinc'}
              surfaceClass={mobileMinimalChrome ? 'metric-figma-mobile' : undefined}
            />
            <MetricCard
              icon={<CreditCard />}
              label="Pay"
              value={stripeConnectReady ? 'OK' : 'Setup'}
              tone={stripeConnectReady ? 'emerald' : 'amber'}
              surfaceClass={mobileMinimalChrome ? 'metric-figma-mobile' : undefined}
            />
            <MetricCard
              icon={<Package />}
              label="Lots"
              value="1 clic"
              surfaceClass={mobileMinimalChrome ? 'metric-figma-mobile' : undefined}
            />
          </div>

          <div className="mt-2.5 border-t border-border/60 pt-2.5 sm:mt-3 sm:pt-3">
            {displayedAppointment ? (
              <div className="rounded-2xl border border-border/60 bg-background/40 p-2.5 shadow-sm ring-1 ring-black/[0.04] dark:bg-zinc-950/85 dark:border-zinc-700/65 dark:ring-white/[0.06] sm:p-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                      <Badge className="h-6 gap-1 rounded-xl bg-blue-700 px-2.5 text-xs text-white dark:bg-blue-500 sm:h-7 sm:rounded-2xl sm:px-3 sm:text-sm">
                        <Clock data-icon="inline-start" className="size-3 sm:size-3.5" />
                        {displayedAppointment.time}
                      </Badge>
                      <Badge
                        variant={readyForSession ? 'secondary' : 'outline'}
                        className="h-6 rounded-xl px-2.5 text-xs sm:h-7 sm:rounded-2xl sm:px-3 sm:text-sm dark:border-zinc-600 dark:bg-zinc-800/95 dark:text-zinc-50"
                      >
                        {readyForSession
                          ? 'Prêt à tatouer'
                          : statusLabel(displayedAppointment.status)}
                      </Badge>
                    </div>
                    <h3 className="mt-2 truncate text-[15px] font-bold leading-snug text-zinc-950 dark:text-white sm:mt-2.5 sm:text-lg">
                      {displayedAppointment.clientName}
                    </h3>
                    <p className="mt-0.5 truncate text-[13px] text-muted-foreground sm:text-sm">
                      {stripEmbeddedPriceFromService(displayedAppointment.service) || 'Séance'} ·{' '}
                      {formatEuro(displayedAppointment.price)}
                    </p>
                  </div>

                  <div className="grid min-w-0 grid-cols-1 gap-1 sm:min-w-[240px] sm:gap-1.5 sm:text-sm">
                    <ChecklistLine
                      ok={displayedAppointment.consentFormSigned}
                      icon={<FileSignature />}
                      label={
                        displayedAppointment.consentFormSigned
                          ? 'Consentement signé'
                          : 'Consentement à vérifier'
                      }
                    />
                    <ChecklistLine
                      ok={hasHealthSnapshot}
                      icon={<HeartPulse />}
                      label={
                        hasHealthSnapshot ? 'Questionnaire santé présent' : 'Santé non renseignée'
                      }
                    />
                    <ChecklistLine
                      ok={displayedAppointment.depositPaid}
                      icon={<CreditCard />}
                      label={
                        displayedAppointment.depositPaid ? 'Acompte encaissé' : 'Acompte non payé'
                      }
                    />
                  </div>
                </div>

                {hasPriceMismatch && canonicalFlashPrice ? (
                  <Alert variant="info" className="mt-3 rounded-2xl">
                    <AlertTriangle />
                    <AlertDescription>
                      Prix resynchronisé : <strong>{formatEuro(canonicalFlashPrice.price)}</strong>
                    </AlertDescription>
                  </Alert>
                ) : null}

                {needsBalance ? (
                  <Alert variant="warning" className="mt-3 rounded-2xl">
                    <AlertTriangle />
                    <AlertDescription>
                      Solde estimé à encaisser : <strong>{formatEuro(remainingBalance)}</strong>
                    </AlertDescription>
                  </Alert>
                ) : null}

                <div className="mt-2.5 grid grid-cols-1 gap-2 sm:mt-3 sm:grid-cols-3">
                  <Button
                    type="button"
                    onClick={() => onSelectAppointment(displayedAppointment)}
                    className="min-h-[44px] rounded-xl sm:rounded-2xl"
                  >
                    Voir la fiche
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onOpenCloseout(displayedAppointment)}
                    className="min-h-[44px] rounded-xl sm:rounded-2xl"
                  >
                    Clôturer / solde
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      onOpenStockTrace(
                        displayedAppointment.id,
                        displayedAppointment.clientId || null
                      )
                    }
                    className="min-h-[44px] rounded-xl sm:rounded-2xl"
                  >
                    Traçabilité
                  </Button>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-border/70 bg-background/35 px-4 py-4 text-center dark:border-zinc-600/65 dark:bg-zinc-950/40">
                <p className="text-sm font-semibold text-foreground">Aucune séance aujourd’hui.</p>
                <p className="mt-1 text-xs leading-snug text-muted-foreground sm:text-sm">
                  Ouvre l’agenda pour préparer les prochains créneaux ou partager ton lien de
                  réservation.
                </p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

interface MetricCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone?: 'zinc' | 'emerald' | 'amber';
  surfaceClass?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({
  icon,
  label,
  value,
  tone = 'zinc',
  surfaceClass,
}) => {
  return (
    <div
      className={cn(
        'min-w-0 rounded-xl border border-border/60 bg-background/35 p-2 ring-1 ring-black/[0.03] dark:border-zinc-700/65 dark:bg-zinc-950/55 dark:ring-white/[0.06] sm:p-2.5 [&_svg]:size-3 [&_svg]:shrink-0 sm:[&_svg]:size-3.5',
        surfaceClass === 'metric-figma-mobile' &&
          'rounded-[32px] border border-zinc-100 bg-white p-6 shadow-[0_1px_1px_rgba(0,0,0,0.05)] ring-0 dark:border-zinc-800 dark:bg-zinc-900/90',
        surfaceClass && surfaceClass !== 'metric-figma-mobile' ? surfaceClass : undefined
      )}
    >
      <div
        className={cn(
          'flex items-center gap-2 text-[10px] font-medium text-muted-foreground sm:text-[11px]',
          surfaceClass === 'metric-figma-mobile' &&
            'font-bold uppercase tracking-wide text-slate-400 dark:text-zinc-500'
        )}
      >
        {surfaceClass === 'metric-figma-mobile' ? (
          <span className="flex size-8 shrink-0 items-center justify-center rounded-xl border border-zinc-100 bg-white text-indigo-600 shadow-sm dark:border-zinc-700 dark:bg-zinc-800">
            {icon}
          </span>
        ) : (
          icon
        )}
        <span className="truncate">{label}</span>
      </div>
      <div
        className={cn(
          'mt-0.5 truncate text-[13px] font-bold tabular-nums sm:text-base',
          surfaceClass === 'metric-figma-mobile' &&
            value !== 'OK' &&
            'mt-4 text-2xl tracking-tight text-slate-900 dark:text-white',
          surfaceClass === 'metric-figma-mobile' && value === 'OK' && 'mt-4',
          !(surfaceClass === 'metric-figma-mobile' && value === 'OK') &&
            tone === 'emerald' &&
            'text-emerald-700 dark:text-emerald-300',
          tone === 'amber' && 'text-amber-700 dark:text-amber-300',
          tone === 'zinc' && 'text-foreground'
        )}
      >
        {value === 'OK' && surfaceClass === 'metric-figma-mobile' ? (
          <span className="inline-flex rounded-md bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300">
            OK
          </span>
        ) : (
          value
        )}
      </div>
    </div>
  );
};

interface ChecklistLineProps {
  ok: boolean;
  icon: React.ReactNode;
  label: string;
}

const ChecklistLine: React.FC<ChecklistLineProps> = ({ ok, icon, label }) => (
  <div
    className={cn(
      'flex min-h-[32px] items-center gap-2 rounded-xl border px-2.5 py-1 sm:min-h-[36px] sm:rounded-2xl sm:px-3 sm:py-1.5 [&_svg]:size-3.5 [&_svg]:shrink-0 sm:[&_svg]:size-4',
      ok
        ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/45 dark:bg-emerald-950/85 dark:text-emerald-50'
        : 'border-amber-300 bg-amber-50 text-amber-950 dark:border-amber-400/40 dark:bg-amber-950/90 dark:text-amber-50'
    )}
  >
    {ok ? <CheckCircle2 /> : icon}
    <span className="truncate text-[12px] font-medium leading-snug sm:text-sm">{label}</span>
  </div>
);
