import React, { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { SEO } from '../../components/SEO';
import { useAuth } from '../../contexts/AuthContext';
import { isFounderAllowlistedEmail } from '../../lib/founderMetrics';
import { supabase } from '../../lib/supabase';

type BriefRow = {
  date: string;
  revenue: number;
  bookings: number;
  new_studios: number;
  unpaid_deposits: number;
  pending_projects: number;
  ig_reach: number | null;
  ig_profile_views: number | null;
  alerts: string[] | null;
};

function MetricCard({
  label,
  value,
  delta,
  accent,
}: {
  label: string;
  value: string | number;
  delta?: string;
  accent?: string;
}) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-3">
      <p className="mb-1 text-xs text-[#8a8a8a]">{label}</p>
      <p className="text-xl font-bold" style={{ color: accent ?? '#e8e3dc' }}>
        {value}
      </p>
      {delta ? <p className="mt-1 text-xs text-[#8a8a8a]">{delta}</p> : null}
    </div>
  );
}

export const DailyBriefPage: React.FC = () => {
  const { user } = useAuth();
  const allowed = isFounderAllowlistedEmail(user?.email);
  const [briefs, setBriefs] = useState<BriefRow[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!allowed) {
      setLoading(false);
      return;
    }
    setErr(null);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const t = sessionData.session?.access_token;
      if (!t) {
        setErr('Session expirée — reconnecte-toi.');
        return;
      }
      const url = `${window.location.origin}/api/daily-brief`;
      const r = await fetch(url, { headers: { Authorization: `Bearer ${t}` } });
      const j = (await r.json()) as { ok?: boolean; error?: string; briefs?: BriefRow[] };
      if (!r.ok) {
        setErr(j.error || `HTTP ${r.status}`);
        return;
      }
      setBriefs(j.briefs ?? []);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }, [allowed]);

  useEffect(() => {
    void load();
  }, [load]);

  if (!user) {
    return (
      <div className="founder-admin-scroll-root flex min-h-screen items-center justify-center bg-[#0d0d0d] p-4">
        <Loader2 className="h-10 w-10 animate-spin text-zinc-500" aria-label="Chargement" />
      </div>
    );
  }

  if (!allowed) {
    return (
      <div className="founder-admin-scroll-root min-h-screen bg-[#0d0d0d] p-4 text-zinc-100">
        <SEO title="Daily Brief" noindex canonical="/admin/daily-brief" />
        <p className="text-sm text-zinc-400">Accès réservé à l’espace fondateur.</p>
        <a href="/admin" className="mt-4 inline-block text-sm text-amber-200/80 hover:underline">
          Retour admin
        </a>
      </div>
    );
  }

  const today = briefs?.[0];
  const yesterday = briefs?.[1];
  const revenueGrowth =
    yesterday && typeof yesterday.revenue === 'number' && yesterday.revenue > 0 && today
      ? (((today.revenue - yesterday.revenue) / yesterday.revenue) * 100).toFixed(0)
      : null;

  return (
    <div className="founder-admin-scroll-root min-h-screen bg-[#0d0d0d] p-4 pb-20 font-sans text-[#e8e3dc]">
      <SEO
        title="Daily Brief"
        description="Résumé quotidien InkFlow"
        noindex
        canonical="/admin/daily-brief"
      />
      <button
        type="button"
        onClick={() => {
          window.history.pushState({}, '', '/admin');
          window.dispatchEvent(new Event('inkflow-navigate'));
        }}
        className="mb-4 inline-flex items-center gap-2 text-sm text-[#8a8a8a] transition-colors hover:text-zinc-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400"
        aria-label="Retour au tableau de bord admin"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Admin
      </button>
      <div className="mb-6">
        <p className="text-xs uppercase tracking-widest text-[#8a8a8a]">
          {new Date().toLocaleDateString('fr-FR', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
          })}
        </p>
        <h1 className="mt-1 font-display text-2xl font-bold">Daily Brief</h1>
        <p className="mt-1 text-xs text-[#8a8a8a]">
          Données consolidées (veille, fuseau Europe/Paris).
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
        </div>
      ) : err ? (
        <p className="text-sm text-red-400">{err}</p>
      ) : (
        <>
          {today?.alerts && today.alerts.length > 0 ? (
            <div className="mb-4 rounded-lg border border-red-800/50 bg-red-950/20 p-3">
              {today.alerts.map((a, i) => (
                <p key={i} className="text-sm text-red-300">
                  {a}
                </p>
              ))}
            </div>
          ) : null}

          <div className="mb-4">
            <p className="mb-2 text-xs uppercase tracking-widest text-[#8a8a8a]">App</p>
            <div className="grid grid-cols-2 gap-2">
              <MetricCard
                label="Encaissé (veille)"
                value={`${today?.revenue ?? 0}€`}
                delta={revenueGrowth != null ? `${revenueGrowth}% vs jour précédent` : undefined}
                accent="#00D4FF"
              />
              <MetricCard label="RDV créés" value={today?.bookings ?? 0} accent="#00D4FF" />
              <MetricCard label="Nouveaux studios" value={today?.new_studios ?? 0} />
              <MetricCard
                label="Acomptes impayés (total)"
                value={today?.unpaid_deposits ?? 0}
                accent={(today?.unpaid_deposits ?? 0) > 3 ? ('#DC2626' as const) : undefined}
              />
            </div>
          </div>

          {today?.ig_reach != null || today?.ig_profile_views != null ? (
            <div className="mb-4">
              <p className="mb-2 text-xs uppercase tracking-widest text-[#8a8a8a]">Instagram</p>
              <div className="grid grid-cols-2 gap-2">
                <MetricCard
                  label="Reach (veille, API)"
                  value={today?.ig_reach ?? '—'}
                  accent="#C9A84C"
                />
                <MetricCard
                  label="Visites profil"
                  value={today?.ig_profile_views ?? '—'}
                  accent="#C9A84C"
                />
              </div>
            </div>
          ) : null}

          <div className="mb-4">
            <p className="mb-2 text-xs uppercase tracking-widest text-[#8a8a8a]">Historique</p>
            <div className="space-y-1">
              {(briefs ?? []).map((b) => (
                <div
                  key={b.date}
                  className="flex items-center justify-between gap-2 border-b border-zinc-800 py-2 text-sm"
                >
                  <span className="shrink-0 text-[#8a8a8a]">
                    {new Date(b.date + 'T12:00:00').toLocaleDateString('fr-FR', {
                      weekday: 'short',
                      day: 'numeric',
                    })}
                  </span>
                  <span className="tabular-nums">{b.revenue}€</span>
                  <span className="shrink-0 text-[#8a8a8a]">{b.bookings} RDV</span>
                  {b.alerts && b.alerts.length > 0 ? (
                    <span className="text-amber-500">!</span>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
