import { supabase } from './supabase';
import { sendProjectNotification } from './sendNotification';
import type { ProjectRequestFormData } from '../types';

export async function createProjectRequest(data: ProjectRequestFormData, studioId: string): Promise<string> {
  const id = `pr_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  const refs = Array.isArray(data.referenceImages) ? data.referenceImages.filter((u) => typeof u === 'string' && u.trim()) : [];
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
        "Impossible d'enregistrer la demande (accès serveur). Réessayez plus tard ou contactez le studio par un autre canal.",
      );
    }
    throw error;
  }

  sendProjectNotification({
    studioId,
    clientName: data.clientName.trim(),
    clientEmail: data.clientEmail.trim(),
    description: data.description.trim(),
    placement: data.placement || undefined,
    size: data.size || undefined,
    budget: data.budget || undefined,
  });

  return id;
}
