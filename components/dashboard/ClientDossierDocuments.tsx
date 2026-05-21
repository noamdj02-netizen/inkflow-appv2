import React, { useCallback, useEffect, useState } from 'react';
import { ExternalLink, FileText, Loader2 } from 'lucide-react';
import {
  fetchClientDossierDocumentItems,
  type ClientDossierDocumentItem,
} from '../../lib/clientDossierDocuments';
import { cn } from '@/lib/utils';

interface ClientDossierDocumentsProps {
  studioId: string;
  clientId: string;
  /** Incrémenter après encaissement pour recharger la liste. */
  refreshKey?: number;
  className?: string;
}

export const ClientDossierDocuments: React.FC<ClientDossierDocumentsProps> = ({
  studioId,
  clientId,
  refreshKey = 0,
  className,
}) => {
  const [items, setItems] = useState<ClientDossierDocumentItem[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!studioId || !clientId) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const list = await fetchClientDossierDocumentItems(studioId, clientId);
    setItems(list);
    setLoading(false);
  }, [studioId, clientId]);

  useEffect(() => {
    void refresh();
  }, [refresh, refreshKey]);

  if (loading) {
    return (
      <div className={cn('flex items-center gap-2 text-sm text-zinc-500', className)}>
        <Loader2 className="size-4 animate-spin" aria-hidden />
        Chargement des documents…
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <p className={cn('text-sm leading-relaxed text-zinc-500 dark:text-zinc-400', className)}>
        Aucun devis ou reçu enregistré. Après un encaissement via « Clôturer / encaisser », le reçu
        PDF est archivé ici automatiquement.
      </p>
    );
  }

  return (
    <ul
      className={cn(
        'divide-y divide-zinc-100 overflow-hidden rounded-2xl border border-zinc-200/80 bg-zinc-50/30 dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-950/50',
        className
      )}
    >
      {items.map((doc) => (
        <li key={doc.id}>
          <div className="flex items-center gap-3 px-4 py-3.5 sm:px-5">
            <span
              className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm dark:bg-zinc-900 dark:shadow-[0_0_12px_rgba(255,255,255,0.03)]"
              aria-hidden
            >
              <FileText
                className="size-[18px] text-zinc-600 dark:text-zinc-300"
                strokeWidth={1.5}
              />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium tracking-tight text-zinc-900 dark:text-zinc-100">
                {doc.displayTitle}
              </p>
              <p className="mt-0.5 truncate text-xs text-zinc-500 dark:text-zinc-500">
                {doc.subtitle}
              </p>
            </div>
            <a
              href={doc.publicUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-[40px] shrink-0 items-center gap-1.5 rounded-xl px-3 text-xs font-semibold text-zinc-700 transition-all hover:bg-white active:scale-[0.98] dark:text-zinc-200 dark:hover:bg-zinc-900"
            >
              Ouvrir
              <ExternalLink className="size-3.5 opacity-60" strokeWidth={2} aria-hidden />
            </a>
          </div>
        </li>
      ))}
    </ul>
  );
};
