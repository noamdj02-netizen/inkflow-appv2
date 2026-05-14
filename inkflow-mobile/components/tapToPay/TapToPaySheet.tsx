import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as WebBrowser from 'expo-web-browser';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  createBalanceCheckoutSession,
  loadAppointmentCheckoutContext,
} from '@/lib/createBalanceCheckout';
import type { TapToPaySheetImplProps, TapToPaySheetProps } from './TapToPaySheet.impl';

export type { TapToPaySheetProps, TapToPaySheetImplProps } from './TapToPaySheet.impl';

const isExpoGo = Constants.appOwnership === 'expo';

type TapToPayImplComponent = React.ComponentType<TapToPaySheetImplProps>;

function sharedModalLayout(
  title: string,
  body: string,
  onClose: () => void,
  animationType: 'fade' | 'slide' = 'fade'
) {
  return (
    <Modal visible transparent animationType={animationType}>
      <View style={sharedStyles.backdrop}>
        <View style={sharedStyles.card}>
          <Text style={sharedStyles.title}>{title}</Text>
          <Text style={[sharedStyles.body, { marginTop: 10 }]}>{body}</Text>
          <Pressable
            onPress={onClose}
            style={({ pressed }) => [sharedStyles.btn, { marginTop: 16 }, pressed && sharedStyles.btnPressed]}
          >
            <Text style={sharedStyles.btnText}>OK</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

/**
 * Expo Go : pas de binaire Stripe Terminal — encaissement réel via Stripe Checkout (carte / Apple Pay).
 */
function TapToPayExpoGoCheckout(props: TapToPaySheetProps) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const openCheckout = useCallback(async () => {
    setErr(null);
    setBusy(true);
    try {
      const ctx = await loadAppointmentCheckoutContext(props.studioId, props.appointmentId);
      if (!ctx.ok) {
        setErr(ctx.error);
        return;
      }
      const session = await createBalanceCheckoutSession({
        studioId: props.studioId,
        studioSlug: ctx.studioSlug,
        appointmentId: props.appointmentId,
        amountEuros: props.amountEuros,
        clientName: ctx.clientName,
        clientEmail: ctx.clientEmail,
        serviceName: ctx.serviceName,
      });
      if ('error' in session) {
        setErr(session.error);
        return;
      }
      await WebBrowser.openBrowserAsync(session.url, {
        presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET,
      });
      props.onClose();
    } catch {
      setErr('Impossible d’ouvrir le paiement. Réessaie.');
    } finally {
      setBusy(false);
    }
  }, [props.amountEuros, props.appointmentId, props.onClose, props.studioId]);

  return (
    <Modal visible transparent animationType="fade">
      <View style={sharedStyles.backdrop}>
        <View style={sharedStyles.card}>
          <Text style={sharedStyles.title}>Encaisser le solde</Text>
          <Text style={[sharedStyles.body, { marginTop: 10 }]}>
            Expo Go ne peut pas utiliser le NFC Tap to Pay (module natif Stripe). Tu peux encaisser
            ce montant avec Stripe Checkout : carte bancaire ou Apple Pay dans la fenêtre qui
            s’ouvre.
          </Text>
          <Text style={[sharedStyles.meta, { marginTop: 8 }]}>
            {props.amountEuros.toFixed(2)} € · RDV {props.appointmentId.slice(0, 8)}…
          </Text>
          {err ? <Text style={sharedStyles.errorText}>{err}</Text> : null}
          <Pressable
            onPress={openCheckout}
            disabled={busy}
            style={({ pressed }) => [
              sharedStyles.btn,
              { marginTop: 16 },
              busy && sharedStyles.btnDisabled,
              pressed && !busy && sharedStyles.btnPressed,
            ]}
          >
            {busy ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={sharedStyles.btnText}>Payer avec Stripe</Text>
            )}
          </Pressable>
          <Pressable
            onPress={props.onClose}
            disabled={busy}
            style={({ pressed }) => [sharedStyles.btnSecondary, pressed && sharedStyles.btnPressed]}
          >
            <Text style={sharedStyles.btnSecondaryText}>Annuler</Text>
          </Pressable>
          <Text style={[sharedStyles.hint, { marginTop: 14 }]}>
            Pour le vrai Tap to Pay iPhone : build EAS (development client) avec le plugin Stripe
            Terminal.
          </Text>
        </View>
      </View>
    </Modal>
  );
}

function TapToPayNonIos(props: TapToPaySheetProps) {
  return sharedModalLayout(
    'Tap to Pay',
    'L’encaissement NFC direct est disponible sur iPhone avec Tap to Pay. Sur Android, utilise un lecteur Bluetooth Stripe depuis le navigateur ou le lien paiement client.',
    props.onClose,
    'fade'
  );
}

function TapToPayLoadingFallback({ onClose }: Pick<TapToPaySheetProps, 'onClose'>) {
  return (
    <Modal visible transparent animationType="fade">
      <View style={sharedStyles.backdrop}>
        <View style={sharedStyles.card}>
          <ActivityIndicator size="large" color="#18181b" />
          <Text style={[sharedStyles.body, { marginTop: 14 }]}>Chargement Tap to Pay…</Text>
          <Pressable
            onPress={onClose}
            style={({ pressed }) => [sharedStyles.btnSecondary, pressed && sharedStyles.btnPressed]}
          >
            <Text style={sharedStyles.btnSecondaryText}>Annuler</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

/**
 * Encaissement Tap to Pay (Stripe Terminal).
 * Dans Expo Go, aucun import du module natif Stripe — évite le crash au chargement.
 * Import dynamique avec gestion d’erreur : évite écran blanc si le chunk natif échoue.
 */
export function TapToPaySheet(props: TapToPaySheetProps) {
  const [Impl, setImpl] = useState<TapToPayImplComponent | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  useEffect(() => {
    if (isExpoGo || Platform.OS !== 'ios') return;
    let cancelled = false;
    setImpl(null);
    setImportError(null);
    void import('./TapToPaySheet.impl')
      .then((m) => {
        if (!cancelled) setImpl(() => m.TapToPaySheetImpl);
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          setImportError(e instanceof Error ? e.message : 'Chargement du module Terminal impossible.');
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (isExpoGo) {
    return <TapToPayExpoGoCheckout {...props} />;
  }

  if (Platform.OS !== 'ios') {
    return <TapToPayNonIos {...props} />;
  }

  if (importError) {
    return sharedModalLayout(
      'Tap to Pay',
      importError,
      props.onClose,
      'fade'
    );
  }

  if (!Impl) {
    return <TapToPayLoadingFallback onClose={props.onClose} />;
  }

  /** expo-device reste dans ce module (import synchrone) : évite Metro « unknown module » dans le chunk async `.impl`. */
  return <Impl {...props} useSimulatedStripeReader={!Device.isDevice} />;
}

const sharedStyles = StyleSheet.create({
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
  body: {
    fontSize: 15,
    color: '#52525b',
    textAlign: 'center',
    lineHeight: 22,
  },
  btn: {
    backgroundColor: '#18181b',
    borderRadius: 14,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPressed: { opacity: 0.9, transform: [{ scale: 0.98 }] },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  btnSecondary: {
    marginTop: 16,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnSecondaryText: { color: '#71717a', fontSize: 15, fontWeight: '600' },
  btnDisabled: { opacity: 0.65 },
  meta: { fontSize: 13, color: '#71717a', textAlign: 'center' },
  errorText: {
    marginTop: 12,
    fontSize: 13,
    color: '#b91c1c',
    textAlign: 'center',
    lineHeight: 18,
  },
  hint: { fontSize: 11, color: '#a1a1aa', textAlign: 'center', lineHeight: 16 },
});
