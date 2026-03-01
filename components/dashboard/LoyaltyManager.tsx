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
            <h2 className="text-xl font-bold">Programme de fidelite</h2>
            <p className="text-neutral-600 text-sm">{entries.length} membres</p>
          </div>
        </div>
        <button onClick={() => setShowSettings(true)}
          className="flex items-center gap-2 px-4 py-2 border border-neutral-200 rounded-xl text-sm font-medium hover:bg-neutral-50">
          <Settings className="w-4 h-4" /> Configurer
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-6 border border-neutral-200">
          <div className="flex items-center gap-2 mb-2"><Users className="w-5 h-5 text-neutral-600" /><span className="text-sm text-neutral-600">Membres</span></div>
          <div className="text-2xl font-bold">{entries.length}</div>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-neutral-200">
          <div className="flex items-center gap-2 mb-2"><Star className="w-5 h-5 text-blue-500 dark:text-blue-400" /><span className="text-sm text-neutral-600">Points en circulation</span></div>
          <div className="text-2xl font-bold">{totalPoints.toLocaleString()}</div>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-neutral-200">
          <div className="flex items-center gap-2 mb-2"><TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" /><span className="text-sm text-neutral-600">Points distribues</span></div>
          <div className="text-2xl font-bold">{totalEarned.toLocaleString()}</div>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-neutral-200">
          <div className="flex items-center gap-2 mb-2"><Gift className="w-5 h-5 text-blue-600 dark:text-blue-400" /><span className="text-sm text-neutral-600">Recompenses</span></div>
          <div className="text-2xl font-bold">{settings?.rewards?.length || 0}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-white rounded-2xl border border-neutral-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-neutral-200">
            <h3 className="font-bold">Classement</h3>
          </div>
          <div className="divide-y divide-neutral-200">
            {topEntries.length === 0 ? (
              <div className="py-8 text-center text-neutral-400">Aucun membre</div>
            ) : (
              topEntries.map((entry, idx) => {
                const client = clients.find(c => c.id === entry.clientId);
                return (
                  <div key={entry.id} className="flex items-center px-6 py-4 hover:bg-neutral-50">
                    <span className="text-lg font-bold text-neutral-400 w-8">{idx + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold truncate">{client?.name || 'Client'}</div>
                      <div className="text-xs text-neutral-500">{client?.email}</div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold mr-4 ${TIER_COLORS[entry.tier]}`}>
                      {entry.tier.charAt(0).toUpperCase() + entry.tier.slice(1)}
                    </span>
                    <span className="font-bold text-sm">{entry.points} pts</span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-neutral-200">
          <h3 className="font-bold mb-4">Repartition</h3>
          <div className="space-y-3">
            {(['platinum', 'gold', 'silver', 'bronze'] as LoyaltyTier[]).map(tier => (
              <div key={tier} className="flex items-center justify-between">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${TIER_COLORS[tier]}`}>
                  {tier.charAt(0).toUpperCase() + tier.slice(1)}
                </span>
                <span className="font-bold text-sm">{tierCounts[tier] || 0}</span>
              </div>
            ))}
          </div>

          <h3 className="font-bold mt-6 mb-3">Recompenses disponibles</h3>
          <div className="space-y-2">
            {(settings?.rewards || DEFAULT_SETTINGS.rewards).map((reward, i) => (
              <div key={i} className="flex items-center justify-between text-sm p-3 bg-neutral-50 rounded-xl">
                <span>{reward.name}</span>
                <span className="font-bold text-blue-600 dark:text-blue-400">{reward.cost} pts</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {showSettings && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setShowSettings(false)}>
          <div className="bg-white rounded-2xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-4">Configuration fidelite</h3>
            <div className="space-y-4">
              <label className="flex items-center gap-3">
                <input type="checkbox" checked={draftSettings.enabled} onChange={e => setDraftSettings(p => ({ ...p, enabled: e.target.checked }))} className="w-4 h-4" />
                <span className="font-medium">Activer le programme</span>
              </label>
              <div>
                <label className="block text-sm font-semibold mb-1">Points par euro depense</label>
                <input type="number" value={draftSettings.pointsPerEuro} onChange={e => setDraftSettings(p => ({ ...p, pointsPerEuro: Number(e.target.value) }))}
                  className="w-full px-4 py-3 border border-neutral-200 rounded-xl" min={0} />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Bonus parrainage (points)</label>
                <input type="number" value={draftSettings.referralBonus} onChange={e => setDraftSettings(p => ({ ...p, referralBonus: Number(e.target.value) }))}
                  className="w-full px-4 py-3 border border-neutral-200 rounded-xl" min={0} />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Seuils de tier (points)</label>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-xs text-neutral-500">Silver</label>
                    <input type="number" value={draftSettings.tierThresholds.silver}
                      onChange={e => setDraftSettings(p => ({ ...p, tierThresholds: { ...p.tierThresholds, silver: Number(e.target.value) } }))}
                      className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm" />
                  </div>
                  <div>
                    <label className="text-xs text-neutral-500">Gold</label>
                    <input type="number" value={draftSettings.tierThresholds.gold}
                      onChange={e => setDraftSettings(p => ({ ...p, tierThresholds: { ...p.tierThresholds, gold: Number(e.target.value) } }))}
                      className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm" />
                  </div>
                  <div>
                    <label className="text-xs text-neutral-500">Platinum</label>
                    <input type="number" value={draftSettings.tierThresholds.platinum}
                      onChange={e => setDraftSettings(p => ({ ...p, tierThresholds: { ...p.tierThresholds, platinum: Number(e.target.value) } }))}
                      className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm" />
                  </div>
                </div>
              </div>
              <button onClick={saveSettings} disabled={saving} className="w-full py-3 bg-neutral-900 text-white rounded-xl font-semibold hover:bg-neutral-800 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                {saving ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Enregistrement…</> : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
