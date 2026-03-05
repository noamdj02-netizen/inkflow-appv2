/**
 * Edge Function pour appeler l'API Gemini côté serveur.
 * La clé API est stockée en secret (GEMINI_API_KEY) et n'est jamais exposée au client.
 */

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY") || "";
const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const jsonHeaders = { "Content-Type": "application/json", ...corsHeaders };

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: jsonHeaders });
  }

  try {
    // Vérification de l'authentification (Sécurité cruciale pour un SaaS)
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), { status: 401, headers: jsonHeaders });
    }

    const { prompt } = await req.json();
    if (typeof prompt !== "string" || !prompt.trim()) {
      return new Response(JSON.stringify({ error: "Prompt is required" }), { status: 400, headers: jsonHeaders });
    }

    if (!GEMINI_API_KEY) {
      console.error("[call-gemini] GEMINI_API_KEY not configured");
      return new Response(JSON.stringify({ error: "Gemini API not configured" }), { status: 500, headers: jsonHeaders });
    }

    // Timeout 15 secondes
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const res = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 1024 },
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      const errBody = await res.text();
      try {
        const errJson = JSON.parse(errBody);
        console.error("[call-gemini] Gemini API error:", errJson);
      } catch {
        console.error("[call-gemini] Gemini API error:", res.status, errBody);
      }
      return new Response(JSON.stringify({ error: "Gemini API failed" }), { status: 502, headers: jsonHeaders });
    }

    const data = await res.json();

    // Gestion des filtres de sécurité Google
    const candidate = data.candidates?.[0];
    if (candidate?.finishReason === "SAFETY") {
      return new Response(
        JSON.stringify({ text: "Désolé, cette demande a été bloquée par les filtres de sécurité." }),
        { headers: jsonHeaders }
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
