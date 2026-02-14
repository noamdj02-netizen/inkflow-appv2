import React, { useState } from 'react';
import {
  TrendingUp, TrendingDown, DollarSign, Users, Calendar,
  Target, Award, ChevronDown
} from 'lucide-react';
import { Appointment, Client } from '../../types';

interface AnalyticsDashboardProps {
  appointments: Appointment[];
  clients: Client[];
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  appointments,
  clients
}) => {
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('month');

  const totalRevenue = appointments.reduce((sum, apt) => sum + apt.price, 0);
  const totalDeposits = appointments.reduce((sum, apt) => sum + (apt.depositPaid ? apt.deposit : 0), 0);
  const averagePerAppointment = appointments.length > 0 ? totalRevenue / appointments.length : 0;
  const completionRate = appointments.length > 0
    ? (appointments.filter(a => a.status === 'completed').length / appointments.length) * 100
    : 0;

  const vipClients = clients.filter(c => c.status === 'vip').length;
  const activeClients = clients.filter(c => c.status === 'active').length;

  const revenueByMonth = [
    { month: 'Jan', amount: 2400, appointments: 12 },
    { month: 'Fév', amount: 3200, appointments: 16 },
    { month: 'Mar', amount: 2800, appointments: 14 },
    { month: 'Avr', amount: 3600, appointments: 18 },
    { month: 'Mai', amount: 4200, appointments: 21 },
    { month: 'Juin', amount: 3800, appointments: 19 }
  ];

  const maxAmount = Math.max(...revenueByMonth.map(m => m.amount));

  const stats = [
    { label: 'Revenue total', value: `${totalRevenue}€`, change: '+12.5%', positive: true, icon: DollarSign, color: 'green' },
    { label: 'Acomptes reçus', value: `${totalDeposits}€`, change: '+8.2%', positive: true, icon: Target, color: 'blue' },
    { label: 'Rendez-vous', value: appointments.length.toString(), change: '+15.3%', positive: true, icon: Calendar, color: 'purple' },
    { label: 'Taux de complétion', value: `${completionRate.toFixed(1)}%`, change: '-2.1%', positive: false, icon: Award, color: 'orange' }
  ];

  const getColorClasses = (color: string) => {
    const classes: Record<string, string> = {
      green: 'bg-green-100 text-green-700',
      blue: 'bg-blue-100 text-blue-700',
      purple: 'bg-purple-100 text-purple-700',
      orange: 'bg-orange-100 text-orange-700'
    };
    return classes[color] || classes.green;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Statistiques</h2>
          <p className="text-sm text-neutral-600 mt-1">Suivez vos performances en temps réel</p>
        </div>
        <div className="relative">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as 'week' | 'month' | 'year')}
            className="appearance-none bg-white border border-neutral-200 rounded-lg px-4 py-2 pr-10 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900 cursor-pointer"
          >
            <option value="week">Cette semaine</option>
            <option value="month">Ce mois</option>
            <option value="year">Cette année</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div key={idx} className="bg-white rounded-2xl p-6 border border-neutral-200 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${getColorClasses(stat.color)}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div className={`flex items-center gap-1 text-sm font-semibold ${stat.positive ? 'text-green-600' : 'text-red-600'}`}>
                  {stat.positive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  {stat.change}
                </div>
              </div>
              <div className="text-3xl font-bold mb-1">{stat.value}</div>
              <div className="text-sm text-neutral-600">{stat.label}</div>
            </div>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-neutral-200">
          <h3 className="text-lg font-bold mb-6">Évolution du revenue</h3>
          <div className="space-y-4">
            {revenueByMonth.map((data, idx) => (
              <div key={idx} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-neutral-700">{data.month}</span>
                  <span className="font-bold">{data.amount}€</span>
                </div>
                <div className="relative h-10 bg-neutral-100 rounded-lg overflow-hidden">
                  <div
                    className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg transition-all duration-500"
                    style={{ width: `${(data.amount / maxAmount) * 100}%` }}
                  >
                    <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-white text-xs font-semibold">
                      {data.appointments} RDV
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 pt-6 border-t border-neutral-200 grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-neutral-600">Moyenne/RDV</span>
              <div className="text-2xl font-bold mt-1">{averagePerAppointment.toFixed(0)}€</div>
            </div>
            <div>
              <span className="text-neutral-600">Total période</span>
              <div className="text-2xl font-bold mt-1">{revenueByMonth.reduce((sum, m) => sum + m.amount, 0)}€</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-neutral-200">
          <h3 className="text-lg font-bold mb-6">Clients</h3>
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-neutral-600">Total</span>
                <span className="text-2xl font-bold">{clients.length}</span>
              </div>
              <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                <div className="h-full bg-neutral-900" style={{ width: '100%' }} />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-neutral-600 flex items-center gap-1"><Award className="w-4 h-4" /> VIP</span>
                <span className="text-2xl font-bold text-purple-600">{vipClients}</span>
              </div>
              <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                <div className="h-full bg-purple-600" style={{ width: `${clients.length ? (vipClients / clients.length) * 100 : 0}%` }} />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-neutral-600">Actifs</span>
                <span className="text-2xl font-bold text-green-600">{activeClients}</span>
              </div>
              <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                <div className="h-full bg-green-600" style={{ width: `${clients.length ? (activeClients / clients.length) * 100 : 0}%` }} />
              </div>
            </div>
            <div className="pt-6 border-t border-neutral-200">
              <span className="text-sm text-neutral-600">Dépense moyenne</span>
              <div className="text-3xl font-bold mt-2">
                {clients.length > 0 ? (clients.reduce((sum, c) => sum + c.totalSpent, 0) / clients.length).toFixed(0) : 0}€
              </div>
              <div className="text-xs text-neutral-500 mt-1">par client</div>
            </div>
            {clients.length > 0 && (
              <div className="pt-6 border-t border-neutral-200">
                <span className="text-sm text-neutral-600 mb-3 block">Meilleur client</span>
                <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg">
                  <div className="w-10 h-10 bg-purple-200 rounded-full flex items-center justify-center">
                    <Users className="w-5 h-5 text-purple-700" />
                  </div>
                  <div>
                    <div className="font-bold text-sm">
                      {[...clients].sort((a, b) => b.totalSpent - a.totalSpent)[0].name}
                    </div>
                    <div className="text-xs text-purple-600 font-semibold">
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
