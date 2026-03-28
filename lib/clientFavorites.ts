import { supabase } from './supabase';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export async function toggleFlashFavorite(flashId: string, add: boolean): Promise<boolean> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error('Non connecté');
  }

  const method = add ? 'POST' : 'DELETE';
  const res = await fetch(`${SUPABASE_URL}/functions/v1/client-favorite`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ flash_id: flashId }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Erreur lors de la mise à jour');
  }

  return true;
}

export async function getClientFavorites(clientEmail: string): Promise<Set<string>> {
  const { data, error } = await supabase
    .from('inkflow_client_favorites')
    .select('flash_id')
    .eq('client_email', clientEmail);

  if (error) {
    console.error('Error fetching favorites:', error);
    return new Set();
  }

  return new Set((data ?? []).map((f) => f.flash_id));
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
    console.error('Error fetching favorited flashes:', error);
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
