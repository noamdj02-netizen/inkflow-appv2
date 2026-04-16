/**
 * Edge Function pour appeler l'API Gemini côté serveur.
 * La clé API est stockée en secret (GEMINI_API_KEY) et n'est jamais exposée au client.
 *
 * Sécurité : session utilisateur obligatoire (pas de JWT anon) + rate limit par utilisateur et par IP.
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { getCorsHeaders } from "../_shared/cors.ts";
import { allowRateLimit, clientIpFromRequest } from "../_shared/rateLimit.ts";
import { getGoTrueUser } from "../_shared/supabaseAuth.ts";

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY") || "";
const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") || "";

/** Requêtes / minute / utilisateur authentifié (coût API). */
const RATE_USER_MAX = 25;
const RATE_USER_WINDOW_MS = 60_000;
/** Plafond IP (anti-abus multi-comptes depuis la même machine). */
const RATE_IP_MAX = 120;
const RATE_IP_WINDOW_MS = 60_000;

function bearerToken(authHeader: string | null): string | null {
  const h = authHeader?.trim();
  if (!h?.toLowerCase().startsWith("bearer ")) return null;
  const t = h.slice(7).trim();
  return t.length > 0 ? t : null;
}

/** Rejette le JWT « anon » (clé publique) — ne doit pas suffire à appeler Gemini. */
function isAnonJwt(token: string): boolean {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return false;
    const pad = parts[1].length % 4 === 0 ? "" : "=".repeat(4 - (parts[1].length % 4));
    const json = JSON.parse(
      atob(parts[1].replace(/-/g, "+").replace(/_/g, "/") + pad),
    ) as { role?: string };
    return json?.role === "anon";
  } catch {
    return false;
  }
}

Deno.serve(async (req: Request) => {
  const corsHeaders = getCorsHeaders(req.headers.get("origin"));
  const jsonHeaders = { "Content-Type": "application/json", ...corsHeaders };

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: jsonHeaders });
  }

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error("[call-gemini] SUPABASE_URL / SUPABASE_ANON_KEY manquants");
    return new Response(JSON.stringify({ error: "Configuration serveur incomplète" }), {
      status: 503,
      headers: jsonHeaders,
    });
  }

  const token = bearerToken(req.headers.get("Authorization"));
  if (!token) {
    return new Response(JSON.stringify({ error: "Connexion requise pour l’assistant IA." }), {
      status: 401,
      headers: jsonHeaders,
    });
  }

  if (isAnonJwt(token)) {
    return new Response(
      JSON.stringify({ error: "Connectez-vous avec votre compte tatoueur pour utiliser l’assistant IA." }),
      { status: 401, headers: jsonHeaders },
    );
  }

  const user = await getGoTrueUser(SUPABASE_URL, SUPABASE_ANON_KEY, token);
  if (!user?.id) {
    return new Response(JSON.stringify({ error: "Session invalide ou expirée. Reconnectez-vous." }), {
      status: 401,
      headers: jsonHeaders,
    });
  }

  const ip = clientIpFromRequest(req);
  if (!allowRateLimit(`gemini:ip:${ip}`, RATE_IP_MAX, RATE_IP_WINDOW_MS)) {
    return new Response(JSON.stringify({ error: "Trop de requêtes depuis cette adresse. Réessayez dans une minute." }), {
      status: 429,
      headers: jsonHeaders,
    });
  }
  if (!allowRateLimit(`gemini:user:${user.id}`, RATE_USER_MAX, RATE_USER_WINDOW_MS)) {
    return new Response(
      JSON.stringify({ error: "Limite d’utilisation de l’IA atteinte. Réessayez dans une minute." }),
      { status: 429, headers: jsonHeaders },
    );
  }

  try {
    const body = await req.json();
    const { prompt, imageBase64, imageMimeType } = body;

    if (typeof prompt !== "string" || !prompt.trim()) {
      return new Response(JSON.stringify({ error: "Prompt is required" }), { status: 400, headers: jsonHeaders });
    }

    if (!GEMINI_API_KEY) {
      console.error("[call-gemini] GEMINI_API_KEY not configured");
      return new Response(JSON.stringify({ error: "Gemini API not configured" }), { status: 500, headers: jsonHeaders });
    }

    const parts: unknown[] = [{ text: prompt }];
    if (imageBase64 && typeof imageBase64 === "string") {
      const mime = imageMimeType || "image/jpeg";
      parts.push({
        inline_data: {
          mime_type: mime,
          data: imageBase64.replace(/^data:image\/\w+;base64,/, ""),
        },
      });
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000);

    const res = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 1024, responseMimeType: body.responseMimeType },
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      const errBody = await res.text();
      let errMsg = "Gemini API failed";
      try {
        const errJson = JSON.parse(errBody) as { error?: { message?: string }; message?: string };
        errMsg = errJson?.error?.message || errJson?.message || (errBody ? String(errBody).slice(0, 200) : "") || errMsg;
        console.error("[call-gemini] Gemini API error:", errJson);
      } catch {
        console.error("[call-gemini] Gemini API error:", res.status, errBody);
      }
      return new Response(JSON.stringify({ error: errMsg }), { status: 502, headers: jsonHeaders });
    }

    const data = await res.json();

    const candidate = data.candidates?.[0];
    if (candidate?.finishReason === "SAFETY") {
      return new Response(
        JSON.stringify({ text: "Désolé, cette demande a été bloquée par les filtres de sécurité." }),
        { headers: jsonHeaders },
      );
    }

    const generatedText = candidate?.content?.parts?.[0]?.text || "Je n'ai pas pu générer de réponse.";

    return new Response(JSON.stringify({ text: generatedText }), { headers: jsonHeaders });
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      return new Response(JSON.stringify({ error: "Request timeout" }), { status: 504, headers: jsonHeaders });
    }
    console.error("[call-gemini] Error:", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return new Response(JSON.stringify({ error: message }), { status: 500, headers: jsonHeaders });
  }
});
