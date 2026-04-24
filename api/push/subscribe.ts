/**
 * Vercel Serverless — POST /api/push/subscribe
 * Proxy vers Supabase Edge Function `push-subscribe` (JWT tatoueur + corps { studioId, subscription }).
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  const supabaseUrl = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '')
    .trim()
    .replace(/\/+$/, '');
  const anonKey = (process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '')
    .trim()
    .replace(/^['"]|['"]$/g, '');
  if (!supabaseUrl) {
    res.status(500).json({ error: 'SUPABASE_URL not configured on server' });
    return;
  }
  const auth = req.headers.authorization;
  if (!auth) {
    res.status(401).json({ error: 'Authorization required' });
    return;
  }
  let bodyStr = '{}';
  if (typeof req.body === 'string') {
    bodyStr = req.body || '{}';
  } else if (req.body && typeof req.body === 'object') {
    bodyStr = JSON.stringify(req.body);
  }
  const target = `${supabaseUrl}/functions/v1/push-subscribe`;
  const r = await fetch(target, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: auth,
      ...(anonKey ? { apikey: anonKey } : {}),
    },
    body: bodyStr,
  });
  const text = await r.text();
  let parsed: unknown;
  try {
    parsed = JSON.parse(text) as unknown;
  } catch {
    parsed = { raw: text };
  }
  res.status(r.status).json(parsed);
}
