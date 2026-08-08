/** Items PRD checklist mensuelle — clés stables en base. */
export const FISCAL_MONTHLY_CHECKLIST_ITEMS = [
  {
    key: 'declare_urssaf',
    label: 'Déclarer le CA à l’URSSAF (période en cours)',
  },
  {
    key: 'check_plafond',
    label: 'Vérifier le plafond auto-entrepreneur',
  },
  {
    key: 'stripe_releve',
    label: 'Télécharger / archiver ton relevé de paiements (Stripe ou caisse)',
  },
  {
    key: 'factures_attentes',
    label: 'Relancer ou émettre les factures clients en attente',
  },
  {
    key: 'rc_pro',
    label: 'Contrôler assurance RC Pro (contrat à jour)',
  },
] as const;

export type FiscalChecklistKey = (typeof FISCAL_MONTHLY_CHECKLIST_ITEMS)[number]['key'];

export function currentMonthKey(): string {
  const n = new Date();
  const y = n.getFullYear();
  const m = String(n.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}
