import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.3";

const GOOGLE_CLIENT_ID = Deno.env.get("GOOGLE_CLIENT_ID") || "";
const GOOGLE_CLIENT_SECRET = Deno.env.get("GOOGLE_CLIENT_SECRET") || "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

async function getValidAccessToken(supabase: ReturnType<typeof createClient>, studioId: string): Promise<string | null> {
  const { data } = await supabase
    .from("inkflow_studios")
    .select("google_access_token, google_refresh_token, google_token_expiry")
    .eq("id", studioId)
    .single();

  if (!data) return null;

  if (data.google_token_expiry && Date.now() < data.google_token_expiry - 60000) {
    return data.google_access_token;
  }

  if (!data.google_refresh_token) return null;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      refresh_token: data.google_refresh_token,
      grant_type: "refresh_token",
    }),
  });

  if (!res.ok) return null;

  const tokens = await res.json();
  const expiry = Date.now() + (tokens.expires_in || 3600) * 1000;

  await supabase
    .from("inkflow_studios")
    .update({
      google_access_token: tokens.access_token,
      google_token_expiry: expiry,
      updated_at: new Date().toISOString(),
    })
    .eq("id", studioId);

  return tokens.access_token;
}

function appointmentToGoogleEvent(apt: Record<string, unknown>) {
  const date = apt.date as string;
  const time = (apt.time as string) || "10:00";
  const duration = (apt.duration as number) || 60;

  const start = new Date(`${date}T${time}:00`);
  const end = new Date(start.getTime() + duration * 60 * 1000);

  return {
    summary: `🖋 ${apt.client_name} — ${apt.service || "Tattoo"}`,
    description: [
      `Client : ${apt.client_name}`,
      apt.client_email ? `Email : ${apt.client_email}` : "",
      apt.client_phone ? `Tél : ${apt.client_phone}` : "",
      `Prix : ${apt.price || 0}€`,
      apt.notes ? `Notes : ${apt.notes}` : "",
      "\n— Créé depuis InkFlow",
    ].filter(Boolean).join("\n"),
    start: { dateTime: start.toISOString(), timeZone: "Europe/Paris" },
    end: { dateTime: end.toISOString(), timeZone: "Europe/Paris" },
    reminders: {
      useDefault: false,
      overrides: [
        { method: "popup", minutes: 60 },
        { method: "popup", minutes: 1440 },
      ],
    },
    extendedProperties: {
      private: { inkflow: "true", inkflow_id: apt.id as string },
    },
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: { ...corsHeaders, "Access-Control-Max-Age": "86400" } });
  }

  try {
    const { action, studioId, appointmentId, appointments } = await req.json();
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const accessToken = await getValidAccessToken(supabase, studioId);

    if (!accessToken) {
      return new Response(
        JSON.stringify({ error: "Google Calendar non connecté ou token expiré" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const gcalApi = "https://www.googleapis.com/calendar/v3/calendars/primary/events";
    const authHeader = { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" };

    // ─── ACTION: push_one — push single appointment to Google ───
    if (action === "push_one") {
      const { data: apt } = await supabase
        .from("inkflow_appointments")
        .select("*")
        .eq("id", appointmentId)
        .single();

      if (!apt) {
        return new Response(
          JSON.stringify({ error: "Rendez-vous introuvable" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Update existing or create new
      if (apt.google_event_id) {
        const res = await fetch(`${gcalApi}/${apt.google_event_id}`, {
          method: "PUT",
          headers: authHeader,
          body: JSON.stringify(appointmentToGoogleEvent(apt)),
        });
        if (!res.ok && res.status === 404) {
          apt.google_event_id = null;
        } else {
          const updated = await res.json();
          return new Response(
            JSON.stringify({ success: true, googleEventId: updated.id }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }

      const res = await fetch(gcalApi, {
        method: "POST",
        headers: authHeader,
        body: JSON.stringify(appointmentToGoogleEvent(apt)),
      });

      if (!res.ok) {
        const err = await res.text();
        return new Response(
          JSON.stringify({ error: "Erreur Google Calendar", details: err }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const created = await res.json();

      await supabase
        .from("inkflow_appointments")
        .update({ google_event_id: created.id, calendar_synced_at: new Date().toISOString() })
        .eq("id", appointmentId);

      return new Response(
        JSON.stringify({ success: true, googleEventId: created.id }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ─── ACTION: push_all — push all unsynced appointments ───
    if (action === "push_all") {
      const { data: unsynced } = await supabase
        .from("inkflow_appointments")
        .select("*")
        .eq("studio_id", studioId)
        .is("google_event_id", null)
        .in("status", ["pending", "confirmed", "in_progress"]);

      let synced = 0;
      for (const apt of unsynced || []) {
        const res = await fetch(gcalApi, {
          method: "POST",
          headers: authHeader,
          body: JSON.stringify(appointmentToGoogleEvent(apt)),
        });

        if (res.ok) {
          const created = await res.json();
          await supabase
            .from("inkflow_appointments")
            .update({ google_event_id: created.id, calendar_synced_at: new Date().toISOString() })
            .eq("id", apt.id);
          synced++;
        }
      }

      await supabase
        .from("inkflow_studios")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", studioId);

      return new Response(
        JSON.stringify({ success: true, synced }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ─── ACTION: pull — import Google events into InkFlow ───
    if (action === "pull") {
      const now = new Date();
      const timeMin = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const timeMax = new Date(now.getFullYear(), now.getMonth() + 3, 0).toISOString();

      const res = await fetch(
        `${gcalApi}?timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true&orderBy=startTime&maxResults=250`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      if (!res.ok) {
        return new Response(
          JSON.stringify({ error: "Erreur lecture Google Calendar" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const data = await res.json();
      const events = (data.items || []).filter(
        (e: Record<string, unknown>) => {
          const ext = e.extendedProperties as Record<string, Record<string, string>> | undefined;
          return !ext?.private?.inkflow;
        }
      );

      return new Response(
        JSON.stringify({
          success: true,
          events: events.map((e: Record<string, unknown>) => ({
            googleId: e.id,
            title: e.summary,
            description: e.description,
            start: (e.start as Record<string, string>)?.dateTime || (e.start as Record<string, string>)?.date,
            end: (e.end as Record<string, string>)?.dateTime || (e.end as Record<string, string>)?.date,
            location: e.location,
          })),
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ─── ACTION: delete — remove event from Google ───
    if (action === "delete") {
      const { data: apt } = await supabase
        .from("inkflow_appointments")
        .select("google_event_id")
        .eq("id", appointmentId)
        .single();

      if (apt?.google_event_id) {
        await fetch(`${gcalApi}/${apt.google_event_id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        await supabase
          .from("inkflow_appointments")
          .update({ google_event_id: null, calendar_synced_at: null })
          .eq("id", appointmentId);
      }

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Action inconnue" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
