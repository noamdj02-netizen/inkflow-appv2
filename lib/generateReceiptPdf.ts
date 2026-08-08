/**
 * Reçu / facture d'acompte PDF — même charte que le devis (zinc + bleu).
 */
import type { Appointment } from '../types';
import type { User } from '../types';
import { savePdfToClientDossier } from './clientDossierDocuments';
import { downloadBlobAsFile } from './studioDataExport';
import {
  PDF_DOC,
  pdfDrawDocumentFooter,
  pdfDrawDocumentHeader,
  pdfFillPageBg,
} from './pdfDocumentTheme';
import { PDF_INK, PDF_SIZE, pdfSetTextColor, drawPdfKeyValueRows } from './pdfTypography';
import { devisNumber } from './generateDevis';
import { formatEUR } from './financeDisplay';

export interface ReceiptPdfOptions {
  appointment: Appointment;
  artist: User;
  studioId?: string | null;
}

export interface BuiltPdfDocument {
  blob: Blob;
  filename: string;
  documentNumber: string;
}

export async function buildReceiptPdf(opts: ReceiptPdfOptions): Promise<BuiltPdfDocument> {
  const { appointment, artist } = opts;
  const { default: jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const L = 20;
  const R = W - 20;

  const docNum = devisNumber(appointment.id).replace(/^INK-/, 'REC-');
  const emissionDate = new Date().toLocaleDateString('fr-FR');

  pdfFillPageBg(doc, W, H);

  let y = pdfDrawDocumentHeader(doc, {
    w: W,
    left: L,
    right: R,
    studioName: (artist.studioName || 'InkFlow').slice(0, 28),
    docTitle: 'REÇU',
    docNumber: docNum,
  });

  y += 4;
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  pdfSetTextColor(doc, PDF_INK.muted);
  doc.text(`Date d'émission : ${emissionDate}`, L, y);
  y += 14;

  const blockH = 32;
  doc.setFillColor(...PDF_DOC.cardBg);
  doc.setDrawColor(...PDF_DOC.border);
  doc.roundedRect(L, y, (R - L) / 2 - 3, blockH, 2, 2, 'FD');
  doc.roundedRect(L + (R - L) / 2 + 3, y, (R - L) / 2 - 3, blockH, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  pdfSetTextColor(doc, PDF_DOC.accent);
  doc.text('ARTISTE / STUDIO', L + 4, y + 6);
  doc.text('CLIENT', L + (R - L) / 2 + 7, y + 6);
  doc.setFontSize(9);
  pdfSetTextColor(doc, PDF_INK.ink);
  doc.text(artist.studioName || 'Studio', L + 4, y + 13);
  doc.text(appointment.clientName || 'Client', L + (R - L) / 2 + 7, y + 13);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  pdfSetTextColor(doc, PDF_INK.muted);
  if (artist.email) doc.text(artist.email, L + 4, y + 19);
  if (appointment.clientEmail) doc.text(appointment.clientEmail, L + (R - L) / 2 + 7, y + 19);

  y += blockH + 12;

  doc.setFillColor(...PDF_DOC.tableHeadBg);
  doc.rect(L, y, R - L, 7, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('DÉTAIL DE LA RÉSERVATION', L + 3, y + 4.8);
  y += 12;

  y = drawPdfKeyValueRows(doc, L, R - 2, 95, y, [
    { label: 'Date de séance', value: `${appointment.date} ${appointment.time}` },
    { label: 'Durée', value: `${appointment.duration} min` },
    { label: 'Prestation', value: appointment.service },
    { label: 'Montant total TTC', value: formatEUR(appointment.price) },
    { label: 'Acompte encaissé', value: formatEUR(appointment.deposit) },
    {
      label: 'Reste à payer',
      value: formatEUR(Math.max(0, appointment.price - appointment.deposit)),
    },
  ]);

  y += 6;
  doc.setFillColor(...PDF_DOC.accent);
  doc.roundedRect(L, y, R - L, 16, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(255, 255, 255);
  doc.text(`Acompte reçu : ${formatEUR(appointment.deposit)}`, L + 4, y + 10);
  y += 24;

  doc.setFontSize(PDF_SIZE.legal - 1);
  doc.setFont('helvetica', 'italic');
  pdfSetTextColor(doc, PDF_INK.muted);
  const legal = doc.splitTextToSize(
    'Reçu informatif InkFlow — complétez SIRET/TVA et mentions obligatoires sur vos pièces commerciales officielles. Ce PDF ne remplace pas une facture structurée Factur-X.',
    R - L
  );
  doc.text(legal, L, y);

  pdfDrawDocumentFooter(doc, {
    w: W,
    h: H,
    line: `Reçu N° ${docNum} — ${emissionDate} · InkFlow`,
  });

  const filename = `Recu_${docNum}_${(appointment.clientName || 'client').replace(/\s+/g, '_')}.pdf`;
  return { blob: doc.output('blob'), filename, documentNumber: docNum };
}

export interface GenerateReceiptResult {
  savedToDossier: boolean;
  dossierError?: string;
}

export async function generateReceiptPdf(opts: ReceiptPdfOptions): Promise<GenerateReceiptResult> {
  const built = await buildReceiptPdf(opts);
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
