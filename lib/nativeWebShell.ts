/**
 * Détecte le WebView de l'app « Inkflow Pro » (Expo).
 * `applicationNameForUserAgent` côté natif doit contenir cette chaîne ; voir `inkflow-mobile/components/web/WebAppShell.tsx`.
 * Secours : `window.__INKFLOW_PRO_SHELL__` injecté avant le document (tous les WKWebView
 * n'exposent pas le suffixe UA dans `navigator.userAgent`).
 */
const INKFLOW_NATIVE_SHELL_UA_MARKER = 'InkflowProShell';

declare global {
  interface Window {
    __INKFLOW_PRO_SHELL__?: boolean;
  }
}

export function isInkflowNativeShellUserAgent(userAgent?: string): boolean {
  if (!userAgent) return false;
  return userAgent.includes(INKFLOW_NATIVE_SHELL_UA_MARKER);
}

/** Détection côté web : flag shell natif ou marqueur UA. */
export function isInkflowProShellClient(): boolean {
  if (typeof window !== 'undefined' && window.__INKFLOW_PRO_SHELL__ === true) {
    return true;
  }
  if (typeof navigator === 'undefined') return false;
  return isInkflowNativeShellUserAgent(navigator.userAgent);
}
