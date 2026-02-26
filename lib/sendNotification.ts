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
    }
  } catch (err) {
  }
}

export interface SendConversationLinkToClientParams {
  clientEmail: string;
  clientName: string;
  studioName?: string;
  threadId: string;
}

/**
 * Envoie au client un email avec le lien de conversation (quand le studio accepte une demande de projet).
 * Non bloquant : en cas d'erreur (ex. Resend non configuré), on ne remonte pas l'erreur.
 * @returns { sent: true } si l'email a été envoyé, { sent: false, unauthorized: true } en cas de 401, sinon { sent: false }
 */
export async function sendConversationLinkToClient(params: SendConversationLinkToClientParams): Promise<{ sent: boolean; unauthorized?: boolean }> {
  const invoke = async () => {
    const { data, error } = await supabase.functions.invoke('send-client-conversation-link', {
      body: {
        clientEmail: params.clientEmail,
        clientName: params.clientName,
        studioName: params.studioName || undefined,
        threadId: params.threadId,
      },
    });
    return { data, error };
  };

  try {
    let { data, error } = await invoke();
    const is401 = (error as { context?: { status?: number } })?.context?.status === 401
      || error?.message?.includes('401')
      || error?.message?.toLowerCase().includes('unauthorized');
    if (is401) {
      await supabase.auth.refreshSession();
      const retry = await invoke();
      data = retry.data;
      error = retry.error;
    }
    if (error) {
      const unauthorized = (error as { context?: { status?: number } })?.context?.status === 401
        || error?.message?.includes('401')
        || error?.message?.toLowerCase().includes('unauthorized');
      const msg = unauthorized
        ? 'Session expirée ou non autorisée (401). Reconnectez-vous puis réessayez.'
        : error.message;
      console.warn('[InkFlow] Email lien conversation non envoyé:', msg, data);
      return { sent: false, unauthorized: unauthorized || undefined };
    }
    if (data?.error) {
      console.warn('[InkFlow] Email lien conversation échec serveur:', data.error, data.details);
      return { sent: false };
    }
    return { sent: true };
  } catch (err) {
    console.warn('[InkFlow] Email lien conversation erreur:', err);
    return { sent: false };
  }
}

export interface SendMessageNotificationToClientParams {
  clientEmail: string;
  clientName: string;
  studioName?: string;
  senderName: string;
  messagePreview: string;
  threadId: string;
}

export interface SendMessageNotificationToStudioParams {
  studioId: string;
  senderName: string;
  messagePreview: string;
  threadId: string;
}

/**
 * Notifie le client par email qu'il a reçu un nouveau message du studio.
 * Non bloquant : en cas d'erreur, on ne remonte pas.
 */
export async function sendMessageNotificationToClient(params: SendMessageNotificationToClientParams): Promise<void> {
  try {
    await supabase.functions.invoke('send-message-notification', {
      body: {
        type: 'to_client',
        clientEmail: params.clientEmail,
        clientName: params.clientName,
        studioName: params.studioName || undefined,
        senderName: params.senderName,
        messagePreview: params.messagePreview,
        threadId: params.threadId,
      },
    });
  } catch {
    // ignore
  }
}

/**
 * Notifie le studio par email qu'un client a envoyé un message.
 * Non bloquant : en cas d'erreur, on ne remonte pas.
 */
export async function sendMessageNotificationToStudio(params: SendMessageNotificationToStudioParams): Promise<void> {
  try {
    await supabase.functions.invoke('send-message-notification', {
      body: {
        type: 'to_studio',
        studioId: params.studioId,
        senderName: params.senderName,
        messagePreview: params.messagePreview,
        threadId: params.threadId,
      },
    });
  } catch {
    // ignore
  }
}
