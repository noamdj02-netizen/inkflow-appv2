import React, { useState, useMemo } from 'react';
import {
  DollarSign, Users, Calendar,
  Target, Award, ChevronDown
} from 'lucide-react';
import { Appointment, Client } from '../../types';

interface AnalyticsDashboardProps {
  appointments: Appointment[];
  clients: Client[];
}

const MONTH_LABELS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  appointments,
  clients
}) => {
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('month');

  const filteredAppointments = useMemo(() => {
    const now = new Date();
    return appointments.filter(apt => {
      const aptDate = new Date(apt.date);
      if (period === 'week') {
        const weekAgo = new Date(now);
        weekAgo.setDate(weekAgo.getDate() - 7);
        return aptDate >= weekAgo && aptDate <= now;
      }
      if (period === 'month') {
        return aptDate.getMonth() === now.getMonth() && aptDate.getFullYear() === now.getFullYear();
      }
      return aptDate.getFullYear() === now.getFullYear();
    });
  }, [appointments, period]);

  const totalRevenue = filteredAppointments.reduce((sum, apt) => sum + apt.price, 0);
  const totalDeposits = filteredAppointments.reduce((sum, apt) => sum + (apt.depositPaid ? apt.deposit : 0), 0);
  const averagePerAppointment = filteredAppointments.length > 0 ? totalRevenue / filteredAppointments.length : 0;
  const completionRate = filteredAppointments.length > 0
    ? (filteredAppointments.filter(a => a.status === 'completed').length / filteredAppointments.length) * 100
    : 0;

  const vipClients = clients.filter(c => c.status === 'vip').length;
  const activeClients = clients.filter(c => c.status === 'active').length;

  const revenueByMonth = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const months: { month: string; amount: number; appointments: number }[] = [];
    for (let m = 0; m <= now.getMonth(); m++) {
      const monthApts = appointments.filter(apt => {
        const d = new Date(apt.date);
        return d.getFullYear() === currentYear && d.getMonth() === m;
      });
      months.push({
        month: MONTH_LABELS[m],
        amount: monthApts.reduce((s, a) => s + a.price, 0),
        appointments: monthApts.length,
      });
    }
    return months.length > 0 ? months : [{ month: MONTH_LABELS[now.getMonth()], amount: 0, appointments: 0 }];
  }, [appointments]);

  const maxAmount = Math.max(...revenueByMonth.map(m => m.amount), 1);

  const stats = [
    { label: 'Revenu total', value: `${totalRevenue}€`, icon: DollarSign, color: 'blue' },
    { label: 'Acomptes reçus', value: `${totalDeposits}€`, icon: Target, color: 'emerald' },
    { label: 'Rendez-vous', value: filteredAppointments.length.toString(), icon: Calendar, color: 'violet' },
    { label: 'Taux de complétion', value: `${completionRate.toFixed(1)}%`, icon: Award, color: 'amber' }
  ];

  const getColorClasses = (color: string) => {
    const classes: Record<string, string> = {
      blue: 'bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400',
      emerald: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400',
      violet: 'bg-violet-100 text-violet-600 dark:bg-violet-500/20 dark:text-violet-400',
      amber: 'bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400'
    };
    return classes[color] || classes.blue;
  };

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-black p-6 space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">Statistiques</h2>
          <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1">Suivez vos performances en temps réel</p>
        </div>
        <div className="relative">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as 'week' | 'month' | 'year')}
            className="appearance-none cursor-pointer bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-xl px-4 py-2.5 pr-10 text-sm font-medium text-slate-700 dark:text-zinc-300 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] hover:border-slate-300 dark:hover:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
          >
            <option value="week">Cette semaine</option>
            <option value="month">Ce mois</option>
            <option value="year">Cette année</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-zinc-500 pointer-events-none" />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div
              key={idx}
              className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200/80 dark:border-zinc-800 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] p-6 hover:shadow-[0_4px_20px_-5px_rgba(6,81,237,0.1)] transition-shadow duration-300"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${getColorClasses(stat.color)}`}>
                  <Icon className="w-6 h-6" />
                </div>
              </div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums mb-1">{stat.value}</div>
              <div className="text-sm text-slate-500 dark:text-zinc-500">{stat.label}</div>
            </div>
          );
        })}
      </div>

      {/* Charts Section */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Revenue Evolution Card */}
        <div className="lg:col-span-2 bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200/80 dark:border-zinc-800 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] p-6">
          <h3 className="text-xs font-semibold text-slate-500 dark:text-zinc-500 uppercase tracking-wider mb-6">Évolution du revenu</h3>
          <div className="space-y-4">
            {revenueByMonth.map((data, idx) => (
              <div key={idx} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-slate-600 dark:text-zinc-400">{data.month}</span>
                  <span className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums">{data.amount}€</span>
                </div>
                <div className="relative h-10 bg-slate-100 dark:bg-zinc-800 rounded-xl overflow-hidden">
                  <div
                    className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl transition-all duration-500"
                    style={{ width: `${(data.amount / maxAmount) * 100}%` }}
                  >
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white text-xs font-semibold">
                      {data.appointments} RDV
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 pt-6 border-t border-slate-200/80 dark:border-zinc-800 grid grid-cols-2 gap-4">
            <div>
              <span className="text-xs font-semibold text-slate-500 dark:text-zinc-500 uppercase tracking-wider">Moyenne/RDV</span>
              <div className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums mt-1">{averagePerAppointment.toFixed(0)}€</div>
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-500 dark:text-zinc-500 uppercase tracking-wider">Total période</span>
              <div className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums mt-1">{revenueByMonth.reduce((sum, m) => sum + m.amount, 0)}€</div>
            </div>
          </div>
        </div>

        {/* Clients Card */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200/80 dark:border-zinc-800 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] p-6">
          <h3 className="text-xs font-semibold text-slate-500 dark:text-zinc-500 uppercase tracking-wider mb-6">Clients</h3>
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-500 dark:text-zinc-500">Total</span>
                <span className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums">{clients.length}</span>
              </div>
              <div className="h-2 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                <div className="h-full bg-slate-900 dark:bg-white rounded-full" style={{ width: '100%' }} />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-500 dark:text-zinc-500 flex items-center gap-1.5"><Award className="w-4 h-4" /> VIP</span>
                <span className="text-2xl font-bold text-blue-600 dark:text-blue-400 tabular-nums">{vipClients}</span>
              </div>
              <div className="h-2 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full transition-all duration-500" style={{ width: `${clients.length ? (vipClients / clients.length) * 100 : 0}%` }} />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-500 dark:text-zinc-500">Actifs</span>
                <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">{activeClients}</span>
              </div>
              <div className="h-2 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${clients.length ? (activeClients / clients.length) * 100 : 0}%` }} />
              </div>
            </div>
            <div className="pt-6 border-t border-slate-200/80 dark:border-zinc-800">
              <span className="text-xs font-semibold text-slate-500 dark:text-zinc-500 uppercase tracking-wider">Dépense moyenne</span>
              <div className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums mt-2">
                {clients.length > 0 ? (clients.reduce((sum, c) => sum + c.totalSpent, 0) / clients.length).toFixed(0) : 0}€
              </div>
              <div className="text-sm text-slate-500 dark:text-zinc-500 mt-1">par client</div>
            </div>
            {clients.length > 0 && (
              <div className="pt-6 border-t border-slate-200/80 dark:border-zinc-800">
                <span className="text-xs font-semibold text-slate-500 dark:text-zinc-500 uppercase tracking-wider mb-3 block">Meilleur client</span>
                <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-blue-50 to-slate-50 dark:from-blue-500/10 dark:to-zinc-800/50 rounded-xl border border-blue-100/50 dark:border-blue-500/20">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-500/20 rounded-xl flex items-center justify-center">
                    <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <div className="font-semibold text-sm text-slate-900 dark:text-white">
                      {[...clients].sort((a, b) => b.totalSpent - a.totalSpent)[0].name}
                    </div>
                    <div className="text-sm text-blue-600 dark:text-blue-400 font-semibold tabular-nums">
                      {[...clients].sort((a, b) => b.totalSpent - a.totalSpent)[0].totalSpent}€
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
