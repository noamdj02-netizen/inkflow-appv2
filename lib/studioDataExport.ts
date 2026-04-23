import type { Appointment, Client } from '../types';

/** Échappe un champ pour CSV (RFC-style, guillemets si besoin). */
export function csvEscapeCell(value: string | number | boolean | null | undefined): string {
  const s = value === null || value === undefined ? '' : String(value);
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function buildClientsCsvRows(clients: Client[]): string {
  const headers = [
    'id',
    'name',
    'email',
    'phone',
    'status',
    'totalSpent',
    'appointmentsCount',
    'firstVisit',
    'lastVisit',
    'notes',
    'tags',
  ];
  const lines = [headers.join(',')];
  for (const c of clients) {
    lines.push(
      [
        csvEscapeCell(c.id),
        csvEscapeCell(c.name),
        csvEscapeCell(c.email),
        csvEscapeCell(c.phone),
        csvEscapeCell(c.status),
        csvEscapeCell(c.totalSpent),
        csvEscapeCell(c.appointmentsCount),
        csvEscapeCell(c.firstVisit),
        csvEscapeCell(c.lastVisit ?? ''),
        csvEscapeCell((c.notes ?? '').replace(/\s+/g, ' ').slice(0, 2000)),
        csvEscapeCell(c.tags.join('; ')),
      ].join(',')
    );
  }
  return lines.join('\r\n');
}

export function buildAppointmentsCsvRows(appointments: Appointment[]): string {
  const headers = [
    'id',
    'date',
    'time',
    'clientName',
    'clientEmail',
    'service',
    'status',
    'price',
    'deposit',
    'depositPaid',
    'duration',
  ];
  const lines = [headers.join(',')];
  for (const a of appointments) {
    lines.push(
      [
        csvEscapeCell(a.id),
        csvEscapeCell(a.date),
        csvEscapeCell(a.time ?? ''),
        csvEscapeCell(a.clientName),
        csvEscapeCell(a.clientEmail ?? ''),
        csvEscapeCell(a.service ?? ''),
        csvEscapeCell(a.status),
        csvEscapeCell(a.price),
        csvEscapeCell(a.deposit),
        csvEscapeCell(a.depositPaid ? 'oui' : 'non'),
        csvEscapeCell(a.duration ?? ''),
      ].join(',')
    );
  }
  return lines.join('\r\n');
}

/** Lignes pour export compta / tableur (RDV + espèces). */
export function buildFinanceLedgerCsv(
  rows: { date: string; type: string; label: string; detail: string; amount: number }[]
): string {
  const headers = ['date', 'type', 'libelle', 'detail', 'montant_eur'];
  const lines = [headers.join(',')];
  for (const r of rows) {
    lines.push(
      [
        csvEscapeCell(r.date),
        csvEscapeCell(r.type),
        csvEscapeCell(r.label),
        csvEscapeCell(r.detail),
        csvEscapeCell(r.amount),
      ].join(',')
    );
  }
  return lines.join('\r\n');
}

export function downloadTextFile(filename: string, content: string, mime = 'text/csv;charset=utf-8'): void {
  const blob = new Blob(['\ufeff', content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
