import { useMemo, useState } from 'react';
import { Star } from 'lucide-react';
import {
  createColumnHelper,
  FlexRender,
  rowSelectionFeature,
  tableFeatures,
  useTable,
} from '@tanstack/react-table';
import type { Appointment, Client } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ClientPhotoAvatar } from '@/components/common/ClientPhotoAvatar';
import { getClientStatusColor } from '@/components/crm/clientListUtils';
import { cn } from '@/lib/utils';
import { depositStatusDotClass, type DepositUiStatus } from '@/lib/depositStatusUi';
import type { DashboardOverviewHeroMeta } from './DashboardTabHero';

export type PilotageRowStatus = Extract<
  DepositUiStatus,
  'Payé' | 'En attente' | 'Relance' | 'Échoué'
>;

export type PilotageRow = {
  id: string;
  clientName: string;
  clientEmail: string;
  clientAvatar?: string;
  clientStatus: Client['status'];
  status: PilotageRowStatus;
  team: string;
  budget: number;
};

const DEFAULT_ROWS: PilotageRow[] = [
  {
    id: '1',
    clientName: 'Léa Martin',
    clientEmail: 'lea.martin@gmail.com',
    clientStatus: 'vip',
    status: 'Payé',
    team: 'Studio',
    budget: 120,
  },
  {
    id: '2',
    clientName: 'Tom Rousseau',
    clientEmail: 'tom.rousseau@outlook.fr',
    clientStatus: 'active',
    status: 'En attente',
    team: 'Studio',
    budget: 60,
  },
  {
    id: '3',
    clientName: 'Amina K.',
    clientEmail: 'amina.k@yahoo.fr',
    clientStatus: 'active',
    status: 'Payé',
    team: 'Studio',
    budget: 80,
  },
  {
    id: '4',
    clientName: 'Camille R.',
    clientEmail: 'camille.r@gmail.com',
    clientStatus: 'active',
    status: 'Relance',
    team: 'Studio',
    budget: 200,
  },
  {
    id: '5',
    clientName: 'Lucas M.',
    clientEmail: 'lucas.m@free.fr',
    clientStatus: 'active',
    status: 'Payé',
    team: 'Studio',
    budget: 150,
  },
  {
    id: '6',
    clientName: 'Sarah D.',
    clientEmail: 'sarah.d@gmail.com',
    clientStatus: 'inactive',
    status: 'Échoué',
    team: 'Studio',
    budget: 90,
  },
];

const COLUMN_COUNT = 5;

const features = tableFeatures({
  rowSelectionFeature,
});

const columnHelper = createColumnHelper<typeof features, PilotageRow>();

function clientStatusLabel(status: Client['status']) {
  if (status === 'vip') return 'VIP';
  if (status === 'inactive') return 'Inactif';
  return 'Actif';
}

function OverviewPilotageClientCell({
  row,
  onOpenClient,
}: {
  row: PilotageRow;
  onOpenClient?: (row: PilotageRow) => void;
}) {
  const openFiche = () => onOpenClient?.(row);

  return (
    <div className="flex min-w-0 max-w-[min(100%,280px)] items-center gap-3">
      <button
        type="button"
        onClick={openFiche}
        disabled={!onOpenClient}
        className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-zinc-100 transition-all hover:ring-2 hover:ring-primary/30 active:scale-[0.98] disabled:pointer-events-none dark:bg-zinc-800"
        aria-label={onOpenClient ? `Ouvrir la fiche de ${row.clientName}` : undefined}
      >
        <ClientPhotoAvatar
          name={row.clientName}
          src={row.clientAvatar}
          className="size-full"
          textClassName="text-xs font-semibold text-zinc-600 dark:text-zinc-300"
        />
      </button>
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-center gap-1.5">
          {onOpenClient ? (
            <button
              type="button"
              onClick={openFiche}
              className="truncate text-left font-medium text-foreground underline-offset-2 transition-all hover:text-primary hover:underline active:scale-[0.98]"
            >
              {row.clientName}
            </button>
          ) : (
            <span className="truncate font-medium text-foreground">{row.clientName}</span>
          )}
          {row.clientStatus === 'vip' ? (
            <Star className="size-3.5 shrink-0 fill-primary/85 text-primary" aria-hidden />
          ) : null}
          <span
            className={cn('hidden shrink-0 sm:inline-flex', getClientStatusColor(row.clientStatus))}
          >
            {clientStatusLabel(row.clientStatus)}
          </span>
        </div>
        <p className="truncate text-xs text-muted-foreground">{row.clientEmail}</p>
      </div>
    </div>
  );
}

function createColumns(onOpenClient?: (row: PilotageRow) => void) {
  return columnHelper.columns([
    columnHelper.display({
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          aria-label="Tout sélectionner"
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && 'indeterminate')
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          aria-label="Sélectionner la ligne"
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
        />
      ),
    }),
    columnHelper.display({
      id: 'client',
      header: 'Client',
      cell: ({ row }) => (
        <OverviewPilotageClientCell row={row.original} onOpenClient={onOpenClient} />
      ),
    }),
    columnHelper.accessor('status', {
      header: 'Acompte',
      cell: ({ row }) => {
        const status = row.getValue('status') as PilotageRowStatus;
        return (
          <Badge variant="outline" className="gap-1.5">
            <span
              aria-hidden
              className={`size-1.5 shrink-0 rounded-full ${depositStatusDotClass(status)}`}
            />
            {status}
          </Badge>
        );
      },
    }),
    columnHelper.accessor('team', {
      header: 'Artiste',
    }),
    columnHelper.accessor('budget', {
      header: () => <div className="text-right">Montant</div>,
      cell: ({ row }) => {
        const amount = Number(row.getValue('budget'));
        const formatted = new Intl.NumberFormat('fr-FR', {
          currency: 'EUR',
          maximumFractionDigits: 0,
          style: 'currency',
        }).format(amount);
        return <div className="text-right tabular-nums">{formatted}</div>;
      },
    }),
  ]);
}

export function buildPilotageRowsFromClients(
  clients: Client[],
  appointments: Appointment[] = []
): PilotageRow[] {
  return clients.slice(0, 6).map((client) => {
    const related = appointments.filter(
      (apt) =>
        apt.clientId === client.id ||
        apt.clientEmail?.trim().toLowerCase() === client.email.trim().toLowerCase() ||
        apt.clientName === client.name
    );

    const pendingDeposit = related.find(
      (apt) => !apt.depositPaid && (apt.deposit ?? 0) > 0 && apt.status !== 'cancelled'
    );
    const paidDeposit = related.find((apt) => apt.depositPaid && (apt.deposit ?? 0) > 0);

    let status: PilotageRowStatus = 'Payé';
    if (pendingDeposit) {
      status = 'En attente';
    } else if (related.some((apt) => apt.status === 'pending' && !apt.depositPaid)) {
      status = 'Relance';
    }

    const budget =
      pendingDeposit?.deposit ??
      paidDeposit?.deposit ??
      (client.totalSpent > 0 ? Math.min(client.totalSpent, 250) : 0);

    return {
      id: client.id,
      clientName: client.name,
      clientEmail: client.email,
      clientAvatar: client.avatar,
      clientStatus: client.status,
      status,
      team: client.preferences?.preferredArtist?.trim() || 'Studio',
      budget,
    };
  });
}

export interface DashboardOverviewPilotageTableProps {
  title?: string;
  meta?: DashboardOverviewHeroMeta | null;
  clients?: Client[];
  appointments?: Appointment[];
  rows?: PilotageRow[];
  className?: string;
  onOpenClient?: (row: PilotageRow) => void;
}

/** Tableau pilotage — fiches client en tête de Vue d’ensemble (dashboard). */
export function DashboardOverviewPilotageTable({
  title = 'Vue d’ensemble',
  meta = null,
  clients = [],
  appointments = [],
  rows,
  className,
  onOpenClient,
}: DashboardOverviewPilotageTableProps) {
  const resolvedRows = useMemo(() => {
    if (rows?.length) return rows;
    if (clients.length > 0) return buildPilotageRowsFromClients(clients, appointments);
    return DEFAULT_ROWS;
  }, [rows, clients, appointments]);

  const columns = useMemo(() => createColumns(onOpenClient), [onOpenClient]);

  const [rowSelection, setRowSelection] = useState({});

  const table = useTable({
    features,
    data: resolvedRows,
    columns,
    enableRowSelection: true,
    getRowId: (row: PilotageRow) => row.id,
    onRowSelectionChange: setRowSelection,
    state: { rowSelection },
  });

  const totalBudget = useMemo(
    () => resolvedRows.reduce((sum, row) => sum + row.budget, 0),
    [resolvedRows]
  );

  const formattedTotal = new Intl.NumberFormat('fr-FR', {
    currency: 'EUR',
    maximumFractionDigits: 0,
    style: 'currency',
  }).format(totalBudget);

  const subtitle = meta
    ? `${meta.dateLabel}${meta.firstName ? ` · ${meta.greeting}, ${meta.firstName}` : ''}`
    : 'Pilotage du jour : fiches client, acomptes et statuts';

  return (
    <Card className={className}>
      <CardHeader className="border-b border-border pb-4">
        <CardTitle
          id="dashboard-tab-hero-title"
          className="text-xl font-bold tracking-tight sm:text-2xl"
        >
          {title}
        </CardTitle>
        <CardDescription>{subtitle}</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent">
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder ? null : <FlexRender header={header} />}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
                  {row.getAllCells().map((cell) => (
                    <TableCell key={cell.id}>
                      <FlexRender cell={cell} />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={COLUMN_COUNT}
                  className="h-24 text-center text-muted-foreground"
                >
                  Aucun client.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
          <TableFooter>
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={4}>Total acomptes</TableCell>
              <TableCell className="text-right font-semibold tabular-nums">
                {formattedTotal}
              </TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </CardContent>
    </Card>
  );
}
