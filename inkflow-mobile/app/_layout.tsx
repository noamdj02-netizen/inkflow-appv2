import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as Notifications from 'expo-notifications';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { AppState, type AppStateStatus, Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';

import { useColorScheme } from '@/components/useColorScheme';
import { setupNotificationHandler } from '@/lib/notifications';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: '(tabs)',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();

  // Configuration du handler global (badge activé) — natif uniquement (pas web)
  useEffect(() => {
    if (Platform.OS !== 'web') {
      setupNotificationHandler();
    }
  }, []);

  // Incrémenter le badge à la réception d'une notification — natif uniquement
  useEffect(() => {
    if (Platform.OS === 'web') return;
    const sub = Notifications.addNotificationReceivedListener(async () => {
      const count = await Notifications.getBadgeCountAsync();
      await Notifications.setBadgeCountAsync(count + 1);
    });
    return () => sub.remove();
  }, []);

  // Réinitialiser le badge quand l'app passe au premier plan — natif uniquement
  useEffect(() => {
    if (Platform.OS === 'web') return;
    const handleAppStateChange = (nextState: AppStateStatus) => {
      if (nextState === 'active') {
        Notifications.setBadgeCountAsync(0);
        Notifications.dismissAllNotificationsAsync();
      }
    };
    const sub = AppState.addEventListener('change', handleAppStateChange);
    return () => sub.remove();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="referral"
            options={{
              title: 'Programme Partenaire',
              headerShown: true,
              headerBackTitle: 'Retour',
              headerStyle: { backgroundColor: '#FFFFFF' },
              headerTitleStyle: { fontSize: 17, fontWeight: '600', color: '#000000' },
              headerShadowVisible: false,
              headerTintColor: '#2563EB',
            }}
          />
          <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
        </Stack>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
