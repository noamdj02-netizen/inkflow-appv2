/**
 * Instagram — liste des médias du compte Business/Creator (Graph API)
 * pour alimenter une galerie / onglet Inspiration côté app client.
 *
 * ── Conformité & produit Meta (à valider juridiquement avant prod) ─────────
 * - L’OAuth studio existant (`instagram` edge function) fournit `page_access_token`
 *   et `ig_account_id`. Pour lire les médias, le token doit inclure les permissions
 *   adaptées (Instagram Graph API : selon version Meta, ex. accès Page + compte IG lié).
 * - App Review Meta peut être requis pour afficher du contenu Instagram hors des apps Meta.
 * - Ne pas exposer ce endpoint au navigateur : appeler uniquement depuis un backend
 *   avec la service role key, puis persister les URLs en BDD (cache) si besoin.
 * - Respecter les conditions d’utilisation Instagram, les mentions de source, et ne pas
 *   suggérer une affiliation officielle avec Meta.
 * - Prévoir consentement explicite du tatoueur pour republication des visuels.
 * - Rate limits : mettre en cache (table dédiée + cron) plutôt que frapper Graph à chaque visite client.
 *
 * POST JSON: { studioId: string }
 * Header: Authorization: Bearer <SUPABASE_SERVICE_ROLE_KEY>
 * Réponse: { items: Array<{ id, mediaType, mediaUrl, thumbnailUrl, caption, permalink, timestamp }> }
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization") || "";
    const bearer = authHeader.replace(/^Bearer\s+/i, "").trim();
    if (!SUPABASE_SERVICE_ROLE_KEY || bearer !== SUPABASE_SERVICE_ROLE_KEY) {
      return new Response(JSON.stringify({ error: "Service role requise (backend uniquement)" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const studioId = typeof body.studioId === "string" ? body.studioId : "";
    if (!studioId) {
      return new Response(JSON.stringify({ error: "studioId requis" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: conn, error: connErr } = await supabase
      .from("instagram_connections")
      .select("ig_account_id, page_access_token")
      .eq("studio_id", studioId)
      .maybeSingle();

    if (connErr || !conn?.ig_account_id || !conn?.page_access_token) {
      return new Response(JSON.stringify({ items: [], message: "Instagram non connecté pour ce studio" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const fields = "id,media_type,media_url,thumbnail_url,caption,permalink,timestamp";
    const graphUrl =
      `https://graph.facebook.com/v18.0/${conn.ig_account_id}/media?fields=${encodeURIComponent(fields)}&limit=30&access_token=${encodeURIComponent(conn.page_access_token)}`;

    const gr = await fetch(graphUrl);
    const data = await gr.json();

    if (data.error) {
      return new Response(
        JSON.stringify({
          error: data.error.message || "Erreur Graph API",
          code: data.error.code,
          items: [],
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const raw = (data.data || []) as Record<string, unknown>[];
    const items = raw.map((m) => ({
      id: m.id,
      mediaType: m.media_type,
      mediaUrl: m.media_url,
      thumbnailUrl: m.thumbnail_url,
      caption: typeof m.caption === "string" ? m.caption.slice(0, 500) : null,
      permalink: m.permalink,
      timestamp: m.timestamp,
    }));

    return new Response(JSON.stringify({ items }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : "Erreur serveur" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
