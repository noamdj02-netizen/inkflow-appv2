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
  if (lower.startsWith('facture_') || lower.startsWith('fac-') || lower.includes('facture')) {
    return 'facture';
  }
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

export interface ClientDossierDocumentItem {
  id: string;
  displayTitle: string;
  subtitle: string;
  publicUrl: string;
  path: string;
  kind: ClientDossierDocumentKind;
  amountEur: number | null;
  createdAt: string | null;
}

function formatDocDateFr(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

function kindFromPaymentKind(paymentKind: string): ClientDossierDocumentKind {
  if (paymentKind === 'deposit') return 'recu';
  if (paymentKind === 'balance' || paymentKind === 'manual_balance') return 'recu';
  return 'facture';
}

function displayTitleForInvoice(row: {
  payment_kind: string;
  document_number: string;
  created_at: string;
  amount_paid_eur: number;
}): string {
  const dateLabel = formatDocDateFr(row.created_at);
  if (row.payment_kind === 'deposit') {
    return dateLabel ? `Reçu d'acompte — ${dateLabel}` : "Reçu d'acompte";
  }
  if (row.payment_kind === 'balance' || row.payment_kind === 'manual_balance') {
    return dateLabel ? `Reçu — ${dateLabel}` : 'Reçu de paiement';
  }
  return dateLabel ? `Facture — ${dateLabel}` : `Facture ${row.document_number}`;
}

/**
 * Liste unifiée : journal `inkflow_payment_invoices` + fichiers Storage (dédupliqués).
 */
export async function fetchClientDossierDocumentItems(
  studioId: string,
  clientId: string
): Promise<ClientDossierDocumentItem[]> {
  const byUrl = new Map<string, ClientDossierDocumentItem>();

  const { data: invoiceRows, error: invErr } = await supabase
    .from('inkflow_payment_invoices')
    .select('id,payment_kind,document_number,public_url,storage_path,amount_paid_eur,created_at')
    .eq('studio_id', studioId)
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })
    .limit(40);

  if (!invErr && invoiceRows?.length) {
    for (const row of invoiceRows) {
      const url = (row.public_url as string | null)?.trim();
      if (!url) continue;
      const amount = Number(row.amount_paid_eur);
      const createdAt = (row.created_at as string) || null;
      const paymentKind = String(row.payment_kind || '');
      const item: ClientDossierDocumentItem = {
        id: String(row.id),
        displayTitle: displayTitleForInvoice({
          payment_kind: paymentKind,
          document_number: String(row.document_number || ''),
          created_at: createdAt || new Date().toISOString(),
          amount_paid_eur: amount,
        }),
        subtitle:
          Number.isFinite(amount) && amount > 0
            ? `${amount.toFixed(2).replace('.', ',')} € · ${String(row.document_number || '')}`
            : String(row.document_number || ''),
        publicUrl: url,
        path: String(row.storage_path || ''),
        kind: kindFromPaymentKind(paymentKind),
        amountEur: Number.isFinite(amount) ? amount : null,
        createdAt,
      };
      byUrl.set(url, item);
    }
  }

  const storageFiles = await listClientDossierDocuments(studioId, clientId);
  for (const f of storageFiles) {
    if (byUrl.has(f.publicUrl)) continue;
    const dateLabel = formatDocDateFr(f.updatedAt);
    const kindLabel = f.kind === 'devis' ? 'Devis' : f.kind === 'recu' ? 'Reçu' : 'Facture';
    byUrl.set(f.publicUrl, {
      id: f.path,
      displayTitle: dateLabel ? `${kindLabel} — ${dateLabel}` : f.name.replace(/\.pdf$/i, ''),
      subtitle: f.name,
      publicUrl: f.publicUrl,
      path: f.path,
      kind: f.kind,
      amountEur: null,
      createdAt: f.updatedAt,
    });
  }

  return [...byUrl.values()].sort((a, b) => {
    const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return tb - ta;
  });
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
