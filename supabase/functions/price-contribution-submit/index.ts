/**
 * Enregistre une contribution de prix (comparateur collaboratif) après vérification serveur :
 * - JWT tatoueur valide
 * - studio_id appartient à l’email
 * - inkflow_studio_finance_prefs.settings.share_prices_collaborative_opt_in === true
 *
 * POST JSON : { studioId, category_slug, label_normalized, price_cents, pack_size?, supplier_label? }
 */

import { createClient } from "npm:@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/cors.ts";
import { getGoTrueUser } from "../_shared/supabaseAuth.ts";

interface Body {
  studioId?: string;
  category_slug?: string;
  label_normalized?: string;
  price_cents?: number;
  pack_size?: number;
  supplier_label?: string | null;
}

Deno.serve(async (req: Request) => {
  const corsHeaders = getCorsHeaders(req.headers.get("origin"));
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  const auth = req.headers.get("Authorization") ?? "";
  const bearer = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";

  const user = await getGoTrueUser(supabaseUrl, anonKey, bearer);
  if (!user?.email) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let body: Body;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const studioId = typeof body.studioId === "string" ? body.studioId.trim() : "";
  const category_slug = typeof body.category_slug === "string" ? body.category_slug.trim().toLowerCase() : "";
  const label_normalized = typeof body.label_normalized === "string" ? body.label_normalized.trim() : "";
  const price_cents = typeof body.price_cents === "number" ? Math.round(body.price_cents) : NaN;
  const pack_size = typeof body.pack_size === "number" && body.pack_size >= 1 ? Math.round(body.pack_size) : 1;

  if (!studioId || !category_slug || !label_normalized || !Number.isFinite(price_cents) || price_cents < 0) {
    return new Response(JSON.stringify({ error: "Invalid payload" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const admin = createClient(supabaseUrl, serviceKey);
  const { data: studio, error: studioErr } = await admin
    .from("inkflow_studios")
    .select("id, email")
    .eq("id", studioId)
    .maybeSingle();

  if (studioErr || !studio?.email || studio.email.trim().toLowerCase() !== user.email.trim().toLowerCase()) {
    return new Response(JSON.stringify({ error: "Forbidden" }), {
      status: 403,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { data: prefRow, error: prefErr } = await admin
    .from("inkflow_studio_finance_prefs")
    .select("settings")
    .eq("studio_id", studioId)
    .maybeSingle();

  if (prefErr) {
    return new Response(JSON.stringify({ error: "Prefs read failed" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const settings = (prefRow?.settings ?? {}) as Record<string, unknown>;
  if (settings.share_prices_collaborative_opt_in !== true) {
    return new Response(JSON.stringify({ error: "Opt-in required" }), {
      status: 403,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { error: insErr } = await admin.from("inkflow_price_contributions").insert({
    studio_id: studioId,
    category_slug: category_slug.slice(0, 64),
    label_normalized: label_normalized.slice(0, 200),
    price_cents,
    pack_size,
    supplier_label: typeof body.supplier_label === "string" ? body.supplier_label.trim().slice(0, 120) : null,
  });

  if (insErr) {
    return new Response(JSON.stringify({ error: insErr.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
