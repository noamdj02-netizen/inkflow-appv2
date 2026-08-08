import { supabase } from './supabase';

export type StudioPublicMetricsPayload = {
  vitrine_views: number;
  discover_profile_views: number;
  is_discoverable: boolean;
  instagram: string | null;
  rating_count: number;
  rating_avg: number | null;
};

function parseMetricsPayload(data: unknown): StudioPublicMetricsPayload | null {
  if (!data || typeof data !== 'object') return null;
  const o = data as Record<string, unknown>;
  return {
    vitrine_views: Number(o.vitrine_views) || 0,
    discover_profile_views: Number(o.discover_profile_views) || 0,
    is_discoverable: Boolean(o.is_discoverable),
    instagram: typeof o.instagram === 'string' && o.instagram.trim() ? o.instagram.trim() : null,
    rating_count: Number(o.rating_count) || 0,
    rating_avg: o.rating_avg != null && o.rating_avg !== '' ? Number(o.rating_avg) : null,
  };
}

export async function fetchStudioPublicMetricsForDashboard(
  studioId: string
): Promise<StudioPublicMetricsPayload | null> {
  if (!studioId) return null;
  const { data, error } = await supabase.rpc('get_studio_public_metrics_for_dashboard', {
    p_studio_id: studioId,
  });
  if (error) {
    if (import.meta.env.DEV) {
      console.warn('[fetchStudioPublicMetricsForDashboard]', error.message);
    }
    return null;
  }
  return parseMetricsPayload(data);
}

export function recordVitrineChannelView(studioId: string | null | undefined): void {
  if (!studioId) return;
  void supabase.rpc('increment_studio_channel_view', {
    p_studio_id: studioId,
    p_channel: 'vitrine',
  });
}

export function recordDiscoverChannelView(studioId: string | null | undefined): void {
  if (!studioId) return;
  void supabase.rpc('increment_studio_channel_view', {
    p_studio_id: studioId,
    p_channel: 'discover',
  });
}
