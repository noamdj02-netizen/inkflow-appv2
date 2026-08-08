import { CreditCard, Loader2, PenLine, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { InkflowPaymentKind, InkflowPaymentRow } from '@/hooks/useInkflowPaymentsPeriod';

function formatAmountEur(amount: number, currency: string, masked: boolean): string {
  if (masked) return '+••••';
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: currency.toUpperCase() === 'EUR' ? 'EUR' : currency.toUpperCase(),
    minimumFractionDigits: 2,
  }).format(amount);
}

function kindIcon(kind: InkflowPaymentKind) {
  switch (kind) {
    case 'flash':
      return Zap;
    case 'projet':
      return PenLine;
    default:
      return CreditCard;
  }
}

/** Liste shadcn — ligne icône ronde + libellé + sous-titre + montant à droite. */
export interface FinanceRecentDepositsListProps {
  payments: InkflowPaymentRow[];
  loading?: boolean;
  privacyMode?: boolean;
  className?: string;
}

export function FinanceRecentDepositsList({
  payments,
  loading = false,
  privacyMode = false,
  className,
}: FinanceRecentDepositsListProps) {
  return (
    <Card
      className={cn(
        'rounded-md border-border bg-card ring-1 ring-border/80 shadow-none',
        className
      )}
    >
      <CardHeader className="border-b border-border pb-4">
        <CardTitle className="text-sm font-semibold text-foreground">Derniers acomptes</CardTitle>
        <CardDescription className="text-xs">
          Paiements Stripe encaissés sur la période
        </CardDescription>
      </CardHeader>
      <CardContent className="px-0 pb-0 pt-0">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" aria-hidden />
            Chargement…
          </div>
        ) : payments.length === 0 ? (
          <p className="px-4 py-10 text-center text-xs text-muted-foreground">
            Aucun acompte sur cette période — les encaissements Stripe apparaîtront ici.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {payments.map((pay) => {
              const Icon = kindIcon(pay.kind);
              return (
                <li
                  key={pay.id}
                  className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/40"
                >
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-foreground">
                    <Icon className="size-4" aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{pay.clientName}</p>
                    <p className="truncate text-xs text-muted-foreground">{pay.subtitle}</p>
                  </div>
                  <span className="shrink-0 font-mono text-sm font-semibold tabular-nums text-foreground">
                    {formatAmountEur(pay.amountEur, pay.currency, privacyMode)}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
