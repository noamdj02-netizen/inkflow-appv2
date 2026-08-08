import React, { useState, useEffect } from 'react';
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
  Mail,
} from 'lucide-react';
import type { LoyaltyEntry, Client, LoyaltyTier } from '../../types';

interface LoyaltyManagerProps {
  entries: LoyaltyEntry[];
  clients: Client[];
  onUpdatePoints: (clientId: string, points: number) => void;
  settings: LoyaltySettings;
  onUpdateSettings: (settings: LoyaltySettings) => void;
}

export interface LoyaltySettings {
  enabled: boolean;
  pointsPerEuro: number;
  referralBonus: number;
  tierThresholds: { silver: number; gold: number; platinum: number };
  rewards: { name: string; cost: number }[];
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
};

const TIER_COLORS: Record<LoyaltyTier, string> = {
  bronze: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-500/20 dark:text-zinc-400',
  silver: 'bg-zinc-200 text-zinc-800 dark:bg-zinc-500/30 dark:text-zinc-300',
  gold: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400',
  platinum: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400',
};

export const LoyaltyManager: React.FC<LoyaltyManagerProps> = ({
  entries,
  clients,
  onUpdatePoints: _onUpdatePoints,
  settings,
  onUpdateSettings,
}) => {
  const [showSettings, setShowSettings] = useState(false);
  const [draftSettings, setDraftSettings] = useState<LoyaltySettings>(settings || DEFAULT_SETTINGS);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (showSettings) setDraftSettings(settings || DEFAULT_SETTINGS);
  }, [showSettings, settings]);

  const totalPoints = entries.reduce((sum, e) => sum + e.points, 0);
  const totalEarned = entries.reduce((sum, e) => sum + e.totalEarned, 0);
  const tierCounts = entries.reduce(
    (acc: Record<string, number>, e) => {
      acc[e.tier] = (acc[e.tier] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const sortedEntries = [...entries].sort((a, b) => b.points - a.points);
  const topEntries = sortedEntries.slice(0, 10);

  const saveSettings = () => {
    if (saving) return;
    setSaving(true);
    const cleaned = {
      ...draftSettings,
      rewards: (draftSettings.rewards || []).filter((r) => r.name.trim() !== ''),
    };
    onUpdateSettings(cleaned);
    setShowSettings(false);
    setTimeout(() => setSaving(false), 400);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <h2 className="type-heading-sm">Programme de fidelite</h2>
            <p className="text-[var(--text-secondary)] text-sm">{entries.length} membres</p>
          </div>
        </div>
        <button
          onClick={() => setShowSettings(true)}
          className="flex items-center gap-2 px-4 py-2 border border-[var(--border)] rounded-xl text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--bg-hover)] active:scale-[0.98] transition-all"
        >
          <Settings className="w-4 h-4" /> Configurer
        </button>
      </div>

      <div className="rounded-2xl border border-[var(--border)] border-l-4 border-l-emerald-500/80 bg-[var(--bg-card)] p-4 sm:p-5">
        <div className="flex gap-3">
          <div className="shrink-0 p-2 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
            <Mail className="w-5 h-5" />
          </div>
          <div className="min-w-0 space-y-1">
            <p className="text-sm font-semibold text-[var(--text-primary)]">
              Emails post-seance (MVP)
            </p>
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
              J+1 soins, J+7 check-up et J+30 retour sont envoyes automatiquement par la fonction
              Edge{' '}
              <code className="text-xs text-[var(--text-primary)] bg-[var(--bg-hover)] px-1.5 py-0.5 rounded-md">
                send-loyalty-emails
              </code>{' '}
              (cron quotidien). Verifie dans Supabase que le job pg_cron pointe vers ton projet (
              <code className="text-xs">…/functions/v1/send-loyalty-emails</code>
              ), pas une URL d&apos;un autre environnement.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-[var(--bg-card)] rounded-2xl p-6 border border-[var(--border)]">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-5 h-5 text-[var(--text-secondary)]" />
            <span className="text-sm text-[var(--text-secondary)]">Membres</span>
          </div>
          <div className="type-heading">{entries.length}</div>
        </div>
        <div className="bg-[var(--bg-card)] rounded-2xl p-6 border border-[var(--border)]">
          <div className="flex items-center gap-2 mb-2">
            <Star className="w-5 h-5 text-blue-500 dark:text-blue-400" />
            <span className="text-sm text-[var(--text-secondary)]">Points en circulation</span>
          </div>
          <div className="type-heading">{totalPoints.toLocaleString()}</div>
        </div>
        <div className="bg-[var(--bg-card)] rounded-2xl p-6 border border-[var(--border)]">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <span className="text-sm text-[var(--text-secondary)]">Points distribues</span>
          </div>
          <div className="type-heading">{totalEarned.toLocaleString()}</div>
        </div>
        <div className="bg-[var(--bg-card)] rounded-2xl p-6 border border-[var(--border)]">
          <div className="flex items-center gap-2 mb-2">
            <Gift className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <span className="text-sm text-[var(--text-secondary)]">Recompenses</span>
          </div>
          <div className="type-heading">{settings?.rewards?.length || 0}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] overflow-hidden">
          <div className="px-6 py-4 border-b border-[var(--border)]">
            <h3 className="font-bold text-[var(--text-primary)]">Classement</h3>
          </div>
          <div className="divide-y divide-[var(--border)]">
            {topEntries.length === 0 ? (
              <div className="py-8 text-center text-[var(--text-tertiary)]">Aucun membre</div>
            ) : (
              topEntries.map((entry, idx) => {
                const client = clients.find((c) => c.id === entry.clientId);
                return (
                  <div
                    key={entry.id}
                    className="flex items-center px-6 py-4 hover:bg-[var(--bg-hover)]"
                  >
                    <span className="text-lg font-bold text-[var(--text-tertiary)] w-8">
                      {idx + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold truncate text-[var(--text-primary)]">
                        {client?.name || 'Client'}
                      </div>
                      <div className="text-xs text-[var(--text-secondary)]">{client?.email}</div>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold mr-4 ${TIER_COLORS[entry.tier]}`}
                    >
                      {entry.tier.charAt(0).toUpperCase() + entry.tier.slice(1)}
                    </span>
                    <span className="font-bold text-sm text-[var(--text-primary)]">
                      {entry.points} pts
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="bg-[var(--bg-card)] rounded-2xl p-6 border border-[var(--border)] shadow-sm">
          <h3 className="font-bold mb-4 text-[var(--text-primary)] tracking-tight">Répartition</h3>
          <div className="space-y-3">
            {(['platinum', 'gold', 'silver', 'bronze'] as LoyaltyTier[]).map((tier) => (
              <div key={tier} className="flex items-center justify-between py-2">
                <span
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold ${TIER_COLORS[tier]}`}
                >
                  {tier.charAt(0).toUpperCase() + tier.slice(1)}
                </span>
                <span className="font-bold text-sm text-[var(--text-primary)]">
                  {tierCounts[tier] || 0}
                </span>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between mt-6 mb-3">
            <h3 className="font-bold text-[var(--text-primary)] tracking-tight">
              Récompenses disponibles
            </h3>
            <button
              type="button"
              onClick={() => setShowSettings(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-500/10 transition-colors"
            >
              <Pencil className="w-3.5 h-3.5" />
              Modifier
            </button>
          </div>
          <div className="space-y-2">
            {(settings?.rewards || DEFAULT_SETTINGS.rewards).map((reward, i) => (
              <div
                key={i}
                className="flex items-center justify-between text-sm p-3 bg-[var(--bg-card-secondary)] rounded-xl border border-[var(--border)]"
              >
                <span className="text-[var(--text-primary)] font-medium">{reward.name}</span>
                <span className="font-bold text-blue-600 dark:text-blue-400">
                  {reward.cost} pts
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {showSettings && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setShowSettings(false)}
        >
          <div
            className="bg-[var(--bg-card)] rounded-2xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto border border-[var(--border)]"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold mb-4 text-[var(--text-primary)]">
              Configuration fidelite
            </h3>
            <div className="space-y-4">
              <label className="flex items-center gap-3 text-[var(--text-primary)]">
                <input
                  type="checkbox"
                  checked={draftSettings.enabled}
                  onChange={(e) => setDraftSettings((p) => ({ ...p, enabled: e.target.checked }))}
                  className="w-4 h-4"
                />
                <span className="font-medium">Activer le programme</span>
              </label>
              <div>
                <label className="block text-sm font-semibold mb-1 text-[var(--text-primary)]">
                  Points par euro depense
                </label>
                <input
                  type="number"
                  value={draftSettings.pointsPerEuro}
                  onChange={(e) =>
                    setDraftSettings((p) => ({ ...p, pointsPerEuro: Number(e.target.value) }))
                  }
                  className="w-full px-4 py-3 border border-[var(--border)] rounded-xl bg-[var(--bg-primary)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  min={0}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1 text-[var(--text-primary)]">
                  Bonus parrainage (points)
                </label>
                <input
                  type="number"
                  value={draftSettings.referralBonus}
                  onChange={(e) =>
                    setDraftSettings((p) => ({ ...p, referralBonus: Number(e.target.value) }))
                  }
                  className="w-full px-4 py-3 border border-[var(--border)] rounded-xl bg-[var(--bg-primary)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  min={0}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2 text-[var(--text-primary)]">
                  Seuils de tier (points)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-xs text-[var(--text-tertiary)]">Silver</label>
                    <input
                      type="number"
                      value={draftSettings.tierThresholds.silver}
                      onChange={(e) =>
                        setDraftSettings((p) => ({
                          ...p,
                          tierThresholds: { ...p.tierThresholds, silver: Number(e.target.value) },
                        }))
                      }
                      className="w-full px-3 py-2 border border-[var(--border)] rounded-lg text-sm bg-[var(--bg-primary)] text-[var(--text-primary)]"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-[var(--text-tertiary)]">Gold</label>
                    <input
                      type="number"
                      value={draftSettings.tierThresholds.gold}
                      onChange={(e) =>
                        setDraftSettings((p) => ({
                          ...p,
                          tierThresholds: { ...p.tierThresholds, gold: Number(e.target.value) },
                        }))
                      }
                      className="w-full px-3 py-2 border border-[var(--border)] rounded-lg text-sm bg-[var(--bg-primary)] text-[var(--text-primary)]"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-[var(--text-tertiary)]">Platinum</label>
                    <input
                      type="number"
                      value={draftSettings.tierThresholds.platinum}
                      onChange={(e) =>
                        setDraftSettings((p) => ({
                          ...p,
                          tierThresholds: { ...p.tierThresholds, platinum: Number(e.target.value) },
                        }))
                      }
                      className="w-full px-3 py-2 border border-[var(--border)] rounded-lg text-sm bg-[var(--bg-primary)] text-[var(--text-primary)]"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-[var(--text-primary)]">
                  Récompenses
                </label>
                <p className="text-xs text-[var(--text-tertiary)] mb-3">
                  Ajoutez, modifiez ou supprimez les récompenses échangeables contre des points.
                </p>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {(draftSettings.rewards || []).map((reward, i) => (
                    <div
                      key={i}
                      className="flex gap-2 items-center p-2 rounded-xl bg-[var(--bg-card-secondary)] border border-[var(--border)]"
                    >
                      <input
                        type="text"
                        value={reward.name}
                        onChange={(e) => {
                          const next = [...(draftSettings.rewards || [])];
                          next[i] = { ...next[i], name: e.target.value };
                          setDraftSettings((p) => ({ ...p, rewards: next }));
                        }}
                        placeholder="Nom de la récompense"
                        className="flex-1 min-w-0 px-3 py-2 text-sm border border-[var(--border)] rounded-lg bg-[var(--bg-primary)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500/50"
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
                        className="w-20 px-2 py-2 text-sm border border-[var(--border)] rounded-lg bg-[var(--bg-primary)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      />
                      <span className="text-xs text-[var(--text-tertiary)] shrink-0">pts</span>
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
                  onClick={() =>
                    setDraftSettings((p) => ({
                      ...p,
                      rewards: [...(p.rewards || []), { name: '', cost: 100 }],
                    }))
                  }
                  className="mt-2 w-full py-2.5 rounded-xl border-2 border-dashed border-[var(--border)] text-[var(--text-secondary)] hover:border-blue-500/50 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-500/5 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                >
                  <Plus className="w-4 h-4" />
                  Ajouter une récompense
                </button>
              </div>

              <button
                onClick={saveSettings}
                disabled={saving}
                className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-500 dark:bg-blue-500 dark:hover:bg-blue-600 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />{' '}
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
