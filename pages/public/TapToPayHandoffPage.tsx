import React, { useMemo } from 'react';
import { Smartphone } from 'lucide-react';
import { getCanonicalAppOrigin } from '../../lib/urls';

/**
 * Point de passage HTTPS → app native Tap to Pay.
 * Safari iOS rejette souvent `window.location = inkflowpro://…` (« adresse non valide ») ;
 * un lien <a> explicite après chargement de cette page ouvre correctement l’app.
 */
export const TapToPayHandoffPage: React.FC<Record<string, string>> = () => {
  const { deepLink, valid, appointmentId, amountEuros } = useMemo(() => {
    try {
      const q = new URLSearchParams(
        typeof window !== 'undefined' ? window.location.search : ''
      );
      const appointment = q.get('appointment')?.trim() ?? '';
      const studio = q.get('studio')?.trim() ?? '';
      const amountRaw = q.get('amountEuros')?.trim() ?? '';
      if (!appointment || !studio || !amountRaw) {
        return {
          deepLink: '',
          valid: false as const,
          appointmentId: '',
          amountEuros: '',
        };
      }
      const params = new URLSearchParams({
        appointment,
        studio,
        amountEuros: amountRaw,
      });
      return {
        deepLink: `inkflowpro://tap-to-pay?${params.toString()}`,
        valid: true as const,
        appointmentId: appointment,
        amountEuros: amountRaw,
      };
    } catch {
      return {
        deepLink: '',
        valid: false as const,
        appointmentId: '',
        amountEuros: '',
      };
    }
  }, []);

  const dashboardUrl = `${getCanonicalAppOrigin().replace(/\/$/, '')}/dashboard`;

  return (
    <div className="min-h-[100dvh] bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-6 safe-bottom">
      <div className="max-w-md w-full rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-6 shadow-sm">
        <div className="flex size-12 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-zinc-800 mb-4">
          <Smartphone className="size-6 text-zinc-800 dark:text-zinc-100" strokeWidth={1.5} />
        </div>
        <h1 className="type-heading-sm">
          Tap to Pay — Inkflow Pro
        </h1>
        {valid ? (
          <>
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
              Solde <span className="font-semibold text-zinc-800 dark:text-zinc-200">{amountEuros} €</span>{' '}
              · RDV <span className="font-mono text-xs">{appointmentId.slice(0, 20)}…</span>
            </p>
            <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-300">
              Sur iPhone, utilise le bouton ci-dessous pour ouvrir l’app Inkflow Pro (Tap to Pay natif).
              Ne pas utiliser uniquement la barre d’adresse Safari pour le lien interne.
            </p>
            <a
              href={deepLink}
              className="mt-6 flex min-h-12 w-full items-center justify-center rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 text-sm font-semibold transition-all active:scale-[0.98]"
            >
              Ouvrir Inkflow Pro
            </a>
            <p className="mt-4 text-xs text-zinc-500 dark:text-zinc-400 text-center">
              Rien ne s’ouvre ? Installe ou mets à jour Inkflow Pro, puis réessaie.
            </p>
          </>
        ) : (
          <p className="mt-3 text-sm text-amber-800 dark:text-amber-200">
            Lien incomplet (paramètres manquants). Retourne au dashboard et relance la clôture de
            séance.
          </p>
        )}
        <a
          href={dashboardUrl}
          className="mt-6 block text-center text-sm font-medium text-blue-600 dark:text-blue-400"
        >
          Retour au dashboard
        </a>
      </div>
    </div>
  );
};
