/**
 * Vue "Projets" de la CRM — demandes de projet regroupées par client.
 * Extraite de ClientList.tsx pour réduire sa taille.
 */
import React, { useMemo } from 'react';
import { ChevronRight, Loader2, PenLine } from 'lucide-react';
import type { Client, ProjectRequest } from '../../types';
import { groupProjectRequestsByClient, projectStatusMeta } from './clientListUtils';

interface ClientProjectsViewProps {
  clients: Client[];
  projectRequests: ProjectRequest[];
  projectRequestsLoading: boolean;
  useSupabase?: boolean;
  onOpenRequestsProjects?: () => void;
}

export const ClientProjectsView: React.FC<ClientProjectsViewProps> = ({
  clients,
  projectRequests,
  projectRequestsLoading,
  useSupabase,
  onOpenRequestsProjects,
}) => {
  const groupedProjectRequests = useMemo(
    () => groupProjectRequestsByClient(projectRequests),
    [projectRequests]
  );
  const pendingTotal = projectRequests.filter((r) => r.status === 'pending').length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-white tracking-tight font-display">
            Projets par client
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1 text-sm sm:text-base max-w-2xl">
            Demandes de projet personnalisé regroupées par e-mail client. Pour accepter, refuser ou contacter le client (e-mail / Instagram),
            passez par <span className="font-medium text-zinc-700 dark:text-zinc-300">Demandes → Projets</span>.
          </p>
        </div>
        {onOpenRequestsProjects && (
          <button
            type="button"
            onClick={onOpenRequestsProjects}
            className="inline-flex items-center justify-center gap-2 min-h-[44px] px-4 py-2.5 rounded-lg text-sm font-semibold border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all active:scale-[0.98] shrink-0"
          >
            Ouvrir Demandes
            <ChevronRight className="w-4 h-4" aria-hidden />
          </button>
        )}
      </div>

      {projectRequestsLoading ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30">
          <Loader2 className="w-8 h-8 text-zinc-400 animate-spin" aria-hidden />
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Chargement des demandes…</p>
        </div>
      ) : !useSupabase ? (
        <div className="rounded-md border border-dashed border-zinc-300 dark:border-zinc-700 p-8 text-center bg-zinc-50/30 dark:bg-zinc-950/40">
          <PenLine className="w-10 h-10 text-zinc-400 mx-auto mb-3" strokeWidth={1.5} aria-hidden />
          <p className="text-sm text-zinc-600 dark:text-zinc-400 max-w-md mx-auto">
            Connectez Supabase pour synchroniser les demandes de projet depuis la vitrine.
          </p>
        </div>
      ) : groupedProjectRequests.length === 0 ? (
        <div className="rounded-md border border-zinc-200 dark:border-zinc-800 p-10 text-center bg-white dark:bg-zinc-900/40">
          <div className="w-12 h-12 rounded-md border border-zinc-200 dark:border-zinc-700 flex items-center justify-center mx-auto mb-4">
            <PenLine className="w-6 h-6 text-zinc-500" strokeWidth={1.5} aria-hidden />
          </div>
          <h3 className="text-base font-semibold text-zinc-900 dark:text-white mb-1">Aucune demande pour l'instant</h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto">
            Les demandes de tatouage personnalisé reçues depuis votre page de réservation apparaîtront ici, classées par client.
          </p>
          {onOpenRequestsProjects && (
            <button
              type="button"
              onClick={onOpenRequestsProjects}
              className="mt-5 text-sm font-medium text-zinc-700 dark:text-zinc-300 underline underline-offset-2 hover:text-zinc-900 dark:hover:text-white"
            >
              Voir l'onglet Demandes
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {pendingTotal > 0 && (
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              {pendingTotal} demande{pendingTotal > 1 ? 's' : ''} en attente de réponse
            </p>
          )}
          <ul className="space-y-3">
            {groupedProjectRequests.map((group) => {
              const emailLower = group.clientEmail.toLowerCase();
              const crmMatch = clients.find((c) => c.email?.toLowerCase().trim() === emailLower);
              const initial = (group.clientName || group.clientEmail || '?').trim().charAt(0).toUpperCase();

              return (
                <li
                  key={emailLower}
                  className="rounded-md border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 shadow-[0_1px_0_0_rgba(0,0,0,0.04)] dark:shadow-none overflow-hidden"
                >
                  <div className="flex items-start gap-3 px-4 py-3 border-b border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/80 dark:bg-zinc-950/40">
                    <div
                      className="w-10 h-10 rounded-md border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-sm font-bold text-zinc-700 dark:text-zinc-200 shrink-0 bg-white dark:bg-zinc-900"
                      aria-hidden
                    >
                      {crmMatch?.avatar ? (
                        <img src={crmMatch.avatar} alt="" className="w-full h-full object-cover rounded-md" />
                      ) : (
                        initial
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-zinc-900 dark:text-white truncate">{group.clientName}</p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">{group.clientEmail}</p>
                      {crmMatch && (
                        <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-0.5">Fiche CRM · {crmMatch.name}</p>
                      )}
                    </div>
                    <span className="text-xs font-medium tabular-nums text-zinc-500 dark:text-zinc-400 shrink-0">
                      {group.requests.length} demande{group.requests.length > 1 ? 's' : ''}
                    </span>
                  </div>
                  <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    {group.requests.map((req) => {
                      const st = projectStatusMeta(req.status);
                      const dateStr = new Date(req.createdAt).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      });
                      const preview =
                        req.description.length > 160 ? `${req.description.slice(0, 160)}…` : req.description;

                      return (
                        <li key={req.id} className="px-4 py-3 flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-4">
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              <span className={`text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-sm ${st.className}`}>
                                {st.label}
                              </span>
                              <span className="text-xs text-zinc-400 dark:text-zinc-500">{dateStr}</span>
                            </div>
                            <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-snug whitespace-pre-wrap">
                              {preview || '—'}
                            </p>
                            {(req.placement || req.budget) && (
                              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1.5">
                                {[req.placement && `Emplacement : ${req.placement}`, req.budget && `Budget : ${req.budget}`]
                                  .filter(Boolean)
                                  .join(' · ')}
                              </p>
                            )}
                          </div>
                          {onOpenRequestsProjects && req.status === 'pending' && (
                            <button
                              type="button"
                              onClick={onOpenRequestsProjects}
                              className="shrink-0 self-start sm:self-center text-xs font-semibold text-zinc-700 dark:text-zinc-300 border border-zinc-300 dark:border-zinc-600 rounded-md px-2.5 py-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors active:scale-[0.98]"
                            >
                              Répondre
                            </button>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
};
