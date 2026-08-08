import React, { useState } from 'react';
import { FileText, Loader2 } from 'lucide-react';
import type { Appointment, User } from '../../types';
import { generateDevis } from '../../lib/generateDevis';
import { useToast } from '../../contexts/ToastContext';
import { cn } from '@/lib/utils';
import { dashboardBtnSecondary } from './ui/dashboardChrome';

interface DevisButtonProps {
  appointment: Appointment;
  artist: User;
  studioId?: string | null;
  variant?: 'icon' | 'full';
  className?: string;
}

export const DevisButton: React.FC<DevisButtonProps> = ({
  appointment,
  artist,
  studioId = null,
  variant = 'full',
  className,
}) => {
  const toast = useToast();
  const [loading, setLoading] = useState(false);

  const handleGenerate = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (loading) return;
    setLoading(true);
    try {
      const result = await generateDevis({ appointment, artist, studioId });
      if (result.savedToDossier) {
        toast.success('Devis téléchargé et enregistré dans le dossier client.');
      } else if (result.dossierError) {
        toast.success('Devis téléchargé.');
        toast.error(`Dossier client : ${result.dossierError}`);
      } else {
        toast.success('Devis téléchargé.');
      }
    } catch (err) {
      console.error('[DevisButton]', err);
      toast.error('Erreur lors de la génération du devis.');
    } finally {
      setLoading(false);
    }
  };

  if (variant === 'icon') {
    return (
      <button
        type="button"
        onClick={handleGenerate}
        disabled={loading}
        title="Générer le devis PDF"
        className={
          className ??
          'rounded-lg p-2 text-zinc-500 transition-colors hover:bg-blue-50 hover:text-blue-600 disabled:opacity-50 dark:hover:bg-blue-950/40 dark:hover:text-blue-400'
        }
      >
        {loading ? <Loader2 className="size-4 animate-spin" /> : <FileText className="size-4" />}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleGenerate}
      disabled={loading}
      className={cn(dashboardBtnSecondary, 'gap-2 px-3 py-2 text-sm', className)}
    >
      {loading ? (
        <>
          <Loader2 className="size-4 animate-spin" /> Génération…
        </>
      ) : (
        <>
          <FileText className="size-4" /> Devis PDF
        </>
      )}
    </button>
  );
};
