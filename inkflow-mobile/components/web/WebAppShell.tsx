import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Linking, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { usePathname, useRouter, type Href } from 'expo-router';
import { tryParseTapToPayAppHttpsUrl, tryParseTapToPayDeepLink } from '@/lib/tapToPayDeepLink';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Constants from 'expo-constants';
import * as Haptics from 'expo-haptics';
import * as Notifications from 'expo-notifications';
import * as WebBrowser from 'expo-web-browser';
import WebView, { type WebViewMessageEvent, type WebViewNavigation } from 'react-native-webview';
import { WebAppLaunchOverlay } from '@/components/web/WebAppLaunchOverlay';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import type {
  ShouldStartLoadRequest,
  WebViewErrorEvent,
  WebViewHttpErrorEvent,
  WebViewOpenWindowEvent,
  WebViewProgressEvent,
} from 'react-native-webview/lib/WebViewTypes';

const WEB_APP_BASE_URL = 'https://app.ink-flow.me';
const WEB_APP_URL = `${WEB_APP_BASE_URL}/dashboard`;
const SUPABASE_URL = (process.env.EXPO_PUBLIC_SUPABASE_URL ?? '').replace(/\/$/, '');
const SUPABASE_ANON_KEY = (process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '').trim();
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

/** `send-push-notification` met `url` dans `data` Expo — souvent chemin relatif `/dashboard?…`. */
function resolvePushTargetWebUrl(raw: unknown): string | null {
  const s = typeof raw === 'string' ? raw.trim() : '';
  if (!s) return null;
  if (s.startsWith('https://') || s.startsWith('http://')) {
    try {
      const u = new URL(s);
      if (ALLOWED_WEB_HOSTS.has(u.hostname)) return u.toString();
    } catch {
      return null;
    }
    return null;
  }
  if (s.startsWith('/')) {
    return `${WEB_APP_BASE_URL.replace(/\/$/, '')}${s}`;
  }
  return null;
}

let lastRegisteredExpoPushToken: string | null = null;

async function registerExpoPushWithStudio(accessToken: string, studioId: string): Promise<void> {
  if (!SUPABASE_URL) {
    if (__DEV__) {
      console.warn('[WebAppShell] EXPO_PUBLIC_SUPABASE_URL manquant — jeton push non envoyé.');
    }
    return;
  }
  if (!SUPABASE_ANON_KEY) {
    if (__DEV__) {
      console.warn('[WebAppShell] EXPO_PUBLIC_SUPABASE_ANON_KEY manquant — register-native-device non appelé.');
    }
    return;
  }
  try {
    let perm = await Notifications.getPermissionsAsync();
    if (perm.status === 'undetermined') {
      perm = await Notifications.requestPermissionsAsync();
    }
    if (perm.status !== 'granted') {
      if (__DEV__) {
        console.warn(
          '[WebAppShell] Notifications non autorisées — active-les pour Expo Go (Paramètres → Inkflow Pro).'
        );
      }
      return;
    }

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
        apikey: SUPABASE_ANON_KEY,
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
  } catch (e) {
    if (__DEV__) {
      const msg = e instanceof Error ? e.message : String(e);
      console.warn('[WebAppShell] push registration (réseau ou Expo) :', msg);
    }
  }
}

async function openExternalUrl(url: string): Promise<void> {
  if (SYSTEM_SCHEMES.some((scheme) => url.startsWith(scheme))) {
    await Linking.openURL(url);
    return;
  }

  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      // Schémas type inkflowpro:// — jamais WebBrowser/Safari (page « adresse non valide »).
      await Linking.openURL(url);
      return;
    }
  } catch {
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
  const loadFallbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearLoadingFallback = useCallback(() => {
    if (loadFallbackTimerRef.current != null) {
      clearTimeout(loadFallbackTimerRef.current);
      loadFallbackTimerRef.current = null;
    }
  }, []);

  const armLoadingFallback = useCallback(() => {
    clearLoadingFallback();
    loadFallbackTimerRef.current = setTimeout(() => {
      loadFallbackTimerRef.current = null;
      setIsLoading(false);
    }, 22000);
  }, [clearLoadingFallback]);

  useEffect(() => () => clearLoadingFallback(), [clearLoadingFallback]);

  /** Nouvelle navigation : filet si onLoadEnd / WKWebView ne finalise pas (souvent visible en prod iOS + SPA). */
  useEffect(() => {
    armLoadingFallback();
  }, [webAppUrl, armLoadingFallback]);

  const handleWebViewMessage = useCallback((event: WebViewMessageEvent) => {
    try {
      const data = JSON.parse(event.nativeEvent.data) as {
        type?: string;
        accessToken?: string;
        refreshToken?: string;
        studioId?: string;
      };
      if (data?.type === 'inkflow_haptic_selection') {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        return;
      }
      if (data?.type === 'inkflow_native_supabase_sign_out') {
        if (isSupabaseConfigured() && supabase) {
          void supabase.auth.signOut().catch(() => {
            /* évite rejet non géré si hors-ligne */
          });
        }
        return;
      }
      if (data?.type === 'inkflow_native_supabase_session') {
        const access = typeof data.accessToken === 'string' ? data.accessToken.trim() : '';
        const refresh = typeof data.refreshToken === 'string' ? data.refreshToken.trim() : '';
        if (!access || !refresh || !isSupabaseConfigured() || !supabase) return;
        void supabase.auth.setSession({ access_token: access, refresh_token: refresh }).catch(() => {
          /* hors-ligne / refresh : pas d’écran rouge LogBox */
        });
        return;
      }
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

      const tapHttps = tryParseTapToPayAppHttpsUrl(url);
      if (tapHttps) {
        setLoadError(null);
        if (!(typeof pathname === 'string' && pathname.includes('tap-to-pay'))) {
          const q = new URLSearchParams({
            appointment: tapHttps.appointmentId,
            studio: tapHttps.studioId,
            amountEuros: tapHttps.amountEuros.toFixed(2),
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

  /** Tap sur une notification (ou cold start via notification) → même WebView que la prod. */
  useEffect(() => {
    if (Platform.OS === 'web') return;

    const applyNotificationResponse = (
      response: Notifications.NotificationResponse | null | undefined
    ) => {
      if (!response) return;
      const data = response.notification.request.content.data as Record<string, unknown> | undefined;
      const target =
        resolvePushTargetWebUrl(data?.url) ?? resolvePushTargetWebUrl(data?.actionUrl);
      if (!target) return;
      setLoadError(null);
      setWebAppUrl(target);
    };

    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      applyNotificationResponse(response);
    });

    void Notifications.getLastNotificationResponseAsync().then(applyNotificationResponse);

    return () => sub.remove();
  }, []);

  const handleShouldStartLoad = useCallback(
    (request: ShouldStartLoadRequest) => {
      if (!request.url || request.url === 'about:blank') {
        return true;
      }

      try {
        const tapHttps = tryParseTapToPayAppHttpsUrl(request.url);
        if (tapHttps) {
          setLoadError(null);
          if (!(typeof pathname === 'string' && pathname.includes('tap-to-pay'))) {
            const q = new URLSearchParams({
              appointment: tapHttps.appointmentId,
              studio: tapHttps.studioId,
              amountEuros: tapHttps.amountEuros.toFixed(2),
            }).toString();
            router.push(`/tap-to-pay?${q}` as Href);
          }
          return false;
        }

        const parsed = new URL(request.url);
        if (parsed.protocol === 'https:' && ALLOWED_WEB_HOSTS.has(parsed.hostname)) {
          return true;
        }
      } catch {
        /* URL invalide — laisser la WebView / autres garde-fous gérer */
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
    [openMappedDeepLink, pathname, router],
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
    armLoadingFallback();
  }, [armLoadingFallback]);

  const handleLoadEnd = useCallback(() => {
    clearLoadingFallback();
    setIsLoading(false);
  }, [clearLoadingFallback]);

  const handleLoadProgress = useCallback(
    (event: WebViewProgressEvent) => {
      if (event.nativeEvent.progress >= 1) {
        clearLoadingFallback();
        setIsLoading(false);
      }
    },
    [clearLoadingFallback]
  );

  const handleError = useCallback(
    (event: WebViewErrorEvent) => {
      clearLoadingFallback();
      setIsLoading(false);
      setLoadError(event.nativeEvent.description || 'Impossible de charger InkFlow.');
    },
    [clearLoadingFallback]
  );

  const handleHttpError = useCallback(
    (event: WebViewHttpErrorEvent) => {
      clearLoadingFallback();
      setIsLoading(false);
      setLoadError(event.nativeEvent.description || `Erreur HTTP ${event.nativeEvent.statusCode}`);
    },
    [clearLoadingFallback]
  );

  const handleNavigationStateChange = useCallback(
    (nav: WebViewNavigation) => {
      setLoadError(null);
      if (!nav.loading) {
        clearLoadingFallback();
        setIsLoading(false);
      }
    },
    [clearLoadingFallback]
  );

  const handleRetry = useCallback(() => {
    setLoadError(null);
    setIsLoading(true);
    armLoadingFallback();
    webViewRef.current?.reload();
  }, [armLoadingFallback]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar style="dark" />
      <WebView
        ref={webViewRef}
        source={{ uri: webAppUrl }}
        style={styles.webView}
        containerStyle={styles.webViewContainer}
        originWhitelist={['https://*', 'http://*', 'mailto:*', 'tel:*', 'sms:*', 'inkflowpro:*']}
        javaScriptEnabled
        domStorageEnabled
        sharedCookiesEnabled
        thirdPartyCookiesEnabled
        allowsBackForwardNavigationGestures
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        pullToRefreshEnabled
        setSupportMultipleWindows={false}
        startInLoadingState={false}
        decelerationRate="normal"
        applicationNameForUserAgent="InkflowProShell"
        injectedJavaScriptBeforeContentLoaded={
          Platform.OS === 'web'
            ? undefined
            : "window.__INKFLOW_PRO_SHELL__=true;true;"
        }
        {...Platform.select({
          ios: {
            contentInsetAdjustmentBehavior: 'never' as const,
          },
          default: {},
        })}
        onMessage={handleWebViewMessage}
        onShouldStartLoadWithRequest={handleShouldStartLoad}
        onOpenWindow={handleOpenWindow}
        onLoadStart={handleLoadStart}
        onLoadProgress={handleLoadProgress}
        onLoadEnd={handleLoadEnd}
        onError={handleError}
        onHttpError={handleHttpError}
        onContentProcessDidTerminate={handleRetry}
        onNavigationStateChange={handleNavigationStateChange}
      />

      {!loadError ? <WebAppLaunchOverlay visible={isLoading} /> : null}

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
    backgroundColor: 'transparent',
  },
  webViewContainer: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  webView: {
    flex: 1,
    backgroundColor: 'transparent',
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
