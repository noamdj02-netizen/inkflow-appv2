import { supabase } from './supabase';
import type { GooglePlaceSearchResultDTO, GoogleReviewsPayload } from '../types/googlePlaces';

function friendlyError(fn: string, raw: string): string {
  if (raw.toLowerCase().includes('fetch') || raw.toLowerCase().includes('network')) {
    return 'Service Google temporairement indisponible.';
  }
  return raw;
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
