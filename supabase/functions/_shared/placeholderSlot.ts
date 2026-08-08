/**
 * Créneau « placeholder » pour un RDV sans date choisie (ex. flash vitrine payé en ligne).
 * Aligné sur lib/supabaseBookings.ts — évite collision avec RDV existants sur (studio, date, heure).
 */
import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.95.3";

const PLACEHOLDER_SLOT_TIMES = [
  "09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "12:00", "12:30",
  "13:00", "13:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30",
  "17:00", "17:30", "18:00", "18:30", "19:00",
];

function normalizeTime(t: string | null | undefined): string {
  if (t == null || !String(t).trim()) return "10:00";
  const s = String(t).trim();
  if (/^\d{1,2}:\d{2}$/.test(s)) return s;
  return s;
}

/**
 * Premier créneau libre sur ~120 jours pour insérer un RDV sans chevauchement évident.
 */
export async function findNextAvailablePlaceholderSlot(
  supabase: SupabaseClient,
  studioId: string,
): Promise<{ date: string; time: string }> {
  const start = new Date();
  const endLimit = new Date(start);
  endLimit.setDate(endLimit.getDate() + 120);
  const from = start.toISOString().split("T")[0];
  const to = endLimit.toISOString().split("T")[0];

  const { data: occupiedRows, error: occErr } = await supabase
    .from("inkflow_appointments")
    .select("date, time")
    .eq("studio_id", studioId)
    .gte("date", from)
    .lte("date", to);
  if (occErr) throw occErr;

  const aptOccupied = new Set(
    (occupiedRows || []).map((r) => `${String(r.date)}|${normalizeTime(String(r.time ?? ""))}`),
  );

  const { data: bookingRows, error: bookErr } = await supabase
    .from("inkflow_bookings")
    .select("requested_date, requested_time")
    .eq("studio_id", studioId)
    .gte("requested_date", from)
    .lte("requested_date", to)
    .in("status", ["confirmed", "accepted"]);
  if (bookErr) throw bookErr;

  const bookingOccupied = new Set(
    (bookingRows || []).map((b) => {
      const rd = (b as { requested_date?: string }).requested_date;
      const rt = (b as { requested_time?: string | null }).requested_time;
      return `${String(rd)}|${normalizeTime(rt ?? null)}`;
    }),
  );

  for (let dayOffset = 0; dayOffset < 120; dayOffset++) {
    const d = new Date(start);
    d.setDate(d.getDate() + dayOffset);
    const dateStr = d.toISOString().split("T")[0];
    for (const time of PLACEHOLDER_SLOT_TIMES) {
      const key = `${dateStr}|${time}`;
      if (aptOccupied.has(key) || bookingOccupied.has(key)) continue;
      return { date: dateStr, time };
    }
  }

  throw new Error("placeholder_slot_unavailable");
}
