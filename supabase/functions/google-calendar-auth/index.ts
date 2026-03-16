import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.3";

const GOOGLE_CLIENT_ID = Deno.env.get("GOOGLE_CLIENT_ID") || "";
const GOOGLE_CLIENT_SECRET = Deno.env.get("GOOGLE_CLIENT_SECRET") || "";
const GOOGLE_REDIRECT_URI = Deno.env.get("GOOGLE_REDIRECT_URI") || "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const SITE_URL = (Deno.env.get("SITE_URL") || "https://ink-flow.me").replace(/\/+$/, "");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const { action, code, studioId } = await req.json();

    // ─── ACTION: initiate — generate Google OAuth URL ───
    if (action === "initiate") {
      if (!GOOGLE_CLIENT_ID) {
        return new Response(
          JSON.stringify({ error: "Google Calendar non configuré" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const params = new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        redirect_uri: GOOGLE_REDIRECT_URI,
        response_type: "code",
        scope: "https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events",
        access_type: "offline",
        prompt: "consent",
        state: studioId,
      });

      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;

      return new Response(
        JSON.stringify({ authUrl }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ─── ACTION: callback — exchange code for tokens ───
    if (action === "callback") {
      if (!code || !studioId) {
        return new Response(
          JSON.stringify({ error: "Code et studioId requis" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code,
          client_id: GOOGLE_CLIENT_ID,
          client_secret: GOOGLE_CLIENT_SECRET,
          redirect_uri: GOOGLE_REDIRECT_URI,
          grant_type: "authorization_code",
        }),
      });

      if (!tokenResponse.ok) {
        const err = await tokenResponse.text();
        return new Response(
          JSON.stringify({ error: "Échec de l'échange OAuth", details: err }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const tokens = await tokenResponse.json();
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

      const expiryMs = tokens.expiry_date || (Date.now() + (tokens.expires_in || 3600) * 1000);
      const parts = String(studioId).split("::");
      const email = parts[0] || studioId;
      const slug = parts[1] || "studio";
      const studioName = slug.replace(/-/g, " ");
      const displayName = email.split("@")[0] || "Artiste";

      const { error: dbError } = await supabase
        .from("inkflow_studios")
        .upsert(
          {
            id: studioId,
            email,
            name: displayName,
            studio_name: studioName,
            slug,
            google_access_token: tokens.access_token,
            google_refresh_token: tokens.refresh_token,
            google_token_expiry: expiryMs,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "id" }
        );

      if (dbError) {
        return new Response(
          JSON.stringify({ error: "Erreur sauvegarde tokens", details: dbError.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, redirectUrl: `${SITE_URL}/dashboard?connected=google` }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ─── ACTION: disconnect — remove tokens ───
    if (action === "disconnect") {
      if (!studioId) {
        return new Response(
          JSON.stringify({ error: "studioId requis pour la déconnexion" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

      const { data: studio } = await supabase
        .from("inkflow_studios")
        .select("google_access_token")
        .eq("id", studioId)
        .single();

      if (studio?.google_access_token) {
        await fetch(`https://oauth2.googleapis.com/revoke?token=${studio.google_access_token}`, {
          method: "POST",
        }).catch(() => {});
      }

      await supabase
        .from("inkflow_studios")
        .update({
          google_access_token: null,
          google_refresh_token: null,
          google_token_expiry: null,
          google_calendar_id: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", studioId);

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ─── ACTION: status — check if connected ───
    if (action === "status") {
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

      const { data } = await supabase
        .from("inkflow_studios")
        .select("google_refresh_token, google_calendar_id, updated_at")
        .eq("id", studioId)
        .single();

      const connected = !!(data?.google_refresh_token);

      return new Response(
        JSON.stringify({
          connected,
          integration: connected ? {
            provider: "google",
            google_calendar_id: data?.google_calendar_id,
            last_synced_at: data?.updated_at,
          } : null,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Action inconnue" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[google-calendar-auth] Erreur:", message);
    return new Response(
      JSON.stringify({ error: message || "Erreur interne" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
