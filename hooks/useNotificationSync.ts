/**
 * Synchronise les notifications avec le dashboard, le planning et le calendrier.
 * Écoute Supabase Realtime (bookings, appointments) et affiche des Web Notifications
 * quand une nouvelle demande arrive ou qu'un acompte est reçu.
 */
import { useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { mapBookingFromDb } from '../lib/supabaseBookings';
import { mapAppointmentFromDb } from '../lib/supabaseDashboard';

const NOTIFICATION_TITLE_PREFIX = 'InkFlow';

function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) return Promise.resolve(false);
  if (Notification.permission === 'granted') return Promise.resolve(true);
  if (Notification.permission === 'denied') return Promise.resolve(false);
  return Notification.requestPermission().then((p) => p === 'granted');
}

function showWebNotification(title: string, body: string, tag?: string): void {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;
  try {
    new Notification(`${NOTIFICATION_TITLE_PREFIX} — ${title}`, {
      body,
      tag: tag ?? `inkflow-${Date.now()}`,
      icon: '/favicon.ico',
    });
  } catch {
    // ignore
  }
}

export function useNotificationSync(studioId: string | null, enabled: boolean): void {
  const permissionRequested = useRef(false);
  const initialLoadDone = useRef(false);

  useEffect(() => {
    if (!enabled || !studioId) return;
    if (!permissionRequested.current) {
      permissionRequested.current = true;
      requestNotificationPermission();
    }
  }, [enabled, studioId]);

  // Bookings : nouvelle demande RDV vitrine
  useEffect(() => {
    if (!enabled || !studioId) return;

    const channelName = `notif-inkflow_bookings-${studioId}`;
    const filter = `studio_id=eq.${studioId}`;

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'inkflow_bookings', filter },
        (payload) => {
          try {
            const booking = mapBookingFromDb(payload.new as Record<string, unknown>);
            if (initialLoadDone.current) {
              showWebNotification(
                'Nouvelle demande',
                `${booking.clientName} a réservé : ${booking.description.slice(0, 50)}${booking.description.length > 50 ? '…' : ''}`,
                `booking-${booking.id}`
              );
            }
          } catch {
            // ignore
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [enabled, studioId]);

  // Appointments : nouveau RDV ou acompte reçu
  useEffect(() => {
    if (!enabled || !studioId) return;

    const channelName = `notif-inkflow_appointments-${studioId}`;
    const filter = `studio_id=eq.${studioId}`;

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'inkflow_appointments', filter },
        (payload) => {
          try {
            const apt = mapAppointmentFromDb(payload.new as Record<string, unknown>);
            if (initialLoadDone.current) {
              showWebNotification(
                'Nouveau rendez-vous',
                `${apt.clientName} — ${apt.service} le ${apt.date} à ${apt.time}`,
                `apt-${apt.id}`
              );
            }
          } catch {
            // ignore
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'inkflow_appointments', filter },
        (payload) => {
          try {
            const oldRow = payload.old as Record<string, unknown>;
            const newRow = payload.new as Record<string, unknown>;
            const wasPaid = Boolean(oldRow?.deposit_paid);
            const isPaid = Boolean(newRow?.deposit_paid);
            if (!wasPaid && isPaid && initialLoadDone.current) {
              const apt = mapAppointmentFromDb(newRow);
              const amount = (newRow.deposit as number) ?? 0;
              showWebNotification(
                'Acompte reçu',
                `${apt.clientName} a payé ${amount}€`,
                `deposit-${apt.id}`
              );
            }
          } catch {
            // ignore
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [enabled, studioId]);

  // Marquer le chargement initial comme terminé après un court délai (éviter les notifs au premier load)
  useEffect(() => {
    if (!enabled || !studioId) return;
    const t = setTimeout(() => {
      initialLoadDone.current = true;
    }, 3000);
    return () => clearTimeout(t);
  }, [enabled, studioId]);
}
