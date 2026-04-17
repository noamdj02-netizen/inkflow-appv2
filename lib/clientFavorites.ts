import { supabase } from './supabase';

function getSupabaseEdgeConfig(): { url: string; anonKey: string } {
  const url = (import.meta.env.VITE_SUPABASE_URL || '').trim().replace(/\/+$/, '');
  const anonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim().replace(/^['"]|['"]$/g, '');
  return { url, anonKey };
}

/** Récupère un access_token frais ; rafraîchit la session si expiration imminente. */
async function getFreshAccessToken(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) return null;
  const expMs = (session.expires_at ?? 0) * 1000;
  // Refresh si < 60s ou si pas d'expiration connue
  if (!expMs || expMs - Date.now() < 60_000) {
    const { data: refreshed } = await supabase.auth.refreshSession().catch(() => ({ data: { session: null } }));
    return refreshed?.session?.access_token ?? session.access_token ?? null;
  }
  return session.access_token;
}

async function callFavoriteEdge(
  body: { flash_id?: string; studio_id?: string },
  method: 'POST' | 'DELETE',
): Promise<void> {
  const { url, anonKey } = getSupabaseEdgeConfig();
  if (!url || !anonKey) {
    throw new Error('Application non configurée (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY).');
  }

  const doFetch = async (token: string): Promise<Response> => {
    return fetch(`${url}/functions/v1/client-favorite`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        apikey: anonKey,
      },
      body: JSON.stringify(body),
    });
  };

  let token = await getFreshAccessToken();
  if (!token) {
    throw new Error('Connectez-vous pour enregistrer vos favoris.');
  }

  let res: Response;
  try {
    res = await doFetch(token);
  } catch {
    throw new Error('Connexion instable. Vérifiez le réseau et réessayez.');
  }

  // Si 401 : force refresh session et retry une fois
  if (res.status === 401) {
    await supabase.auth.refreshSession().catch(() => {});
    const { data: { session: s2 } } = await supabase.auth.getSession();
    token = s2?.access_token ?? null;
    if (token) {
      try {
        res = await doFetch(token);
      } catch {
        throw new Error('Connexion instable. Vérifiez le réseau et réessayez.');
      }
    }
  }

  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    if (res.status === 401) {
      throw new Error('Session expirée. Reconnectez-vous pour enregistrer vos favoris.');
    }
    throw new Error(
      typeof data.error === 'string' && data.error.trim()
        ? data.error
        : 'Impossible de mettre à jour le favori pour le moment.',
    );
  }
}

export async function toggleFlashFavorite(flashId: string, add: boolean): Promise<boolean> {
  await callFavoriteEdge({ flash_id: flashId }, add ? 'POST' : 'DELETE');
  return true;
}

/** Favori studio / tatoueur (carte « Artistes proches ») — même Edge Function, corps `studio_id`. */
export async function toggleStudioFavorite(studioId: string, add: boolean): Promise<boolean> {
  await callFavoriteEdge({ studio_id: studioId }, add ? 'POST' : 'DELETE');
  return true;
}

export async function getClientFavorites(clientEmail: string): Promise<Set<string>> {
  const { data, error } = await supabase
    .from('inkflow_client_favorites')
    .select('flash_id')
    .eq('client_email', clientEmail);

  if (error) {
    if (import.meta.env.DEV) {
      console.warn('[clientFavorites] getClientFavorites:', error.message);
    }
    return new Set();
  }

  return new Set((data ?? []).map((f) => f.flash_id));
}

/** IDs studios favoris (Explore), même compte que les favoris flash (email). */
export async function getClientStudioFavoriteIds(clientEmail: string): Promise<Set<string>> {
  const { data, error } = await supabase
    .from('inkflow_client_studio_favorites')
    .select('studio_id')
    .eq('client_email', clientEmail);

  if (error) {
    if (import.meta.env.DEV) {
      console.warn('[clientFavorites] getClientStudioFavoriteIds:', error.message);
    }
    return new Set();
  }

  return new Set((data ?? []).map((r: { studio_id: string }) => r.studio_id));
}

export async function getFavoritedFlashes(clientEmail: string) {
  const { data, error } = await supabase
    .from('inkflow_client_favorites')
    .select(`
      flash_id,
      inkflow_flash_designs(
        id, slug, title, image_url, price, available,
        inkflow_artists(name, slug),
        inkflow_studios(studio_name)
      )
    `)
    .eq('client_email', clientEmail);

  if (error) {
    if (import.meta.env.DEV) {
      console.warn('[clientFavorites] getFavoritedFlashes:', error.message);
    }
    return [];
  }

  return (data ?? [])
    .map((row) => {
      const flash = row.inkflow_flash_designs as Record<string, unknown> | null;
      if (!flash) return null;

      const artist = flash.inkflow_artists as { name?: string; slug?: string } | null;
      const studio = flash.inkflow_studios as { studio_name?: string } | null;

      return {
        id: flash.id as string,
        slug: flash.slug as string | null,
        title: flash.title as string,
        imageUrl: flash.image_url as string | null,
        price: flash.price as number,
        available: flash.available as boolean,
        artistName: artist?.name ?? 'Artiste',
        artistSlug: artist?.slug ?? null,
        studioName: studio?.studio_name ?? 'Studio',
      };
    })
    .filter(Boolean);
}
