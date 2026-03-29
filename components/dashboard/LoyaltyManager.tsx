import React, { useState, useEffect, useMemo } from 'react';
import {
  Award,
  Star,
  Gift,
  TrendingUp,
  Settings,
  Users,
  Plus,
  Pencil,
  Trash2,
  Sparkles,
  Stamp,
  Info,
  Medal,
  Target,
  Heart,
} from 'lucide-react';
import type { LoyaltyEntry, Client, LoyaltyTier } from '../../types';

interface LoyaltyManagerProps {
  entries: LoyaltyEntry[];
  clients: Client[];
  onUpdatePoints: (clientId: string, points: number) => void;
  settings: LoyaltySettings;
  onUpdateSettings: (settings: LoyaltySettings) => void;
  /** Nom du studio — titre du programme si programName vide */
  studioName?: string;
}

export interface LoyaltySettings {
  enabled: boolean;
  pointsPerEuro: number;
  referralBonus: number;
  tierThresholds: { silver: number; gold: number; platinum: number };
  rewards: { name: string; cost: number }[];
  /** Titre affiché (sinon studioName ou défaut) */
  programName?: string;
  /** Sous-titre sous le titre principal */
  programSubtitle?: string;
  /** Nombre de cases tampons sur la carte client */
  stampSlots: number;
  /** Points nécessaires pour gagner 1 tampon */
  pointsPerStamp: number;
  /** Texte affiché aux clients (règle métier) */
  stampRuleDescription?: string;
}

const DEFAULT_SETTINGS: LoyaltySettings = {
  enabled: true,
  pointsPerEuro: 1,
  referralBonus: 50,
  tierThresholds: { silver: 200, gold: 500, platinum: 1000 },
  rewards: [
    { name: '10% sur prochain tattoo', cost: 100 },
    { name: 'Retouche gratuite', cost: 200 },
    { name: 'Flash offert (small)', cost: 500 },
  ],
  programName: '',
  programSubtitle: '',
  stampSlots: 10,
  pointsPerStamp: 100,
  stampRuleDescription: '1 tampon = 100 pts (ex. 100€ cumulés ou une séance validée selon ton règlement interne).',
};

/** Badges paliers — lisibles en clair & sombre (aligné CRM / dashboard) */
const TIER_COLORS: Record<LoyaltyTier, string> = {
  bronze: 'bg-amber-50 text-amber-900 border-amber-200 dark:bg-amber-950/35 dark:text-amber-200 dark:border-amber-800/50',
  silver: 'bg-zinc-100 text-zinc-800 border-zinc-200 dark:bg-zinc-500/15 dark:text-zinc-200 dark:border-zinc-500/35',
  gold: 'bg-amber-500/10 text-amber-800 border-amber-300 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/30',
  platinum: 'bg-violet-500/10 text-violet-700 border-violet-200 dark:bg-violet-500/15 dark:text-violet-200 dark:border-violet-500/35',
};

const TIER_LABELS: Record<LoyaltyTier, string> = {
  bronze: 'Bronze',
  silver: 'Argent',
  gold: 'Or',
  platinum: 'Platinum',
};

function mergeSettings(s: LoyaltySettings | undefined): LoyaltySettings {
  return { ...DEFAULT_SETTINGS, ...s, tierThresholds: { ...DEFAULT_SETTINGS.tierThresholds, ...s?.tierThresholds }, rewards: s?.rewards?.length ? s.rewards : DEFAULT_SETTINGS.rewards };
}

/** Tampons remplis à partir des points (plafonné sur stampSlots) */
export function stampsFromPoints(points: number, pointsPerStamp: number, stampSlots: number): number {
  const p = Math.max(1, pointsPerStamp);
  return Math.min(stampSlots, Math.floor(points / p));
}

function RewardIcon({ name }: { name: string }) {
  const n = name.toLowerCase();
  if (n.includes('%') || n.includes('réduction') || n.includes('10%')) return <PercentMini />;
  if (n.includes('retouche') || n.includes('soin')) {
    return <Sparkles className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />;
  }
  if (n.includes('flash')) return <Gift className="w-5 h-5 text-amber-600 dark:text-amber-400" />;
  return <Star className="w-5 h-5 text-blue-600 dark:text-blue-400" />;
}

function PercentMini() {
  return (
    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-500/15 text-sm font-black text-blue-700 dark:text-blue-400">
      %
    </span>
  );
}

function StampSlotsVisual({
  filled,
  total,
  size = 'md',
  className = '',
}: {
  filled: number;
  total: number;
  size?: 'sm' | 'md';
  className?: string;
}) {
  const dim = size === 'sm' ? 'w-5 h-5 text-[9px]' : 'w-7 h-7 text-xs';
  return (
    <div className={`flex flex-wrap gap-1 ${className}`} role="img" aria-label={`${filled} tampons sur ${total}`}>
      {Array.from({ length: total }).map((_, i) => {
        const on = i < filled;
        return (
          <div
            key={i}
            className={`${dim} rounded-full border-2 flex items-center justify-center font-bold transition-all shrink-0 active:scale-95 ${
              on
                ? 'border-emerald-500 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 shadow-sm dark:shadow-emerald-500/10'
                : 'border-zinc-200 bg-zinc-50 text-zinc-300 dark:border-zinc-600 dark:bg-zinc-800/80 dark:text-zinc-600'
            }`}
          >
            {on ? '✓' : ''}
          </div>
        );
      })}
    </div>
  );
}

export const LoyaltyManager: React.FC<LoyaltyManagerProps> = ({
  entries,
  clients,
  onUpdatePoints: _onUpdatePoints,
  settings,
  onUpdateSettings,
  studioName,
}) => {
  const cfg = useMemo(() => mergeSettings(settings), [settings]);
  const [showSettings, setShowSettings] = useState(false);
  const [draftSettings, setDraftSettings] = useState<LoyaltySettings>(cfg);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (showSettings) setDraftSettings(mergeSettings(settings));
  }, [showSettings, settings]);

  const displayTitle = (cfg.programName?.trim() || studioName?.trim() || 'Programme fidélité').trim();
  const displaySubtitle =
    cfg.programSubtitle?.trim() ||
    'Points, paliers et tampons — la même logique que côté client (carte fidélité).';

  const totalPoints = entries.reduce((sum, e) => sum + e.points, 0);
  const totalEarned = entries.reduce((sum, e) => sum + e.totalEarned, 0);
  const totalRedeemed = entries.reduce((sum, e) => sum + (e.totalRedeemed ?? 0), 0);
  const tierCounts = entries.reduce<Record<string, number>>((acc, e) => {
    acc[e.tier] = (acc[e.tier] || 0) + 1;
    return acc;
  }, {});

  const sortedEntries = [...entries].sort((a, b) => b.points - a.points);
  const topEntries = sortedEntries.slice(0, 12);
  const membersWithPoints = entries.filter((e) => e.points > 0).length;
  const avgPoints = entries.length ? Math.round(totalPoints / entries.length) : 0;

  const totalStampsVisual = entries.reduce(
    (sum, e) => sum + stampsFromPoints(e.points, cfg.pointsPerStamp, cfg.stampSlots),
    0,
  );

  const tierOrder: LoyaltyTier[] = ['platinum', 'gold', 'silver', 'bronze'];
  const maxTierCount = Math.max(1, ...tierOrder.map((t) => tierCounts[t] || 0));

  const saveSettings = () => {
    if (saving) return;
    setSaving(true);
    const cleaned: LoyaltySettings = {
      ...mergeSettings(draftSettings),
      rewards: (draftSettings.rewards || []).filter((r) => r.name.trim() !== ''),
      stampSlots: Math.min(20, Math.max(3, Number(draftSettings.stampSlots) || DEFAULT_SETTINGS.stampSlots)),
      pointsPerStamp: Math.max(1, Number(draftSettings.pointsPerStamp) || DEFAULT_SETTINGS.pointsPerStamp),
    };
    onUpdateSettings(cleaned);
    setShowSettings(false);
    setTimeout(() => setSaving(false), 400);
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in">
      {/* En-tête — même logique que Clients / Paramètres */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-4 min-w-0">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 shadow-sm">
            <Award className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-1">
              Fidélité studio
            </p>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-white font-display">
              {displayTitle}
            </h1>
            <p className="text-zinc-500 dark:text-zinc-400 text-sm sm:text-base mt-1.5 max-w-2xl leading-relaxed">
              {displaySubtitle}
            </p>
            {cfg.enabled === false && (
              <p className="mt-3 text-xs font-medium text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 shrink-0" />
                Programme désactivé — les clients ne voient pas les avantages jusqu’à réactivation.
              </p>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={() => setShowSettings(true)}
          className="flex items-center justify-center gap-2 min-h-[44px] px-5 py-2.5 rounded-xl font-medium border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-800/80 transition-all active:scale-[0.98] shrink-0"
        >
          <Settings className="w-4 h-4" /> Personnaliser
        </button>
      </div>

      {/* KPIs — cartes alignées ClientList */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[
          {
            label: 'Membres actifs',
            value: String(entries.length),
            hint: membersWithPoints ? `${membersWithPoints} avec des points` : 'Ajoute des clients au CRM',
            icon: Users,
            iconWrap: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400',
          },
          {
            label: 'Points en circulation',
            value: totalPoints.toLocaleString('fr-FR'),
            hint: 'Solde disponible côté clients',
            icon: Star,
            iconWrap: 'bg-blue-50 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400',
          },
          {
            label: 'Points distribués',
            value: totalEarned.toLocaleString('fr-FR'),
            hint: totalRedeemed > 0 ? `${totalRedeemed.toLocaleString('fr-FR')} pts déjà échangés` : 'Historique cumulé',
            icon: TrendingUp,
            iconWrap: 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
          },
          {
            label: 'Tampons (équivalent)',
            value: String(totalStampsVisual),
            hint: `${cfg.pointsPerStamp} pts / tampon · ${cfg.stampSlots} cases max`,
            icon: Stamp,
            iconWrap: 'bg-zinc-100 dark:bg-zinc-800 text-emerald-600 dark:text-emerald-400',
          },
        ].map((k) => (
          <div
            key={k.label}
            className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-4 sm:p-5 shadow-sm"
          >
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-xs sm:text-sm font-medium text-zinc-500 dark:text-zinc-400">{k.label}</span>
              <div className={`p-2 rounded-xl ${k.iconWrap}`}>
                <k.icon className="w-4 h-4" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-bold tabular-nums text-zinc-900 dark:text-white">{k.value}</div>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-500 mt-1.5 leading-snug">{k.hint}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Colonne principale : classement + carte tampons */}
        <div className="xl:col-span-2 space-y-6">
          {/* Aperçu carte tampons — carte type dashboard */}
          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 overflow-hidden shadow-sm border-l-4 border-l-emerald-500">
            <div className="px-5 py-4 border-b border-zinc-100 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-2 bg-zinc-50/80 dark:bg-zinc-900/30">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-500/15">
                  <Stamp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-bold text-zinc-900 dark:text-white">Carte tampons (aperçu)</h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    {cfg.stampSlots} cases · {cfg.pointsPerStamp} pts = 1 tampon
                  </p>
                </div>
              </div>
              <span className="text-[11px] font-medium px-2.5 py-1 rounded-full border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-400">
                Aperçu client
              </span>
            </div>
            <div className="p-5 sm:p-6">
              <div className="rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950/50 p-6 max-w-md mx-auto">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    Carte fidélité
                  </span>
                  <Heart className="w-4 h-4 text-emerald-600 dark:text-emerald-500/80" />
                </div>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4 line-clamp-3 leading-relaxed">
                  {cfg.stampRuleDescription || DEFAULT_SETTINGS.stampRuleDescription}
                </p>
                <StampSlotsVisual filled={Math.min(cfg.stampSlots, 7)} total={cfg.stampSlots} />
                <p className="text-[10px] text-zinc-500 mt-4 text-center">
                  Exemple visuel — les clients voient leurs tampons selon leurs points.
                </p>
              </div>
            </div>
          </div>

          {/* Classement */}
          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 overflow-hidden shadow-sm">
            <div className="px-5 py-4 border-b border-zinc-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="font-bold text-zinc-900 dark:text-white">Classement</h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Moyenne : {avgPoints} pts · paliers Argent / Or / Platinum selon les seuils
                </p>
              </div>
              <span className="text-xs font-medium text-zinc-500">Top {Math.min(12, topEntries.length) || '—'}</span>
            </div>
            {topEntries.length === 0 ? (
              <div className="py-14 px-6 text-center">
                <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-zinc-800 mb-4">
                  <Medal className="w-7 h-7 text-zinc-400" />
                </div>
                <p className="text-zinc-700 dark:text-zinc-300 font-semibold">Aucun membre fidélité pour l’instant</p>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2 max-w-sm mx-auto">
                  Les clients apparaissent ici lorsqu’ils sont liés à des points (CRM + programme). Importe ta base ou
                  enregistre des RDV pour alimenter le classement.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {topEntries.map((entry, idx) => {
                  const client = clients.find((c) => c.id === entry.clientId);
                  const stamps = stampsFromPoints(entry.points, cfg.pointsPerStamp, cfg.stampSlots);
                  const th = cfg.tierThresholds;
                  const nextTierPts =
                    entry.tier === 'bronze'
                      ? th.silver
                      : entry.tier === 'silver'
                        ? th.gold
                        : entry.tier === 'gold'
                          ? th.platinum
                          : null;
                  const progressNext =
                    nextTierPts != null ? Math.min(100, Math.round((entry.points / nextTierPts) * 100)) : 100;

                  return (
                    <li
                      key={entry.id}
                      className="flex flex-col sm:flex-row sm:items-center gap-4 px-4 sm:px-5 py-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <span className="text-lg font-black text-zinc-300 dark:text-zinc-600 w-8 tabular-nums">{idx + 1}</span>
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-zinc-200 to-zinc-300 dark:from-zinc-700 dark:to-zinc-800 text-zinc-800 dark:text-zinc-100 text-sm font-bold border border-zinc-200 dark:border-zinc-600">
                          {(client?.name || '?').slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold truncate text-zinc-900 dark:text-white">{client?.name || 'Client'}</div>
                          <div className="text-xs text-zinc-500 truncate">{client?.email}</div>
                          {nextTierPts != null && entry.tier !== 'platinum' && (
                            <div className="mt-2 max-w-xs">
                              <div className="h-1.5 rounded-full bg-zinc-200 dark:bg-zinc-700 overflow-hidden">
                                <div
                                  className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-600 dark:from-blue-500 dark:to-blue-400"
                                  style={{ width: `${progressNext}%` }}
                                />
                              </div>
                              <p className="text-[10px] text-zinc-500 mt-1">
                                {entry.points} / {nextTierPts} pts vers {TIER_LABELS[entry.tier === 'bronze' ? 'silver' : entry.tier === 'silver' ? 'gold' : 'platinum']}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col sm:items-end gap-2 pl-11 sm:pl-0">
                        <div className="flex flex-wrap items-center gap-2 justify-end">
                          <span
                            className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${TIER_COLORS[entry.tier]}`}
                          >
                            {TIER_LABELS[entry.tier]}
                          </span>
                          <span className="font-bold text-sm tabular-nums text-zinc-900 dark:text-white">
                            {entry.points} pts
                          </span>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <span className="text-[10px] uppercase tracking-wide text-zinc-500">Tampons</span>
                          <StampSlotsVisual filled={stamps} total={cfg.stampSlots} size="sm" />
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        {/* Colonne droite */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Target className="w-5 h-5 text-zinc-500" />
              <h3 className="font-bold text-zinc-900 dark:text-white">Répartition par palier</h3>
            </div>
            <div className="space-y-4">
              {tierOrder.map((tier) => {
                const n = tierCounts[tier] || 0;
                const pct = Math.round((n / maxTierCount) * 100);
                return (
                  <div key={tier}>
                    <div className="flex items-center justify-between text-sm mb-1.5">
                      <span className={`px-2 py-0.5 rounded-lg text-xs font-semibold border ${TIER_COLORS[tier]}`}>
                        {TIER_LABELS[tier]}
                      </span>
                      <span className="font-bold tabular-nums text-zinc-900 dark:text-white">{n}</span>
                    </div>
                    <div className="h-2 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          tier === 'platinum'
                            ? 'bg-violet-500'
                            : tier === 'gold'
                              ? 'bg-amber-500'
                              : tier === 'silver'
                                ? 'bg-zinc-400'
                                : 'bg-amber-800/80'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-zinc-900 dark:text-white">Récompenses</h3>
              <button
                type="button"
                onClick={() => setShowSettings(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-500/10 transition-colors"
              >
                <Pencil className="w-3.5 h-3.5" />
                Modifier
              </button>
            </div>
            <div className="space-y-3">
              {(cfg.rewards || DEFAULT_SETTINGS.rewards).map((reward, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-3 rounded-xl border border-zinc-200 dark:border-zinc-700/80 bg-zinc-50/80 dark:bg-zinc-950/50"
                >
                  <div className="shrink-0">
                    <RewardIcon name={reward.name} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-zinc-900 dark:text-white leading-snug">{reward.name}</p>
                    <p className="text-xs text-zinc-500 mt-0.5">Échangeable contre des points</p>
                  </div>
                  <span className="text-sm font-bold tabular-nums text-blue-600 dark:text-blue-400 shrink-0">
                    {reward.cost} pts
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800 p-4 sm:p-5 bg-zinc-50/80 dark:bg-zinc-900/40">
            <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed flex gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
                <Info className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
              </span>
              <span>
                Les tampons sont calculés à partir des points (configurable). Branchement Supabase à venir pour
                synchroniser les soldes avec l’espace client.
              </span>
            </p>
          </div>
        </div>
      </div>

      {showSettings && (
        <div
          className="fixed inset-0 z-50 bg-black/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowSettings(false)}
        >
          <div
            className="bg-white dark:bg-zinc-900 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 shrink-0">
              <h3 className="text-lg font-bold font-display text-zinc-900 dark:text-white">Personnalisation fidélité</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Titres, tampons, paliers et récompenses.</p>
            </div>
            <div className="p-6 overflow-y-auto space-y-4 flex-1 min-h-0">
              <label className="flex items-center gap-3 text-zinc-900 dark:text-white">
                <input
                  type="checkbox"
                  checked={draftSettings.enabled}
                  onChange={(e) => setDraftSettings((p) => ({ ...p, enabled: e.target.checked }))}
                  className="w-4 h-4 rounded border-zinc-400"
                />
                <span className="font-medium">Activer le programme</span>
              </label>

              <div>
                <label className="block text-sm font-semibold mb-1 text-zinc-900 dark:text-white">Titre du programme</label>
                <input
                  type="text"
                  value={draftSettings.programName ?? ''}
                  onChange={(e) => setDraftSettings((p) => ({ ...p, programName: e.target.value }))}
                  placeholder={studioName || 'Ex. Carte fidélité Ink Studio'}
                  className="w-full px-4 py-3 border border-zinc-200 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1 text-zinc-900 dark:text-white">Sous-titre</label>
                <input
                  type="text"
                  value={draftSettings.programSubtitle ?? ''}
                  onChange={(e) => setDraftSettings((p) => ({ ...p, programSubtitle: e.target.value }))}
                  placeholder="Une phrase pour ton équipe"
                  className="w-full px-4 py-3 border border-zinc-200 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold mb-1 text-zinc-900 dark:text-white">Tampons sur la carte</label>
                  <input
                    type="number"
                    value={draftSettings.stampSlots ?? DEFAULT_SETTINGS.stampSlots}
                    onChange={(e) =>
                      setDraftSettings((p) => ({ ...p, stampSlots: Number(e.target.value) }))
                    }
                    min={3}
                    max={20}
                    className="w-full px-4 py-3 border border-zinc-200 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1 text-zinc-900 dark:text-white">Pts / tampon</label>
                  <input
                    type="number"
                    value={draftSettings.pointsPerStamp ?? DEFAULT_SETTINGS.pointsPerStamp}
                    onChange={(e) =>
                      setDraftSettings((p) => ({ ...p, pointsPerStamp: Math.max(1, Number(e.target.value)) }))
                    }
                    min={1}
                    className="w-full px-4 py-3 border border-zinc-200 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1 text-zinc-900 dark:text-white">Règle tampons (texte libre)</label>
                <textarea
                  value={draftSettings.stampRuleDescription ?? ''}
                  onChange={(e) => setDraftSettings((p) => ({ ...p, stampRuleDescription: e.target.value }))}
                  rows={3}
                  placeholder="Ex. 1 tampon = 100 pts ou 1 séance validée…"
                  className="w-full px-4 py-3 border border-zinc-200 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1 text-zinc-900 dark:text-white">Points par euro dépensé</label>
                <input
                  type="number"
                  value={draftSettings.pointsPerEuro}
                  onChange={(e) => setDraftSettings((p) => ({ ...p, pointsPerEuro: Number(e.target.value) }))}
                  className="w-full px-4 py-3 border border-zinc-200 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  min={0}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1 text-zinc-900 dark:text-white">Bonus parrainage (points)</label>
                <input
                  type="number"
                  value={draftSettings.referralBonus}
                  onChange={(e) => setDraftSettings((p) => ({ ...p, referralBonus: Number(e.target.value) }))}
                  className="w-full px-4 py-3 border border-zinc-200 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  min={0}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2 text-zinc-900 dark:text-white">Seuils de palier (points)</label>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-xs text-zinc-500">Argent</label>
                    <input
                      type="number"
                      value={draftSettings.tierThresholds.silver}
                      onChange={(e) =>
                        setDraftSettings((p) => ({
                          ...p,
                          tierThresholds: { ...p.tierThresholds, silver: Number(e.target.value) },
                        }))
                      }
                      className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-zinc-500">Or</label>
                    <input
                      type="number"
                      value={draftSettings.tierThresholds.gold}
                      onChange={(e) =>
                        setDraftSettings((p) => ({
                          ...p,
                          tierThresholds: { ...p.tierThresholds, gold: Number(e.target.value) },
                        }))
                      }
                      className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-zinc-500">Platinum</label>
                    <input
                      type="number"
                      value={draftSettings.tierThresholds.platinum}
                      onChange={(e) =>
                        setDraftSettings((p) => ({
                          ...p,
                          tierThresholds: { ...p.tierThresholds, platinum: Number(e.target.value) },
                        }))
                      }
                      className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-zinc-900 dark:text-white">Récompenses</label>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-3">
                  Ajoutez, modifiez ou supprimez les récompenses échangeables contre des points.
                </p>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {(draftSettings.rewards || []).map((reward, i) => (
                    <div key={i} className="flex gap-2 items-center p-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700">
                      <input
                        type="text"
                        value={reward.name}
                        onChange={(e) => {
                          const next = [...(draftSettings.rewards || [])];
                          next[i] = { ...next[i], name: e.target.value };
                          setDraftSettings((p) => ({ ...p, rewards: next }));
                        }}
                        placeholder="Nom de la récompense"
                        className="flex-1 min-w-0 px-3 py-2 text-sm border border-zinc-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                      />
                      <input
                        type="number"
                        value={reward.cost}
                        onChange={(e) => {
                          const next = [...(draftSettings.rewards || [])];
                          next[i] = { ...next[i], cost: Math.max(0, Number(e.target.value)) };
                          setDraftSettings((p) => ({ ...p, rewards: next }));
                        }}
                        min={0}
                        className="w-20 px-2 py-2 text-sm border border-zinc-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                      />
                      <span className="text-xs text-zinc-500 shrink-0">pts</span>
                      <button
                        type="button"
                        onClick={() => {
                          const next = (draftSettings.rewards || []).filter((_, j) => j !== i);
                          setDraftSettings((p) => ({ ...p, rewards: next }));
                        }}
                        className="p-2 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors"
                        aria-label="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setDraftSettings((p) => ({ ...p, rewards: [...(p.rewards || []), { name: '', cost: 100 }] }))}
                  className="mt-2 w-full py-2.5 rounded-xl border-2 border-dashed border-zinc-300 dark:border-zinc-600 text-zinc-600 dark:text-zinc-400 hover:border-blue-500/50 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-500/5 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                >
                  <Plus className="w-4 h-4" />
                  Ajouter une récompense
                </button>
              </div>

              <button
                type="button"
                onClick={saveSettings}
                disabled={saving}
                className="w-full py-3 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl font-semibold hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white dark:border-zinc-400/30 dark:border-t-zinc-900 rounded-full animate-spin" />{' '}
                    Enregistrement…
                  </>
                ) : (
                  'Enregistrer'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
