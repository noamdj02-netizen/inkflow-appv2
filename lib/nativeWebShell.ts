/**
 * Détecte le WebView de l'app « Inkflow Pro » (Expo).
 * `applicationNameForUserAgent` côté natif doit contenir cette chaîne ; voir `inkflow-mobile/components/web/WebAppShell.tsx`.
 */
const INKFLOW_NATIVE_SHELL_UA_MARKER = 'InkflowProShell';

export function isInkflowNativeShellUserAgent(userAgent?: string): boolean {
  if (!userAgent) return false;
  return userAgent.includes(INKFLOW_NATIVE_SHELL_UA_MARKER);
}
