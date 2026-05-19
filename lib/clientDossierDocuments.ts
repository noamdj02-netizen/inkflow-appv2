/**
 * Dossier client — PDF devis / factures / reçus dans Supabase Storage.
 * Chemin : client-dossier/{studioId}/{clientId}/{filename}.pdf
 */
import { supabase } from './supabase';

const BUCKET = 'inkflow-assets';
const ROOT = 'client-dossier';

export type ClientDossierDocumentKind = 'devis' | 'facture' | 'recu';

export interface ClientDossierFile {
  name: string;
  path: string;
  publicUrl: string;
  kind: ClientDossierDocumentKind;
  updatedAt: string | null;
}

function kindFromFilename(name: string): ClientDossierDocumentKind {
  const lower = name.toLowerCase();
  if (lower.startsWith('devis_') || lower.includes('devis')) return 'devis';
  if (lower.startsWith('facture_') || lower.includes('facture')) return 'facture';
  return 'recu';
}

export async function savePdfToClientDossier(params: {
  studioId: string;
  clientId: string;
  filename: string;
  blob: Blob;
}): Promise<{ path: string; publicUrl: string } | { error: string }> {
  const safeName = params.filename.replace(/[^\w.\-àâäéèêëïîôùûüçÀÂÄÉÈÊËÏÎÔÙÛÜÇ-]/g, '_');
  const path = `${ROOT}/${params.studioId}/${params.clientId}/${safeName}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, params.blob, {
    contentType: 'application/pdf',
    upsert: true,
  });

  if (error) return { error: error.message };

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return { path, publicUrl: data.publicUrl };
}

export async function listClientDossierDocuments(
  studioId: string,
  clientId: string
): Promise<ClientDossierFile[]> {
  const prefix = `${ROOT}/${studioId}/${clientId}`;
  const { data, error } = await supabase.storage.from(BUCKET).list(prefix, {
    limit: 50,
    sortBy: { column: 'updated_at', order: 'desc' },
  });

  if (error || !data?.length) return [];

  return data
    .filter((f) => f.name && f.name.endsWith('.pdf'))
    .map((f) => {
      const path = `${prefix}/${f.name}`;
      const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(path);
      return {
        name: f.name,
        path,
        publicUrl: urlData.publicUrl,
        kind: kindFromFilename(f.name),
        updatedAt: f.updated_at ?? f.created_at ?? null,
      };
    });
}
