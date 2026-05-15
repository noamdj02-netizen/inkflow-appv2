/**
 * Enveloppe native Expo : copie la session Supabase du WebView vers le client natif (AsyncStorage).
 * Requis pour Tap to Pay / Edge Functions qui utilisent `getSession()` côté `inkflow-mobile`.
 */
import { useEffect, useRef } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { isInkflowProShellClient } from '../lib/nativeWebShell';

interface UseInkflowNativeShellSessionBridgeOptions {
  demoMode?: boolean;
}

export function useInkflowNativeShellSessionBridge(
  opts?: UseInkflowNativeShellSessionBridgeOptions
): void {
  const demoMode = opts?.demoMode ?? false;
  const lastAccessPostedRef = useRef<string | null>(null);

  useEffect(() => {
    if (demoMode) return;
    if (typeof window === 'undefined' || typeof navigator === 'undefined') return;
    if (!isInkflowProShellClient()) return;
    const bridge = (
      window as Window & {
        ReactNativeWebView?: { postMessage: (payload: string) => void };
      }
    ).ReactNativeWebView;
    if (!bridge) return;

    const postSession = (session: Session | null) => {
      if (!session?.access_token || !session.refresh_token) return;
      if (session.access_token === lastAccessPostedRef.current) return;
      lastAccessPostedRef.current = session.access_token;
      bridge.postMessage(
        JSON.stringify({
          type: 'inkflow_native_supabase_session',
          accessToken: session.access_token,
          refreshToken: session.refresh_token,
        })
      );
    };

    void supabase.auth.getSession().then(({ data: { session } }) => {
      postSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.access_token || !session.refresh_token) {
        if (lastAccessPostedRef.current !== null) {
          lastAccessPostedRef.current = null;
          bridge.postMessage(JSON.stringify({ type: 'inkflow_native_supabase_sign_out' }));
        }
        return;
      }
      postSession(session);
    });

    return () => subscription.unsubscribe();
  }, [demoMode]);
}
