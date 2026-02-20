import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.3";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  // Google sends POST notifications with specific headers
  const channelId = req.headers.get("x-goog-channel-id");
  const resourceState = req.headers.get("x-goog-resource-state");

  if (resourceState === "sync") {
    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (resourceState === "exists" && channelId) {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: integration } = await supabase
      .from("inkflow_calendar_integrations")
      .select("studio_id")
      .eq("channel_id", channelId)
      .eq("provider", "google")
      .single();

    if (integration) {
      // Trigger a pull sync by calling the sync function internally
      // For now, just update last_synced_at to indicate changes detected
      await supabase
        .from("inkflow_calendar_integrations")
        .update({ last_synced_at: new Date().toISOString() })
        .eq("studio_id", integration.studio_id)
        .eq("provider", "google");
    }
  }

  return new Response(JSON.stringify({ ok: true }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
