import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Linking, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { usePathname, useRouter, type Href } from 'expo-router';
import { tryParseTapToPayDeepLink } from '@/lib/tapToPayDeepLink';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import * as WebBrowser from 'expo-web-browser';
import WebView, { type WebViewMessageEvent, type WebViewNavigation } from 'react-native-webview';
import type {
  ShouldStartLoadRequest,
  WebViewErrorEvent,
  WebViewHttpErrorEvent,
  WebViewOpenWindowEvent,
} from 'react-native-webview/lib/WebViewTypes';

const WEB_APP_BASE_URL = 'https://app.ink-flow.me';
const WEB_APP_URL = `${WEB_APP_BASE_URL}/dashboard`;
const SUPABASE_URL = (process.env.EXPO_PUBLIC_SUPABASE_URL ?? '').replace(/\/$/, '');
const ALLOWED_WEB_HOSTS = new Set(['app.ink-flow.me']);
const SYSTEM_SCHEMES = ['mailto:', 'tel:', 'sms:'];

function mapDeepLinkToWebUrl(url: string): string | null {
  try {
    const parsed = new URL(url);

    if (parsed.protocol === 'https:' && ALLOWED_WEB_HOSTS.has(parsed.hostname)) {
      return parsed.toString();
    }

    if (parsed.protocol !== 'inkflowpro:') {
      return null;
    }

    const target = parsed.hostname || parsed.pathname.replace('/', '');
    const firstPathPart = parsed.pathname.split('/').filter(Boolean)[0];
    const appointmentId =
      ['appointment', 'appointments', 'session'].includes(target) ? firstPathPart : null;

    const mapped = new URL('/dashboard', WEB_APP_BASE_URL);
    if (target === 'agenda' || target === 'calendar') {
      mapped.searchParams.set('tab', 'agenda');
    } else if (target === 'requests' || target === 'demandes') {
      mapped.searchParams.set('tab', 'requests');
    } else if (target === 'stock') {
      mapped.searchParams.set('tab', 'stock');
      for (const [key, value] of parsed.searchParams.entries()) {
        mapped.searchParams.set(key, value);
      }
    } else if (appointmentId) {
      mapped.searchParams.set('appointment', appointmentId);
    }

    return mapped.toString();
  } catch {
    return null;
  }
}

function shouldOpenExternally(url: string): boolean {
  if (SYSTEM_SCHEMES.some((scheme) => url.startsWith(scheme))) {
    return true;
  }

  try {
    const parsed = new URL(url);

    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return true;
    }

    if (ALLOWED_WEB_HOSTS.has(parsed.hostname)) {
      return false;
    }

    return true;
  } catch {
    return true;
  }
}

let lastRegisteredExpoPushToken: string | null = null;

async function registerExpoPushWithStudio(accessToken: string, studioId: string): Promise<void> {
  if (!SUPABASE_URL) {
    if (__DEV__) {
      console.warn('[WebAppShell] EXPO_PUBLIC_SUPABASE_URL manquant — jeton push non envoyé.');
    }
    return;
  }
  const perm = await Notifications.getPermissionsAsync();
  let status = perm.status;
  if (status !== 'granted') {
    const req = await Notifications.requestPermissionsAsync();
    status = req.status;
  }
  if (status !== 'granted') return;

  const projectId =
    (Constants.expoConfig?.extra?.eas?.projectId as string | undefined) ??
    Constants.easConfig?.projectId;
  const tokenRes = await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined);
  const expoToken = tokenRes.data;
  if (!expoToken) return;
  if (lastRegisteredExpoPushToken === expoToken) return;
  lastRegisteredExpoPushToken = expoToken;

  const res = await fetch(`${SUPABASE_URL}/functions/v1/register-native-device`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      token: expoToken,
      platform: Platform.OS,
      studio_id: studioId,
    }),
  });
  if (!res.ok && __DEV__) {
    console.warn('[WebAppShell] register-native-device', res.status, await res.text());
  }
}

async function openExternalUrl(url: string): Promise<void> {
  if (SYSTEM_SCHEMES.some((scheme) => url.startsWith(scheme))) {
    await Linking.openURL(url);
    return;
  }

  await WebBrowser.openBrowserAsync(url, {
    presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET,
  });
}

export default function WebAppShell() {
  const router = useRouter();
  const pathname = usePathname();
  const webViewRef = useRef<WebView>(null);
  const [webAppUrl, setWebAppUrl] = useState(WEB_APP_URL);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const handleNativePushRegisterMessage = useCallback((event: WebViewMessageEvent) => {
    try {
      const data = JSON.parse(event.nativeEvent.data) as {
        type?: string;
        accessToken?: string;
        studioId?: string;
      };
      if (data?.type !== 'inkflow_native_push_register') return;
      const tok = typeof data.accessToken === 'string' ? data.accessToken.trim() : '';
      const sid = typeof data.studioId === 'string' ? data.studioId.trim() : '';
      if (!tok || !sid) return;
      void registerExpoPushWithStudio(tok, sid);
    } catch {
      /* ignore malformed */
    }
  }, []);

  const openMappedDeepLink = useCallback(
    (url: string) => {
      const tap = tryParseTapToPayDeepLink(url);
      if (tap) {
        setLoadError(null);
        // Expo Router peut déjà avoir ouvert `/tap-to-pay` (URL système) — éviter double navigation.
        if (!(typeof pathname === 'string' && pathname.includes('tap-to-pay'))) {
          const q = new URLSearchParams({
            appointment: tap.appointmentId,
            studio: tap.studioId,
            amountEuros: tap.amountEuros.toFixed(2),
          }).toString();
          router.push(`/tap-to-pay?${q}` as Href);
        }
        return true;
      }

      const mappedUrl = mapDeepLinkToWebUrl(url);
      if (!mappedUrl) return false;
      setLoadError(null);
      setWebAppUrl(mappedUrl);
      return true;
    },
    [pathname, router]
  );

  useEffect(() => {
    void Linking.getInitialURL().then((initialUrl) => {
      if (initialUrl) {
        openMappedDeepLink(initialUrl);
      }
    });

    const subscription = Linking.addEventListener('url', ({ url }) => {
      openMappedDeepLink(url);
    });

    return () => subscription.remove();
  }, [openMappedDeepLink]);

  const handleShouldStartLoad = useCallback(
    (request: ShouldStartLoadRequest) => {
      if (!request.url || request.url === 'about:blank') {
        return true;
      }

      if (openMappedDeepLink(request.url)) {
        return false;
      }

      if (shouldOpenExternally(request.url)) {
        void openExternalUrl(request.url);
        return false;
      }

      return true;
    },
    [openMappedDeepLink],
  );

  const handleOpenWindow = useCallback((event: WebViewOpenWindowEvent) => {
    const { targetUrl } = event.nativeEvent;
    if (targetUrl) {
      void openExternalUrl(targetUrl);
    }
  }, []);

  const handleLoadStart = useCallback(() => {
    setIsLoading(true);
    setLoadError(null);
  }, []);

  const handleLoadEnd = useCallback(() => {
    setIsLoading(false);
  }, []);

  const handleError = useCallback((event: WebViewErrorEvent) => {
    setIsLoading(false);
    setLoadError(event.nativeEvent.description || 'Impossible de charger InkFlow.');
  }, []);

  const handleHttpError = useCallback((event: WebViewHttpErrorEvent) => {
    setIsLoading(false);
    setLoadError(event.nativeEvent.description || `Erreur HTTP ${event.nativeEvent.statusCode}`);
  }, []);

  const handleNavigationStateChange = useCallback((_navigationState: WebViewNavigation) => {
    setLoadError(null);
  }, []);

  const handleRetry = useCallback(() => {
    setLoadError(null);
    setIsLoading(true);
    webViewRef.current?.reload();
  }, []);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar style="dark" />
      <WebView
        ref={webViewRef}
        source={{ uri: webAppUrl }}
        style={styles.webView}
        containerStyle={styles.webViewContainer}
        originWhitelist={['https://*', 'http://*', 'mailto:*', 'tel:*', 'sms:*']}
        javaScriptEnabled
        domStorageEnabled
        sharedCookiesEnabled
        thirdPartyCookiesEnabled
        allowsBackForwardNavigationGestures
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        pullToRefreshEnabled
        setSupportMultipleWindows={false}
        startInLoadingState
        decelerationRate="normal"
        applicationNameForUserAgent="InkflowProShell"
        {...Platform.select({
          ios: {
            contentInsetAdjustmentBehavior: 'never' as const,
          },
          default: {},
        })}
        onMessage={handleNativePushRegisterMessage}
        onShouldStartLoadWithRequest={handleShouldStartLoad}
        onOpenWindow={handleOpenWindow}
        onLoadStart={handleLoadStart}
        onLoadEnd={handleLoadEnd}
        onError={handleError}
        onHttpError={handleHttpError}
        onContentProcessDidTerminate={handleRetry}
        onNavigationStateChange={handleNavigationStateChange}
      />

      {isLoading && !loadError ? (
        <View style={styles.loadingOverlay} pointerEvents="none">
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.loadingText}>Chargement d’InkFlow…</Text>
        </View>
      ) : null}

      {loadError ? (
        <View style={styles.errorOverlay}>
          <Text style={styles.errorTitle}>Connexion impossible</Text>
          <Text style={styles.errorText}>
            Vérifie ta connexion internet, puis relance le chargement de l’app.
          </Text>
          <Text style={styles.errorDetail}>{loadError}</Text>
          <Pressable
            style={({ pressed }) => [styles.retryButton, pressed && styles.retryButtonPressed]}
            onPress={handleRetry}
          >
            <Text style={styles.retryButtonText}>Réessayer</Text>
          </Pressable>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  webViewContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  webView: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    gap: 12,
  },
  loadingText: {
    color: '#52525b',
    fontSize: 15,
    fontWeight: '600',
  },
  errorOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 28,
  },
  errorTitle: {
    color: '#18181b',
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
  },
  errorText: {
    color: '#52525b',
    fontSize: 16,
    lineHeight: 23,
    marginTop: 10,
    textAlign: 'center',
  },
  errorDetail: {
    color: '#a1a1aa',
    fontSize: 12,
    lineHeight: 17,
    marginTop: 14,
    textAlign: 'center',
  },
  retryButton: {
    minHeight: 48,
    marginTop: 22,
    paddingHorizontal: 24,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#18181b',
    ...Platform.select({
      ios: {
        shadowColor: '#18181b',
        shadowOpacity: 0.16,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 6 },
      },
      android: { elevation: 3 },
    }),
  },
  retryButtonPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.98 }],
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
});
