import React, { useMemo } from 'react';
import { DollarSign, TrendingUp, CreditCard, Receipt } from 'lucide-react';
import { Appointment } from '../../types';
import { InvoiceButton } from './InvoiceButton';
import { useAuth } from '../../contexts/AuthContext';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface FinanceDashboardProps {
  appointments: Appointment[];
}

const monthLabels = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];

export const FinanceDashboard: React.FC<FinanceDashboardProps> = ({ appointments }) => {
  const { user } = useAuth();

  const totalRevenue = useMemo(() =>
    appointments.filter(a => a.status === 'completed').reduce((s, a) => s + a.price, 0),
    [appointments]
  );

  const totalDeposits = useMemo(() =>
    appointments.filter(a => a.depositPaid).reduce((s, a) => s + a.deposit, 0),
    [appointments]
  );

  const pendingDeposits = useMemo(() =>
    appointments.filter(a => !a.depositPaid && !['cancelled'].includes(a.status)).reduce((s, a) => s + a.deposit, 0),
    [appointments]
  );

  const completedCount = appointments.filter(a => a.status === 'completed').length;

  const chartData = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
      const monthStart = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
      const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().split('T')[0];
      const rev = appointments
        .filter(a => a.status === 'completed' && a.date >= monthStart && a.date <= monthEnd)
        .reduce((s, a) => s + a.price, 0);
      return { month: monthLabels[d.getMonth()], revenue: rev };
    });
  }, [appointments]);

  const transactions = useMemo(() => {
    return appointments
      .filter(a => a.status === 'completed' || a.depositPaid)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
  }, [appointments]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Finance</h1>
        <p className="text-neutral-600 mt-1">Revenus et paiements</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl p-6 border border-neutral-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-xl bg-neutral-900 text-white"><DollarSign className="w-5 h-5" /></div>
            <span className="text-sm text-neutral-600">Revenus totaux</span>
          </div>
          <div className="text-2xl font-bold">{totalRevenue}€</div>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-neutral-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-xl bg-green-100 text-green-700"><CreditCard className="w-5 h-5" /></div>
            <span className="text-sm text-neutral-600">Acomptes reçus</span>
          </div>
          <div className="text-2xl font-bold text-green-600">{totalDeposits}€</div>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-neutral-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-xl bg-amber-100 text-amber-700"><TrendingUp className="w-5 h-5" /></div>
            <span className="text-sm text-neutral-600">Acomptes en attente</span>
          </div>
          <div className="text-2xl font-bold text-amber-600">{pendingDeposits}€</div>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-neutral-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-xl bg-neutral-100"><Receipt className="w-5 h-5" /></div>
            <span className="text-sm text-neutral-600">RDV terminés</span>
          </div>
          <div className="text-2xl font-bold">{completedCount}</div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 border border-neutral-200">
        <h3 className="font-bold text-lg mb-4">Évolution des revenus (6 mois)</h3>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#171717" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#171717" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
            <XAxis dataKey="month" stroke="#737373" style={{ fontSize: 12 }} />
            <YAxis stroke="#737373" style={{ fontSize: 12 }} />
            <Tooltip formatter={(v: number) => [`${v}€`, 'Revenu']} contentStyle={{ borderRadius: 12, border: '1px solid #e5e5e5' }} />
            <Area type="monotone" dataKey="revenue" stroke="#171717" strokeWidth={2} fill="url(#colorRevenue)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-neutral-200">
          <h3 className="font-bold text-lg">Dernières transactions</h3>
        </div>
        <div className="divide-y divide-neutral-200">
          {transactions.length === 0 ? (
            <div className="py-12 text-center text-neutral-400">Aucune transaction</div>
          ) : (
            transactions.map(apt => (
              <div key={apt.id} className="flex items-center justify-between px-6 py-4 hover:bg-neutral-50">
                <div>
                  <div className="font-semibold">{apt.clientName}</div>
                  <div className="text-sm text-neutral-600">{apt.service} • {apt.date}</div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-bold">{apt.price}€</span>
                  {user && (apt.status === 'completed' || apt.depositPaid) && (
                    <InvoiceButton appointment={apt} artist={user} />
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
