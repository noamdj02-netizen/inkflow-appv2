import { cn } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import type { InkflowPaymentsBreakdown } from '@/hooks/useInkflowPaymentsPeriod';

function formatEur(value: number, masked: boolean): string {
  if (masked) return '•••• €';
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
  }).format(value);
}

/** Breakdown shadcn — lignes libellé/montant + séparateur + total net. */
export interface FinanceStripeBreakdownCardProps {
  breakdown: InkflowPaymentsBreakdown;
  periodLabel: string;
  privacyMode?: boolean;
  className?: string;
}

export function FinanceStripeBreakdownCard({
  breakdown,
  periodLabel,
  privacyMode = false,
  className,
}: FinanceStripeBreakdownCardProps) {
  const rows = [
    { label: 'Encaissé', value: breakdown.grossEur, muted: true },
    { label: 'Frais Stripe (estim.)', value: -breakdown.stripeFeesEur, muted: true },
  ] as const;

  return (
    <Card
      className={cn(
        'rounded-md border-border bg-card ring-1 ring-border/80 shadow-none',
        className
      )}
    >
      <CardHeader className="border-b border-border pb-4">
        <CardTitle className="text-sm font-semibold text-foreground">Répartition Stripe</CardTitle>
        <CardDescription className="text-xs capitalize">{periodLabel}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 pt-4">
        {rows.map(({ label, value, muted }) => (
          <div key={label} className="flex items-center justify-between gap-3 text-sm">
            <span className={muted ? 'text-muted-foreground' : 'text-foreground'}>{label}</span>
            <span
              className={cn(
                'font-mono tabular-nums',
                muted ? 'text-foreground' : 'font-semibold text-foreground'
              )}
            >
              {value < 0
                ? `−${formatEur(Math.abs(value), privacyMode).replace(/\s/g, ' ')}`
                : formatEur(value, privacyMode)}
            </span>
          </div>
        ))}
        <Separator className="bg-border" />
        <div className="flex items-center justify-between gap-3 text-sm">
          <span className="font-semibold text-foreground">Net</span>
          <span className="font-mono text-base font-semibold tabular-nums text-primary">
            {formatEur(breakdown.netEur, privacyMode)}
          </span>
        </div>
        <p className="text-[11px] leading-snug text-muted-foreground">
          {breakdown.transactionCount === 0
            ? 'Aucune transaction Stripe sur la période.'
            : `${breakdown.transactionCount} paiement${breakdown.transactionCount > 1 ? 's' : ''} — frais indicatifs (1,5 % + 0,25 € / tx).`}
        </p>
      </CardContent>
    </Card>
  );
}
