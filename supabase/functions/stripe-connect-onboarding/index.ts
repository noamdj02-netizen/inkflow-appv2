import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.3";
import { createSupabaseUserClient } from "../_shared/supabaseAuth.ts";
import { getCorsHeaders, corsResponse } from "../_shared/cors.ts";

const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY") || "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
/** URL de l’app (SPA), pas la landing marketing — sinon retour Stripe = page d’accueil au lieu du dashboard. */
const SITE_URL = (Deno.env.get("SITE_URL") || "https://app.ink-flow.me").replace(/\/+$/, "");
/** Pays du compte Express (ISO 2 lettres). */
const STRIPE_CONNECT_COUNTRY = (Deno.env.get("STRIPE_CONNECT_COUNTRY") || "FR").trim().toUpperCase();

function stripeForm(body: Record<string, string>): string {
  return new URLSearchParams(body).toString();
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
    const supabaseUser = createSupabaseUserClient(SUPABASE_URL, SUPABASE_ANON_KEY, jwt);
    const { data: userData, error: authErr } = await supabaseUser.auth.getUser();
    const user = userData?.user;
    if (authErr || !user?.id) {
      console.error("[stripe-connect-onboarding] getUser:", authErr?.message ?? "no user id");
      return new Response(JSON.stringify({ error: "Non authentifié" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    /** Le JWT OAuth peut omettre l’e-mail (Apple, etc.) alors qu’il est présent côté Auth — on complète via service role. */
    let emailNorm = user.email?.trim().toLowerCase() ?? "";
    if (!emailNorm) {
      const { data: fullUser, error: adminErr } = await supabase.auth.admin.getUserById(user.id);
      if (adminErr) {
        console.error("[stripe-connect-onboarding] admin.getUserById:", adminErr.message);
        return new Response(JSON.stringify({ error: "Non authentifié" }), {
          status: 401,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }
      emailNorm = fullUser.user?.email?.trim().toLowerCase() ?? "";
    }
    if (!emailNorm) {
      return new Response(
        JSON.stringify({
          error:
            "Aucune adresse e-mail sur ce compte : elle est nécessaire pour Stripe. Ajoute un e-mail dans ton profil ou reconnecte-toi.",
        }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } },
      );
    }

    const body = (await req.json().catch(() => ({}))) as { studioId?: string };
    const studioIdFromClient =
      typeof body.studioId === "string" && body.studioId.trim() ? body.studioId.trim() : undefined;

    const studioSelect =
      "id, email, studio_name, stripe_connect_account_id, stripe_connect_charges_enabled";

    /** Même résolution que le dashboard : RPC `get_studio_by_email_with_data` (lower(trim) sur l’e-mail). */
    let studio: {
      id: string;
      email: string;
      studio_name: string | null;
      stripe_connect_account_id: string | null;
      stripe_connect_charges_enabled: boolean | null;
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
        } else if (fullErr) {
          console.error("[stripe-connect-onboarding] load studio by id:", fullErr.message);
        }
      }
    } else if (rpcErr) {
      console.warn("[stripe-connect-onboarding] RPC get_studio_by_email_with_data:", rpcErr.message);
    }

    /** Secours si RPC absente / vide : égalité stricte sur e-mail déjà normalisé côté app. */
    if (!studio) {
      const { data: studioRows, error: studioErr } = await supabase
        .from("inkflow_studios")
        .select(studioSelect)
        .eq("email", emailNorm)
        .order("updated_at", { ascending: false })
        .limit(1);
      if (studioErr) {
        console.error("[stripe-connect-onboarding] studio fallback eq email:", studioErr.message);
      }
      studio = (studioRows?.[0] as typeof studio) ?? null;
    }

    if (!studio) {
      console.error("[stripe-connect-onboarding] aucun studio pour e-mail JWT:", emailNorm);
      return new Response(
        JSON.stringify({
          error:
            "Aucun studio enregistré pour cet e-mail. Recharge le dashboard (accueil) pour créer ton espace, puis réessaie.",
        }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } },
      );
    }

    const resolvedId = studio.id as string;

    if (studioIdFromClient && studioIdFromClient !== resolvedId) {
      console.warn(
        "[stripe-connect-onboarding] studioId client ≠ BDD, utilisation de l’id BDD",
        studioIdFromClient,
        resolvedId,
      );
    }

    if ((studio.email as string).trim().toLowerCase() !== emailNorm) {
      return new Response(JSON.stringify({ error: "Accès refusé à ce studio" }), {
        status: 403,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const returnUrl = `${SITE_URL}/dashboard?settings=payments&stripe_connect=return`;
    const refreshUrl = `${SITE_URL}/dashboard?settings=payments&stripe_connect=refresh`;

    let accountId = studio.stripe_connect_account_id as string | null;

    if (!accountId) {
      const createBody: Record<string, string> = {
        type: "express",
        country: STRIPE_CONNECT_COUNTRY,
        email: studio.email as string,
        "metadata[studio_id]": resolvedId,
        "capabilities[card_payments][requested]": "true",
        "capabilities[transfers][requested]": "true",
        "business_profile[name]": String(studio.studio_name || "Studio").slice(0, 100),
      };

      const accRes = await stripePost("accounts", createBody);
      const accText = await accRes.text();
      if (!accRes.ok) {
        console.error("[stripe-connect-onboarding] create account:", accRes.status, accText);
        return new Response(
          JSON.stringify({
            error: "Impossible de créer le compte Stripe. Vérifie que Stripe Connect est activé sur ton compte plateforme.",
            details: accText.slice(0, 400),
          }),
          { status: 502, headers: { "Content-Type": "application/json", ...corsHeaders } },
        );
      }
      const acc = JSON.parse(accText) as { id: string };
      accountId = acc.id;

      const { error: updErr } = await supabase
        .from("inkflow_studios")
        .update({
          stripe_connect_account_id: accountId,
          updated_at: new Date().toISOString(),
        })
        .eq("id", resolvedId);
      if (updErr) {
        console.error("[stripe-connect-onboarding] save account id:", updErr.message);
        return new Response(JSON.stringify({ error: "Erreur enregistrement compte" }), {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }
    }

    const linkType =
      studio.stripe_connect_charges_enabled === true ? "account_update" : "account_onboarding";

    const linkRes = await stripePost("account_links", {
      account: accountId!,
      refresh_url: refreshUrl,
      return_url: returnUrl,
      type: linkType,
    });
    const linkText = await linkRes.text();
    if (!linkRes.ok) {
      console.error("[stripe-connect-onboarding] account_links:", linkRes.status, linkText);
      return new Response(
        JSON.stringify({ error: "Impossible de générer le lien Stripe", details: linkText.slice(0, 400) }),
        { status: 502, headers: { "Content-Type": "application/json", ...corsHeaders } },
      );
    }
    const link = JSON.parse(linkText) as { url: string };

    return new Response(JSON.stringify({ url: link.url, accountId }), {
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[stripe-connect-onboarding]", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
