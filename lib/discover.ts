/**
 * lib/discover.ts — Data layer pour la feature Discover (SPA Vite)
 * Remplace les API routes Next.js — appels Supabase directs depuis le client.
 */
import { supabase } from './supabase';

/**
 * Tables `inkflow_city_pages`, `inkflow_reviews`, `inkflow_review_votes` ne sont pas
 * encore dans `types/database.ts` — casts jusqu’à `supabase gen types` après sync schéma.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */

// ── Types publics ─────────────────────────────────────────────────────────────

export interface DiscoverStudio {
  id: string;
  slug: string;
  name: string;
  studio_name: string;
  city: string | null;
  city_slug: string | null;
  styles: string[];
  bio: string | null;
  instagram: string | null;
  price_min: number | null;
  price_max: number | null;
  rating_avg: number;
  rating_count: number;
  portfolio_cover_url: string | null;
  portfolio_preview: string[];
  lat: number | null;
  lng: number | null;
  last_active_at: string | null;
  discover_rank: number;
}

export interface DiscoverReview {
  id: string;
  client_name: string;
  rating: number;
  body: string | null;
  tattoo_style: string | null;
  tattoo_photo_url: string | null;
  is_verified: boolean;
  reply_body: string | null;
  reply_at: string | null;
  helpful_count: number;
  created_at: string;
}

export interface CityPage {
  slug: string;
  name: string;
  department: string | null;
  region: string | null;
  artist_count: number;
  hero_image_url: string | null;
}

export interface SearchParams {
  city?: string;
  style?: string;
  q?: string;
  priceMax?: number;
  priceMin?: number;
  sort?: 'rank' | 'rating' | 'recent';
  page?: number;
  perPage?: number;
}

export interface SearchResult {
  studios: DiscoverStudio[];
  total: number;
  page: number;
  totalPages: number;
}

// ── SELECT fragment réutilisable ─────────────────────────────────────────────
const STUDIO_SELECT = `
  id, slug, name, studio_name, city, city_slug,
  styles, bio, instagram,
  price_min, price_max,
  rating_avg, rating_count,
  portfolio_cover_url, portfolio_preview,
  lat, lng, last_active_at, discover_rank
`.trim();

// ── Recherche studios ─────────────────────────────────────────────────────────
export async function searchStudios(params: SearchParams): Promise<SearchResult> {
  const { city, style, q, priceMax, priceMin, sort = 'rank', page = 1, perPage = 12 } = params;

  let query = (supabase as any)
    .from('inkflow_studios')
    .select(STUDIO_SELECT, { count: 'exact' })
    .eq('is_discoverable', true);

  if (city) query = query.eq('city_slug', city);
  if (style) query = query.contains('styles', [style]);
  if (priceMax) query = query.lte('price_min', priceMax);
  if (priceMin) query = query.gte('price_max', priceMin);
  if (q) query = query.or(`name.ilike.%${q}%,studio_name.ilike.%${q}%,bio.ilike.%${q}%`);

  const sortMap: Record<string, { col: string; asc: boolean }> = {
    rank: { col: 'discover_rank', asc: false },
    rating: { col: 'rating_avg', asc: false },
    recent: { col: 'last_active_at', asc: false },
  };
  const { col, asc } = sortMap[sort] ?? sortMap.rank;
  query = query.order(col, { ascending: asc }).order('id', { ascending: true });

  const from = (page - 1) * perPage;
  query = query.range(from, from + perPage - 1);

  const { data, error, count } = await query;
  if (error) throw new Error(error.message);

  return {
    studios: (data ?? []) as DiscoverStudio[],
    total: count ?? 0,
    page,
    totalPages: Math.ceil((count ?? 0) / perPage),
  };
}

// ── Studios tendance ──────────────────────────────────────────────────────────
export async function getTrendingStudios(limit = 8): Promise<DiscoverStudio[]> {
  const { data, error } = await (supabase as any)
    .from('inkflow_studios')
    .select(STUDIO_SELECT)
    .eq('is_discoverable', true)
    .gte('rating_count', 1)
    .order('discover_rank', { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);
  return (data ?? []) as DiscoverStudio[];
}

// ── Villes actives ────────────────────────────────────────────────────────────
export async function getActiveCities(limit = 12): Promise<CityPage[]> {
  const { data, error } = await (supabase as any)
    .from('inkflow_city_pages')
    .select('slug, name, department, region, artist_count, hero_image_url')
    .eq('is_active', true)
    .order('artist_count', { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);
  return (data ?? []) as CityPage[];
}

// ── Avis d'un studio ─────────────────────────────────────────────────────────
export async function getStudioReviews(
  studioId: string,
  page = 1
): Promise<{ reviews: DiscoverReview[]; total: number }> {
  const perPage = 10;
  const from = (page - 1) * perPage;

  const { data, error, count } = await (supabase as any)
    .from('inkflow_reviews')
    .select(
      'id, client_name, rating, body, tattoo_style, tattoo_photo_url, is_verified, reply_body, reply_at, helpful_count, created_at',
      { count: 'exact' }
    )
    .eq('studio_id', studioId)
    .eq('status', 'approved')
    .order('created_at', { ascending: false })
    .range(from, from + perPage - 1);

  if (error) throw new Error(error.message);
  return { reviews: (data ?? []) as DiscoverReview[], total: count ?? 0 };
}

// ── Poster un avis ────────────────────────────────────────────────────────────
export interface PostReviewPayload {
  studioId: string;
  clientName: string;
  clientEmail: string;
  rating: number;
  body?: string;
  tattooStyle?: string;
  tattooPhotoUrl?: string;
  appointmentId?: string;
}

export async function postReview(payload: PostReviewPayload): Promise<void> {
  const emailHash = Array.from(
    new Uint8Array(
      await crypto.subtle.digest(
        'SHA-256',
        new TextEncoder().encode(payload.clientEmail.toLowerCase().trim())
      )
    )
  )
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  const { error } = await (supabase as any).from('inkflow_reviews').insert({
    id: crypto.randomUUID(),
    studio_id: payload.studioId,
    client_name: payload.clientName,
    client_email: payload.clientEmail,
    client_email_hash: emailHash,
    rating: payload.rating,
    body: payload.body ?? null,
    tattoo_style: payload.tattooStyle ?? null,
    tattoo_photo_url: payload.tattooPhotoUrl ?? null,
    appointment_id: payload.appointmentId ?? null,
    is_verified: false,
    status: 'pending',
  });

  if (error) {
    if (error.code === '23505') throw new Error('Vous avez déjà laissé un avis pour cet artiste.');
    throw new Error(error.message);
  }
}

// ── Répondre à un avis (tatoueur authentifié) ────────────────────────────────
export async function replyToReview(reviewId: string, replyBody: string): Promise<void> {
  const { error } = await (supabase as any)
    .from('inkflow_reviews')
    .update({ reply_body: replyBody, reply_at: new Date().toISOString() })
    .eq('id', reviewId);

  if (error) throw new Error(error.message);
}

// ── Vote utilité ──────────────────────────────────────────────────────────────
export async function voteReview(
  reviewId: string,
  vote: 'helpful' | 'not_helpful',
  fingerprint: string
): Promise<void> {
  const { error } = await (supabase as any).from('inkflow_review_votes').insert({
    id: crypto.randomUUID(),
    review_id: reviewId,
    voter_fingerprint: fingerprint,
    vote,
  });
  if (error && error.code !== '23505') throw new Error(error.message);
}

// ── Détail d'une ville ────────────────────────────────────────────────────────
export async function getCityPage(slug: string): Promise<CityPage | null> {
  const { data, error } = await (supabase as any)
    .from('inkflow_city_pages')
    .select('slug, name, department, region, artist_count, hero_image_url, meta_description')
    .eq('slug', slug)
    .eq('is_active', true)
    .single();

  if (error) return null;
  return data as CityPage;
}
