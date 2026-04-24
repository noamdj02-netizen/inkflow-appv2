/**
 * Fiche CRM enrichie après paiement flash (vitrine) — tags, note traçable, entrée historique type TattooRecord.
 * Utilisé par stripe-webhook uniquement quand `metadata.flash_id` est présent.
 */

export const FLASH_VITRINE_TAG = "Flash vitrine";

export type AppointmentRowForCrm = {
  id: string;
  date: string;
  time: string;
  service: string;
  price: number | null;
  duration: number | null;
  location: string | null;
  size: string | null;
};

/** Ajoute le tag "Flash vitrine" une seule fois. */
export function mergeFlashVitrineTags(existing: unknown): string[] {
  const base = Array.isArray(existing)
    ? (existing as unknown[]).filter((t): t is string => typeof t === "string")
    : [];
  if (base.includes(FLASH_VITRINE_TAG)) return base;
  return [...base, FLASH_VITRINE_TAG];
}

/**
 * Note idempotente par session Stripe (évite doublons si webhook rejoué).
 */
export function appendFlashVitrineNote(
  existing: string | null | undefined,
  params: {
    serviceName: string;
    amountEur: number;
    sessionId: string;
  },
): string {
  const ref = (params.sessionId || "").trim();
  const block = `[InkFlow · Flash vitrine] ${params.serviceName} — ${params.amountEur.toFixed(2)} € (acompte) · ref. ${ref}`;
  const prev = (existing || "").trim();
  if (ref && prev.includes(ref)) return prev;
  return prev ? `${prev}\n\n${block}` : block;
}

export type TatJson = {
  id: string;
  appointmentId: string;
  date: string;
  location: string;
  size: string;
  description: string;
  images: string[];
  price: number;
  duration: number;
  notes?: string;
};

export function buildFlashTattooEntry(
  apt: AppointmentRowForCrm,
  amountPaid: number,
): TatJson {
  return {
    id: `tat_flash_${apt.id}`,
    appointmentId: apt.id,
    date: apt.date,
    location: (apt.location && String(apt.location).trim()) || "—",
    size: (apt.size && String(apt.size).trim()) || "—",
    description: `Flash (vitrine) — ${apt.service || "Flash"}`,
    images: [],
    price: amountPaid,
    duration: Number(apt.duration) > 0 ? Number(apt.duration) : 60,
    notes: [
      "Acompte enregistré suite au paiement sur la vitrine",
      apt.time ? `Créneau : ${apt.time}` : null,
    ]
      .filter(Boolean)
      .join(" · "),
  };
}

export function mergeTattooHistory(existing: unknown, entry: TatJson): TatJson[] {
  const arr: TatJson[] = Array.isArray(existing)
    ? (existing as TatJson[]).filter((t) => t && typeof t === "object")
    : [];
  if (arr.some((t) => t.appointmentId === entry.appointmentId)) return arr;
  return [...arr, entry];
}
