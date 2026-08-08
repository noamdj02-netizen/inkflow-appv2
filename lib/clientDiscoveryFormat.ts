import type { NearbyStudio } from './supabaseGeo';

/**
 * Libellé court pour le header type « Paris / près de toi » (pas de géocodage inverse).
 * - Ville la plus fréquente parmi les studios de découverte, sinon « Près de toi » si GPS actif.
 */
export function clientDiscoveryAreaLabel(
  userPos: { lat: number; lng: number } | null,
  studios: NearbyStudio[],
): string {
  const cities = studios.map((s) => s.city?.trim()).filter((c): c is string => Boolean(c));
  if (cities.length > 0) {
    const counts = new Map<string, number>();
    for (const c of cities) {
      counts.set(c, (counts.get(c) ?? 0) + 1);
    }
    let best: string | null = null;
    let bestN = 0;
    for (const [c, n] of counts) {
      if (n > bestN) {
        bestN = n;
        best = c;
      }
    }
    if (best) return best;
  }
  if (userPos) return 'Près de toi';
  return 'Parcourir les studios';
}

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
