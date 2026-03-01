/**
 * Synchronise les notifications avec le dashboard, le planning et le calendrier.
 * Écoute Supabase Realtime (bookings, appointments) et affiche des notifications
 * locales Expo quand une nouvelle demande arrive ou qu'un acompte est reçu.
 *
 * Prérequis : supabase configuré (EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_ANON_KEY)
 * et studioId fourni (ex: depuis l'auth / session).
 */
import { useEffect, useRef } from 'react';
import { supabase } from './supabase';
import {
  sendTestNotification,
  sendNewRequestNotification,
  sendDepositReceivedNotification,
} from './notifications';

function mapBookingFromRow(row: Record<string, unknown>): { clientName: string; description: string } {
  return {
    clientName: (row.client_name as string) || 'Client',
    description: (row.description as string) || '',
  };
}

function mapAppointmentFromRow(
  row: Record<string, unknown>
): { clientName: string; service: string; date: string; time: string; deposit: number } {
  return {
    clientName: (row.client_name as string) || 'Client',
    service: (row.service as string) || 'RDV',
    date: (row.date as string) || '',
    time: (row.time as string) || '',
    deposit: Number(row.deposit) || 0,
  };
}

export function useNotificationSync(studioId: string | null, enabled: boolean): void {
  const initialLoadDone = useRef(false);

  // Bookings : nouvelle demande RDV vitrine
  useEffect(() => {
    if (!enabled || !studioId) return;

    const channelName = `notif-mobile-inkflow_bookings-${studioId}`;
    const filter = `studio_id=eq.${studioId}`;

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'inkflow_bookings', filter },
        async (payload) => {
          try {
            const { clientName, description } = mapBookingFromRow(
              payload.new as Record<string, unknown>
            );
            if (initialLoadDone.current) {
              await sendNewRequestNotification(
                clientName,
                description.slice(0, 80) + (description.length > 80 ? '…' : '')
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

    const channelName = `notif-mobile-inkflow_appointments-${studioId}`;
    const filter = `studio_id=eq.${studioId}`;

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'inkflow_appointments', filter },
        async (payload) => {
          try {
            const apt = mapAppointmentFromRow(payload.new as Record<string, unknown>);
            if (initialLoadDone.current) {
              await sendTestNotification({
                title: 'Nouveau rendez-vous',
                body: `${apt.clientName} — ${apt.service} le ${apt.date} à ${apt.time}`,
              });
            }
          } catch {
            // ignore
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'inkflow_appointments', filter },
        async (payload) => {
          try {
            const oldRow = payload.old as Record<string, unknown>;
            const newRow = payload.new as Record<string, unknown>;
            const wasPaid = Boolean(oldRow?.deposit_paid);
            const isPaid = Boolean(newRow?.deposit_paid);
            if (!wasPaid && isPaid && initialLoadDone.current) {
              const apt = mapAppointmentFromRow(newRow);
              await sendDepositReceivedNotification(apt.clientName, apt.deposit);
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

  // Marquer le chargement initial comme terminé après un court délai
  useEffect(() => {
    if (!enabled || !studioId) return;
    const t = setTimeout(() => {
      initialLoadDone.current = true;
    }, 3000);
    return () => clearTimeout(t);
  }, [enabled, studioId]);
}
