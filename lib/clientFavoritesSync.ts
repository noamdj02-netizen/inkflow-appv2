import {
  mergeFavoriteFlashIdsFromRemote,
  mergeFavoriteStudioIdsFromRemote,
  toggleFavoriteFlashId,
  toggleFavoriteStudioId,
} from './clientFavoritesLocal';
import { getClientFavorites, getClientStudioFavoriteIds, toggleFlashFavorite, toggleStudioFavorite } from './clientFavorites';

/** À l’ouverture de session : récupère les favoris cloud et les fusionne avec le local (offline-first). */
export async function hydrateClientFavoritesFromSupabase(clientEmail: string): Promise<void> {
  const trimmed = clientEmail.trim();
  if (!trimmed) return;
  const [remoteFlash, remoteStudios] = await Promise.all([
    getClientFavorites(trimmed),
    getClientStudioFavoriteIds(trimmed),
  ]);
  mergeFavoriteFlashIdsFromRemote(remoteFlash);
  mergeFavoriteStudioIdsFromRemote(remoteStudios);
}

/**
 * Toggle local puis sync Edge Function si un e-mail compte est fourni.
 * En cas d’échec réseau, annule le toggle local et propage l’erreur.
 */
export async function toggleFavoriteWithSupabaseSync(
  flashId: string,
  clientEmail: string | null | undefined,
): Promise<boolean> {
  const nextFavorite = toggleFavoriteFlashId(flashId);
  const email = clientEmail?.trim();
  if (!email) return nextFavorite;
  try {
    await toggleFlashFavorite(flashId, nextFavorite);
  } catch (e) {
    toggleFavoriteFlashId(flashId);
    throw e;
  }
  return nextFavorite;
}

/**
 * Toggle favori studio (tatoueur) puis sync Edge Function si e-mail compte fourni.
 */
export async function toggleStudioFavoriteWithSupabaseSync(
  studioId: string,
  clientEmail: string | null | undefined,
): Promise<boolean> {
  const nextFavorite = toggleFavoriteStudioId(studioId);
  const email = clientEmail?.trim();
  if (!email) return nextFavorite;
  try {
    await toggleStudioFavorite(studioId, nextFavorite);
  } catch (e) {
    toggleFavoriteStudioId(studioId);
    throw e;
  }
  return nextFavorite;
}
