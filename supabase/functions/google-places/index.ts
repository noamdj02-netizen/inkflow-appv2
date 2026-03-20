/**
 * Google Places — clé API uniquement ici (GOOGLE_PLACES_API_KEY), jamais côté client.
 *
 * Actions (POST JSON) :
 * - public_reviews          : { action, slug } — sans JWT ; retourne avis via Places API (5 max)
 * - business_public_reviews : { action, slug } — sans JWT ; retourne TOUS les avis via Business Profile OAuth
 * - text_search             : { action, query } — JWT requis ; recherche d’établissements
 */
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.3";
import { getCorsHeaders, corsResponse } from "../_shared/cors.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const GOOGLE_KEY = Deno.env.get("GOOGLE_PLACES_API_KEY") || Deno.env.get("GOOGLE_MAPS_API_KEY") || "";
const GOOGLE_CLIENT_ID     = Deno.env.get("GOOGLE_CLIENT_ID") || "";
const GOOGLE_CLIENT_SECRET = Deno.env.get("GOOGLE_CLIENT_SECRET") || "";

const BUSINESS_REVIEWS_BASE = "https://mybusiness.googleapis.com/v4";

const PLACES_DETAILS = "https://maps.googleapis.com/maps/api/place/details/json";
const PLACES_TEXTSEARCH = "https://maps.googleapis.com/maps/api/place/textsearch/json";
const PLACES_NEW_SEARCH = "https://places.googleapis.com/v1/places:searchText";

type SearchHit = { placeId: string; name: string; formattedAddress: string };

function mapLegacyResults(results: unknown[]): SearchHit[] {
  return (results || []).slice(0, 8).map((p: { place_id?: string; name?: string; formatted_address?: string }) => ({
    placeId: String(p.place_id || ""),
    name: String(p.name || ""),
    formattedAddress: String(p.formatted_address || ""),
  })).filter((p: SearchHit) => p.placeId.length > 0);
}

/** Fallback si l’API Text Search « classique » est désactivée (souvent seule Places API (New) est activée). */
async function textSearchPlacesNew(query: string): Promise<SearchHit[]> {
  const res = await fetch(PLACES_NEW_SEARCH, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": GOOGLE_KEY,
      "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress",
    },
    body: JSON.stringify({ textQuery: query, languageCode: "fr" }),
  });
  const body = (await res.json()) as {
    places?: { id?: string; displayName?: { text?: string }; formattedAddress?: string }[];
    error?: { message?: string; status?: string };
  };
  if (!res.ok) {
    const msg = body?.error?.message || (await res.text()).slice(0, 200);
    throw new Error(`Places API (New): ${res.status} ${msg}`);
  }
  if (body.error?.message) {
    throw new Error(body.error.message);
  }
  const places = Array.isArray(body.places) ? body.places : [];
  return places.slice(0, 8).map((p) => {
    const id = String(p.id || "");
    const placeId = id.startsWith("places/") ? id.slice(7) : id;
    const name = typeof p.displayName === "object" && p.displayName?.text
      ? String(p.displayName.text)
      : "";
    return {
      placeId,
      name,
      formattedAddress: String(p.formattedAddress || ""),
    };
  }).filter((p) => p.placeId.length > 0);
}

async function textSearchPlaces(query: string): Promise<SearchHit[]> {
  const params = new URLSearchParams({
    query,
    key: GOOGLE_KEY,
    language: "fr",
  });
  const res = await fetch(`${PLACES_TEXTSEARCH}?${params}`);
  const data = await res.json() as {
    status?: string;
    error_message?: string;
    results?: unknown[];
  };

  if (data.status === "OK" || data.status === "ZERO_RESULTS") {
    return mapLegacyResults(data.results || []);
  }

  const denied =
    data.status === "REQUEST_DENIED" ||
    data.status === "INVALID_REQUEST" ||
    (typeof data.error_message === "string" &&
      (data.error_message.toLowerCase().includes("not enabled") ||
        data.error_message.toLowerCase().includes("denied")));

  if (denied) {
    console.warn("[google-places] Legacy Text Search:", data.status, data.error_message, "→ Places API (New)");
    return await textSearchPlacesNew(query);
  }

  throw new Error(data.error_message || `Text Search: ${data.status}`);
}

interface PlaceReviewRaw {
  author_name?: string;
  rating?: number;
  text?: string;
  relative_time_description?: string;
}

function json(origin: string | null, body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...getCorsHeaders(origin) },
  });
}

async function getUserEmailFromJwt(req: Request): Promise<string | null> {
  const auth = req.headers.get("Authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  const jwt = auth.slice(7);
  const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const { data, error } = await client.auth.getUser(jwt);
  if (error || !data.user?.email) return null;
  return data.user.email;
}

async function fetchPlaceDetails(placeId: string, language = "fr") {
  const params = new URLSearchParams({
    place_id: placeId,
    fields: "rating,user_ratings_total,reviews",
    language,
    key: GOOGLE_KEY,
  });
  const res = await fetch(`${PLACES_DETAILS}?${params}`);
  const data = await res.json();
  if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
    throw new Error(data.error_message || `Places API: ${data.status}`);
  }
  const r = data.result || {};
  const reviews: PlaceReviewRaw[] = Array.isArray(r.reviews) ? r.reviews : [];
  return {
    rating: typeof r.rating === "number" ? r.rating : null,
    userRatingsTotal: typeof r.user_ratings_total === "number" ? r.user_ratings_total : 0,
    reviews: reviews.map((rev) => ({
      authorName: String(rev.author_name || "Anonyme"),
      rating: typeof rev.rating === "number" ? rev.rating : 0,
      text: String(rev.text || "").trim(),
      relativeTimeDescription: String(rev.relative_time_description || ""),
    })),
  };
}

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("origin");

  if (req.method === "OPTIONS") {
    return corsResponse(origin);
  }

  if (req.method !== "POST") {
    return json(origin, { error: "Method not allowed" }, 405);
  }

  if (!GOOGLE_KEY) {
    console.error("[google-places] GOOGLE_PLACES_API_KEY manquante");
    return json(origin, { error: "Configuration serveur incomplète" }, 503);
  }

  let payload: Record<string, unknown>;
  try {
    payload = (await req.json()) as Record<string, unknown>;
  } catch {
    return json(origin, { error: "JSON invalide" }, 400);
  }

  const action = String(payload.action || "");

  try {
    if (action === "public_reviews") {
      const slug = String(payload.slug || "").trim().toLowerCase();
      if (!/^[a-z0-9-]+$/.test(slug) || slug.length > 120) {
        return json(origin, { error: "slug invalide" }, 400);
      }

      const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      const { data: row, error } = await admin
        .from("inkflow_studios")
        .select("google_place_id")
        .eq("slug", slug)
        .maybeSingle();

      if (error) {
        console.error("[google-places] DB:", error.message);
        return json(origin, { error: "Studio introuvable" }, 404);
      }

      const placeId = (row?.google_place_id as string | null)?.trim();
      if (!placeId) {
        return json(origin, {
          rating: null,
          userRatingsTotal: 0,
          reviews: [],
          configured: false,
        });
      }

      const details = await fetchPlaceDetails(placeId);
      return json(origin, { ...details, configured: true });
    }

    if (action === "business_public_reviews") {
      const slug = String(payload.slug || "").trim().toLowerCase();
      if (!/^[a-z0-9-]+$/.test(slug) || slug.length > 120) {
        return json(origin, { error: "slug invalide" }, 400);
      }

      const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      const { data: row, error: rowErr } = await admin
        .from("inkflow_studios")
        .select("id, google_business_access_token, google_business_refresh_token, google_business_token_expiry, google_business_location_name")
        .eq("slug", slug)
        .maybeSingle();

      if (rowErr) return json(origin, { error: "Studio introuvable" }, 404);

      const refreshToken    = (row?.google_business_refresh_token as string | null)?.trim();
      const locationName    = (row?.google_business_location_name as string | null)?.trim();
      const studioId        = row?.id as string | undefined;

      if (!refreshToken || !locationName || !studioId) {
        return json(origin, { reviews: [], averageRating: null, totalReviewCount: 0, configured: false });
      }

      // Refresh access token if needed
      let accessToken = (row?.google_business_access_token as string | null) || "";
      const tokenExpiry = (row?.google_business_token_expiry as number | null) ?? null;

      if (!accessToken || (tokenExpiry && Date.now() >= tokenExpiry - 60_000)) {
        const refreshRes = await fetch("https://oauth2.googleapis.com/token", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            client_id: GOOGLE_CLIENT_ID,
            client_secret: GOOGLE_CLIENT_SECRET,
            refresh_token: refreshToken,
            grant_type: "refresh_token",
          }),
        });
        if (refreshRes.ok) {
          const newTokens = await refreshRes.json() as { access_token?: string; expires_in?: number };
          accessToken = newTokens.access_token || "";
          const newExpiry = Date.now() + (newTokens.expires_in || 3600) * 1000;
          await admin.from("inkflow_studios").update({
            google_business_access_token: accessToken,
            google_business_token_expiry: newExpiry,
          }).eq("id", studioId);
        } else {
          console.error("[google-places] refresh business token:", await refreshRes.text());
          return json(origin, { error: "Token Google Business expiré — reconnectez votre compte" }, 401);
        }
      }

      // Fetch all reviews (paginated)
      const allReviews: {
        authorName: string;
        rating: number;
        text: string;
        relativeTimeDescription: string;
        createTime?: string;
      }[] = [];

      let pageToken: string | undefined;
      let averageRating: number | null = null;
      let totalReviewCount = 0;
      let page = 0;
      const MAX_PAGES = 10; // safety cap (100 reviews per page → 1000 max)

      do {
        const url = new URL(`${BUSINESS_REVIEWS_BASE}/${locationName}/reviews`);
        url.searchParams.set("pageSize", "100");
        if (pageToken) url.searchParams.set("pageToken", pageToken);

        const reviewsRes = await fetch(url.toString(), {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        if (!reviewsRes.ok) {
          const errText = await reviewsRes.text();
          console.error("[google-places] Business reviews:", reviewsRes.status, errText.slice(0, 200));
          break;
        }

        const reviewsBody = await reviewsRes.json() as {
          reviews?: {
            reviewer?: { displayName?: string };
            starRating?: string;
            comment?: string;
            createTime?: string;
            updateTime?: string;
            relativePublishTimeDescription?: string;
          }[];
          averageRating?: number;
          totalReviewCount?: number;
          nextPageToken?: string;
        };

        if (page === 0) {
          averageRating    = typeof reviewsBody.averageRating === "number" ? reviewsBody.averageRating : null;
          totalReviewCount = typeof reviewsBody.totalReviewCount === "number" ? reviewsBody.totalReviewCount : 0;
        }

        const starMap: Record<string, number> = {
          ONE: 1, TWO: 2, THREE: 3, FOUR: 4, FIVE: 5,
        };

        for (const r of reviewsBody.reviews || []) {
          allReviews.push({
            authorName: r.reviewer?.displayName || "Anonyme",
            rating: starMap[r.starRating || ""] ?? 0,
            text: (r.comment || "").trim(),
            relativeTimeDescription: r.relativePublishTimeDescription || "",
            createTime: r.createTime,
          });
        }

        pageToken = reviewsBody.nextPageToken;
        page++;
      } while (pageToken && page < MAX_PAGES);

      return json(origin, {
        reviews: allReviews,
        averageRating,
        totalReviewCount,
        configured: true,
        source: "business",
      });
    }

    if (action === "text_search") {
      const email = await getUserEmailFromJwt(req);
      if (!email) {
        return json(origin, { error: "Non authentifié" }, 401);
      }

      const query = String(payload.query || "").trim();
      if (query.length < 2) {
        return json(origin, { error: "Requête trop courte" }, 400);
      }
      if (query.length > 200) {
        return json(origin, { error: "Requête trop longue" }, 400);
      }

      const results = await textSearchPlaces(query);
      return json(origin, { results });
    }

    return json(origin, { error: "action inconnue" }, 400);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erreur Places";
    console.error("[google-places]", msg);
    return json(origin, { error: msg }, 502);
  }
});
