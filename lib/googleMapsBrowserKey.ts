/**
 * Clé Google Maps côté navigateur (Maps JavaScript API, géocodage client).
 * Préférer `VITE_GOOGLE_MAPS_JS_API_KEY` (documentée dans .env.example) ;
 * `VITE_GOOGLE_MAPS_API_KEY` est conservée pour rétrocompatibilité.
 */
export function getGoogleMapsBrowserApiKey(): string | undefined {
  const a = import.meta.env.VITE_GOOGLE_MAPS_JS_API_KEY;
  const b = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  if (typeof a === 'string' && a.trim()) return a.trim();
  if (typeof b === 'string' && b.trim()) return b.trim();
  return undefined;
}
