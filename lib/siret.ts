/** Validation SIRET français (14 chiffres + clé Luhn adaptée). */

export function validateSiret(s: string): boolean {
  const clean = s.replace(/\s/g, '');
  if (clean.length !== 14 || !/^\d{14}$/.test(clean)) return false;
  let sum = 0;
  for (let i = 0; i < 14; i++) {
    let n = parseInt(clean[i], 10);
    if (i % 2 === 0) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
  }
  return sum % 10 === 0;
}

/** Affichage avec espaces tous les 3 chiffres. */
export function formatSiret(v: string): string {
  const digits = v.replace(/\D/g, '').slice(0, 14);
  return digits.replace(/(\d{3})(?=\d)/g, '$1 ').trim();
}
