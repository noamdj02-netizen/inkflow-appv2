import { supabase } from './supabase';
import type { GooglePlaceSearchResultDTO, GoogleReviewsPayload } from '../types/googlePlaces';

function friendlyError(_fn: string, raw: string): string {
  const lower = raw.toLowerCase();
  if (
    lower.includes('failed to send') ||
    lower.includes('edge function') ||
    lower.includes('functionsrelayerror')
  ) {
    if (typeof console !== 'undefined' && console.warn) {
      console.warn(
        '[google-places] Vérifiez : fonction google-places déployée, secret GOOGLE_PLACES_API_KEY, domaine autorisé (CORS). Voir docs/ENV-PRODUCTION.md'
      );
    }
    return 'Connexion à la recherche Google impossible (serveur). Vérifiez que la fonction Supabase « google-places » est déployée et que le secret GOOGLE_PLACES_API_KEY est défini.';
  }
  if (lower.includes('non authentifié') || lower.includes('401')) {
    return 'Session expirée : reconnectez-vous puis réessayez la recherche.';
  }
  if (lower.includes('configuration serveur') || lower.includes('503')) {
    return 'Recherche Google non configurée côté serveur (clé API manquante). Contactez l’administrateur.';
  }
  if (lower.includes('request_denied') || lower.includes('not authorized') || lower.includes('api key')) {
    return 'Clé Google ou API Places refusée : vérifiez la clé et l’activation « Places API » / « Places API (New) » dans Google Cloud.';
  }
  if (lower.includes('fetch') || lower.includes('network')) {
    return 'Service Google temporairement indisponible (réseau).';
  }
  return raw.length > 180 ? `${raw.slice(0, 177)}…` : raw;
}

/** Avis publics pour une vitrine (slug). Pas de clé API côté navigateur. */
export async function fetchPublicGoogleReviews(
  slug: string
): Promise<(GoogleReviewsPayload & { configured: boolean }) | null> {
  const { data, error } = await supabase.functions.invoke<
    GoogleReviewsPayload & { configured?: boolean; error?: string }
  >('google-places', {
    body: { action: 'public_reviews', slug: slug.trim().toLowerCase() },
  });

  if (error) {
    console.warn('[google-places]', error.message);
    return null;
  }
  if (data && typeof data === 'object' && 'error' in data && data.error) {
    console.warn('[google-places]', data.error);
    return null;
  }
  if (!data || typeof data !== 'object') return null;

  const configured = Boolean(data.configured);
  return {
    rating: data.rating ?? null,
    userRatingsTotal: data.userRatingsTotal ?? 0,
    reviews: Array.isArray(data.reviews) ? data.reviews : [],
    configured,
  };
}

/** Recherche d’établissements (JWT requis). */
export async function searchGooglePlaces(query: string): Promise<GooglePlaceSearchResultDTO[]> {
  const { data, error } = await supabase.functions.invoke<{ results?: GooglePlaceSearchResultDTO[]; error?: string }>(
    'google-places',
    { body: { action: 'text_search', query: query.trim() } }
  );

  if (error) {
    throw new Error(friendlyError('google-places', error.message));
  }
  if (data && typeof data === 'object' && 'error' in data && data.error) {
    throw new Error(friendlyError('google-places', data.error));
  }
  return data?.results ?? [];
}
