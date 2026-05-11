import React, { useCallback, useMemo, useState } from 'react';
import { CreditCard, Loader2, Package, Smartphone, X } from 'lucide-react';
import type { Terminal } from '@stripe/terminal-js';
import type { Appointment, FlashDesign } from '../../types';
import { createCheckoutSession } from '../../lib/stripeClient';
import { appointmentRemainingBalanceEuros } from '../../lib/appointmentBalance';
import {
  appointmentWithResolvedFlashPrice,
  flashPriceNeedsPersist,
} from '../../lib/flashAppointmentPrice';
import { saveAppointmentToSupabase } from '../../lib/supabaseDashboard';
import { useToast } from '../../contexts/ToastContext';
import { isInkflowNativeShellUserAgent } from '../../lib/nativeWebShell';
import { getCanonicalAppOrigin } from '../../lib/urls';
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
  /** Catalogue flash — aligne le solde avec le cockpit (prix catalogue si `price` en base est 0). */
  flashDesigns?: FlashDesign[];
  /** Après sauvegarde du prix flash sur Supabase — garde l’état local cohérent. */
  onFlashPriceSynced?: (merged: Appointment) => void;
  /** Stripe Connect prêt (même signal que le reste du dashboard). */
  stripeConnectReady: boolean;
  onGoToStockTrace: (appointmentId: string, clientId: string | null) => void;
  /** Après succès TPE : met à jour la fiche locale (le webhook confirme côté serveur). */
  onBalanceMarkedPaid?: (appointmentId: string, paidAtIso: string) => void;
  /** Après encaissement Terminal réussi : resync dashboard finance + état Stripe Connect (différé pour laisser la BDD valider). */
  onPostBalancePaymentSync?: () => void;
}

function isErr<T extends { error: ExposedError }>(r: unknown): r is T {
  return Boolean(
    r && typeof r === 'object' && 'error' in r && (r as { error: unknown }).error != null
  );
}

interface ExposedError {
  message: string;
}

/** Messages Stripe Terminal (souvent en anglais) → aide exploitable en FR. */
function formatStripeTerminalToastMessage(raw: string | undefined, fallback: string): string {
  const m = (raw || '').trim();
  const lower = m.toLowerCase();
  if (
    lower.includes('only test mode keys') &&
    (lower.includes('simulator') || lower.includes('simulated'))
  ) {
    return (
      'Simulateur Terminal : Stripe n’accepte que des clés test (sk_test). ' +
      'Mets STRIPE_SECRET_KEY en sk_test sur Supabase (Edge Functions / stripe-terminal), ou retire VITE_STRIPE_TERMINAL_SIMULATOR dans .env.local pour du live avec un lecteur physique.'
    );
  }
  if (lower.includes('no such payment_intent')) {
    return (
      'Paiement introuvable pour ce lecteur (souvent Connect / mauvais compte Stripe). ' +
      'Déploie la dernière Edge `stripe-terminal`, puis recharge la page et recrée un encaissement.'
    );
  }
  return m || fallback;
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

function isIosPhoneOrPad(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /iPhone|iPad|iPod/.test(navigator.userAgent);
}

/**
 * iPhone/iPad en Safari ou PWA : pas de lecteur Bluetooth via Terminal.js Web.
 * Même handoff HTTPS → Inkflow Pro que le shell natif (Tap to Pay NFC).
 */
function shouldHandoffIosTapToPayWeb(): boolean {
  if (shouldUseTerminalSimulator()) return false;
  if (!isIosPhoneOrPad()) return false;
  // Déjà couvert par shouldUseNativeTapToPayIphone (return avant).
  if (isInkflowNativeShellUserAgent(navigator.userAgent)) return false;
  return true;
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
  flashDesigns = [],
  onFlashPriceSynced,
  stripeConnectReady,
  onGoToStockTrace,
  onBalanceMarkedPaid,
  onPostBalancePaymentSync,
}) => {
  const toast = useToast();
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [terminalLoading, setTerminalLoading] = useState(false);
  const [terminalStatus, setTerminalStatus] = useState<string | null>(null);
  const isNativeShell =
    typeof navigator !== 'undefined' && isInkflowNativeShellUserAgent(navigator.userAgent);

  /** Libellé du 2ᵉ bouton : sur iOS (hors simulateur dev) on vise Tap to Pay, pas un lecteur BT web. */
  const terminalButtonPrimaryLabel = (() => {
    if (shouldUseTerminalSimulator()) return 'Lecteur Stripe (simulateur)';
    if (typeof navigator !== 'undefined' && /iPhone|iPad|iPod/.test(navigator.userAgent)) {
      return 'Tap to Pay / lecteur Stripe';
    }
    return 'Lecteur Stripe (Bluetooth ou simulateur)';
  })();

  const displayAppointment = useMemo(
    () => (appointment ? appointmentWithResolvedFlashPrice(appointment, flashDesigns) : null),
    [appointment, flashDesigns]
  );

  const remaining = displayAppointment ? appointmentRemainingBalanceEuros(displayAppointment) : 0;
  const balanceMarkedPaid = Boolean(appointment?.balancePaidAt?.trim());
  const balanceAlready = balanceMarkedPaid || remaining < 0.01;

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
    const rem = appointmentRemainingBalanceEuros(merged);
    return { apt: merged, remainingEuros: rem };
  }, [appointment, studioId, flashDesigns, onFlashPriceSynced, toast]);

  const openTapToPayInNativeApp = useCallback(
    (amountEuros: number) => {
      if (!appointment || !studioId) return;
      if (typeof window === 'undefined') return;
      const params = new URLSearchParams({
        appointment: appointment.id,
        studio: studioId,
        amountEuros: amountEuros.toFixed(2),
      });
      const query = params.toString();

      // Toujours passer par HTTPS `/tap-to-pay` : Safari et le WKWebView sans schéma en whitelist
      // peuvent afficher « adresse non valide » sur `location.href = inkflowpro://…`.
      // La page handoff charge dans le WebView puis propose un lien (geste utilisateur) vers l’app native.
      const base = getCanonicalAppOrigin().replace(/\/$/, '');
      window.location.assign(`${base}/tap-to-pay?${query}`);
    },
    [appointment, studioId]
  );

  const handleStripeBalance = useCallback(async () => {
    const prep = await persistFlashPriceIfNeeded();
    if (!prep) return;
    const { apt, remainingEuros } = prep;
    if (!studioId || remainingEuros < 1) {
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
      setCheckoutLoading(false);
    }
  }, [persistFlashPriceIfNeeded, studioId, studioSlug, stripeConnectReady, toast]);

  const handleTerminalBalance = useCallback(async () => {
    const prep = await persistFlashPriceIfNeeded();
    if (!prep) return;
    const { apt, remainingEuros } = prep;
    if (!studioId || remainingEuros < 1) {
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
    // iPhone dans le shell natif Inkflow Pro : Tap to Pay NFC → flux SDK natif (handoff).
    if (shouldUseNativeTapToPayIphone()) {
      openTapToPayInNativeApp(remainingEuros);
      return;
    }
    // Safari / PWA sur iPhone : pas de Terminal.js Bluetooth utile → ouvrir la page handoff vers l’app Tap to Pay.
    if (shouldHandoffIosTapToPayWeb()) {
      openTapToPayInNativeApp(remainingEuros);
      return;
    }
    // Web desktop & Android : Terminal.js = lecteur Bluetooth ou simulateur.

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
        appointmentId: apt.id,
        amountEuros: remainingEuros,
      });
      if ('error' in intent) {
        toast.error(
          formatStripeTerminalToastMessage(intent.error, 'Préparation encaissement impossible.')
        );
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
        toast.error(
          formatStripeTerminalToastMessage(
            discover.error.message,
            'Découverte des lecteurs impossible.'
          )
        );
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
              : 'Aucun lecteur détecté. Utilise « Lien paiement Stripe » (carte ou Apple Pay) ou connecte un lecteur Bluetooth Stripe.'
        );
        await disconnectSafe();
        return;
      }

      const conn = await terminal.connectReader(readers[0]);
      if (isErr<{ error: ExposedError }>(conn)) {
        toast.error(
          formatStripeTerminalToastMessage(conn.error.message, 'Connexion lecteur impossible.')
        );
        await disconnectSafe();
        return;
      }

      setTerminalStatus('Présente la carte au lecteur…');
      const collected = await terminal.collectPaymentMethod(intent.clientSecret, {
        config_override: { update_payment_intent: true, skip_tipping: true },
      });

      if (isErr<{ error: ExposedError }>(collected)) {
        toast.error(
          formatStripeTerminalToastMessage(collected.error.message, 'Lecture carte interrompue.')
        );
        await disconnectSafe();
        return;
      }

      setTerminalStatus('Validation du paiement…');
      const processed = await terminal.processPayment(collected.paymentIntent);

      if (isErr<{ error: ExposedError }>(processed)) {
        toast.error(
          formatStripeTerminalToastMessage(
            processed.error.message,
            'Échec de la confirmation du paiement.'
          )
        );
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
        onBalanceMarkedPaid?.(apt.id, paidAt);
        if (typeof window !== 'undefined' && onPostBalancePaymentSync) {
          window.setTimeout(() => onPostBalancePaymentSync(), 650);
        }
      }

      await disconnectSafe();
      onClose();
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      toast.error(formatStripeTerminalToastMessage(msg, 'Erreur Terminal Stripe.'));
      await disconnectSafe();
    } finally {
      setTerminalStatus(null);
      setTerminalLoading(false);
    }
  }, [
    persistFlashPriceIfNeeded,
    studioId,
    stripeConnectReady,
    toast,
    onBalanceMarkedPaid,
    onPostBalancePaymentSync,
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
          {balanceMarkedPaid ? (
            <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-2">
              Solde déjà enregistré comme réglé.
            </p>
          ) : balanceAlready ? (
            <p className="text-xs text-amber-700 dark:text-amber-400 mt-2">
              {appointment.tattooType === 'flash'
                ? 'Solde calculé à 0 € (prix non renseigné ou entièrement couvert). Vérifie le prix / le flash dans l’agenda — avec un prix catalogue, le solde s’affiche ici automatiquement.'
                : 'Montant restant nul. Modifie le prix du rendez-vous dans l’agenda si tu dois encore encaisser.'}
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
            {terminalLoading ? (terminalStatus ?? 'Terminal…') : terminalButtonPrimaryLabel}
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
            <strong>Terminal</strong> : sur ordinateur ou Android, lecteur physique Stripe (WisePad
            3 / Reader M2) ou simulateur dev. Sur <strong>iPhone</strong>, ce bouton ouvre la page
            vers l’app <strong>Inkflow Pro</strong> pour le NFC Tap to Pay sans lecteur ; depuis le
            navigateur tu peux aussi utiliser le <strong>lien paiement</strong> (Apple Pay).
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
