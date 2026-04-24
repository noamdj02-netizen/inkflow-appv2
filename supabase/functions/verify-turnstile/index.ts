/**
 * Vérifie un jeton Cloudflare Turnstile (secret côté serveur).
 * Appel public : la protection repose sur le secret TURNSTILE_SECRET_KEY.
 */
import { getCorsHeaders, corsResponse } from "../_shared/cors.ts";

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("origin");
  const cors = getCorsHeaders(origin);

  if (req.method === "OPTIONS") {
    return corsResponse(origin);
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json", ...cors },
    });
  }

  const secret = (Deno.env.get("TURNSTILE_SECRET_KEY") || "").trim();
  if (!secret) {
    // Pas de captcha côté serveur : n’impose rien (dev ou oubli de secret).
    return new Response(JSON.stringify({ ok: true, skipped: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...cors },
    });
  }

  let token = "";
  try {
    const body = (await req.json()) as { token?: string };
    token = typeof body.token === "string" ? body.token.trim() : "";
  } catch {
    return new Response(JSON.stringify({ ok: false, error: "Corps JSON invalide" }), {
      status: 400,
      headers: { "Content-Type": "application/json", ...cors },
    });
  }

  if (!token) {
    return new Response(JSON.stringify({ ok: false, error: "Jeton requis" }), {
      status: 400,
      headers: { "Content-Type": "application/json", ...cors },
    });
  }

  const ip = req.headers.get("cf-connecting-ip") ||
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "";

  const form = new URLSearchParams();
  form.set("secret", secret);
  form.set("response", token);
  if (ip) form.set("remoteip", ip);

  let verifyJson: { success?: boolean; "error-codes"?: string[] };
  try {
    const r = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: form.toString(),
    });
    verifyJson = (await r.json()) as { success?: boolean; "error-codes"?: string[] };
  } catch (e) {
    console.error("[verify-turnstile] siteverify", e);
    return new Response(JSON.stringify({ ok: false, error: "Vérification indisponible" }), {
      status: 502,
      headers: { "Content-Type": "application/json", ...cors },
    });
  }

  if (!verifyJson.success) {
    return new Response(
      JSON.stringify({
        ok: false,
        error: "Vérification anti-robot échouée. Rechargez la page et réessayez.",
        codes: verifyJson["error-codes"] ?? [],
      }),
      { status: 400, headers: { "Content-Type": "application/json", ...cors } },
    );
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "Content-Type": "application/json", ...cors },
  });
});
