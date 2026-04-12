/**
 * Fidélité « carte à tampons » : paramètres studio, progression client, récompenses.
 */
import { supabase } from './supabase';
import type { Appointment } from '../types';

export interface StampLoyaltySettings {
  enabled: boolean;
  /** Nombre de tatouages (RDV terminés) pour débloquer la récompense */
  tattoosRequired: number;
  /** Montant en euros offert + code promo */
  rewardEuros: number;
}

export const DEFAULT_STAMP_LOYALTY: StampLoyaltySettings = {
  enabled: false,
  tattoosRequired: 5,
  rewardEuros: 80,
};

export function parseStampLoyaltySettings(raw: unknown): StampLoyaltySettings {
  if (!raw || typeof raw !== 'object') return { ...DEFAULT_STAMP_LOYALTY };
  const o = raw as Record<string, unknown>;
  return {
    enabled: Boolean(o.enabled),
    tattoosRequired: Number.isFinite(Number(o.tattoosRequired)) && Number(o.tattoosRequired) > 0
      ? Math.min(50, Math.floor(Number(o.tattoosRequired)))
      : DEFAULT_STAMP_LOYALTY.tattoosRequired,
    rewardEuros: Number.isFinite(Number(o.rewardEuros)) && Number(o.rewardEuros) > 0
      ? Math.min(5000, Math.floor(Number(o.rewardEuros)))
      : DEFAULT_STAMP_LOYALTY.rewardEuros,
  };
}

export async function fetchStampLoyaltySettings(studioId: string): Promise<StampLoyaltySettings> {
  const { data, error } = await supabase
    .from('inkflow_studios')
    .select('stamp_loyalty_settings')
    .eq('id', studioId)
    .maybeSingle();
  if (error) throw error;
  return parseStampLoyaltySettings(data?.stamp_loyalty_settings);
}

export async function saveStampLoyaltySettings(studioId: string, settings: StampLoyaltySettings): Promise<void> {
  const { error } = await supabase
    .from('inkflow_studios')
    .update({
      stamp_loyalty_settings: parseStampLoyaltySettings(settings) as unknown as import('../types/database').Json,
      updated_at: new Date().toISOString(),
    })
    .eq('id', studioId);
  if (error) throw error;
}

export interface ClientStampStateRow {
  stampsInCycle: number;
  totalCompletedTattoos: number;
}

export async function fetchStampStateForClient(
  studioId: string,
  clientId: string
): Promise<ClientStampStateRow | null> {
  const { data, error } = await supabase
    .from('inkflow_client_stamp_state')
    .select('stamps_in_cycle, total_completed_tattoos')
    .eq('studio_id', studioId)
    .eq('client_id', clientId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return {
    stampsInCycle: Number(data.stamps_in_cycle) || 0,
    totalCompletedTattoos: Number(data.total_completed_tattoos) || 0,
  };
}

export async function fetchStampStatesForStudio(
  studioId: string
): Promise<Record<string, ClientStampStateRow>> {
  const { data, error } = await supabase
    .from('inkflow_client_stamp_state')
    .select('client_id, stamps_in_cycle, total_completed_tattoos')
    .eq('studio_id', studioId);
  if (error) throw error;
  const map: Record<string, ClientStampStateRow> = {};
  for (const row of data || []) {
    const cid = row.client_id as string;
    map[cid] = {
      stampsInCycle: Number(row.stamps_in_cycle) || 0,
      totalCompletedTattoos: Number(row.total_completed_tattoos) || 0,
    };
  }
  return map;
}

export interface PendingStampReward {
  clientEmail: string;
  amountEuros: number;
  promoCode: string;
}

/** Récompenses en attente (pour alerte tatoueur sur les demandes de RDV) */
export async function fetchPendingStampRewardsByEmail(
  studioId: string
): Promise<Record<string, PendingStampReward>> {
  const { data, error } = await supabase
    .from('inkflow_stamp_rewards')
    .select('client_email, amount_euros, promo_code')
    .eq('studio_id', studioId)
    .eq('status', 'pending');
  if (error) throw error;
  const map: Record<string, PendingStampReward> = {};
  for (const row of data || []) {
    const email = String(row.client_email || '').toLowerCase().trim();
    if (!email) continue;
    map[email] = {
      clientEmail: row.client_email as string,
      amountEuros: Number(row.amount_euros) || 0,
      promoCode: row.promo_code as string,
    };
  }
  return map;
}

function randomPromoCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let s = '';
  for (let i = 0; i < 8; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return `INK-${s}`;
}

function normalizeEmail(e: string): string {
  return e.trim().toLowerCase();
}

/**
 * À appeler après un RDV passé en « terminé » : compte un tampon, crée code + email si besoin.
 */
export async function processStampLoyaltyAfterCompletedAppointment(
  studioId: string,
  appointment: Appointment
): Promise<void> {
  if (appointment.status !== 'completed') return;

  const settings = await fetchStampLoyaltySettings(studioId);
  if (!settings.enabled) return;

  let clientId = appointment.clientId?.trim();
  if (!clientId) {
    const { data: found } = await supabase
      .from('inkflow_clients')
      .select('id')
      .eq('studio_id', studioId)
      .ilike('email', appointment.clientEmail.trim())
      .maybeSingle();
    if (found?.id) clientId = found.id as string;
  }
  if (!clientId) {
    console.warn('stampLoyalty: pas de client_id pour', appointment.clientEmail);
    return;
  }

  const { error: insErr } = await supabase.from('inkflow_stamp_appointment_credits').insert({
    appointment_id: appointment.id,
    studio_id: studioId,
    client_id: clientId,
  });

  if (insErr) {
    if (insErr.code === '23505') return;
    throw insErr;
  }

  const { data: existing } = await supabase
    .from('inkflow_client_stamp_state')
    .select('id, stamps_in_cycle, total_completed_tattoos')
    .eq('studio_id', studioId)
    .eq('client_id', clientId)
    .maybeSingle();

  let stamps = (existing?.stamps_in_cycle as number) ?? 0;
  let total = (existing?.total_completed_tattoos as number) ?? 0;

  stamps += 1;
  total += 1;

  const threshold = settings.tattoosRequired;
  let rewardCreated = false;

  if (stamps >= threshold) {
    let promoCode = randomPromoCode();
    for (let attempt = 0; attempt < 5; attempt++) {
      const { error: promoErr } = await supabase.from('inkflow_stamp_rewards').insert({
        studio_id: studioId,
        client_id: clientId,
        client_email: normalizeEmail(appointment.clientEmail),
        promo_code: promoCode,
        amount_euros: settings.rewardEuros,
        status: 'pending',
        source_appointment_id: appointment.id,
      });
      if (!promoErr) {
        rewardCreated = true;
        break;
      }
      if (promoErr.code === '23505') promoCode = randomPromoCode();
      else throw promoErr;
    }

    stamps = 0;

    if (rewardCreated) {
      await supabase.functions.invoke('send-stamp-reward-email', {
        body: {
          studioId,
          clientEmail: appointment.clientEmail.trim(),
          clientName: appointment.clientName,
          amountEuros: settings.rewardEuros,
          promoCode,
        },
      });

      // Notifier le tatoueur via push (fire-and-forget)
      supabase.functions.invoke('send-push-notification', {
        body: {
          studioId,
          title: 'Récompense fidélité débloquée 🎉',
          body: `${appointment.clientName} a atteint ${settings.tattoosRequired} séances — ${settings.rewardEuros}€ offerts !`,
          url: '/dashboard?tab=loyalty',
          tag: 'stamp-reward',
        },
      }).catch(() => {});
    }
  }

  const now = new Date().toISOString();
  const { error: upsertErr } = await supabase.from('inkflow_client_stamp_state').upsert(
    {
      studio_id: studioId,
      client_id: clientId,
      stamps_in_cycle: stamps,
      total_completed_tattoos: total,
      updated_at: now,
    },
    { onConflict: 'studio_id,client_id' }
  );
  if (upsertErr) throw upsertErr;
}

/** Marquer une récompense comme utilisée (ex. après projet) */
export async function redeemStampReward(rewardId: string, studioId: string): Promise<void> {
  const { error } = await supabase
    .from('inkflow_stamp_rewards')
    .update({
      status: 'redeemed',
      redeemed_at: new Date().toISOString(),
    })
    .eq('id', rewardId)
    .eq('studio_id', studioId);
  if (error) throw error;
}
