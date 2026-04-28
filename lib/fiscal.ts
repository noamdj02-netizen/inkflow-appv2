/**
 * Pilotage fiscal pédagogique (PRD pilotage v2) — ordres de grandeur, pas conseil juridique.
 */
import { roundMoneyEUR, bpsToRatio, type BasisPoints } from './financeDisplay';

export const PLAFOND_AE_INDICATIF_2026_EUR = 77_700;
export const VL_INDICATIF_BPS_DEFAULT = 170;

export interface FiscalSnapshot {
  cotisationsEUR: number;
  impotVL_EUR: number;
  netEstimeEUR: number;
}

export function computePilotageFiscalSnapshot(
  caTtcEUR: number,
  socialRateBps: BasisPoints,
  versementLiberatoire: boolean,
  vlRateBps: BasisPoints
): FiscalSnapshot {
  const rSoc = bpsToRatio(socialRateBps);
  const cotisationsEUR = roundMoneyEUR(caTtcEUR * rSoc);
  const impotVL_EUR =
    versementLiberatoire && caTtcEUR > 0 ? roundMoneyEUR(caTtcEUR * bpsToRatio(vlRateBps)) : 0;
  const netEstimeEUR = roundMoneyEUR(Math.max(0, caTtcEUR - cotisationsEUR - impotVL_EUR));
  return { cotisationsEUR, impotVL_EUR, netEstimeEUR };
}

export type DeclarationFrequency = 'monthly' | 'trimestrial';

export interface DeadlineHint {
  isoDate: string;
  label: string;
  detail: string;
}

function atNoonUtc(y: number, m1to12: number, day: number): Date {
  return new Date(Date.UTC(y, m1to12 - 1, day, 12, 0, 0));
}

function lastDayOfMonth(y: number, m1to12: number): Date {
  return new Date(Date.UTC(y, m1to12, 0, 12, 0, 0));
}

/** Prochains mois (fin de mois) comme rappel indicatif en mode déclaration mensuelle. */
function nextMonthlyHints(from: Date, count: number): DeadlineHint[] {
  const out: DeadlineHint[] = [];
  const start = new Date(from.getFullYear(), from.getMonth(), 1);
  for (let i = 1; i <= 18 && out.length < count; i++) {
    const d = new Date(start);
    d.setMonth(d.getMonth() + i);
    const last = lastDayOfMonth(d.getFullYear(), d.getMonth() + 1);
    if (last >= from) {
      const y = last.getFullYear();
      const m = last.getMonth() + 1;
      out.push({
        isoDate: last.toISOString().slice(0, 10),
        label: `Fin de mois ${String(m).padStart(2, '0')}/${y}`,
        detail:
          'Rappel indicatif avant ta prochaine déclaration en mode mensuel — vérifie la date réelle dans ton espace URSSAF.',
      });
    }
  }
  return out.slice(0, count);
}

/**
 * Échéances trimestrielles indicative (AE) : jalons fins avr. / jul. / oct. et janvier (T4 pour l’année civile précédente).
 * À croiser systématiquement avec tes courriers et ton compte URSSAF.
 */
function nextQuarterlyHints(from: Date, count: number): DeadlineHint[] {
  const deadlines: { iso: string; label: string; detail: string }[] = [];
  const fy = from.getFullYear();
  for (let y = fy; y <= fy + 2; y++) {
    const q1 = atNoonUtc(y, 4, 30);
    const q2 = atNoonUtc(y, 7, 31);
    const q3 = atNoonUtc(y, 10, 31);
    const q4 = atNoonUtc(y + 1, 1, 31);
    deadlines.push(
      {
        iso: q1.toISOString().slice(0, 10),
        label: `Indicatif après T1 ${y}`,
        detail:
          'Souvent dernier jour pour régulariser le CA du 1ᵉʳ trimestre — confirmation sur URSSAF.',
      },
      {
        iso: q2.toISOString().slice(0, 10),
        label: `Indicatif après T2 ${y}`,
        detail: 'Souvent dernier jour pour le 2ᵉ trimestre — confirmation sur URSSAF.',
      },
      {
        iso: q3.toISOString().slice(0, 10),
        label: `Indicatif après T3 ${y}`,
        detail: 'Souvent dernier jour pour le 3ᵉ trimestre — confirmation sur URSSAF.',
      },
      {
        iso: q4.toISOString().slice(0, 10),
        label: `Indicatif après T4 ${y}`,
        detail:
          'Échéance fréquente pour le dernier trimestre (oct.–déc.) — confirmation sur URSSAF.',
      }
    );
  }
  const fromDay = new Date(Date.UTC(from.getFullYear(), from.getMonth(), from.getDate(), 12, 0, 0));
  return deadlines
    .filter((d) => new Date(d.iso + 'T12:00:00') >= fromDay)
    .sort((a, b) => a.iso.localeCompare(b.iso))
    .slice(0, count)
    .map((d) => ({
      isoDate: d.iso,
      label: d.label,
      detail: d.detail,
    }));
}

export function getDeclarationDeadlineHints(
  frequency: DeclarationFrequency,
  count: number,
  from: Date = new Date()
): DeadlineHint[] {
  if (frequency === 'monthly') return nextMonthlyHints(from, count);
  return nextQuarterlyHints(from, count);
}
