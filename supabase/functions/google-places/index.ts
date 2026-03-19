/**
 * Google Places — clé API uniquement ici (GOOGLE_PLACES_API_KEY), jamais côté client.
 *
 * Actions (POST JSON) :
 * - public_reviews : { action, slug } — sans JWT ; retourne avis si le studio a un google_place_id
 * - text_search    : { action, query } — JWT requis ; recherche d’établissements
 */
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.3";
import { getCorsHeaders, corsResponse } from "../_shared/cors.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const GOOGLE_KEY = Deno.env.get("GOOGLE_PLACES_API_KEY") || Deno.env.get("GOOGLE_MAPS_API_KEY") || "";

const PLACES_DETAILS = "https://maps.googleapis.com/maps/api/place/details/json";
const PLACES_TEXTSEARCH = "https://maps.googleapis.com/maps/api/place/textsearch/json";

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

      const params = new URLSearchParams({
        query,
        key: GOOGLE_KEY,
        language: "fr",
      });
      const res = await fetch(`${PLACES_TEXTSEARCH}?${params}`);
      const data = await res.json();

      if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
        throw new Error(data.error_message || `Text Search: ${data.status}`);
      }

      const results = (data.results || []).slice(0, 8).map((p: { place_id?: string; name?: string; formatted_address?: string }) => ({
        placeId: String(p.place_id || ""),
        name: String(p.name || ""),
        formattedAddress: String(p.formatted_address || ""),
      })).filter((p: { placeId: string }) => p.placeId.length > 0);

      return json(origin, { results });
    }

    return json(origin, { error: "action inconnue" }, 400);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erreur Places";
    console.error("[google-places]", msg);
    return json(origin, { error: msg }, 502);
  }
});
