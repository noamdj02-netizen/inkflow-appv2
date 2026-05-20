import { CreditCard, Star, UserPlus, Wallet } from 'lucide-react';
import type { Appointment, Client } from '@/types';
import { cn } from '@/lib/utils';
import { ClientPhotoAvatar } from '@/components/common/ClientPhotoAvatar';

const shellCard =
  'h-full rounded-2xl border border-zinc-200/90 bg-white shadow-sm dark:border-zinc-800/90 dark:bg-zinc-900/50';

export interface DashboardOverviewClientsPanelProps {
  topClients: Client[];
  recentDeposits: Appointment[];
  privacyMode: boolean;
  tab: 'clients' | 'deposits';
  onTabChange: (tab: 'clients' | 'deposits') => void;
  onOpenClients: () => void;
  onOpenFinance: () => void;
  onNewClient: () => void;
  onSelectAppointment: (apt: Appointment) => void;
}

export function DashboardOverviewClientsPanel({
  topClients,
  recentDeposits,
  privacyMode,
  tab,
  onTabChange,
  onOpenClients,
  onOpenFinance,
  onNewClient,
  onSelectAppointment,
}: DashboardOverviewClientsPanelProps) {
  return (
    <article className={cn(shellCard, 'flex flex-col overflow-hidden')}>
      <div className="border-b border-zinc-100 px-4 py-4 dark:border-zinc-800">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">Clients & acomptes</h3>
        <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
          Suivi rapide des profils et encaissements
        </p>
        <div className="mt-3 flex gap-1 rounded-xl bg-zinc-100 p-1 dark:bg-zinc-800/80">
          <button
            type="button"
            onClick={() => onTabChange('clients')}
            className={cn(
              'flex-1 rounded-lg px-3 py-2 text-xs font-semibold transition-all active:scale-[0.98]',
              tab === 'clients'
                ? 'bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-white'
                : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200'
            )}
          >
            Clients
          </button>
          <button
            type="button"
            onClick={() => onTabChange('deposits')}
            className={cn(
              'flex-1 rounded-lg px-3 py-2 text-xs font-semibold transition-all active:scale-[0.98]',
              tab === 'deposits'
                ? 'bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-white'
                : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200'
            )}
          >
            Acomptes
          </button>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4">
        {tab === 'clients' ? (
          <>
            <button
              type="button"
              onClick={onNewClient}
              className="mb-3 flex min-h-[44px] w-full items-center gap-3 rounded-xl border-2 border-dashed border-zinc-200 px-3 py-2.5 text-left transition-all hover:border-zinc-300 hover:bg-zinc-50 active:scale-[0.98] dark:border-zinc-700 dark:hover:border-zinc-600 dark:hover:bg-zinc-800/50"
            >
              <span className="flex size-10 items-center justify-center rounded-xl bg-zinc-100 dark:bg-zinc-800">
                <UserPlus className="size-4 text-zinc-500 dark:text-zinc-400" aria-hidden />
              </span>
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Nouveau client
              </span>
            </button>
            {topClients.length > 0 ? (
              <ul className="flex flex-1 flex-col gap-1">
                {topClients.slice(0, 6).map((client) => {
                  const isVip = (client.totalSpent ?? 0) >= 500;
                  return (
                    <li key={client.id}>
                      <button
                        type="button"
                        onClick={onOpenClients}
                        title={
                          privacyMode
                            ? client.name
                            : `${client.name} — ${client.totalSpent ?? 0}€ encaissés`
                        }
                        className="group flex min-h-[52px] w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition-colors hover:bg-zinc-50 active:scale-[0.99] dark:hover:bg-zinc-800/60"
                      >
                        <div className="flex size-10 shrink-0 overflow-hidden rounded-xl bg-zinc-100 dark:bg-zinc-800">
                          <ClientPhotoAvatar
                            name={client.name}
                            src={client.avatar}
                            className="h-full w-full"
                            textClassName="text-sm font-semibold text-zinc-600 dark:text-zinc-300"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="truncate text-sm font-medium text-zinc-900 dark:text-white">
                              {client.name}
                            </span>
                            {isVip ? (
                              <Star
                                className="size-3.5 shrink-0 fill-amber-400 text-amber-500"
                                aria-label="Client VIP"
                              />
                            ) : null}
                          </div>
                          <span className="text-xs text-zinc-500 dark:text-zinc-400">
                            {privacyMode
                              ? '••••'
                              : `${(client.totalSpent ?? 0).toLocaleString('fr-FR')}€ encaissés`}
                          </span>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="py-8 text-center text-sm text-zinc-400">Aucun client</p>
            )}
          </>
        ) : recentDeposits.length > 0 ? (
          <ul className="flex flex-1 flex-col gap-1">
            {recentDeposits.slice(0, 6).map((apt) => (
              <li key={apt.id}>
                <button
                  type="button"
                  onClick={() => onSelectAppointment(apt)}
                  className="flex min-h-[52px] w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition-colors hover:bg-zinc-50 active:scale-[0.99] dark:hover:bg-zinc-800/60"
                >
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-zinc-100 dark:bg-zinc-800">
                    <CreditCard className="size-4 text-zinc-500 dark:text-zinc-400" aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm font-medium text-zinc-800 dark:text-zinc-200">
                    {apt.clientName || 'Client'}
                  </span>
                  <span className="shrink-0 text-sm font-bold tabular-nums text-zinc-900 dark:text-white">
                    {privacyMode ? '+••••' : `+${apt.deposit ?? 0}€`}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center py-8 text-center">
            <span className="mb-3 flex size-12 items-center justify-center rounded-xl bg-zinc-100 dark:bg-zinc-800">
              <Wallet className="size-5 text-zinc-400" aria-hidden />
            </span>
            <p className="text-sm text-zinc-400">Aucun acompte récent</p>
          </div>
        )}
      </div>

      <div className="border-t border-zinc-100 px-4 py-3 dark:border-zinc-800">
        <button
          type="button"
          onClick={tab === 'clients' ? onOpenClients : onOpenFinance}
          className="min-h-[40px] w-full rounded-xl text-xs font-semibold text-zinc-500 transition-colors hover:bg-zinc-50 hover:text-zinc-800 active:scale-[0.98] dark:text-zinc-400 dark:hover:bg-zinc-800/50 dark:hover:text-zinc-200"
        >
          Voir tout →
        </button>
      </div>
    </article>
  );
}
