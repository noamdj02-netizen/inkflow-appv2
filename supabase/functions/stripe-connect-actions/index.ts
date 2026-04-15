/**
 * Actions Stripe Connect après onboarding : sync statut, lien Express Dashboard, déliaison.
 * Même auth / résolution studio que stripe-connect-onboarding.
 */
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.3";
import { getCorsHeaders, corsResponse } from "../_shared/cors.ts";

const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY") || "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

function stripeForm(body: Record<string, string>): string {
  return new URLSearchParams(body).toString();
}

async function stripeGet(path: string): Promise<Response> {
  return await fetch(`https://api.stripe.com/v1/${path}`, {
    headers: { Authorization: `Bearer ${STRIPE_SECRET_KEY}` },
  });
}

async function stripePost(path: string, body: Record<string, string>): Promise<Response> {
  return await fetch(`https://api.stripe.com/v1/${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: stripeForm(body),
  });
}

type Action = "sync" | "express_login" | "disconnect";

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === "OPTIONS") {
    return corsResponse(origin);
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  if (!STRIPE_SECRET_KEY || !SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
    return new Response(JSON.stringify({ error: "Configuration serveur incomplète" }), {
      status: 503,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const m = authHeader.match(/^Bearer\s+(.+)$/i);
    const jwt = m?.[1]?.trim();
    if (!jwt) {
      return new Response(JSON.stringify({ error: "Non authentifié" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const supabaseUser = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const { data: userData, error: authErr } = await supabaseUser.auth.getUser(jwt);
    const user = userData?.user;
    if (authErr || !user?.id) {
      return new Response(JSON.stringify({ error: "Non authentifié" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    let emailNorm = user.email?.trim().toLowerCase() ?? "";
    if (!emailNorm) {
      const { data: fullUser, error: adminErr } = await supabase.auth.admin.getUserById(user.id);
      if (adminErr) {
        return new Response(JSON.stringify({ error: "Non authentifié" }), {
          status: 401,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }
      emailNorm = fullUser.user?.email?.trim().toLowerCase() ?? "";
    }
    if (!emailNorm) {
      return new Response(JSON.stringify({ error: "E-mail requis" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const body = (await req.json().catch(() => ({}))) as { action?: string; studioId?: string };
    const action = (body.action || "").trim() as Action;
    if (!["sync", "express_login", "disconnect"].includes(action)) {
      return new Response(JSON.stringify({ error: "action invalide (sync | express_login | disconnect)" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const studioSelect =
      "id, email, studio_name, stripe_connect_account_id, stripe_connect_charges_enabled, stripe_connect_details_submitted";

    let studio: {
      id: string;
      email: string;
      stripe_connect_account_id: string | null;
      stripe_connect_charges_enabled: boolean | null;
      stripe_connect_details_submitted: boolean | null;
    } | null = null;

    const { data: rpcData, error: rpcErr } = await supabase.rpc("get_studio_by_email_with_data", {
      p_email: emailNorm,
    });
    if (!rpcErr && rpcData != null) {
      const rpcRow = Array.isArray(rpcData) ? rpcData[0] : rpcData;
      const rid = (rpcRow as { id?: string } | null)?.id;
      if (rid) {
        const { data: full, error: fullErr } = await supabase
          .from("inkflow_studios")
          .select(studioSelect)
          .eq("id", rid)
          .maybeSingle();
        if (!fullErr && full) {
          studio = full as typeof studio;
        }
      }
    }

    if (!studio) {
      const { data: studioRows, error: studioErr } = await supabase
        .from("inkflow_studios")
        .select(studioSelect)
        .eq("email", emailNorm)
        .order("updated_at", { ascending: false })
        .limit(1);
      if (!studioErr && studioRows?.[0]) {
        studio = studioRows[0] as typeof studio;
      }
    }

    if (!studio) {
      return new Response(JSON.stringify({ error: "Studio introuvable" }), {
        status: 404,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const studioIdFromClient =
      typeof body.studioId === "string" && body.studioId.trim() ? body.studioId.trim() : undefined;
    if (studioIdFromClient && studioIdFromClient !== studio.id) {
      console.warn("[stripe-connect-actions] studioId client ≠ BDD", studioIdFromClient, studio.id);
    }

    if ((studio.email as string).trim().toLowerCase() !== emailNorm) {
      return new Response(JSON.stringify({ error: "Accès refusé à ce studio" }), {
        status: 403,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const accountId = (studio.stripe_connect_account_id as string | null)?.trim() || null;

    if (action === "disconnect") {
      const { error: updErr } = await supabase
        .from("inkflow_studios")
        .update({
          stripe_connect_account_id: null,
          stripe_connect_charges_enabled: false,
          stripe_connect_details_submitted: false,
          updated_at: new Date().toISOString(),
        })
        .eq("id", studio.id);
      if (updErr) {
        console.error("[stripe-connect-actions] disconnect:", updErr.message);
        return new Response(JSON.stringify({ error: updErr.message }), {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }
      return new Response(JSON.stringify({ ok: true, disconnected: true }), {
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    if (!accountId) {
      return new Response(
        JSON.stringify({ error: "Aucun compte Stripe Connect lié. Utilise « Connecter mon compte Stripe »." }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } },
      );
    }

    if (action === "express_login") {
      const linkRes = await stripePost(`accounts/${encodeURIComponent(accountId)}/login_links`, {});
      const linkText = await linkRes.text();
      if (!linkRes.ok) {
        console.error("[stripe-connect-actions] login_links:", linkRes.status, linkText);
        return new Response(
          JSON.stringify({
            error: "Impossible d’ouvrir le tableau de bord Stripe Express",
            details: linkText.slice(0, 300),
          }),
          { status: 502, headers: { "Content-Type": "application/json", ...corsHeaders } },
        );
      }
      const link = JSON.parse(linkText) as { url?: string };
      if (!link.url) {
        return new Response(JSON.stringify({ error: "Réponse Stripe inattendue" }), {
          status: 502,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }
      return new Response(JSON.stringify({ url: link.url }), {
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // sync
    const accRes = await stripeGet(`accounts/${encodeURIComponent(accountId)}`);
    const accText = await accRes.text();
    if (!accRes.ok) {
      console.error("[stripe-connect-actions] retrieve account:", accRes.status, accText);
      return new Response(
        JSON.stringify({ error: "Impossible de lire le compte Stripe", details: accText.slice(0, 200) }),
        { status: 502, headers: { "Content-Type": "application/json", ...corsHeaders } },
      );
    }
    const acc = JSON.parse(accText) as {
      charges_enabled?: boolean;
      details_submitted?: boolean;
    };

    const chargesEnabled = acc.charges_enabled === true;
    const detailsSubmitted = acc.details_submitted === true;

    const { error: updErr } = await supabase
      .from("inkflow_studios")
      .update({
        stripe_connect_charges_enabled: chargesEnabled,
        stripe_connect_details_submitted: detailsSubmitted,
        updated_at: new Date().toISOString(),
      })
      .eq("id", studio.id);

    if (updErr) {
      console.error("[stripe-connect-actions] sync update:", updErr.message);
      return new Response(JSON.stringify({ error: updErr.message }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    return new Response(
      JSON.stringify({
        ok: true,
        stripe_connect_charges_enabled: chargesEnabled,
        stripe_connect_details_submitted: detailsSubmitted,
      }),
      { headers: { "Content-Type": "application/json", ...corsHeaders } },
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[stripe-connect-actions]", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
