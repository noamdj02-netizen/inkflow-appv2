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
  studioSlug: string | null;
  distance: string;
  gradient: [string, string];
  featured: boolean;
  displayOrder: number;
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
  /** Slug page réservation /book/[studioSlug] */
  studioSlug: string | null;
  availableNow: boolean;
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

export async function fetchAvailableFlashes(limit = 40): Promise<FlashItem[]> {
  const { data, error } = await supabase
    .from('inkflow_flash_designs')
    .select(`
      id, slug, title, image_url, price, available, featured, display_order,
      inkflow_artists(name, slug),
      inkflow_studios(studio_name, slug)
    `)
    .eq('available', true)
    .eq('reserved', false)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching flashes:', error);
    return [];
  }

  const rows = (data ?? []).map((f) => {
    const artist = f.inkflow_artists as { name?: string; slug?: string } | null;
    const studio = f.inkflow_studios as { studio_name?: string; slug?: string } | null;

    return {
      id: f.id,
      slug: f.slug as string | null,
      title: f.title as string,
      imageUrl: f.image_url as string | null,
      price: Number(f.price) || 0,
      height: randomHeight(f.id as string),
      artistName: artist?.name ?? 'Artiste',
      artistSlug: artist?.slug ?? null,
      studioName: studio?.studio_name ?? 'Studio',
      studioSlug: studio?.slug ?? null,
      distance: '—',
      gradient: randomGradient(f.id as string),
      featured: Boolean(f.featured),
      displayOrder: Number(f.display_order) || 0,
    };
  });

  return rows.sort((a, b) => {
    if (a.featured !== b.featured) return a.featured ? -1 : 1;
    return a.displayOrder - b.displayOrder;
  });
}

export async function fetchFeaturedStudios(limit = 12): Promise<StudioItem[]> {
  const { data, error } = await supabase
    .from('inkflow_artists')
    .select(`
      id, name, slug, styles, years_exp, rating, tattoos_count, available_now,
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
      id: a.id as string,
      slug: a.slug as string | null,
      name: studio?.studio_name ?? 'Studio',
      artistName: a.name as string,
      style: styles[0] ?? 'Tatouage',
      rating: Number(a.rating) || 5.0,
      yearsExp: Number(a.years_exp) || 0,
      tattooCount: Number(a.tattoos_count) || 0,
      distance: '—',
      gradient: randomGradient(a.id as string),
      initials: String(a.name).slice(0, 2).toUpperCase(),
      address: 'Adresse communiquée après réservation',
      studioSlug: studio?.slug ?? null,
      availableNow: Boolean(a.available_now),
    };
  });
}

export async function fetchAnyArtistAvailableNow(): Promise<boolean> {
  const { count, error } = await supabase
    .from('inkflow_artists')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true)
    .eq('available_now', true);

  if (error) return false;
  return (count ?? 0) > 0;
}
