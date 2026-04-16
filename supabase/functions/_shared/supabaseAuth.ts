import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.3";

/**
 * Utilisateur courant via **GET /auth/v1/user** (GoTrue valide le JWT côté serveur).
 * Plus fiable que `auth.getUser()` du SDK dans Deno Edge (certains builds refusent encore ES256 en local).
 */
export async function getGoTrueUser(
  supabaseUrl: string,
  anonKey: string,
  accessToken: string,
): Promise<{ id: string; email: string | null } | null> {
  const base = supabaseUrl.replace(/\/+$/, "");
  const token = accessToken.trim();
  if (!base || !anonKey || !token) return null;

  const res = await fetch(`${base}/auth/v1/user`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      apikey: anonKey,
    },
  });

  if (!res.ok) return null;

  try {
    const u = (await res.json()) as { id?: unknown; email?: unknown };
    const id = typeof u.id === "string" ? u.id : null;
    if (!id) return null;
    const email = typeof u.email === "string" && u.email.trim() ? u.email.trim() : null;
    return { id, email };
  } catch {
    return null;
  }
}

/**
 * Client Supabase qui envoie le JWT à l’API Auth (GoTrue).
 * Préférer `getGoTrueUser` pour la résolution d’identité dans les Edge Functions.
 */
export function createSupabaseUserClient(
  supabaseUrl: string,
  anonKey: string,
  accessToken: string,
) {
  return createClient(supabaseUrl, anonKey, {
    global: {
      headers: { Authorization: `Bearer ${accessToken}` },
    },
  });
}
