/**
 * Signalement produit (bug / idée) — email équipe InkFlow avec liens captures Storage.
 * POST JSON : { reportId, type, module, message, screenshotPaths[], pageUrl?, userAgent? }
 */
import { createClient } from "npm:@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/cors.ts";
import { getGoTrueUser } from "../_shared/supabaseAuth.ts";
import { sendEmail } from "../_shared/resend.ts";

const FEEDBACK_TO = Deno.env.get("PRODUCT_FEEDBACK_EMAIL")?.trim() || "contact@ink-flow.me";
const BUCKET = "inkflow-assets";

interface Body {
  reportId?: string;
  type?: string;
  module?: string;
  message?: string;
  screenshotPaths?: string[];
  pageUrl?: string;
  userAgent?: string;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

Deno.serve(async (req: Request) => {
  const corsHeaders = getCorsHeaders(req.headers.get("origin"));
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  const auth = req.headers.get("Authorization") ?? "";
  const bearer = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";

  const user = await getGoTrueUser(supabaseUrl, anonKey, bearer);
  if (!user?.email) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let body: Body;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const message = typeof body.message === "string" ? body.message.trim() : "";
  const reportId = typeof body.reportId === "string" ? body.reportId.trim() : "";
  const type = typeof body.type === "string" ? body.type.trim() : "bug";
  const module = typeof body.module === "string" ? body.module.trim() : "autre";
  const pageUrl = typeof body.pageUrl === "string" ? body.pageUrl.trim() : "";
  const userAgent = typeof body.userAgent === "string" ? body.userAgent.trim() : "";
  const screenshotPaths = Array.isArray(body.screenshotPaths)
    ? body.screenshotPaths.filter((p): p is string => typeof p === "string" && p.length > 0)
    : [];

  if (!reportId || message.length < 10) {
    return new Response(JSON.stringify({ error: "Invalid payload" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const admin = createClient(supabaseUrl, serviceKey);

  const { data: studio } = await admin
    .from("inkflow_studios")
    .select("id, studio_name, slug")
    .ilike("email", user.email.trim())
    .maybeSingle();

  const signedLinks: string[] = [];
  for (const path of screenshotPaths.slice(0, 5)) {
    if (!path.startsWith(`feedback-reports/${user.id}/`)) continue;
    const { data: signed, error: signErr } = await admin.storage
      .from(BUCKET)
      .createSignedUrl(path, 60 * 60 * 24 * 7);
    if (!signErr && signed?.signedUrl) {
      signedLinks.push(signed.signedUrl);
    }
  }

  const subject = `[InkFlow] ${type === "bug" ? "Bug" : type === "idea" ? "Idée" : "Retour"} — ${
    studio?.studio_name ?? user.email
  }`;

  const capturesHtml =
    signedLinks.length > 0
      ? `<ul>${signedLinks
          .map(
            (url, i) =>
              `<li><a href="${escapeHtml(url)}">Capture ${i + 1}</a> (lien valide 7 jours)</li>`
          )
          .join("")}</ul>`
      : "<p><em>Aucune capture jointe.</em></p>";

  const html = `
    <div style="font-family:system-ui,sans-serif;line-height:1.5;color:#18181b">
      <h2 style="margin:0 0 12px">Signalement InkFlow</h2>
      <p><strong>Type :</strong> ${escapeHtml(type)}</p>
      <p><strong>Zone :</strong> ${escapeHtml(module)}</p>
      <p><strong>Studio :</strong> ${escapeHtml(studio?.studio_name ?? "—")} (${escapeHtml(studio?.slug ?? "—")})</p>
      <p><strong>Email :</strong> ${escapeHtml(user.email)}</p>
      <p><strong>ID rapport :</strong> ${escapeHtml(reportId)}</p>
      <p><strong>Page :</strong> ${pageUrl ? `<a href="${escapeHtml(pageUrl)}">${escapeHtml(pageUrl)}</a>` : "—"}</p>
      <p><strong>Message :</strong></p>
      <pre style="white-space:pre-wrap;background:#f4f4f5;padding:12px;border-radius:8px">${escapeHtml(message)}</pre>
      <p><strong>Captures :</strong></p>
      ${capturesHtml}
      ${userAgent ? `<p style="font-size:12px;color:#71717a"><strong>UA :</strong> ${escapeHtml(userAgent)}</p>` : ""}
    </div>
  `;

  const sent = await sendEmail({
    to: [FEEDBACK_TO],
    subject,
    html,
    text: [
      `Signalement InkFlow (${type} / ${module})`,
      `Studio: ${studio?.studio_name ?? "—"}`,
      `Email: ${user.email}`,
      `Rapport: ${reportId}`,
      pageUrl ? `Page: ${pageUrl}` : "",
      "",
      message,
      "",
      signedLinks.length ? `Captures:\n${signedLinks.join("\n")}` : "Sans capture",
    ]
      .filter(Boolean)
      .join("\n"),
    replyTo: [user.email],
  });

  if (!sent) {
    return new Response(JSON.stringify({ error: "Email non envoyé (Resend)" }), {
      status: 502,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ ok: true, reportId }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
