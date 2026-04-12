import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { getBookingsFromSupabase, mapBookingFromDb } from '../lib/supabaseBookings';
import { getInkflowDemoProBookings } from '../lib/inkflowDemoAccountData';
import { useToast } from '../contexts/ToastContext';
import type { Booking, BookingStatus } from '../types';
import { updateBookingStatus as updateBookingStatusInSupabase } from '../lib/supabaseBookings';
import { notifyNewBookingRequest } from '../lib/sendNotification';

/** Son de notification (optionnel). Placez un fichier public/notification.mp3 ou désactivez. */
const NOTIFICATION_SOUND_URL = '/notification.mp3';

function playNotificationSound() {
  try {
    const audio = new Audio(NOTIFICATION_SOUND_URL);
    audio.volume = 0.5;
    audio.play().catch(() => {});
  } catch {
    // ignore
  }
}

export function useIncomingBookings(studioId: string | null, enabled: boolean, demoMode = false) {
  const toast = useToast();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const initialLoadDone = useRef(false);

  const load = useCallback(async () => {
    if (!studioId) {
      setBookings([]);
      setLoading(false);
      initialLoadDone.current = true;
      return;
    }
    if (demoMode) {
      setBookings(getInkflowDemoProBookings(studioId));
      setLoading(false);
      initialLoadDone.current = true;
      return;
    }
    setLoading(true);
    try {
      const data = await getBookingsFromSupabase(studioId);
      setBookings(data);
    } catch (err) {
      console.error('[useIncomingBookings] load error:', err);
      toast.error('Impossible de charger les demandes de réservation');
      setBookings([]);
    } finally {
      setLoading(false);
      initialLoadDone.current = true;
    }
  }, [studioId, demoMode]);

  useEffect(() => {
    load();
  }, [load]);

  // Si Realtime est désactivé côté projet Supabase, recharger au retour sur l’onglet
  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === 'visible' && studioId && enabled && !demoMode) load();
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, [studioId, enabled, load, demoMode]);

  // Realtime : INSERT ajoute au state et déclenche toast + son
  useEffect(() => {
    if (!enabled || !studioId || demoMode) return;

    const channelName = `rt-inkflow_bookings-${studioId}`;
    const filter = `studio_id=eq.${studioId}`;

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'inkflow_bookings', filter },
        (payload) => {
          try {
            const newBooking = mapBookingFromDb(payload.new as Record<string, unknown>);
            setBookings((prev) => {
              if (prev.some((b) => b.id === newBooking.id)) return prev.map((b) => (b.id === newBooking.id ? newBooking : b));
              return [newBooking, ...prev];
            });
            if (initialLoadDone.current) {
              toast.success(`Nouvelle demande de ${newBooking.clientName} !`);
              playNotificationSound();
              void notifyNewBookingRequest(
                studioId,
                newBooking.clientName,
                newBooking.description,
                newBooking.requestedDate
              );
            }
          } catch {
            // ignore map error
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'inkflow_bookings', filter },
        (payload) => {
          try {
            const updated = mapBookingFromDb(payload.new as Record<string, unknown>);
            setBookings((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
          } catch {
            // ignore map error
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'inkflow_bookings', filter },
        (payload) => {
          const oldId = (payload.old as Record<string, unknown>)?.id as string;
          if (oldId) setBookings((prev) => prev.filter((b) => b.id !== oldId));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [enabled, studioId, toast, demoMode]);

  const updateStatus = useCallback(async (id: string, status: BookingStatus) => {
    if (demoMode) {
      setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, status } : b)));
      return;
    }
    try {
      await updateBookingStatusInSupabase(id, status);
      setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, status } : b)));
      // Re-fetch from DB pour garantir la persistance (au cas où le realtime serait en retard ou désactivé)
      if (studioId) load();
    } catch (e) {
      throw e;
    }
  }, [studioId, load, demoMode]);

  return { bookings, loading, updateStatus, refetch: load };
}
