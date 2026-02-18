import React, { useMemo, useState, useCallback } from 'react';
import { DollarSign, TrendingUp, CreditCard, Receipt, Banknote, Plus, Trash2 } from 'lucide-react';
import { Appointment } from '../../types';
import { InvoiceButton } from './InvoiceButton';
import { useAuth } from '../../contexts/AuthContext';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Modal } from '../ui/Modal';

interface FinanceDashboardProps {
  appointments: Appointment[];
}

export interface CashEntry {
  id: string;
  date: string;
  amount: number;
  label: string;
  createdAt: string;
}

const STORAGE_KEY_PREFIX = 'inkflow_finance_cash_';

function loadCashEntries(userId: string): CashEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PREFIX + userId);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CashEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveCashEntries(userId: string, entries: CashEntry[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_PREFIX + userId, JSON.stringify(entries));
  } catch {
    // ignore
  }
}

const monthLabels = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];

export const FinanceDashboard: React.FC<FinanceDashboardProps> = ({ appointments }) => {
  const { user } = useAuth();
  const userId = user?.id ?? user?.email ?? 'default';
  const [cashEntries, setCashEntries] = useState<CashEntry[]>(() => loadCashEntries(userId));
  const [showAddCash, setShowAddCash] = useState(false);
  const [newCash, setNewCash] = useState({ date: new Date().toISOString().split('T')[0], amount: '', label: '' });

  const saveCash = useCallback(
    (entries: CashEntry[]) => {
      setCashEntries(entries);
      saveCashEntries(userId, entries);
    },
    [userId]
  );

  const addCashEntry = useCallback(() => {
    const amount = Math.round(parseFloat(newCash.amount) * 100) / 100;
    if (!newCash.date || isNaN(amount) || amount <= 0) return;
    const entry: CashEntry = {
      id: 'cash_' + Date.now(),
      date: newCash.date,
      amount,
      label: newCash.label.trim() || 'Encaissement espèces',
      createdAt: new Date().toISOString(),
    };
    saveCash([...cashEntries, entry]);
    setNewCash({ date: new Date().toISOString().split('T')[0], amount: '', label: '' });
    setShowAddCash(false);
  }, [cashEntries, newCash, saveCash]);

  const removeCashEntry = useCallback(
    (id: string) => {
      saveCash(cashEntries.filter((e) => e.id !== id));
    },
    [cashEntries, saveCash]
  );

  const totalRevenue = useMemo(
    () => appointments.filter((a) => a.status === 'completed').reduce((s, a) => s + a.price, 0),
    [appointments]
  );

  const totalCash = useMemo(() => cashEntries.reduce((s, e) => s + e.amount, 0), [cashEntries]);

  const totalDeposits = useMemo(
    () => appointments.filter((a) => a.depositPaid).reduce((s, a) => s + a.deposit, 0),
    [appointments]
  );

  const pendingDeposits = useMemo(
    () =>
      appointments
        .filter((a) => !a.depositPaid && !['cancelled'].includes(a.status))
        .reduce((s, a) => s + a.deposit, 0),
    [appointments]
  );

  const completedCount = appointments.filter((a) => a.status === 'completed').length;

  const totalGlobal = totalRevenue + totalCash;

  const chartData = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
      const monthStart = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
      const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().split('T')[0];
      const rev = appointments
        .filter((a) => a.status === 'completed' && a.date >= monthStart && a.date <= monthEnd)
        .reduce((s, a) => s + a.price, 0);
      const cash = cashEntries
        .filter((e) => e.date >= monthStart && e.date <= monthEnd)
        .reduce((s, e) => s + e.amount, 0);
      return {
        month: monthLabels[d.getMonth()],
        revenue: rev,
        cash,
        total: rev + cash,
      };
    });
  }, [appointments, cashEntries]);

  const transactions = useMemo(() => {
    const fromApts = appointments
      .filter((a) => a.status === 'completed' || a.depositPaid)
      .map((a) => ({
        id: a.id,
        type: 'rdv' as const,
        date: a.date,
        label: a.clientName,
        sub: a.service,
        amount: a.price,
        appointment: a,
      }));
    const fromCash = cashEntries.map((e) => ({
      id: e.id,
      type: 'cash' as const,
      date: e.date,
      label: e.label,
      sub: 'Espèces',
      amount: e.amount,
      entry: e,
    }));
    return [...fromApts, ...fromCash]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10);
  }, [appointments, cashEntries]);

  const todayCash = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return cashEntries.filter((e) => e.date === today).reduce((s, e) => s + e.amount, 0);
  }, [cashEntries]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Finance</h1>
          <p className="text-neutral-600 mt-1">Revenus, espèces et paiements</p>
        </div>
        <button
          onClick={() => setShowAddCash(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-neutral-900 text-white rounded-xl font-semibold hover:bg-neutral-800 transition-colors"
        >
          <Banknote className="w-5 h-5" />
          Ajouter encaissement espèces
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-neutral-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-xl bg-neutral-900 text-white">
              <DollarSign className="w-5 h-5" />
            </div>
            <span className="text-sm text-neutral-600">Total global</span>
          </div>
          <div className="text-2xl font-bold">{totalGlobal}€</div>
          <p className="text-xs text-neutral-500 mt-1">RDV + espèces</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-neutral-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-xl bg-blue-100 text-blue-700">
              <CreditCard className="w-5 h-5" />
            </div>
            <span className="text-sm text-neutral-600">Revenus RDV</span>
          </div>
          <div className="text-2xl font-bold">{totalRevenue}€</div>
          <p className="text-xs text-neutral-500 mt-1">Paiements carte / virement</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-neutral-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
              <Banknote className="w-5 h-5" />
            </div>
            <span className="text-sm text-neutral-600">Espèces</span>
          </div>
          <div className="text-2xl font-bold text-emerald-700">{totalCash}€</div>
          {todayCash > 0 && (
            <p className="text-xs text-emerald-600 mt-1">Dont {todayCash}€ aujourd'hui</p>
          )}
        </div>
        <div className="bg-white rounded-2xl p-5 border border-neutral-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-xl bg-green-100 text-green-700">
              <Receipt className="w-5 h-5" />
            </div>
            <span className="text-sm text-neutral-600">Acomptes reçus</span>
          </div>
          <div className="text-2xl font-bold text-green-600">{totalDeposits}€</div>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-neutral-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-xl bg-amber-100 text-amber-700">
              <TrendingUp className="w-5 h-5" />
            </div>
            <span className="text-sm text-neutral-600">Acomptes en attente</span>
          </div>
          <div className="text-2xl font-bold text-amber-600">{pendingDeposits}€</div>
          <p className="text-xs text-neutral-500 mt-1">{completedCount} RDV terminés</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-neutral-200">
          <h3 className="font-bold text-lg mb-4">Évolution des revenus (6 mois)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#171717" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#171717" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorCash" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#059669" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#059669" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
              <XAxis dataKey="month" stroke="#737373" style={{ fontSize: 12 }} />
              <YAxis stroke="#737373" style={{ fontSize: 12 }} />
              <Tooltip
                formatter={(v: number, name: string) => [
                  `${v}€`,
                  name === 'revenue' ? 'Revenus RDV' : name === 'cash' ? 'Espèces' : 'Total',
                ]}
                contentStyle={{ borderRadius: 12, border: '1px solid #e5e5e5' }}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#171717"
                strokeWidth={2}
                fill="url(#colorRevenue)"
                name="revenue"
              />
              <Area
                type="monotone"
                dataKey="cash"
                stroke="#059669"
                strokeWidth={2}
                fill="url(#colorCash)"
                name="cash"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-neutral-200 flex items-center justify-between">
            <h3 className="font-bold text-lg">Caisse espèces</h3>
            <button
              onClick={() => setShowAddCash(true)}
              className="p-2 rounded-lg hover:bg-neutral-100 text-neutral-600"
              aria-label="Ajouter"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
          <div className="max-h-64 overflow-y-auto divide-y divide-neutral-100">
            {cashEntries.length === 0 ? (
              <div className="py-8 text-center text-neutral-400 text-sm">Aucun encaissement espèces</div>
            ) : (
              cashEntries
                .slice()
                .sort((a, b) => b.date.localeCompare(a.date))
                .slice(0, 8)
                .map((e) => (
                  <div
                    key={e.id}
                    className="flex items-center justify-between px-4 py-3 hover:bg-neutral-50 group"
                  >
                    <div className="min-w-0">
                      <div className="font-medium text-neutral-900 truncate">{e.label}</div>
                      <div className="text-xs text-neutral-500">{e.date}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-emerald-700">{e.amount}€</span>
                      <button
                        onClick={() => removeCashEntry(e.id)}
                        className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-50 text-red-600 transition-opacity"
                        aria-label="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-neutral-200">
          <h3 className="font-bold text-lg">Dernières transactions</h3>
        </div>
        <div className="divide-y divide-neutral-200">
          {transactions.length === 0 ? (
            <div className="py-12 text-center text-neutral-400">Aucune transaction</div>
          ) : (
            transactions.map((t) => (
              <div key={t.id} className="flex items-center justify-between px-6 py-4 hover:bg-neutral-50">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      t.type === 'cash' ? 'bg-emerald-100 text-emerald-700' : 'bg-neutral-100 text-neutral-700'
                    }`}
                  >
                    {t.type === 'cash' ? (
                      <Banknote className="w-4 h-4" />
                    ) : (
                      <Receipt className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <div className="font-semibold">{t.label}</div>
                    <div className="text-sm text-neutral-600">
                      {t.sub} • {t.date}
                      {t.type === 'cash' && (
                        <span className="ml-2 px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 text-xs font-medium">
                          Espèces
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-bold">{t.amount}€</span>
                  {t.type === 'rdv' && t.appointment && user && (
                    <InvoiceButton
                      appointment={t.appointment}
                      artist={user}
                    />
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {showAddCash && (
        <Modal
          isOpen={showAddCash}
          onClose={() => setShowAddCash(false)}
          title="Encaissement espèces"
          size="sm"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-neutral-700 mb-1">Date</label>
              <input
                type="date"
                value={newCash.date}
                onChange={(e) => setNewCash((c) => ({ ...c, date: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 focus:ring-2 focus:ring-neutral-900 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-neutral-700 mb-1">Montant (€)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="0,00"
                value={newCash.amount}
                onChange={(e) => setNewCash((c) => ({ ...c, amount: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 focus:ring-2 focus:ring-neutral-900 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-neutral-700 mb-1">Libellé (optionnel)</label>
              <input
                type="text"
                placeholder="Ex: Caisse du jour, Dépot client…"
                value={newCash.label}
                onChange={(e) => setNewCash((c) => ({ ...c, label: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 focus:ring-2 focus:ring-neutral-900 focus:border-transparent"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={addCashEntry}
                disabled={!newCash.date || !newCash.amount || parseFloat(newCash.amount) <= 0}
                className="flex-1 py-2.5 bg-neutral-900 text-white rounded-xl font-semibold hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Enregistrer
              </button>
              <button
                onClick={() => setShowAddCash(false)}
                className="px-4 py-2.5 bg-neutral-100 text-neutral-700 rounded-xl font-semibold hover:bg-neutral-200"
              >
                Annuler
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
