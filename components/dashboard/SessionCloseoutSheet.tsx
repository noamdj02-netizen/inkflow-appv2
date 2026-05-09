import React, { useCallback, useState } from 'react';
import { CreditCard, Loader2, Package, Smartphone, X } from 'lucide-react';
import type { Terminal } from '@stripe/terminal-js';
import type { Appointment } from '../../types';
import { createCheckoutSession } from '../../lib/stripeClient';
import { appointmentRemainingBalanceEuros } from '../../lib/appointmentBalance';
import { useToast } from '../../contexts/ToastContext';
import { isInkflowNativeShellUserAgent } from '../../lib/nativeWebShell';
import {
  stripeTerminalCreateBalanceIntent,
  stripeTerminalFetchConnectionSecret,
} from '../../lib/stripeTerminalBalance';

export interface SessionCloseoutSheetProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: Appointment | null;
  studioId: string | null;
  studioSlug?: string | null;
  /** Stripe Connect prêt (même signal que le reste du dashboard). */
  stripeConnectReady: boolean;
  onGoToStockTrace: (appointmentId: string, clientId: string | null) => void;
  /** Après succès TPE : met à jour la fiche locale (le webhook confirme côté serveur). */
  onBalanceMarkedPaid?: (appointmentId: string, paidAtIso: string) => void;
}

function isErr<T extends { error: ExposedError }>(r: unknown): r is T {
  return Boolean(
    r && typeof r === 'object' && 'error' in r && (r as { error: unknown }).error != null
  );
}

interface ExposedError {
  message: string;
}

function shouldUseTerminalSimulator(): boolean {
  return import.meta.env.VITE_STRIPE_TERMINAL_SIMULATOR === 'true';
}

function shouldUseNativeTapToPayIphone(): boolean {
  if (typeof navigator === 'undefined') return false;
  if (!isInkflowNativeShellUserAgent(navigator.userAgent)) return false;
  if (shouldUseTerminalSimulator()) return false;
  return /iPhone|iPad|iPod/.test(navigator.userAgent);
}

/**
 * Après passage du RDV en « terminé » : solde Stripe (Checkout ou Terminal) + raccourci traçabilité matériel.
 */
export const SessionCloseoutSheet: React.FC<SessionCloseoutSheetProps> = ({
  isOpen,
  onClose,
  appointment,
  studioId,
  studioSlug,
  stripeConnectReady,
  onGoToStockTrace,
  onBalanceMarkedPaid,
}) => {
  const toast = useToast();
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [terminalLoading, setTerminalLoading] = useState(false);
  const [terminalStatus, setTerminalStatus] = useState<string | null>(null);
  const isNativeShell =
    typeof navigator !== 'undefined' && isInkflowNativeShellUserAgent(navigator.userAgent);

  const remaining = appointment ? appointmentRemainingBalanceEuros(appointment) : 0;
  const balanceAlready = Boolean(appointment?.balancePaidAt?.trim()) || remaining < 0.01;

  const openTapToPayInNativeApp = useCallback(() => {
    if (!appointment || !studioId) return;
    if (typeof window === 'undefined') return;
    // Shell natif Inkflow Pro : ouvre l’écran Tap to Pay (SDK Stripe Terminal) avec solde + studio.
    const deepLink = `inkflowpro://tap-to-pay?appointment=${encodeURIComponent(appointment.id)}&studio=${encodeURIComponent(studioId)}&amountEuros=${encodeURIComponent(remaining.toFixed(2))}`;
    const startedAt = Date.now();
    window.location.href = deepLink;

    // Fallback: if the app isn't installed, users stay on the web page.
    window.setTimeout(() => {
      if (Date.now() - startedAt < 1500) {
        toast.info(
          'Si rien ne s’ouvre, installe/ouvre l’app Inkflow Pro puis réessaie (Tap to Pay est natif).'
        );
      }
    }, 900);
  }, [appointment, studioId, remaining, toast]);

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

  const handleTerminalBalance = useCallback(async () => {
    if (!appointment || !studioId || remaining < 1) {
      toast.info('Aucun solde à encaisser pour ce rendez-vous.');
      return;
    }
    if (!stripeConnectReady) {
      toast.error('Active Stripe Connect (Paramètres → Paiements) pour encaisser par carte.');
      return;
    }
    if (typeof window === 'undefined') {
      toast.error('Terminal Stripe indisponible dans cet environnement.');
      return;
    }
    // iPhone dans le shell natif : `@stripe/terminal-js` ne peut pas utiliser Tap to Pay — flux SDK natif uniquement.
    if (shouldUseNativeTapToPayIphone()) {
      openTapToPayInNativeApp();
      return;
    }
    // Sur le web (hors shell), on ouvre l’app Inkflow Pro ; simulateur local (Bluetooth) garde terminal-js.
    if (!isNativeShell && !shouldUseTerminalSimulator()) {
      openTapToPayInNativeApp();
      return;
    }

    setTerminalLoading(true);
    setTerminalStatus(null);
    let terminal: Terminal | null = null;

    const disconnectSafe = async () => {
      try {
        if (terminal?.getConnectionStatus() === 'connected') {
          await terminal.disconnectReader();
        }
      } catch {
        /* ignore */
      }
    };

    try {
      const intent = await stripeTerminalCreateBalanceIntent({
        studioId,
        appointmentId: appointment.id,
        amountEuros: remaining,
      });
      if ('error' in intent) {
        toast.error(intent.error);
        return;
      }

      const { loadStripeTerminal } = await import('@stripe/terminal-js/pure');
      const StripeTerminalNs = await loadStripeTerminal();
      if (!StripeTerminalNs) {
        toast.error('SDK Terminal Stripe non chargé (HTTPS requis en production).');
        return;
      }

      const useSimulated = shouldUseTerminalSimulator();

      setTerminalStatus(
        useSimulated ? 'Connexion au simulateur Stripe…' : 'Recherche du lecteur Stripe…'
      );
      terminal = StripeTerminalNs.create({
        onFetchConnectionToken: async () => {
          const tok = await stripeTerminalFetchConnectionSecret(studioId);
          if ('error' in tok) {
            throw new Error(tok.error);
          }
          return tok.secret;
        },
        onUnexpectedReaderDisconnect: () => {
          setTerminalStatus(null);
          toast.error(
            'Lecteur Stripe déconnecté. Rapproche le lecteur puis relance l’encaissement.'
          );
        },
      });

      const discover = await terminal.discoverReaders(
        useSimulated ? { simulated: true } : { simulated: false }
      );

      if (isErr<{ error: ExposedError }>(discover)) {
        toast.error(discover.error.message || 'Découverte des lecteurs impossible.');
        await disconnectSafe();
        return;
      }

      const readers = discover.discoveredReaders;
      if (!readers.length) {
        toast.error(
          useSimulated
            ? 'Aucun lecteur simulé. Utilise des clés Stripe test avec VITE_STRIPE_TERMINAL_SIMULATOR=true.'
            : isNativeShell
              ? 'Aucun lecteur Stripe détecté. Allume ton WisePad / Reader M2, puis réessaie.'
              : 'Aucun lecteur Stripe détecté. Sur web, passe par « Paiement en ligne » (Stripe Checkout) ou encaisse depuis l’app Inkflow Pro.'
        );
        await disconnectSafe();
        return;
      }

      const conn = await terminal.connectReader(readers[0]);
      if (isErr<{ error: ExposedError }>(conn)) {
        toast.error(conn.error.message || 'Connexion lecteur impossible.');
        await disconnectSafe();
        return;
      }

      setTerminalStatus('Présente la carte au lecteur…');
      const collected = await terminal.collectPaymentMethod(intent.clientSecret, {
        config_override: { update_payment_intent: true, skip_tipping: true },
      });

      if (isErr<{ error: ExposedError }>(collected)) {
        toast.error(collected.error.message || 'Lecture carte interrompue.');
        await disconnectSafe();
        return;
      }

      setTerminalStatus('Validation du paiement…');
      const processed = await terminal.processPayment(collected.paymentIntent);

      if (isErr<{ error: ExposedError }>(processed)) {
        toast.error(processed.error.message || 'Échec de la confirmation du paiement.');
        await disconnectSafe();
        return;
      }

      if (processed.paymentIntent.status !== 'succeeded') {
        toast.warning(
          `Statut paiement Stripe : ${processed.paymentIntent.status}. Vérifie le Dashboard.`
        );
      } else {
        const paidAt = new Date().toISOString();
        toast.success(`Solde encaissé (${intent.amountEuros.toFixed(2)} €)`);
        onBalanceMarkedPaid?.(appointment.id, paidAt);
      }

      await disconnectSafe();
      onClose();
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      toast.error(msg || 'Erreur Terminal Stripe.');
      await disconnectSafe();
    } finally {
      setTerminalStatus(null);
      setTerminalLoading(false);
    }
  }, [
    appointment,
    studioId,
    remaining,
    stripeConnectReady,
    toast,
    onBalanceMarkedPaid,
    onClose,
    isNativeShell,
    openTapToPayInNativeApp,
  ]);

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
          {!balanceAlready && remaining >= 1 ? (
            <p className="text-[11px] text-zinc-500 mt-3 leading-snug">
              Pour ajuster le montant, modifie le <strong>prix du rendez-vous</strong> dans l’agenda
              puis rouvre cette feuille.
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
            {checkoutLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <CreditCard className="w-4 h-4" />
            )}
            {checkoutLoading ? 'Redirection…' : 'Lien paiement Stripe (client)'}
          </button>

          <button
            type="button"
            disabled={terminalLoading || balanceAlready || remaining < 1 || !stripeConnectReady}
            onClick={() => void handleTerminalBalance()}
            className="w-full inline-flex items-center justify-center gap-2 min-h-[48px] rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900/70 text-zinc-900 dark:text-white text-sm font-semibold disabled:opacity-50 active:scale-[0.98] transition-all"
          >
            {terminalLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Smartphone className="w-4 h-4" />
            )}
            {terminalLoading
              ? (terminalStatus ?? 'Terminal…')
              : isNativeShell
                ? 'Tap to Pay / lecteur Stripe'
                : 'Tap to Pay (ouvrir Inkflow Pro)'}
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
        <div className="space-y-1.5 text-[11px] text-zinc-500 leading-snug">
          <p>
            <strong>Lien paiement</strong> : page sécurisée (Apple Pay / Google Pay). Tu peux faire
            présenter la carte sur ton téléphone.
          </p>
          <p>
            <strong>Terminal</strong> : lecteur physique Stripe (WisePad 3 / Reader M2) depuis le
            dashboard web. Tap to Pay iPhone/Android passe par le SDK natif de l’app mobile.
            {shouldUseTerminalSimulator() ? (
              <span className="block mt-1 text-amber-700 dark:text-amber-400">
                Simulateur activé : utilise uniquement des clés Stripe test (`sk_test`).
              </span>
            ) : null}
          </p>
          <p>
            Pour tester en local avec tes clés live, laisse `VITE_STRIPE_TERMINAL_SIMULATOR` vide.
          </p>
        </div>
      </div>
    </div>
  );
};
