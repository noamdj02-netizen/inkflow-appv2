import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  StripeTerminalProvider,
  useStripeTerminal,
  checkIfObjectIsStripeError,
} from '@stripe/stripe-terminal-react-native';
import {
  stripeTerminalCreateBalanceIntent,
  stripeTerminalEnsureLocation,
  stripeTerminalFetchConnectionSecret,
} from '@/lib/stripeTerminalBackend';
import { formatTapToPayTerminalError } from '@/lib/stripeTerminalTapToPayErrors';
import { isSupabaseConfigured } from '@/lib/supabase';

export interface TapToPaySheetProps {
  studioId: string;
  appointmentId: string;
  amountEuros: number;
  onClose: () => void;
  /** Appelé après succès (ex. recharger la WebView). */
  onPaid?: () => void;
}

/** Props internes : le shell fournit le flag simulateur (expo-device hors chunk async). */
export type TapToPaySheetImplProps = TapToPaySheetProps & {
  useSimulatedStripeReader: boolean;
};

type TapToPayInnerProps = TapToPaySheetImplProps;

function formatStripeError(e: unknown): string {
  const mapped = formatTapToPayTerminalError(e);
  if (mapped) return mapped;
  if (checkIfObjectIsStripeError(e)) {
    return e.message;
  }
  if (e && typeof e === 'object' && 'message' in e && typeof (e as { message: string }).message === 'string') {
    return (e as { message: string }).message;
  }
  if (e instanceof Error) return e.message;
  return 'Erreur Terminal.';
}

function TapToPayInner({
  studioId,
  appointmentId,
  amountEuros,
  onClose,
  onPaid,
  useSimulatedStripeReader,
}: TapToPayInnerProps) {
  const [status, setStatus] = useState<string>('Initialisation…');
  const [error, setError] = useState<string | null>(null);
  const [paidSuccess, setPaidSuccess] = useState(false);
  const [readerUpdateProgress, setReaderUpdateProgress] = useState<string | null>(null);

  const onReaderSoftwareProgress = useCallback((progress: string) => {
    setReaderUpdateProgress(progress);
  }, []);

  const onTermsAcceptance = useCallback(() => {
    setStatus('Conditions Tap to Pay (Apple) — suis les étapes à l’écran si demandé…');
  }, []);

  const { initialize, easyConnect, retrievePaymentIntent, collectPaymentMethod, processPaymentIntent, disconnectReader } =
    useStripeTerminal({
      onDidReportReaderSoftwareUpdateProgress: onReaderSoftwareProgress,
      onDidAcceptTermsOfService: onTermsAcceptance,
    });
  const cancelled = useRef(false);
  /** Évite disconnectReader() avant que initialize() ait réussi (SDK Stripe sinon erreur). */
  const sdkInitialized = useRef(false);
  const onCloseRef = useRef(onClose);
  const onPaidRef = useRef(onPaid);
  onCloseRef.current = onClose;
  onPaidRef.current = onPaid;

  const cleanupReader = useCallback(async () => {
    if (!sdkInitialized.current) return;
    try {
      await disconnectReader();
    } catch {
      /* ignore */
    }
  }, [disconnectReader]);

  useEffect(() => {
    cancelled.current = false;

    const run = async () => {
      setError(null);
      setReaderUpdateProgress(null);
      sdkInitialized.current = false;

      if (!isSupabaseConfigured()) {
        setError(
          'Supabase n’est pas configuré : ajoute EXPO_PUBLIC_SUPABASE_URL et EXPO_PUBLIC_SUPABASE_ANON_KEY dans inkflow-mobile/.env (voir .env.example), puis redémarre Expo avec npx expo start --clear.',
        );
        return;
      }

      const init = await initialize();
      if (cancelled.current) return;
      if (init.error) {
        setError(formatStripeError(init.error));
        return;
      }
      sdkInitialized.current = true;

      setStatus('Préparation du lieu Terminal…');
      const loc = await stripeTerminalEnsureLocation(studioId);
      if (cancelled.current) return;
      if ('error' in loc) {
        setError(loc.error);
        return;
      }

      setStatus('Préparation du paiement…');
      const pi = await stripeTerminalCreateBalanceIntent({
        studioId,
        appointmentId,
        amountEuros,
      });
      if (cancelled.current) return;
      if ('error' in pi) {
        setError(pi.error);
        return;
      }

      const simulated = useSimulatedStripeReader;

      setStatus(simulated ? 'Connexion (simulateur)…' : 'Connexion Tap to Pay…');
      const connected = await easyConnect({
        discoveryMethod: 'tapToPay',
        locationId: loc.locationId,
        simulated,
        onBehalfOf: loc.connectAccountId,
        merchantDisplayName: loc.merchantDisplayName.slice(0, 64),
        tosAcceptancePermitted: true,
      });
      if (cancelled.current) return;
      if (connected.error) {
        setError(formatStripeError(connected.error));
        await cleanupReader();
        return;
      }
      setReaderUpdateProgress(null);

      setStatus('Synchronisation du paiement…');
      const retrieved = await retrievePaymentIntent(pi.clientSecret);
      if (cancelled.current) return;
      if (retrieved.error) {
        setError(formatStripeError(retrieved.error));
        await cleanupReader();
        return;
      }
      if (!retrieved.paymentIntent) {
        setError('PaymentIntent introuvable.');
        await cleanupReader();
        return;
      }

      setStatus('Présente la carte sur l’iPhone…');
      const collected = await collectPaymentMethod({
        paymentIntent: retrieved.paymentIntent,
        updatePaymentIntent: true,
        skipTipping: true,
      });
      if (cancelled.current) return;
      if (collected.error) {
        setError(formatStripeError(collected.error));
        await cleanupReader();
        return;
      }
      if (!collected.paymentIntent) {
        setError('Collecte interrompue.');
        await cleanupReader();
        return;
      }

      setStatus('Traitement du paiement…');
      const processed = await processPaymentIntent({ paymentIntent: collected.paymentIntent });
      if (cancelled.current) return;
      if (processed.error) {
        setError(formatStripeError(processed.error));
        await cleanupReader();
        return;
      }

      await cleanupReader();
      setPaidSuccess(true);
      setStatus('Mise à jour du solde…');
    };

    void run().catch((e) => {
      if (!cancelled.current) setError(formatStripeError(e));
    });

    return () => {
      cancelled.current = true;
      void cleanupReader();
    };
  }, [
    amountEuros,
    appointmentId,
    cleanupReader,
    collectPaymentMethod,
    easyConnect,
    initialize,
    processPaymentIntent,
    retrievePaymentIntent,
    studioId,
    useSimulatedStripeReader,
  ]);

  useEffect(() => {
    if (!paidSuccess) return;
    const id = setTimeout(() => {
      onPaidRef.current?.();
      onCloseRef.current();
    }, 1800);
    return () => clearTimeout(id);
  }, [paidSuccess]);

  return (
    <Modal visible transparent animationType="slide">
      <View style={styles.backdrop}>
        <View style={styles.card}>
          {paidSuccess ? (
            <>
              <Text style={styles.successTitle}>Paiement accepté</Text>
              <Text style={styles.amount}>{amountEuros.toFixed(2)} €</Text>
              <Text style={[styles.status, { marginTop: 12 }]}>
                Le solde sera mis à jour dans l’app. Tu peux fermer dans un instant…
              </Text>
            </>
          ) : (
            <>
              <Text style={styles.title}>Encaissement Tap to Pay</Text>
              <Text style={styles.amount}>{amountEuros.toFixed(2)} €</Text>
              {error ? (
                <>
                  <Text style={styles.error}>{error}</Text>
                  <Pressable onPress={onClose} style={({ pressed }) => [styles.btn, pressed && styles.btnPressed]}>
                    <Text style={styles.btnText}>Fermer</Text>
                  </Pressable>
                </>
              ) : (
                <>
                  <ActivityIndicator size="large" color="#18181b" style={{ marginVertical: 12 }} />
                  <Text style={styles.status}>{status}</Text>
                  {readerUpdateProgress ? (
                    <Text style={[styles.progressHint, { marginTop: 8 }]}>{readerUpdateProgress}</Text>
                  ) : null}
                  <Pressable
                    onPress={() => {
                      void cleanupReader();
                      onClose();
                    }}
                    style={({ pressed }) => [styles.btnSecondary, pressed && styles.btnPressed]}
                  >
                    <Text style={styles.btnSecondaryText}>Annuler</Text>
                  </Pressable>
                </>
              )}
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 22,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#18181b',
    textAlign: 'center',
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#166534',
    textAlign: 'center',
  },
  amount: {
    fontSize: 28,
    fontWeight: '800',
    color: '#18181b',
    textAlign: 'center',
    marginTop: 8,
  },
  status: {
    fontSize: 15,
    color: '#52525b',
    textAlign: 'center',
    lineHeight: 22,
  },
  progressHint: {
    fontSize: 13,
    color: '#71717a',
    textAlign: 'center',
    lineHeight: 18,
  },
  error: {
    fontSize: 14,
    color: '#b91c1c',
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 20,
  },
  btn: {
    marginTop: 16,
    backgroundColor: '#18181b',
    borderRadius: 14,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPressed: { opacity: 0.9, transform: [{ scale: 0.98 }] },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  btnSecondary: {
    marginTop: 12,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnSecondaryText: { color: '#71717a', fontSize: 15, fontWeight: '600' },
});

/** iOS uniquement — le module natif Stripe Terminal doit exister (pas Expo Go). */
export function TapToPaySheetImpl(props: TapToPaySheetImplProps) {
  return (
    <StripeTerminalProvider
      logLevel="error"
      tokenProvider={async () => {
        const r = await stripeTerminalFetchConnectionSecret(props.studioId);
        if ('error' in r) throw new Error(r.error);
        return r.secret;
      }}
    >
      <TapToPayInner {...props} />
    </StripeTerminalProvider>
  );
}
