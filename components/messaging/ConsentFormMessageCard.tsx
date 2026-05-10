import React, { useEffect, useState, useCallback } from 'react';
import { Loader2, FileCheck, Clock, ExternalLink } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { ConsentFormSign } from '../consent/ConsentFormSign';
import { getCanonicalAppOrigin } from '../../lib/urls';

export type ConsentFormMessageCardMode = 'client_sign' | 'studio_status';

interface ConsentFormMessageCardProps {
  consentFormId: string;
  title: string;
  mode: ConsentFormMessageCardMode;
  /** Classes du conteneur bulle (messagerie publique vs pro) */
  className?: string;
}

export const ConsentFormMessageCard: React.FC<ConsentFormMessageCardProps> = ({
  consentFormId,
  title,
  mode,
  className = '',
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [template, setTemplate] = useState<string | null>(null);
  const [clientName, setClientName] = useState('');
  const [signedAt, setSignedAt] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase.rpc('get_consent_form_for_public_portal', {
      p_id: consentFormId,
    });
    const raw = Array.isArray(data) ? data[0] : data;
    if (err) {
      setError('Impossible de charger le formulaire.');
      setLoading(false);
      return;
    }
    if (!raw || typeof raw !== 'object') {
      setError('Formulaire introuvable ou expiré.');
      setLoading(false);
      return;
    }
    const row = raw as {
      template?: string | null;
      client_name?: string | null;
      signed_at?: string | null;
    };
    setTemplate(row.template ?? '');
    setClientName(row.client_name || 'Client');
    setSignedAt(row.signed_at ?? null);
    if (!row.signed_at && !row.template?.trim()) {
      setError('Formulaire introuvable ou expiré.');
    }
    setLoading(false);
  }, [consentFormId]);

  useEffect(() => {
    void load();
  }, [load]);

  const consentPageUrl = `${getCanonicalAppOrigin()}/consent/${encodeURIComponent(consentFormId)}`;

  if (loading) {
    return (
      <div
        className={`rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-6 flex items-center justify-center gap-2 text-sm text-zinc-500 ${className}`}
      >
        <Loader2 className="w-5 h-5 animate-spin shrink-0" aria-hidden />
        Chargement du formulaire…
      </div>
    );
  }

  if (error || (!signedAt && !template)) {
    return (
      <div
        className={`rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 ${className}`}
      >
        {error ?? 'Erreur'}
      </div>
    );
  }

  if (mode === 'studio_status') {
    return (
      <div
        className={`rounded-2xl border border-blue-200/90 dark:border-blue-500/25 bg-blue-50/90 dark:bg-blue-500/10 px-4 py-3 space-y-2 min-w-0 max-w-full select-text ${className}`}
      >
        <div className="flex items-start gap-2 min-w-0">
          {signedAt ? (
            <FileCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" aria-hidden />
          ) : (
            <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" aria-hidden />
          )}
          <div className="min-w-0">
            <p className="text-sm font-semibold text-zinc-900 dark:text-white leading-snug">
              {title}
            </p>
            {signedAt ? (
              <p className="text-xs text-emerald-800 dark:text-emerald-200 mt-1">
                Signé le{' '}
                {new Date(signedAt).toLocaleString('fr-FR', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            ) : (
              <p className="text-xs text-amber-900 dark:text-amber-100/90 mt-1">
                En attente de signature client
              </p>
            )}
          </div>
        </div>
        <a
          href={consentPageUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs font-medium text-blue-700 dark:text-blue-300 hover:underline min-h-[36px]"
        >
          Ouvrir la page dédiée
          <ExternalLink className="w-3 h-3" aria-hidden />
        </a>
      </div>
    );
  }

  // Client : signature dans le fil
  if (signedAt) {
    return (
      <div
        className={`rounded-2xl border border-emerald-200 bg-emerald-50/90 px-4 py-3 text-sm text-emerald-900 min-w-0 max-w-full ${className}`}
      >
        <p className="font-semibold">{title}</p>
        <p className="text-xs mt-1 opacity-90">
          Déjà signé le{' '}
          {new Date(signedAt).toLocaleString('fr-FR', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
      </div>
    );
  }

  return (
    <div
      className={`rounded-2xl border border-neutral-200 bg-white shadow-sm overflow-hidden min-w-0 max-w-full ${className}`}
    >
      <div className="px-3 pt-3 pb-1 border-b border-neutral-100">
        <p className="text-sm font-semibold text-neutral-900 leading-tight">{title}</p>
        <p className="text-[11px] text-neutral-500 mt-1">
          Lis le texte, signe ci-dessous : le studio enregistre la réponse sur ta fiche.
        </p>
      </div>
      <div className="p-3">
        <ConsentFormSign
          template={template}
          clientName={clientName}
          embedded
          onSign={async ({ signatureData, filledTemplateText }) => {
            const { error: upErr, data: ok } = await supabase.rpc('submit_consent_form_signature', {
              p_id: consentFormId,
              p_signature_data: signatureData,
              p_filled_template_text: filledTemplateText,
            });
            if (upErr) throw new Error(upErr.message);
            if (ok !== true) throw new Error('Signature impossible.');
            setSignedAt(new Date().toISOString());
          }}
        />
      </div>
    </div>
  );
};
