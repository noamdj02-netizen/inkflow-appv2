import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.95.3";

/**
 * Résout le studio : propriétaire (email) ou collaborateur (ligne artiste + auth / email).
 */
export async function resolveStudioRowForUser(
  supabase: SupabaseClient,
  user: { id: string; email: string | null },
  requestedStudioId?: string | null,
): Promise<{
  studio: { id: string; email: string; slug: string; stripe_connect_account_id?: string | null };
  isOwner: boolean;
} | null> {
  const em = user.email?.trim().toLowerCase() ?? "";
  if (!em) return null;

  if (requestedStudioId?.trim()) {
    const sid = requestedStudioId.trim();
    const { data: st, error } = await supabase
      .from("inkflow_studios")
      .select("id, email, slug, stripe_connect_account_id")
      .eq("id", sid)
      .maybeSingle();
    if (error || !st?.id) return null;
    const ownerEmail = String(st.email || "").trim().toLowerCase();
    if (ownerEmail === em) {
      return { studio: st as { id: string; email: string; slug: string; stripe_connect_account_id?: string | null }, isOwner: true };
    }
    const { data: colByUser } = await supabase
      .from("inkflow_artist_accounts")
      .select("id")
      .eq("studio_id", sid)
      .eq("auth_user_id", user.id)
      .maybeSingle();
    if (colByUser?.id) {
      return { studio: st as { id: string; email: string; slug: string; stripe_connect_account_id?: string | null }, isOwner: false };
    }
    const { data: colByEmail } = await supabase
      .from("inkflow_artist_accounts")
      .select("id")
      .eq("studio_id", sid)
      .ilike("email", em)
      .maybeSingle();
    if (colByEmail?.id) {
      return { studio: st as { id: string; email: string; slug: string; stripe_connect_account_id?: string | null }, isOwner: false };
    }
    return null;
  }

  const { data: byOwner, error: e1 } = await supabase
    .from("inkflow_studios")
    .select("id, email, slug, stripe_connect_account_id")
    .ilike("email", em)
    .maybeSingle();
  if (!e1 && byOwner?.id) {
    return { studio: byOwner as { id: string; email: string; slug: string; stripe_connect_account_id?: string | null }, isOwner: true };
  }

  let collabStudioId: string | null = null;
  const { data: accByUser } = await supabase
    .from("inkflow_artist_accounts")
    .select("studio_id")
    .eq("auth_user_id", user.id)
    .limit(1)
    .maybeSingle();
  if (accByUser?.studio_id) collabStudioId = accByUser.studio_id as string;
  if (!collabStudioId) {
    const { data: accByEmail } = await supabase
      .from("inkflow_artist_accounts")
      .select("studio_id")
      .ilike("email", em)
      .limit(1)
      .maybeSingle();
    if (accByEmail?.studio_id) collabStudioId = accByEmail.studio_id as string;
  }
  if (!collabStudioId) return null;

  const { data: st2, error: e3 } = await supabase
    .from("inkflow_studios")
    .select("id, email, slug, stripe_connect_account_id")
    .eq("id", collabStudioId)
    .maybeSingle();
  if (e3 || !st2?.id) return null;
  return { studio: st2 as { id: string; email: string; slug: string; stripe_connect_account_id?: string | null }, isOwner: false };
}
