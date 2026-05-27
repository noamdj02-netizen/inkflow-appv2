import React from 'react';
import { Layers, ReceiptText, User } from 'lucide-react';
import type { Appointment } from '@/types';
import type { LiveAppointment } from '@/hooks/useLiveActiveAppointment';
import { appointmentRemainingBalanceEuros } from '@/lib/appointmentBalance';
import { cn } from '@/lib/utils';

interface MobileActiveSessionCardProps {
  appointment: LiveAppointment;
  hasOverlap?: boolean;
  onCollect: (appointment: Appointment) => void;
  onOpenClient: (appointment: Appointment) => void;
}

const STATE_BADGES: Record<LiveAppointment['liveState'], { label: string; className: string }> = {
  upcoming_soon: {
    label: 'Arrivee imminente',
    className: 'border-blue-500/20 bg-blue-500/10 text-blue-700 dark:text-blue-300',
  },
  active: {
    label: 'Session en cours',
    className: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  },
  grace_active: {
    label: 'Fin de session',
    className: 'border-indigo-500/20 bg-indigo-500/10 text-indigo-700 dark:text-indigo-300',
  },
  late: {
    label: 'A encaisser',
    className: 'border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-300',
  },
  done_paid: {
    label: 'Regle',
    className: 'border-zinc-400/20 bg-zinc-500/10 text-zinc-600 dark:text-zinc-300',
  },
  done_unpaid: {
    label: 'En attente',
    className: 'border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300',
  },
};

export function MobileActiveSessionCard({
  appointment,
  hasOverlap = false,
  onCollect,
  onOpenClient,
}: MobileActiveSessionCardProps) {
  const remaining = appointmentRemainingBalanceEuros(appointment);
  const depositAmount = Math.max(0, Number(appointment.deposit) || 0);
  const canCollect = remaining >= 0.01 && !appointment.balancePaidAt?.trim();
  const badge = STATE_BADGES[appointment.liveState] ?? STATE_BADGES.active;
  const primaryLabel =
    appointment.liveState === 'upcoming_soon'
      ? 'Preparer l encaissement'
      : canCollect
        ? 'Encaisser le client'
        : 'Ouvrir la fiche session';

  return (
    <section className="relative overflow-hidden rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm transition-all dark:border-zinc-800/80 dark:bg-zinc-950 md:hidden">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn(
                'rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em]',
                badge.className
              )}
            >
              {badge.label}
            </span>
            {hasOverlap ? (
              <span className="inline-flex items-center gap-1 rounded-md border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-amber-700 dark:text-amber-300">
                <Layers className="h-3 w-3" aria-hidden />
                +1 autre
              </span>
            ) : null}
          </div>

          <h3 className="mt-2 text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            {appointment.clientName || 'Client'}
          </h3>
          <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
            {appointment.time} · {appointment.service || 'Tatouage'}
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2.5">
        <div className="rounded-xl border border-zinc-100 bg-zinc-50 p-3 dark:border-zinc-900 dark:bg-zinc-900/60">
          <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-400 dark:text-zinc-500">
            Acompte
          </p>
          <p className="mt-1 text-sm font-semibold text-zinc-800 dark:text-zinc-200">
            {appointment.depositPaid ? `${depositAmount.toFixed(0)} € verse` : 'Aucun'}
          </p>
        </div>
        <div className="rounded-xl border border-zinc-100 bg-zinc-50 p-3 dark:border-zinc-900 dark:bg-zinc-900/60">
          <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-400 dark:text-zinc-500">
            Reste du
          </p>
          <p className="mt-1 text-sm font-bold text-emerald-600 dark:text-emerald-400">
            {remaining.toFixed(2)} €
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-2">
        <button
          type="button"
          onClick={() => {
            if (canCollect || appointment.liveState === 'upcoming_soon') {
              onCollect(appointment);
              return;
            }
            onOpenClient(appointment);
          }}
          className="inline-flex min-h-[46px] w-full items-center justify-center gap-2 rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white transition-all active:scale-[0.98] dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200"
        >
          <ReceiptText className="h-4 w-4 shrink-0" aria-hidden />
          {primaryLabel}
        </button>

        <button
          type="button"
          onClick={() => onOpenClient(appointment)}
          className="inline-flex min-h-[42px] w-full items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-transparent px-4 py-2 text-sm font-medium text-zinc-700 transition-all active:scale-[0.98] hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900"
        >
          <User className="h-4 w-4 shrink-0" aria-hidden />
          Ouvrir la fiche session
        </button>
      </div>
    </section>
  );
}
