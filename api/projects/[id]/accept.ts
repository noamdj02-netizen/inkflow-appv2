/**
 * Vercel Serverless — POST /api/projects/:id/accept
 * Proxy vers Supabase Edge Function `project-request-accept` (JWT forward).
 * Variables : SUPABASE_URL ou VITE_SUPABASE_URL sur le projet Vercel.
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  const raw = req.query?.id;
  const id = Array.isArray(raw) ? raw[0] : raw;
  if (!id || typeof id !== 'string') {
    res.status(400).json({ error: 'Missing project id' });
    return;
  }
  const supabaseUrl = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '')
    .trim()
    .replace(/\/+$/, '');
  if (!supabaseUrl) {
    res.status(500).json({ error: 'SUPABASE_URL not configured on server' });
    return;
  }
  const auth = req.headers.authorization;
  let bodyObj: Record<string, unknown> = {};
  if (typeof req.body === 'string') {
    try {
      bodyObj = JSON.parse(req.body || '{}') as Record<string, unknown>;
    } catch {
      bodyObj = {};
    }
  } else if (req.body && typeof req.body === 'object') {
    bodyObj = req.body as Record<string, unknown>;
  }
  const target = `${supabaseUrl}/functions/v1/project-request-accept`;
  const r = await fetch(target, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(auth ? { Authorization: auth } : {}),
    },
    body: JSON.stringify({ ...bodyObj, project_request_id: id }),
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
