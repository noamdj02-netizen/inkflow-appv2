import React, { useCallback, useEffect, useState } from 'react';
import { Download, FileText, Loader2 } from 'lucide-react';
import {
  listClientDossierDocuments,
  type ClientDossierFile,
} from '../../lib/clientDossierDocuments';
import { cn } from '@/lib/utils';
import { dashboardListPanel, dashboardListRowCompact } from './ui/dashboardChrome';

interface ClientDossierDocumentsProps {
  studioId: string;
  clientId: string;
  className?: string;
}

const KIND_LABEL: Record<ClientDossierFile['kind'], string> = {
  devis: 'Devis',
  facture: 'Facture',
  recu: 'Reçu',
};

export const ClientDossierDocuments: React.FC<ClientDossierDocumentsProps> = ({
  studioId,
  clientId,
  className,
}) => {
  const [files, setFiles] = useState<ClientDossierFile[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!studioId || !clientId) {
      setFiles([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const list = await listClientDossierDocuments(studioId, clientId);
    setFiles(list);
    setLoading(false);
  }, [studioId, clientId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  if (loading) {
    return (
      <div className={cn('flex items-center gap-2 text-sm text-zinc-500', className)}>
        <Loader2 className="size-4 animate-spin" />
        Chargement des documents…
      </div>
    );
  }

  if (files.length === 0) {
    return (
      <p className={cn('text-sm text-zinc-500 dark:text-zinc-400', className)}>
        Aucun devis ou reçu enregistré. Générez un PDF depuis Demandes ou Finance — il sera archivé
        ici automatiquement.
      </p>
    );
  }

  return (
    <div className={cn(dashboardListPanel, className)}>
      {files.map((file) => (
        <a
          key={file.path}
          href={file.publicUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(dashboardListRowCompact, 'text-zinc-900 dark:text-zinc-100')}
        >
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100">
            <FileText className="size-4" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium">{file.name}</span>
            <span className="text-xs text-zinc-500">{KIND_LABEL[file.kind]}</span>
          </span>
          <Download className="size-4 shrink-0 text-zinc-400" />
        </a>
      ))}
    </div>
  );
};
