import { supabase } from './supabase';
import type { Notification } from '../types';

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

export interface SendBookingConfirmationParams {
  clientEmail: string;
  clientName: string;
  studioName: string;
  requestedDate: string;
  requestedTime: string | null;
  description: string;
  /** Lien vers la conversation client (optionnel). Si fourni, la date devient cliquable dans l'email. */
  conversationLink?: string;
  /** Lien de paiement Stripe (optionnel). Si fourni, l'email affiche un bouton "Payer mon acompte" (vert, style premium) dans le corps du mail. */
  paymentLink?: string;
  /** Adresse du studio pour la pièce jointe .ics (optionnel) */
  studioAddress?: string;
}

/**
 * Envoie au client un email de confirmation de RDV quand le tatoueur confirme une demande RDV vitrine.
 * Non bloquant : les erreurs sont loguées en dev uniquement.
 */
export async function sendBookingConfirmation(params: SendBookingConfirmationParams): Promise<void> {
  try {
    const body = {
      clientEmail: sanitizeEmail(params.clientEmail),
      clientName: sanitizeText(params.clientName, MAX_NAME_LENGTH) ?? '',
      studioName: sanitizeText(params.studioName, MAX_NAME_LENGTH) ?? '',
      requestedDate: params.requestedDate,
      requestedTime: params.requestedTime ?? null,
      description: sanitizeText(params.description, 500) ?? '',
      conversationLink: params.conversationLink ? sanitizeText(params.conversationLink, 500) : undefined,
      paymentLink: params.paymentLink ? sanitizeText(params.paymentLink, 500) : undefined,
      studioAddress: params.studioAddress ? sanitizeText(params.studioAddress, 300) : undefined,
    };
    const { error } = await supabase.functions.invoke('send-booking-confirmation', { body });
    if (import.meta.env.DEV && error) {
      console.warn('[InkFlow] send-booking-confirmation:', error.message);
    }
  } catch (err) {
    if (import.meta.env.DEV) {
      console.warn('[InkFlow] send-booking-confirmation error:', err);
    }
  }
}

export interface SendBookingRefusalParams {
  clientEmail: string;
  clientName: string;
  studioName: string;
  /** Contexte optionnel (description du projet, service demandé) */
  description?: string;
}

/**
 * Envoie au client un email de refus quand le tatoueur refuse une demande.
 * Non bloquant : les erreurs sont loguées en dev uniquement.
 */
export async function sendBookingRefusal(params: SendBookingRefusalParams): Promise<void> {
  try {
    const body = {
      clientEmail: sanitizeEmail(params.clientEmail),
      clientName: sanitizeText(params.clientName, MAX_NAME_LENGTH) ?? '',
      studioName: sanitizeText(params.studioName, MAX_NAME_LENGTH) ?? '',
      description: params.description ? sanitizeText(params.description, 500) : undefined,
    };
    const { error } = await supabase.functions.invoke('send-booking-refusal', { body });
    if (import.meta.env.DEV && error) {
      console.warn('[InkFlow] send-booking-refusal:', error.message);
    }
  } catch (err) {
    if (import.meta.env.DEV) {
      console.warn('[InkFlow] send-booking-refusal error:', err);
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
 * @returns { sent: true } si l'email a été envoyé, { sent: false, unauthorized?: boolean, errorDetails?: string } sinon
 */
export async function sendConversationLinkToClient(params: SendConversationLinkToClientParams): Promise<{ sent: boolean; unauthorized?: boolean; errorDetails?: string }> {
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
    const status = (error as { context?: { status?: number } })?.context?.status;
    const is401Or461 = status === 401 || status === 461
      || error?.message?.includes('401')
      || error?.message?.includes('461')
      || error?.message?.toLowerCase().includes('unauthorized');
    if (is401Or461) {
      await supabase.auth.refreshSession();
      const retry = await invoke();
      data = retry.data;
      error = retry.error;
    }
    const getErrorDetails = async (): Promise<string | undefined> => {
      const fromData = (data as { userMessage?: string } | undefined)?.userMessage;
      if (fromData) return fromData;
      const err = error as { context?: { json?: () => Promise<{ userMessage?: string; error?: string }> } };
      if (typeof err?.context?.json === 'function') {
        try {
          const body = await err.context.json();
          return body?.userMessage || body?.error;
        } catch {
          return undefined;
        }
      }
      return undefined;
    };
    if (error) {
      const retryStatus = (error as { context?: { status?: number } })?.context?.status;
      const unauthorized = retryStatus === 401 || retryStatus === 461
        || error?.message?.includes('401')
        || error?.message?.includes('461')
        || error?.message?.toLowerCase().includes('unauthorized');
      const msg = unauthorized
        ? 'Session expirée ou non autorisée (401). Reconnectez-vous puis réessayez.'
        : error.message;
      console.warn('[InkFlow] Email lien conversation non envoyé:', msg, data);
      const errorDetails = await getErrorDetails();
      return { sent: false, unauthorized: unauthorized || undefined, errorDetails };
    }
    if (data?.error) {
      const errorDetails = (data as { userMessage?: string }).userMessage || data.error;
      console.warn('[InkFlow] Email lien conversation échec serveur:', data.error, data.details);
      return { sent: false, errorDetails };
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

export interface SendAftercareEmailParams {
  appointmentId: string;
  studioId: string;
}

/**
 * Envoie l'email de soins post-tatouage au client quand un RDV est marqué terminé.
 * L'Edge Function récupère les données (client, studio, template de soins) depuis Supabase.
 * Non bloquant : les erreurs sont loguées en dev uniquement.
 */
export async function sendAftercareEmail(params: SendAftercareEmailParams): Promise<void> {
  try {
    const body = {
      appointmentId: params.appointmentId,
      studioId: params.studioId,
    };
    const { error } = await supabase.functions.invoke('send-aftercare-email', { body });
    if (import.meta.env.DEV && error) {
      console.warn('[InkFlow] send-aftercare-email:', error.message);
    }
  } catch (err) {
    if (import.meta.env.DEV) {
      console.warn('[InkFlow] send-aftercare-email error:', err);
    }
  }
}

export interface SendReferralNotificationParams {
  referrerId: string;
  refereeStudioName: string;
}

/**
 * Envoie au parrain un email de félicitations quand un studio s'inscrit via son lien.
 * Rappelle qu'il gagne 1 mois gratuit.
 * Non bloquant : en cas d'erreur (ex. Resend non configuré), on ne remonte pas.
 */
export async function sendReferralNotification(params: SendReferralNotificationParams): Promise<void> {
  try {
    const body = {
      referrerId: params.referrerId,
      refereeStudioName: sanitizeText(params.refereeStudioName, MAX_NAME_LENGTH) ?? 'Un studio',
    };
    const { error } = await supabase.functions.invoke('send-referral-notification', { body });
    if (import.meta.env.DEV && error) {
      console.warn('[InkFlow] send-referral-notification:', error.message);
    }
  } catch (err) {
    if (import.meta.env.DEV) {
      console.warn('[InkFlow] send-referral-notification error:', err);
    }
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

export interface CreateInAppNotificationParams {
  studioId: string;
  type: Notification['type'];
  title: string;
  message: string;
  actionUrl?: string;
}

/**
 * Crée une notification in-app dans Supabase (table inkflow_notifications).
 * Cette notification apparaîtra dans le dropdown et la page de notifications du studio.
 * Non bloquant : les erreurs sont ignorées.
 */
export async function createInAppNotification(params: CreateInAppNotificationParams): Promise<void> {
  try {
    const payload = {
      studio_id: params.studioId,
      type: params.type,
      title: sanitizeText(params.title, 200) ?? '',
      message: sanitizeText(params.message, 500) ?? '',
      action_url: params.actionUrl ? sanitizeText(params.actionUrl, 500) : null,
      read: false,
      created_at: new Date().toISOString(),
    };
    const { error } = await supabase.from('inkflow_notifications').insert(payload as never);
    if (import.meta.env.DEV && error) {
      console.warn('[InkFlow] createInAppNotification:', error.message);
    }
  } catch (err) {
    if (import.meta.env.DEV) {
      console.warn('[InkFlow] createInAppNotification error:', err);
    }
  }
}

/**
 * Crée une notification de nouvelle demande de réservation
 */
export async function notifyNewBookingRequest(
  studioId: string,
  clientName: string,
  description: string,
  requestedDate?: string
): Promise<void> {
  const dateStr = requestedDate 
    ? ` le ${new Date(requestedDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}`
    : '';
  await createInAppNotification({
    studioId,
    type: 'booking',
    title: `${clientName} souhaite un RDV${dateStr}`,
    message: description.slice(0, 100) + (description.length > 100 ? '…' : ''),
    actionUrl: '/requests',
  });
}

/**
 * Crée une notification de paiement d'acompte reçu
 */
export async function notifyDepositReceived(
  studioId: string,
  clientName: string,
  amount: number
): Promise<void> {
  await createInAppNotification({
    studioId,
    type: 'payment',
    title: `Acompte de ${amount}€ reçu`,
    message: `${clientName} a payé son acompte de ${amount}€`,
    actionUrl: '/finance',
  });
}

/**
 * Crée une notification de rappel (RDV demain, acomptes en attente, etc.)
 */
export async function notifyReminder(
  studioId: string,
  title: string,
  message: string
): Promise<void> {
  await createInAppNotification({
    studioId,
    type: 'reminder',
    title,
    message,
  });
}
