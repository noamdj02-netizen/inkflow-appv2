import React from 'react';
import { Trophy, TrendingUp } from 'lucide-react';

export interface TopStudioRow {
  id: string;
  slug: string;
  bookings: number;
}

interface TopStudiosProps {
  studios: TopStudioRow[];
}

export function TopStudios({ studios }: TopStudiosProps): React.ReactElement {
  const list = studios.length > 0 ? studios : [];
  const maxB = list[0]?.bookings ?? 1;

  return (
    <div className="rounded-xl border border-[var(--admin-border)] bg-[var(--admin-card)] p-6">
      <div className="mb-4 flex items-center gap-2">
        <Trophy className="h-5 w-5 text-[var(--admin-accent)]" />
        <h3 className="font-semibold text-[var(--admin-text)]">Top studios (bookings 30j)</h3>
      </div>
      {list.length === 0 ? (
        <p className="text-sm text-[var(--admin-text-muted)]">Pas encore de données.</p>
      ) : (
        <div className="space-y-3">
          {list.map((studio, index) => {
            const isTop = index === 0;
            return (
              <div
                key={studio.id}
                className={`rounded-lg border p-4 transition-all hover:scale-[1.01] ${
                  isTop
                    ? 'border-[var(--admin-accent)]/30 bg-gradient-to-r from-[var(--admin-accent)]/10 to-transparent'
                    : 'border-[var(--admin-border)] bg-[var(--admin-bg)]/50'
                }`}
              >
                <div className="mb-2 flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="tabular-nums text-sm font-semibold text-[var(--admin-text-muted)]">{index + 1}.</span>
                    <div>
                      <p
                        className={`font-sans text-sm font-semibold ${isTop ? 'text-[var(--admin-accent)]' : 'text-[var(--admin-text)]'}`}
                      >
                        {studio.slug}
                      </p>
                      <p className="text-xs text-[var(--admin-text-muted)]">Slug public</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-xs font-semibold text-emerald-500">
                    <TrendingUp className="h-3 w-3" />
                    30j
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-sans text-2xl font-bold tabular-nums tracking-tight text-[var(--admin-text)]">
                    {studio.bookings}
                  </span>
                  <span className="text-xs text-[var(--admin-text-muted)]">bookings</span>
                </div>
                <div className="mt-3 h-1 overflow-hidden rounded-full bg-[var(--admin-border)]">
                  <div
                    className={`h-full transition-all ${isTop ? 'bg-[var(--admin-accent)]' : 'bg-[var(--admin-text-muted)]'}`}
                    style={{ width: `${maxB > 0 ? (studio.bookings / maxB) * 100 : 0}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
