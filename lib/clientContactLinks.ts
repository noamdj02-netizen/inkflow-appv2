/** Normalise un numéro FR/EU pour wa.me (chiffres uniquement, 33… si 0…). */
export function normalizePhoneForWhatsApp(raw: string): string | null {
  const digits = raw.replace(/\D/g, '');
  if (digits.length < 9) return null;
  if (digits.startsWith('33') && digits.length >= 11) return digits;
  if (digits.startsWith('0') && digits.length === 10) return `33${digits.slice(1)}`;
  if (digits.length >= 10 && digits.length <= 15) return digits;
  return null;
}

export function buildWhatsAppUrl(phone: string, message?: string): string | null {
  const normalized = normalizePhoneForWhatsApp(phone);
  if (!normalized) return null;
  const base = `https://wa.me/${normalized}`;
  if (!message?.trim()) return base;
  return `${base}?text=${encodeURIComponent(message.trim())}`;
}

export function buildMailtoUrl(
  email: string,
  options?: { subject?: string; body?: string }
): string | null {
  const trimmed = email.trim();
  if (!trimmed || !trimmed.includes('@')) return null;
  const params = new URLSearchParams();
  if (options?.subject?.trim()) params.set('subject', options.subject.trim());
  if (options?.body?.trim()) params.set('body', options.body.trim());
  const q = params.toString();
  return q ? `mailto:${trimmed}?${q}` : `mailto:${trimmed}`;
}
