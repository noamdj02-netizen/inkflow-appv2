import type { NearbyStudio } from './supabaseGeo';

export function distLabel(km: number | null): string | null {
  if (km == null) return null;
  return km < 1 ? '< 1 km' : `${Math.round(km)} km`;
}

/** Première ligne d’adresse vitrine si présente, sinon ville (table studio). */
export function discoveryLocationLine(s: NearbyStudio | null | undefined): string | null {
  if (!s) return null;
  const raw = s.address?.trim();
  if (raw) {
    const first = raw.split('\n').map((l) => l.trim()).find((l) => l.length > 0);
    if (first) return first;
  }
  const c = s.city?.trim();
  return c || null;
}
