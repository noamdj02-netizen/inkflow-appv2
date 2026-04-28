import React, { useCallback, useState } from 'react';
import { CreditCard, Package, X } from 'lucide-react';
import type { Appointment } from '../../types';
import { createCheckoutSession } from '../../lib/stripeClient';
import { appointmentRemainingBalanceEuros } from '../../lib/appointmentBalance';
import { useToast } from '../../contexts/ToastContext';

export interface SessionCloseoutSheetProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: Appointment | null;
  studioId: string | null;
  studioSlug?: string | null;
  /** Stripe Connect prêt (même signal que le reste du dashboard). */
  stripeConnectReady: boolean;
  onGoToStockTrace: (appointmentId: string, clientId: string | null) => void;
}

/**
 * Après passage du RDV en « terminé » : solde Stripe (Checkout) + raccourci traçabilité matériel.
 */
export const SessionCloseoutSheet: React.FC<SessionCloseoutSheetProps> = ({
  isOpen,
  onClose,
  appointment,
  studioId,
  studioSlug,
  stripeConnectReady,
  onGoToStockTrace,
}) => {
  const toast = useToast();
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const remaining = appointment ? appointmentRemainingBalanceEuros(appointment) : 0;
  const balanceAlready = Boolean(appointment?.balancePaidAt?.trim()) || remaining < 0.01;

  const handleStripeBalance = useCallback(async () => {
    if (!appointment || !studioId || remaining < 1) {
      toast.info('Aucun solde à encaisser en ligne pour ce rendez-vous.');
      return;
    }
    if (!stripeConnectReady) {
      toast.error('Active Stripe Connect (Paramètres → Paiements) pour encaisser par carte.');
      return;
    }
    setCheckoutLoading(true);
    try {
      const result = await createCheckoutSession({
        studioId,
        studioSlug: studioSlug ?? undefined,
        appointmentId: appointment.id,
        amount: remaining,
        clientName: appointment.clientName,
        clientEmail: appointment.clientEmail,
        serviceName: appointment.service || 'Séance',
        type: 'balance',
      });
      if ('error' in result) {
        toast.error(result.error);
        return;
      }
      window.location.href = result.url;
    } catch {
      toast.error('Impossible d’ouvrir le paiement.');
    } finally {
      setCheckoutLoading(false);
    }
  }, [appointment, studioId, studioSlug, remaining, stripeConnectReady, toast]);

  const handleStock = useCallback(() => {
    if (!appointment) return;
    onGoToStockTrace(appointment.id, appointment.clientId?.trim() || null);
    onClose();
  }, [appointment, onGoToStockTrace, onClose]);

  if (!isOpen || !appointment) return null;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="session-closeout-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
        aria-label="Fermer"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md rounded-t-3xl sm:rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xl p-5 sm:p-6 space-y-4 safe-bottom animate-in slide-in-from-bottom-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2
              id="session-closeout-title"
              className="text-lg font-bold text-zinc-900 dark:text-white font-display tracking-tight"
            >
              Clôture de séance
            </h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
              {appointment.clientName} · {appointment.service}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 active:scale-[0.98] transition-all min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50/80 dark:bg-zinc-950/50 p-4">
          <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide">
            Solde à encaisser
          </p>
          <p className="text-2xl font-bold tabular-nums text-zinc-900 dark:text-white mt-1">
            {remaining.toFixed(2)} €
          </p>
          {balanceAlready ? (
            <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-2">
              Solde déjà enregistré comme réglé (ou montant nul).
            </p>
          ) : !appointment.depositPaid ? (
            <p className="text-xs text-amber-700 dark:text-amber-400 mt-2">
              Acompte non marqué payé sur la fiche — le solde calculé part du prix total.
            </p>
          ) : null}
        </div>

        <div className="flex flex-col gap-2">
          <button
            type="button"
            disabled={checkoutLoading || balanceAlready || remaining < 1 || !stripeConnectReady}
            onClick={() => void handleStripeBalance()}
            className="w-full inline-flex items-center justify-center gap-2 min-h-[48px] rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-sm font-semibold disabled:opacity-50 active:scale-[0.98] transition-all"
          >
            <CreditCard className="w-4 h-4" />
            {checkoutLoading ? 'Redirection…' : 'Encaisser le solde (Stripe)'}
          </button>
          <button
            type="button"
            onClick={handleStock}
            className="w-full inline-flex items-center justify-center gap-2 min-h-[48px] rounded-xl border border-zinc-200 dark:border-zinc-700 text-sm font-semibold text-zinc-900 dark:text-white active:scale-[0.98] transition-all"
          >
            <Package className="w-4 h-4" />
            Tracer le matériel (aiguille)
          </button>
          <button
            type="button"
            onClick={onClose}
            className="w-full text-center text-sm text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 py-2 active:scale-[0.98] transition-all"
          >
            Plus tard
          </button>
        </div>
        <p className="text-[11px] text-zinc-500 leading-snug">
          Paiement : page sécurisée Stripe (carte, Apple Pay / Google Pay selon l’appareil). Le
          client peut utiliser ton téléphone pour payer.
        </p>
      </div>
    </div>
  );
};
