/**
 * Demande vitrine fictive pour formation (inbox + wizard) — ne touche pas Supabase.
 */
import type { Booking } from '@/types';

export const DEMO_INBOX_BOOKING_ID = 'ink_demo_inbox_preview';

const STORAGE_KEY = 'inkflow-demo-inbox-preview-active';

export function isDemoInboxPreviewActive(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

export function setDemoInboxPreviewActive(active: boolean): void {
  try {
    if (active) localStorage.setItem(STORAGE_KEY, '1');
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    //
  }
}

export function createDemoInboxBooking(studioId: string): Booking {
  const now = new Date().toISOString();
  const inTwoDays = new Date(Date.now() + 2 * 86400000);
  const ymd = inTwoDays.toISOString().slice(0, 10);
  return {
    id: DEMO_INBOX_BOOKING_ID,
    studioId,
    clientName: 'Léa (exemple)',
    clientEmail: 'lea.exemple@inkflow.demo',
    description:
      'Flash bras — exemple pour découvrir le flux Demandes (confirmer / acompte / refuser).',
    requestedDate: ymd,
    requestedTime: '14:00',
    status: 'pending',
    placement: 'Bras',
    size: 'M',
    createdAt: now,
    updatedAt: now,
  };
}

export function isDemoInboxBooking(id: string): boolean {
  return id === DEMO_INBOX_BOOKING_ID;
}

const OPEN_INBOX_KEY = 'inkflow-open-inbox-after-demo';

/** Après activation démo : ouvrir Demandes → À traiter. */
export function markOpenInboxAfterDemo(): void {
  try {
    sessionStorage.setItem(OPEN_INBOX_KEY, '1');
  } catch {
    //
  }
}

export function consumeOpenInboxAfterDemo(): boolean {
  try {
    if (sessionStorage.getItem(OPEN_INBOX_KEY) === '1') {
      sessionStorage.removeItem(OPEN_INBOX_KEY);
      return true;
    }
  } catch {
    //
  }
  return false;
}
