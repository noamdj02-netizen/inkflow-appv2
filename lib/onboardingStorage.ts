/**
 * Persistance onboarding : Supabase (inkflow_user_settings) ou localStorage (clé inkflow_onboarding).
 */

const LOCAL_KEY = 'inkflow_onboarding';

export interface OnboardingState {
  /** Dernière étape complétée (0–4). 0 = aucune, 4 = tout fait. */
  step: number;
  /** Utilisateur a fermé la bannière sans avoir tout complété. */
  dismissed: boolean;
}

const defaultState: OnboardingState = { step: 0, dismissed: false };

export function getOnboardingFromLocal(): OnboardingState {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    if (!raw) return defaultState;
    const parsed = JSON.parse(raw) as Partial<OnboardingState>;
    return {
      step: typeof parsed.step === 'number' ? Math.min(4, Math.max(0, parsed.step)) : 0,
      dismissed: !!parsed.dismissed,
    };
  } catch {
    return defaultState;
  }
}

export function setOnboardingToLocal(state: OnboardingState): void {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}

export async function getOnboardingFromSupabase(studioId: string): Promise<OnboardingState | null> {
  try {
    const { supabase } = await import('./supabase');
    const { data, error } = await supabase
      .from('inkflow_user_settings')
      .select('onboarding_step, onboarding_dismissed')
      .eq('studio_id', studioId)
      .maybeSingle();
    if (error) {
      if (error.code === 'PGRST116' || (error as { status?: number }).status === 404) return null;
      return null;
    }
    if (!data) return null;
    return {
      step: Math.min(4, Math.max(0, data.onboarding_step ?? 0)),
      dismissed: !!data.onboarding_dismissed,
    };
  } catch {
    return null;
  }
}

export async function setOnboardingToSupabase(
  studioId: string,
  state: OnboardingState
): Promise<void> {
  try {
    const { supabase } = await import('./supabase');
    await supabase.from('inkflow_user_settings').upsert(
      {
        studio_id: studioId,
        onboarding_step: state.step,
        onboarding_dismissed: state.dismissed,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'studio_id' }
    );
  } catch {
    // ignore
  }
}
