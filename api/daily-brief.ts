/**
 * Vercel Serverless — GET /api/daily-brief?limit=7
 * JWT fondateur (Authorization: Bearer) + service role : liste des daily_briefs.
 */
import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { isVercelFounderEmail } from '../lib/vercelFounderAuth';

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
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

  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authorization Bearer required' });
    return;
  }
  const token = auth.slice(7).trim();
  if (!token) {
    res.status(401).json({ error: 'Token empty' });
    return;
  }

  const admin = createClient(supabaseUrl, serviceKey);
  const { data: userData, error: userErr } = await admin.auth.getUser(token);
  if (userErr || !userData.user?.email) {
    res.status(401).json({ error: 'Invalid session' });
    return;
  }
  if (!isVercelFounderEmail(userData.user.email)) {
    res.status(403).json({ error: 'Forbidden' });
    return;
  }

  const qLimit = 14;
  const { data, error } = await admin
    .from('daily_briefs')
    .select(
      'date, revenue, bookings, new_studios, unpaid_deposits, pending_projects, ig_reach, ig_profile_views, alerts, created_at, updated_at'
    )
    .order('date', { ascending: false })
    .limit(qLimit);
  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }
  res.status(200).json({ ok: true, briefs: data ?? [] });
}
