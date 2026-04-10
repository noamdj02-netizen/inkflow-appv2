/**
 * Questionnaire santé stocké sur inkflow_client_portal_profiles (une ligne par user_id).
 */
import type { Json } from '../types/database';
import { supabase } from './supabase';
import type { HealthFormData } from '../components/booking/HealthQuestionnaireForm';

function rowToForm(json: unknown): HealthFormData | null {
  if (!json || typeof json !== 'object') return null;
  const o = json as Record<string, unknown>;
  const str = (k: string) => (typeof o[k] === 'string' ? o[k] : '') as string;
  const bool = (k: string): boolean | null => {
    if (o[k] === true) return true;
    if (o[k] === false) return false;
    return null;
  };
  try {
    return {
      clientName: str('clientName'),
      clientBirthdate: str('clientBirthdate'),
      clientInstagram: str('clientInstagram'),
      allergies: bool('allergies'),
      allergiesDetails: str('allergiesDetails'),
      grossesse: bool('grossesse'),
      allaitement: bool('allaitement'),
      maladiesInfectieuses: bool('maladiesInfectieuses'),
      infectionsVirales: bool('infectionsVirales'),
      troubleCicatriciel: bool('troubleCicatriciel'),
      diabete: bool('diabete'),
      antibiotiques: bool('antibiotiques'),
      antiInflammatoires: bool('antiInflammatoires'),
      steroides: bool('steroides'),
      certifiedAccurate: o.certifiedAccurate === true,
      signatureText: str('signatureText'),
    };
  } catch {
    return null;
  }
}

export function isHealthFormComplete(data: HealthFormData | null): boolean {
  if (!data) return false;
  const keys: (keyof HealthFormData)[] = [
    'allergies',
    'grossesse',
    'allaitement',
    'maladiesInfectieuses',
    'infectionsVirales',
    'troubleCicatriciel',
    'diabete',
    'antibiotiques',
    'antiInflammatoires',
    'steroides',
  ];
  if (!data.clientName?.trim() || !data.clientBirthdate?.trim()) return false;
  if (!data.certifiedAccurate || !data.signatureText?.trim()) return false;
  for (const k of keys) {
    if (data[k] === null) return false;
  }
  return true;
}

export async function fetchClientHealthProfile(userId: string): Promise<HealthFormData | null> {
  const { data, error } = await supabase
    .from('inkflow_client_portal_profiles')
    .select('health_profile')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) {
    if (import.meta.env.DEV) console.warn('[clientHealthProfile]', error.message);
    return null;
  }
  return rowToForm(data?.health_profile);
}

export async function upsertClientHealthProfile(userId: string, form: HealthFormData): Promise<boolean> {
  const payload = {
    clientName: form.clientName,
    clientBirthdate: form.clientBirthdate,
    clientInstagram: form.clientInstagram,
    allergies: form.allergies,
    allergiesDetails: form.allergiesDetails,
    grossesse: form.grossesse,
    allaitement: form.allaitement,
    maladiesInfectieuses: form.maladiesInfectieuses,
    infectionsVirales: form.infectionsVirales,
    troubleCicatriciel: form.troubleCicatriciel,
    diabete: form.diabete,
    antibiotiques: form.antibiotiques,
    antiInflammatoires: form.antiInflammatoires,
    steroides: form.steroides,
    certifiedAccurate: form.certifiedAccurate,
    signatureText: form.signatureText,
  };

  const { error } = await supabase.from('inkflow_client_portal_profiles').upsert(
    {
      user_id: userId,
      health_profile: payload as unknown as Json,
      health_profile_updated_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' }
  );
  if (error) {
    if (import.meta.env.DEV) console.warn('[clientHealthProfile] upsert', error.message);
    return false;
  }
  return true;
}
