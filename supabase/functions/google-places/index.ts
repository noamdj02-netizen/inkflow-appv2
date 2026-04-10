/**
 * Google Places — clés API uniquement ici, jamais côté client.
 *
 * Utiliser `GOOGLE_PLACES_SERVER_KEY` (sans restriction referrer) pour Places Details / Text Search /
 * Nearby ; une clé « applications Web » avec referrer provoque l’erreur API sur ces endpoints.
 * Fallback : `GOOGLE_PLACES_API_KEY` / `GOOGLE_MAPS_API_KEY`.
 *
 * Actions (POST JSON) :
 * - public_reviews            : { action, slug } — sans JWT ; avis (cache DB en secours)
 * - business_public_reviews   : { action, slug } — sans JWT ; avis Google Business OAuth
 * - resolve_maps_paste        : { action, input } — JWT ; URL / texte → Place ID
 * - text_search               : { action, query } — JWT
 * - place_details             : { action, placeId } — JWT ; détails + avis (aperçu dashboard)
 * - sync_studio_google_reviews: { action, studioId, placeId? } — JWT ; met en cache les avis
 */
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.3";
import { getCorsHeaders, corsResponse } from "../_shared/cors.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const PLACES_SERVER_KEY =
  Deno.env.get("GOOGLE_PLACES_SERVER_KEY") ||
  Deno.env.get("GOOGLE_PLACES_API_KEY") ||
  Deno.env.get("GOOGLE_MAPS_API_KEY") ||
  "";
const GOOGLE_CLIENT_ID     = Deno.env.get("GOOGLE_CLIENT_ID") || "";
const GOOGLE_CLIENT_SECRET = Deno.env.get("GOOGLE_CLIENT_SECRET") || "";

const BUSINESS_REVIEWS_BASE = "https://mybusiness.googleapis.com/v4";

const PLACES_DETAILS = "https://maps.googleapis.com/maps/api/place/details/json";
const PLACES_TEXTSEARCH = "https://maps.googleapis.com/maps/api/place/textsearch/json";
const PLACES_NEARBY = "https://maps.googleapis.com/maps/api/place/nearbysearch/json";
const PLACES_NEW_SEARCH = "https://places.googleapis.com/v1/places:searchText";
const PLACES_NEW_GET_BASE = "https://places.googleapis.com/v1/places";

/** Toutes les requêtes Places ci-dessous utilisent uniquement `PLACES_SERVER_KEY` (secret Supabase, ex. GOOGLE_PLACES_SERVER_KEY). */
function assertPlacesServerKey(): void {
  if (!String(PLACES_SERVER_KEY || "").trim()) {
    throw new Error(
      "Places API : définissez le secret GOOGLE_PLACES_SERVER_KEY (ou GOOGLE_PLACES_API_KEY) sur le projet Supabase.",
    );
  }
}

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
  assertPlacesServerKey();
  const res = await fetch(PLACES_NEW_SEARCH, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": PLACES_SERVER_KEY,
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
  assertPlacesServerKey();
  const params = new URLSearchParams({
    query,
    key: PLACES_SERVER_KEY,
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

/** Ex. `@49.424296,1.0889154,17z` dans l’URL Maps */
function extractLatLngFromMapsUrl(rawUrl: string): { lat: number; lng: number } | null {
  const m = rawUrl.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/);
  if (!m?.[1] || !m?.[2]) return null;
  const lat = Number.parseFloat(m[1]);
  const lng = Number.parseFloat(m[2]);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
  return { lat, lng };
}

/**
 * Coordonnées dans le bloc `data=` récent (souvent sans `@lat,lng` visible dans la barre d’adresse).
 * Format typique : `!3d48.8566!4d2.3522`
 */
function extractLatLngFromMapsDataBlock(rawUrl: string): { lat: number; lng: number } | null {
  const m34 = rawUrl.match(/!3d(-?\d+\.?\d*)!4d(-?\d+\.?\d*)/i);
  if (m34?.[1] != null && m34[2] != null) {
    const lat = Number.parseFloat(m34[1]);
    const lng = Number.parseFloat(m34[2]);
    if (Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180) {
      return { lat, lng };
    }
  }
  const m43 = rawUrl.match(/!4d(-?\d+\.?\d*)!3d(-?\d+\.?\d*)/i);
  if (m43?.[1] != null && m43[2] != null) {
    const lng = Number.parseFloat(m43[1]);
    const lat = Number.parseFloat(m43[2]);
    if (Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180) {
      return { lat, lng };
    }
  }
  return null;
}

function extractLatLngFromQueryParams(rawUrl: string): { lat: number; lng: number } | null {
  try {
    const u = new URL(rawUrl);
    const ll = u.searchParams.get("ll") ?? u.searchParams.get("center");
    if (ll) {
      const parts = ll.split(",").map((x) => x.trim());
      if (parts.length >= 2) {
        const lat = Number.parseFloat(parts[0]);
        const lng = Number.parseFloat(parts[1]);
        if (Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180) {
          return { lat, lng };
        }
      }
    }
  } catch {
    /* ignore */
  }
  return null;
}

/** `@lat,lng`, puis `!3d!4d` dans data, puis `?ll=` / `center=` */
function extractLatLngFromMapsUrlExtended(rawUrl: string): { lat: number; lng: number } | null {
  return (
    extractLatLngFromMapsUrl(rawUrl) ??
    extractLatLngFromMapsDataBlock(rawUrl) ??
    extractLatLngFromQueryParams(rawUrl)
  );
}

/** Nom affiché dans `/place/Nom+…/` (apostrophe, %27, +) */
function extractPlaceTitleFromMapsPath(rawUrl: string): string | null {
  const m = rawUrl.match(/\/place\/([^/@]+)/);
  if (!m?.[1]) return null;
  let name = m[1];
  try {
    name = decodeURIComponent(name.replace(/\+/g, " "));
  } catch {
    name = name.replace(/\+/g, " ");
  }
  name = name.trim();
  if (name.length < 2 || name.length > 200) return null;
  return name;
}

/** Recherche « nearby » : meilleure pour les URLs avec `0x…:0x…` sans ChIJ (nom + coordonnées dans l’URL). */
async function nearbySearchPlaces(lat: number, lng: number, keyword: string): Promise<SearchHit[]> {
  assertPlacesServerKey();
  const kw = keyword.replace(/'/g, " ").replace(/\s+/g, " ").trim().slice(0, 100);
  if (kw.length < 2) return [];
  const params = new URLSearchParams({
    location: `${lat},${lng}`,
    radius: "250",
    keyword: kw,
    key: PLACES_SERVER_KEY,
    language: "fr",
  });
  const res = await fetch(`${PLACES_NEARBY}?${params}`);
  const data = await res.json() as {
    status?: string;
    error_message?: string;
    results?: unknown[];
  };
  if (data.status === "OK" || data.status === "ZERO_RESULTS") {
    return mapLegacyResults(data.results || []);
  }
  throw new Error(data.error_message || `Nearby Search: ${data.status}`);
}

function pickBestPlaceHit(hits: SearchHit[], placeTitle: string): string {
  if (hits.length === 1) return hits[0].placeId;
  const norm = (s: string) =>
    s.toLowerCase().normalize("NFD").replace(/\p{M}/gu, "").replace(/[^a-z0-9]+/g, "");
  const shortNeedle = norm(placeTitle).slice(0, 12);
  const best = hits.find((h) => norm(h.name).includes(shortNeedle)) ?? hits[0];
  return best.placeId;
}

/** Dernier recours : nom `/place/…` + optionnellement coordonnées `@lat,lng` → Nearby puis Text Search (nécessite PLACES_SERVER_KEY) */
async function resolvePlaceFromPlacePathName(rawUrl: string): Promise<string | null> {
  if (!PLACES_SERVER_KEY) return null;
  const name = extractPlaceTitleFromMapsPath(rawUrl);
  if (!name) return null;

  const ll = extractLatLngFromMapsUrlExtended(rawUrl);
  if (ll) {
    try {
      const nearby = await nearbySearchPlaces(ll.lat, ll.lng, name);
      if (nearby.length > 0) {
        return pickBestPlaceHit(nearby, name);
      }
    } catch (e) {
      console.warn("[google-places] nearbySearchPlaces:", e);
    }
  }

  const queries = [name, name.replace(/'/g, " ").replace(/\s+/g, " ").trim()].filter(
    (q, i, a) => q.length >= 3 && a.indexOf(q) === i,
  );

  try {
    for (const q of queries) {
      const hits = await textSearchPlaces(q);
      if (hits.length === 0) continue;
      return pickBestPlaceHit(hits, name);
    }
    return null;
  } catch (e) {
    console.warn("[google-places] resolvePlaceFromPlacePathName:", e);
    return null;
  }
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

/**
 * Extrait l'email depuis le JWT de la requête.
 * Décodage local du payload (la signature est déjà vérifiée par verify_jwt:true côté Supabase),
 * ce qui évite un aller-retour réseau vers Supabase Auth qui échoue de manière non déterministe
 * depuis l'intérieur de l'edge function.
 */
async function getUserEmailFromJwt(req: Request): Promise<string | null> {
  const auth = req.headers.get("Authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  const jwt = auth.slice(7);
  try {
    const parts = jwt.split(".");
    if (parts.length !== 3) return null;
    // base64url → base64 → JSON
    const pad = (s: string) => s + "=".repeat((4 - (s.length % 4)) % 4);
    const payload = JSON.parse(
      atob(pad(parts[1].replace(/-/g, "+").replace(/_/g, "/")))
    ) as Record<string, unknown>;
    // Rejeter clé anon et service_role — uniquement les sessions utilisateur
    if (payload?.role !== "authenticated") return null;
    const email = typeof payload?.email === "string" ? payload.email.trim() : "";
    if (email) return email;
    // Repli : email absent du payload (rare) → lookup par sub avec service role
    const sub = typeof payload?.sub === "string" ? payload.sub.trim() : "";
    if (!sub) return null;
    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data } = await admin.auth.admin.getUserById(sub);
    return data.user?.email ?? null;
  } catch {
    return null;
  }
}

const PLACE_ID_RX = /^[A-Za-z0-9_-]{12,200}$/;

/** Aligné sur `lib/parseGooglePlaceId.ts` — nettoie collage multi-lignes / texte + URL */
function normalizeMapsPasteInput(raw: string): string {
  let s = raw.trim();
  if (!s) return s;
  const urlMatch = s.match(/https?:\/\/[^\s<>"'[\]()]+/i);
  if (urlMatch) {
    s = urlMatch[0].replace(/[.,);'"\]]+$/u, "").trim();
  }
  s = s.replace(/\r?\n/g, "").replace(/\u00a0/g, " ").replace(/\s{2,}/g, " ").trim();
  s = s.replace(/^[<"'[\(]+|[>")\]',.;:]+$/u, "").trim();
  return s;
}

function placeIdFromDataChunk(part: string): string | null {
  let p = part;
  try {
    p = decodeURIComponent(part);
  } catch {
    /* ignore */
  }
  try {
    p = decodeURIComponent(p);
  } catch {
    /* ignore */
  }
  const patterns = [
    /!1s(ChIJ[A-Za-z0-9_-]{10,200})/,
    /!2s(ChIJ[A-Za-z0-9_-]{10,200})/,
    /!3m[0-9]+![^!]*!1s(ChIJ[A-Za-z0-9_-]{10,200})/,
    /!4m[0-9]+![^!]*!1s(ChIJ[A-Za-z0-9_-]{10,200})/,
  ];
  for (const re of patterns) {
    const chij = p.match(re);
    if (chij?.[1] && PLACE_ID_RX.test(chij[1])) return chij[1];
  }
  return null;
}

/** Tous les blocs `data=` (URLs longues avec plusieurs segments) */
function extractFromAllDataSegments(s: string): string | null {
  const re = /(?:^|[?&/])data=([^?&#]+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(s)) !== null) {
    const id = placeIdFromDataChunk(m[1]);
    if (id) return id;
  }
  return null;
}

function extractFromDataSegment(s: string): string | null {
  const m = s.match(/(?:^|[?&/])data=([^?#]+)/);
  if (!m?.[1]) return null;
  return placeIdFromDataChunk(m[1]);
}

function extractPlaceIdFromString(s: string): string | null {
  const fromAll = extractFromAllDataSegments(s);
  if (fromAll) return fromAll;
  const fromData = extractFromDataSegment(s);
  if (fromData) return fromData;
  const normalized = s.replace(/%21/gi, "!").replace(/%26/gi, "&");
  if (normalized !== s) {
    const d2 = extractFromAllDataSegments(normalized) ?? extractFromDataSegment(normalized);
    if (d2) return d2;
  }
  const placePathChij = s.match(/\/place\/(ChIJ[A-Za-z0-9_-]{10,200})(?:\/|[@?#]|$)/i);
  if (placePathChij?.[1] && PLACE_ID_RX.test(placePathChij[1])) return placePathChij[1];
  const chij = s.match(/(ChIJ[A-Za-z0-9_-]{10,200})/);
  if (chij?.[1] && PLACE_ID_RX.test(chij[1])) return chij[1];
  const q = s.match(/(?:[?&])(?:query_)?place_id=([A-Za-z0-9_-]{12,200})/i);
  if (q?.[1] && PLACE_ID_RX.test(q[1])) return q[1];
  const d1 = s.match(/[!&]1s(ChIJ[A-Za-z0-9_-]{10,200})/);
  if (d1?.[1] && PLACE_ID_RX.test(d1[1])) return d1[1];
  return null;
}

function extractPlaceIdFromHtml(html: string): string | null {
  const reQuoted = /"(?:place_id|placeId)"\s*:\s*"([A-Za-z0-9_-]{12,200})"/gi;
  let m: RegExpExecArray | null;
  while ((m = reQuoted.exec(html)) !== null) {
    if (m[1]?.startsWith("ChIJ") && PLACE_ID_RX.test(m[1])) return m[1];
  }
  const loose = html.match(/(ChIJ[A-Za-z0-9_-]{10,200})/);
  if (loose?.[1] && PLACE_ID_RX.test(loose[1])) return loose[1];
  return null;
}

function isAllowedMapsResolveHost(hostname: string): boolean {
  const h = hostname.toLowerCase();
  return (
    h === "maps.app.goo.gl" ||
    h === "goo.gl" ||
    h === "www.google.com" ||
    h === "google.com" ||
    h === "maps.google.com" ||
    h === "www.google.fr" ||
    h === "google.fr" ||
    h === "share.google.com" ||
    h === "www.google.co.uk" ||
    h === "google.co.uk" ||
    h === "www.google.be" ||
    h === "google.be" ||
    h === "www.google.de" ||
    h === "google.de"
  );
}

/** Suit les redirections (liens courts) et extrait un Place ID depuis l’URL finale, le HTML, ou la recherche texte sur /place/Nom/ */
async function resolveMapsPasteToPlaceId(input: string): Promise<string | null> {
  const cleaned = normalizeMapsPasteInput(input);
  const firstPass = [...new Set([input.trim(), cleaned].filter((x) => x.length >= 8))];
  for (const chunk of firstPass) {
    let hit = extractPlaceIdFromString(chunk);
    if (hit) return hit;
    try {
      const dec = decodeURIComponent(chunk);
      if (dec !== chunk) {
        hit = extractPlaceIdFromString(dec);
        if (hit) return hit;
      }
    } catch {
      /* ignore */
    }
  }

  const trimmed = (cleaned.length >= 8 ? cleaned : input.trim()).replace(/^http:\/\//i, "https://");

  /** Nom ou requête sans URL complète → Text Search (Places API). */
  if (
    !/^https?:\/\//i.test(trimmed) &&
    trimmed.length >= 3 &&
    PLACES_SERVER_KEY &&
    !extractPlaceIdFromString(trimmed)
  ) {
    try {
      const q = trimmed.slice(0, 200);
      const hits = await textSearchPlaces(q);
      if (hits.length > 0) {
        return hits.length === 1 ? hits[0].placeId : pickBestPlaceHit(hits, q);
      }
    } catch (e) {
      console.warn("[google-places] resolve_maps_paste textSearch:", e);
    }
    return null;
  }

  if (!/^https:\/\//i.test(trimmed)) return null;
  let u: URL;
  try {
    u = new URL(trimmed);
  } catch {
    return null;
  }
  if (u.protocol !== "https:") return null;
  if (!isAllowedMapsResolveHost(u.hostname)) return null;

  /** Sans ChIJ : `/place/Nom/` + coordonnées (@, !3d!4d dans data, ou ll=) → Nearby / Text Search */
  if (
    PLACES_SERVER_KEY &&
    !extractPlaceIdFromString(trimmed) &&
    extractPlaceTitleFromMapsPath(trimmed) &&
    extractLatLngFromMapsUrlExtended(trimmed)
  ) {
    const resolved = await resolvePlaceFromPlacePathName(trimmed);
    if (resolved) return resolved;
  }

  /** Après fetch, l’URL finale (ex. maps.google.com/place/…) — indispensable pour le fallback texte si le collage était un goo.gl */
  let urlAfterFetch = trimmed;

  const ctrl = new AbortController();
  const tid = setTimeout(() => ctrl.abort(), 12_000);
  try {
    const res = await fetch(trimmed, {
      method: "GET",
      redirect: "follow",
      signal: ctrl.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "fr-FR,fr;q=0.9,en;q=0.8",
      },
    });
    urlAfterFetch = res.url || trimmed;
    const fromFinalUrl = extractPlaceIdFromString(urlAfterFetch);
    if (fromFinalUrl) return fromFinalUrl;
    const html = await res.text();
    const fromHtml = extractPlaceIdFromString(html);
    if (fromHtml) return fromHtml;
    const fromHtmlMeta = extractPlaceIdFromHtml(html);
    if (fromHtmlMeta) return fromHtmlMeta;
  } catch (e) {
    console.warn("[google-places] resolve_maps_paste fetch:", e);
  } finally {
    clearTimeout(tid);
  }

  return await resolvePlaceFromPlacePathName(urlAfterFetch);
}

/** Legacy `place_id` ou ressource `places/ChIJ…` (API New). */
function normalizePlaceIdForApi(placeId: string): string {
  const t = placeId.trim();
  if (t.startsWith("places/")) return t.slice(7);
  return t;
}

type PlaceDetailsResult = {
  rating: number | null;
  userRatingsTotal: number;
  reviews: {
    authorName: string;
    rating: number;
    text: string;
    relativeTimeDescription: string;
  }[];
};

async function fetchPlaceDetailsFromNewApi(placeId: string, language: string): Promise<PlaceDetailsResult> {
  assertPlacesServerKey();
  const id = normalizePlaceIdForApi(placeId);
  const url = `${PLACES_NEW_GET_BASE}/${encodeURIComponent(id)}`;
  const res = await fetch(url, {
    headers: {
      "X-Goog-Api-Key": PLACES_SERVER_KEY,
      "X-Goog-FieldMask": "rating,userRatingCount,reviews",
      "Accept-Language": language,
    },
  });
  const body = (await res.json()) as {
    rating?: number;
    userRatingCount?: number;
    reviews?: {
      authorAttribution?: { displayName?: string };
      rating?: number;
      text?: { text?: string };
      originalText?: { text?: string };
      relativePublishTimeDescription?: string;
    }[];
    error?: { message?: string; status?: string };
  };
  if (!res.ok) {
    const msg = body?.error?.message || `Places API (New): ${res.status}`;
    throw new Error(msg);
  }
  const raw = Array.isArray(body.reviews) ? body.reviews : [];
  const reviews = raw.map((rev) => ({
    authorName: String(rev.authorAttribution?.displayName || "Anonyme"),
    rating: typeof rev.rating === "number" ? rev.rating : 0,
    text: String(rev.text?.text || rev.originalText?.text || "").trim(),
    relativeTimeDescription: String(rev.relativePublishTimeDescription || ""),
  }));
  return {
    rating: typeof body.rating === "number" ? body.rating : null,
    userRatingsTotal: typeof body.userRatingCount === "number" ? body.userRatingCount : 0,
    reviews,
  };
}

async function fetchPlaceDetails(placeId: string, language = "fr"): Promise<PlaceDetailsResult> {
  assertPlacesServerKey();
  const id = normalizePlaceIdForApi(placeId);
  const params = new URLSearchParams({
    place_id: id,
    fields: "rating,user_ratings_total,reviews",
    language,
    key: PLACES_SERVER_KEY,
  });
  const res = await fetch(`${PLACES_DETAILS}?${params}`);
  const data = (await res.json()) as {
    status?: string;
    error_message?: string;
    result?: { rating?: number; user_ratings_total?: number; reviews?: PlaceReviewRaw[] };
  };

  if (data.status === "OK" || data.status === "ZERO_RESULTS") {
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

  console.warn(
    "[google-places] Legacy Place Details:",
    data.status,
    data.error_message,
    "→ Places API (New)",
  );
  return await fetchPlaceDetailsFromNewApi(id, language);
}

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("origin");

  if (req.method === "OPTIONS") {
    return corsResponse(origin);
  }

  if (req.method !== "POST") {
    return json(origin, { error: "Method not allowed" }, 405);
  }

  let payload: Record<string, unknown>;
  try {
    payload = (await req.json()) as Record<string, unknown>;
  } catch {
    return json(origin, { error: "JSON invalide" }, 400);
  }

  const action = String(payload.action || "");

  /** Résolution collage (URL, Place ID, ou nom via Text Search si clé serveur configurée). */
  if (action === "resolve_maps_paste") {
    const email = await getUserEmailFromJwt(req);
    if (!email) {
      return json(origin, { error: "Non authentifié" }, 401);
    }
    const input = String(payload.input || "").trim();
    if (input.length < 3 || input.length > 2500) {
      return json(origin, { error: "Texte invalide" }, 400);
    }
    const placeId = await resolveMapsPasteToPlaceId(input);
    return json(origin, { placeId: placeId || null });
  }

  if (!PLACES_SERVER_KEY) {
    console.error("[google-places] Aucune clé Places serveur (GOOGLE_PLACES_SERVER_KEY / GOOGLE_PLACES_API_KEY)");
    return json(origin, { error: "Configuration serveur incomplète" }, 503);
  }

  try {
    if (action === "public_reviews") {
      const slug = String(payload.slug || "").trim().toLowerCase();
      if (!/^[a-z0-9-]+$/.test(slug) || slug.length > 120) {
        return json(origin, { error: "slug invalide" }, 400);
      }

      const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      const { data: row, error } = await admin
        .from("inkflow_studios")
        .select("google_place_id, google_reviews_cache")
        .eq("slug", slug)
        .maybeSingle();

      if (error) {
        console.error("[google-places] DB:", error.message);
        return json(origin, { error: "Studio introuvable" }, 404);
      }

      const placeId = (row?.google_place_id as string | null)?.trim();
      const rawCache = row?.google_reviews_cache as Record<string, unknown> | null | undefined;
      const fromCache = (c: Record<string, unknown> | null | undefined): PlaceDetailsResult | null => {
        if (!c || typeof c !== "object") return null;
        const reviews = Array.isArray(c.reviews) ? c.reviews as PlaceDetailsResult["reviews"] : [];
        const rating = typeof c.rating === "number" ? c.rating : null;
        const userRatingsTotal = typeof c.userRatingsTotal === "number" ? c.userRatingsTotal : 0;
        if (reviews.length === 0 && rating == null && userRatingsTotal === 0) return null;
        return { rating, userRatingsTotal, reviews };
      };
      const cached = fromCache(rawCache);

      if (!placeId) {
        return json(origin, {
          rating: null,
          userRatingsTotal: 0,
          reviews: [],
          configured: false,
        });
      }

      try {
        const details = await fetchPlaceDetails(placeId);
        return json(origin, { ...details, configured: true });
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Places error";
        console.warn("[google-places] public_reviews fetch:", msg);
        if (cached) {
          return json(origin, { ...cached, configured: true, stale: true });
        }
        return json(origin, {
          rating: null,
          userRatingsTotal: 0,
          reviews: [],
          configured: true,
        });
      }
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

    if (action === "place_details") {
      const email = await getUserEmailFromJwt(req);
      if (!email) {
        return json(origin, { error: "Non authentifié" }, 401);
      }
      const placeId = String(payload.placeId || "").trim();
      if (!placeId) {
        return json(origin, { error: "placeId requis" }, 400);
      }
      const details = await fetchPlaceDetails(placeId);
      return json(origin, details);
    }

    if (action === "sync_studio_google_reviews") {
      const email = await getUserEmailFromJwt(req);
      if (!email) {
        return json(origin, { error: "Non authentifié" }, 401);
      }
      const studioId = String(payload.studioId || "").trim();
      const placeIdOpt = typeof payload.placeId === "string" ? payload.placeId.trim() : "";
      if (!studioId) {
        return json(origin, { error: "studioId requis" }, 400);
      }

      const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      const { data: row, error: rowErr } = await admin
        .from("inkflow_studios")
        .select("id, email, google_place_id")
        .eq("id", studioId)
        .maybeSingle();

      if (rowErr || !row?.id) {
        return json(origin, { error: "Studio introuvable" }, 404);
      }
      const ownerEmail = String(row.email || "").toLowerCase();
      if (ownerEmail !== email.toLowerCase()) {
        return json(origin, { error: "Accès refusé" }, 403);
      }

      const pid = (placeIdOpt || (row.google_place_id as string | null) || "").trim();
      if (!pid) {
        return json(origin, { error: "Aucun lieu Google (place_id)" }, 400);
      }

      const details = await fetchPlaceDetails(pid);
      const cache = {
        rating: details.rating,
        userRatingsTotal: details.userRatingsTotal,
        reviews: details.reviews.slice(0, 12),
        cachedAt: new Date().toISOString(),
      };
      await admin.from("inkflow_studios").update({
        google_reviews_cache: cache,
        updated_at: new Date().toISOString(),
      }).eq("id", studioId);

      return json(origin, { ok: true, ...details });
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
