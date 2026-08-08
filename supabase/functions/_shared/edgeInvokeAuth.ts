/**
 * Auth renforcée pour les Edge Functions appelées depuis le dashboard (JWT tatoueur)
 * ou depuis l’infra (header X-Inkflow-Secret = INTERNAL_FUNCTION_SECRET).
 * + rate-limit mémoire par IP (meilleur que rien ; pour une prod à charge, prévoir Upstash).
 */
import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.95.3";
import { getCorsHeaders } from "./cors.ts";

const bucket = new Map<string, number[]>();

export function rateLimitByIp(req: Request, routeKey: string, maxPerMinute: number): boolean {
  const raw = req.headers.get("x-forwarded-for") || req.headers.get("cf-connecting-ip") || "";
  const ip = raw.split(",")[0]?.trim() || "unknown";
  const key = `${routeKey}:${ip}`;
  const now = Date.now();
  const windowMs = 60_000;
  const arr = (bucket.get(key) || []).filter((t) => now - t < windowMs);
  if (arr.length >= maxPerMinute) return false;
  arr.push(now);
  bucket.set(key, arr);
  return true;
}

export function internalFunctionSecretOk(req: Request): boolean {
  const secret = (Deno.env.get("INTERNAL_FUNCTION_SECRET") || "").trim();
  if (secret.length < 12) return false;
  const h = (req.headers.get("X-Inkflow-Secret") || "").trim();
  return h === secret;
}

/** Garde fail-closed pour webhooks DB / pg_net — 503 si secret absent, 403 si header invalide. */
export function assertInternalFunctionAuthorized(
  req: Request,
  origin: string | null,
): Response | null {
  const secret = (Deno.env.get("INTERNAL_FUNCTION_SECRET") || "").trim();
  const corsHeaders = getCorsHeaders(origin);

  if (secret.length < 12) {
    return new Response(JSON.stringify({ error: "Internal function secret not configured" }), {
      status: 503,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  if (internalFunctionSecretOk(req)) return null;

  return new Response(JSON.stringify({ error: "Unauthorized" }), {
    status: 403,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

/** Appels serveur à serveur (ex. webhook Stripe) : secret interne OU Authorization Bearer service_role. */
export function isServiceRoleOrInternalSecret(req: Request, serviceRoleKey: string): boolean {
  if (internalFunctionSecretOk(req)) return true;
  const sr = (serviceRoleKey || "").trim();
  if (!sr) return false;
  const auth = (req.headers.get("Authorization") || "").trim();
  return auth === `Bearer ${sr}`;
}

export async function verifyProjectRequestNotificationPayload(
  admin: SupabaseClient,
  projectRequestId: string,
  studioId: string,
  clientEmail: string,
  clientName: string,
  description: string,
): Promise<boolean> {
  const id = projectRequestId?.trim();
  if (!id) return false;
  const { data, error } = await admin
    .from("inkflow_project_requests")
    .select("id, studio_id, client_email, client_name, description")
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return false;
  if (data.studio_id !== studioId) return false;
  if (String(data.client_email || "").trim().toLowerCase() !== clientEmail.trim().toLowerCase()) {
    return false;
  }
  if (String(data.client_name || "").trim() !== clientName.trim()) return false;
  if (String(data.description || "").trim() !== description.trim()) return false;
  return true;
}

export async function verifyMessageNotificationPayload(
  admin: SupabaseClient,
  payload: { type: string; threadId: string; messagePreview: string; studioId?: string },
): Promise<boolean> {
  const preview = payload.messagePreview.trim();
  if (!preview || !payload.threadId?.trim()) return false;
  const { data, error } = await admin
    .from("inkflow_messages")
    .select("content, sender_type, studio_id")
    .eq("thread_id", payload.threadId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error || !data) return false;
  if (String(data.content || "").trim() !== preview) return false;
  if (payload.type === "to_client") {
    return data.sender_type === "artist";
  }
  if (payload.type === "to_studio") {
    const sid = payload.studioId?.trim();
    if (!sid) return false;
    return data.sender_type === "client" && data.studio_id === sid;
  }
  return false;
}

export async function verifyTattooerOwnsStudio(
  req: Request,
  studioId: string | undefined,
  supabaseUrl: string,
  anonKey: string,
  serviceRoleKey: string
): Promise<boolean> {
  if (internalFunctionSecretOk(req)) return true;
  const sid = studioId?.trim();
  if (!sid) return false;
  const auth = req.headers.get("Authorization") || "";
  const jwt = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  if (!jwt || !serviceRoleKey) return false;

  const userClient = createClient(supabaseUrl, anonKey);
  const { data: { user }, error } = await userClient.auth.getUser(jwt);
  if (error || !user?.email) return false;

  const admin = createClient(supabaseUrl, serviceRoleKey);
  const email = user.email.trim().toLowerCase();
  const { data: row } = await admin
    .from("inkflow_studios")
    .select("id")
    .eq("id", sid)
    .eq("email", email)
    .maybeSingle();
  return !!row?.id;
}

export async function verifyBookingNotifyPayload(
  admin: SupabaseClient,
  payload: {
    bookingId: string;
    studioId: string;
    clientName: string;
    clientEmail: string;
  }
): Promise<boolean> {
  const { data, error } = await admin
    .from("inkflow_bookings")
    .select("id, studio_id, client_email, client_name")
    .eq("id", payload.bookingId)
    .maybeSingle();
  if (error || !data) return false;
  if (data.studio_id !== payload.studioId) return false;
  if (String(data.client_email || "").trim().toLowerCase() !== payload.clientEmail.trim().toLowerCase()) {
    return false;
  }
  if (String(data.client_name || "").trim() !== payload.clientName.trim()) return false;
  return true;
}
