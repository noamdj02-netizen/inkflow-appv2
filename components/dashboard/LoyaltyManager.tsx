import React, { useState } from 'react';
import { Award, Star, Gift, TrendingUp, Settings, Users } from 'lucide-react';
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

const TIER_ICONS: Record<LoyaltyTier, string> = {
  bronze: 'B',
  silver: 'A',
  gold: 'O',
  platinum: 'P',
};

export const LoyaltyManager: React.FC<LoyaltyManagerProps> = ({ entries, clients, onUpdatePoints, settings, onUpdateSettings }) => {
  const [showSettings, setShowSettings] = useState(false);
  const [draftSettings, setDraftSettings] = useState<LoyaltySettings>(settings || DEFAULT_SETTINGS);
  const [saving, setSaving] = useState(false);

  const totalPoints = entries.reduce((sum, e) => sum + e.points, 0);
  const totalEarned = entries.reduce((sum, e) => sum + e.totalEarned, 0);
  const tierCounts = entries.reduce<Record<string, number>>((acc, e) => {
    acc[e.tier] = (acc[e.tier] || 0) + 1;
    return acc;
  }, {});

  const sortedEntries = [...entries].sort((a, b) => b.points - a.points);
  const topEntries = sortedEntries.slice(0, 10);

  const saveSettings = () => {
    if (saving) return;
    setSaving(true);
    onUpdateSettings(draftSettings);
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
            <h2 className="text-xl font-bold text-[var(--text-primary)]">Programme de fidelite</h2>
            <p className="text-[var(--text-secondary)] text-sm">{entries.length} membres</p>
          </div>
        </div>
        <button onClick={() => setShowSettings(true)}
          className="flex items-center gap-2 px-4 py-2 border border-[var(--border)] rounded-xl text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--bg-hover)]">
          <Settings className="w-4 h-4" /> Configurer
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-[var(--bg-card)] rounded-2xl p-6 border border-[var(--border)]">
          <div className="flex items-center gap-2 mb-2"><Users className="w-5 h-5 text-[var(--text-secondary)]" /><span className="text-sm text-[var(--text-secondary)]">Membres</span></div>
          <div className="text-2xl font-bold text-[var(--text-primary)]">{entries.length}</div>
        </div>
        <div className="bg-[var(--bg-card)] rounded-2xl p-6 border border-[var(--border)]">
          <div className="flex items-center gap-2 mb-2"><Star className="w-5 h-5 text-blue-500 dark:text-blue-400" /><span className="text-sm text-[var(--text-secondary)]">Points en circulation</span></div>
          <div className="text-2xl font-bold text-[var(--text-primary)]">{totalPoints.toLocaleString()}</div>
        </div>
        <div className="bg-[var(--bg-card)] rounded-2xl p-6 border border-[var(--border)]">
          <div className="flex items-center gap-2 mb-2"><TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" /><span className="text-sm text-[var(--text-secondary)]">Points distribues</span></div>
          <div className="text-2xl font-bold text-[var(--text-primary)]">{totalEarned.toLocaleString()}</div>
        </div>
        <div className="bg-[var(--bg-card)] rounded-2xl p-6 border border-[var(--border)]">
          <div className="flex items-center gap-2 mb-2"><Gift className="w-5 h-5 text-blue-600 dark:text-blue-400" /><span className="text-sm text-[var(--text-secondary)]">Recompenses</span></div>
          <div className="text-2xl font-bold text-[var(--text-primary)]">{settings?.rewards?.length || 0}</div>
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
                const client = clients.find(c => c.id === entry.clientId);
                return (
                  <div key={entry.id} className="flex items-center px-6 py-4 hover:bg-[var(--bg-hover)]">
                    <span className="text-lg font-bold text-[var(--text-tertiary)] w-8">{idx + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold truncate text-[var(--text-primary)]">{client?.name || 'Client'}</div>
                      <div className="text-xs text-[var(--text-secondary)]">{client?.email}</div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold mr-4 ${TIER_COLORS[entry.tier]}`}>
                      {entry.tier.charAt(0).toUpperCase() + entry.tier.slice(1)}
                    </span>
                    <span className="font-bold text-sm text-[var(--text-primary)]">{entry.points} pts</span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="bg-[var(--bg-card)] rounded-2xl p-6 border border-[var(--border)]">
          <h3 className="font-bold mb-4 text-[var(--text-primary)]">Repartition</h3>
          <div className="space-y-3">
            {(['platinum', 'gold', 'silver', 'bronze'] as LoyaltyTier[]).map(tier => (
              <div key={tier} className="flex items-center justify-between">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${TIER_COLORS[tier]}`}>
                  {tier.charAt(0).toUpperCase() + tier.slice(1)}
                </span>
                    <span className="font-bold text-sm text-[var(--text-primary)]">{tierCounts[tier] || 0}</span>
              </div>
            ))}
          </div>

          <h3 className="font-bold mt-6 mb-3 text-[var(--text-primary)]">Recompenses disponibles</h3>
          <div className="space-y-2">
            {(settings?.rewards || DEFAULT_SETTINGS.rewards).map((reward, i) => (
              <div key={i} className="flex items-center justify-between text-sm p-3 bg-[var(--bg-card-secondary)] rounded-xl">
                <span className="text-[var(--text-primary)]">{reward.name}</span>
                <span className="font-bold text-blue-600 dark:text-blue-400">{reward.cost} pts</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {showSettings && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setShowSettings(false)}>
          <div className="bg-[var(--bg-card)] rounded-2xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto border border-[var(--border)]" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-4 text-[var(--text-primary)]">Configuration fidelite</h3>
            <div className="space-y-4">
              <label className="flex items-center gap-3 text-[var(--text-primary)]">
                <input type="checkbox" checked={draftSettings.enabled} onChange={e => setDraftSettings(p => ({ ...p, enabled: e.target.checked }))} className="w-4 h-4" />
                <span className="font-medium">Activer le programme</span>
              </label>
              <div>
                <label className="block text-sm font-semibold mb-1 text-[var(--text-primary)]">Points par euro depense</label>
                <input type="number" value={draftSettings.pointsPerEuro} onChange={e => setDraftSettings(p => ({ ...p, pointsPerEuro: Number(e.target.value) }))}
                  className="w-full px-4 py-3 border border-[var(--border)] rounded-xl bg-[var(--bg-primary)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500/50" min={0} />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1 text-[var(--text-primary)]">Bonus parrainage (points)</label>
                <input type="number" value={draftSettings.referralBonus} onChange={e => setDraftSettings(p => ({ ...p, referralBonus: Number(e.target.value) }))}
                  className="w-full px-4 py-3 border border-[var(--border)] rounded-xl bg-[var(--bg-primary)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500/50" min={0} />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2 text-[var(--text-primary)]">Seuils de tier (points)</label>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-xs text-[var(--text-tertiary)]">Silver</label>
                    <input type="number" value={draftSettings.tierThresholds.silver}
                      onChange={e => setDraftSettings(p => ({ ...p, tierThresholds: { ...p.tierThresholds, silver: Number(e.target.value) } }))}
                      className="w-full px-3 py-2 border border-[var(--border)] rounded-lg text-sm bg-[var(--bg-primary)] text-[var(--text-primary)]" />
                  </div>
                  <div>
                    <label className="text-xs text-[var(--text-tertiary)]">Gold</label>
                    <input type="number" value={draftSettings.tierThresholds.gold}
                      onChange={e => setDraftSettings(p => ({ ...p, tierThresholds: { ...p.tierThresholds, gold: Number(e.target.value) } }))}
                      className="w-full px-3 py-2 border border-[var(--border)] rounded-lg text-sm bg-[var(--bg-primary)] text-[var(--text-primary)]" />
                  </div>
                  <div>
                    <label className="text-xs text-[var(--text-tertiary)]">Platinum</label>
                    <input type="number" value={draftSettings.tierThresholds.platinum}
                      onChange={e => setDraftSettings(p => ({ ...p, tierThresholds: { ...p.tierThresholds, platinum: Number(e.target.value) } }))}
                      className="w-full px-3 py-2 border border-[var(--border)] rounded-lg text-sm bg-[var(--bg-primary)] text-[var(--text-primary)]" />
                  </div>
                </div>
              </div>
              <button onClick={saveSettings} disabled={saving} className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-500 dark:bg-blue-500 dark:hover:bg-blue-600 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                {saving ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Enregistrement…</> : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
