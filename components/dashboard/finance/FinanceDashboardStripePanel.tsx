import { useMemo, useState } from 'react';
import type { Appointment } from '@/types';
import { getVitrineShareUrl } from '@/lib/urls';
import { getStudioSlug } from '@/lib/supabaseDashboard';
import type { FinancePeriod } from '@/lib/financePeriod';
import { useInkflowPaymentsPeriod } from '@/hooks/useInkflowPaymentsPeriod';
import { useStudioPrivacy } from '@/contexts/StudioPrivacyContext';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FinanceVitrineQrCard } from './FinanceVitrineQrCard';
import { FinanceRecentDepositsList } from './FinanceRecentDepositsList';
import { FinanceStripeBreakdownCard } from './FinanceStripeBreakdownCard';

export interface FinanceDashboardStripePanelProps {
  studioId: string | null | undefined;
  studioName: string;
  studioSlug?: string | null;
  useSupabase?: boolean;
  appointments?: Appointment[];
}

/**
 * Grille finance — 3 blocs structure shadcn (QR vitrine, derniers acomptes, breakdown Stripe).
 */
export function FinanceDashboardStripePanel({
  studioId,
  studioName,
  studioSlug,
  useSupabase = false,
  appointments = [],
}: FinanceDashboardStripePanelProps) {
  const { privacyMode } = useStudioPrivacy();
  const [period, setPeriod] = useState<FinancePeriod>('month');

  const vitrineUrl = useMemo(() => {
    const slug =
      studioSlug != null && studioSlug !== ''
        ? studioSlug
        : getStudioSlug(studioName || 'mon-studio');
    return getVitrineShareUrl(slug);
  }, [studioName, studioSlug]);

  const { payments, breakdown, periodLabel, loading, error } = useInkflowPaymentsPeriod({
    studioId,
    enabled: Boolean(useSupabase && studioId),
    period,
    appointments,
    listLimit: 8,
  });

  return (
    <section className="space-y-4 px-4 lg:px-6" aria-labelledby="finance-stripe-panel-heading">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 id="finance-stripe-panel-heading" className="text-base font-semibold text-foreground">
            Encaissements Stripe
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Vitrine, acomptes récents et net après frais
          </p>
        </div>
        <Select value={period} onValueChange={(v) => setPeriod(v as FinancePeriod)}>
          <SelectTrigger
            size="sm"
            className="w-full rounded-md border-border bg-card sm:w-[180px]"
            aria-label="Période finance"
          >
            <SelectValue placeholder="Période" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="today">Aujourd&apos;hui</SelectItem>
            <SelectItem value="week">Cette semaine</SelectItem>
            <SelectItem value="month">Ce mois-ci</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {error ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
          {error.message}
        </p>
      ) : null}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <FinanceVitrineQrCard vitrineUrl={vitrineUrl} studioName={studioName} />
        <FinanceRecentDepositsList
          payments={payments}
          loading={loading}
          privacyMode={privacyMode}
        />
        <FinanceStripeBreakdownCard
          breakdown={breakdown}
          periodLabel={periodLabel}
          privacyMode={privacyMode}
        />
      </div>
    </section>
  );
}
