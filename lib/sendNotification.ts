import { supabase } from './supabase';

const MAX_TEXT_LENGTH = 2000;
const MAX_EMAIL_LENGTH = 255;
const MAX_NAME_LENGTH = 200;

/** Sanitize string for Edge Function payload: trim, limit length. Reduces risk of abuse / oversized payloads. */
function sanitizeText(s: string | undefined, maxLen: number = MAX_TEXT_LENGTH): string | undefined {
  if (s == null) return undefined;
  const t = String(s).trim();
  return t === '' ? undefined : t.slice(0, maxLen);
}

function sanitizeEmail(email: string): string {
  return String(email).trim().slice(0, MAX_EMAIL_LENGTH);
}

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
 * Non-blocking: errors are logged in dev only; client always gets success for their request.
 */
export async function sendProjectNotification(data: ProjectNotificationData): Promise<void> {
  try {
    const body = {
      studioId: data.studioId,
      clientName: sanitizeText(data.clientName, MAX_NAME_LENGTH) ?? '',
      clientEmail: sanitizeEmail(data.clientEmail),
      description: sanitizeText(data.description) ?? '',
      placement: sanitizeText(data.placement, 200),
      size: sanitizeText(data.size, 100),
      budget: sanitizeText(data.budget, 100),
    };
    const { error } = await supabase.functions.invoke('send-project-notification', { body });
    if (import.meta.env.DEV && error) {
      console.warn('[InkFlow] send-project-notification:', error.message);
    }
  } catch (err) {
    if (import.meta.env.DEV) {
      console.warn('[InkFlow] send-project-notification error:', err);
    }
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
