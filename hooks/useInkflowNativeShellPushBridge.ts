/**
 * Dans l'enveloppe native Expo : envoie le JWT + studioId au parent pour qu'il
 * enregistre le jeton Expo (register-native-device) — le Web Push VAPID ne marche pas
 * de façon fiable dans WKWebView.
 */
import { useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { isInkflowNativeShellUserAgent } from '../lib/nativeWebShell';

interface UseInkflowNativeShellPushBridgeOptions {
  demoMode?: boolean;
}

const POLL_MS = 1000;

export function useInkflowNativeShellPushBridge(
  studioId: string | null,
  opts?: UseInkflowNativeShellPushBridgeOptions
): void {
  const demoMode = opts?.demoMode ?? false;
  const sentRef = useRef(false);

  useEffect(() => {
    if (demoMode || !studioId) return;
    if (typeof window === 'undefined' || typeof navigator === 'undefined') return;
    if (!isInkflowNativeShellUserAgent(navigator.userAgent)) return;
    const bridge = (
      window as Window & {
        ReactNativeWebView?: { postMessage: (payload: string) => void };
      }
    ).ReactNativeWebView;
    if (!bridge) return;

    let cancelled = false;
    let attempts = 0;
    const maxAttempts = 45;

    const tick = async () => {
      if (cancelled || sentRef.current) return;
      attempts += 1;
      if (attempts > maxAttempts) return;
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (cancelled || !session?.access_token) {
          window.setTimeout(tick, POLL_MS);
          return;
        }
        sentRef.current = true;
        bridge.postMessage(
          JSON.stringify({
            type: 'inkflow_native_push_register',
            accessToken: session.access_token,
            studioId,
          })
        );
      } catch {
        window.setTimeout(tick, POLL_MS);
      }
    };

    void tick();

    return () => {
      cancelled = true;
    };
  }, [studioId, demoMode]);
}
