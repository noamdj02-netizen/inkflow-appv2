/**
 * Typographie PDF InkFlow (polices intégrées jsPDF : Helvetica, Times).
 * Hiérarchie type « rapport » : Times pour les paragraphes et libellés longs,
 * Helvetica pour titres, en-têtes de tableau et montants.
 */
import type { jsPDF } from 'jspdf';

export const PDF_INK = {
  primary: [37, 99, 235] as [number, number, number],
  ink: [17, 24, 39] as [number, number, number],
  muted: [82, 82, 91] as [number, number, number],
  subtle: [113, 113, 122] as [number, number, number],
} as const;

export const PDF_SIZE = {
  coverTitle: 21,
  coverKicker: 8.5,
  coverStudio: 12.5,
  meta: 9,
  intro: 9.25,
  section: 11,
  body: 9.5,
  bodyCompact: 9,
  tableHead: 7.75,
  tableCell: 7.65,
  legal: 8.25,
  footer: 7,
} as const;

export const PDF_LEAD = {
  intro: 4.45,
  body: 4.2,
  kv: 4,
  legal: 4.15,
  table: 3.35,
} as const;

export function pdfSetTextColor(doc: jsPDF, rgb: readonly [number, number, number]): void {
  doc.setTextColor(rgb[0], rgb[1], rgb[2]);
}

/** Titre de section avec bandeau zinc + barre gauche bleue InkFlow. Retourne la position Y suivante. */
export function drawPdfSectionTitle(
  doc: jsPDF,
  ml: number,
  width: number,
  y: number,
  title: string
): number {
  const bandH = 11;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(228, 231, 236);
  doc.setLineWidth(0.25);
  doc.roundedRect(ml, y - 4, width, bandH, 1.2, 1.2, 'FD');
  doc.setFillColor(PDF_INK.primary[0], PDF_INK.primary[1], PDF_INK.primary[2]);
  doc.rect(ml, y - 4, 2.2, bandH, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(PDF_SIZE.section);
  pdfSetTextColor(doc, PDF_INK.ink);
  doc.text(title, ml + 5.2, y + 3.2);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);
  return y + bandH + 5;
}

/** Bloc libellé → valeur (droite). Libellés Times, montants Helvetica bold. */
export function drawPdfKeyValueRows(
  doc: jsPDF,
  ml: number,
  rightX: number,
  maxLabelWidth: number,
  yStart: number,
  rows: { label: string; value: string }[]
): number {
  let y = yStart;
  const lh = PDF_LEAD.kv;
  doc.setFontSize(PDF_SIZE.bodyCompact);
  for (const row of rows) {
    doc.setFont('times', 'normal');
    pdfSetTextColor(doc, PDF_INK.muted);
    const labelLines = doc.splitTextToSize(row.label, maxLabelWidth);
    doc.text(labelLines, ml, y);
    doc.setFont('helvetica', 'bold');
    pdfSetTextColor(doc, PDF_INK.ink);
    doc.text(row.value, rightX, y + (labelLines.length - 1) * lh, {
      align: 'right',
    });
    doc.setFont('times', 'normal');
    doc.setTextColor(0, 0, 0);
    y +=
      Math.max(labelLines.length * lh, lh + 0.5) +
      Math.min(2.2 + (labelLines.length - 1) * 0.15, 2.8);
  }
  return y;
}

/** Style pied de page discret pour toutes les pages. */
export function applyPdfFooterLine(
  doc: jsPDF,
  pageCenterX: number,
  pageBottomY: number,
  line: string,
  totalPages: number,
  pageIndex: number
): void {
  doc.setFontSize(PDF_SIZE.footer);
  pdfSetTextColor(doc, PDF_INK.subtle);
  doc.setFont('times', 'italic');
  doc.text(
    `${line.replace(/\s+/g, ' ')} · ${pageIndex} / ${totalPages}`,
    pageCenterX,
    pageBottomY,
    {
      align: 'center',
    }
  );
  doc.setFont('times', 'normal');
  doc.setTextColor(0, 0, 0);
}
