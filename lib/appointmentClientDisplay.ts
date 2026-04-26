import type { Appointment, Client } from '../types';

/** Ignore les chaînes vides / blanches (évite un `<img src="">` qui casse l’affichage). */
export function trimAvatarUrl(u: string | undefined | null): string | undefined {
  if (u == null || typeof u !== 'string') return undefined;
  const t = u.trim();
  return t.length > 0 ? t : undefined;
}

/**
 * Résout l’URL d’avatar client pour un RDV (clientId, puis email).
 * Aligné sur la logique de `AppointmentCalendar`.
 */
export function getClientAvatarForAppointment(
  apt: Appointment,
  clients: readonly Client[] = []
): string | undefined {
  const byId = apt.clientId
    ? trimAvatarUrl(clients.find((c) => c.id === apt.clientId)?.avatar)
    : undefined;
  if (byId) return byId;
  const email = apt.clientEmail?.toLowerCase() || '';
  if (!email) return undefined;
  return trimAvatarUrl(clients.find((c) => c.email?.toLowerCase() === email)?.avatar);
}

export function getClientNameInitials(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return '?';
  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    const a = parts[0]!.charAt(0);
    const b = parts[1]!.charAt(0);
    return (a + b).toUpperCase();
  }
  const u = trimmed.toUpperCase();
  return u.length >= 2 ? u.slice(0, 2) : u.slice(0, 1);
}
