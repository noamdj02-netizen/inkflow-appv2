/**
 * Instagram Messaging via Meta Graph API
 * Actions: initiate, callback, status, disconnect, conversations, messages, send
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.3";
import { getCorsHeaders } from "../_shared/cors.ts";

const META_APP_ID = Deno.env.get("META_APP_ID") || "";
const META_APP_SECRET = Deno.env.get("META_APP_SECRET") || "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const SITE_URL = (Deno.env.get("SITE_URL") || Deno.env.get("APP_URL") || "https://ink-flow.me").replace(/\/+$/, "");

/** Pseudo Instagram sécurisé pour une URL instagram.com/[username]/ */
function sanitizeInstagramUsername(raw: string | null | undefined): string | null {
  if (!raw || typeof raw !== "string") return null;
  const s = raw.trim().replace(/^@/, "");
  if (!/^[A-Za-z0-9._]{1,64}$/.test(s)) return null;
  return s;
}

/**
 * Nom, @username et photo pour un interlocuteur DM (Instagram Scoped ID ou PSID IG).
 * Tente Graph Facebook puis Instagram ; si Meta refuse (RGPD / permissions), champs laissés vides.
 */
async function fetchInstagramDmParticipantPreview(
  participantId: string,
  pageAccessToken: string,
): Promise<{
  name: string | null;
  username: string | null;
  profilePictureUrl: string | null;
}> {
  const empty = (): {
    name: string | null;
    username: string | null;
    profilePictureUrl: string | null;
  } => ({
    name: null,
    username: null,
    profilePictureUrl: null,
  });

  const pid = participantId.trim();
  if (!pid || !pageAccessToken) return empty();

  const fields = encodeURIComponent("name,username,profile_pic,picture.type(large)");
  const fbUrl =
    `https://graph.facebook.com/v18.0/${encodeURIComponent(pid)}?fields=${fields}&access_token=${encodeURIComponent(pageAccessToken)}`;

  async function parseFb(body: Record<string, unknown>): Promise<ReturnType<typeof empty>> {
    const pictureUrl =
      typeof body.profile_pic === "string"
        ? body.profile_pic
        : typeof (body.picture as { data?: { url?: string } } | undefined)?.data?.url === "string"
        ? (body.picture as { data: { url: string } }).data.url
        : null;
    const name = typeof body.name === 'string' ? body.name.trim() || null : null;
    const u = sanitizeInstagramUsername(typeof body.username === 'string' ? body.username : undefined);
    return {
      name,
      username: u,
      profilePictureUrl: typeof pictureUrl === "string" ? pictureUrl : null,
    };
  }

  try {
    const fbRes = await fetch(fbUrl);
    const fbJson = (await fbRes.json()) as Record<string, unknown>;
    if (fbRes.ok && !fbJson.error) {
      const preview = await parseFb(fbJson);
      if (preview.username || preview.name || preview.profilePictureUrl) return preview;
    }

    const igUrl =
      `https://graph.instagram.com/v18.0/${encodeURIComponent(pid)}?fields=name,username,profile_picture_url&access_token=${encodeURIComponent(pageAccessToken)}`;
    const igRes = await fetch(igUrl);
    const igJson = (await igRes.json()) as Record<string, unknown>;
    if (igRes.ok && !igJson.error) {
      const username = sanitizeInstagramUsername(igJson.username as string | undefined);
      const name = typeof igJson.name === "string" ? igJson.name.trim() || null : null;
      const pic = typeof igJson.profile_picture_url === "string" ? igJson.profile_picture_url : null;
      if (username || name || pic) return { name, username, profilePictureUrl: pic };
    }
  } catch {
    // Réseau / parse
  }

  return empty();
}

function shortParticipantLabel(participantId: string): string {
  const id = participantId.trim();
  if (id.length <= 14) return id;
  return `${id.slice(0, 10)}…`;
}

Deno.serve(async (req: Request) => {
  const corsHeaders = getCorsHeaders(req.headers.get("origin"));
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { action, code, studioId, recipientId, text, participantId } = body;

    // ─── ACTION: initiate — OAuth URL ───
    if (action === "initiate") {
      if (!META_APP_ID) {
        return new Response(
          JSON.stringify({ error: "Instagram non configuré" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const redirectUri = `${SITE_URL}/instagram/callback`;
      // Facebook Login : uniquement scopes Pages (instagram_basic / instagram_manage_messages invalides depuis 2025)
      const scopes = ["pages_show_list", "pages_manage_metadata", "pages_messaging"].join(",");
      const authUrl = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${META_APP_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scopes}&response_type=code&state=${encodeURIComponent(studioId || "")}`;
      return new Response(
        JSON.stringify({ authUrl }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ─── ACTION: callback — exchange code, save connection ───
    if (action === "callback") {
      if (!code || !studioId) {
        return new Response(
          JSON.stringify({ error: "Code et studioId requis" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const redirectUri = `${SITE_URL}/instagram/callback`;
      const tokenRes = await fetch(
        `https://graph.facebook.com/v18.0/oauth/access_token?client_id=${META_APP_ID}&client_secret=${META_APP_SECRET}&redirect_uri=${encodeURIComponent(redirectUri)}&code=${code}`
      );
      if (!tokenRes.ok) {
        const err = await tokenRes.text();
        return new Response(
          JSON.stringify({ error: "Échec OAuth", details: err }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const { access_token } = await tokenRes.json();

      const pagesRes = await fetch(`https://graph.facebook.com/v18.0/me/accounts?access_token=${access_token}&fields=id,name,access_token,instagram_business_account`);
      const pagesData = await pagesRes.json();
      const pages = pagesData.data || [];
      if (!pages.length) {
        return new Response(
          JSON.stringify({ error: "Aucune Page Facebook trouvée. Crée une Page puis relie-la à ton Instagram." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Trouver la première Page qui a un compte Instagram lié (tu peux avoir plusieurs Pages)
      let page: { id: string; access_token: string } | null = null;
      let igAccountId: string | null = null;
      for (const p of pages) {
        const id = p.instagram_business_account?.id;
        if (id) {
          igAccountId = id;
          page = { id: p.id, access_token: p.access_token };
          break;
        }
      }
      if (!page || !igAccountId) {
        for (const p of pages) {
          const igRes = await fetch(
            `https://graph.facebook.com/v18.0/${p.id}?fields=instagram_business_account&access_token=${p.access_token}`
          );
          const igData = await igRes.json();
          const id = igData.instagram_business_account?.id;
          if (id) {
            igAccountId = id;
            page = { id: p.id, access_token: p.access_token };
            break;
          }
        }
      }
      if (!page || !igAccountId) {
        return new Response(
          JSON.stringify({ error: "Aucune de tes Pages n'a Instagram lié. Sur Instagram : Paramètres → Compte → Partenaires autorisés → Page Facebook → connecte ta Page. Puis réessaie." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const profileRes = await fetch(
        `https://graph.facebook.com/v18.0/${igAccountId}?fields=username&access_token=${page.access_token}`
      );
      const { username } = (await profileRes.json()) || {};

      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      const { error: upsertErr } = await supabase.from("instagram_connections").upsert(
        {
          studio_id: studioId,
          ig_account_id: igAccountId,
          page_access_token: page.access_token,
          username: username || null,
          connected_at: new Date().toISOString(),
        },
        { onConflict: "studio_id" }
      );
      if (upsertErr) {
        return new Response(
          JSON.stringify({ error: "Erreur sauvegarde", details: upsertErr.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      await fetch(`https://graph.facebook.com/v18.0/${igAccountId}/subscribed_apps`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subscribed_fields: "messages,messaging_seen",
          access_token: page.access_token,
        }),
      }).catch(() => {});

      return new Response(
        JSON.stringify({ redirectUrl: `${SITE_URL}/dashboard?ig=connected` }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ─── ACTION: status ───
    if (action === "status") {
      if (!studioId) {
        return new Response(
          JSON.stringify({ connected: false }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      const { data } = await supabase
        .from("instagram_connections")
        .select("username")
        .eq("studio_id", studioId)
        .single();
      return new Response(
        JSON.stringify({ connected: !!data, username: data?.username ?? undefined }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ─── ACTION: disconnect ───
    if (action === "disconnect") {
      if (!studioId) {
        return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      await supabase.from("instagram_connections").delete().eq("studio_id", studioId);
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ─── ACTION: conversations ───
    if (action === "conversations") {
      if (!studioId) return new Response(JSON.stringify([]), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      const { data: conn } = await supabase
        .from("instagram_connections")
        .select("ig_account_id, page_access_token")
        .eq("studio_id", studioId)
        .single();
      if (!conn) return new Response(JSON.stringify([]), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

      const { data: rows } = await supabase
        .from("instagram_messages")
        .select("from_id, to_id, text, timestamp, direction")
        .eq("studio_id", studioId)
        .order("timestamp", { ascending: false });

      const participants = new Map<string, { lastMessage: string; lastAt: string; unread: number }>();
      const igId = conn.ig_account_id;
      for (const r of rows || []) {
        const pid = r.from_id === igId ? r.to_id : r.from_id;
        if (!pid) continue;
        if (!participants.has(pid)) {
          participants.set(pid, { lastMessage: r.text || "", lastAt: r.timestamp || "", unread: 0 });
        }
      }

      const pageToken = conn.page_access_token;
      const convs = await Promise.all(
        Array.from(participants.entries()).map(async ([participantId, p]) => {
          const preview = await fetchInstagramDmParticipantPreview(participantId, pageToken);
          const label =
            preview.name ||
            (preview.username ? `@${preview.username}` : shortParticipantLabel(participantId));
          const participantProfileUrl = preview.username
            ? `https://www.instagram.com/${preview.username}/`
            : null;
          return {
            id: participantId,
            participantId,
            participantName: label,
            participantUsername: preview.username,
            participantProfileUrl,
            participantAvatar: preview.profilePictureUrl,
            lastMessage: p.lastMessage,
            lastAt: p.lastAt,
            unread: p.unread,
          };
        }),
      );
      return new Response(JSON.stringify(convs), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ─── ACTION: messages ───
    if (action === "messages") {
      if (!studioId || !participantId) return new Response(JSON.stringify([]), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      const { data: conn } = await supabase.from("instagram_connections").select("ig_account_id").eq("studio_id", studioId).single();
      if (!conn) return new Response(JSON.stringify([]), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

      const igId = conn.ig_account_id;
      const { data: rowsA } = await supabase
        .from("instagram_messages")
        .select("id, text, direction, timestamp")
        .eq("studio_id", studioId)
        .eq("from_id", igId)
        .eq("to_id", participantId)
        .order("timestamp", { ascending: true });
      const { data: rowsB } = await supabase
        .from("instagram_messages")
        .select("id, text, direction, timestamp")
        .eq("studio_id", studioId)
        .eq("from_id", participantId)
        .eq("to_id", igId)
        .order("timestamp", { ascending: true });
      const rows = [...(rowsA || []), ...(rowsB || [])].sort(
        (a, b) => new Date(a.timestamp || 0).getTime() - new Date(b.timestamp || 0).getTime()
      );

      const msgs = (rows || []).map((r) => ({
        id: r.id,
        text: r.text || "",
        direction: r.direction || "inbound",
        timestamp: r.timestamp || "",
      }));
      return new Response(JSON.stringify(msgs), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ─── ACTION: send ───
    if (action === "send") {
      if (!studioId || !recipientId || !text) {
        return new Response(
          JSON.stringify({ error: "recipientId et text requis" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      const { data: conn } = await supabase.from("instagram_connections").select("ig_account_id, page_access_token").eq("studio_id", studioId).single();
      if (!conn) {
        return new Response(
          JSON.stringify({ error: "Instagram non connecté" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const res = await fetch(
        `https://graph.facebook.com/v18.0/${conn.ig_account_id}/messages?access_token=${encodeURIComponent(conn.page_access_token)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ recipient: { id: recipientId }, message: { text } }),
        }
      );
      const resData = await res.json();
      if (resData.error) {
        return new Response(
          JSON.stringify({ error: resData.error.message || "Erreur envoi" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      await supabase.from("instagram_messages").insert({
        studio_id: studioId,
        ig_account_id: conn.ig_account_id,
        from_id: conn.ig_account_id,
        to_id: recipientId,
        message_id: resData.message_id || null,
        text,
        direction: "outbound",
        timestamp: new Date().toISOString(),
      });

      return new Response(JSON.stringify(resData), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(
      JSON.stringify({ error: "Action inconnue" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err?.message || "Erreur serveur" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
