import React from 'react';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { TrendingUp } from 'lucide-react';

export interface SignupPoint {
  date: string;
  count: number;
}

interface ActivityChartProps {
  signupsByDay: SignupPoint[];
  period: string;
}

export function ActivityChart({ signupsByDay, period }: ActivityChartProps): React.ReactElement {
  const chartData =
    signupsByDay.length > 0
      ? signupsByDay.map((r) => ({
          date: r.date.length > 5 ? r.date.slice(-5) : r.date,
          inscriptions: r.count,
        }))
      : [{ date: '—', inscriptions: 0 }];

  return (
    <div className="rounded-xl border border-[var(--admin-border)] bg-[var(--admin-card)] p-6">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-[var(--admin-text)]">
          <TrendingUp className="h-5 w-5 text-[var(--admin-accent)]" />
          Inscriptions studios ({period})
        </h2>
        <div className="flex items-center gap-2 text-sm">
          <div className="h-3 w-3 rounded-full bg-[var(--admin-accent)]" />
          <span className="text-[var(--admin-text-muted)]">Nouveaux studios / jour</span>
        </div>
      </div>
      <div className="h-[280px] sm:h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 12, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--admin-border)" opacity={0.35} />
            <XAxis dataKey="date" stroke="var(--admin-text-muted)" style={{ fontSize: 11 }} />
            <YAxis stroke="var(--admin-text-muted)" style={{ fontSize: 11 }} allowDecimals={false} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--admin-card)',
                border: '1px solid var(--admin-border)',
                borderRadius: '8px',
                color: 'var(--admin-text)',
              }}
              labelStyle={{ color: 'var(--admin-text-muted)' }}
            />
            <Line
              type="monotone"
              dataKey="inscriptions"
              name="Inscriptions"
              stroke="var(--admin-accent)"
              strokeWidth={2}
              dot={{ fill: 'var(--admin-accent)', r: 3 }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
