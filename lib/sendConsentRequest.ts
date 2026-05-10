import { invokeEdgeFunctionViaFetch } from './edgeFunctionInvoke';

export type SendConsentRequestChannel = 'email' | 'sms';
export type SendConsentSmsDelivery = 'native' | 'twilio';

export interface SendConsentRequestParams {
  studioId: string;
  appointmentId: string;
  channel: SendConsentRequestChannel;
  smsDelivery?: SendConsentSmsDelivery;
  template: string;
  title: string;
  studioName?: string;
}

export interface SendConsentRequestOk {
  success: true;
  consentFormId?: string;
  signUrl?: string;
  smsBody?: string;
  toE164?: string;
  channel?: string;
  smsDelivery?: string;
}

/** Appelle l’Edge `send-consent-request` avec le JWT courant. */
export async function sendConsentRequest(
  params: SendConsentRequestParams
): Promise<{ data: unknown; error: string | null }> {
  return invokeEdgeFunctionViaFetch('send-consent-request', {
    studioId: params.studioId,
    appointmentId: params.appointmentId,
    channel: params.channel,
    ...(params.smsDelivery ? { smsDelivery: params.smsDelivery } : {}),
    template: params.template,
    title: params.title,
    ...(params.studioName?.trim() ? { studioName: params.studioName.trim() } : {}),
  });
}
