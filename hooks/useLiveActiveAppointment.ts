import { useEffect, useMemo, useState } from 'react';
import type { Appointment } from '@/types';

export type LiveSessionState =
  | 'upcoming_soon'
  | 'active'
  | 'grace_active'
  | 'late'
  | 'done_paid'
  | 'done_unpaid';

export interface LiveAppointment extends Appointment {
  liveState: LiveSessionState;
  startAtMs: number;
  endAtMs: number;
  priorityScore: number;
}

function toMs(date: string, time: string): number {
  const timeStr = (time || '09:00').slice(0, 5);
  return new Date(`${date}T${timeStr}:00`).getTime();
}

function deriveLiveAppointments(
  appointments: Appointment[],
  now: Date,
  today: string,
  beforeStartMin = 15,
  afterEndMin = 20
): LiveAppointment[] {
  const nowMs = now.getTime();

  return appointments
    .filter((apt) => apt.date === today && apt.status !== 'cancelled' && apt.status !== 'no_show')
    .map((apt) => {
      const startAtMs = toMs(apt.date, apt.time);
      const durationMin = apt.duration && apt.duration > 0 ? apt.duration : 60;
      const endAtMs = startAtMs + durationMin * 60_000;
      const preStartMs = startAtMs - beforeStartMin * 60_000;
      const graceEndMs = endAtMs + afterEndMin * 60_000;
      const actionableSession =
        apt.status === 'confirmed' || apt.status === 'in_progress' || apt.status === 'completed';

      let liveState: LiveSessionState = 'done_unpaid';
      let priorityScore = Number.NEGATIVE_INFINITY;

      if (apt.balancePaidAt) {
        liveState = 'done_paid';
        priorityScore = 0;
      } else if (actionableSession && nowMs >= startAtMs && nowMs <= endAtMs) {
        liveState = 'active';
        priorityScore = 1000 - startAtMs;
      } else if (actionableSession && nowMs > endAtMs && nowMs <= graceEndMs) {
        liveState = 'grace_active';
        priorityScore = 900 - startAtMs;
      } else if (actionableSession && nowMs > graceEndMs) {
        liveState = 'late';
        priorityScore = 800 - startAtMs;
      } else if (actionableSession && nowMs >= preStartMs && nowMs < startAtMs) {
        liveState = 'upcoming_soon';
        priorityScore = 700 - startAtMs;
      } else if (apt.status === 'completed') {
        liveState = 'done_unpaid';
        priorityScore = 100 - startAtMs;
      }

      return { ...apt, liveState, startAtMs, endAtMs, priorityScore };
    })
    .sort((a, b) => b.priorityScore - a.priorityScore);
}

export function useLiveActiveAppointment(appointments: Appointment[], today: string) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 15_000);
    return () => window.clearInterval(id);
  }, []);

  const liveAppointments = useMemo(
    () => deriveLiveAppointments(appointments, now, today),
    [appointments, now, today]
  );

  const activeAppointment = liveAppointments[0] ?? null;
  const overlappingAppointments = liveAppointments.filter(
    (apt) =>
      apt.liveState === 'active' || apt.liveState === 'grace_active' || apt.liveState === 'late'
  );

  return {
    now,
    activeAppointment,
    liveAppointments,
    overlappingAppointments,
    hasOverlap: overlappingAppointments.length > 1,
  };
}
