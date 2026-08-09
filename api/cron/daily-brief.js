/**
 * Vercel Cron — GET /api/cron/daily-brief
 * Secured with Authorization: Bearer CRON_SECRET (set in Vercel env, same for manual curl).
 * Optional Slack Incoming Webhook: SLACK_DAILY_BRIEF_WEBHOOK_URL (skip if unset; never fail cron).
 */
import { createClient } from '@supabase/supabase-js';
import { DateTime } from 'luxon';

const SLACK_TIMEOUT_MS = 8_000;
const DAILY_BRIEF_ADMIN_URL = 'https://app.ink-flow.me/admin/daily-brief';

function ymd(d) {
  return d.toFormat('yyyy-LL-dd');
}

/**
 * Post founder Daily Brief to Slack Incoming Webhook.
 * @returns {'ok'|'skipped'|'error'}
 */
async function postDailyBriefToSlack({
  title,
  totalRevenue,
  newBookings,
  newStudios,
  unpaidDeposits,
  pendingProjects,
  alerts,
}) {
  const webhookUrl = (process.env.SLACK_DAILY_BRIEF_WEBHOOK_URL || '').trim();
  if (!webhookUrl) {
    return 'skipped';
  }

  const lines = [
    `💰 *${totalRevenue.toFixed(0)}€* encaissés`,
    `📅 *${newBookings}* bookings`,
    `👤 *${newStudios}* nouveaux studios`,
    `💳 *${unpaidDeposits}* acomptes pending`,
    `📋 *${pendingProjects}* projets pending`,
  ];
  if (alerts.length > 0) {
    lines.push('', '*Alertes*', ...alerts.map((a) => `• ${a}`));
  }
  lines.push('', `<${DAILY_BRIEF_ADMIN_URL}|Ouvrir le Daily Brief>`);

  const textFallback = `${title}\n${lines.join('\n').replace(/\*/g, '')}`;
  const payload = {
    text: textFallback,
    blocks: [
      {
        type: 'header',
        text: { type: 'plain_text', text: title.slice(0, 150), emoji: true },
      },
      {
        type: 'section',
        text: { type: 'mrkdwn', text: lines.join('\n') },
      },
    ],
  };

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), SLACK_TIMEOUT_MS);
    let res;
    try {
      res = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timer);
    }
    if (!res.ok) {
      // Never log the webhook URL (secret).
      console.error('[daily-brief] Slack webhook failed', { status: res.status });
      return 'error';
    }
    return 'ok';
  } catch (err) {
    const reason = err?.name === 'AbortError' ? 'timeout' : 'network';
    console.error('[daily-brief] Slack webhook error', { reason });
    return 'error';
  }
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  const secret = (process.env.CRON_SECRET || '').trim();
  const auth = req.headers.authorization;
  if (!secret || auth !== `Bearer ${secret}`) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const supabaseUrl = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '')
    .trim()
    .replace(/\/+$/, '');
  const serviceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
  if (!supabaseUrl || !serviceKey) {
    res.status(500).json({ error: 'Server Supabase not configured' });
    return;
  }

  const supabase = createClient(supabaseUrl, serviceKey);

  const yParis = DateTime.now().setZone('Europe/Paris').minus({ days: 1 });
  const startParis = yParis.startOf('day');
  const endParis = yParis.endOf('day');
  const yDate = ymd(yParis);
  const startIso = startParis.toUTC().toISO() ?? undefined;
  const endIso = endParis.toUTC().toISO() ?? undefined;
  if (!startIso || !endIso) {
    res.status(500).json({ error: 'Date range error' });
    return;
  }

  const [bookingsRes, studiosRes, paidRes, pendingPayRes, pendingPrRes] = await Promise.all([
    supabase
      .from('inkflow_bookings')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', startIso)
      .lte('created_at', endIso),
    supabase
      .from('inkflow_studios')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', startIso)
      .lte('created_at', endIso),
    supabase
      .from('inkflow_payments')
      .select('amount')
      .in('status', ['completed', 'paid'])
      .gte('created_at', startIso)
      .lte('created_at', endIso),
    supabase
      .from('inkflow_payments')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending'),
    supabase
      .from('inkflow_project_requests')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending'),
  ]);

  if (bookingsRes.error) {
    res.status(500).json({ error: bookingsRes.error.message });
    return;
  }
  if (studiosRes.error) {
    res.status(500).json({ error: studiosRes.error.message });
    return;
  }
  if (paidRes.error) {
    res.status(500).json({ error: paidRes.error.message });
    return;
  }
  if (pendingPayRes.error) {
    res.status(500).json({ error: pendingPayRes.error.message });
    return;
  }
  if (pendingPrRes.error) {
    res.status(500).json({ error: pendingPrRes.error.message });
    return;
  }

  const newBookings = bookingsRes.count ?? 0;
  const newStudios = studiosRes.count ?? 0;
  const totalRevenue =
    paidRes.data?.reduce((s, p) => s + (typeof p.amount === 'number' ? p.amount : 0), 0) ?? 0;
  const unpaidDeposits = pendingPayRes.count ?? 0;
  const pendingProjects = pendingPrRes.count ?? 0;

  let igReach = null;
  let igProfileViews = null;
  const igToken = (process.env.INSTAGRAM_ACCESS_TOKEN || '').trim();
  if (igToken) {
    try {
      const igRes = await fetch(
        `https://graph.instagram.com/me/insights?metric=reach,profile_views&period=day&access_token=${encodeURIComponent(igToken)}`,
      );
      const igData = await igRes.json();
      igReach = igData?.data?.find((m) => m.name === 'reach')?.values?.[1]?.value ?? null;
      igProfileViews =
        igData?.data?.find((m) => m.name === 'profile_views')?.values?.[1]?.value ?? null;
    } catch {
      // non bloquant
    }
  }

  const alerts = [];
  if (unpaidDeposits > 5) {
    alerts.push(`⚠️ ${unpaidDeposits} acomptes impayés en attente`);
  }
  if (pendingProjects > 3) {
    alerts.push(`📋 ${pendingProjects} projets sans réponse artiste`);
  }
  if (totalRevenue === 0 && newBookings === 0) {
    alerts.push('🔴 Aucune activité sur la période — vérifier le flux si inattendu');
  }

  const hasAlerts = alerts.length > 0;
  const emoji = hasAlerts ? '🔴' : '✅';
  const title = `${emoji} InkFlow Daily — ${yParis.setLocale('fr').toFormat('EEE d MMM')}`;
  const body = [
    `💰 ${totalRevenue.toFixed(0)}€ encaissés · ${newBookings} RDV`,
    `👤 ${newStudios} nouv. studios`,
    igReach != null ? `📸 Instagram : ${igReach} reach` : null,
    hasAlerts ? alerts[0] : null,
  ]
    .filter((x) => x != null && x !== '')
    .join('\n');

  const studioId = (process.env.DAILY_BRIEF_STUDIO_ID || '').trim();
  let sent = 0;
  if (studioId) {
    const pushUrl = `${supabaseUrl.replace(/\/$/, '')}/functions/v1/send-push-notification`;
    const r = await fetch(pushUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${serviceKey}`,
        apikey: (process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '')
          .trim()
          .replace(/^['"]|['"]$/g, ''),
      },
      body: JSON.stringify({
        studioId,
        title,
        body,
        url: '/admin/daily-brief',
        tag: 'inkflow-daily-brief',
      }),
    });
    if (r.ok) {
      try {
        const j = await r.json();
        sent = typeof j.sent === 'number' ? j.sent : 0;
      } catch {
        sent = 0;
      }
    }
  }

  const up = await supabase.from('daily_briefs').upsert(
    {
      date: yDate,
      revenue: totalRevenue,
      bookings: newBookings,
      new_studios: newStudios,
      unpaid_deposits: unpaidDeposits,
      pending_projects: pendingProjects,
      ig_reach: igReach,
      ig_profile_views: igProfileViews,
      alerts: alerts,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'date' },
  );
  if (up.error) {
    res.status(500).json({ error: up.error.message });
    return;
  }

  const slack = await postDailyBriefToSlack({
    title,
    totalRevenue,
    newBookings,
    newStudios,
    unpaidDeposits,
    pendingProjects,
    alerts,
  });

  res.status(200).json({ ok: true, sent, date: yDate, alerts: alerts.length, slack });
}
