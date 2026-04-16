import { mergeFavoriteFlashIdsFromRemote, toggleFavoriteFlashId } from './clientFavoritesLocal';
import { getClientFavorites, toggleFlashFavorite } from './clientFavorites';

/** À l’ouverture de session : récupère les favoris cloud et les fusionne avec le local (offline-first). */
export async function hydrateClientFavoritesFromSupabase(clientEmail: string): Promise<void> {
  const trimmed = clientEmail.trim();
  if (!trimmed) return;
  const remote = await getClientFavorites(trimmed);
  mergeFavoriteFlashIdsFromRemote(remote);
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
