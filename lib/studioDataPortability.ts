import { supabase } from './supabase';

function getBaseAndHeaders(): { fnBase: string; headers: Record<string, string> } | null {
  const url = (import.meta.env.VITE_SUPABASE_URL || '').trim().replace(/\/+$/, '');
  const key = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim().replace(/^['"]|['"]$/g, '');
  if (!url || !key) return null;
  return {
    fnBase: `${url}/functions/v1`,
    headers: { apikey: key, 'Content-Type': 'application/json' },
  };
}

export async function exportStudioDataJson(
  studioId: string
): Promise<{ ok: true; blob: Blob; filename: string } | { error: string }> {
  const cfg = getBaseAndHeaders();
  if (!cfg) return { error: 'Supabase non configuré.' };
  const { data: s } = await supabase.auth.getSession();
  const token = s.session?.access_token;
  if (!token) return { error: 'Session expirée : reconnecte-toi.' };

  const res = await fetch(`${cfg.fnBase}/export-studio-gdpr`, {
    method: 'POST',
    headers: { ...cfg.headers, Authorization: `Bearer ${token}` },
    body: JSON.stringify({ studioId }),
  });
  if (!res.ok) {
    const j = (await res.json().catch(() => ({}))) as { error?: string };
    return { error: j.error || `Erreur ${res.status}` };
  }
  const cd = res.headers.get('Content-Disposition');
  const filenameMatch = cd?.match(/filename="?([^";\n]+)/);
  const filename = filenameMatch ? filenameMatch[1].trim() : 'inkflow-export.json';
  const blob = await res.blob();
  return { ok: true, blob, filename };
}

export async function deleteStudioAccountForOwner(params: {
  studioId: string;
  confirmEmail: string;
}): Promise<
  { ok: true; message: string; partial?: boolean } | { error: string; partial?: boolean }
> {
  const cfg = getBaseAndHeaders();
  if (!cfg) return { error: 'Supabase non configuré.' };
  const { data: s } = await supabase.auth.getSession();
  const token = s.session?.access_token;
  if (!token) return { error: 'Session expirée : reconnecte-toi.' };

  const res = await fetch(`${cfg.fnBase}/delete-studio-account`, {
    method: 'POST',
    headers: { ...cfg.headers, Authorization: `Bearer ${token}` },
    body: JSON.stringify({ studioId: params.studioId, confirmEmail: params.confirmEmail }),
  });
  const j = (await res.json().catch(() => ({}))) as {
    error?: string;
    ok?: boolean;
    message?: string;
    partial?: boolean;
  };
  if (!res.ok) {
    return { error: j.error || `Erreur ${res.status}`, partial: j.partial };
  }
  if (j.ok) {
    return { ok: true, message: j.message || 'Compte supprimé.', partial: j.partial };
  }
  return { error: j.error || 'Échec' };
}
