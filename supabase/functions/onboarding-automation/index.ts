/**
 * Onboarding Manager — séquence e-mails (Resend) + idempotence via inkflow_user_settings.
 * Appel : cron (pg_cron / pg_net) avec x-cron-secret: EDGE_CRON_SECRET.
 *
 * Règles (délais depuis inkflow_studios.created_at) :
 * - Bienvenue immédiate : Edge `send-tattooer-welcome` (JWT) — pas dans ce cron.
 * - 24h : relance profil si avatar / bio vitrine insuffisants
 * - 48h : relance premier flash
 * - 72h : relance Stripe Connect
 * - 14j inactivité (updated_at) : réactivation (une fois / 35j)
 * - 1ère réservation (inkflow_bookings) : e-mail félicitations
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.3";
import { getCorsHeaders } from "../_shared/cors.ts";
import { assertCronAuthorized } from "../_shared/cronGate.ts";
import { sendEmail } from "../_shared/resend.ts";
import {
  htmlFirstBookingCelebration,
  htmlReactivation,
  htmlReminderFlash,
  htmlReminderProfile,
  htmlReminderStripe,
} from "../_shared/onboardingEmailLight.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

interface StudioRow {
  id: string;
  email: string;
  studio_name: string | null;
  slug: string | null;
  avatar_url: string | null;
  created_at: string | null;
  updated_at: string | null;
  stripe_connect_charges_enabled: boolean | null;
  stripe_connect_account_id: string | null;
}

interface SettingsRow {
  studio_id: string;
  onboarding_welcome_sent_at: string | null;
  onboarding_reminder_profile_sent_at: string | null;
  onboarding_reminder_flash_sent_at: string | null;
  onboarding_reminder_stripe_sent_at: string | null;
  onboarding_reactivation_sent_at: string | null;
  onboarding_first_booking_celebration_sent_at: string | null;
  onboarding_step: number | null;
  onboarding_dismissed: boolean | null;
}

function firstName(studio: StudioRow): string {
  return (studio.studio_name || studio.email?.split("@")[0] || "toi").trim().slice(0, 48);
}

function profileComplete(studio: StudioRow, vitrineData: Record<string, unknown> | null): boolean {
  const av = studio.avatar_url?.trim();
  const desc = typeof vitrineData?.description === "string" ? vitrineData.description.trim() : "";
  return Boolean(av && av.length > 2 && desc.length >= 25);
}

function stripeReady(s: StudioRow): boolean {
  return Boolean(s.stripe_connect_account_id?.trim()) && s.stripe_connect_charges_enabled === true;
}

async function ensureSettingsRow(
  admin: ReturnType<typeof createClient>,
  studioId: string,
  existing: SettingsRow | null,
): Promise<void> {
  if (existing) return;
  await admin.from("inkflow_user_settings").upsert(
    {
      studio_id: studioId,
      onboarding_step: 0,
      onboarding_dismissed: false,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "studio_id" },
  );
}

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const gate = assertCronAuthorized(req, origin);
  if (gate) return gate;

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!SUPABASE_URL || !SERVICE_KEY) {
    return new Response(JSON.stringify({ error: "Server configuration" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const admin = createClient(SUPABASE_URL, SERVICE_KEY);
  const now = Date.now();
  const ninetyDaysAgo = new Date(now - 90 * 86400000).toISOString();

  const { data: studios, error: stErr } = await admin
    .from("inkflow_studios")
    .select(
      "id, email, studio_name, slug, avatar_url, created_at, updated_at, stripe_connect_charges_enabled, stripe_connect_account_id",
    )
    .gte("created_at", ninetyDaysAgo)
    .order("created_at", { ascending: false })
    .limit(350);

  if (stErr || !studios?.length) {
    return new Response(
      JSON.stringify({ ok: true, processed: 0, error: stErr?.message }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  const studioIds = studios.map((s) => s.id as string);

  const { data: allSettings } = await admin
    .from("inkflow_user_settings")
    .select(
      "studio_id, onboarding_welcome_sent_at, onboarding_reminder_profile_sent_at, onboarding_reminder_flash_sent_at, onboarding_reminder_stripe_sent_at, onboarding_reactivation_sent_at, onboarding_first_booking_celebration_sent_at, onboarding_step, onboarding_dismissed",
    )
    .in("studio_id", studioIds);

  const settingsBy = new Map((allSettings ?? []).map((r) => [r.studio_id as string, r as SettingsRow]));

  const { data: vitrineRows } = await admin.from("inkflow_vitrine_data").select("studio_id, data").in("studio_id", studioIds);
  const vitrineBy = new Map<string, Record<string, unknown>>();
  for (const v of vitrineRows ?? []) {
    const d = v.data;
    if (d && typeof d === "object" && !Array.isArray(d)) {
      vitrineBy.set(v.studio_id as string, d as Record<string, unknown>);
    }
  }

  const { data: flashRows } = await admin.from("inkflow_flash_designs").select("studio_id").in("studio_id", studioIds);
  const flashCount = new Map<string, number>();
  for (const r of flashRows ?? []) {
    const id = r.studio_id as string;
    flashCount.set(id, (flashCount.get(id) ?? 0) + 1);
  }

  const { data: bookingRows } = await admin.from("inkflow_bookings").select("studio_id").in("studio_id", studioIds);
  const bookingCount = new Map<string, number>();
  for (const r of bookingRows ?? []) {
    const id = r.studio_id as string;
    bookingCount.set(id, (bookingCount.get(id) ?? 0) + 1);
  }

  const stats = {
    reminderProfile: 0,
    reminderFlash: 0,
    reminderStripe: 0,
    reactivation: 0,
    firstBooking: 0,
    skipped: 0,
    errors: 0,
  };

  const send = async (to: string, subject: string, html: string): Promise<boolean> => {
    const r = await sendEmail({ to: [to], subject, html });
    return r != null;
  };

  for (const raw of studios as StudioRow[]) {
    const studio = raw;
    if (!studio.email?.includes("@")) {
      stats.skipped++;
      continue;
    }

    let settings = settingsBy.get(studio.id) ?? null;
    await ensureSettingsRow(admin, studio.id, settings);
    if (!settings) {
      const { data: re } = await admin.from("inkflow_user_settings").select("*").eq("studio_id", studio.id).maybeSingle();
      if (re) {
        settings = re as SettingsRow;
        settingsBy.set(studio.id, settings);
      }
    }
    if (!settings) {
      stats.errors++;
      continue;
    }

    const created = studio.created_at ? new Date(studio.created_at).getTime() : now;
    const updated = studio.updated_at ? new Date(studio.updated_at).getTime() : created;
    const ageHours = (now - created) / 3600000;
    const ageDays = (now - created) / 86400000;
    const inactiveDays = (now - updated) / 86400000;

    const vit = vitrineBy.get(studio.id) ?? null;
    const profOk = profileComplete(studio, vit);
    const flashes = flashCount.get(studio.id) ?? 0;
    const bookings = bookingCount.get(studio.id) ?? 0;
    const stripeOk = stripeReady(studio);

    const patch: Partial<SettingsRow> & { studio_id: string; updated_at: string } = {
      studio_id: studio.id,
      updated_at: new Date().toISOString(),
    };

    try {
      // Bienvenue immédiat : Edge `send-tattooer-welcome` + e-mail clair (`onboarding_welcome_sent_at`).

      // Étape « première réservation »
      if (bookings >= 1 && !settings.onboarding_first_booking_celebration_sent_at) {
        const ok = await send(
          studio.email,
          "Ta première réservation InkFlow — bravo",
          htmlFirstBookingCelebration(firstName(studio)),
        );
        if (ok) {
          patch.onboarding_first_booking_celebration_sent_at = new Date().toISOString();
          stats.firstBooking++;
          await admin.from("inkflow_user_settings").upsert(patch, { onConflict: "studio_id" });
        } else stats.errors++;
        continue;
      }

      // Réactivation 14j (une fois / ~35j)
      if (
        inactiveDays >= 14 &&
        (!settings.onboarding_reactivation_sent_at ||
          (now - new Date(settings.onboarding_reactivation_sent_at).getTime()) / 86400000 >= 35)
      ) {
        const ok = await send(
          studio.email,
          "InkFlow — on reprend ensemble ?",
          htmlReactivation(firstName(studio)),
        );
        if (ok) {
          patch.onboarding_reactivation_sent_at = new Date().toISOString();
          stats.reactivation++;
          await admin.from("inkflow_user_settings").upsert(patch, { onConflict: "studio_id" });
        } else stats.errors++;
        continue;
      }

      // 1 — Relance profil 24h
      if (
        ageHours >= 24 &&
        !profOk &&
        !settings.onboarding_reminder_profile_sent_at
      ) {
        const ok = await send(
          studio.email,
          "Ta vitrine attend ton style — 2 min",
          htmlReminderProfile(firstName(studio)),
        );
        if (ok) {
          patch.onboarding_reminder_profile_sent_at = new Date().toISOString();
          stats.reminderProfile++;
          await admin.from("inkflow_user_settings").upsert(patch, { onConflict: "studio_id" });
        } else stats.errors++;
        continue;
      }

      // 2 — Flash 48h
      if (
        ageHours >= 48 &&
        flashes === 0 &&
        !settings.onboarding_reminder_flash_sent_at
      ) {
        const ok = await send(
          studio.email,
          "Ajoute ton premier flash — tes clients peuvent réserver",
          htmlReminderFlash(firstName(studio)),
        );
        if (ok) {
          patch.onboarding_reminder_flash_sent_at = new Date().toISOString();
          stats.reminderFlash++;
          await admin.from("inkflow_user_settings").upsert(patch, { onConflict: "studio_id" });
        } else stats.errors++;
        continue;
      }

      // 3 — Stripe 72h
      if (
        ageHours >= 72 &&
        !stripeOk &&
        !settings.onboarding_reminder_stripe_sent_at
      ) {
        const ok = await send(
          studio.email,
          "Sécurise tes créneaux — connecte Stripe",
          htmlReminderStripe(firstName(studio)),
        );
        if (ok) {
          patch.onboarding_reminder_stripe_sent_at = new Date().toISOString();
          stats.reminderStripe++;
          await admin.from("inkflow_user_settings").upsert(patch, { onConflict: "studio_id" });
        } else stats.errors++;
        continue;
      }

      stats.skipped++;
    } catch (e) {
      console.error("[onboarding-automation]", studio.id, e);
      stats.errors++;
    }
  }

  return new Response(JSON.stringify({ ok: true, stats }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
