import { Banknote, Receipt } from 'lucide-react';
import type { Appointment } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatEuroPrivacy } from '@/contexts/StudioPrivacyContext';
import { InvoiceButton } from '../InvoiceButton';
import type { User } from '@/types';

export interface FinanceTransactionRow {
  id: string;
  type: 'rdv' | 'cash';
  date: string;
  label: string;
  sub: string;
  amount: number;
  appointment?: Appointment;
}

export interface FinanceTransactionsTableProps {
  transactions: FinanceTransactionRow[];
  privacyMode?: boolean;
  user?: User | null;
  studioId?: string | null;
}

/** Liste transactions — layout table dashboard-01 (px-4 lg:px-6 + Card). */
export function FinanceTransactionsTable({
  transactions,
  privacyMode = false,
  user,
  studioId,
}: FinanceTransactionsTableProps) {
  return (
    <div className="px-4 lg:px-6">
      <Card className="@container/card">
        <CardHeader className="border-b border-border">
          <CardTitle className="text-base">Dernières transactions</CardTitle>
          <CardDescription>Historique RDV et espèces</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {transactions.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-14 text-center">
              <span className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <Receipt className="size-5" aria-hidden />
              </span>
              <p className="text-sm text-muted-foreground">Aucune transaction</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Client / libellé</TableHead>
                  <TableHead className="hidden sm:table-cell">Détail</TableHead>
                  <TableHead className="hidden md:table-cell">Date</TableHead>
                  <TableHead className="text-right">Montant</TableHead>
                  <TableHead className="w-[1%]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted">
                          {t.type === 'cash' ? (
                            <Banknote className="size-4" aria-hidden />
                          ) : (
                            <Receipt className="size-4" aria-hidden />
                          )}
                        </span>
                        <span className="font-medium">{t.label}</span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground sm:table-cell">
                      <div className="flex items-center gap-2">
                        {t.sub}
                        {t.type === 'cash' ? (
                          <Badge variant="secondary" className="rounded-md">
                            Espèces
                          </Badge>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground md:table-cell">
                      {t.date}
                    </TableCell>
                    <TableCell className="text-right font-mono tabular-nums font-semibold">
                      {formatEuroPrivacy(t.amount, privacyMode)}
                    </TableCell>
                    <TableCell className="text-right">
                      {t.type === 'rdv' && t.appointment && user ? (
                        <InvoiceButton
                          appointment={t.appointment}
                          artist={user}
                          studioId={studioId}
                        />
                      ) : (
                        <span className="sr-only">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export interface FinanceCashDrawerCardProps {
  cashEntries: { id: string; date: string; label: string; amount: number }[];
  privacyMode?: boolean;
  onAdd: () => void;
  onRemove: (id: string) => void;
}

export function FinanceCashDrawerCard({
  cashEntries,
  privacyMode = false,
  onAdd,
  onRemove,
}: FinanceCashDrawerCardProps) {
  return (
    <div className="px-4 lg:px-6">
      <Card className="@container/card">
        <CardHeader className="flex flex-row items-start justify-between gap-2 border-b border-border">
          <div>
            <CardTitle className="text-base">Caisse espèces</CardTitle>
            <CardDescription>Encaissements récents</CardDescription>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={onAdd}>
            Ajouter
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {cashEntries.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">Aucun encaissement</p>
          ) : (
            <Table>
              <TableBody>
                {cashEntries
                  .slice()
                  .sort((a, b) => b.date.localeCompare(a.date))
                  .slice(0, 8)
                  .map((e) => (
                    <TableRow key={e.id}>
                      <TableCell>
                        <div className="font-medium">{e.label}</div>
                        <div className="text-xs text-muted-foreground">{e.date}</div>
                      </TableCell>
                      <TableCell className="text-right font-mono tabular-nums text-primary">
                        +{formatEuroPrivacy(e.amount, privacyMode)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-muted-foreground hover:text-destructive"
                          onClick={() => onRemove(e.id)}
                        >
                          Retirer
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
