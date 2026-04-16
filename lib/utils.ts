/**
 * Utilitaires partagés InkFlow
 */

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Fusion de classes Tailwind (shadcn / CVA) */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Date locale au format YYYY-MM-DD (évite le bug UTC de toISOString) */
export function toLocalDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Parse JSON de manière sécurisée — évite les crashs sur données corrompues */
export function safeJsonParse<T>(raw: string | null | undefined, fallback: T): T {
  if (raw == null || raw === '') return fallback;
  try {
    const parsed = JSON.parse(raw);
    return parsed as T;
  } catch {
    return fallback;
  }
}
