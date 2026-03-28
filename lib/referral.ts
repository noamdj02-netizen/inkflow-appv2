import { supabase } from './supabase';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export async function processReferralSignup(refereeEmail: string, referralCode: string): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/process-referral`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({ 
      referee_email: refereeEmail, 
      referral_code: referralCode 
    }),
  });

  const data = await res.json();
  
  if (!res.ok) {
    return { success: false, message: data.error || 'Erreur lors du traitement du parrainage' };
  }

  return { success: true, message: data.message };
}

export async function completeReferralOnBooking(refereeEmail: string): Promise<void> {
  try {
    await fetch(`${SUPABASE_URL}/functions/v1/complete-referral`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ referee_email: refereeEmail }),
    });
  } catch (err) {
    console.error('Error completing referral:', err);
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
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://app.ink-flow.me';
  return `${baseUrl}/invite/${code}`;
}
