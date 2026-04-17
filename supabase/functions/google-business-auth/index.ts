/**
 * Google Business Profile OAuth 2.0
 *
 * Actions (POST JSON) :
 * - initiate    : { action, studioId } — génère l'URL d'autorisation Google
 * - callback    : { action, code, studioId } — échange le code, stocke tokens + location
 * - disconnect  : { action, studioId } — révoque et supprime les tokens
 * - status      : { action, studioId } — vérifie si connecté
 * - locations   : { action, studioId } — liste les fiches disponibles
 * - save_location : { action, studioId, locationName } — choisit une fiche
 *
 * Prérequis Google Cloud :
 *   - API activée : « Google Business Profile API »
 *   - Scope OAuth : https://www.googleapis.com/auth/business.manage
 *   - URI de redirection enregistrée : GOOGLE_BUSINESS_REDIRECT_URI
 */
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.3";
import { getCorsHeaders } from "../_shared/cors.ts";

const GOOGLE_CLIENT_ID          = Deno.env.get("GOOGLE_CLIENT_ID") || "";
const GOOGLE_CLIENT_SECRET      = Deno.env.get("GOOGLE_CLIENT_SECRET") || "";
const GOOGLE_BUSINESS_REDIRECT_URI = Deno.env.get("GOOGLE_BUSINESS_REDIRECT_URI") || "";
const SUPABASE_URL              = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const SITE_URL = (Deno.env.get("SITE_URL") || "https://ink-flow.me").replace(/\/+$/, "");

const SCOPE = "https://www.googleapis.com/auth/business.manage";

const ACCOUNTS_API   = "https://mybusinessaccountmanagement.googleapis.com/v1/accounts";
const LOCATIONS_API  = "https://mybusinessbusinessinformation.googleapis.com/v1";
const REVIEWS_BASE   = "https://mybusiness.googleapis.com/v4";

/** Rafraîchit l'access token si expiré ; retourne le token valide. */
async function getValidAccessToken(
  supabase: ReturnType<typeof createClient>,
  studioId: string,
  accessToken: string,
  refreshToken: string,
  tokenExpiry: number | null
): Promise<string> {
  if (tokenExpiry && Date.now() < tokenExpiry - 60_000) {
    return accessToken;
  }

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!res.ok) {
    throw new Error(`Refresh token invalide: ${res.status}`);
  }

  const tokens = await res.json() as { access_token?: string; expires_in?: number };
  const newToken = tokens.access_token || "";
  const newExpiry = Date.now() + (tokens.expires_in || 3600) * 1000;

  await supabase
    .from("inkflow_studios")
    .update({
      google_business_access_token: newToken,
      google_business_token_expiry: newExpiry,
      updated_at: new Date().toISOString(),
    })
    .eq("id", studioId);

  return newToken;
}

/** Récupère les fiches (locations) d'un compte Google Business. */
async function fetchLocations(accountName: string, accessToken: string) {
  const url = `${LOCATIONS_API}/${accountName}/locations?readMask=name,title,storefrontAddress`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Locations API: ${res.status} ${err.slice(0, 200)}`);
  }
  const body = await res.json() as {
    locations?: { name?: string; title?: string }[];
  };
  return Array.isArray(body.locations) ? body.locations : [];
}

Deno.serve(async (req: Request) => {
  const corsHeaders = getCorsHeaders(req.headers.get("origin"));
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  // ─── GET : callback OAuth Google (redirect depuis Google) ──────────────────
  if (req.method === "GET") {
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const studioId = url.searchParams.get("state");
    const error = url.searchParams.get("error");

    if (error) {
      return Response.redirect(`${SITE_URL}/dashboard?error=google-business-denied`, 302);
    }
    if (!code || !studioId) {
      return Response.redirect(`${SITE_URL}/dashboard?error=google-business-invalid`, 302);
    }

    try {
      const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code,
          client_id: GOOGLE_CLIENT_ID,
          client_secret: GOOGLE_CLIENT_SECRET,
          redirect_uri: GOOGLE_BUSINESS_REDIRECT_URI,
          grant_type: "authorization_code",
        }),
      });

      if (!tokenRes.ok) {
        console.error("[google-business-auth] token exchange:", await tokenRes.text());
        return Response.redirect(`${SITE_URL}/dashboard?error=google-business-token`, 302);
      }

      const tokens = await tokenRes.json() as {
        access_token?: string;
        refresh_token?: string;
        expires_in?: number;
      };

      const accessToken  = tokens.access_token || "";
      const refreshToken = tokens.refresh_token || "";
      const expiry = Date.now() + (tokens.expires_in || 3600) * 1000;

      let autoLocationName: string | null = null;
      try {
        const accountsRes = await fetch(ACCOUNTS_API, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (accountsRes.ok) {
          const accountsBody = await accountsRes.json() as { accounts?: { name?: string }[] };
          const firstAccount = accountsBody.accounts?.[0]?.name;
          if (firstAccount) {
            const locs = await fetchLocations(firstAccount, accessToken);
            if (locs.length === 1) autoLocationName = locs[0].name ?? null;
          }
        }
      } catch (e) {
        console.warn("[google-business-auth] auto-discover location:", e);
      }

      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      await supabase.from("inkflow_studios").update({
        google_business_access_token:  accessToken,
        google_business_refresh_token: refreshToken,
        google_business_token_expiry:  expiry,
        google_business_location_name: autoLocationName,
        updated_at: new Date().toISOString(),
      }).eq("id", studioId);

      return Response.redirect(`${SITE_URL}/dashboard?connected=google-business`, 302);
    } catch (err) {
      console.error("[google-business-auth] GET callback error:", err);
      return Response.redirect(`${SITE_URL}/dashboard?error=google-business-server`, 302);
    }
  }

  try {
    const { action, code, studioId, locationName, force } = await req.json() as {
      action?: string;
      code?: string;
      studioId?: string;
      locationName?: string;
      force?: boolean;
    };

    // ─── initiate ──────────────────────────────────────────────────────────────
    if (action === "initiate") {
      if (!GOOGLE_CLIENT_ID || !GOOGLE_BUSINESS_REDIRECT_URI) {
        return json({ error: "Google Business non configuré (GOOGLE_CLIENT_ID ou GOOGLE_BUSINESS_REDIRECT_URI manquant)" }, 500);
      }
      if (!studioId) {
        return json({ error: "studioId requis" }, 400);
      }

      const params = new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        redirect_uri: GOOGLE_BUSINESS_REDIRECT_URI,
        response_type: "code",
        scope: SCOPE,
        access_type: "offline",
        prompt: "consent",
        state: studioId,
      });

      return json({ authUrl: `https://accounts.google.com/o/oauth2/v2/auth?${params}` });
    }

    // ─── callback ──────────────────────────────────────────────────────────────
    if (action === "callback") {
      if (!code || !studioId) {
        return json({ error: "code et studioId requis" }, 400);
      }

      const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code,
          client_id: GOOGLE_CLIENT_ID,
          client_secret: GOOGLE_CLIENT_SECRET,
          redirect_uri: GOOGLE_BUSINESS_REDIRECT_URI,
          grant_type: "authorization_code",
        }),
      });

      if (!tokenRes.ok) {
        const err = await tokenRes.text();
        return json({ error: "Échec OAuth", details: err }, 400);
      }

      const tokens = await tokenRes.json() as {
        access_token?: string;
        refresh_token?: string;
        expires_in?: number;
      };

      const accessToken  = tokens.access_token || "";
      const refreshToken = tokens.refresh_token || "";
      const expiry = Date.now() + (tokens.expires_in || 3600) * 1000;

      // Découverte automatique du premier compte + première fiche
      let autoLocationName: string | null = null;
      try {
        const accountsRes = await fetch(ACCOUNTS_API, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (accountsRes.ok) {
          const accountsBody = await accountsRes.json() as {
            accounts?: { name?: string }[];
          };
          const firstAccount = accountsBody.accounts?.[0]?.name;
          if (firstAccount) {
            const locs = await fetchLocations(firstAccount, accessToken);
            if (locs.length === 1) {
              autoLocationName = locs[0].name ?? null;
            }
            // Si plusieurs fiches → on laisse null, l'utilisateur choisit via "locations"
          }
        }
      } catch (e) {
        console.warn("[google-business-auth] auto-discover location:", e);
      }

      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      const { error: dbErr } = await supabase
        .from("inkflow_studios")
        .update({
          google_business_access_token:  accessToken,
          google_business_refresh_token: refreshToken,
          google_business_token_expiry:  expiry,
          google_business_location_name: autoLocationName,
          updated_at: new Date().toISOString(),
        })
        .eq("id", studioId);

      if (dbErr) {
        return json({ error: "Erreur sauvegarde tokens", details: dbErr.message }, 500);
      }

      return json({
        success: true,
        locationAutoSelected: autoLocationName !== null,
        redirectUrl: `${SITE_URL}/dashboard?connected=google-business`,
      });
    }

    // ─── locations ─────────────────────────────────────────────────────────────
    if (action === "locations") {
      if (!studioId) return json({ error: "studioId requis" }, 400);

      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      const { data: row } = await supabase
        .from("inkflow_studios")
        .select("google_business_access_token, google_business_refresh_token, google_business_token_expiry, google_business_locations_cache, google_business_locations_cached_at, google_business_location_name")
        .eq("id", studioId)
        .single();

      if (!row?.google_business_refresh_token) {
        return json({ error: "Non connecté" }, 401);
      }

      // ── Cache : si on a déjà fetché récemment, on renvoie la cache
      // (évite le quota Google de 1 req/min sur My Business Account Management API).
      // Force refresh via body.force === true.
      const cached = row.google_business_locations_cache as { name: string; title: string; accountName: string }[] | null;
      if (!force && Array.isArray(cached) && cached.length > 0) {
        return json({ locations: cached, accountsCount: cached.length, cached: true });
      }

      const token = await getValidAccessToken(
        supabase,
        studioId,
        row.google_business_access_token || "",
        row.google_business_refresh_token,
        row.google_business_token_expiry ?? null
      );

      const accountsRes = await fetch(ACCOUNTS_API, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!accountsRes.ok) {
        const body = await accountsRes.text();
        console.error("[google-business-auth] Accounts API error:", accountsRes.status, body.slice(0, 500));
        return json({ error: `Accounts API: ${accountsRes.status}`, detail: body.slice(0, 500) }, 502);
      }

      const accountsBody = await accountsRes.json() as {
        accounts?: { name?: string; accountName?: string }[];
      };
      console.log("[google-business-auth] accounts count:", (accountsBody.accounts || []).length);

      const allLocations: { name: string; title: string; accountName: string }[] = [];
      const locationErrors: string[] = [];
      for (const account of accountsBody.accounts || []) {
        if (!account.name) continue;
        try {
          const locs = await fetchLocations(account.name, token);
          console.log("[google-business-auth] account", account.name, "locations:", locs.length);
          for (const loc of locs) {
            if (loc.name) {
              allLocations.push({
                name: loc.name,
                title: (loc as { title?: string }).title || loc.name,
                accountName: account.accountName || account.name,
              });
            }
          }
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          console.warn("[google-business-auth] fetchLocations failed for", account.name, msg);
          locationErrors.push(`${account.name}: ${msg}`);
        }
      }

      // Cache la liste pour éviter le quota 1/min aux prochaines ouvertures.
      // Auto-sélection si 1 seule fiche et pas encore choisie (évite à l'user de cliquer).
      const patch: Record<string, unknown> = {
        google_business_locations_cache: allLocations,
        google_business_locations_cached_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      if (allLocations.length === 1 && !row.google_business_location_name) {
        patch.google_business_location_name = allLocations[0].name;
      }
      await supabase.from("inkflow_studios").update(patch).eq("id", studioId);

      return json({
        locations: allLocations,
        accountsCount: (accountsBody.accounts || []).length,
        errors: locationErrors,
        autoSelected: allLocations.length === 1 ? allLocations[0].name : null,
      });
    }

    // ─── save_location ─────────────────────────────────────────────────────────
    if (action === "save_location") {
      if (!studioId || !locationName) {
        return json({ error: "studioId et locationName requis" }, 400);
      }
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      await supabase
        .from("inkflow_studios")
        .update({ google_business_location_name: locationName, updated_at: new Date().toISOString() })
        .eq("id", studioId);
      return json({ success: true });
    }

    // ─── disconnect ────────────────────────────────────────────────────────────
    if (action === "disconnect") {
      if (!studioId) return json({ error: "studioId requis" }, 400);

      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      const { data: row } = await supabase
        .from("inkflow_studios")
        .select("google_business_access_token")
        .eq("id", studioId)
        .single();

      if (row?.google_business_access_token) {
        await fetch(`https://oauth2.googleapis.com/revoke?token=${row.google_business_access_token}`, {
          method: "POST",
        }).catch(() => {});
      }

      await supabase
        .from("inkflow_studios")
        .update({
          google_business_access_token:  null,
          google_business_refresh_token: null,
          google_business_token_expiry:  null,
          google_business_location_name: null,
          google_business_locations_cache: null,
          google_business_locations_cached_at: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", studioId);

      return json({ success: true });
    }

    // ─── status ────────────────────────────────────────────────────────────────
    if (action === "status") {
      if (!studioId) return json({ error: "studioId requis" }, 400);

      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      const { data } = await supabase
        .from("inkflow_studios")
        .select("google_business_refresh_token, google_business_location_name, updated_at")
        .eq("id", studioId)
        .single();

      const connected = !!(data?.google_business_refresh_token);
      return json({
        connected,
        locationName: connected ? (data?.google_business_location_name ?? null) : null,
        needsLocationSelection: connected && !data?.google_business_location_name,
      });
    }

    return json({ error: "Action inconnue" }, 400);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[google-business-auth]", msg);
    return json({ error: msg || "Erreur interne" }, 500);
  }
});
