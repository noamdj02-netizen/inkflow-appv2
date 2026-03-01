/**
 * Retourne les créneaux occupés pour un studio (appointments + bookings confirmés).
 * Utilisé par la vitrine pour afficher uniquement les dates/heures disponibles.
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.3";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function normalizeTime(t: string | null): string | null {
  if (!t) return null;
  const s = String(t).trim().toLowerCase();
  if (/^\d{1,2}:\d{2}$/.test(s)) return s;
  if (s === "morning") return "10:00";
  if (s === "afternoon") return "14:00";
  if (s === "evening") return "18:00";
  return s;
}

function addToBusy(acc: Record<string, Set<string>>, date: string, time: string | null) {
  if (!time) return;
  const d = date.split("T")[0];
  if (!acc[d]) acc[d] = new Set();
  acc[d].add(time);
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const { studioId } = (await req.json().catch(() => ({}))) as { studioId?: string };
    if (!studioId?.trim?.()) {
      return new Response(
        JSON.stringify({ error: "studioId requis" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const busy: Record<string, Set<string>> = {};

    const today = new Date().toISOString().split("T")[0];

    const { data: appointments } = await supabase
      .from("inkflow_appointments")
      .select("date, time")
      .eq("studio_id", studioId)
      .gte("date", today)
      .in("status", ["pending", "confirmed", "in_progress", "completed"]);

    (appointments || []).forEach((r) => {
      const date = (r.date as string)?.toString?.()?.split?.("T")?.[0];
      const time = (r.time as string)?.toString?.()?.trim?.();
      if (date && time) addToBusy(busy, date, normalizeTime(time));
    });

    const { data: bookings } = await supabase
      .from("inkflow_bookings")
      .select("requested_date, requested_time")
      .eq("studio_id", studioId)
      .gte("requested_date", today)
      .in("status", ["confirmed", "accepted"]);

    (bookings || []).forEach((r) => {
      const date = (r.requested_date as string)?.toString?.()?.split?.("T")?.[0];
      const time = normalizeTime((r.requested_time as string) ?? null);
      if (date && time) addToBusy(busy, date, time);
    });

    const busySlots: Record<string, string[]> = {};
    Object.entries(busy).forEach(([d, set]) => {
      busySlots[d] = Array.from(set);
    });

    return new Response(
      JSON.stringify({ busySlots }),
      { headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (err) {
    console.error("get-studio-availability error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
