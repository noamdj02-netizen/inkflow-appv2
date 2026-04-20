import React from 'react';
import { Line, LineChart, ResponsiveContainer } from 'recharts';

interface AdminSparklineProps {
  data: number[];
  color: string;
  height?: number;
}

/** Mini courbe sans axe — remplace react-sparklines (non présent dans le bundle). */
export function AdminSparkline({ data, color, height = 44 }: AdminSparklineProps): React.ReactElement {
  const chart = data.map((v, i) => ({ i, v }));
  if (chart.length === 0) {
    chart.push({ i: 0, v: 0 });
  }
  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chart} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
          <Line type="monotone" dataKey="v" stroke={color} strokeWidth={2} dot={false} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
