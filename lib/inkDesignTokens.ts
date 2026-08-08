/**
 * Design system InkFlow — mode OLED / True Black (#000000).
 * Hiérarchie par espacement + léger glass / dégradé radial (pas de bordures en dark).
 */
export const INK = {
  bg: '#000000',
  surface: '#111111',
  surfaceRaised: '#161616',
  text: '#ffffff',
  textMuted: '#737373',
  primary: '#3b82f6',
  success: '#22c55e',
  revenue: '#34d399',
  error: '#ef4444',
  warning: '#f59e0b',
  radiusCard: '20px',
  radiusBadge: '8px',
} as const;

/** Carte flottante — 20px, noir absolu, relief subtil (classe CSS `.ink-oled-card`) */
export const inkOledCard =
  'ink-oled-card overflow-hidden rounded-[20px] border border-zinc-200 bg-white dark:border-0 dark:bg-black';

/** Variante glass très légère */
export const inkOledGlass =
  'ink-oled-glass overflow-hidden rounded-[20px] border border-zinc-200 bg-white dark:border-0';

/** Surface surélevée — visible sur #000 (agenda, cartes RDV) */
export const inkOledElevated =
  'ink-oled-elevated overflow-hidden rounded-[20px] border border-zinc-200 bg-white dark:border-0';

/** Bandeau / pill container */
export const inkOledSurfaceMuted =
  'rounded-[20px] border border-zinc-200 bg-zinc-50 dark:border-0 dark:bg-white/[0.06]';

/** Contrôles (toggle, boutons icône) */
export const inkOledControl = 'border-0 bg-zinc-100 dark:bg-white/[0.08] dark:text-white';

/** Méta lisible (pas trop sombre) */
export const inkMeta = 'text-zinc-500 dark:text-[#a3a3a3]';

/** Alias historique */
export const inkSurfaceCard = inkOledCard;

/** Liste — séparation par espacement uniquement (dark) */
export const inkListRow = 'border-0 border-b-0 py-5 first:pt-2 last:pb-2 dark:py-5';

/** Stack de cartes flottantes */
export const inkOledStack = 'ink-oled-stack flex flex-col';

/** Typo */
export const inkTitle = 'font-semibold text-zinc-900 dark:text-white';
export const inkSubtitle = 'text-zinc-500 dark:text-[#737373]';

/** Carte KPI — padding généreux, sans bordure (dark) */
export const inkStatCard =
  'ink-oled-card rounded-[20px] border border-zinc-200 bg-white p-5 dark:border-0 dark:bg-black sm:p-6';

/** Label au-dessus du chiffre — 14px, gris froid */
export const inkStatLabel =
  'block text-sm font-medium leading-snug text-zinc-500 dark:text-[#737373]';

/** Chiffre clé — 24px, bold, tabular */
export const inkStatValueBase =
  'mt-2.5 text-2xl font-bold tabular-nums leading-none tracking-tight';

/** Volume (clients, RDV) — blanc pur */
export const inkStatValueVolume = `${inkStatValueBase} text-zinc-900 dark:text-white`;

/** Revenus / gains — émeraude lumineux */
export const inkStatValueRevenue = `${inkStatValueBase} text-emerald-700 dark:text-[#34D399]`;

/** VIP — accent ambre (compte distinct) */
export const inkStatValueVip = `${inkStatValueBase} text-amber-700 dark:text-amber-400`;

/** Métrique inline liste (montant) */
export const inkMetricRevenue = 'font-bold tabular-nums text-emerald-700 dark:text-[#34D399]';

/** Métrique inline liste (volume / compte) */
export const inkMetricVolume = 'font-semibold tabular-nums text-zinc-900 dark:text-white';

/** Donut RDV — palette bleus (saturé → clair) */
export const INK_DONUT_RDV = {
  confirmed: '#2563EB',
  pending: '#3B82F6',
  in_progress: '#60A5FA',
  completed: '#7DD3FC',
  other: '#93C5FD',
} as const;

/** Donut demandes projet */
export const INK_DONUT_DEMANDES = {
  pending: '#3B82F6',
  accepted: '#60A5FA',
  confirmed: '#2563EB',
  rejected: '#93C5FD',
} as const;

/** Légende donut */
export const inkDonutLegendLabel = 'truncate text-sm font-medium text-zinc-600 dark:text-[#f5f5f5]';
export const inkDonutLegendValue =
  'shrink-0 text-sm font-bold tabular-nums text-zinc-900 dark:text-white';

/** Badge statut — pastels vifs sur noir */
export const inkBadgeBase =
  'inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-0.5 text-[10px] font-semibold sm:text-xs';

export const inkBadgePending = `${inkBadgeBase} bg-amber-500/15 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400`;
export const inkBadgePrimary = `${inkBadgeBase} bg-blue-500/15 text-blue-700 dark:bg-blue-500/20 dark:text-[#3b82f6]`;
export const inkBadgeSuccess = `${inkBadgeBase} bg-emerald-500/15 text-emerald-700 dark:bg-[#22c55e]/15 dark:text-[#22c55e]`;
export const inkBadgeError = `${inkBadgeBase} bg-red-500/15 text-red-700 dark:bg-[#ef4444]/15 dark:text-[#ef4444]`;
export const inkBadgeNeutral = `${inkBadgeBase} bg-zinc-500/10 text-zinc-600 dark:bg-white/5 dark:text-[#737373]`;

/** Bouton icône — accent vif, sans bordure */
export const inkIconActionBtn =
  'flex size-10 shrink-0 items-center justify-center rounded-xl border-0 text-zinc-600 transition-all hover:bg-zinc-100 active:scale-[0.98] dark:bg-white/[0.05] dark:text-[#3b82f6] dark:hover:bg-white/[0.08]';

/** CTA primaire — flotte sur le noir */
export const inkBtnPrimary =
  'inline-flex min-h-11 items-center justify-center rounded-[20px] border-0 bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-all hover:bg-blue-500 active:scale-[0.98] dark:bg-[#3b82f6] dark:hover:bg-blue-500';
