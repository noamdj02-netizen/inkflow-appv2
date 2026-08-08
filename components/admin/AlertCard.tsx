import React from 'react';
import { AlertTriangle, CheckCircle } from 'lucide-react';

export interface FounderAlertItem {
  id: string;
  title: string;
  count: number;
  severity: 'warning' | 'error';
}

interface AlertCardProps {
  alerts: FounderAlertItem[];
}

export function AlertCard({ alerts }: AlertCardProps): React.ReactElement {
  if (alerts.length === 0) {
    return (
      <div className="rounded-xl border border-[var(--admin-border)] bg-[var(--admin-card)] p-6">
        <div className="mb-4 flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-emerald-500" />
          <h3 className="font-semibold text-[var(--admin-text)]">Rien d&apos;urgent</h3>
        </div>
        <p className="text-sm text-[var(--admin-text-muted)]">
          Aucune alerte au-dessus des seuils affichés.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-red-200/90 bg-red-50/95 p-6 dark:border-red-900/50 dark:bg-red-950/30">
      <div className="mb-4 flex items-center gap-2">
        <AlertTriangle className="h-5 w-5 text-red-500" />
        <h3 className="font-semibold text-[var(--admin-text)]">Alertes ({alerts.length})</h3>
      </div>
      <div className="space-y-3">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className="flex items-center justify-between rounded-lg border border-red-500/10 bg-[var(--admin-card)]/50 p-3 transition-colors hover:border-red-500/30"
          >
            <div className="flex-1">
              <p className="text-sm font-medium text-[var(--admin-text)]">{alert.title}</p>
              <p className="mt-1 text-xs text-[var(--admin-text-muted)]">
                {alert.count} {alert.count > 1 ? 'occurrences' : 'occurrence'}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
