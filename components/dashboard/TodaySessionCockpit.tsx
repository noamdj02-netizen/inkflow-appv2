import React, { useEffect, useMemo, useRef } from 'react';
import {
  AlertTriangle,
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
import { cn } from '../../lib/utils';

interface TodaySessionCockpitProps {
  today: string;
  appointments: Appointment[];
  clients: Client[];
  flashDesigns?: FlashDesign[];
  stripeConnectReady: boolean;
  onSyncAppointmentPrice?: (appointment: Appointment, updates: Partial<Appointment>) => void;
  onSelectAppointment: (appointment: Appointment) => void;
  onOpenCloseout: (appointment: Appointment) => void;
  onOpenStockTrace: (appointmentId: string, clientId: string | null) => void;
  onOpenAgenda: () => void;
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

function parseEuroAmountFromText(value: string | undefined): number | null {
  if (!value) return null;
  const matches = [...value.matchAll(/(\d+(?:[.,]\d{1,2})?)\s*€/g)];
  const last = matches.at(-1)?.[1];
  if (!last) return null;
  const amount = Number(last.replace(',', '.'));
  return Number.isFinite(amount) && amount > 0 ? amount : null;
}

function stripEmbeddedPriceFromService(value: string | undefined): string | undefined {
  if (!value) return value;
  const cleaned = value.replace(/\s*[—-]\s*\d+(?:[.,]\d{1,2})?\s*€\s*$/u, '').trim();
  return cleaned || value;
}

function resolveCanonicalFlashPrice(
  appointment: Appointment,
  flashDesigns: FlashDesign[]
): { price: number; source: 'catalog' | 'service-label' } | null {
  if (appointment.tattooType !== 'flash') return null;
  const flash = appointment.flashId
    ? flashDesigns.find((design) => design.id === appointment.flashId)
    : null;
  if (flash && Number.isFinite(flash.price) && flash.price > 0) {
    return { price: flash.price, source: 'catalog' };
  }
  const priceFromService = parseEuroAmountFromText(appointment.service);
  return priceFromService ? { price: priceFromService, source: 'service-label' } : null;
}

function buildPriceSyncUpdates(
  appointment: Appointment,
  canonicalPrice: number
): Partial<Appointment> {
  const currentDeposit = Number(appointment.deposit) || 0;
  const cleanedService = stripEmbeddedPriceFromService(appointment.service);
  const updates: Partial<Appointment> = {
    price: canonicalPrice,
    deposit: Math.max(0, Math.min(currentDeposit, canonicalPrice)),
  };
  if (cleanedService && cleanedService !== appointment.service) {
    updates.service = cleanedService;
  }
  return updates;
}

export const TodaySessionCockpit: React.FC<TodaySessionCockpitProps> = ({
  today,
  appointments,
  clients,
  flashDesigns = [],
  stripeConnectReady,
  onSyncAppointmentPrice,
  onSelectAppointment,
  onOpenCloseout,
  onOpenStockTrace,
  onOpenAgenda,
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
    const active = todaysAppointments.find((appointment) => appointment.status === 'in_progress');
    if (active) return active;
    const next = todaysAppointments.find((appointment) =>
      ['pending', 'confirmed'].includes(appointment.status)
    );
    return next ?? todaysAppointments[0] ?? null;
  }, [todaysAppointments]);

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
    return {
      ...focusAppointment,
      ...buildPriceSyncUpdates(focusAppointment, canonicalFlashPrice.price),
    };
  }, [canonicalFlashPrice, focusAppointment, hasPriceMismatch]);
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

  return (
    <Card
      size="sm"
      className="mb-3 rounded-3xl border-zinc-200/80 bg-white/95 shadow-sm ring-0 dark:border-zinc-800 dark:bg-zinc-900/70 sm:mb-4"
    >
      <CardHeader className="space-y-0 px-3.5 pb-2.5 pt-3.5 sm:space-y-2 sm:px-4 sm:pb-3 sm:pt-4">
        <div className="flex min-w-0 items-start justify-between gap-3">
          <div className="min-w-0 flex-1 space-y-1.5 sm:space-y-2">
            <Badge
              variant="secondary"
              className="max-w-[min(100%,220px)] gap-1 truncate py-0 text-[10px] font-semibold text-blue-700 dark:text-blue-300 sm:gap-1.5 sm:text-xs"
            >
              <ShieldCheck data-icon="inline-start" className="size-3 shrink-0 sm:size-3.5" />
              <span className="truncate">Cockpit du jour</span>
            </Badge>
            <div className="min-w-0 pr-0 sm:pr-1">
              <CardTitle className="text-base font-display font-bold leading-tight tracking-tight text-zinc-950 dark:text-white sm:text-lg md:text-xl">
                {focusAppointment ? 'Prochaine séance' : 'Journée prête'}
              </CardTitle>
              <CardDescription className="mt-1 text-[11px] leading-snug text-zinc-500 dark:text-zinc-400 sm:text-sm sm:leading-5">
                <span className="sm:hidden">
                  Consentement, santé, paiement et stock — même écran.
                </span>
                <span className="hidden sm:inline">
                  Consentement, santé, paiement et stock sans changer d’écran.
                </span>
              </CardDescription>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            size="icon-lg"
            onClick={onOpenAgenda}
            aria-label="Ouvrir l’agenda"
            className="mt-0.5 shrink-0 rounded-xl border-zinc-200 dark:border-zinc-700 sm:rounded-2xl"
          >
            <CalendarDays className="size-[18px] sm:size-5" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-0 px-3.5 pb-4 pt-0 sm:px-4 sm:pb-5">
        <div className="rounded-2xl border border-zinc-200/90 bg-zinc-50/80 p-2.5 dark:border-zinc-800 dark:bg-zinc-950/45 sm:p-3">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 sm:mb-2.5">
            Aujourd’hui
          </p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <MetricCard
              icon={<CalendarDays />}
              label="RDV"
              value={todaysAppointments.length.toString()}
            />
            <MetricCard
              icon={<ReceiptText />}
              label="Solde"
              value={sessionsToClose.toString()}
              tone={sessionsToClose > 0 ? 'amber' : 'zinc'}
            />
            <MetricCard
              icon={<CreditCard />}
              label="Pay"
              value={stripeConnectReady ? 'OK' : 'Setup'}
              tone={stripeConnectReady ? 'emerald' : 'amber'}
            />
            <MetricCard icon={<Package />} label="Lots" value="1 clic" />
          </div>

          <div className="mt-2.5 border-t border-zinc-200/70 pt-2.5 dark:border-zinc-700/80 sm:mt-3 sm:pt-3">
            {displayedAppointment ? (
              <div className="rounded-2xl border border-zinc-200/90 bg-white p-2.5 shadow-sm dark:border-zinc-700 dark:bg-zinc-900/85 sm:p-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                      <Badge className="h-6 gap-1 rounded-xl px-2.5 text-xs sm:h-7 sm:rounded-2xl sm:px-3 sm:text-sm">
                        <Clock data-icon="inline-start" className="size-3 sm:size-3.5" />
                        {displayedAppointment.time}
                      </Badge>
                      <Badge
                        variant={readyForSession ? 'secondary' : 'outline'}
                        className="h-6 rounded-xl px-2.5 text-xs sm:h-7 sm:rounded-2xl sm:px-3 sm:text-sm"
                      >
                        {readyForSession
                          ? 'Prêt à tatouer'
                          : statusLabel(displayedAppointment.status)}
                      </Badge>
                    </div>
                    <h3 className="mt-2 truncate text-[15px] font-bold leading-snug text-zinc-950 dark:text-white sm:mt-2.5 sm:text-lg">
                      {displayedAppointment.clientName}
                    </h3>
                    <p className="mt-0.5 truncate text-[13px] text-zinc-500 dark:text-zinc-400 sm:text-sm">
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
                    Stock & aiguilles
                  </Button>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-zinc-300 bg-white/60 px-4 py-4 text-center dark:border-zinc-600 dark:bg-zinc-900/40">
                <p className="text-sm font-semibold text-zinc-900 dark:text-white">
                  Aucune séance aujourd’hui.
                </p>
                <p className="mt-1 text-xs leading-snug text-zinc-500 dark:text-zinc-400 sm:text-sm">
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
}

const MetricCard: React.FC<MetricCardProps> = ({ icon, label, value, tone = 'zinc' }) => {
  return (
    <div className="min-w-0 rounded-xl border border-zinc-200/90 bg-white/90 p-2 sm:p-2.5 dark:border-zinc-700 dark:bg-zinc-900/60 [&_svg]:size-3 [&_svg]:shrink-0 sm:[&_svg]:size-3.5">
      <div className="flex items-center gap-1 text-[10px] font-medium text-zinc-500 dark:text-zinc-400 sm:text-[11px]">
        {icon}
        <span className="truncate">{label}</span>
      </div>
      <div
        className={cn(
          'mt-0.5 truncate text-[13px] font-bold tabular-nums sm:text-base',
          tone === 'emerald' && 'text-emerald-700 dark:text-emerald-300',
          tone === 'amber' && 'text-amber-700 dark:text-amber-300',
          tone === 'zinc' && 'text-zinc-950 dark:text-white'
        )}
      >
        {value}
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
        ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200'
        : 'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200'
    )}
  >
    {ok ? <CheckCircle2 /> : icon}
    <span className="truncate text-[12px] font-medium leading-snug sm:text-sm">{label}</span>
  </div>
);
