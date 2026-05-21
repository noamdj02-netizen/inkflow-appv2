import React, { useCallback, useMemo, useState } from 'react';
import { FileText, Loader2, X } from 'lucide-react';
import type { Appointment, FlashDesign, User } from '../../types';
import { handleClientPaymentSuccess } from '../../lib/automations';
import { createCheckoutSession } from '../../lib/stripeClient';
import { appointmentRemainingBalanceEuros } from '../../lib/appointmentBalance';
import { formatAppointmentSlotLabel } from '../../lib/appointmentSessionSync';
import {
  appointmentWithResolvedFlashPrice,
  flashPriceNeedsPersist,
} from '../../lib/flashAppointmentPrice';
import { saveAppointmentToSupabase } from '../../lib/supabaseDashboard';
import { useToast } from '../../contexts/ToastContext';

export interface SessionCloseoutSheetProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: Appointment | null;
  studioId: string | null;
  studioSlug?: string | null;
  flashDesigns?: FlashDesign[];
  onFlashPriceSynced?: (merged: Appointment) => void;
  stripeConnectReady: boolean;
  onGoToStockTrace: (appointmentId: string, clientId: string | null) => void;
  onBalanceMarkedPaid?: (appointmentId: string, paidAtIso: string) => void;
  onPostBalancePaymentSync?: () => void;
  /** Ferme la clôture et garde l’aperçu client ouvert (scroll vers Documents). */
  onPaymentSuccess?: () => void;
  artist: User;
}

const btnPrimaryZinc =
  'w-full inline-flex items-center justify-center gap-2.5 min-h-[48px] rounded-xl bg-zinc-900 text-white text-sm font-semibold hover:bg-zinc-800 disabled:opacity-45 active:scale-[0.98] transition-all dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100';

const btnPrimaryCollect =
  'w-full inline-flex items-center justify-center gap-2 min-h-[48px] rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-45 active:scale-[0.98] transition-all dark:bg-emerald-500 dark:hover:bg-emerald-600';

const btnSecondaryOutline =
  'w-full inline-flex items-center justify-center gap-2 min-h-[48px] rounded-xl border border-zinc-200 bg-white text-sm font-medium text-zinc-800 hover:bg-zinc-50 disabled:opacity-45 active:scale-[0.98] transition-all dark:border-zinc-700 dark:bg-zinc-900/50 dark:text-zinc-100 dark:hover:bg-zinc-800/80';

const linkDiscrete =
  'text-xs font-medium text-zinc-400 underline-offset-2 hover:text-zinc-600 active:scale-[0.98] transition-all dark:text-zinc-500 dark:hover:text-zinc-300';

export const SessionCloseoutSheet: React.FC<SessionCloseoutSheetProps> = ({
  isOpen,
  onClose,
  appointment,
  studioId,
  studioSlug,
  flashDesigns = [],
  onFlashPriceSynced,
  stripeConnectReady,
  onGoToStockTrace,
  onBalanceMarkedPaid,
  onPostBalancePaymentSync,
  onPaymentSuccess,
  artist,
}) => {
  const toast = useToast();
  const [isManualLoading, setIsManualLoading] = useState(false);
  const [isLinkLoading, setIsLinkLoading] = useState(false);
  const [isInvoiceLoading, setIsInvoiceLoading] = useState(false);

  const displayAppointment = useMemo(
    () => (appointment ? appointmentWithResolvedFlashPrice(appointment, flashDesigns) : null),
    [appointment, flashDesigns]
  );

  const remaining = displayAppointment ? appointmentRemainingBalanceEuros(displayAppointment) : 0;
  const balanceMarkedPaid = Boolean(appointment?.balancePaidAt?.trim());
  const balanceSettled = balanceMarkedPaid || remaining < 0.01;
  const canCollectPayment = !balanceSettled && remaining >= 0.01 && Boolean(studioId);
  const actionsBusy = isManualLoading || isLinkLoading;

  const persistFlashPriceIfNeeded = useCallback(async (): Promise<{
    apt: Appointment;
    remainingEuros: number;
  } | null> => {
    if (!appointment || !studioId) return null;
    const { merged, needsSave } = flashPriceNeedsPersist(appointment, flashDesigns);
    if (needsSave) {
      try {
        await saveAppointmentToSupabase(studioId, merged);
        onFlashPriceSynced?.(merged);
      } catch {
        toast.error('Impossible d’enregistrer le prix du flash. Réessaie.');
        return null;
      }
    }
    return { apt: merged, remainingEuros: appointmentRemainingBalanceEuros(merged) };
  }, [appointment, studioId, flashDesigns, onFlashPriceSynced, toast]);

  const handleManualCollect = useCallback(async () => {
    const prep = await persistFlashPriceIfNeeded();
    if (!prep || !studioId) return;
    const { apt, remainingEuros } = prep;
    if (remainingEuros < 0.01) return;

    setIsManualLoading(true);
    try {
      const paidAt = new Date().toISOString();
      onBalanceMarkedPaid?.(apt.id, paidAt);
      const result = await handleClientPaymentSuccess({
        appointmentId: apt.id,
        studioId,
        artist,
        paymentKind: 'manual_balance',
        amountPaidEur: remainingEuros,
        paymentReference: `manual-${paidAt}`,
        downloadPdf: true,
        skipIfExists: true,
      });
      if (result.ok) {
        if (result.skipped) {
          toast.info('Reçu déjà dans le dossier client.');
        } else if (result.savedToDossier) {
          toast.success(
            'Encaissement enregistré · reçu archivé — visible dans Documents (aperçu client).'
          );
        } else {
          toast.success(
            'Encaissement enregistré · reçu téléchargé (liez le client au CRM pour l’archivage).'
          );
        }
        onPostBalancePaymentSync?.();
        onPaymentSuccess?.();
        onClose();
      } else {
        toast.error(result.reason || 'Erreur lors du reçu PDF.');
      }
    } catch {
      toast.error('Impossible d’enregistrer l’encaissement.');
    } finally {
      setIsManualLoading(false);
    }
  }, [
    persistFlashPriceIfNeeded,
    studioId,
    artist,
    onBalanceMarkedPaid,
    onPostBalancePaymentSync,
    onPaymentSuccess,
    onClose,
    toast,
  ]);

  const handleStripePaymentLink = useCallback(async () => {
    const prep = await persistFlashPriceIfNeeded();
    if (!prep) return;
    const { apt, remainingEuros } = prep;
    if (!studioId || remainingEuros < 1) return;
    if (!stripeConnectReady) {
      toast.error('Active Stripe Connect dans Paramètres → Paiements.');
      return;
    }

    setIsLinkLoading(true);
    try {
      const result = await createCheckoutSession({
        studioId,
        studioSlug: studioSlug ?? undefined,
        appointmentId: apt.id,
        amount: remainingEuros,
        clientName: apt.clientName,
        clientEmail: apt.clientEmail,
        serviceName: apt.service || 'Séance',
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
      setIsLinkLoading(false);
    }
  }, [persistFlashPriceIfNeeded, studioId, studioSlug, stripeConnectReady, toast]);

  const handleDownloadInvoicePdf = useCallback(async () => {
    if (!appointment || !studioId) return;
    setIsInvoiceLoading(true);
    try {
      const prep = await persistFlashPriceIfNeeded();
      const apt = prep?.apt ?? appointment;
      const result = await handleClientPaymentSuccess({
        appointmentId: apt.id,
        studioId,
        artist,
        paymentKind: 'balance',
        amountPaidEur: 0,
        paymentReference: `invoice-only-${Date.now()}`,
        downloadPdf: true,
        skipIfExists: false,
      });
      if (result.ok) {
        if (result.skipped && result.publicUrl) {
          toast.info('Reçu déjà dans le dossier client.');
        } else if (result.downloaded || result.savedToDossier) {
          toast.success('Reçu PDF prêt — visible dans Documents (aperçu client).');
        }
        if (result.savedToDossier) {
          onPostBalancePaymentSync?.();
          onPaymentSuccess?.();
        }
      } else {
        toast.error(result.reason || 'Génération impossible.');
      }
    } catch {
      toast.error('Erreur lors de la génération.');
    } finally {
      setIsInvoiceLoading(false);
    }
  }, [
    appointment,
    studioId,
    artist,
    persistFlashPriceIfNeeded,
    onPostBalancePaymentSync,
    onPaymentSuccess,
    toast,
  ]);

  const handleStockLink = useCallback(() => {
    if (!appointment) return;
    onGoToStockTrace(appointment.id, appointment.clientId?.trim() || null);
    onClose();
  }, [appointment, onGoToStockTrace, onClose]);

  if (!isOpen || !appointment) return null;

  const remainingLabel = remaining.toFixed(2);

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
      <div className="relative w-full max-w-md rounded-t-3xl sm:rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xl p-5 sm:p-6 space-y-5 safe-bottom animate-in slide-in-from-bottom-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2
              id="session-closeout-title"
              className="font-display text-lg font-bold tracking-tight text-zinc-900 dark:text-white"
            >
              Clôture de séance
            </h2>
            <p className="mt-1 truncate text-sm text-zinc-600 dark:text-zinc-300">
              {appointment.clientName}
            </p>
            <p className="mt-0.5 truncate text-xs text-zinc-500 dark:text-zinc-400">
              {appointment.service}
            </p>
            <p className="mt-1 text-xs font-medium capitalize text-zinc-400 dark:text-zinc-500">
              {formatAppointmentSlotLabel(appointment)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-xl text-zinc-500 transition-all hover:bg-zinc-100 active:scale-[0.98] dark:hover:bg-zinc-800"
            aria-label="Fermer"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="rounded-2xl border border-zinc-200/80 bg-zinc-50/50 p-4 dark:border-zinc-800 dark:bg-zinc-950/40">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-400 dark:text-zinc-500">
            {balanceSettled ? 'Solde réglé' : 'Solde à encaisser'}
          </p>
          <p className="mt-1 font-display text-3xl font-bold tabular-nums tracking-tight text-zinc-900 dark:text-white">
            {remainingLabel} €
          </p>
          {balanceSettled ? (
            <p className="mt-2 text-xs text-emerald-600 dark:text-emerald-400">
              Paiement déjà enregistré sur ce rendez-vous.
            </p>
          ) : null}
        </div>

        <div className="space-y-3">
          {balanceSettled ? (
            <button
              type="button"
              disabled={isInvoiceLoading || !studioId}
              onClick={() => void handleDownloadInvoicePdf()}
              className={btnPrimaryZinc}
            >
              {isInvoiceLoading ? (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              ) : (
                <FileText className="size-4" aria-hidden />
              )}
              <span>{isInvoiceLoading ? 'Génération…' : '📄 Télécharger le reçu PDF'}</span>
            </button>
          ) : (
            <>
              <button
                type="button"
                disabled={!canCollectPayment || actionsBusy}
                onClick={() => void handleManualCollect()}
                className={btnPrimaryCollect}
              >
                {isManualLoading ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
                <span>
                  {isManualLoading
                    ? 'Enregistrement…'
                    : `Encaisser ${remainingLabel} € (Espèces, Virement…) + Reçu PDF`}
                </span>
              </button>

              <button
                type="button"
                disabled={!canCollectPayment || !stripeConnectReady || actionsBusy}
                onClick={() => void handleStripePaymentLink()}
                className={btnSecondaryOutline}
              >
                {isLinkLoading ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
                <span>
                  {isLinkLoading
                    ? 'Ouverture du lien…'
                    : '🔗 Envoyer un lien de paiement Stripe (Apple Pay, CB…)'}
                </span>
              </button>
            </>
          )}
        </div>

        <div className="flex justify-center border-t border-zinc-100 pt-4 dark:border-zinc-800">
          <button type="button" onClick={handleStockLink} className={linkDiscrete}>
            Tracer le matériel (aiguille)
          </button>
        </div>
      </div>
    </div>
  );
};
