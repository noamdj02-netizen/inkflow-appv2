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
    const body = (await req.json().catch(() => ({}))) as { studioId?: string; timezone?: string };
    const { studioId, timezone } = body;
    if (!studioId?.trim?.()) {
      return new Response(
        JSON.stringify({ error: "studioId requis" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const busy: Record<string, Set<string>> = {};

    const today = timezone?.trim?.()
      ? new Date().toLocaleDateString("en-CA", { timeZone: timezone })
      : new Date().toISOString().split("T")[0];

    // Récupérer les créneaux fixes configurés par le studio
    const { data: studioData } = await supabase
      .from("inkflow_studios")
      .select("availability_settings")
      .eq("id", studioId)
      .single();

    const availabilitySettings = (studioData?.availability_settings as Record<string, unknown> | null) ?? {};
    const customSlots: string[] = Array.isArray(availabilitySettings.customSlots)
      ? (availabilitySettings.customSlots as string[]).filter((s) => typeof s === "string" && /^\d{1,2}:\d{2}$/.test(s))
      : [];
    const bookingWindowDays: number = typeof availabilitySettings.bookingWindowDays === "number"
      ? availabilitySettings.bookingWindowDays
      : 60;
    // offDays: [0=dim, 1=lun, ...] — null signifie "utiliser les defaults côté client"
    const offDays: number[] | null = Array.isArray(availabilitySettings.offDays)
      ? (availabilitySettings.offDays as number[]).filter((n) => typeof n === "number" && n >= 0 && n <= 6)
      : null;

    // Périodes bloquées → marquer toutes les dates de la plage comme "full"
    interface BlockedRange { start: string; end: string; label?: string }
    const blockedRanges: BlockedRange[] = Array.isArray(availabilitySettings.blockedRanges)
      ? (availabilitySettings.blockedRanges as BlockedRange[]).filter(
          (r) => r && typeof r.start === "string" && typeof r.end === "string"
        )
      : [];

    for (const range of blockedRanges) {
      const start = new Date(range.start);
      const end = new Date(range.end);
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split("T")[0];
        if (!busy[dateStr]) busy[dateStr] = new Set();
        // Marquer avec un sentinel pour bloquer toute la journée
        busy[dateStr].add("__blocked__");
      }
    }

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
      JSON.stringify({ busySlots, customSlots, bookingWindowDays, offDays }),
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
