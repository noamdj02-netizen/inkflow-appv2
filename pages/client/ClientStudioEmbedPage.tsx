/**
 * Outils studio dans le contexte « My Inkflow » : même session Supabase, URL reste /client/…
 * L’UI métier est chargée depuis /dashboard (iframe same-origin).
 */
import React, { useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Logo } from '../../components/Logo';
import { SEO } from '../../components/SEO';
import { supabase } from '../../lib/supabase';
import { getStudioByEmail } from '../../lib/supabaseDashboard';
import { CLIENT_DASHBOARD_THEME, buildClientDesignTokens } from '../../lib/clientDashboardTheme';

const D = buildClientDesignTokens(CLIENT_DASHBOARD_THEME);

type Access = 'loading' | 'ok' | 'no-session' | 'no-studio';

function ClientStudioEmbed({
  iframePath,
  pageTitle,
  seoTitle,
  canonicalPath,
}: {
  iframePath: string;
  pageTitle: string;
  seoTitle: string;
  canonicalPath: string;
}) {
  const [access, setAccess] = useState<Access>('loading');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (cancelled) return;
      if (!user?.email) {
        setAccess('no-session');
        return;
      }
      try {
        const row = await getStudioByEmail(user.email);
        if (cancelled) return;
        if (!row?.slug) setAccess('no-studio');
        else setAccess('ok');
      } catch {
        if (!cancelled) setAccess('no-studio');
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const iframeSrc = `${typeof window !== 'undefined' ? window.location.origin : ''}${iframePath}`;

  useEffect(() => {
    if (access === 'no-session') {
      window.location.replace('/client');
    }
  }, [access]);

  if (access === 'loading') {
    return (
      <div
        className="min-h-[100dvh] flex items-center justify-center client-dashboard-shell"
        style={{ background: D.bg }}
      >
        <div className="text-sm font-medium" style={{ color: D.muted }}>Chargement…</div>
      </div>
    );
  }

  if (access === 'no-session') {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center client-dashboard-shell" style={{ background: D.bg }}>
        <p className="text-sm" style={{ color: D.muted }}>Redirection…</p>
      </div>
    );
  }

  if (access === 'no-studio') {
    return (
      <div className="min-h-[100dvh] flex flex-col client-dashboard-shell px-4 py-8" style={{ background: D.bg }}>
        <SEO title={seoTitle} description="Réservé aux comptes studio Inkflow." canonical={canonicalPath} noindex />
        <p className="text-center text-sm mb-6" style={{ color: D.text }}>
          Cette page est réservée aux comptes avec un studio Inkflow lié à cet email.
        </p>
        <a
          href="/client/dashboard?tab=profile"
          className="mx-auto inline-flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold active:scale-[0.98] transition-transform"
          style={{ borderColor: D.border, background: D.card, color: D.text }}
        >
          Retour au profil
        </a>
      </div>
    );
  }

  return (
    <div
      className="app-shell flex min-h-0 min-h-[100dvh] flex-col client-dashboard-shell"
      style={{ background: D.bg, WebkitFontSmoothing: 'antialiased' }}
    >
      <SEO title={seoTitle} description="Personnalisation studio depuis l’app client Inkflow." canonical={canonicalPath} noindex />
      <header
        className="flex shrink-0 items-center gap-3 px-4 py-3 safe-top border-b"
        style={{ borderColor: D.border, background: D.headerBg, backdropFilter: D.blur }}
      >
        <a
          href="/client/dashboard?tab=profile"
          className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl active:scale-[0.98] transition-transform"
          style={{ color: D.text }}
          aria-label="Retour"
        >
          <ArrowLeft className="w-5 h-5" strokeWidth={2} />
        </a>
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <Logo size="sm" className="shrink-0 rounded-lg" />
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold" style={{ color: D.text }}>{pageTitle}</div>
            <div className="truncate text-[11px]" style={{ color: D.muted }}>My Inkflow</div>
          </div>
        </div>
      </header>
      <iframe
        title={pageTitle}
        src={iframeSrc}
        className="min-h-0 w-full flex-1 border-0 bg-white dark:bg-zinc-950"
      />
    </div>
  );
}

export function ClientVitrineEmbedPage() {
  return (
    <ClientStudioEmbed
      iframePath="/dashboard?vitrine=1"
      pageTitle="Ma vitrine"
      seoTitle="Personnaliser ma vitrine · My Inkflow"
      canonicalPath="/client/vitrine"
    />
  );
}

export function ClientFlashToolsEmbedPage() {
  return (
    <ClientStudioEmbed
      iframePath="/dashboard?tab=flash"
      pageTitle="Flashs studio"
      seoTitle="Gérer les flashs · My Inkflow"
      canonicalPath="/client/studio/flash"
    />
  );
}
