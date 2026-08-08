import React, { useMemo, useState } from 'react';
import {
  createColumnHelper,
  FlexRender,
  rowSelectionFeature,
  tableFeatures,
  useTable,
} from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
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
import { demoCaption, demoMicro } from './landingDemoUi';

type BookingRow = {
  id: string;
  project: string;
  status: 'Payé' | 'En attente' | 'Relance' | 'Échoué';
  team: string;
  budget: number;
};

const BOOKING_ROWS: BookingRow[] = [
  { id: '1', project: 'Manchette florale', status: 'Payé', team: 'Alex', budget: 120 },
  { id: '2', project: 'Flash minimal', status: 'En attente', team: 'Alex', budget: 60 },
  { id: '3', project: 'Retouche bras', status: 'Payé', team: 'Alex', budget: 80 },
  { id: '4', project: 'Projet dos', status: 'Relance', team: 'Alex', budget: 200 },
];

const features = tableFeatures({
  rowSelectionFeature,
});

const columnHelper = createColumnHelper<typeof features, BookingRow>();

function getStatusColor(status: BookingRow['status']) {
  switch (status) {
    case 'Payé':
      return 'bg-emerald-500';
    case 'En attente':
      return 'bg-amber-500';
    case 'Relance':
      return 'bg-white/40';
    case 'Échoué':
      return 'bg-red-500';
    default:
      return 'bg-white/40';
  }
}

const columns = columnHelper.columns([
  columnHelper.display({
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        aria-label="Tout sélectionner"
        checked={
          table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && 'indeterminate')
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        className="size-3 border-white/25 data-checked:border-emerald-500 data-checked:bg-emerald-500"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        aria-label="Sélectionner la ligne"
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        className="size-3 border-white/25 data-checked:border-emerald-500 data-checked:bg-emerald-500"
      />
    ),
  }),
  columnHelper.accessor('project', {
    header: 'Demande',
    cell: ({ row }) => (
      <div className={`max-w-[120px] truncate font-medium text-white/90 ${demoCaption}`}>
        {row.getValue('project')}
      </div>
    ),
  }),
  columnHelper.accessor('status', {
    header: 'Statut',
    cell: ({ row }) => {
      const status = row.getValue('status') as BookingRow['status'];
      return (
        <Badge
          variant="outline"
          className={`h-5 gap-1 border-white/10 bg-white/[0.04] px-1.5 text-white/70 ${demoCaption}`}
        >
          <span
            aria-hidden
            className={`size-1.5 shrink-0 rounded-full ${getStatusColor(status)}`}
          />
          {status}
        </Badge>
      );
    },
  }),
  columnHelper.accessor('team', {
    header: 'Artiste',
    cell: ({ row }) => (
      <span className={`text-white/55 ${demoCaption}`}>{row.getValue('team')}</span>
    ),
  }),
  columnHelper.accessor('budget', {
    header: () => <div className="text-right">Acompte</div>,
    cell: ({ row }) => {
      const amount = Number(row.getValue('budget'));
      const formatted = new Intl.NumberFormat('fr-FR', {
        currency: 'EUR',
        maximumFractionDigits: 0,
        style: 'currency',
      }).format(amount);
      return (
        <div className={`text-right font-medium tabular-nums text-white/88 ${demoCaption}`}>
          {formatted}
        </div>
      );
    },
  }),
]);

/** Tableau pilotage acomptes — preview landing (#demo). */
export function LandingDemoOverviewTable() {
  const [tableData] = useState<BookingRow[]>(BOOKING_ROWS);
  const [rowSelection, setRowSelection] = useState({});

  const table = useTable({
    features,
    data: tableData,
    columns,
    enableRowSelection: true,
    getRowId: (row) => row.id,
    onRowSelectionChange: setRowSelection,
    state: { rowSelection },
  });

  const totalBudget = useMemo(
    () => tableData.reduce((sum, row) => sum + row.budget, 0),
    [tableData]
  );

  const formattedTotal = new Intl.NumberFormat('fr-FR', {
    currency: 'EUR',
    maximumFractionDigits: 0,
    style: 'currency',
  }).format(totalBudget);

  return (
    <div className="overflow-hidden rounded-[20px] border border-white/[0.08] bg-white/[0.04]">
      <div className="border-b border-white/[0.06] px-3 py-2">
        <p className={demoMicro}>Pilotage acomptes</p>
        <p className={`mt-0.5 ${demoCaption} text-white/45`}>
          Demandes du jour · sélection multiple
        </p>
      </div>

      <div className="landing-demo-table overflow-x-auto px-1 py-1 [&_[data-slot=table-head]]:h-7 [&_[data-slot=table-head]]:px-1.5 [&_[data-slot=table-head]]:text-[9px] [&_[data-slot=table-head]]:font-semibold [&_[data-slot=table-head]]:uppercase [&_[data-slot=table-head]]:tracking-wide [&_[data-slot=table-head]]:text-white/40 [&_[data-slot=table-cell]]:px-1.5 [&_[data-slot=table-cell]]:py-1.5 [&_[data-slot=table-row]]:border-white/[0.06] [&_[data-slot=table-row]:hover]:bg-white/[0.03]">
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
                <TableCell colSpan={columns.length} className="h-16 text-center text-white/40">
                  Aucune demande.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
          <TableFooter className="border-white/[0.06] bg-white/[0.02]">
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={4} className={`${demoCaption} font-medium text-white/55`}>
                Total acomptes
              </TableCell>
              <TableCell
                className={`text-right font-semibold tabular-nums text-emerald-400 ${demoCaption}`}
              >
                {formattedTotal}
              </TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </div>
    </div>
  );
}
