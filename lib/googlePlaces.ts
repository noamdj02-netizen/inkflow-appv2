/**
 * Google Places — côté navigateur uniquement via la Edge Function Supabase `google-places`.
 *
 * - Aucun appel à `maps.googleapis.com/maps/api/place/*` ni `places.googleapis.com` depuis le front
 *   (pas de clé VITE, pas d’erreur de restriction HTTP referrer sur Places Details / Search).
 * - La clé serveur `GOOGLE_PLACES_SERVER_KEY` est lue dans `supabase/functions/google-places/index.ts`
 *   (`Deno.env.get`). Les réponses JSON (avis, note, etc.) sont renvoyées au client après succès.
 */
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
    lower.includes('invalid jwt') ||
    lower.includes('jwt expired') ||
    (lower.includes('jwt') && lower.includes('malformed'))
  ) {
    return 'Session expirée ou invalide. Déconnectez-vous, reconnectez-vous, puis réessayez.';
  }
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

/** Message utilisateur pour les toasts (évite « Invalid JWT » brut côté Supabase). */
export function formatGooglePlacesInvokeError(raw: string): string {
  return friendlyError('google-places', raw);
}

/** Les Edge Functions envoient le JWT : on rafraîchit avant appel si expiration proche, puis retry si refus. */
async function ensureFreshAuthForEdge(): Promise<void> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.expires_at) return;
  if (session.expires_at * 1000 < Date.now() + 120_000) {
    await supabase.auth.refreshSession().catch(() => {});
  }
}

function isJwtRejectedMessage(msg: string): boolean {
  const lower = msg.toLowerCase();
  return lower.includes('invalid jwt') || lower.includes('jwt expired');
}

/**
 * Appelle uniquement `supabase.functions.invoke('google-places', …)` — aucune autre origine pour Places.
 * Utilisé pour les actions publiques (sans rafraîchissement JWT).
 */
async function invokeGooglePlacesEdge<T>(
  body: Record<string, unknown>
): Promise<{ data: T | null; error: { message: string } | null }> {
  const res = await supabase.functions.invoke<T>('google-places', { body });
  return { data: res.data ?? null, error: res.error as { message: string } | null };
}

async function invokeGooglePlacesJwt<T>(
  body: Record<string, unknown>
): Promise<{ data: T | null; error: { message: string } | null }> {
  await ensureFreshAuthForEdge();
  let res = await supabase.functions.invoke<T>('google-places', { body });
  if (res.error && isJwtRejectedMessage(res.error.message)) {
    await supabase.auth.refreshSession().catch(() => {});
    res = await supabase.functions.invoke<T>('google-places', { body });
  }
  return { data: res.data ?? null, error: res.error as { message: string } | null };
}

/**
 * Avis Google pour la vitrine publique (slug).
 * L’Edge Function appelle Places Details côté serveur puis retourne `rating`, `userRatingsTotal`, `reviews`.
 */
export async function fetchPublicGoogleReviews(
  slug: string
): Promise<(GoogleReviewsPayload & { configured: boolean }) | null> {
  const { data, error } = await invokeGooglePlacesEdge<
    GoogleReviewsPayload & { configured?: boolean; error?: string }
  >({
    action: 'public_reviews',
    slug: slug.trim().toLowerCase(),
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

/** Appelle google-business-auth avec JWT frais + retry automatique. */
async function invokeGoogleBusinessJwt<T>(
  body: Record<string, unknown>
): Promise<{ data: T | null; error: { message: string } | null }> {
  await ensureFreshAuthForEdge();
  let res = await supabase.functions.invoke<T>('google-business-auth', { body });
  if (res.error && isJwtRejectedMessage(res.error.message)) {
    await supabase.auth.refreshSession().catch(() => {});
    res = await supabase.functions.invoke<T>('google-business-auth', { body });
  }
  if (res.error) {
    const msg = res.error.message ?? '';
    const lower = msg.toLowerCase();
    if (lower.includes('401') || lower.includes('unauthorized') || lower.includes('non-2xx')) {
      return { data: null, error: { message: 'Google Business non configure sur ce projet. Contactez le support Inkflow.' } };
    }
  }
  return { data: res.data ?? null, error: res.error as { message: string } | null };
}

/** Genere l'URL OAuth Google Business et redirige l'utilisateur. */
export async function initiateGoogleBusinessAuth(studioId: string): Promise<string> {
  const { data, error } = await invokeGoogleBusinessJwt<{ authUrl?: string; error?: string }>({
    action: 'initiate', studioId,
  });
  if (error) throw new Error(error.message);
  if (data?.error) throw new Error(data.error);
  if (!data?.authUrl) throw new Error('authUrl manquant');
  return data.authUrl;
}

/** Verifie si le studio a connecte un compte Google Business. */
export async function getGoogleBusinessStatus(studioId: string): Promise<GoogleBusinessStatus> {
  const { data, error } = await invokeGoogleBusinessJwt<GoogleBusinessStatus & { error?: string }>({
    action: 'status', studioId,
  });
  if (error) throw new Error(error.message);
  if (data?.error) throw new Error(data.error);
  return {
    connected: data?.connected ?? false,
    locationName: data?.locationName ?? null,
    needsLocationSelection: data?.needsLocationSelection ?? false,
  };
}

/** Liste les fiches Google Business. `force=true` ignore la cache DB (bouton Rafraîchir). */
export async function listGoogleBusinessLocations(
  studioId: string,
  force = false
): Promise<{ name: string; title: string; accountName: string }[]> {
  const { data, error } = await invokeGoogleBusinessJwt<{
    locations?: { name: string; title: string; accountName: string }[];
    cached?: boolean;
    autoSelected?: string | null;
    error?: string;
  }>({ action: 'locations', studioId, force });
  if (error) throw new Error(error.message);
  if (data?.error) throw new Error(data.error);
  return data?.locations ?? [];
}

/** Enregistre la fiche Google Business choisie. */
export async function saveGoogleBusinessLocation(studioId: string, locationName: string): Promise<void> {
  const { data, error } = await invokeGoogleBusinessJwt<{ error?: string }>({
    action: 'save_location', studioId, locationName,
  });
  if (error) throw new Error(error.message);
  if (data?.error) throw new Error(data.error);
}

/** Revoque et supprime les tokens Google Business. */
export async function disconnectGoogleBusiness(studioId: string): Promise<void> {
  const { data, error } = await invokeGoogleBusinessJwt<{ error?: string }>({
    action: 'disconnect', studioId,
  });
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
  const { data, error } = await invokeGooglePlacesEdge<
    GoogleBusinessReviewsPayload & { configured?: boolean; source?: string; error?: string }
  >({
    action: 'business_public_reviews',
    slug: slug.trim().toLowerCase(),
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
  const { data, error } = await invokeGooglePlacesJwt<{ placeId?: string | null; error?: string }>({
    action: 'resolve_maps_paste',
    input: input.trim(),
  });
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
  const { data, error } = await invokeGooglePlacesJwt<{ results?: GooglePlaceSearchResultDTO[]; error?: string }>({
    action: 'text_search',
    query: query.trim(),
  });

  if (error) {
    throw new Error(friendlyError('google-places', error.message));
  }
  if (data && typeof data === 'object' && 'error' in data && data.error) {
    throw new Error(friendlyError('google-places', data.error));
  }
  return data?.results ?? [];
}

/**
 * Détail lieu + avis pour l’aperçu dashboard (`action: place_details` sur l’Edge Function).
 * Même chaîne que la vitrine : Places API uniquement sur le serveur.
 */
export async function fetchAuthenticatedPlaceDetails(
  placeId: string
): Promise<GoogleReviewsPayload | null> {
  const { data, error } = await invokeGooglePlacesJwt<GoogleReviewsPayload & { error?: string }>({
    action: 'place_details',
    placeId: placeId.trim(),
  });
  if (error) {
    console.warn('[google-places] place_details', error.message);
    return null;
  }
  if (data && typeof data === 'object' && 'error' in data && data.error) {
    return null;
  }
  if (!data || typeof data !== 'object') return null;
  return {
    rating: data.rating ?? null,
    userRatingsTotal: data.userRatingsTotal ?? 0,
    reviews: Array.isArray(data.reviews) ? data.reviews : [],
  };
}

/** Met en cache les avis dans `inkflow_studios.google_reviews_cache` (vitrine + repli API). */
export async function syncStudioGoogleReviewsCache(
  studioId: string,
  placeId?: string | null
): Promise<void> {
  const body: Record<string, unknown> = {
    action: 'sync_studio_google_reviews',
    studioId,
    ...(placeId != null && placeId !== '' ? { placeId } : {}),
  };
  const { data, error } = await invokeGooglePlacesJwt<{ ok?: boolean; error?: string }>(body);
  if (error) throw new Error(friendlyError('google-places', error.message));
  if (data && typeof data === 'object' && 'error' in data && data.error) {
    throw new Error(friendlyError('google-places', String(data.error)));
  }
}
