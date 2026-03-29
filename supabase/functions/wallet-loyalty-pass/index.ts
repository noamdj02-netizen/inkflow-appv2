import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type Platform = "apple" | "google";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Méthode non autorisée" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Non autorisé" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const anonClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authErr } = await anonClient.auth.getUser();
    if (authErr || !user?.email) {
      return new Response(JSON.stringify({ error: "Session invalide" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const email = user.email;
    let body: { platform?: string };
    try {
      body = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: "Corps JSON invalide" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const platform = body.platform as Platform;
    if (platform !== "apple" && platform !== "google") {
      return new Response(JSON.stringify({ error: "platform: apple | google" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(supabaseUrl, serviceKey);

    const { data: codeRow } = await admin
      .from("inkflow_client_codes")
      .select("code")
      .eq("email", email)
      .maybeSingle();

    const { data: walletRow } = await admin
      .from("inkflow_client_wallets")
      .select("balance_cents")
      .eq("email", email)
      .maybeSingle();

    const clientCode = (codeRow as { code?: string } | null)?.code ?? "";
    const cents = (walletRow as { balance_cents?: number } | null)?.balance_cents ?? 0;
    const balanceEuros = (cents / 100).toFixed(0);

    // ── Google Wallet : URL complète « Save to Google Wallet » (JWT déjà signé côté ops) ──
    if (platform === "google") {
      const saveUrl = Deno.env.get("GOOGLE_WALLET_LOYALTY_SAVE_URL")?.trim();
      if (saveUrl && saveUrl.startsWith("https://")) {
        return new Response(
          JSON.stringify({
            ok: true,
            platform: "google",
            configured: true,
            userMessage: "Ouverture de Google Wallet…",
            googleWalletSaveUrl: saveUrl,
            clientCode,
            balanceEuros,
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      return new Response(
        JSON.stringify({
          ok: true,
          platform: "google",
          configured: false,
          userMessage:
            "L’enregistrement Google Wallet sera disponible dès configuration du compte émetteur Google (API Wallet). En attendant, utilise le QR code au verso de ta carte dans l’app.",
          clientCode,
          balanceEuros,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // ── Apple : .pkpass uniquement si certificats présents (voir secrets dashboard) ──
    const p12 = Deno.env.get("APPLE_WALLET_P12_BASE64")?.trim();
    const p12Pass = Deno.env.get("APPLE_WALLET_P12_PASSWORD") ?? "";
    const teamId = Deno.env.get("APPLE_WALLET_TEAM_ID")?.trim();
    const passTypeId = Deno.env.get("APPLE_WALLET_PASS_TYPE_ID")?.trim();

    const appleReady = !!(p12 && teamId && passTypeId);

    if (platform === "apple" && appleReady) {
      // Génération pkpass : à brancher avec passkit-generator / pipeline CI quand les assets sont prêts.
      // Évite d’échouer silencieusement : on indique clairement que la signature n’est pas encore implémentée ici.
      console.warn(
        "wallet-loyalty-pass: certificats Apple présents mais génération pkpass non activée dans cette révision. Déployer une version avec passkit-generator ou service dédié.",
      );
    }

    return new Response(
      JSON.stringify({
        ok: true,
        platform: "apple",
        configured: false,
        userMessage: appleReady
          ? "Certificats détectés : la génération automatique du fichier .pkpass sera activée au prochain déploiement backend. Utilise le QR code en studio ou le code client en attendant."
          : "Pour ajouter la carte dans Apple Wallet, Inkflow doit publier un pass signé Apple (.pkpass). Ce n’est pas encore activé sur ce projet — présente le QR code (verso de la carte) au studio ou ton code client.",
        clientCode,
        balanceEuros,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("wallet-loyalty-pass:", e);
    return new Response(JSON.stringify({ error: "Erreur serveur" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
