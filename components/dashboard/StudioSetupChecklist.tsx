import React, { useMemo, useState, useCallback } from 'react';
import { CheckCircle2, Circle, ChevronRight, X, Sparkles } from 'lucide-react';
import type { Appointment, FlashDesign } from '../../types';

interface StudioSetupChecklistProps {
  studioSlug: string | null | undefined;
  flashDesigns: FlashDesign[];
  appointments: Appointment[];
  /** false = afficher l’étape « Disponibilités » ; undefined = en cours de chargement ou hors Supabase (on n’affiche pas l’étape) */
  availabilitySetupComplete?: boolean;
  /** false = afficher l’étape « Paiements / Stripe » ; undefined = chargement ou hors Supabase */
  paymentsSetupComplete?: boolean;
  onGoTo: (target: 'settings-vitrine' | 'settings-availability' | 'settings-payments' | 'flash' | 'appointments') => void;
}

const STORAGE_KEY = 'inkflow-dismiss-setup-checklist';

export const StudioSetupChecklist: React.FC<StudioSetupChecklistProps> = ({
  studioSlug,
  flashDesigns,
  appointments,
  availabilitySetupComplete,
  paymentsSetupComplete,
  onGoTo,
}) => {
  const [dismissed, setDismissed] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === '1';
    } catch {
      return false;
    }
  });

  const items = useMemo(() => {
    const out: { id: string; label: string; action: () => void }[] = [];
    if (!studioSlug?.trim()) {
      out.push({
        id: 'slug',
        label: 'Définir votre lien vitrine (URL publique)',
        action: () => onGoTo('settings-vitrine'),
      });
    }
    if (flashDesigns.length === 0) {
      out.push({
        id: 'flash',
        label: 'Ajouter au moins un flash à la galerie',
        action: () => onGoTo('flash'),
      });
    }
    if (appointments.length === 0) {
      out.push({
        id: 'rdv',
        label: 'Créer un premier rendez-vous',
        action: () => onGoTo('appointments'),
      });
    }
    if (availabilitySetupComplete === false) {
      out.push({
        id: 'availability',
        label: 'Enregistrer vos horaires et créneaux (réservation en ligne)',
        action: () => onGoTo('settings-availability'),
      });
    }
    return out;
  }, [studioSlug, flashDesigns.length, appointments.length, availabilitySetupComplete, onGoTo]);

  const handleDismiss = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEY, '1');
    } catch {
      //
    }
    setDismissed(true);
  }, []);

  if (dismissed || items.length === 0) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-emerald-200/80 dark:border-emerald-500/25 bg-gradient-to-br from-emerald-50/90 to-white dark:from-emerald-950/30 dark:to-zinc-900/80 p-4 sm:p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">
            <Sparkles className="w-4 h-4" aria-hidden />
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-zinc-900 dark:text-white text-sm sm:text-base">Configurer votre studio</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Étapes pour être prêt à recevoir des clients en ligne.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleDismiss}
          className="p-2 rounded-xl text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-white/60 dark:hover:bg-zinc-800/50 transition-colors shrink-0"
          aria-label="Masquer cette liste"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item.id}>
            <button
              type="button"
              onClick={item.action}
              className="w-full flex items-center gap-3 text-left px-3 py-2.5 rounded-xl bg-white/70 dark:bg-zinc-900/50 border border-zinc-200/60 dark:border-zinc-800 hover:border-emerald-300 dark:hover:border-emerald-500/50 transition-all active:scale-[0.99] min-h-[44px]"
            >
              <Circle className="w-5 h-5 text-emerald-500 dark:text-emerald-400/80 shrink-0" aria-hidden />
              <span className="flex-1 text-sm text-zinc-800 dark:text-zinc-200">{item.label}</span>
              <ChevronRight className="w-4 h-4 text-zinc-400 shrink-0" aria-hidden />
            </button>
          </li>
        ))}
      </ul>
      <p className="text-[11px] text-zinc-500 dark:text-zinc-500 mt-3 flex items-center gap-1.5">
        <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-600 dark:text-emerald-500" aria-hidden />
        {(() => {
          const needAvail = availabilitySetupComplete === false;
          const needPay = paymentsSetupComplete === false;
          if (needAvail && needPay) return 'Paramètres → Disponibilités et Paiements pour finaliser réservation + encaissement.';
          if (needAvail) return 'Acomptes Stripe : Paramètres → Paiements.';
          if (needPay) return 'Créneaux : Paramètres → Disponibilités.';
          return 'Paramètres regroupe aussi Disponibilités, Paiements (Stripe) et la page vitrine.';
        })()}
      </p>
    </div>
  );
};
