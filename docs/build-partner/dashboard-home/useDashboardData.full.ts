import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type {
  TodaySlot,
  StripeDeposit,
  BookingRequest,
} from '../components/dashboard/ArtistBentoOverview';

/** `inkflow_payments.amount` est persisté en euros (cf. Edge `create-checkout-session`). */
function inkflowPaymentEurToAmountCents(amountEur: number): number {
  if (!Number.isFinite(amountEur)) return 0;
  return Math.round(amountEur * 100);
}

function combineLocalDateAndTime(dateStr: string, timeStr: string): Date {
  const t = (timeStr || '09:00').trim();
  const [hRaw, mRaw] = t.split(':');
  const h = Math.min(23, Math.max(0, parseInt(hRaw || '9', 10) || 9));
  const m = Math.min(59, Math.max(0, parseInt(mRaw || '0', 10) || 0));
  const local = new Date(
    `${dateStr}T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`
  );
  return local;
}

function mapAppointmentStatus(raw: string | null): TodaySlot['status'] {
  switch (raw) {
    case 'confirmed':
    case 'in_progress':
    case 'completed':
      return 'confirmé';
    case 'pending':
      return 'provisoire';
    default:
      return 'en_attente';
  }
}

function paymentStatusToUi(s: string | null): StripeDeposit['status'] {
  switch (s) {
    case 'completed':
      return 'réussi';
    case 'refunded':
      return 'remboursé';
    default:
      return 'en_cours';
  }
}

function projectUrgency(slotExpiresAt: string | null): BookingRequest['urgency'] {
  if (!slotExpiresAt) return 'normal';
  const exp = new Date(slotExpiresAt).getTime();
  if (Number.isNaN(exp)) return 'normal';
  if (exp < Date.now() + 48 * 3600000) return 'haut';
  return 'normal';
}

function bookingRowUrgency(
  requestedDate: string,
  requestedTime: string | null
): BookingRequest['urgency'] {
  const when = combineLocalDateAndTime(requestedDate, requestedTime || '12:00');
  const diff = when.getTime() - Date.now();
  if (diff > 0 && diff < 48 * 3600000) return 'haut';
  return 'normal';
}

export interface UseDashboardDataArgs {
  studioId?: string | null;
  /** ISO date `YYYY-MM-DD` — doit matcher `DashboardPro` / `todayAppointments` */
  todayDateKey: string;
  /** Désactive fetch (mode démo, SSR, ou pas de studio) */
  enabled?: boolean;
}

export interface UseDashboardDataResult {
  todaySlots: TodaySlot[];
  stripeDeposits: StripeDeposit[];
  bookingRequests: BookingRequest[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

const EXCLUDED_APT = new Set(['cancelled', 'no_show']);

export function useDashboardData(args: UseDashboardDataArgs): UseDashboardDataResult {
  const { studioId, todayDateKey, enabled: enabledArg = true } = args;
  const enabled = Boolean(enabledArg && studioId?.trim() && todayDateKey?.trim());

  const [todaySlots, setTodaySlots] = useState<TodaySlot[]>([]);
  const [stripeDeposits, setStripeDeposits] = useState<StripeDeposit[]>([]);
  const [bookingRequests, setBookingRequests] = useState<BookingRequest[]>([]);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<Error | null>(null);

  const load = useCallback(async () => {
    if (!studioId?.trim() || !todayDateKey?.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const [aptsRes, payRes, projRes, bookRes] = await Promise.all([
        supabase
          .from('inkflow_appointments')
          .select('id, date, time, duration, service, client_name, status')
          .eq('studio_id', studioId)
          .eq('date', todayDateKey)
          .order('time', { ascending: true }),
        supabase
          .from('inkflow_payments')
          .select('id, amount, currency, client_name, created_at, status, type')
          .eq('studio_id', studioId)
          .eq('status', 'completed')
          .in('type', ['deposit', 'balance', 'full_payment'])
          .order('created_at', { ascending: false })
          .limit(8),
        supabase
          .from('inkflow_project_requests')
          .select('id, client_name, description, created_at, status, slot_expires_at')
          .eq('studio_id', studioId)
          .eq('status', 'pending')
          .order('created_at', { ascending: false })
          .limit(8),
        supabase
          .from('inkflow_bookings')
          .select(
            'id, client_name, description, created_at, status, requested_date, requested_time'
          )
          .eq('studio_id', studioId)
          .eq('status', 'pending')
          .order('created_at', { ascending: false })
          .limit(8),
      ]);

      if (aptsRes.error) throw aptsRes.error;
      if (payRes.error) throw payRes.error;
      if (projRes.error) throw projRes.error;
      if (bookRes.error) throw bookRes.error;

      const slots: TodaySlot[] = (aptsRes.data ?? [])
        .filter((row) => row.id && !EXCLUDED_APT.has((row.status ?? '').trim()))
        .map((row) => {
          const start = combineLocalDateAndTime(row.date, row.time);
          const durMin = row.duration != null && row.duration > 0 ? row.duration : 60;
          const end = new Date(start.getTime() + durMin * 60000);
          return {
            id: row.id,
            start: start.toISOString(),
            end: end.toISOString(),
            title: row.service?.trim() || 'Séance',
            clientName: row.client_name?.trim() || 'Client',
            status: mapAppointmentStatus(row.status),
          };
        });

      const deposits: StripeDeposit[] = (payRes.data ?? []).map((row) => ({
        id: row.id,
        amountCents: inkflowPaymentEurToAmountCents(row.amount),
        currency: (row.currency ?? 'eur').trim() || 'eur',
        clientLabel: row.client_name?.trim() || 'Client',
        receivedAt: row.created_at ?? new Date().toISOString(),
        status: paymentStatusToUi(row.status),
      }));

      const projReqs: BookingRequest[] = (projRes.data ?? []).map((row) => ({
        id: row.id,
        clientName: row.client_name?.trim() || 'Client',
        motif: row.description?.trim() || 'Projet personnalisé',
        createdAt: row.created_at ?? new Date().toISOString(),
        urgency: projectUrgency(row.slot_expires_at),
        source: 'project',
      }));

      const bkReqs: BookingRequest[] = (bookRes.data ?? []).map((row) => ({
        id: row.id,
        clientName: row.client_name?.trim() || 'Client',
        motif: row.description?.trim() || 'Demande de réservation',
        createdAt: row.created_at ?? new Date().toISOString(),
        urgency: bookingRowUrgency(row.requested_date, row.requested_time),
        source: 'booking',
      }));

      const merged = [...projReqs, ...bkReqs].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      setTodaySlots(slots);
      setStripeDeposits(deposits.slice(0, 4));
      setBookingRequests(merged.slice(0, 5));
    } catch (e) {
      setError(e instanceof Error ? e : new Error(String(e)));
    } finally {
      setLoading(false);
    }
  }, [studioId, todayDateKey]);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      setTodaySlots([]);
      setStripeDeposits([]);
      setBookingRequests([]);
      setError(null);
      return;
    }
    void load();
  }, [enabled, load]);

  useEffect(() => {
    if (!enabled || !studioId?.trim()) return;

    let cancelled = false;
    const schedule = () => {
      if (!cancelled) void load();
    };

    const channel = supabase
      .channel(`dashboard-bento-${studioId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'inkflow_payments',
          filter: `studio_id=eq.${studioId}`,
        },
        schedule
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'inkflow_appointments',
          filter: `studio_id=eq.${studioId}`,
        },
        schedule
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'inkflow_project_requests',
          filter: `studio_id=eq.${studioId}`,
        },
        schedule
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'inkflow_bookings',
          filter: `studio_id=eq.${studioId}`,
        },
        schedule
      )
      .subscribe();

    const onVis = () => {
      if (document.visibilityState === 'visible') schedule();
    };
    window.addEventListener('visibilitychange', onVis);

    return () => {
      cancelled = true;
      window.removeEventListener('visibilitychange', onVis);
      void supabase.removeChannel(channel);
    };
  }, [enabled, studioId, load]);

  return {
    todaySlots,
    stripeDeposits,
    bookingRequests,
    loading,
    error,
    refetch: load,
  };
}
