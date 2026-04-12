/**
 * Retourne les créneaux occupés pour un studio (appointments + bookings confirmés).
 * Prend en compte:
 * - Les horaires hebdomadaires par jour (weeklySchedule)
 * - Les pauses configurées par jour
 * - Le buffer time entre clients
 * - La marge de sécurité (overrun margin)
 * - Le délai minimum de réservation
 * - Le nombre max de RDV par jour
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.3";
import { getCorsHeaders } from "../_shared/cors.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

interface DaySchedule {
  enabled: boolean;
  open: string;
  close: string;
  breaks: { start: string; end: string }[];
}

interface WeeklySchedule {
  monday?: DaySchedule;
  tuesday?: DaySchedule;
  wednesday?: DaySchedule;
  thursday?: DaySchedule;
  friday?: DaySchedule;
  saturday?: DaySchedule;
  sunday?: DaySchedule;
}

interface BlockedRange {
  start: string;
  end: string;
  label?: string;
}

interface AvailabilitySettings {
  customSlots?: string[];
  offDays?: number[];
  bookingWindowDays?: number;
  blockedRanges?: BlockedRange[];
  slotDuration?: number;
  bufferTime?: number;
  overrunMargin?: number;
  maxDailyBookings?: number;
  advanceBookingDays?: number;
  weeklySchedule?: WeeklySchedule;
}

const DAY_NAMES = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;

function normalizeTime(t: string | null): string | null {
  if (!t) return null;
  const s = String(t).trim().toLowerCase();
  if (/^\d{1,2}:\d{2}$/.test(s)) return s.padStart(5, '0');
  if (s === "morning") return "10:00";
  if (s === "afternoon") return "14:00";
  if (s === "evening") return "18:00";
  return s;
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

function addToBusy(acc: Record<string, Set<string>>, date: string, time: string | null) {
  if (!time) return;
  const d = date.split("T")[0];
  if (!acc[d]) acc[d] = new Set();
  acc[d].add(time);
}

/**
 * Génère les créneaux disponibles pour un jour donné en fonction des paramètres
 */
function generateSlotsForDay(
  daySchedule: DaySchedule | undefined,
  slotDuration: number,
  bufferTime: number
): string[] {
  if (!daySchedule?.enabled) return [];
  
  const slots: string[] = [];
  const openMin = timeToMinutes(daySchedule.open);
  const closeMin = timeToMinutes(daySchedule.close);
  const totalSlotTime = slotDuration + bufferTime;
  
  // Générer les créneaux entre open et close
  for (let currentMin = openMin; currentMin + slotDuration <= closeMin; currentMin += totalSlotTime) {
    const slotTime = minutesToTime(currentMin);
    
    // Vérifier que le créneau ne chevauche pas une pause
    let inBreak = false;
    for (const brk of daySchedule.breaks || []) {
      const breakStart = timeToMinutes(brk.start);
      const breakEnd = timeToMinutes(brk.end);
      const slotEnd = currentMin + slotDuration;
      
      // Le créneau chevauche la pause si:
      // - Le début du créneau est pendant la pause, OU
      // - La fin du créneau est pendant la pause, OU
      // - Le créneau englobe la pause
      if (
        (currentMin >= breakStart && currentMin < breakEnd) ||
        (slotEnd > breakStart && slotEnd <= breakEnd) ||
        (currentMin <= breakStart && slotEnd >= breakEnd)
      ) {
        inBreak = true;
        break;
      }
    }
    
    if (!inBreak) {
      slots.push(slotTime);
    }
  }
  
  return slots;
}

/**
 * Calcule les créneaux bloqués par le buffer après un RDV existant
 */
function getBufferBlockedSlots(
  existingTime: string,
  slotDuration: number,
  bufferTime: number,
  overrunMargin: number,
  allSlots: string[]
): string[] {
  if (bufferTime <= 0 && overrunMargin <= 0) return [];
  
  const blocked: string[] = [];
  const existingStart = timeToMinutes(existingTime);
  const existingEnd = existingStart + slotDuration + overrunMargin;
  const bufferEnd = existingEnd + bufferTime;
  
  for (const slot of allSlots) {
    const slotMin = timeToMinutes(slot);
    // Le créneau est bloqué s'il commence avant la fin du buffer
    if (slotMin > existingStart && slotMin < bufferEnd) {
      blocked.push(slot);
    }
  }
  
  return blocked;
}

Deno.serve(async (req: Request) => {
  const corsHeaders = getCorsHeaders(req.headers.get("origin"));
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

    // Récupérer les paramètres du studio
    const { data: studioData } = await supabase
      .from("inkflow_studios")
      .select("availability_settings")
      .eq("id", studioId)
      .single();

    const settings: AvailabilitySettings = (studioData?.availability_settings as AvailabilitySettings | null) ?? {};
    
    // Paramètres avec valeurs par défaut
    const customSlots: string[] = Array.isArray(settings.customSlots)
      ? settings.customSlots.filter((s) => typeof s === "string" && /^\d{1,2}:\d{2}$/.test(s))
      : [];
    const bookingWindowDays: number = typeof settings.bookingWindowDays === "number" ? settings.bookingWindowDays : 60;
    const offDays: number[] | null = Array.isArray(settings.offDays)
      ? settings.offDays.filter((n) => typeof n === "number" && n >= 0 && n <= 6)
      : null;
    const slotDuration: number = typeof settings.slotDuration === "number" ? settings.slotDuration : 60;
    const bufferTime: number = typeof settings.bufferTime === "number" ? settings.bufferTime : 0;
    const overrunMargin: number = typeof settings.overrunMargin === "number" ? settings.overrunMargin : 0;
    const maxDailyBookings: number = typeof settings.maxDailyBookings === "number" ? settings.maxDailyBookings : 8;
    const advanceBookingDays: number = typeof settings.advanceBookingDays === "number" ? settings.advanceBookingDays : 0;
    const weeklySchedule: WeeklySchedule = settings.weeklySchedule && typeof settings.weeklySchedule === "object" 
      ? settings.weeklySchedule 
      : {};

    // Périodes bloquées
    const blockedRanges: BlockedRange[] = Array.isArray(settings.blockedRanges)
      ? settings.blockedRanges.filter((r) => r && typeof r.start === "string" && typeof r.end === "string")
      : [];

    for (const range of blockedRanges) {
      const start = new Date(range.start);
      const end = new Date(range.end);
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split("T")[0];
        if (!busy[dateStr]) busy[dateStr] = new Set();
        busy[dateStr].add("__blocked__");
      }
    }

    // Récupérer les RDV existants
    const { data: appointments } = await supabase
      .from("inkflow_appointments")
      .select("date, time")
      .eq("studio_id", studioId)
      .gte("date", today)
      .in("status", ["pending", "confirmed", "in_progress", "completed"]);

    const existingAppointments: { date: string; time: string }[] = [];
    (appointments || []).forEach((r) => {
      const date = (r.date as string)?.toString?.()?.split?.("T")?.[0];
      const time = normalizeTime((r.time as string)?.toString?.()?.trim?.());
      if (date && time) {
        addToBusy(busy, date, time);
        existingAppointments.push({ date, time });
      }
    });

    // Récupérer les réservations confirmées
    const { data: bookings } = await supabase
      .from("inkflow_bookings")
      .select("requested_date, requested_time")
      .eq("studio_id", studioId)
      .gte("requested_date", today)
      .in("status", ["confirmed", "accepted"]);

    (bookings || []).forEach((r) => {
      const date = (r.requested_date as string)?.toString?.()?.split?.("T")?.[0];
      const time = normalizeTime((r.requested_time as string) ?? null);
      if (date && time) {
        addToBusy(busy, date, time);
        existingAppointments.push({ date, time });
      }
    });

    // Compter les RDV par jour pour maxDailyBookings
    const dailyCount: Record<string, number> = {};
    existingAppointments.forEach(({ date }) => {
      dailyCount[date] = (dailyCount[date] || 0) + 1;
    });

    // Marquer les jours complets si maxDailyBookings atteint
    for (const [date, count] of Object.entries(dailyCount)) {
      if (count >= maxDailyBookings) {
        if (!busy[date]) busy[date] = new Set();
        busy[date].add("__full__");
      }
    }

    // Générer les créneaux dynamiques par jour si weeklySchedule est configuré
    const dynamicSlotsByDay: Record<number, string[]> = {};
    if (Object.keys(weeklySchedule).length > 0) {
      for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
        const dayName = DAY_NAMES[dayIndex];
        const daySchedule = weeklySchedule[dayName];
        dynamicSlotsByDay[dayIndex] = generateSlotsForDay(daySchedule, slotDuration, bufferTime);
      }
    }

    // Appliquer les buffers pour les créneaux existants
    // Bloquer les créneaux qui seraient trop proches d'un RDV existant
    for (const { date, time } of existingAppointments) {
      const dateObj = new Date(date + "T00:00:00");
      const dayIndex = dateObj.getDay();
      
      // Déterminer les créneaux possibles pour ce jour
      let allSlots: string[];
      if (Object.keys(dynamicSlotsByDay).length > 0) {
        allSlots = dynamicSlotsByDay[dayIndex] || [];
      } else if (customSlots.length > 0) {
        allSlots = customSlots;
      } else {
        allSlots = ["10:00", "12:00", "14:00", "16:00", "18:00"];
      }
      
      // Trouver les créneaux bloqués par le buffer
      const bufferBlocked = getBufferBlockedSlots(time, slotDuration, bufferTime, overrunMargin, allSlots);
      for (const blockedSlot of bufferBlocked) {
        addToBusy(busy, date, blockedSlot);
      }
    }

    // Convertir Sets en arrays
    const busySlots: Record<string, string[]> = {};
    Object.entries(busy).forEach(([d, set]) => {
      busySlots[d] = Array.from(set);
    });

    // Retourner les paramètres étendus
    return new Response(
      JSON.stringify({
        busySlots,
        customSlots,
        bookingWindowDays,
        offDays,
        // Nouveaux paramètres
        slotDuration,
        bufferTime,
        overrunMargin,
        maxDailyBookings,
        advanceBookingDays,
        weeklySchedule: Object.keys(weeklySchedule).length > 0 ? weeklySchedule : null,
        dynamicSlotsByDay: Object.keys(dynamicSlotsByDay).length > 0 ? dynamicSlotsByDay : null,
      }),
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
