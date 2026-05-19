/**
 * Palette PDF InkFlow — zinc + bleu électrique (alignée dashboardChrome / pdfTypography).
 */
import type { jsPDF } from 'jspdf';
import { PDF_INK, pdfSetTextColor } from './pdfTypography';

export const PDF_DOC = {
  pageBg: [250, 250, 250] as const,
  headerBg: [9, 9, 11] as const,
  cardBg: [255, 255, 255] as const,
  tableHeadBg: [9, 9, 11] as const,
  tableSubheadBg: [244, 244, 245] as const,
  rowAltBg: [250, 250, 250] as const,
  border: [228, 228, 231] as const,
  accent: PDF_INK.primary,
  accentSoft: [239, 246, 255] as const,
  headerMuted: [161, 161, 170] as const,
  accentOnDark: [96, 165, 250] as const,
} as const;

export function pdfFillPageBg(doc: jsPDF, w: number, h: number): void {
  doc.setFillColor(...PDF_DOC.pageBg);
  doc.rect(0, 0, w, h, 'F');
}

export function pdfDrawDocumentHeader(
  doc: jsPDF,
  opts: {
    w: number;
    left: number;
    right: number;
    studioName: string;
    studioTagline?: string;
    docTitle: string;
    docNumber: string;
  }
): number {
  const headerH = 38;
  doc.setFillColor(...PDF_DOC.headerBg);
  doc.rect(0, 0, opts.w, headerH, 'F');
  doc.setFillColor(...PDF_DOC.accent);
  doc.rect(0, headerH, opts.w, 1.2, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text(opts.studioName, opts.left, 22);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  pdfSetTextColor(doc, PDF_DOC.headerMuted);
  doc.text(opts.studioTagline ?? 'Tatouage sur mesure', opts.left, 29);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  pdfSetTextColor(doc, PDF_DOC.accentOnDark);
  doc.text(opts.docTitle, opts.right, 20, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  pdfSetTextColor(doc, PDF_DOC.headerMuted);
  doc.text(`N° ${opts.docNumber}`, opts.right, 27, { align: 'right' });

  return headerH + 12;
}

export function pdfDrawDocumentFooter(
  doc: jsPDF,
  opts: { w: number; h: number; line: string }
): void {
  const footerH = 12;
  doc.setFillColor(...PDF_DOC.headerBg);
  doc.rect(0, opts.h - footerH, opts.w, footerH, 'F');
  doc.setFillColor(...PDF_DOC.accent);
  doc.rect(0, opts.h - footerH, opts.w, 0.8, 'F');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  pdfSetTextColor(doc, PDF_DOC.headerMuted);
  doc.text(opts.line, opts.w / 2, opts.h - 4.5, { align: 'center' });
}
