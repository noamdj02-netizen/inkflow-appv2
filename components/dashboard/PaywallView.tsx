import React from 'react';
import { CreditCard, Settings, Sparkles } from 'lucide-react';
import { Logo } from '../Logo';

interface PaywallViewProps {
  /** Callback au clic sur "Choisir mon plan" — redirige vers facturation ou Stripe */
  onChoosePlan: () => void;
  /** Callback pour accéder aux paramètres / facturation */
  onOpenBilling?: () => void;
}

export const PaywallView: React.FC<PaywallViewProps> = ({ onChoosePlan, onOpenBilling }) => {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-6 py-12">
      <div className="max-w-md w-full text-center">
        <div className="flex justify-center mb-6">
          <Logo size="lg" className="rounded-2xl" />
        </div>
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 text-sm font-medium mb-6">
          <Sparkles className="w-4 h-4" />
          Essai terminé
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] mb-4">
          Votre mois d&apos;essai gratuit est terminé
        </h1>
        <p className="text-[var(--text-secondary)] text-base leading-relaxed mb-2">
          Reprenez l’agenda, les réservations et les paiements en un clic : vos données restent en
          place, rien à reconfigurer.
        </p>
        <p className="text-[var(--text-tertiary)] text-sm leading-relaxed mb-8">
          Paiement sécurisé par Stripe — annulez quand vous voulez selon les conditions de votre
          formule.
        </p>
        <button
          onClick={onChoosePlan}
          className="w-full max-w-xs mx-auto flex items-center justify-center gap-3 px-8 py-4 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 rounded-2xl font-bold text-lg hover:opacity-90 active:scale-[0.98] transition-all shadow-lg"
        >
          <CreditCard className="w-6 h-6" />
          Voir les formules et continuer
        </button>
        {onOpenBilling && (
          <button
            onClick={onOpenBilling}
            className="mt-6 flex items-center justify-center gap-2 mx-auto text-sm text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
          >
            <Settings className="w-4 h-4" />
            Paramètres / Facturation
          </button>
        )}
      </div>
    </div>
  );
};
