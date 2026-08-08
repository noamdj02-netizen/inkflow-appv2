import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.3";
import { getCorsHeaders } from "../_shared/cors.ts";
import { requireStudioAccessFromRequest } from "../_shared/requireStudioJwt.ts";

const GOOGLE_CLIENT_ID = Deno.env.get("GOOGLE_CLIENT_ID") || "";
const GOOGLE_CLIENT_SECRET = Deno.env.get("GOOGLE_CLIENT_SECRET") || "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

async function getValidAccessToken(
  supabase: ReturnType<typeof createClient>,
  studioId: string,
): Promise<string | null> {
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
    ]
      .filter(Boolean)
      .join("\n"),
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
  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: { ...corsHeaders, "Access-Control-Max-Age": "86400" },
    });
  }

  try {
    const body = await req.json();
    const { action, studioId, appointmentId } = body as {
      action?: string;
      studioId?: string;
      appointmentId?: string;
      appointments?: unknown;
    };

    const access = await requireStudioAccessFromRequest(
      req,
      corsHeaders,
      studioId,
      SUPABASE_URL,
      SUPABASE_ANON_KEY,
      SUPABASE_SERVICE_ROLE_KEY,
    );
    if (access instanceof Response) return access;
    const authorizedStudioId = access.studio.id;

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const accessToken = await getValidAccessToken(supabase, authorizedStudioId);

    if (!accessToken) {
      return new Response(
        JSON.stringify({ error: "Google Calendar non connecté ou token expiré" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const gcalApi = "https://www.googleapis.com/calendar/v3/calendars/primary/events";
    const authHeader = { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" };

    async function assertAppointmentInStudio(apptId: string) {
      const { data: apt } = await supabase
        .from("inkflow_appointments")
        .select("*")
        .eq("id", apptId)
        .maybeSingle();
      if (!apt) {
        return {
          error: new Response(
            JSON.stringify({ error: "Rendez-vous introuvable" }),
            { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } },
          ),
        };
      }
      if (String(apt.studio_id) !== authorizedStudioId) {
        return {
          error: new Response(JSON.stringify({ error: "Accès refusé à ce rendez-vous" }), {
            status: 403,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }),
        };
      }
      return { apt };
    }

    // ─── ACTION: push_one — push single appointment to Google ───
    if (action === "push_one") {
      if (!appointmentId?.trim()) {
        return new Response(JSON.stringify({ error: "appointmentId requis" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const checked = await assertAppointmentInStudio(appointmentId.trim());
      if ("error" in checked && checked.error) return checked.error;
      const apt = checked.apt!;

      if (apt.google_event_id) {
        const putRes = await fetch(`${gcalApi}/${apt.google_event_id}`, {
          method: "PUT",
          headers: authHeader,
          body: JSON.stringify(appointmentToGoogleEvent(apt)),
        });
        if (putRes.ok) {
          const updated = await putRes.json();
          await supabase
            .from("inkflow_appointments")
            .update({ calendar_synced_at: new Date().toISOString() })
            .eq("id", appointmentId);
          return new Response(
            JSON.stringify({ success: true, googleEventId: updated.id as string }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } },
          );
        }
        if (putRes.status === 404) {
          apt.google_event_id = null;
        } else {
          const errText = await putRes.text();
          return new Response(
            JSON.stringify({ error: "Erreur mise à jour Google Calendar", details: errText }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
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
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      const created = await res.json();

      await supabase
        .from("inkflow_appointments")
        .update({ google_event_id: created.id, calendar_synced_at: new Date().toISOString() })
        .eq("id", appointmentId);

      return new Response(JSON.stringify({ success: true, googleEventId: created.id }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ─── ACTION: push_all — push all unsynced appointments ───
    if (action === "push_all") {
      const { data: unsynced } = await supabase
        .from("inkflow_appointments")
        .select("*")
        .eq("studio_id", authorizedStudioId)
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
        .eq("id", authorizedStudioId);

      return new Response(JSON.stringify({ success: true, synced }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ─── ACTION: pull — import Google events into InkFlow ───
    if (action === "pull") {
      const now = new Date();
      const timeMin = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const timeMax = new Date(now.getFullYear(), now.getMonth() + 3, 0).toISOString();

      const res = await fetch(
        `${gcalApi}?timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true&orderBy=startTime&maxResults=250`,
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );

      if (!res.ok) {
        return new Response(JSON.stringify({ error: "Erreur lecture Google Calendar" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const data = await res.json();
      const events = (data.items || []).filter((e: Record<string, unknown>) => {
        const ext = e.extendedProperties as Record<string, Record<string, string>> | undefined;
        return !ext?.private?.inkflow;
      });

      return new Response(
        JSON.stringify({
          success: true,
          events: events.map((e: Record<string, unknown>) => ({
            googleId: e.id,
            title: e.summary,
            description: e.description,
            start:
              (e.start as Record<string, string>)?.dateTime ||
              (e.start as Record<string, string>)?.date,
            end:
              (e.end as Record<string, string>)?.dateTime ||
              (e.end as Record<string, string>)?.date,
            location: e.location,
          })),
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // ─── ACTION: delete — remove event from Google ───
    if (action === "delete") {
      if (!appointmentId?.trim()) {
        return new Response(JSON.stringify({ error: "appointmentId requis" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const checked = await assertAppointmentInStudio(appointmentId.trim());
      if ("error" in checked && checked.error) return checked.error;
      const apt = checked.apt!;

      if (apt.google_event_id) {
        await fetch(`${gcalApi}/${apt.google_event_id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        await supabase
          .from("inkflow_appointments")
          .update({ google_event_id: null, calendar_synced_at: null })
          .eq("id", appointmentId);
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Action inconnue" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
