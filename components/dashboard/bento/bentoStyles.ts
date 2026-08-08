/**
 * Tokens Bento — OLED true black, cartes flottantes sans bordure.
 */
import { inkOledCard } from '@/lib/inkDesignTokens';
import {
  dashboardListPanel,
  dashboardSettingsDivide,
  dashboardStatIconBadge,
  dashboardStatTile,
  dashboardStatusBadge,
} from '../ui/dashboardChrome';

/** Carte Bento — relief radial subtil en dark */
export const glassPanel = inkOledCard;

export const bentoStatTile = dashboardStatTile;
export const bentoStatIconBadge = dashboardStatIconBadge;

export const bentoListBlock = 'overflow-hidden';

export const bentoListDivided = dashboardSettingsDivide;

export const bentoListItem = 'flex min-h-[52px] items-center gap-3 px-4 py-3.5';

export const bentoBadge =
  'inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-semibold';

export const microHover = 'transition-all duration-200 active:scale-[0.98]';

/** Montants € dans listes bento — Inter Semibold compact. */
export const bentoAmountStat =
  'type-stat type-stat--inter-semibold type-stat--compact tabular-nums text-zinc-900 dark:text-zinc-50';

/** KPI tuile bento (Revenu / Prévision / Acomptes) — Inter Semibold, taille lg/xl. */
export const bentoKpiAmountStat =
  'type-stat type-stat--inter-semibold type-stat--kpi tabular-nums text-zinc-900 dark:text-zinc-50';

/** Bouton action premium (remplace bleu). */
export const bentoActionBtn =
  'min-h-11 rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-zinc-800 active:scale-[0.98]';

export { dashboardListPanel, dashboardStatusBadge };

export function formatTimeRange(startIso: string, endIso: string): string {
  const start = new Date(startIso);
  const end = new Date(endIso);
  const opt: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit' };
  return `${start.toLocaleTimeString('fr-FR', opt)}–${end.toLocaleTimeString('fr-FR', opt)}`;
}

export function formatMoney(amountCents: number, currency: string): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: currency.toUpperCase(),
    maximumFractionDigits: 2,
  }).format(amountCents / 100);
}

export function formatRelativeShort(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString('fr-FR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function statusChip(
  kind: 'slot' | 'pay' | 'req',
  value: string
): { label: string; className: string } {
  if (kind === 'slot') {
    if (value === 'confirmé') return { label: 'Confirmé', className: dashboardStatusBadge.active };
    if (value === 'provisoire')
      return { label: 'Provisoire', className: dashboardStatusBadge.pending };
    return { label: 'En attente', className: dashboardStatusBadge.neutral };
  }
  if (kind === 'pay') {
    if (value === 'réussi') return { label: 'Reçu', className: dashboardStatusBadge.active };
    if (value === 'remboursé')
      return { label: 'Remboursé', className: dashboardStatusBadge.neutral };
    return { label: 'Traitement', className: dashboardStatusBadge.new };
  }
  if (value === 'haut') return { label: 'Prioritaire', className: dashboardStatusBadge.pending };
  if (value === 'bas') return { label: 'Calme', className: dashboardStatusBadge.neutral };
  return { label: 'Standard', className: dashboardStatusBadge.new };
}

export function subscriptionPill(status: string | null | undefined): {
  label: string;
  className: string;
} {
  const s = (status ?? '').trim();
  if (s === 'trialing') return { label: 'Essai gratuit', className: dashboardStatusBadge.pending };
  if (s === 'active') return { label: 'Abonnement actif', className: dashboardStatusBadge.active };
  if (s === 'past_due')
    return { label: 'Paiement à régulariser', className: dashboardStatusBadge.danger };
  if (s === 'canceled' || s === 'cancelled')
    return { label: 'Abonnement arrêté', className: dashboardStatusBadge.neutral };
  if (!s) return { label: 'Abonnement', className: dashboardStatusBadge.neutral };
  return {
    label: s.replace(/_/g, ' '),
    className: dashboardStatusBadge.neutral,
  };
}
