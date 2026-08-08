/**
 * Persistance jalon « lien vitrine partagé » — Supabase + fallback localStorage.
 */
import { hasMarkedVitrineLinkShared, markVitrineLinkShared } from './firstBookingGoal';

export async function fetchVitrineLinkSharedRemote(studioId: string): Promise<boolean> {
  if (!studioId.trim()) return hasMarkedVitrineLinkShared();
  try {
    const { supabase } = await import('./supabase');
    const { data, error } = await supabase
      .from('inkflow_user_settings')
      .select('onboarding_vitrine_link_shared_at')
      .eq('studio_id', studioId)
      .maybeSingle();
    if (error || !data) return hasMarkedVitrineLinkShared();
    if (data.onboarding_vitrine_link_shared_at) return true;
    return hasMarkedVitrineLinkShared();
  } catch {
    return hasMarkedVitrineLinkShared();
  }
}

export async function markVitrineLinkSharedRemote(studioId: string): Promise<void> {
  markVitrineLinkShared();
  if (!studioId.trim()) return;
  try {
    const { supabase } = await import('./supabase');
    const now = new Date().toISOString();
    await supabase.from('inkflow_user_settings').upsert(
      {
        studio_id: studioId,
        onboarding_vitrine_link_shared_at: now,
        updated_at: now,
      },
      { onConflict: 'studio_id' }
    );
  } catch {
    // localStorage déjà posé
  }
}
