import { supabase } from './supabase';
import { logEdgeInvokeError } from './sendNotification';

export type SimulateAction = 'welcome_pack' | 'day_notifications' | 'loyalty_only';

export interface SimulateStep {
  name: string;
  ok: boolean;
  detail?: string;
}

export interface SimulateResult {
  ok: boolean;
  steps?: SimulateStep[];
  error?: string;
}

/**
 * Mode Simulation Inkflow — réservé au compte noamdj02@gmail.com (contrôle côté Edge Function).
 */
export async function runExperienceSimulator(action: SimulateAction): Promise<SimulateResult> {
  try {
    const { data, error } = await supabase.functions.invoke('simulate-inkflow-experience', {
      body: { action },
    });
    if (error) {
      logEdgeInvokeError('simulate-inkflow-experience', error, data);
      return { ok: false, error: error.message || 'Échec de la simulation' };
    }
    const d = data as { ok?: boolean; steps?: SimulateStep[]; error?: string } | null;
    if (d?.error) {
      return { ok: false, error: d.error };
    }
    return { ok: d?.ok ?? true, steps: d?.steps };
  } catch (e) {
    logEdgeInvokeError('simulate-inkflow-experience', e);
    return { ok: false, error: e instanceof Error ? e.message : 'Erreur inconnue' };
  }
}
