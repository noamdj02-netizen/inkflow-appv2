import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getCorsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req.headers.get("origin"));
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Non autorisé" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authErr } = await anonClient.auth.getUser();
    if (authErr || !user?.email) {
      return new Response(
        JSON.stringify({ error: "Session invalide" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const clientEmail = user.email;
    const body = await req.json() as { flash_id?: unknown; studio_id?: unknown };
    const flash_id = typeof body.flash_id === "string" ? body.flash_id.trim() : "";
    const studio_id = typeof body.studio_id === "string" ? body.studio_id.trim() : "";

    if ((flash_id && studio_id) || (!flash_id && !studio_id)) {
      return new Response(
        JSON.stringify({ error: "Indiquez soit flash_id soit studio_id (un seul à la fois)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (flash_id) {
      if (req.method === "POST") {
        const { error: insertErr } = await supabase
          .from("inkflow_client_favorites")
          .upsert(
            { client_email: clientEmail, flash_id },
            { onConflict: "client_email,flash_id" }
          );

        if (insertErr) {
          console.error("Insert error:", insertErr);
          return new Response(
            JSON.stringify({ error: "Erreur lors de l'ajout aux favoris" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        return new Response(
          JSON.stringify({ success: true, action: "added", kind: "flash" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (req.method === "DELETE") {
        const { error: deleteErr } = await supabase
          .from("inkflow_client_favorites")
          .delete()
          .eq("client_email", clientEmail)
          .eq("flash_id", flash_id);

        if (deleteErr) {
          console.error("Delete error:", deleteErr);
          return new Response(
            JSON.stringify({ error: "Erreur lors de la suppression" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        return new Response(
          JSON.stringify({ success: true, action: "removed", kind: "flash" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    if (studio_id) {
      if (req.method === "POST") {
        const { error: insertErr } = await supabase
          .from("inkflow_client_studio_favorites")
          .upsert(
            { client_email: clientEmail, studio_id },
            { onConflict: "client_email,studio_id" }
          );

        if (insertErr) {
          console.error("Insert studio fav error:", insertErr);
          return new Response(
            JSON.stringify({ error: "Erreur lors de l'ajout du studio aux favoris" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        return new Response(
          JSON.stringify({ success: true, action: "added", kind: "studio" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (req.method === "DELETE") {
        const { error: deleteErr } = await supabase
          .from("inkflow_client_studio_favorites")
          .delete()
          .eq("client_email", clientEmail)
          .eq("studio_id", studio_id);

        if (deleteErr) {
          console.error("Delete studio fav error:", deleteErr);
          return new Response(
            JSON.stringify({ error: "Erreur lors de la suppression du favori studio" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        return new Response(
          JSON.stringify({ success: true, action: "removed", kind: "studio" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    return new Response(
      JSON.stringify({ error: "Méthode non supportée" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(
      JSON.stringify({ error: "Erreur serveur" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
