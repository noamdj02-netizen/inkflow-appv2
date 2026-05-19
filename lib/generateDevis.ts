/**
 * Devis PDF InkFlow — zinc + bleu électrique, sauvegarde dossier client optionnelle.
 */
import type { Appointment } from '../types';
import type { User } from '../types';
import { downloadBlobAsFile } from './studioDataExport';
import { savePdfToClientDossier } from './clientDossierDocuments';
import {
  PDF_DOC,
  pdfDrawDocumentFooter,
  pdfDrawDocumentHeader,
  pdfFillPageBg,
} from './pdfDocumentTheme';
import { PDF_INK, pdfSetTextColor } from './pdfTypography';

export interface DevisOptions {
  appointment: Appointment;
  artist: User;
  projectDescription?: string;
  notes?: string;
  studioId?: string | null;
}

export interface BuiltPdfDocument {
  blob: Blob;
  filename: string;
  documentNumber: string;
}

function pad(n: number, len = 2): string {
  return String(n).padStart(len, '0');
}

export function devisNumber(appointmentId: string): string {
  const now = new Date();
  const suffix = appointmentId.slice(-4).toUpperCase();
  return `INK-${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${suffix}`;
}

function frDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

function frDateNow(): string {
  const now = new Date();
  return `${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()}`;
}

function frDatePlus30(): string {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

function trunc(s: string, max: number): string {
  if (!s) return '';
  return s.length > max ? `${s.slice(0, max - 1)}…` : s;
}

export async function buildDevisPdf(opts: DevisOptions): Promise<BuiltPdfDocument> {
  const { appointment: apt, artist, projectDescription, notes } = opts;
  const { default: jsPDF } = await import('jspdf');

  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const L = 20;
  const R = W - 20;
  const COL2 = W / 2 + 5;

  const devNum = devisNumber(apt.id);
  const emissionDate = frDateNow();
  const validityDate = frDatePlus30();

  pdfFillPageBg(doc, W, H);

  let y = pdfDrawDocumentHeader(doc, {
    w: W,
    left: L,
    right: R,
    studioName: trunc(artist.studioName || 'InkFlow', 28),
    docTitle: 'DEVIS',
    docNumber: devNum,
  });

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  pdfSetTextColor(doc, PDF_INK.muted);
  doc.text("Date d'émission : ", L, y);
  pdfSetTextColor(doc, PDF_INK.ink);
  doc.setFont('helvetica', 'bold');
  doc.text(emissionDate, L + 35, y);

  doc.setFont('helvetica', 'normal');
  pdfSetTextColor(doc, PDF_INK.muted);
  doc.text("Valable jusqu'au : ", COL2, y);
  pdfSetTextColor(doc, PDF_INK.ink);
  doc.setFont('helvetica', 'bold');
  doc.text(validityDate, COL2 + 35, y);

  y += 12;

  const blockTop = y;
  const blockH = 36;

  const drawPartyCard = (x: number, label: string, lines: string[]) => {
    doc.setFillColor(...PDF_DOC.cardBg);
    doc.setDrawColor(...PDF_DOC.border);
    doc.setLineWidth(0.3);
    doc.roundedRect(x, blockTop, 80, blockH, 2, 2, 'FD');
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    pdfSetTextColor(doc, PDF_DOC.accent);
    doc.text(label, x + 4, blockTop + 6);
    lines.forEach((line, i) => {
      doc.setFont('helvetica', i === 0 ? 'bold' : 'normal');
      doc.setFontSize(i === 0 ? 9.5 : 8.5);
      pdfSetTextColor(doc, i === 0 ? PDF_INK.ink : PDF_INK.muted);
      doc.text(line, x + 4, blockTop + 13 + i * 6);
    });
  };

  const siretOrPhone = artist.siret
    ? `SIRET ${artist.siret.replace(/(\d{3})(\d{3})(\d{3})(\d{5})/, '$1 $2 $3 $4')}`
    : artist.phone
      ? String(artist.phone)
      : '';

  drawPartyCard(
    L,
    'ARTISTE / STUDIO',
    [
      trunc(artist.studioName || 'Studio', 30),
      ...(artist.email ? [trunc(artist.email, 35)] : []),
      ...(siretOrPhone ? [siretOrPhone] : []),
    ].filter(Boolean)
  );

  drawPartyCard(
    COL2 - 5,
    'CLIENT',
    [
      trunc(apt.clientName || 'Client', 30),
      ...(apt.clientEmail ? [trunc(apt.clientEmail, 35)] : []),
      ...(apt.clientPhone ? [apt.clientPhone] : []),
    ].filter(Boolean)
  );

  y = blockTop + blockH + 10;

  doc.setFillColor(...PDF_DOC.tableHeadBg);
  doc.rect(L, y, R - L, 7, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('PRESTATION', L + 3, y + 4.8);
  y += 7;

  const C1 = L;
  const C2 = L + 60;
  const C3 = R - 28;
  doc.setFillColor(...PDF_DOC.tableSubheadBg);
  doc.rect(L, y, R - L, 6, 'F');
  pdfSetTextColor(doc, PDF_INK.muted);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('SERVICE', C1 + 3, y + 4.2);
  doc.text('DÉTAILS', C2, y + 4.2);
  doc.text('MONTANT', C3, y + 4.2, { align: 'right' });
  y += 6;

  const rowH = projectDescription ? 26 : 18;
  doc.setFillColor(...PDF_DOC.cardBg);
  doc.setDrawColor(...PDF_DOC.border);
  doc.setLineWidth(0.25);
  doc.rect(L, y, R - L, rowH, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  pdfSetTextColor(doc, PDF_INK.ink);
  doc.text(trunc(apt.service || 'Tatouage', 22), C1 + 3, y + 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  pdfSetTextColor(doc, PDF_INK.muted);
  const details: string[] = [];
  if (apt.date) details.push(`Séance : ${frDate(apt.date)}${apt.time ? ` à ${apt.time}` : ''}`);
  if (apt.duration) details.push(`Durée estimée : ${apt.duration} min`);
  if (apt.location && apt.location !== 'other') details.push(`Placement : ${apt.location}`);
  if (apt.size) details.push(`Taille : ${apt.size}`);
  details.forEach((d, i) => doc.text(d, C2, y + 6 + i * 5));

  if (projectDescription) {
    doc.setFontSize(7.5);
    const descLines = doc.splitTextToSize(trunc(projectDescription, 120), C2 - C1 - 6);
    doc.text(descLines, C1 + 3, y + 14);
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  pdfSetTextColor(doc, PDF_INK.ink);
  doc.text(`${apt.price.toLocaleString('fr-FR')} €`, C3, y + 7, { align: 'right' });

  y += rowH;

  const deposit = apt.deposit || 0;
  const remaining = Math.max(0, apt.price - deposit);
  const depositPct = deposit > 0 && apt.price > 0 ? Math.round((deposit / apt.price) * 100) : 0;

  interface FinRow {
    label: string;
    value: string;
    bold?: boolean;
    accent?: boolean;
  }
  const finRows: FinRow[] = [
    { label: 'Total HT', value: `${apt.price.toLocaleString('fr-FR')} €` },
    { label: 'TVA (exonération art. 293B CGI)', value: '0,00 €' },
    { label: 'TOTAL TTC', value: `${apt.price.toLocaleString('fr-FR')} €`, bold: true },
    {
      label: `Acompte (${depositPct}%)`,
      value: `${deposit.toLocaleString('fr-FR')} €`,
      accent: true,
    },
    {
      label: 'Reste à payer à la séance',
      value: `${remaining.toLocaleString('fr-FR')} €`,
      bold: true,
    },
  ];

  const finW = 105;
  const finX = R - finW;
  const rh = 6.5;

  finRows.forEach((row) => {
    if (row.accent) {
      doc.setFillColor(...PDF_DOC.accent);
    } else if (row.bold) {
      doc.setFillColor(...PDF_DOC.tableSubheadBg);
    } else {
      doc.setFillColor(...PDF_DOC.cardBg);
    }
    doc.setDrawColor(...PDF_DOC.border);
    doc.setLineWidth(0.25);
    doc.rect(finX, y, finW, rh, 'FD');

    doc.setFontSize(8);
    doc.setFont('helvetica', row.bold ? 'bold' : 'normal');
    if (row.accent) {
      doc.setTextColor(255, 255, 255);
    } else {
      pdfSetTextColor(doc, row.bold ? PDF_INK.ink : PDF_INK.muted);
    }
    doc.text(row.label, finX + 3, y + 4.5);

    doc.setFont('helvetica', 'bold');
    if (row.accent) {
      doc.setTextColor(255, 255, 255);
    } else {
      pdfSetTextColor(doc, PDF_INK.ink);
    }
    doc.text(row.value, R - 2, y + 4.5, { align: 'right' });
    y += rh;
  });

  y += 10;

  const noteText = notes || apt.notes || '';
  if (noteText) {
    const noteLines = doc.splitTextToSize(noteText, R - L - 6);
    const noteH = 10 + noteLines.length * 5;
    doc.setFillColor(...PDF_DOC.cardBg);
    doc.setDrawColor(...PDF_DOC.border);
    doc.roundedRect(L, y, R - L, noteH, 2, 2, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    pdfSetTextColor(doc, PDF_DOC.accent);
    doc.text('NOTES', L + 3, y + 5.5);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    pdfSetTextColor(doc, PDF_INK.ink);
    doc.text(noteLines, L + 3, y + 11);
    y += noteH + 8;
  }

  const conditions = [
    "• Ce devis est valable 30 jours à compter de la date d'émission.",
    "• L'acompte est requis pour confirmer le rendez-vous et réserver le créneau.",
    "• L'acompte n'est pas remboursable en cas d'annulation moins de 48h avant la séance.",
    '• Le tatoueur est exonéré de TVA (art. 293B du Code Général des Impôts).',
  ];
  const condH = 8 + conditions.length * 5;
  doc.setFillColor(...PDF_DOC.rowAltBg);
  doc.setDrawColor(...PDF_DOC.border);
  doc.roundedRect(L, y, R - L, condH, 2, 2, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  pdfSetTextColor(doc, PDF_INK.muted);
  doc.text('CONDITIONS GÉNÉRALES', L + 3, y + 5);
  conditions.forEach((c, i) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    pdfSetTextColor(doc, PDF_INK.muted);
    doc.text(c, L + 3, y + 11 + i * 5);
  });

  y += condH + 12;

  if (y > H - 55) {
    doc.addPage();
    pdfFillPageBg(doc, W, H);
    y = 20;
  }

  const sigW = 78;
  const sigH = 28;

  const drawSig = (x: number, title: string, subtitle: string) => {
    doc.setFillColor(...PDF_DOC.cardBg);
    doc.setDrawColor(...PDF_DOC.border);
    doc.roundedRect(x, y, sigW, sigH, 2, 2, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    pdfSetTextColor(doc, PDF_DOC.accent);
    doc.text(title, x + 3, y + 6);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    pdfSetTextColor(doc, PDF_INK.muted);
    doc.text(subtitle, x + 3, y + 12);
    doc.setDrawColor(...PDF_DOC.border);
    doc.setLineWidth(0.3);
    doc.line(x + 3, y + sigH - 4, x + sigW - 3, y + sigH - 4);
  };

  drawSig(L, "Signature de l'artiste", artist.studioName || '');
  drawSig(R - sigW, 'Bon pour accord — Client', trunc(apt.clientName || '', 28));

  pdfDrawDocumentFooter(doc, {
    w: W,
    h: H,
    line: `Devis N° ${devNum} — Émis le ${emissionDate} via InkFlow (app.ink-flow.me)`,
  });

  const filename = `Devis_${devNum}_${(apt.clientName || 'client').replace(/\s+/g, '_')}.pdf`;
  const blob = doc.output('blob');

  return { blob, filename, documentNumber: devNum };
}

export interface GenerateDevisResult {
  savedToDossier: boolean;
  dossierError?: string;
}

/** Génère, télécharge et enregistre le devis dans le dossier client si possible. */
export async function generateDevis(opts: DevisOptions): Promise<GenerateDevisResult> {
  const built = await buildDevisPdf(opts);
  downloadBlobAsFile(built.filename, built.blob);

  const clientId = opts.appointment.clientId?.trim();
  if (!opts.studioId || !clientId) {
    return { savedToDossier: false };
  }

  const saved = await savePdfToClientDossier({
    studioId: opts.studioId,
    clientId,
    filename: built.filename,
    blob: built.blob,
  });

  if ('error' in saved) {
    return { savedToDossier: false, dossierError: saved.error };
  }
  return { savedToDossier: true };
}
