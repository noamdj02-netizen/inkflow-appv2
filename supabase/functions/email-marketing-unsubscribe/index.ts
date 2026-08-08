/**
 * GET one-click désinscription marketing (en-tête List-Unsubscribe-Post / lien).
 * Paramètres : e = base64url(email), t = hex HMAC-SHA256(email) avec EMAIL_UNSUBSCRIBE_SECRET.
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.3";
import {
  base64UrlDecodeToString,
  signUnsubscribeToken,
} from "../_shared/marketingUnsubscribe.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const SECRET = Deno.env.get("EMAIL_UNSUBSCRIBE_SECRET") || "";

function htmlPage(title: string, message: string): Response {
  const body = `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>${title}</title></head>
<body style="font-family:system-ui,sans-serif;max-width:520px;margin:48px auto;padding:0 16px;color:#111">
<h1 style="font-size:1.25rem">${title}</h1>
<p style="line-height:1.5;color:#444">${message}</p>
<p style="margin-top:24px;font-size:0.9rem;color:#666">— InkFlow</p>
</body></html>`;
  return new Response(body, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}

Deno.serve(async (req: Request) => {
  if (req.method !== "GET" && req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  if (!SECRET || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return htmlPage("Configuration", "Service indisponible. Réessayez plus tard ou écrivez à contact@ink-flow.me.");
  }

  const url = new URL(req.url);
  const e = url.searchParams.get("e") || "";
  const t = url.searchParams.get("t") || "";

  let emailNorm = "";
  try {
    emailNorm = base64UrlDecodeToString(e).trim().toLowerCase();
  } catch {
    return htmlPage("Lien invalide", "Ce lien de désinscription n’est plus valide. Utilisez la mention en bas d’un autre e-mail InkFlow.");
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailNorm)) {
    return htmlPage("Lien invalide", "Adresse non reconnue.");
  }

  const expected = await signUnsubscribeToken(emailNorm, SECRET);
  if (t !== expected) {
    return htmlPage("Lien invalide", "Signature incorrecte — demandez un nouvel e-mail ou contactez contact@ink-flow.me.");
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { error } = await supabase.from("email_suppressions").upsert(
    {
      email: emailNorm,
      reason: "unsubscribe_one_click",
      source: "marketing_link",
    },
    { onConflict: "email" },
  );

  if (error) {
    console.error("[email-marketing-unsubscribe]", error);
    return htmlPage("Erreur", "Enregistrement impossible. Écrivez à contact@ink-flow.me avec l’objet « Désinscription ».");
  }

  return htmlPage(
    "Désinscription enregistrée",
    "Vous ne recevrez plus les e-mails de suivi post-rendez-vous (conseils J+1, J+7, J+30) et messages similaires. Les e-mails transactionnels (confirmation de réservation, facture) peuvent encore être envoyés.",
  );
});
