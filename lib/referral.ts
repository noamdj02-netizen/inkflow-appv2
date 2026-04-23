import { supabase } from './supabase';
import { getInviteBaseUrl } from './urls';

function getSupabaseEdgeConfig(): { url: string; anonKey: string } {
  const url = (import.meta.env.VITE_SUPABASE_URL || '').trim().replace(/\/+$/, '');
  const anonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim().replace(/^['"]|['"]$/g, '');
  return { url, anonKey };
}

export async function processReferralSignup(
  refereeEmail: string,
  referralCode: string,
): Promise<{ success: boolean; message: string }> {
  const { url, anonKey } = getSupabaseEdgeConfig();
  if (!url || !anonKey) {
    return {
      success: false,
      message: 'Application non configurée. Réessayez plus tard ou contactez le support.',
    };
  }

  try {
    const res = await fetch(`${url}/functions/v1/process-referral`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${anonKey}`,
        apikey: anonKey,
      },
      body: JSON.stringify({
        referee_email: refereeEmail,
        referral_code: referralCode,
      }),
    });

    const data = (await res.json().catch(() => ({}))) as { error?: string; message?: string };

    if (!res.ok) {
      return {
        success: false,
        message:
          typeof data.error === 'string' && data.error.trim()
            ? data.error
            : 'Le parrainage n’a pas pu être enregistré. Réessayez dans un instant.',
      };
    }

    return { success: true, message: typeof data.message === 'string' ? data.message : '' };
  } catch {
    return {
      success: false,
      message: 'Connexion instable. Vérifiez le réseau et réessayez.',
    };
  }
}

export async function completeReferralOnBooking(refereeEmail: string): Promise<void> {
  const { url, anonKey } = getSupabaseEdgeConfig();
  if (!url || !anonKey) return;

  try {
    const res = await fetch(`${url}/functions/v1/complete-referral`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${anonKey}`,
        apikey: anonKey,
      },
      body: JSON.stringify({ referee_email: refereeEmail }),
    });
    if (!res.ok && import.meta.env.DEV) {
      const errBody = await res.text().catch(() => '');
      console.warn('[completeReferralOnBooking]', res.status, errBody.slice(0, 200));
    }
  } catch (err) {
    if (import.meta.env.DEV) {
      console.warn('[completeReferralOnBooking] réseau ou serveur :', err);
    }
  }
}

export async function getReferralStats(email: string): Promise<{
  code: string;
  referralCount: number;
  pendingCount: number;
  totalEarned: number;
}> {
  const [codeRes, refRes] = await Promise.all([
    supabase.from('inkflow_client_codes').select('code').eq('email', email).maybeSingle(),
    supabase.from('inkflow_client_referrals').select('status').eq('referrer_email', email),
  ]);

  const code = codeRes.data?.code ?? '';
  const refs = refRes.data ?? [];
  const completed = refs.filter((r) => r.status === 'completed').length;
  const pending = refs.filter((r) => r.status === 'pending').length;

  return {
    code,
    referralCount: completed,
    pendingCount: pending,
    totalEarned: completed * 10,
  };
}

export function generateShareUrl(code: string): string {
  return `${getInviteBaseUrl()}/${code}`;
}
