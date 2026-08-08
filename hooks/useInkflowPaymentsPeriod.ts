import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { getFinancePeriodRange, type FinancePeriod } from '@/lib/financePeriod';
import { estimateStripeFeesBatch } from '@/lib/stripeFeeEstimate';
import type { Appointment } from '@/types';

export type InkflowPaymentKind = 'flash' | 'projet' | 'autre';

export interface InkflowPaymentRow {
  id: string;
  amountEur: number;
  currency: string;
  clientName: string;
  subtitle: string;
  kind: InkflowPaymentKind;
  createdAt: string;
}

export interface InkflowPaymentsBreakdown {
  grossEur: number;
  stripeFeesEur: number;
  netEur: number;
  transactionCount: number;
}

interface DbPaymentRow {
  id: string;
  amount: number | string | null;
  currency: string | null;
  client_name: string | null;
  created_at: string | null;
  status: string | null;
  type: string | null;
  appointment_id: string | null;
}

function paymentKindFromAppointment(
  appointmentId: string | null | undefined,
  appointmentsById: Map<string, Appointment>
): InkflowPaymentKind {
  if (!appointmentId) return 'autre';
  const apt = appointmentsById.get(appointmentId);
  if (!apt) return 'autre';
  if (apt.tattooType === 'flash' || apt.flashId) return 'flash';
  if (apt.tattooType === 'custom') return 'projet';
  return 'autre';
}

function paymentTypeLabel(type: string | null | undefined, kind: InkflowPaymentKind): string {
  const kindLabel = kind === 'flash' ? 'Flash' : kind === 'projet' ? 'Projet' : 'Réservation';
  switch ((type ?? 'deposit').trim()) {
    case 'balance':
      return `Solde · ${kindLabel}`;
    case 'full_payment':
      return `Paiement complet · ${kindLabel}`;
    case 'deposit':
    default:
      return `Acompte · ${kindLabel}`;
  }
}

function formatRelativeFr(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const diffMs = Date.now() - date.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "À l'instant";
  if (mins < 60) return `Il y a ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Il y a ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `Il y a ${days} j`;
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

export interface UseInkflowPaymentsPeriodArgs {
  studioId: string | null | undefined;
  enabled?: boolean;
  period: FinancePeriod;
  appointments?: Appointment[];
  listLimit?: number;
}

export interface UseInkflowPaymentsPeriodResult {
  payments: InkflowPaymentRow[];
  breakdown: InkflowPaymentsBreakdown;
  periodLabel: string;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useInkflowPaymentsPeriod({
  studioId,
  enabled = true,
  period,
  appointments = [],
  listLimit = 8,
}: UseInkflowPaymentsPeriodArgs): UseInkflowPaymentsPeriodResult {
  const [rows, setRows] = useState<InkflowPaymentRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const {
    startIso,
    endIso,
    label: periodLabel,
  } = useMemo(() => getFinancePeriodRange(period), [period]);

  const appointmentsById = useMemo(() => {
    const map = new Map<string, Appointment>();
    for (const apt of appointments) map.set(apt.id, apt);
    return map;
  }, [appointments]);

  const load = useCallback(async () => {
    if (!enabled || !studioId?.trim()) {
      setRows([]);
      setError(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from('inkflow_payments')
        .select('id, amount, currency, client_name, created_at, status, type, appointment_id')
        .eq('studio_id', studioId)
        .eq('status', 'completed')
        .gte('created_at', startIso)
        .lte('created_at', endIso)
        .order('created_at', { ascending: false })
        .limit(Math.max(listLimit, 50));

      if (fetchError) throw fetchError;

      const mapped: InkflowPaymentRow[] = ((data as DbPaymentRow[] | null) ?? []).map((row) => {
        const amountEur = Number(row.amount) || 0;
        const kind = paymentKindFromAppointment(row.appointment_id, appointmentsById);
        const createdAt = row.created_at ?? new Date().toISOString();
        return {
          id: row.id,
          amountEur,
          currency: (row.currency ?? 'eur').trim() || 'eur',
          clientName: row.client_name?.trim() || 'Client',
          subtitle: `${paymentTypeLabel(row.type, kind)} · ${formatRelativeFr(createdAt)}`,
          kind,
          createdAt,
        };
      });

      setRows(mapped);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Chargement des paiements impossible'));
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [enabled, studioId, startIso, endIso, listLimit, appointmentsById]);

  useEffect(() => {
    void load();
  }, [load]);

  const payments = useMemo(() => rows.slice(0, listLimit), [rows, listLimit]);

  const breakdown = useMemo((): InkflowPaymentsBreakdown => {
    const grossEur = rows.reduce((sum, row) => sum + row.amountEur, 0);
    const stripeFeesEur = estimateStripeFeesBatch(rows.map((r) => r.amountEur));
    const netEur = Math.max(0, Math.round((grossEur - stripeFeesEur) * 100) / 100);
    return {
      grossEur: Math.round(grossEur * 100) / 100,
      stripeFeesEur: Math.round(stripeFeesEur * 100) / 100,
      netEur,
      transactionCount: rows.length,
    };
  }, [rows]);

  return {
    payments,
    breakdown,
    periodLabel,
    loading,
    error,
    refetch: load,
  };
}
