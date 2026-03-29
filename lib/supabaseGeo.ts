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
  city: string | null;
  latitude: number;
  longitude: number;
  distance_km: number;
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
  latitude: number;
  longitude: number;
  distance_km: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// getNearbyStudios
// ─────────────────────────────────────────────────────────────────────────────

export async function getNearbyStudios(
  lat: number,
  lng: number,
  radiusKm = 50,
): Promise<NearbyStudio[]> {
  const { data: rows, error } = await supabase.rpc('get_nearby_studios', {
    user_lat: lat,
    user_lng: lng,
    radius_km: radiusKm,
    limit_count: 20,
  });

  if (error || !rows?.length) return [];

  const studioIds = (rows as RpcRow[]).map((r) => r.id);

  const { data: vitrineRows } = await supabase
    .from('inkflow_vitrine_data')
    .select('studio_id, data')
    .in('studio_id', studioIds);

  const vitrineMap = new Map<string, Record<string, unknown>>(
    (vitrineRows ?? []).map((v: { studio_id: string; data: Record<string, unknown> }) => [
      v.studio_id,
      v.data ?? {},
    ]),
  );

  return (rows as RpcRow[]).map((s) => {
    const vd = vitrineMap.get(s.id) ?? {};

    // Flash designs disponibles
    const flashRaw = Array.isArray(vd.flashDesigns) ? vd.flashDesigns : [];
    const flash: FlashPreview[] = flashRaw
      .filter((f: Record<string, unknown>) => f.available !== false && f.imageUrl)
      .slice(0, 8)
      .map((f: Record<string, unknown>) => ({
        id: String(f.id ?? ''),
        title: String(f.title ?? 'Flash'),
        imageUrl: String(f.imageUrl ?? ''),
        price: Number(f.price ?? 0),
        style: f.style ? String(f.style) : undefined,
        studioSlug: s.slug,
        studioName: s.studio_name,
      }));

    // Portfolio (4 premières photos)
    const portRaw = Array.isArray(vd.portfolio) ? vd.portfolio : [];
    const portfolio: PortfolioPreview[] = portRaw
      .filter((p: Record<string, unknown>) => p.url)
      .slice(0, 4)
      .map((p: Record<string, unknown>) => ({
        url: String(p.url),
        category: String(p.category ?? ''),
      }));

    // Tags depuis services ou styles
    const services = Array.isArray(vd.services) ? vd.services : [];
    const tags: string[] = services
      .map((sv: Record<string, unknown>) => String(sv.name ?? ''))
      .filter(Boolean)
      .slice(0, 3);

    return { ...s, flash, portfolio, tags };
  });
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

export async function geocodeAddress(address: string): Promise<GeocodeResult | null> {
  const apiKey = getGoogleMapsBrowserApiKey();
  if (!apiKey) {
    console.warn('[supabaseGeo] Clé Google Maps navigateur manquante (VITE_GOOGLE_MAPS_JS_API_KEY ou VITE_GOOGLE_MAPS_API_KEY)');
    return null;
  }

  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}&region=fr&language=fr`;
    const res = await fetch(url);
    const json = await res.json() as {
      status: string;
      results: Array<{
        formatted_address: string;
        geometry: { location: { lat: number; lng: number } };
        address_components: Array<{ types: string[]; long_name: string }>;
      }>;
    };

    if (json.status !== 'OK' || !json.results.length) return null;

    const result = json.results[0];
    const loc = result.geometry.location;
    const cityComp = result.address_components.find(
      (c) => c.types.includes('locality') || c.types.includes('postal_town'),
    );

    return {
      lat: loc.lat,
      lng: loc.lng,
      city: cityComp?.long_name ?? '',
      formattedAddress: result.formatted_address,
    };
  } catch {
    return null;
  }
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
