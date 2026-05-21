import type { MessageThread } from '../types';
import { tryParseStructuredMessage, type StructuredMessagePayload } from './messageContent';
import { getCanonicalAppOrigin } from './urls';

export type ActivityFilterId = 'all' | 'followup' | 'payments' | 'today' | 'week';

export interface ThreadEnrichment {
  phone: string;
  email: string;
  clientId: string | null;
  linkedAppointmentId: string | null;
  depositPaid: boolean | null;
  consentFormId: string | null;
  consentSigned: boolean | null;
  structured: StructuredMessagePayload | null;
  invoicePublicUrl: string | null;
  quickNote: string;
}

export const ACTIVITY_FILTERS: { id: ActivityFilterId; label: string }[] = [
  { id: 'all', label: 'Tout' },
  { id: 'followup', label: 'À relancer' },
  { id: 'payments', label: 'Paiements' },
  { id: 'today', label: "Aujourd'hui" },
  { id: 'week', label: 'Cette semaine' },
];

export function parseThreadStructured(lastMessage: string): StructuredMessagePayload | null {
  const parsed = tryParseStructuredMessage(lastMessage);
  if (parsed) return parsed;
  const t = lastMessage.trim();
  if (!t.startsWith('{')) return null;
  try {
    const o = JSON.parse(t) as Record<string, unknown>;
    if (
      (o.kind === 'deposit' || o.kind === 'acompte') &&
      typeof o.checkoutUrl === 'string' &&
      o.checkoutUrl.startsWith('https://')
    ) {
      return {
        kind: 'payment_card',
        amount: typeof o.amount === 'number' ? o.amount : 0,
        checkoutUrl: o.checkoutUrl,
        currency: typeof o.currency === 'string' ? o.currency : undefined,
      };
    }
  } catch {
    /* ignore */
  }
  return null;
}

export function buildConsentReminderMessage(params: {
  clientName: string;
  studioName: string;
  consentFormId: string;
  title?: string;
}): string {
  const url = `${getCanonicalAppOrigin()}/consent/${encodeURIComponent(params.consentFormId)}`;
  const name = params.clientName.trim() || 'bonjour';
  const studio = params.studioName.trim() || 'le studio';
  const doc = params.title?.trim() || 'consentement tatouage';
  return `Bonjour ${name},\n\nPensez à compléter votre formulaire « ${doc} » :\n${url}\n\nMerci,\n${studio}`;
}

export function threadNeedsFollowup(
  structured: StructuredMessagePayload | null,
  enrichment: ThreadEnrichment
): boolean {
  if (structured?.kind === 'consent_form_request') {
    return enrichment.consentSigned === false;
  }
  if (structured?.kind === 'payment_card') {
    if (enrichment.depositPaid === true) return false;
    return true;
  }
  return false;
}

export function threadIsPaymentActivity(structured: StructuredMessagePayload | null): boolean {
  return structured?.kind === 'payment_card' || structured?.kind === 'payment_receipt';
}

function startOfLocalDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function isActivityToday(iso: string): boolean {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return false;
  const now = new Date();
  return startOfLocalDay(d).getTime() === startOfLocalDay(now).getTime();
}

export function isActivityThisWeek(iso: string): boolean {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return false;
  const now = new Date();
  const day = now.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const weekStart = startOfLocalDay(now);
  weekStart.setDate(weekStart.getDate() + mondayOffset);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);
  return d >= weekStart && d < weekEnd;
}

export function filterActivityThreads(
  threads: MessageThread[],
  filter: ActivityFilterId,
  enrichmentByThread: Record<string, ThreadEnrichment>
): MessageThread[] {
  return threads.filter((t) => {
    const en = enrichmentByThread[t.threadId];
    const structured = en?.structured ?? parseThreadStructured(t.lastMessage);
    if (filter === 'all') return true;
    if (filter === 'followup') {
      return threadNeedsFollowup(structured, en ?? emptyEnrichment(t));
    }
    if (filter === 'payments') return threadIsPaymentActivity(structured);
    if (filter === 'today') return isActivityToday(t.lastMessageAt);
    if (filter === 'week') return isActivityThisWeek(t.lastMessageAt);
    return true;
  });
}

function emptyEnrichment(thread: MessageThread): ThreadEnrichment {
  return {
    phone: '',
    email: thread.clientEmail?.trim() || '',
    clientId: null,
    linkedAppointmentId: thread.linkedAppointmentId ?? null,
    depositPaid: null,
    consentFormId: null,
    consentSigned: null,
    structured: parseThreadStructured(thread.lastMessage),
    invoicePublicUrl: null,
    quickNote: '',
  };
}

export function getPaymentCheckoutUrl(structured: StructuredMessagePayload | null): string | null {
  if (structured?.kind === 'payment_card') return structured.checkoutUrl;
  return null;
}

export function showInvoiceAction(
  structured: StructuredMessagePayload | null,
  invoicePublicUrl: string | null,
  depositPaid?: boolean | null
): boolean {
  if (!invoicePublicUrl?.trim()) return false;
  if (structured?.kind === 'payment_receipt') return true;
  if (structured?.kind === 'payment_card' && depositPaid === true) return true;
  return false;
}

export function showConsentRelance(
  structured: StructuredMessagePayload | null,
  enrichment: ThreadEnrichment
): boolean {
  return (
    structured?.kind === 'consent_form_request' &&
    enrichment.consentSigned === false &&
    Boolean(enrichment.consentFormId)
  );
}

export function showCopyPaymentLink(structured: StructuredMessagePayload | null): boolean {
  return structured?.kind === 'payment_card' && Boolean(getPaymentCheckoutUrl(structured));
}
