import { Redirect, Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo } from 'react';
import { View } from 'react-native';
import { TapToPaySheet } from '@/components/tapToPay/TapToPaySheet';

function parseTapToPayParams(params: Record<string, string | string[] | undefined>) {
  const apRaw = params.appointment;
  const appointmentId = typeof apRaw === 'string' ? apRaw.trim() : '';
  const stRaw = params.studio;
  const studioId = typeof stRaw === 'string' ? stRaw.trim() : '';
  const amRaw = params.amountEuros;
  const amtStr = Array.isArray(amRaw) ? amRaw[0] : amRaw;
  const amountRaw = typeof amtStr === 'string' ? amtStr.trim() : '';
  if (!appointmentId || !studioId || !amountRaw) return null;
  const amountEuros = parseFloat(amountRaw.replace(',', '.'));
  if (!Number.isFinite(amountEuros) || amountEuros < 0) return null;
  return { appointmentId, studioId, amountEuros };
}

/**
 * Route dédiée : `inkflowpro://tap-to-pay?…` est résolu par Expo Router vers `/tap-to-pay`.
 * Sans ce fichier → écran "+not-found" (« This screen doesn't exist »).
 */
export default function TapToPayScreen() {
  const router = useRouter();
  const raw = useLocalSearchParams();
  const parsed = useMemo(
    () => parseTapToPayParams(raw as Record<string, string | string[] | undefined>),
    [raw]
  );

  const handleClose = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  };

  if (!parsed) {
    return <Redirect href="/" />;
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false, presentation: 'modal' }} />
      <View style={{ flex: 1, backgroundColor: '#fafafa' }} />
      <TapToPaySheet
        studioId={parsed.studioId}
        appointmentId={parsed.appointmentId}
        amountEuros={parsed.amountEuros}
        onClose={handleClose}
      />
    </>
  );
}
