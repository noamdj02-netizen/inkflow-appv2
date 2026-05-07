import React, { useState } from 'react';
import { FileText, Download, Loader2 } from 'lucide-react';
import { Appointment } from '../../types';
import { User } from '../../types';
import { downloadBlobAsFile } from '../../lib/studioDataExport';
import { formatEUR } from '../../lib/financeDisplay';
import { PDF_INK, PDF_LEAD, PDF_SIZE, pdfSetTextColor } from '../../lib/pdfTypography';

interface InvoiceButtonProps {
  appointment: Appointment;
  artist: User;
}

export const InvoiceButton: React.FC<InvoiceButtonProps> = ({ appointment, artist }) => {
  const [isGenerating, setIsGenerating] = useState(false);

  const generateInvoice = async () => {
    setIsGenerating(true);
    try {
      const { default: jsPDF } = await import('jspdf');
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const gutter = 20;
      let yPos: number;

      const headerH = 46;
      doc.setFillColor(9, 9, 11);
      doc.rect(0, 0, pageWidth, headerH, 'F');
      doc.setFillColor(PDF_INK.primary[0], PDF_INK.primary[1], PDF_INK.primary[2]);
      doc.rect(0, headerH - 3, pageWidth, 3, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(21);
      doc.setFont('helvetica', 'bold');
      doc.text('INKFLOW', gutter, 28);
      doc.setFont('times', 'normal');
      doc.setFontSize(10);
      doc.text("Reçu d'acompte", pageWidth - gutter, 28, { align: 'right' });

      yPos = headerH + 16;
      pdfSetTextColor(doc, PDF_INK.ink);

      const sectionLabel = (title: string) => {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.text(title, gutter, yPos);
        yPos += 9;
      };

      sectionLabel('Artiste');
      doc.setFont('times', 'normal');
      doc.setFontSize(10);
      doc.text(artist.studioName || 'Studio', gutter, yPos);
      yPos += 11;

      doc.setDrawColor(228, 231, 236);
      doc.setLineWidth(0.35);
      doc.line(gutter, yPos, pageWidth - gutter, yPos);
      yPos += 12;

      sectionLabel('Client');
      doc.setFont('times', 'normal');
      doc.setFontSize(10);
      doc.text(appointment.clientName || 'Non renseigné', gutter, yPos);
      yPos += 6;
      doc.text(appointment.clientEmail || '—', gutter, yPos);
      if (appointment.clientPhone) {
        yPos += 6;
        doc.text(appointment.clientPhone, gutter, yPos);
      }
      yPos += 13;

      sectionLabel('Détails de la réservation');
      doc.setFont('times', 'normal');
      doc.setFontSize(10);
      const dateStr = `${appointment.date} ${appointment.time}`;
      doc.text(`Date : ${dateStr}`, gutter, yPos);
      yPos += 6;
      doc.text(`Durée : ${appointment.duration} minutes`, gutter, yPos);
      yPos += 6;
      doc.text(`Service : ${appointment.service}`, gutter, yPos);
      yPos += 13;

      doc.line(gutter, yPos, pageWidth - gutter, yPos);
      yPos += 12;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('Montants', gutter, yPos);
      yPos += 9;
      doc.setFont('times', 'normal');
      doc.setFontSize(10);

      const totalAmount = appointment.price;
      const depositAmount = appointment.deposit;
      const remainingAmount = totalAmount - depositAmount;

      pdfSetTextColor(doc, PDF_INK.muted);
      doc.text(`Total : ${formatEUR(totalAmount)}`, gutter, yPos);
      yPos += 6;
      doc.text(`Acompte : ${formatEUR(depositAmount)}`, gutter, yPos);
      yPos += 6;
      pdfSetTextColor(doc, PDF_INK.ink);
      doc.text(`Reste à payer : ${formatEUR(remainingAmount)}`, gutter, yPos);
      yPos += 14;

      doc.setDrawColor(PDF_INK.primary[0], PDF_INK.primary[1], PDF_INK.primary[2]);
      doc.setFillColor(248, 250, 252);
      const boxTop = yPos - 5;
      doc.roundedRect(gutter, boxTop, pageWidth - gutter * 2, 22, 1.6, 1.6, 'FD');
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      pdfSetTextColor(doc, PDF_INK.ink);
      doc.text(`Acompte : ${formatEUR(depositAmount)}`, gutter + 4, boxTop + 14);

      yPos = boxTop + 30;
      doc.setFontSize(PDF_SIZE.legal - 1);
      doc.setFont('times', 'italic');
      pdfSetTextColor(doc, PDF_INK.subtle);
      const legalFoot = doc.splitTextToSize(
        'Reçu informatif InkFlow — complétez SIRET/TVA et mentions obligatoires sur vos pièces commerciales officielles. Facturation électronique / Factur‑X / PDP : ce PDF ne constitue pas un fichier structuré ni un envoi vers une plateforme obligatoire.',
        pageWidth - gutter * 2
      );
      doc.text(legalFoot, gutter, yPos);
      yPos += legalFoot.length * PDF_LEAD.legal + 8;
      doc.setFontSize(8);
      doc.setFont('times', 'normal');
      pdfSetTextColor(doc, PDF_INK.subtle);
      doc.text(`Date d'émission : ${new Date().toLocaleDateString('fr-FR')}`, gutter, yPos);
      doc.text('InkFlow — Document généré automatiquement', pageWidth - gutter, yPos, {
        align: 'right',
      });
      pdfSetTextColor(doc, PDF_INK.ink);

      doc.setFontSize(PDF_SIZE.footer);
      pdfSetTextColor(doc, PDF_INK.subtle);
      doc.text('ink-flow.me · app.ink-flow.me', pageWidth / 2, pageHeight - 10, {
        align: 'center',
      });

      const pdfBlob = doc.output('blob');
      const safeId = appointment.id.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 24) || 'rdv';
      downloadBlobAsFile(`inkflow-recu-acompte-${safeId}.pdf`, pdfBlob);
    } catch {
      alert('Erreur lors de la génération du PDF.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <button
      onClick={generateInvoice}
      disabled={isGenerating}
      className="flex items-center gap-2 px-4 py-2 rounded-lg border border-neutral-200 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700 text-sm font-medium disabled:opacity-50"
      title="Générer le reçu PDF"
    >
      {isGenerating ? (
        <>
          <Loader2 size={16} className="animate-spin" /> Génération...
        </>
      ) : (
        <>
          <FileText size={16} /> Reçu PDF <Download size={14} />
        </>
      )}
    </button>
  );
};
