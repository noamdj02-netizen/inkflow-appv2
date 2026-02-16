import { supabase } from './supabase';

interface ProjectNotificationData {
  studioId: string;
  clientName: string;
  clientEmail: string;
  description: string;
  placement?: string;
  size?: string;
  budget?: string;
}

/**
 * Sends a notification email to the tattoo artist via Supabase Edge Function.
 * This call is intentionally non-blocking: errors are logged but never thrown,
 * so the client always receives a success confirmation for their project request.
 */
export async function sendProjectNotification(data: ProjectNotificationData): Promise<void> {
  try {
    const { error } = await supabase.functions.invoke('send-project-notification', {
      body: {
        studioId: data.studioId,
        clientName: data.clientName,
        clientEmail: data.clientEmail,
        description: data.description,
        placement: data.placement || undefined,
        size: data.size || undefined,
        budget: data.budget || undefined,
      },
    });

    if (error) {
      console.error('[sendProjectNotification] Edge function error:', error);
    }
  } catch (err) {
    console.error('[sendProjectNotification] Network/unexpected error:', err);
  }
}
