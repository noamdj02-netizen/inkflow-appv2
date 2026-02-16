import { supabase } from './supabase';
import { sendProjectNotification } from './sendNotification';
import type { ProjectRequestFormData } from '../types';

export async function createProjectRequest(data: ProjectRequestFormData, studioId: string): Promise<string> {
  const id = `pr_${Date.now()}`;
  const row = {
    id,
    studio_id: studioId,
    client_name: data.clientName.trim(),
    client_email: data.clientEmail.trim(),
    client_instagram: data.clientInstagram?.trim() || null,
    description: data.description.trim(),
    placement: data.placement || null,
    size: data.size || null,
    budget: data.budget || null,
    status: 'PENDING',
    reference_images: data.referenceImages || []
  };
  const { error } = await supabase.from('inkflow_project_requests').insert(row);
  if (error) throw error;

  // Non-blocking: send email notification to the tattoo artist.
  // Errors are logged internally but never propagate to the client.
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
