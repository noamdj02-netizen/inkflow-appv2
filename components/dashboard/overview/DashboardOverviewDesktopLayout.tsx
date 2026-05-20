import type { ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const shellCard =
  'rounded-2xl border border-zinc-200/90 bg-white shadow-sm dark:border-zinc-800/90 dark:bg-zinc-900/50';

export interface DashboardOverviewUnpaidAlertProps {
  count: number;
  onViewAppointments: () => void;
}

export function DashboardOverviewUnpaidAlert({
  count,
  onViewAppointments,
}: DashboardOverviewUnpaidAlertProps) {
  if (count <= 0) return null;
  return (
    <div
      role="alert"
      className={cn(
        shellCard,
        'flex flex-col gap-3 border-amber-200/90 bg-amber-50/60 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-amber-500/25 dark:bg-amber-500/10 md:p-5'
      )}
    >
      <div className="flex min-w-0 items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-200">
          <AlertCircle className="size-5" strokeWidth={2} aria-hidden />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-amber-950 dark:text-amber-50">
            {count} RDV sans acompte payé
          </p>
          <p className="mt-0.5 text-xs text-amber-900/80 dark:text-amber-100/80">
            Relancez ou encaissez l&apos;acompte pour sécuriser vos créneaux.
          </p>
        </div>
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onViewAppointments}
        className="w-full shrink-0 border-amber-200/90 bg-white/80 text-amber-950 hover:bg-amber-50 sm:w-auto dark:border-amber-500/30 dark:bg-zinc-900/40 dark:text-amber-50"
      >
        Voir les RDV
      </Button>
    </div>
  );
}

export interface DashboardOverviewDesktopLayoutProps {
  unpaidAlertCount: number;
  onViewUnpaidAppointments: () => void;
  toolbar?: ReactNode;
  trialBanner?: ReactNode;
  activityAlerts?: ReactNode;
  kpiRow: ReactNode;
  onboarding?: ReactNode;
  sidebar?: ReactNode;
  extraContent?: ReactNode;
}

/**
 * Grille desktop unifiée — Vue d'ensemble InkFlow (alertes → KPI → onboarding → clients).
 */
export function DashboardOverviewDesktopLayout({
  unpaidAlertCount,
  onViewUnpaidAppointments,
  toolbar,
  trialBanner,
  activityAlerts,
  kpiRow,
  onboarding,
  sidebar,
  extraContent,
}: DashboardOverviewDesktopLayoutProps) {
  return (
    <div className="mx-auto flex w-full max-w-[min(1800px,100%)] flex-col gap-6 pb-10 md:gap-7">
      {toolbar ? <div className="flex flex-wrap items-center gap-2">{toolbar}</div> : null}

      {trialBanner ? <div>{trialBanner}</div> : null}

      <DashboardOverviewUnpaidAlert
        count={unpaidAlertCount}
        onViewAppointments={onViewUnpaidAppointments}
      />

      {activityAlerts ? <div className="min-w-0">{activityAlerts}</div> : null}

      <section aria-label="Indicateurs clés" className="min-w-0">
        <div className="grid grid-cols-1 items-stretch gap-4 sm:grid-cols-2 xl:grid-cols-4 [&>*]:h-full">
          {kpiRow}
        </div>
      </section>

      {onboarding ? <section className="min-w-0">{onboarding}</section> : null}

      {sidebar ? (
        <section aria-label="Clients et acomptes" className="min-w-0">
          <div className="w-full max-w-xl [&>*]:h-full">{sidebar}</div>
        </section>
      ) : null}

      {extraContent ? <div className="min-w-0 space-y-6">{extraContent}</div> : null}
    </div>
  );
}
