/**
 * Google Places — côté navigateur uniquement via la Edge Function Supabase `google-places`.
 *
 * - Aucun appel à `maps.googleapis.com/maps/api/place/*` ni `places.googleapis.com` depuis le front
 *   (pas de clé VITE, pas d’erreur de restriction HTTP referrer sur Places Details / Search).
 * - La clé serveur `GOOGLE_PLACES_SERVER_KEY` est lue dans `supabase/functions/google-places/index.ts`
 *   (`Deno.env.get`). Les réponses JSON (avis, note, etc.) sont renvoyées au client après succès.
 */
import { isAccessTokenForCurrentSupabaseProject, supabase } from './supabase';
import type {
  GooglePlaceSearchResultDTO,
  GoogleReviewsPayload,
  GoogleBusinessReview,
  GoogleBusinessReviewsPayload,
  GoogleBusinessStatus,
  GoogleBusinessLocationsResult,
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

/** Messages toast pour les échecs `invoke` vers `google-business-auth` (sans confondre avec « projet non configuré »). */
function formatGoogleBusinessAuthInvokeError(raw: string): string {
  const lower = raw.toLowerCase();
  if (isJwtRejectedMessage(raw) || lower.includes('missing authorization')) {
    return 'Session expirée ou invalide. Déconnectez-vous, reconnectez-vous à Inkflow, puis réessayez.';
  }
  if (
    lower.includes('401') ||
    lower.includes('unauthorized') ||
    lower.includes('non-2xx') ||
    lower.includes('403') ||
    lower.includes('forbidden')
  ) {
    return 'Accès refusé. Reconnectez-vous à Inkflow ou reconnectez Google Business (Paramètres > Vitrine ou Établissement). Si le problème continue, vérifiez que la fonction edge `google-business-auth` est déployée sur Supabase.';
  }
  if (
    lower.includes('failed to fetch') ||
    lower.includes('network') ||
    lower.includes('functionsrelayerror') ||
    lower.includes('functionsfetcherror')
  ) {
    return 'Connexion au serveur impossible. Vérifiez le réseau ou réessayez plus tard.';
  }
  return raw.length > 200 ? `${raw.slice(0, 197)}…` : raw;
}

/** Export pour alignement avec `formatGooglePlacesInvokeError` (toasts / UI). */
export function formatGoogleBusinessAuthError(raw: string): string {
  return formatGoogleBusinessAuthInvokeError(raw);
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

function getSupabaseUrlAndAnonForEdge(): { baseUrl: string; anonKey: string } {
  const baseUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim().replace(/\/+$/, '');
  const anonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim().replace(/^['"]|['"]$/g, '');
  return { baseUrl, anonKey };
}

/**
 * Appelle `google-business-auth` via fetch explicite (JWT + apikey), comme Stripe Connect.
 * Évite les échecs opaques de `supabase.functions.invoke` (« Failed to send a request to the Edge Function »).
 */
async function invokeGoogleBusinessJwt<T>(
  body: Record<string, unknown>
): Promise<{ data: T | null; error: { message: string } | null }> {
  await ensureFreshAuthForEdge();

  const { baseUrl, anonKey } = getSupabaseUrlAndAnonForEdge();
  const fnUrl = `${baseUrl}/functions/v1/google-business-auth`;

  type PostResult =
    | { kind: 'network'; message: string }
    | { kind: 'http'; res: Response; text: string; parsed: (T & { error?: string }) | null };

  const postJson = async (accessToken: string | null): Promise<PostResult> => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (anonKey) headers.apikey = anonKey;
    if (accessToken) headers.Authorization = `Bearer ${accessToken}`;

    try {
      const res = await fetch(fnUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });
      const text = await res.text();
      let parsed: (T & { error?: string }) | null = null;
      if (text) {
        try {
          parsed = JSON.parse(text) as T & { error?: string };
        } catch {
          parsed = null;
        }
      }
      return { kind: 'http', res, text, parsed };
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      return { kind: 'network', message };
    }
  };

  const mapHttpToReturn = (
    o: Extract<PostResult, { kind: 'http' }>
  ): { data: T | null; error: { message: string } | null } => {
    const { res, text, parsed } = o;
    const payload = parsed as { error?: unknown } | null | undefined;

    // Même logique que `functions.invoke` : 4xx/5xx mais corps JSON avec `error` → exposé comme `data`.
    if (
      !res.ok &&
      payload &&
      typeof payload === 'object' &&
      typeof payload.error === 'string' &&
      payload.error.trim().length > 0
    ) {
      return { data: parsed as T, error: null };
    }

    if (!res.ok) {
      const hint =
        (payload && typeof payload === 'object' && typeof payload.error === 'string' && payload.error) ||
        text.slice(0, 400);
      return {
        data: parsed ?? null,
        error: { message: formatGoogleBusinessAuthInvokeError(hint || `HTTP ${res.status}`) },
      };
    }

    return { data: parsed ?? null, error: null };
  };

  const shouldRetryJwt = (o: Extract<PostResult, { kind: 'http' }>): boolean => {
    if (o.res.ok) return false;
    if (o.res.status === 401) return true;
    return isJwtRejectedMessage(o.text.slice(0, 500));
  };

  const {
    data: { session },
  } = await supabase.auth.getSession();
  let accessToken = session?.access_token ?? null;

  if (!accessToken) {
    return {
      data: null,
      error: { message: 'Session expirée ou absente. Reconnectez-vous puis réessayez.' },
    };
  }

  if (!isAccessTokenForCurrentSupabaseProject(accessToken)) {
    return {
      data: null,
      error: {
        message:
          'Votre session correspond à un autre projet Supabase que celui configuré dans cette app (.env). Déconnectez-vous, vérifiez VITE_SUPABASE_URL, puis reconnectez-vous.',
      },
    };
  }

  let outcome = await postJson(accessToken);

  if (outcome.kind === 'http' && !outcome.res.ok && shouldRetryJwt(outcome)) {
    await supabase.auth.refreshSession().catch(() => {});
    const {
      data: { session: s2 },
    } = await supabase.auth.getSession();
    accessToken = s2?.access_token ?? null;
    if (accessToken && isAccessTokenForCurrentSupabaseProject(accessToken)) {
      outcome = await postJson(accessToken);
    }
  }

  let result: { data: T | null; error: { message: string } | null };
  if (outcome.kind === 'network') {
    result = {
      data: null,
      error: { message: formatGoogleBusinessAuthInvokeError(outcome.message) },
    };
  } else {
    result = mapHttpToReturn(outcome);
  }

  // #region agent log
  {
    const {
      data: { session: sLog },
    } = await supabase.auth.getSession();
    const tok = sLog?.access_token;
    const jwtMatch =
      typeof tok === 'string' && tok.length > 0 ? isAccessTokenForCurrentSupabaseProject(tok) : null;
    const httpStatus =
      outcome.kind === 'http' ? outcome.res.status : 'network';
    const errSlice =
      result.error?.message?.slice(0, 160) ??
      (outcome.kind === 'http' ? outcome.text.slice(0, 120) : outcome.message.slice(0, 120));
    const payload = {
      sessionId: 'df269f',
      runId: 'post-fix',
      hypothesisId: 'H1-H5',
      location: 'lib/googlePlaces.ts:invokeGoogleBusinessJwt',
      message: 'google-business-auth fetch',
      data: {
        action: String(body.action ?? '?'),
        httpStatus,
        errSlice,
        hasInvokeError: Boolean(result.error),
        hasSession: Boolean(tok),
        jwtProjectMatchesEnv: jwtMatch,
        transport: 'fetch',
      },
      timestamp: Date.now(),
    };
    fetch('http://127.0.0.1:7478/ingest/9ba54e13-e981-4aca-a0ca-1aa98d457b97', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': 'df269f' },
      body: JSON.stringify(payload),
    }).catch(() => {});
    try {
      sessionStorage.setItem('__inkflow_dbg_gba', JSON.stringify(payload.data));
    } catch {
      /* ignore */
    }
  }
  // #endregion

  return result;
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
): Promise<GoogleBusinessLocationsResult> {
  const { data, error } = await invokeGoogleBusinessJwt<{
    locations?: { name: string; title: string; accountName: string }[];
    errors?: string[];
    accountsCount?: number;
    cached?: boolean;
    rateLimited?: boolean;
    warning?: string;
    autoSelected?: string | null;
    error?: string;
    detail?: string;
  }>({ action: 'locations', studioId, force });
  if (error) throw new Error(error.message);
  if (data?.error) {
    const detail = data.detail != null ? String(data.detail).slice(0, 400) : '';
    throw new Error(detail ? `${data.error}: ${detail}` : data.error);
  }
  return {
    locations: Array.isArray(data?.locations) ? data.locations : [],
    fetchErrors:
      Array.isArray(data?.errors) && data.errors.length > 0 ? data.errors : undefined,
    accountsCount: typeof data?.accountsCount === 'number' ? data.accountsCount : undefined,
    cached: Boolean(data?.cached),
    rateLimited: Boolean(data?.rateLimited),
    warning: typeof data?.warning === 'string' && data.warning.trim() ? data.warning : undefined,
  };
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
