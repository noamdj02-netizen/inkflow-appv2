import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSupabaseEnabled } from './useSupabaseEnabled';
import { getStudioByEmail, ensureStudio } from '../lib/supabaseDashboard';

/**
 * Hook sécurisé : retourne le studio_id (et slug) du seul utilisateur authentifié.
 * Ne jamais faire confiance à un studio_id venant de l'URL ou du state pour les données sensibles.
 * Le backend (RLS Supabase) filtre déjà par JWT, ce hook garantit que le front n'utilise
 * que l'ID résolu côté serveur via getStudioByEmail(user.email).
 */
export function useSecureStudioId(): {
  studioId: string | null;
  studioSlug: string | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
} {
  const { user } = useAuth();
  const useSupabase = useSupabaseEnabled();
  const [studioId, setStudioId] = useState<string | null>(null);
  const [studioSlug, setStudioSlug] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchStudio = useCallback(async () => {
    if (!user?.email || !useSupabase) {
      setStudioId(null);
      setStudioSlug(null);
      setLoading(false);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const existing = await getStudioByEmail(user.email);
      if (existing) {
        setStudioId(existing.id);
        setStudioSlug(existing.slug);
      } else {
        const created = await ensureStudio(user.email, user.name ?? user.email.split('@')[0], user.studioName ?? 'Mon Studio');
        setStudioId(created.studioId);
        setStudioSlug(created.slug);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      setStudioId(null);
      setStudioSlug(null);
    } finally {
      setLoading(false);
    }
  }, [user?.email, user?.name, user?.studioName, useSupabase]);

  useEffect(() => {
    fetchStudio();
  }, [fetchStudio]);

  return { studioId, studioSlug, loading, error, refetch: fetchStudio };
}
