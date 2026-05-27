import { supabase } from './supabase';
import { sendProjectNotification } from './sendNotification';
import type { ProjectRequestFormData } from '../types';
import type { HealthFormData } from '../components/booking/HealthQuestionnaireForm';
import type { Database } from '../types/database';

function buildHealthPayload(
  data: HealthFormData
): Database['public']['Tables']['inkflow_health_forms']['Row']['health_data'] {
  return {
    allergies: data.allergies,
    allergiesDetails: data.allergiesDetails || null,
    grossesse: data.grossesse,
    allaitement: data.allaitement,
    maladiesInfectieuses: data.maladiesInfectieuses,
    infectionsVirales: data.infectionsVirales,
    troubleCicatriciel: data.troubleCicatriciel,
    diabete: data.diabete,
    antibiotiques: data.antibiotiques,
    antiInflammatoires: data.antiInflammatoires,
    steroides: data.steroides,
  };
}

export async function createProjectRequest(
  data: ProjectRequestFormData,
  studioId: string,
  healthForm?: HealthFormData
): Promise<string> {
  const id = `pr_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  const refs = Array.isArray(data.referenceImages)
    ? data.referenceImages.filter((u) => typeof u === 'string' && u.trim())
    : [];
  const row = {
    id,
    studio_id: studioId,
    client_name: data.clientName.trim(),
    client_email: data.clientEmail.trim(),
    client_instagram: data.clientInstagram?.trim() || null,
    description: data.description.trim(),
    placement: data.placement || null,
    estimated_size: data.size || null,
    budget: data.budget || null,
    status: 'pending',
    project_type: 'custom',
    reference_images: refs,
    reference_image_url: refs[0] ?? data.referenceImageUrl?.trim() ?? null,
  };
  const { error } = await supabase.from('inkflow_project_requests').insert(row);
  if (error) {
    const msg = error.message || '';
    if (msg.includes('row-level security') || error.code === '42501') {
      throw new Error(
        "Impossible d'enregistrer la demande (accès serveur). Réessayez plus tard ou contactez le studio par un autre canal."
      );
    }
    throw error;
  }

  sendProjectNotification({
    projectRequestId: id,
    studioId,
    clientName: data.clientName.trim(),
    clientEmail: data.clientEmail.trim(),
    description: data.description.trim(),
    placement: data.placement || undefined,
    size: data.size || undefined,
    budget: data.budget || undefined,
  });

  // Best-effort : ne bloque jamais la soumission projet.
  if (healthForm) {
    try {
      const { error: healthErr } = await supabase.from('inkflow_health_forms').insert({
        studio_id: studioId,
        project_request_id: id,
        client_name: healthForm.clientName.trim() || data.clientName.trim(),
        client_email: data.clientEmail.trim(),
        client_birthdate: healthForm.clientBirthdate || null,
        client_instagram:
          healthForm.clientInstagram?.trim() || data.clientInstagram?.trim() || null,
        health_data: buildHealthPayload(
          healthForm
        ) as Database['public']['Tables']['inkflow_health_forms']['Row']['health_data'],
        signature_text: healthForm.signatureText?.trim() || null,
        certified_accurate: healthForm.certifiedAccurate === true,
        certified_at: healthForm.certifiedAccurate ? new Date().toISOString() : null,
      });
      if (healthErr) {
        // On ignore l'erreur pour ne pas casser le flux.
        // (Le tattooer peut demander les infos santé plus tard si nécessaire.)
      }
    } catch {
      // ignore
    }
  }

  return id;
}
