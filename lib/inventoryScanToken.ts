/**
 * Tokens imprimés (QR / code-barres) pour lots consommables InkFlow.
 * Le scan renvoie exactement cette chaîne ; elle est stockée dans `raw_barcode`.
 */

export function generateInventoryScanToken(): string {
  const buf = new Uint8Array(8);
  crypto.getRandomValues(buf);
  const hex = [...buf]
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase();
  return `IF${hex}`;
}

/** Nettoie la valeur lue au scan (fins de ligne, NBSP parasite). */
export function normalizeScannedBarcodeValue(raw: string): string {
  return raw.trim();
}
