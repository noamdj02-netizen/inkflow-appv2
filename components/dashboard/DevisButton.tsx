import React, { useState } from 'react';
import { FileText, Loader2 } from 'lucide-react';
import { Appointment, User } from '../../types';
import { generateDevis } from '../../lib/generateDevis';

interface DevisButtonProps {
  appointment: Appointment;
  artist: User;
  /** Variant compact (icône seule) ou full (icône + texte) */
  variant?: 'icon' | 'full';
  className?: string;
}

export const DevisButton: React.FC<DevisButtonProps> = ({
  appointment,
  artist,
  variant = 'full',
  className,
}) => {
  const [loading, setLoading] = useState(false);

  const handleGenerate = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (loading) return;
    setLoading(true);
    try {
      await generateDevis({ appointment, artist });
    } catch (err) {
      console.error('[DevisButton]', err);
      alert('Erreur lors de la génération du devis.');
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
        className={className ?? 'p-2 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10 disabled:opacity-50 transition-colors'}
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleGenerate}
      disabled={loading}
      className={className ?? 'inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200/80 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-slate-700 dark:text-zinc-300 hover:border-blue-300 dark:hover:border-blue-500/40 hover:text-blue-600 dark:hover:text-blue-400 text-sm font-medium disabled:opacity-50 transition-all active:scale-[0.97]'}
    >
      {loading ? (
        <><Loader2 className="w-4 h-4 animate-spin" /> Génération...</>
      ) : (
        <><FileText className="w-4 h-4" /> Devis PDF</>
      )}
    </button>
  );
};
