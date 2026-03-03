import React, { useState } from 'react';
import { FileText, Download, Loader2 } from 'lucide-react';
import { Appointment } from '../../types';
import { User } from '../../types';

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
      let yPos = 20;

      const primaryColor: [number, number, number] = [23, 23, 23];
      const textColor: [number, number, number] = [23, 23, 23];
      const lightText: [number, number, number] = [115, 115, 115];

      doc.setFillColor(...primaryColor);
      doc.rect(0, 0, pageWidth, 40, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.text('INKFLOW', 20, 25);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('Reçu d\'Acompte', pageWidth - 20, 25, { align: 'right' });

      yPos = 50;
      doc.setTextColor(...textColor);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Artiste:', 20, yPos);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      yPos += 7;
      doc.text(artist.studioName || 'Studio', 20, yPos);
      yPos += 15;

      doc.setDrawColor(200, 200, 200);
      doc.line(20, yPos, pageWidth - 20, yPos);
      yPos += 10;

      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Client:', 20, yPos);
      doc.setFont('helvetica', 'normal');
      yPos += 7;
      doc.text(appointment.clientName || 'Non renseigné', 20, yPos);
      yPos += 6;
      doc.text(appointment.clientEmail, 20, yPos);
      if (appointment.clientPhone) {
        yPos += 6;
        doc.text(appointment.clientPhone, 20, yPos);
      }
      yPos += 15;

      doc.setFont('helvetica', 'bold');
      doc.text('Détails de la réservation:', 20, yPos);
      yPos += 10;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      const dateStr = `${appointment.date} ${appointment.time}`;
      doc.text(`Date: ${dateStr}`, 20, yPos);
      yPos += 6;
      doc.text(`Durée: ${appointment.duration} minutes`, 20, yPos);
      yPos += 6;
      doc.text(`Service: ${appointment.service}`, 20, yPos);
      yPos += 15;

      doc.line(20, yPos, pageWidth - 20, yPos);
      yPos += 10;

      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Montants:', 20, yPos);
      yPos += 10;
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');

      const totalAmount = appointment.price;
      const depositAmount = appointment.deposit;
      const remainingAmount = totalAmount - depositAmount;

      yPos += 7;
      doc.text(`Total: ${totalAmount}€`, 20, yPos);
      yPos += 7;
      doc.text(`Acompte: ${depositAmount}€`, 20, yPos);
      yPos += 7;
      doc.text(`Reste à payer: ${remainingAmount}€`, 20, yPos);
      yPos += 15;

      doc.setDrawColor(...primaryColor);
      doc.setLineWidth(0.5);
      doc.rect(20, yPos, pageWidth - 40, 20);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text(`Acompte: ${depositAmount}€`, 25, yPos + 12);

      yPos += 30;
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...lightText);
      doc.text(`Date d'émission: ${new Date().toLocaleDateString('fr-FR')}`, 20, yPos);
      doc.text('InkFlow - Reçu généré automatiquement', pageWidth - 20, yPos, { align: 'right' });

      const pdfBlob = doc.output('blob');
      const pdfUrl = URL.createObjectURL(pdfBlob);
      window.open(pdfUrl, '_blank');
      setTimeout(() => URL.revokeObjectURL(pdfUrl), 100);
    } catch (error) {
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
        <><Loader2 size={16} className="animate-spin" /> Génération...</>
      ) : (
        <><FileText size={16} /> Reçu PDF <Download size={14} /></>
      )}
    </button>
  );
};
