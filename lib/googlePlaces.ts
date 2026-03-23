import { supabase } from './supabase';
import type {
  GooglePlaceSearchResultDTO,
  GoogleReviewsPayload,
  GoogleBusinessReview,
  GoogleBusinessReviewsPayload,
  GoogleBusinessStatus,
} from '../types/googlePlaces';

function friendlyError(_fn: string, raw: string): string {
  const lower = raw.toLowerCase();
  if (
    lower.includes('failed to send') ||
    lower.includes('edge function') ||
    lower.includes('functionsrelayerror') ||
    lower.includes('functionsfetcherror') ||
    lower.includes('failed to fetch') ||
    lower.includes('networkerror')
  ) {
    if (typeof console !== 'undefined' && console.warn) {
      console.warn(
        '[google-places] Erreur technique:',
        raw,
        '— Vérifier côté projet : fonction edge `google-places` déployée, secret GOOGLE_PLACES_API_KEY (ou GOOGLE_MAPS_API_KEY), CORS. Voir docs/ENV-PRODUCTION.md'
      );
    }
    return 'Recherche Google indisponible. Dans « Options avancées », collez l’URL ou le Place ID de votre fiche — ou réessayez plus tard.';
  }
  if (lower.includes('non authentifie') || lower.includes('401')) {
    return 'Session expirée : reconnectez-vous puis réessayez la recherche.';
  }
  if (lower.includes('configuration serveur') || lower.includes('503')) {
    return 'La recherche Google n’est pas activée sur le serveur pour l’instant. Utilisez l’URL ou le Place ID dans les options avancées, ou contactez le support Inkflow.';
  }
  if (lower.includes('request_denied') || lower.includes('not authorized') || lower.includes('api key')) {
    return 'Cle Google ou API Places refusee : verifiez la cle et l\'activation Places API dans Google Cloud.';
  }
  if (lower.includes('fetch') || lower.includes('network')) {
    return 'Service Google temporairement indisponible (reseau).';
  }
  return raw.length > 180 ? `${raw.slice(0, 177)}...` : raw;
}

/** Avis publics pour une vitrine (slug). Pas de cle API cote navigateur. */
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

// ── Google Business Profile OAuth ─────────────────────────────────────────────

/** Genere l'URL OAuth Google Business et redirige l'utilisateur. */
export async function initiateGoogleBusinessAuth(studioId: string): Promise<string> {
  const { data, error } = await supabase.functions.invoke<{ authUrl?: string; error?: string }>(
    'google-business-auth',
    { body: { action: 'initiate', studioId } }
  );
  if (error) throw new Error(error.message);
  if (data?.error) throw new Error(data.error);
  if (!data?.authUrl) throw new Error('authUrl manquant');
  return data.authUrl;
}

/** Verifie si le studio a connecte un compte Google Business. */
export async function getGoogleBusinessStatus(studioId: string): Promise<GoogleBusinessStatus> {
  const { data, error } = await supabase.functions.invoke<GoogleBusinessStatus & { error?: string }>(
    'google-business-auth',
    { body: { action: 'status', studioId } }
  );
  if (error) throw new Error(error.message);
  if (data?.error) throw new Error(data.error);
  return {
    connected: data?.connected ?? false,
    locationName: data?.locationName ?? null,
    needsLocationSelection: data?.needsLocationSelection ?? false,
  };
}

/** Liste les fiches Google Business disponibles pour ce compte. */
export async function listGoogleBusinessLocations(
  studioId: string
): Promise<{ name: string; title: string; accountName: string }[]> {
  const { data, error } = await supabase.functions.invoke<{
    locations?: { name: string; title: string; accountName: string }[];
    error?: string;
  }>('google-business-auth', { body: { action: 'locations', studioId } });
  if (error) throw new Error(error.message);
  if (data?.error) throw new Error(data.error);
  return data?.locations ?? [];
}

/** Enregistre la fiche Google Business choisie. */
export async function saveGoogleBusinessLocation(studioId: string, locationName: string): Promise<void> {
  const { data, error } = await supabase.functions.invoke<{ error?: string }>(
    'google-business-auth',
    { body: { action: 'save_location', studioId, locationName } }
  );
  if (error) throw new Error(error.message);
  if (data?.error) throw new Error(data.error);
}

/** Revoque et supprime les tokens Google Business. */
export async function disconnectGoogleBusiness(studioId: string): Promise<void> {
  const { data, error } = await supabase.functions.invoke<{ error?: string }>(
    'google-business-auth',
    { body: { action: 'disconnect', studioId } }
  );
  if (error) throw new Error(error.message);
  if (data?.error) throw new Error(data.error);
}

/**
 * Avis Business Profile complets pour une vitrine (slug).
 * Retourne null si non configure, ou tous les avis si OAuth connecte.
 */
export async function fetchBusinessPublicReviews(
  slug: string
): Promise<(GoogleBusinessReviewsPayload & { configured: boolean; source: 'business' }) | null> {
  const { data, error } = await supabase.functions.invoke<
    GoogleBusinessReviewsPayload & { configured?: boolean; source?: string; error?: string }
  >('google-places', {
    body: { action: 'business_public_reviews', slug: slug.trim().toLowerCase() },
  });
  if (error) { console.warn('[google-business]', error.message); return null; }
  if (data?.error) { console.warn('[google-business]', data.error); return null; }
  if (!data || !data.configured) return null;
  return {
    reviews: Array.isArray(data.reviews) ? (data.reviews as GoogleBusinessReview[]) : [],
    averageRating: data.averageRating ?? null,
    totalReviewCount: data.totalReviewCount ?? 0,
    configured: true,
    source: 'business',
  };
}

// ── Google Places (Places API, 5 avis max) ────────────────────────────────────

/**
 * Suit les redirections (liens courts Google) et extrait un Place ID — JWT requis.
 * Ne dépend pas de GOOGLE_PLACES_API_KEY (résolution HTTP).
 */
export async function resolveMapsPasteViaEdge(input: string): Promise<string | null> {
  const { data, error } = await supabase.functions.invoke<{ placeId?: string | null; error?: string }>(
    'google-places',
    { body: { action: 'resolve_maps_paste', input: input.trim() } }
  );
  if (error) {
    console.warn('[google-places] resolve_maps_paste', error.message);
    return null;
  }
  if (data?.error && !data.placeId) return null;
  const id = data?.placeId;
  return typeof id === 'string' && id.length > 0 ? id : null;
}

/** Recherche d'etablissements (JWT requis). */
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
