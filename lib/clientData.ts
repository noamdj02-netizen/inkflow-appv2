import { supabase } from './supabase';

export interface FlashItem {
  id: string;
  slug: string | null;
  title: string;
  imageUrl: string | null;
  price: number;
  height: number;
  artistName: string;
  artistSlug: string | null;
  studioName: string;
  distance: string;
  gradient: [string, string];
}

export interface StudioItem {
  id: string;
  slug: string | null;
  name: string;
  artistName: string;
  style: string;
  rating: number;
  yearsExp: number;
  tattooCount: number;
  distance: string;
  gradient: [string, string];
  initials: string;
  address: string;
}

const DEFAULT_GRADIENTS: [string, string][] = [
  ['#1a1a2e', '#c9a96e'],
  ['#2d1b69', '#11998e'],
  ['#0f2027', '#c9a96e'],
  ['#134e5e', '#71b280'],
  ['#1e3c72', '#e53935'],
];

function randomGradient(seed: string): [string, string] {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return DEFAULT_GRADIENTS[Math.abs(h) % DEFAULT_GRADIENTS.length];
}

function randomHeight(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return 150 + (Math.abs(h) % 100);
}

export async function fetchAvailableFlashes(limit = 30): Promise<FlashItem[]> {
  const { data, error } = await supabase
    .from('inkflow_flash_designs')
    .select(`
      id, slug, title, image_url, price, available,
      inkflow_artists(name, slug),
      inkflow_studios(studio_name)
    `)
    .eq('available', true)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching flashes:', error);
    return [];
  }

  return (data ?? []).map((f) => {
    const artist = f.inkflow_artists as { name?: string; slug?: string } | null;
    const studio = f.inkflow_studios as { studio_name?: string } | null;

    return {
      id: f.id,
      slug: f.slug,
      title: f.title,
      imageUrl: f.image_url,
      price: f.price ?? 0,
      height: randomHeight(f.id),
      artistName: artist?.name ?? 'Artiste',
      artistSlug: artist?.slug ?? null,
      studioName: studio?.studio_name ?? 'Studio',
      distance: '1.5 km',
      gradient: randomGradient(f.id),
    };
  });
}

export async function fetchFeaturedStudios(limit = 10): Promise<StudioItem[]> {
  const { data, error } = await supabase
    .from('inkflow_artists')
    .select(`
      id, name, slug, styles, years_exp, rating, tattoos_count,
      inkflow_studios(id, studio_name, slug)
    `)
    .eq('is_active', true)
    .order('rating', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching studios:', error);
    return [];
  }

  return (data ?? []).map((a) => {
    const studio = a.inkflow_studios as { id?: string; studio_name?: string; slug?: string } | null;
    const styles = (a.styles as string[]) ?? [];

    return {
      id: a.id,
      slug: a.slug,
      name: studio?.studio_name ?? 'Studio',
      artistName: a.name,
      style: styles[0] ?? 'Tatouage',
      rating: a.rating ?? 5.0,
      yearsExp: a.years_exp ?? 0,
      tattooCount: a.tattoos_count ?? 0,
      distance: '1.0 km',
      gradient: randomGradient(a.id),
      initials: a.name.slice(0, 2).toUpperCase(),
      address: 'Adresse communiquée après réservation',
    };
  });
}
