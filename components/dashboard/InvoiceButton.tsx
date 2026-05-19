import React, { useState } from 'react';
import { FileText, Loader2 } from 'lucide-react';
import type { Appointment, User } from '../../types';
import { generateReceiptPdf } from '../../lib/generateReceiptPdf';
import { useToast } from '../../contexts/ToastContext';
import { cn } from '@/lib/utils';
import { dashboardBtnSecondary } from './ui/dashboardChrome';

interface InvoiceButtonProps {
  appointment: Appointment;
  artist: User;
  studioId?: string | null;
  className?: string;
}

export const InvoiceButton: React.FC<InvoiceButtonProps> = ({
  appointment,
  artist,
  studioId = null,
  className,
}) => {
  const toast = useToast();
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const result = await generateReceiptPdf({ appointment, artist, studioId });
      if (result.savedToDossier) {
        toast.success('Reçu téléchargé et enregistré dans le dossier client.');
      } else if (result.dossierError) {
        toast.success('Reçu téléchargé.');
        toast.error(`Dossier client : ${result.dossierError}`);
      } else {
        toast.success('Reçu téléchargé.');
      }
    } catch {
      toast.error('Erreur lors de la génération du PDF.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleGenerate}
      disabled={isGenerating}
      title="Générer le reçu PDF"
      className={cn(dashboardBtnSecondary, 'gap-2 px-3 py-2 text-sm', className)}
    >
      {isGenerating ? (
        <>
          <Loader2 className="size-4 animate-spin" /> Génération…
        </>
      ) : (
        <>
          <FileText className="size-4" /> Reçu PDF
        </>
      )}
    </button>
  );
};
