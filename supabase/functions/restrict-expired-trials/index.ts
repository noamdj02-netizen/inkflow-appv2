/**
 * restrict-expired-trials
 *
 * Passe en 'restricted' les studios en trial dont trial_ends_at < now().
 * Appelée quotidiennement à minuit par un cron externe (cron-job.org, pg_net, etc.).
 * Utilise SUPABASE_SERVICE_ROLE_KEY pour contourner les RLS.
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.3";
import { getCorsHeaders } from "../_shared/cors.ts";
import { assertCronAuthorized } from "../_shared/cronGate.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const cronDeny = assertCronAuthorized(req, origin);
  if (cronDeny) return cronDeny;

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const now = new Date().toISOString();

    const { data: updated, error } = await supabase
      .from("inkflow_studios")
      .update({ subscription_status: "restricted" })
      .eq("subscription_status", "trialing")
      .lt("trial_ends_at", now)
      .select("id, studio_name, trial_ends_at");

    if (error) {
      console.error("restrict-expired-trials error:", error);
      return new Response(
        JSON.stringify({ success: false, error: error.message }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const count = updated?.length ?? 0;
    if (count > 0) {
      console.log(`restrict-expired-trials: ${count} studio(s) mis à jour en 'restricted'`, updated);
    }

    return new Response(
      JSON.stringify({
        success: true,
        updatedCount: count,
        studios: updated?.map((s) => ({ id: s.id, studio_name: s.studio_name, trial_ends_at: s.trial_ends_at })) ?? [],
      }),
      { headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (err) {
    console.error("restrict-expired-trials:", err);
    return new Response(
      JSON.stringify({ success: false, error: String(err) }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
