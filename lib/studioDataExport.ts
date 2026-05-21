import type { Appointment, Client } from '../types';
import { isInkflowProShellClient } from './nativeWebShell';

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

export function downloadTextFile(
  filename: string,
  content: string,
  mime = 'text/csv;charset=utf-8'
): void {
  const blob = new Blob(['\ufeff', content], { type: mime });
  downloadBlobAsFile(filename, blob);
}

/** iOS Safari, PWA standalone et WebView Inkflow Pro bloquent souvent `<a download>`. */
export function isPdfDownloadConstrainedEnvironment(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  const ios =
    /iPhone|iPad|iPod/i.test(ua) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const standalone =
    typeof window !== 'undefined' &&
    (window.matchMedia?.('(display-mode: standalone)')?.matches === true ||
      // @ts-expect-error — propriété iOS legacy
      window.navigator.standalone === true);
  const inkflowShell = isInkflowProShellClient();
  return ios || standalone || inkflowShell;
}

/** Ouvre un PDF (URL publique ou blob) — fallback mobile quand le téléchargement direct échoue. */
export function openPdfForUser(url: string, options?: { revokeAfterMs?: number }): boolean {
  if (typeof window === 'undefined' || !url) return false;
  try {
    const w = window.open(url, '_blank', 'noopener,noreferrer');
    if (w) return true;
  } catch {
    /* continue */
  }
  try {
    window.location.assign(url);
    return true;
  } catch {
    return false;
  }
}

/** Télécharge un Blob (PDF, CSV custom, etc.) avec repli ouverture onglet sur mobile. */
export function downloadBlobAsFile(filename: string, blob: Blob): boolean {
  const url = URL.createObjectURL(blob);
  const constrained = isPdfDownloadConstrainedEnvironment();

  if (constrained && typeof navigator.share === 'function') {
    const file = new File([blob], filename, { type: blob.type || 'application/pdf' });
    void navigator
      .share({ files: [file], title: filename })
      .then(() => URL.revokeObjectURL(url))
      .catch(() => {
        openPdfForUser(url, { revokeAfterMs: 60_000 });
        setTimeout(() => URL.revokeObjectURL(url), 60_000);
      });
    return true;
  }

  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  if (constrained) {
    openPdfForUser(url, { revokeAfterMs: 60_000 });
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
    return true;
  }

  setTimeout(() => URL.revokeObjectURL(url), 2500);
  return true;
}
