/**
 * supabaseGeo — Géolocalisation & découverte de studios proches
 *
 * Fonctions :
 *  - getNearbyStudios(lat, lng, radiusKm) : studios proches + flash/portfolio
 *  - geocodeAddress(address)              : adresse → lat/lng/city (Google Geocoding)
 *  - updateStudioGeo(studioId, ...)       : sauvegarde la position en BDD
 */

import { supabase } from './supabase';
import { getGoogleMapsBrowserApiKey } from './googleMapsBrowserKey';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface FlashPreview {
  id: string;
  title: string;
  imageUrl: string;
  price: number;
  style?: string;
  studioSlug: string;
  studioName: string;
}

export interface PortfolioPreview {
  url: string;
  category: string;
}

export interface NearbyStudio {
  id: string;
  slug: string;
  studio_name: string;
  avatar_url: string | null;
  /** Première ligne d’adresse depuis la vitrine (JSON), si renseignée */
  address: string | null;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  /** null si pas de GPS user ou studio sans coordonnées */
  distance_km: number | null;
  flash: FlashPreview[];
  portfolio: PortfolioPreview[];
  /** Services ou styles affichés comme tags */
  tags: string[];
}

interface RpcRow {
  id: string;
  slug: string;
  studio_name: string;
  avatar_url: string | null;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  distance_km: number | null;
}

function numOrNull(v: unknown): number | null {
  if (v == null || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function vitrineFlashList(vd: Record<string, unknown>, slug: string, name: string): FlashPreview[] {
  const flashRaw = Array.isArray(vd.flashDesigns) ? vd.flashDesigns : [];
  return flashRaw
    .filter((f: Record<string, unknown>) => f.available !== false && (f.imageUrl || f.image_url))
    .slice(0, 16)
    .map((f: Record<string, unknown>) => ({
      id: String(f.id ?? ''),
      title: String(f.title ?? 'Flash'),
      imageUrl: String(f.imageUrl ?? f.image_url ?? '').trim(),
      price: Number(f.price ?? 0),
      style: f.style ? String(f.style) : undefined,
      studioSlug: slug,
      studioName: name,
    }))
    .filter((f) => f.imageUrl.length > 0);
}

function normalizePortfolio(vd: Record<string, unknown>): PortfolioPreview[] {
  const portRaw = Array.isArray(vd.portfolio) ? vd.portfolio : [];
  const mapped = portRaw
    .map((p: Record<string, unknown>) => {
      const url = String(p.url ?? p.imageUrl ?? p.image_url ?? '').trim();
      return { url, category: String(p.category ?? '') };
    })
    .filter((p) => p.url.length > 0);
  if (mapped.length > 0) return mapped.slice(0, 8);
  const cover = typeof vd.coverImage === 'string' ? vd.coverImage.trim() : '';
  const avatar = typeof vd.avatar === 'string' ? vd.avatar.trim() : '';
  if (cover) return [{ url: cover, category: 'Couverture' }];
  if (avatar) return [{ url: avatar, category: 'Profil' }];
  return [];
}

function mergeFlashFromVitrineAndDb(
  vitrine: FlashPreview[],
  dbList: FlashPreview[],
): FlashPreview[] {
  const NativeMap = globalThis.Map;
  const byId = new NativeMap<string, FlashPreview>();
  for (const f of vitrine) {
    if (f.id) byId.set(f.id, f);
  }
  for (const f of dbList) {
    if (!f.id) continue;
    const prev = byId.get(f.id);
    if (!prev) {
      byId.set(f.id, f);
      continue;
    }
    const img = (f.imageUrl?.trim() || prev.imageUrl?.trim()) ?? '';
    if (!img) continue;
    byId.set(f.id, {
      ...prev,
      ...f,
      imageUrl: img,
      title: f.title || prev.title,
      price: Number.isFinite(f.price) ? f.price : prev.price,
    });
  }
  return [...byId.values()].filter((x) => (x.imageUrl ?? '').trim().length > 0).slice(0, 16);
}

function normDiscoveryKey(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, ' ');
}

/** Garde le studio le plus pertinent si plusieurs lignes BDD (même slug ou même nom + ville). */
function pickPreferredStudio(a: NearbyStudio, b: NearbyStudio): NearbyStudio {
  const da = a.distance_km;
  const db = b.distance_km;
  const aOk = da != null && Number.isFinite(da);
  const bOk = db != null && Number.isFinite(db);
  if (aOk && bOk) return da! <= db! ? a : b;
  if (aOk) return a;
  if (bOk) return b;
  const aGeo = a.latitude != null && a.longitude != null;
  const bGeo = b.latitude != null && b.longitude != null;
  if (aGeo && !bGeo) return a;
  if (!aGeo && bGeo) return b;
  return a;
}

function mergeNearbyStudios(primary: NearbyStudio, secondary: NearbyStudio): NearbyStudio {
  const flash = mergeFlashFromVitrineAndDb(primary.flash ?? [], secondary.flash ?? []);
  const seenUrls = new Set<string>();
  const portfolio: PortfolioPreview[] = [];
  for (const src of [primary, secondary]) {
    for (const p of src.portfolio ?? []) {
      const u = p.url?.trim();
      if (!u || seenUrls.has(u)) continue;
      seenUrls.add(u);
      portfolio.push(p);
      if (portfolio.length >= 8) break;
    }
    if (portfolio.length >= 8) break;
  }
  const tagSeen = new Set<string>();
  const tags: string[] = [];
  for (const src of [primary, secondary]) {
    for (const t of src.tags ?? []) {
      const u = t.trim();
      if (!u || tagSeen.has(u)) continue;
      tagSeen.add(u);
      tags.push(u);
      if (tags.length >= 3) break;
    }
    if (tags.length >= 3) break;
  }
  const winner = pickPreferredStudio(primary, secondary);
  const loser = winner === primary ? secondary : primary;
  return {
    ...winner,
    flash,
    portfolio: portfolio.length > 0 ? portfolio : winner.portfolio ?? [],
    tags: tags.length > 0 ? tags : winner.tags ?? [],
    avatar_url: winner.avatar_url?.trim() || loser.avatar_url?.trim() || null,
    address: winner.address?.trim() || loser.address?.trim() || null,
    distance_km: pickPreferredStudio(primary, secondary).distance_km,
  };
}

/**
 * Évite les cartes en double : plusieurs lignes `inkflow_studios` pour le même slug,
 * ou même nom d’enseigne + même ville (ex. comptes de test + prod).
 */
function deduplicateDiscoveryStudios(studios: NearbyStudio[]): NearbyStudio[] {
  const bySlug = new Map<string, NearbyStudio>();
  for (const s of studios) {
    const sk = normDiscoveryKey(s.slug || '');
    const key = sk.length > 0 ? `slug:${sk}` : `id:${s.id}`;
    const ex = bySlug.get(key);
    if (!ex) {
      bySlug.set(key, s);
      continue;
    }
    bySlug.set(key, mergeNearbyStudios(ex, s));
  }
  const slugPass = [...bySlug.values()];

  const byNameCity = new Map<string, NearbyStudio>();
  for (const s of slugPass) {
    const nk = normDiscoveryKey(s.studio_name);
    const ck = normDiscoveryKey(s.city ?? '');
    const key = `name:${nk}|city:${ck}`;
    const ex = byNameCity.get(key);
    if (!ex) {
      byNameCity.set(key, s);
      continue;
    }
    byNameCity.set(key, mergeNearbyStudios(ex, s));
  }

  return [...byNameCity.values()].sort((a, b) => {
    const da = a.distance_km;
    const db = b.distance_km;
    const aN = da != null && Number.isFinite(da) ? da : 1e9;
    const bN = db != null && Number.isFinite(db) ? db : 1e9;
    if (aN !== bN) return aN - bN;
    return a.studio_name.localeCompare(b.studio_name, 'fr');
  });
}

async function fetchDiscoveryRpcRows(
  userLat: number | null,
  userLng: number | null,
  radiusKm: number,
  limitCount: number,
): Promise<RpcRow[] | null> {
  const { data, error } = await supabase.rpc('get_discovery_studios_for_client', {
    user_lat: userLat,
    user_lng: userLng,
    radius_km: radiusKm,
    limit_count: limitCount,
  });
  if (error) {
    if (import.meta.env.DEV) {
      console.warn('[supabaseGeo] get_discovery_studios_for_client:', error.message);
    }
    return null;
  }
  if (!data?.length) return [];
  return (data as RpcRow[]).map((r) => ({
    ...r,
    latitude: numOrNull(r.latitude),
    longitude: numOrNull(r.longitude),
    distance_km: numOrNull(r.distance_km),
  }));
}

async function fetchNearbyOnlyRows(lat: number, lng: number, radiusKm: number): Promise<RpcRow[]> {
  const { data, error } = await supabase.rpc('get_nearby_studios', {
    user_lat: lat,
    user_lng: lng,
    radius_km: radiusKm,
    limit_count: 30,
  });
  if (error || !data?.length) return [];
  return (data as RpcRow[]).map((r) => ({
    ...r,
    latitude: numOrNull(r.latitude),
    longitude: numOrNull(r.longitude),
    distance_km: numOrNull(r.distance_km),
  }));
}

/**
 * Studios pour l’app client : même source logique que la vitrine publique.
 * - RPC `get_discovery_studios_for_client` : inclut les studios sans lat/lng (souvent la cause des listes vides).
 * - Flashs : fusion `inkflow_flash_designs` (dashboard) + JSON vitrine.
 * - Portfolio : champs url / imageUrl / image_url + repli cover / avatar vitrine.
 */
export async function loadClientDiscoveryStudios(
  userLat?: number | null,
  userLng?: number | null,
  radiusKm = 120,
  limitCount = 40,
): Promise<NearbyStudio[]> {
  let rows: RpcRow[] | null = await fetchDiscoveryRpcRows(
    userLat ?? null,
    userLng ?? null,
    radiusKm,
    limitCount,
  );

  if (rows === null && userLat != null && userLng != null) {
    rows = await fetchNearbyOnlyRows(userLat, userLng, radiusKm);
  }
  if (rows === null) rows = [];
  if (!rows.length) return [];

  const studioIds = rows.map((r) => r.id);

  const [{ data: vitrineRows }, { data: flashRows }] = await Promise.all([
    supabase.from('inkflow_vitrine_data').select('studio_id, data').in('studio_id', studioIds),
    supabase
      .from('inkflow_flash_designs')
      .select('id, studio_id, title, image_url, price, category')
      .in('studio_id', studioIds)
      .eq('available', true)
      .eq('reserved', false)
      .order('created_at', { ascending: false }),
  ]);

  const vitrineMap = new Map<string, Record<string, unknown>>(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (vitrineRows ?? []).map((v: any) => [
      v.studio_id,
      v.data ?? {},
    ]),
  );

  const flashByStudio = new globalThis.Map<string, FlashPreview[]>();
  for (const fr of flashRows ?? []) {
    const row = fr as {
      id: string;
      studio_id: string;
      title: string;
      image_url: string | null;
      price: number;
      category: string | null;
    };
    const url = (row.image_url ?? '').trim();
    if (!url) continue;
    const slugRow = rows.find((x) => x.id === row.studio_id);
    const preview: FlashPreview = {
      id: String(row.id),
      title: String(row.title ?? 'Flash'),
      imageUrl: url,
      price: Number(row.price ?? 0),
      style: row.category ? String(row.category) : undefined,
      studioSlug: slugRow?.slug ?? '',
      studioName: slugRow?.studio_name ?? '',
    };
    const list = flashByStudio.get(row.studio_id) ?? [];
    list.push(preview);
    flashByStudio.set(row.studio_id, list);
  }

  const list = rows.map((s) => {
    const vd = vitrineMap.get(s.id) ?? {};
    const vitrineFlash = vitrineFlashList(vd, s.slug, s.studio_name);
    const dbFlash = flashByStudio.get(s.id) ?? [];
    const flash = mergeFlashFromVitrineAndDb(vitrineFlash, dbFlash);

    let portfolio = normalizePortfolio(vd);
    const dbAvatar = s.avatar_url?.trim() || '';
    const vitrineAvatar = typeof vd.avatar === 'string' ? vd.avatar.trim() : '';
    const resolvedAvatar = dbAvatar || vitrineAvatar || null;
    if (portfolio.length === 0 && resolvedAvatar) {
      portfolio = [{ url: resolvedAvatar, category: 'Studio' }];
    }

    const services = Array.isArray(vd.services) ? vd.services : [];
    const tags: string[] = services
      .map((sv: Record<string, unknown>) => String(sv.name ?? ''))
      .filter(Boolean)
      .slice(0, 3);

    const rawAddr = typeof vd.address === 'string' ? vd.address.trim() : '';
    const addressLine =
      rawAddr
        .split('\n')
        .map((line) => line.trim())
        .find((line) => line.length > 0) ?? null;

    return {
      id: s.id,
      slug: s.slug,
      studio_name: s.studio_name,
      avatar_url: resolvedAvatar,
      address: addressLine,
      city: s.city,
      latitude: s.latitude,
      longitude: s.longitude,
      distance_km: s.distance_km,
      flash,
      portfolio,
      tags,
    };
  });

  return deduplicateDiscoveryStudios(list);
}

// ─────────────────────────────────────────────────────────────────────────────
// getNearbyStudios  (GPS user — même pipeline que la découverte globale)
// ─────────────────────────────────────────────────────────────────────────────

export async function getNearbyStudios(
  lat: number,
  lng: number,
  radiusKm = 80,
): Promise<NearbyStudio[]> {
  return loadClientDiscoveryStudios(lat, lng, radiusKm, 40);
}

// ─────────────────────────────────────────────────────────────────────────────
// geocodeAddress  (Google Geocoding REST — nécessite une clé navigateur, voir getGoogleMapsBrowserApiKey)
// ─────────────────────────────────────────────────────────────────────────────

export interface GeocodeResult {
  lat: number;
  lng: number;
  city: string;
  formattedAddress: string;
}

/** Retour détaillé pour l’UI (messages d’erreur Google : clé, restriction, facturation). */
export type GeocodeDetailedResult =
  | { ok: true; data: GeocodeResult }
  | {
      ok: false;
      reason: 'no_api_key' | 'no_results' | 'network' | 'google_error';
      message: string;
    };

export async function geocodeAddressDetailed(address: string): Promise<GeocodeDetailedResult> {
  const apiKey = getGoogleMapsBrowserApiKey();
  if (!apiKey) {
    console.warn('[supabaseGeo] Clé Google Maps navigateur manquante (VITE_GOOGLE_MAPS_JS_API_KEY ou VITE_GOOGLE_MAPS_API_KEY)');
    return {
      ok: false,
      reason: 'no_api_key',
      message:
        'Clé API Google Maps manquante. Ajoutez VITE_GOOGLE_MAPS_JS_API_KEY dans votre .env (Geocoding API activée).',
    };
  }

  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}&region=fr&language=fr`;
    const res = await fetch(url);
    const json = await res.json() as {
      status: string;
      error_message?: string;
      results: Array<{
        formatted_address: string;
        geometry: { location: { lat: number; lng: number } };
        address_components: Array<{ types: string[]; long_name: string }>;
      }>;
    };

    if (json.status === 'OK' && json.results.length) {
      const result = json.results[0];
      const loc = result.geometry.location;
      const cityComp = result.address_components.find(
        (c) => c.types.includes('locality') || c.types.includes('postal_town'),
      );
      return {
        ok: true,
        data: {
          lat: loc.lat,
          lng: loc.lng,
          city: cityComp?.long_name ?? '',
          formattedAddress: result.formatted_address,
        },
      };
    }

    if (json.status === 'ZERO_RESULTS') {
      return {
        ok: false,
        reason: 'no_results',
        message: "Aucun résultat pour cette adresse. Précisez rue, code postal et ville.",
      };
    }

    const detail = json.error_message?.trim();
    return {
      ok: false,
      reason: 'google_error',
      message:
        detail ||
        (json.status === 'REQUEST_DENIED'
          ? 'Géocodage refusé : vérifiez la clé API, les restrictions (domaine) et que l’API Geocoding est activée.'
          : `Géocodage impossible (${json.status}).`),
    };
  } catch {
    return {
      ok: false,
      reason: 'network',
      message: 'Réseau indisponible ou requête bloquée. Réessayez.',
    };
  }
}

export async function geocodeAddress(address: string): Promise<GeocodeResult | null> {
  const r = await geocodeAddressDetailed(address);
  return r.ok ? r.data : null;
}

// ─────────────────────────────────────────────────────────────────────────────
// updateStudioGeo
// ─────────────────────────────────────────────────────────────────────────────

export async function updateStudioGeo(
  studioId: string,
  lat: number,
  lng: number,
  city: string,
  locationVisible: boolean,
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('inkflow_studios')
    .update({
      latitude: lat,
      longitude: lng,
      city,
      location_visible: locationVisible,
    })
    .eq('id', studioId);

  return { error: error?.message ?? null };
}

// ─────────────────────────────────────────────────────────────────────────────
// getStudioGeo  (lecture pour le dashboard)
// ─────────────────────────────────────────────────────────────────────────────

export interface StudioGeoData {
  latitude: number | null;
  longitude: number | null;
  city: string | null;
  location_visible: boolean;
}

export async function getStudioGeo(studioId: string): Promise<StudioGeoData | null> {
  const { data, error } = await supabase
    .from('inkflow_studios')
    .select('latitude, longitude, city, location_visible')
    .eq('id', studioId)
    .maybeSingle();

  if (error || !data) return null;
  return data as StudioGeoData;
}
