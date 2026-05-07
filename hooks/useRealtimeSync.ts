import { useEffect, useRef, type Dispatch, type SetStateAction } from 'react';
import { supabase } from '../lib/supabase';
import { getStudioIdBySlug } from '../lib/supabaseDashboard';
import type { VitrineData } from '../types/vitrine';
import { defaultVitrineData } from '../lib/vitrineStorageDefault';

type SetState<T> = Dispatch<SetStateAction<T[]>>;

/**
 * Delta-based Supabase Realtime subscription for list-type data.
 *
 * Instead of refetching the entire table on every change,
 * it applies INSERT / UPDATE / DELETE deltas directly to React state.
 *
 * Usage:
 *   useRealtimeSync(
 *     'inkflow_appointments',
 *     { column: 'studio_id', value: studioId },
 *     setAppointments,
 *     mapAppointmentFromDb,
 *     useSupabase
 *   );
 */
export function useRealtimeSync<T extends { id: string }>(
  table: string,
  filter: { column: string; value: string | null },
  setState: SetState<T>,
  mapFromDb: (row: Record<string, unknown>) => T,
  enabled: boolean
): void {
  const stableFilter = `${filter.column}=eq.${filter.value}`;

  useEffect(() => {
    if (!enabled || !filter.value) return;

    const channelName = `rt-${table}-${filter.value}`;

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table, filter: stableFilter },
        (payload) => {
          try {
            const newItem = mapFromDb(payload.new as Record<string, unknown>);
            setState((prev) => {
              // Avoid duplicates (optimistic add may have already inserted it)
              if (prev.some((i) => i.id === newItem.id)) {
                return prev.map((i) => (i.id === newItem.id ? newItem : i));
              }
              return [...prev, newItem];
            });
          } catch {}
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table, filter: stableFilter },
        (payload) => {
          try {
            const updated = mapFromDb(payload.new as Record<string, unknown>);
            setState((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
          } catch {}
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table, filter: stableFilter },
        (payload) => {
          const oldId = (payload.old as Record<string, unknown>)?.id as string;
          if (oldId) {
            setState((prev) => prev.filter((i) => i.id !== oldId));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table, stableFilter, enabled]);
}

/**
 * Realtime subscription for the public vitrine page.
 *
 * Resolves studioSlug -> studioId once, then subscribes to
 * inkflow_vitrine_data changes for that studio. When the tatoueur
 * updates their vitrine settings, this updates the public page live.
 *
 * Usage:
 *   useRealtimeVitrine(studioSlug, setStudio);
 */
export function useRealtimeVitrine(
  studioSlug: string,
  setStudio: Dispatch<SetStateAction<VitrineData | null>>
): void {
  const resolvedIdRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    const url = import.meta.env.VITE_SUPABASE_URL;
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
    const supabaseEnabled = !!(url && key && url.length > 10);

    if (!supabaseEnabled || !studioSlug) return;

    getStudioIdBySlug(studioSlug)
      .then((studioId) => {
        if (cancelled || !studioId) return;
        resolvedIdRef.current = studioId;

        channel = supabase
          .channel(`rt-vitrine-${studioId}`)
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'inkflow_vitrine_data',
              filter: `studio_id=eq.${studioId}`,
            },
            (payload) => {
              try {
                const row = payload.new as Record<string, unknown>;
                const vitrinePayload = row.data as object | null;
                if (vitrinePayload) {
                  const defaults = defaultVitrineData(studioSlug);
                  setStudio({ ...defaults, ...vitrinePayload, slug: studioSlug } as VitrineData);
                }
              } catch {}
            }
          )
          .subscribe();
      })
      .catch(() => {});

    return () => {
      cancelled = true;
      if (channel) supabase.removeChannel(channel);
    };
  }, [studioSlug, setStudio]);
}
