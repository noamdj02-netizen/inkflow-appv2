/**
 * Agrégats Founder Dashboard — FOUNDER_ADMIN_EMAILS (secret) et/ou domaines équipe @ink-flow.me, @inkflow.me.
 * JWT vérifié via getGoTrueUser ; email confirmé obligatoire (auth.admin.getUserById).
 *
 * Par défaut, les KPIs **studio** sont filtrés sur les comptes tatoueurs réels
 * (`FOUNDER_METRICS_STUDIO_EMAILS`, défaut : luiink.stories.pro@gmail.com, safeplacerouen@gmail.com).
 * Pour revoir toute la plateforme (tests internes) : `FOUNDER_METRICS_INCLUDE_ALL_STUDIOS=true`.
 *
 * Aucune PII client (noms/emails clients) dans la réponse — uniquement métriques & slugs studio publics.
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.3";
import { DateTime } from "https://esm.sh/luxon@3.5.0";
import { getCorsHeaders } from "../_shared/cors.ts";
import { getGoTrueUser } from "../_shared/supabaseAuth.ts";

interface FounderMetricsResponse {
  generatedAt: string;
  kpis: {
    /** Comptes Supabase Auth (pagination admin). -1 si indisponible. */
    totalAuthUsers: number;
    totalStudios: number;
    /** Fiches CRM côté studios (inkflow_clients), agrégé. */
    crmClientsTotal: number;
    /** Abonnements Stripe actifs (par studio dédupliqué). */
    subscribedActive: number;
    /** En période d’essai. */
    subscribedTrialing: number;
    /** MRR SaaS InkFlow estimé (somme des plans actifs + trialing). */
    mrrEstimatedEur: number;
    studiosActive7d: number;
    bookingsTodayParis: number;
    /** Bookings créés sur les 30 derniers jours (volume plateforme). */
    bookingsCreated30d: number;
    /**
     * Volume d’acomptes encaissés via InkFlow ce mois (argent des clients finaux vers les studios — pas ton revenu SaaS).
     */
    depositsMonthEur: number;
  };
  /** Paiements / friction côté base (complète les alertes produit). */
  health: {
    paymentsFailedMonth: number;
    paymentsPendingStale7d: number;
  };
  activity: {
    signupsByDay: { date: string; count: number }[];
    onboardingActivationRate: number;
    onboardingStepDistribution: { step: string; count: number }[];
    projectRequestsByStatus: { status: string; count: number }[];
    projectAcceptanceRate: number | null;
  };
  alerts: {
    studiosStuckOnboarding: number;
    unpaidDepositsOver48h: number;
    /** Rappels outillage — logs réels : Sentry / Supabase Dashboard. */
    suspiciousAuthNote: string;
    studiosInactive14d: number;
    /** Cohort 365j, créés il y a &gt; 48h, aucun flash */
    studiosNoFlashAfter48h: number;
    /** Cohort 365j, créés il y a &gt; 72h, Stripe pas prêt (charges) */
    studiosNoStripeAfter72h: number;
  };
  growth: {
    churnSubscriptionsMonth: number;
    planDistribution: { plan: string; count: number }[];
    topStudios: { studioId: string; slug: string; bookings30d: number }[];
    geography: { city: string; studioCount: number; lat: number | null; lng: number | null }[];
  };
}

function parseFounderEmails(raw: string): Set<string> {
  return new Set(
    raw.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean),
  );
}

/** E-mails des studios « réels » (tatoueurs) — exclut les comptes de test du fondateur. */
const DEFAULT_FOUNDER_METRICS_STUDIO_EMAILS =
  "luiink.stories.pro@gmail.com,safeplacerouen@gmail.com";

function founderMetricsIncludeAllStudios(): boolean {
  const v = (Deno.env.get("FOUNDER_METRICS_INCLUDE_ALL_STUDIOS") ?? "").trim().toLowerCase();
  return v === "true" || v === "1" || v === "yes";
}

/**
 * Liste d’IDs studio à inclure dans les agrégats.
 * - `null` = pas de filtre (toute la plateforme, `FOUNDER_METRICS_INCLUDE_ALL_STUDIOS`).
 * - `[]` = aucun studio ne correspond aux e-mails configurés → métriques studio à 0.
 */
async function resolveFounderMetricsStudioIds(
  admin: ReturnType<typeof createClient>,
  allow: Set<string> | null,
): Promise<string[] | null> {
  if (allow === null) return null;
  if (allow.size === 0) return [];

  const { data: rows } = await admin.from("inkflow_studios").select("id, email");
  const ids: string[] = [];
  for (const r of rows ?? []) {
    const em = (r.email as string | null | undefined)?.trim().toLowerCase() ?? "";
    if (allow.has(em)) ids.push(r.id as string);
  }
  return ids;
}

/** Même logique que `lib/inkflowInternalStaff.ts` — domaines officiels équipe produit. */
function isInkflowTeamDomainEmail(email: string): boolean {
  const e = email.trim().toLowerCase();
  return e.endsWith("@ink-flow.me") || e.endsWith("@inkflow.me");
}

function planToMrrEur(plan: string, priceMap: Record<string, number>): number {
  const p = (plan || "").toLowerCase().trim();
  if (priceMap[p] != null) return priceMap[p];
  if (p === "starter" || p === "solo" || p === "basic") return priceMap["starter"] ?? 29;
  if (p === "pro") return priceMap["pro"] ?? 49;
  if (p === "studio") return priceMap["studio"] ?? 79;
  return 0;
}

function dedupeSubscriptions(
  rows: { studio_id: string; plan: string; status: string; updated_at: string | null }[],
): { studio_id: string; plan: string; status: string; updated_at: string | null }[] {
  const byStudio = new Map<string, (typeof rows)[0]>();
  for (const r of rows) {
    const cur = byStudio.get(r.studio_id);
    if (!cur) {
      byStudio.set(r.studio_id, r);
      continue;
    }
    const ca = cur.updated_at ?? "";
    const cb = r.updated_at ?? "";
    if (cb > ca) byStudio.set(r.studio_id, r);
  }
  return [...byStudio.values()];
}

Deno.serve(async (req: Request) => {
  const corsHeaders = getCorsHeaders(req.headers.get("origin"));
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }
  if (req.method !== "GET" && req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  const founderRaw = Deno.env.get("FOUNDER_ADMIN_EMAILS") ?? "";

  const priceMap: Record<string, number> = {
    starter: Number(Deno.env.get("FOUNDER_MRR_STARTER_EUR") ?? "29") || 29,
    pro: Number(Deno.env.get("FOUNDER_MRR_PRO_EUR") ?? "49") || 49,
    studio: Number(Deno.env.get("FOUNDER_MRR_STUDIO_EUR") ?? "79") || 79,
  };

  const allowed = parseFounderEmails(founderRaw);

  const auth = req.headers.get("Authorization") ?? "";
  const bearer = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  const user = await getGoTrueUser(supabaseUrl, anonKey, bearer);
  const emailLower = user?.email?.trim().toLowerCase() ?? "";
  const teamDomain = emailLower ? isInkflowTeamDomainEmail(emailLower) : false;

  if (!emailLower) {
    return new Response(JSON.stringify({ error: "Forbidden" }), {
      status: 403,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!teamDomain && allowed.size === 0) {
    return new Response(
      JSON.stringify({ error: "FOUNDER_ADMIN_EMAILS not configured" }),
      { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  if (!teamDomain && !allowed.has(emailLower)) {
    return new Response(JSON.stringify({ error: "Forbidden" }), {
      status: 403,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: authUser, error: authErr } = await admin.auth.admin.getUserById(user.id);
  if (authErr || !authUser?.user?.email_confirmed_at) {
    return new Response(
      JSON.stringify({ error: "Email verification required" }),
      { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  const includeAllStudios = founderMetricsIncludeAllStudios();
  const metricsEmailsRaw =
    Deno.env.get("FOUNDER_METRICS_STUDIO_EMAILS")?.trim() ||
    DEFAULT_FOUNDER_METRICS_STUDIO_EMAILS;
  const metricsEmailAllow = includeAllStudios ? null : parseFounderEmails(metricsEmailsRaw);
  const studioIdsForMetrics = await resolveFounderMetricsStudioIds(admin, metricsEmailAllow);

  const now = DateTime.now();
  const startParisToday = now.setZone("Europe/Paris").startOf("day").toUTC().toISO() ?? "";
  const endParisToday = now.setZone("Europe/Paris").endOf("day").toUTC().toISO() ?? "";
  const sevenDaysAgo = now.minus({ days: 7 }).toUTC().toISO() ?? "";
  const fourteenDaysAgo = now.minus({ days: 14 }).toUTC().toISO() ?? "";
  const thirtyDaysAgo = now.minus({ days: 30 }).toUTC().toISO() ?? "";
  const monthStartParis = now.setZone("Europe/Paris").startOf("month").toUTC().toISO() ?? "";
  const sevenDaysAgoJoin = now.minus({ days: 7 }).toUTC().toISO() ?? "";
  const sevenDaysAgoPayments = now.minus({ days: 7 }).toUTC().toISO() ?? "";

  const studioFilterActive = studioIdsForMetrics !== null;
  const studioIdList = studioIdsForMetrics ?? [];
  const noMatchingStudios = studioFilterActive && studioIdList.length === 0;

  // --- Comptes Auth (pagination) — filtrés sur les e-mails « studios réels » si configuré ---
  let totalAuthUsers = 0;
  let authUsersListError = false;
  try {
    let page = 1;
    const perPage = 1000;
    for (;;) {
      const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
      if (error) {
        authUsersListError = true;
        console.error("[admin-founder-metrics] listUsers:", error.message);
        break;
      }
      if (metricsEmailAllow) {
        for (const u of data.users) {
          const em = u.email?.trim().toLowerCase() ?? "";
          if (metricsEmailAllow.has(em)) totalAuthUsers++;
        }
      } else {
        totalAuthUsers += data.users.length;
      }
      if (data.users.length < perPage) break;
      page += 1;
      if (page > 200) break;
    }
  } catch (e) {
    authUsersListError = true;
    console.error("[admin-founder-metrics] listUsers exception:", e);
  }
  if (authUsersListError) totalAuthUsers = -1;

  let crmClientsTotal = 0;
  if (!noMatchingStudios) {
    let qCrm = admin.from("inkflow_clients").select("id", {
      count: "exact",
      head: true,
    });
    if (studioFilterActive) qCrm = qCrm.in("studio_id", studioIdList);
    const { count } = await qCrm;
    crmClientsTotal = count ?? 0;
  }

  let paymentsFailedMonth = 0;
  if (!noMatchingStudios) {
    let qF = admin.from("inkflow_payments").select("id", {
      count: "exact",
      head: true,
    }).eq("status", "failed").gte("created_at", monthStartParis);
    if (studioFilterActive) qF = qF.in("studio_id", studioIdList);
    const { count } = await qF;
    paymentsFailedMonth = count ?? 0;
  }

  let paymentsPendingStale7d = 0;
  if (!noMatchingStudios) {
    let qP = admin.from("inkflow_payments").select("id", {
      count: "exact",
      head: true,
    }).eq("status", "pending").lt("created_at", sevenDaysAgoPayments);
    if (studioFilterActive) qP = qP.in("studio_id", studioIdList);
    const { count } = await qP;
    paymentsPendingStale7d = count ?? 0;
  }

  // --- KPIs ---
  let bookStudios: { studio_id: string }[] = [];
  let apptStudios: { studio_id: string }[] = [];
  let updStudios: { id: string }[] = [];
  if (!noMatchingStudios) {
    let qb = admin.from("inkflow_bookings").select("studio_id").gte("created_at", sevenDaysAgo);
    if (studioFilterActive) qb = qb.in("studio_id", studioIdList);
    const br = await qb;
    bookStudios = br.data ?? [];

    let qa = admin.from("inkflow_appointments").select("studio_id").gte("created_at", sevenDaysAgo);
    if (studioFilterActive) qa = qa.in("studio_id", studioIdList);
    const ar = await qa;
    apptStudios = ar.data ?? [];

    let qu = admin.from("inkflow_studios").select("id").gte("updated_at", sevenDaysAgo);
    if (studioFilterActive) qu = qu.in("id", studioIdList);
    const ur = await qu;
    updStudios = ur.data ?? [];
  }
  const activeSet = new Set<string>();
  (bookStudios ?? []).forEach((r) => {
    activeSet.add(r.studio_id);
  });
  (apptStudios ?? []).forEach((r) => {
    activeSet.add(r.studio_id);
  });
  (updStudios ?? []).forEach((r) => {
    activeSet.add(r.id);
  });
  const studiosActive7d = activeSet.size;

  let allSubs: { studio_id: string; plan: string; status: string; updated_at: string | null }[] = [];
  if (!noMatchingStudios) {
    let qs = admin.from("inkflow_subscriptions").select(
      "studio_id, plan, status, updated_at",
    ).in("status", ["active", "trialing"]);
    if (studioFilterActive) qs = qs.in("studio_id", studioIdList);
    const sr = await qs;
    allSubs = sr.data ?? [];
  }
  const activeSubs = dedupeSubscriptions(allSubs ?? []);
  let mrrEstimatedEur = 0;
  let subscribedActive = 0;
  let subscribedTrialing = 0;
  for (const s of activeSubs) {
    mrrEstimatedEur += planToMrrEur(s.plan, priceMap);
    const st = (s.status || "").toLowerCase();
    if (st === "active") subscribedActive++;
    else if (st === "trialing") subscribedTrialing++;
  }

  let bookingsCreated30d = 0;
  if (!noMatchingStudios) {
    let qbc = admin.from("inkflow_bookings").select("id", {
      count: "exact",
      head: true,
    }).gte("created_at", thirtyDaysAgo);
    if (studioFilterActive) qbc = qbc.in("studio_id", studioIdList);
    const { count } = await qbc;
    bookingsCreated30d = count ?? 0;
  }

  let bookingsTodayParis = 0;
  if (!noMatchingStudios) {
    let qbt = admin.from("inkflow_bookings").select("id", {
      count: "exact",
      head: true,
    }).gte("created_at", startParisToday).lte("created_at", endParisToday);
    if (studioFilterActive) qbt = qbt.in("studio_id", studioIdList);
    const { count } = await qbt;
    bookingsTodayParis = count ?? 0;
  }

  let depositsMonthEur = 0;
  if (!noMatchingStudios) {
    let qpm = admin.from("inkflow_payments").select("amount").in("status", ["completed", "paid"]).gte(
      "created_at",
      monthStartParis,
    );
    if (studioFilterActive) qpm = qpm.in("studio_id", studioIdList);
    const { data: paymentsMonth } = await qpm;
    for (const p of paymentsMonth ?? []) {
      const a = typeof p.amount === "number" ? p.amount : 0;
      depositsMonthEur += a;
    }
  }

  // --- Activity: signups 30d ---
  let studioCreates: { created_at: string | null }[] = [];
  if (!noMatchingStudios) {
    let qsc = admin.from("inkflow_studios").select("created_at").gte("created_at", thirtyDaysAgo);
    if (studioFilterActive) qsc = qsc.in("id", studioIdList);
    const scr = await qsc;
    studioCreates = scr.data ?? [];
  }
  const signupsByDayMap = new Map<string, number>();
  for (let i = 0; i < 30; i++) {
    const d = now.minus({ days: 29 - i }).setZone("Europe/Paris").toFormat("yyyy-LL-dd");
    signupsByDayMap.set(d, 0);
  }
  for (const r of studioCreates ?? []) {
    if (!r.created_at) continue;
    const d = DateTime.fromISO(r.created_at).setZone("Europe/Paris").toFormat("yyyy-LL-dd");
    signupsByDayMap.set(d, (signupsByDayMap.get(d) ?? 0) + 1);
  }
  const signupsByDay = [...signupsByDayMap.entries()].map(([date, count]) => ({ date, count }));

  let totalStudios = 0;
  if (noMatchingStudios) totalStudios = 0;
  else if (studioFilterActive) totalStudios = studioIdList.length;
  else {
    const { count } = await admin.from("inkflow_studios").select("id", { count: "exact", head: true });
    totalStudios = count ?? 0;
  }

  let settingsRows: { onboarding_step: number | null }[] = [];
  if (!noMatchingStudios) {
    let qset = admin.from("inkflow_user_settings").select("onboarding_step");
    if (studioFilterActive) qset = qset.in("studio_id", studioIdList);
    const setr = await qset;
    settingsRows = setr.data ?? [];
  }
  let step3 = 0;
  for (const u of settingsRows ?? []) {
    if ((u.onboarding_step ?? 0) >= 3) step3++;
  }
  const onboardingActivationRate = totalStudios && totalStudios > 0
    ? Math.round((step3 / totalStudios) * 1000) / 10
    : 0;

  const stepBuckets: Record<string, number> = { "0-2": 0, "3+": 0 };
  for (const u of settingsRows ?? []) {
    const s = u.onboarding_step ?? 0;
    if (s >= 3) stepBuckets["3+"]++;
    else stepBuckets["0-2"]++;
  }
  const onboardingStepDistribution = [
    { step: "Étapes 0–2", count: stepBuckets["0-2"] },
    { step: "Étape 3+", count: stepBuckets["3+"] },
  ];

  let prAll: { status: string | null }[] = [];
  if (!noMatchingStudios) {
    let qpr = admin.from("inkflow_project_requests").select("status");
    if (studioFilterActive) qpr = qpr.in("studio_id", studioIdList);
    const prr = await qpr;
    prAll = prr.data ?? [];
  }
  const statusCount = new Map<string, number>();
  for (const r of prAll ?? []) {
    const st = (r.status || "unknown").toLowerCase();
    statusCount.set(st, (statusCount.get(st) ?? 0) + 1);
  }
  const projectRequestsByStatus = [...statusCount.entries()].map(([status, count]) => ({ status, count })).sort(
    (a, b) => b.count - a.count,
  );

  const acceptedLike = (s: string) =>
    ["accepted", "confirmed", "deposit_paid", "completed"].includes(s.toLowerCase());
  const rejectedLike = (s: string) => s.toLowerCase() === "rejected";
  let acc = 0;
  let rej = 0;
  for (const r of prAll ?? []) {
    const s = (r.status || "").toLowerCase();
    if (acceptedLike(s)) acc++;
    if (rejectedLike(s)) rej++;
  }
  const projectAcceptanceRate = acc + rej > 0 ? Math.round((acc / (acc + rej)) * 1000) / 10 : null;

  // --- Alerts ---
  let oldStudios: { id: string; created_at: string | null }[] = [];
  if (!noMatchingStudios) {
    let qos = admin.from("inkflow_studios").select("id, created_at").lt(
      "created_at",
      sevenDaysAgoJoin,
    );
    if (studioFilterActive) qos = qos.in("id", studioIdList);
    const osr = await qos;
    oldStudios = osr.data ?? [];
  }
  let setAll: { studio_id: string; onboarding_step: number | null }[] = [];
  if (!noMatchingStudios) {
    let qsa = admin.from("inkflow_user_settings").select("studio_id, onboarding_step");
    if (studioFilterActive) qsa = qsa.in("studio_id", studioIdList);
    const sar = await qsa;
    setAll = sar.data ?? [];
  }
  const settingsByStudio = new Map((setAll ?? []).map((x) => [x.studio_id, x.onboarding_step]));
  let studiosStuckOnboarding = 0;
  for (const st of oldStudios ?? []) {
    const step = settingsByStudio.get(st.id);
    if (step == null || step < 3) studiosStuckOnboarding++;
  }

  const cutoff48h = now.minus({ hours: 48 }).toUTC().toISO() ?? "";
  let unpaidDepositsOver48h = 0;
  if (!noMatchingStudios) {
    let qud = admin.from("inkflow_appointments").select("id", {
      count: "exact",
      head: true,
    }).in("status", ["pending", "confirmed"]).eq("deposit_paid", false).lt("created_at", cutoff48h);
    if (studioFilterActive) qud = qud.in("studio_id", studioIdList);
    const { count } = await qud;
    unpaidDepositsOver48h = count ?? 0;
  }

  let studiosInactive14d = 0;
  if (!noMatchingStudios) {
    let qin = admin.from("inkflow_studios").select("id", {
      count: "exact",
      head: true,
    }).lt("updated_at", fourteenDaysAgo);
    if (studioFilterActive) qin = qin.in("id", studioIdList);
    const { count } = await qin;
    studiosInactive14d = count ?? 0;
  }

  const oneYearAgo = now.minus({ days: 365 }).toUTC().toISO() ?? "";
  const fortyEightHoursAgo = now.minus({ hours: 48 }).toUTC().toISO() ?? "";
  const seventyTwoHoursAgo = now.minus({ hours: 72 }).toUTC().toISO() ?? "";

  let flashCohort: { id: string }[] = [];
  if (!noMatchingStudios) {
    let qfc = admin.from("inkflow_studios").select("id").gte(
      "created_at",
      oneYearAgo,
    ).lt("created_at", fortyEightHoursAgo);
    if (studioFilterActive) qfc = qfc.in("id", studioIdList);
    const fcr = await qfc;
    flashCohort = fcr.data ?? [];
  }
  const flashEligibleIds = (flashCohort ?? []).map((r) => r.id as string);
  let studiosNoFlashAfter48h = 0;
  if (flashEligibleIds.length > 0) {
    const { data: withFlash } = await admin.from("inkflow_flash_designs").select("studio_id").in(
      "studio_id",
      flashEligibleIds,
    );
    const got = new Set((withFlash ?? []).map((r) => r.studio_id as string));
    for (const id of flashEligibleIds) {
      if (!got.has(id)) studiosNoFlashAfter48h++;
    }
  }

  let stripeCohort: {
    id: string;
    stripe_connect_account_id: string | null;
    stripe_connect_charges_enabled: boolean | null;
  }[] = [];
  if (!noMatchingStudios) {
    let qst = admin
      .from("inkflow_studios")
      .select("id, stripe_connect_account_id, stripe_connect_charges_enabled")
      .gte("created_at", oneYearAgo)
      .lt("created_at", seventyTwoHoursAgo);
    if (studioFilterActive) qst = qst.in("id", studioIdList);
    const str = await qst;
    stripeCohort = str.data ?? [];
  }
  let studiosNoStripeAfter72h = 0;
  for (const s of stripeCohort ?? []) {
    const ok = Boolean((s.stripe_connect_account_id as string | null)?.trim()) &&
      s.stripe_connect_charges_enabled === true;
    if (!ok) studiosNoStripeAfter72h++;
  }

  const suspiciousAuthNote =
    "Logs auth sensibles : consulter Supabase Dashboard → Authentication / Logs ou projets Sentry (pas de table auth_suspicious_logs exposée à l’API).";

  // --- Growth ---
  let churnSubscriptionsMonth = 0;
  if (!noMatchingStudios) {
    let qch = admin.from("inkflow_subscriptions").select("id", {
      count: "exact",
      head: true,
    }).in("status", ["canceled", "cancelled"]).gte("updated_at", monthStartParis);
    if (studioFilterActive) qch = qch.in("studio_id", studioIdList);
    const { count } = await qch;
    churnSubscriptionsMonth = count ?? 0;
  }

  let studioPlans: { plan_type: string | null }[] = [];
  if (!noMatchingStudios) {
    let qpl = admin.from("inkflow_studios").select("plan_type");
    if (studioFilterActive) qpl = qpl.in("id", studioIdList);
    const plr = await qpl;
    studioPlans = plr.data ?? [];
  }
  const planDist = new Map<string, number>();
  for (const r of studioPlans ?? []) {
    const k = (r.plan_type || "?").toLowerCase();
    planDist.set(k, (planDist.get(k) ?? 0) + 1);
  }
  const planDistribution = [...planDist.entries()].map(([plan, count]) => ({ plan, count })).sort(
    (a, b) => b.count - a.count,
  );

  let bookings30: { studio_id: string }[] = [];
  if (!noMatchingStudios) {
    let qb30 = admin.from("inkflow_bookings").select("studio_id").gte(
      "created_at",
      thirtyDaysAgo,
    );
    if (studioFilterActive) qb30 = qb30.in("studio_id", studioIdList);
    const b30r = await qb30;
    bookings30 = b30r.data ?? [];
  }
  const bookingCountByStudio = new Map<string, number>();
  for (const b of bookings30 ?? []) {
    bookingCountByStudio.set(b.studio_id, (bookingCountByStudio.get(b.studio_id) ?? 0) + 1);
  }
  const topIds = [...bookingCountByStudio.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12).map((x) => x[0]);
  let topStudios: FounderMetricsResponse["growth"]["topStudios"] = [];
  if (topIds.length > 0) {
    const { data: slugRows } = await admin.from("inkflow_studios").select("id, slug").in("id", topIds);
    topStudios = (slugRows ?? []).map((row) => ({
      studioId: row.id,
      slug: row.slug,
      bookings30d: bookingCountByStudio.get(row.id) ?? 0,
    })).sort((a, b) => b.bookings30d - a.bookings30d);
  }

  let geoRows: { city: string | null; latitude: number | null; longitude: number | null }[] = [];
  if (!noMatchingStudios) {
    let qgeo = admin.from("inkflow_studios").select("city, latitude, longitude").not(
      "city",
      "is",
      null,
    );
    if (studioFilterActive) qgeo = qgeo.in("id", studioIdList);
    const geor = await qgeo;
    geoRows = geor.data ?? [];
  }
  const geoAgg = new Map<string, { count: number; sumLat: number; sumLng: number; n: number }>();
  for (const g of geoRows ?? []) {
    const city = (g.city || "").trim() || "—";
    const cur = geoAgg.get(city) ?? { count: 0, sumLat: 0, sumLng: 0, n: 0 };
    cur.count += 1;
    if (g.latitude != null && g.longitude != null) {
      cur.sumLat += g.latitude;
      cur.sumLng += g.longitude;
      cur.n += 1;
    }
    geoAgg.set(city, cur);
  }
  const geography = [...geoAgg.entries()].map(([city, v]) => ({
    city,
    studioCount: v.count,
    lat: v.n > 0 ? v.sumLat / v.n : null,
    lng: v.n > 0 ? v.sumLng / v.n : null,
  })).sort((a, b) => b.studioCount - a.studioCount).slice(0, 24);

  const payload: FounderMetricsResponse = {
    generatedAt: now.toUTC().toISO()!,
    kpis: {
      totalAuthUsers,
      totalStudios: totalStudios ?? 0,
      crmClientsTotal: crmClientsTotal ?? 0,
      subscribedActive,
      subscribedTrialing,
      mrrEstimatedEur,
      studiosActive7d,
      bookingsTodayParis: bookingsTodayParis ?? 0,
      bookingsCreated30d: bookingsCreated30d ?? 0,
      depositsMonthEur,
    },
    health: {
      paymentsFailedMonth: paymentsFailedMonth ?? 0,
      paymentsPendingStale7d: paymentsPendingStale7d ?? 0,
    },
    activity: {
      signupsByDay,
      onboardingActivationRate,
      onboardingStepDistribution,
      projectRequestsByStatus,
      projectAcceptanceRate,
    },
    alerts: {
      studiosStuckOnboarding,
      unpaidDepositsOver48h: unpaidDepositsOver48h ?? 0,
      suspiciousAuthNote,
      studiosInactive14d: studiosInactive14d ?? 0,
      studiosNoFlashAfter48h,
      studiosNoStripeAfter72h,
    },
    growth: {
      churnSubscriptionsMonth: churnSubscriptionsMonth ?? 0,
      planDistribution,
      topStudios,
      geography,
    },
  };

  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
