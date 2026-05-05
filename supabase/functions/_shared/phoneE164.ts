/** Normalisation légère vers E.164 (focus France mobile : 06/07 → +33). */

export function normalizePhoneToE164Fr(raw: string | undefined): string | null {
  const s = typeof raw === "string" ? raw.trim().replace(/\s+/g, " ") : "";
  if (!s) return null;
  let d = raw.replace(/[\s.\-\\/()]/g, "");
  if (!d) return null;
  if (d.startsWith("00")) d = "+" + d.slice(2);
  if (d.startsWith("+")) {
    const rest = d.slice(1).replace(/\D/g, "");
    return rest.length >= 10 ? "+" + rest : null;
  }
  const digits = d.replace(/\D/g, "");
  if (/^0[67]\d{8}$/.test(digits)) return "+33" + digits.slice(1);
  if (/^[67]\d{8}$/.test(digits) && digits.length === 9) return "+33" + digits;
  return null;
}
