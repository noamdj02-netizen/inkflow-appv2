/**
 * Actions demande projet (acceptation / refus) — Option A sprint.
 * Backend : Supabase Edge Functions (JWT tatoueur). Équivalent REST : POST /api/projects/:id/accept|reject via proxy Vercel si déployé.
 */
import { supabase } from './supabase';

export interface AcceptProjectRequestInput {
  proposed_slot: string;
  slot_expires_at: string;
  artist_message?: string | null;
}

export interface ProjectRequestActionResult {
  ok?: boolean;
  error?: string;
  project_request_id?: string;
  email_id?: string;
  warning?: string;
}

function functionsBaseUrl(): string {
  const base = (import.meta.env.VITE_SUPABASE_URL || '').trim().replace(/\/+$/, '');
  if (!base) throw new Error('VITE_SUPABASE_URL manquant');
  return `${base}/functions/v1`;
}

async function getAccessToken(): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  if (!token) throw new Error('Session requise');
  return token;
}

/**
 * POST /api/projects/:id/accept — implémentation : Edge Function `project-request-accept`.
 */
export async function acceptProjectRequest(
  projectRequestId: string,
  input: AcceptProjectRequestInput,
): Promise<ProjectRequestActionResult> {
  const token = await getAccessToken();
  const url = `${functionsBaseUrl()}/project-request-accept`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      project_request_id: projectRequestId,
      proposed_slot: input.proposed_slot,
      slot_expires_at: input.slot_expires_at,
      artist_message: input.artist_message ?? null,
    }),
  });
  const json = (await res.json()) as ProjectRequestActionResult & { error?: string };
  if (!res.ok) {
    return { error: json.error || `HTTP ${res.status}` };
  }
  return json;
}

/**
 * POST /api/projects/:id/reject — implémentation : Edge Function `project-request-reject`.
 */
export async function rejectProjectRequest(
  projectRequestId: string,
  options?: { artist_message?: string | null },
): Promise<ProjectRequestActionResult> {
  const token = await getAccessToken();
  const url = `${functionsBaseUrl()}/project-request-reject`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      project_request_id: projectRequestId,
      artist_message: options?.artist_message ?? null,
    }),
  });
  const json = (await res.json()) as ProjectRequestActionResult & { error?: string };
  if (!res.ok) {
    return { error: json.error || `HTTP ${res.status}` };
  }
  return json;
}
