/**
 * Vercel Serverless — POST /api/projects/:id/reject
 * Proxy vers Supabase Edge Function `project-request-reject` (JWT forward).
 */
export default async function handler(req, res) {
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
  let bodyObj = {};
  if (typeof req.body === 'string') {
    try {
      bodyObj = JSON.parse(req.body || '{}');
    } catch {
      bodyObj = {};
    }
  } else if (req.body && typeof req.body === 'object') {
    bodyObj = req.body;
  }
  const target = `${supabaseUrl}/functions/v1/project-request-reject`;
  const r = await fetch(target, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(auth ? { Authorization: auth } : {}),
    },
    body: JSON.stringify({ ...bodyObj, project_request_id: id }),
  });
  const text = await r.text();
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    parsed = { raw: text };
  }
  res.status(r.status).json(parsed);
}
