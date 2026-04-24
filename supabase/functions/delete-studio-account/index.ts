import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.3";
import { getCorsHeaders, corsResponse } from "../_shared/cors.ts";
import { getGoTrueUser } from "../_shared/supabaseAuth.ts";
import { allowRateLimit, clientIpFromRequest } from "../_shared/rateLimit.ts";
import { resolveStudioRowForUser } from "../_shared/resolveStudioForJwt.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY") || "";

const BUCKET = "inkflow-assets";
const RATE_MAX = 3;
const RATE_WINDOW_MS = 60 * 60_000;

async function removeStudioStorage(
  supabase: ReturnType<typeof createClient>,
  studioId: string,
  slug: string,
): Promise<void> {
  const toRemove: string[] = [];
  toRemove.push(`avatars/${studioId}.jpg`);
  const safeSlug = (slug && /^[a-z0-9-]+$/.test(slug) ? slug : studioId.split("::").pop() || "studio")
    .toLowerCase();
  const folder = `portfolio/${safeSlug}`;

  const { data: portFiles, error: listErr } = await supabase.storage.from(BUCKET).list(folder, { limit: 1000 });
  if (!listErr && portFiles?.length) {
    for (const f of portFiles) {
      toRemove.push(`${folder}/${f.name}`);
    }
  }

  const { data: brFiles, error: brListErr } = await supabase.storage.from(BUCKET).list("booking-refs", {
    limit: 1000,
  });
  if (!brListErr && brFiles?.length) {
    const key = studioId.replace(/[:\s]/g, "_");
    const key2 = studioId;
    for (const f of brFiles) {
      if (f.name.includes(key) || f.name.includes(key2)) {
        toRemove.push(`booking-refs/${f.name}`);
      }
    }
  }

  const unique = [...new Set(toRemove)];
  if (unique.length) {
    const { error: rmErr } = await supabase.storage.from(BUCKET).remove(unique);
    if (rmErr) {
      console.warn("[delete-studio-account] storage remove:", rmErr.message);
    }
  }
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

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
    return new Response(JSON.stringify({ error: "Configuration serveur incomplète" }), {
      status: 503,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  const authHeader = req.headers.get("Authorization") ?? "";
  const m = authHeader.match(/^Bearer\s+(.+)$/i);
  const jwt = m?.[1]?.trim();
  if (!jwt) {
    return new Response(JSON.stringify({ error: "Non authentifié" }), {
      status: 401,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  const ip = clientIpFromRequest(req);
  if (!allowRateLimit(`delete-account:${ip}`, RATE_MAX, RATE_WINDOW_MS)) {
    return new Response(
      JSON.stringify({ error: "Trop de tentatives. Réessayez plus tard ou contactez support@ink-flow.me." }),
      { status: 429, headers: { "Content-Type": "application/json", ...corsHeaders } },
    );
  }

  const user = await getGoTrueUser(SUPABASE_URL, SUPABASE_ANON_KEY, jwt);
  if (!user?.id) {
    return new Response(JSON.stringify({ error: "Non authentifié" }), {
      status: 401,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  const body = (await req.json().catch(() => ({}))) as {
    studioId?: string;
    confirmEmail?: string;
  };
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const emailNorm = user.email?.trim().toLowerCase() ?? "";
  if (!emailNorm) {
    return new Response(JSON.stringify({ error: "E-mail requis" }), {
      status: 400,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  const resolved = await resolveStudioRowForUser(
    supabase,
    { id: user.id, email: user.email },
    body.studioId?.trim() || null,
  );
  if (!resolved) {
    return new Response(JSON.stringify({ error: "Studio introuvable" }), {
      status: 404,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
  if (!resolved.isOwner) {
    return new Response(
      JSON.stringify({
        error:
          "Seul le compte titulaire du studio peut demander sa suppression. Les comptes invités doivent être retirés par l’équipe (ou contact support).",
      }),
      { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } },
    );
  }

  const confirm = (body.confirmEmail || "").trim().toLowerCase();
  if (confirm !== emailNorm) {
    return new Response(
      JSON.stringify({ error: "Saisis ton email exactement pour confirmer la suppression définitive." }),
      { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } },
    );
  }

  const studioId = resolved.studio.id;
  const slug = resolved.studio.slug || "studio";
  const connectId = (resolved.studio.stripe_connect_account_id as string | null | undefined)?.trim() || null;

  await removeStudioStorage(supabase, studioId, slug);

  if (STRIPE_SECRET_KEY && connectId) {
    try {
      const del = await fetch(`https://api.stripe.com/v1/accounts/${encodeURIComponent(connectId)}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${STRIPE_SECRET_KEY}` },
      });
      if (!del.ok) {
        const t = await del.text();
        console.warn("[delete-studio-account] stripe delete connect:", del.status, t.slice(0, 200));
      }
    } catch (e) {
      console.warn("[delete-studio-account] stripe:", e);
    }
  }

  const { error: delSt } = await supabase.from("inkflow_studios").delete().eq("id", studioId);
  if (delSt) {
    console.error("[delete-studio-account] delete studio:", delSt.message);
    return new Response(JSON.stringify({ error: "Suppression BDD incomplète. Contacte le support." }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  const { error: delUserErr } = await supabase.auth.admin.deleteUser(user.id);
  if (delUserErr) {
    console.error("[delete-studio-account] delete user:", delUserErr.message);
    return new Response(
      JSON.stringify({
        error:
          "Données studio supprimées, mais le compte auth n’a pas pu être supprimé automatiquement. Contacte le support (contact@ink-flow.me) avec l’e-mail de ce compte.",
        partial: true,
      }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } },
    );
  }

  return new Response(
    JSON.stringify({
      ok: true,
      message:
        "Compte supprimé. Les données applicatives enregistrées chez le tatoueur sont effacées. Des traces peuvent demeurer chez le prestataire de paiement (obligations légales) ou en sauvegardes froides. Déconnecte-toi côté navigateur.",
    }),
    { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } },
  );
});
