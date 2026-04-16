import { supabase } from './supabase';

/**
 * Studio auquel un collaborateur est rattaché (ligne inkflow_artist_accounts pré-créée par le patron).
 */
export async function getCollaboratorStudioByEmail(email: string): Promise<{
  id: string;
  slug: string;
  subscription_status?: string;
  trial_ends_at?: string | null;
  siret?: string | null;
  plan_type?: string;
  csv_import_slots_remaining?: number | null;
  studioOwnerEmail: string;
} | null> {
  const em = email.trim().toLowerCase();
  if (!em) return null;

  const { data: acc, error: accErr } = await supabase
    .from('inkflow_artist_accounts')
    .select('studio_id')
    .ilike('email', em)
    .limit(1)
    .maybeSingle();

  if (accErr || !acc?.studio_id) return null;

  const { data: st, error: stErr } = await supabase
    .from('inkflow_studios')
    .select(
      'id, slug, email, subscription_status, trial_ends_at, siret, plan_type, csv_import_slots_remaining'
    )
    .eq('id', acc.studio_id)
    .maybeSingle();

  if (stErr || !st?.id) return null;

  const ownerEmail = typeof st.email === 'string' ? st.email.trim().toLowerCase() : '';
  if (ownerEmail === em) return null;

  return {
    id: st.id as string,
    slug: (st.slug as string) || 'studio',
    subscription_status: st.subscription_status as string | undefined,
    trial_ends_at: st.trial_ends_at as string | null | undefined,
    siret: (st.siret as string | null) ?? null,
    plan_type: st.plan_type as string | undefined,
    csv_import_slots_remaining: st.csv_import_slots_remaining as number | null | undefined,
    studioOwnerEmail: st.email as string,
  };
}

/**
 * Associe la session Supabase à la ligne artiste invitée (après inscription ou première connexion).
 */
export async function linkCollaboratorArtistAccountToUser(userId: string, email: string): Promise<boolean> {
  const em = email.trim().toLowerCase();
  if (!em || !userId) return false;

  const { data, error } = await supabase
    .from('inkflow_artist_accounts')
    .update({
      auth_user_id: userId,
      updated_at: new Date().toISOString(),
    })
    .ilike('email', em)
    .is('auth_user_id', null)
    .select('id')
    .maybeSingle();

  if (error) {
    console.warn('[collaboratorStudio] linkCollaboratorArtistAccountToUser', error.message);
    return false;
  }
  return !!data?.id;
}
