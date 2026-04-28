import React, { useCallback, useEffect, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Building2,
  CreditCard,
  Download,
  ExternalLink,
  Eye,
  EyeOff,
  FileText,
  HeartPulse,
  LayoutDashboard,
  Loader2,
  RefreshCw,
  Sparkles,
  TrendingUp,
  Users,
  Wallet,
} from 'lucide-react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from 'recharts';
import { SEO } from '../../components/SEO';
import { AdminShell } from '../../components/admin/AdminShell';
import { useAuth } from '../../contexts/AuthContext';
import { cn } from '../../lib/utils';
import { supabase } from '../../lib/supabase';
import { FounderAdminOverview } from '../../components/admin/FounderAdminOverview';
import { FounderAdminSectionExplainer } from '../../components/admin/FounderAdminSectionExplainer';
import {
  downloadCsv,
  fetchFounderMetrics,
  isFounderAllowlistedEmail,
  isFounderClientAllowlistConfigured,
  type FounderMetricsPayload,
} from '../../lib/founderMetrics';
import {
  getFounderNavMeta,
  isFounderAdminSlug,
  type FounderAdminSlug,
} from '../../lib/founderAdminNav';

const BRAND_BG = '#0d0d0d';
const ACCENT = '#c9a96e';
const CHART_COLORS = ['#52525b', '#71717a', '#a1a1aa', '#c9a96e', '#57534e', '#78716c', '#d4d4d8'];
const CHART_GRID_STROKE = '#e4e4e7';
const RECHARTS_TOOLTIP_LIGHT = {
  contentStyle: {
    background: '#ffffff',
    border: '1px solid #e4e4e7',
    borderRadius: 8,
    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.06)',
  },
  labelStyle: { color: '#52525b' },
  itemStyle: { color: '#18181b' },
} as const;

const REFRESH_MS = 5 * 60 * 1000;

function formatAuthUsers(n: number): string {
  if (n < 0) return 'Indisponible';
  return new Intl.NumberFormat('fr-FR').format(n);
}

function WidgetShell(props: {
  title: string;
  subtitle?: string;
  onExportCsv?: () => void;
  children: React.ReactNode;
  className?: string;
  id?: string;
}): React.ReactElement {
  return (
    <section
      id={props.id}
      className={`rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-5 ${props.className ?? ''}`}
    >
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3 sm:mb-4">
        <div>
          <h2 className="text-sm font-semibold tracking-tight text-zinc-900">{props.title}</h2>
          {props.subtitle ? (
            <p className="mt-0.5 max-w-prose text-xs text-zinc-500">{props.subtitle}</p>
          ) : null}
        </div>
        {props.onExportCsv ? (
          <button
            type="button"
            onClick={props.onExportCsv}
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 px-2.5 py-1.5 text-xs font-medium text-zinc-600 transition-all hover:border-zinc-300 hover:bg-zinc-50 active:scale-[0.98]"
          >
            <Download className="h-3.5 w-3.5" aria-hidden />
            CSV
          </button>
        ) : null}
      </div>
      {props.children}
    </section>
  );
}

/** Carte KPI fondateur — fond clair, export CSV visible au survol (accessibilité : focus). */
function FounderKpiCard(props: {
  label: string;
  icon?: React.ReactNode;
  sub?: string;
  onExportCsv: () => void;
  valueIsZero?: boolean;
  variant?: 'default' | 'rose' | 'amber';
  minHeightClass?: string;
  children: React.ReactNode;
}): React.ReactElement {
  const { variant = 'default', minHeightClass = 'min-h-[120px]' } = props;
  const shell =
    variant === 'rose'
      ? 'border-rose-200 bg-gradient-to-b from-rose-50 to-white'
      : variant === 'amber'
        ? 'border-amber-200 bg-gradient-to-b from-amber-50 to-white'
        : 'border-zinc-200 bg-white';
  const labelClass =
    variant === 'rose' ? 'text-rose-900' : variant === 'amber' ? 'text-amber-900' : 'text-zinc-600';

  return (
    <div
      className={cn(
        'group relative flex min-w-0 flex-col justify-between rounded-2xl border p-4 shadow-sm transition-shadow sm:p-5 hover:shadow-md',
        variant === 'default' && 'hover:border-zinc-300/90',
        variant === 'rose' && 'hover:border-rose-300',
        variant === 'amber' && 'hover:border-amber-300',
        minHeightClass,
        shell
      )}
    >
      <button
        type="button"
        onClick={props.onExportCsv}
        className="founder-admin-no-print absolute right-3 top-3 rounded-lg p-1.5 text-zinc-400 opacity-0 transition-opacity hover:bg-zinc-100 hover:text-zinc-800 group-hover:opacity-100 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-zinc-400"
        title="Exporter CSV"
      >
        <Download className="h-4 w-4" aria-hidden />
      </button>
      <div className="min-w-0 pr-10">
        <p
          className={cn(
            'flex min-w-0 items-center gap-2 text-[11px] font-medium uppercase tracking-wide',
            labelClass
          )}
        >
          {props.icon ? <span className="shrink-0 [&_svg]:text-current">{props.icon}</span> : null}
          <span className="leading-tight">{props.label}</span>
        </p>
        {props.sub ? (
          <p className="mt-1.5 text-[11px] leading-snug text-zinc-600">{props.sub}</p>
        ) : null}
        <div
          className={cn(
            'mt-2 text-2xl font-bold tabular-nums tracking-tight text-zinc-900 sm:text-3xl',
            props.valueIsZero && 'font-semibold text-zinc-400 [&_span]:text-zinc-400'
          )}
        >
          {props.children}
        </div>
      </div>
    </div>
  );
}

function maskSensitiveNumber(reveal: boolean, value: number, suffix = ''): React.ReactNode {
  if (!reveal) {
    return (
      <span className="inline-block blur-[6px] select-none tabular-nums text-zinc-900">
        ••••{suffix}
      </span>
    );
  }
  return (
    <span className="tabular-nums text-zinc-900">
      {value}
      {suffix}
    </span>
  );
}

function maskEuro(reveal: boolean, value: number): React.ReactNode {
  if (!reveal) {
    return (
      <span className="inline-block blur-[6px] select-none tabular-nums text-zinc-900">•••• €</span>
    );
  }
  return (
    <span className="tabular-nums text-zinc-900">
      {new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'EUR',
        maximumFractionDigits: 0,
      }).format(value)}
    </span>
  );
}

/** Carte : cercles proportionnels au nombre de studios (position = moyenne lat/lng par ville). */
function GeographyMap(props: {
  data: FounderMetricsPayload['growth']['geography'];
}): React.ReactElement | null {
  const points = props.data.filter((d) => d.lat != null && d.lng != null).slice(0, 40);
  if (points.length === 0) {
    return (
      <p className="text-sm text-zinc-500">
        Pas assez de coordonnées agrégées — positions studio optionnelles en base.
      </p>
    );
  }
  return (
    <div className="h-[220px] sm:h-[280px] w-full overflow-hidden rounded-xl border border-zinc-200">
      <MapContainer
        center={[46.5, 2.5]}
        zoom={5.5}
        className="h-full w-full"
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {points.map((p) => (
          <CircleMarker
            key={p.city}
            center={[p.lat as number, p.lng as number]}
            radius={Math.min(36, 6 + p.studioCount * 3)}
            pathOptions={{ color: ACCENT, fillColor: ACCENT, fillOpacity: 0.35 }}
          >
            <Popup>
              <span className="font-semibold">{p.city}</span>
              <br />
              {p.studioCount} studio{p.studioCount > 1 ? 's' : ''} (agrégé)
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
}

export interface FounderDashboardPageProps {
  /** Segment d’URL `/admin/:section` — absent sur `/admin` (vue complète). */
  section?: string;
}

export const FounderDashboardPage: React.FC<FounderDashboardPageProps> = ({ section }) => {
  const { user, logout } = useAuth();
  const allowed = isFounderAllowlistedEmail(user?.email);
  const viteListConfigured = isFounderClientAllowlistConfigured();
  const [revealSensitive, setRevealSensitive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  /** Refus côté Edge (liste serveur ou e-mail différent de la session). */
  const [serverAccessIssue, setServerAccessIssue] = useState<
    null | 'forbidden' | 'server_env_missing' | 'email_unverified'
  >(null);
  const [data, setData] = useState<FounderMetricsPayload | null>(null);
  const [adminPeriod, setAdminPeriod] = useState<'7j' | '30j' | '90j' | '12m'>('30j');

  const load = useCallback(async () => {
    if (!allowed) {
      setLoading(false);
      return;
    }
    setError(null);
    setServerAccessIssue(null);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) {
        setError('Session expirée — reconnecte-toi.');
        return;
      }
      const payload = await fetchFounderMetrics(token);
      setData(payload);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.includes('FOUNDER_ADMIN_EMAILS not configured')) {
        setServerAccessIssue('server_env_missing');
      } else if (msg.includes('Email verification required')) {
        setServerAccessIssue('email_unverified');
      } else if (/forbidden/i.test(msg)) {
        setServerAccessIssue('forbidden');
      } else {
        setError(msg || 'Erreur de chargement');
      }
    } finally {
      setLoading(false);
    }
  }, [allowed]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!allowed) return;
    const t = window.setInterval(() => void load(), REFRESH_MS);
    return () => window.clearInterval(t);
  }, [allowed, load]);

  useEffect(() => {
    if (!allowed || !data) return;
    const ch = supabase
      .channel('founder-admin-refresh')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'inkflow_bookings' },
        () => void load()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'inkflow_studios' },
        () => void load()
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(ch);
    };
  }, [allowed, data, load]);

  const sectionSlug =
    section != null && section !== '' && isFounderAdminSlug(section) ? section : undefined;

  useEffect(() => {
    if (section == null || section === '') return;
    if (!isFounderAdminSlug(section)) {
      window.history.replaceState({}, '', '/admin');
      window.dispatchEvent(new Event('inkflow-navigate'));
    }
  }, [section]);

  const navMeta = sectionSlug ? getFounderNavMeta(sectionSlug) : null;
  const activeNavPath = sectionSlug ? `/admin/${sectionSlug}` : '/admin';
  const showBlock = (slug: FounderAdminSlug) => !sectionSlug || sectionSlug === slug;
  /** Bloc « comprendre » : acomptes + où regarder les logs — rattaché à la vue d’ensemble. */
  const showEcosystemOps = !sectionSlug || sectionSlug === 'vue-ensemble';

  if (!user) {
    return (
      <div
        className="founder-admin-scroll-root flex flex-col items-center justify-center gap-4 px-4"
        style={{ backgroundColor: BRAND_BG }}
      >
        <Loader2 className="w-10 h-10 animate-spin text-zinc-500" aria-label="Chargement" />
        <p className="text-sm text-zinc-500">Connexion…</p>
      </div>
    );
  }

  if (!allowed) {
    return (
      <div
        className="founder-admin-scroll-root flex items-center justify-center px-4 py-10"
        style={{ backgroundColor: BRAND_BG }}
      >
        <SEO title="Accès refusé" noindex canonical="/admin" />
        <div className="max-w-lg w-full space-y-4 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 sm:p-8">
          <LayoutDashboard className="w-10 h-10 text-zinc-600" aria-hidden />
          <h1 className="text-xl font-bold text-zinc-100 font-display">
            Espace fondateur — accès refusé
          </h1>
          <p className="text-sm text-zinc-400 leading-relaxed">
            Ton compte connecté doit être autorisé côté application. Variable{' '}
            <code className="text-xs text-amber-200/90 bg-zinc-950 px-1.5 py-0.5 rounded">
              VITE_FOUNDER_ADMIN_EMAILS
            </code>{' '}
            ({viteListConfigured ? 'déjà renseignée' : 'non renseignée en build'}).
          </p>
          <div className="rounded-xl border border-zinc-700/80 bg-black/30 px-4 py-3 text-left text-sm">
            <p className="text-zinc-500 text-xs uppercase tracking-wide mb-1">E-mail de session</p>
            <p className="font-mono text-zinc-100 break-all">{user.email ?? '—'}</p>
          </div>
          <ol className="list-decimal list-inside text-sm text-zinc-400 space-y-2 leading-relaxed">
            <li>
              Dans <code className="text-xs text-zinc-500">.env.local</code> (local) ou les
              variables Vercel (prod), ajoute <strong className="text-zinc-300">exactement</strong>{' '}
              l’e-mail ci-dessus :{' '}
              <code className="text-xs break-all text-amber-100/90">
                VITE_FOUNDER_ADMIN_EMAILS={user.email ?? 'toi@domaine.com'}
              </code>
            </li>
            <li>
              Sur Supabase → Edge Functions → Secrets, même liste dans{' '}
              <code className="text-xs text-zinc-500">FOUNDER_ADMIN_EMAILS</code> (séparés par des
              virgules si plusieurs).
            </li>
            <li>
              Redémarre le serveur de dev ou redéploie le front après changement des variables Vite.
            </li>
          </ol>
          <p className="text-xs text-zinc-600">
            Astuce : si tu ne mets pas{' '}
            <code className="text-zinc-500">VITE_FOUNDER_ADMIN_EMAILS</code>, l’app laisse passer la
            requête et c’est uniquement le secret Supabase qui autorise — pratique si le front n’a
            pas encore la variable en production.
          </p>
        </div>
      </div>
    );
  }

  const seoPath = sectionSlug ? `/admin/${sectionSlug}` : '/admin';
  const seoTitle = navMeta ? `${navMeta.pageTitle} — Admin InkFlow` : 'Founder — monitoring';

  return (
    <>
      <SEO
        title={seoTitle}
        description={
          navMeta?.pageSubtitle ?? 'Tableau de bord interne InkFlow — MRR SaaS, studios, activité'
        }
        noindex
        canonical={seoPath}
      />
      <AdminShell
        userDisplayName={user.name || user.email?.split('@')[0] || 'Admin'}
        userEmail={user.email ?? ''}
        activeNavPath={activeNavPath}
        pageTitle={navMeta?.pageTitle ?? 'Monitoring produit'}
        pageSubtitle={
          navMeta?.pageSubtitle ??
          'MRR = abonnements SaaS InkFlow · pas les revenus tatoueurs · Paris · MAJ 5 min'
        }
        onLogout={logout}
        actions={
          <>
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700 transition-all hover:bg-zinc-50 active:scale-[0.98]"
            >
              <FileText className="h-4 w-4" aria-hidden />
              PDF
            </button>
            <button
              type="button"
              onClick={() => setRevealSensitive((v) => !v)}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700 transition-all hover:bg-zinc-50 active:scale-[0.98]"
            >
              {revealSensitive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              {revealSensitive ? 'Masquer' : 'Afficher'} montants
            </button>
            <button
              type="button"
              onClick={() => void load()}
              disabled={loading}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-zinc-900 px-3 py-2 text-sm font-semibold text-white transition-all hover:bg-zinc-800 active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Rafraîchir
            </button>
            <button
              type="button"
              onClick={() => {
                window.history.pushState({}, '', '/dashboard');
                window.dispatchEvent(new Event('inkflow-navigate'));
              }}
              className="min-h-[44px] px-2 text-sm text-zinc-500 hover:text-zinc-800"
            >
              Dashboard studio
            </button>
          </>
        }
      >
        <div className="space-y-6 sm:space-y-8">
          {error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
              {error}
            </div>
          ) : null}

          {!loading && serverAccessIssue ? (
            <div className="space-y-3 rounded-2xl border border-amber-200 bg-amber-50/90 px-4 py-5 text-sm text-amber-950 sm:px-6">
              {serverAccessIssue === 'server_env_missing' ? (
                <>
                  <p className="font-semibold text-amber-950">Secret Supabase manquant</p>
                  <p className="leading-relaxed text-amber-900/90">
                    Définis{' '}
                    <code className="rounded bg-amber-100/80 px-1.5 py-0.5 text-xs">
                      FOUNDER_ADMIN_EMAILS
                    </code>{' '}
                    sur le projet Supabase (Edge Functions → Secrets), avec ton e-mail de connexion,
                    puis redéploie ou réessaie.
                  </p>
                </>
              ) : null}
              {serverAccessIssue === 'email_unverified' ? (
                <>
                  <p className="font-semibold text-amber-950">E-mail non confirmé</p>
                  <p className="leading-relaxed text-amber-900/90">
                    Confirme ton adresse e-mail dans le message envoyé par Supabase, puis recharge
                    cette page.
                  </p>
                </>
              ) : null}
              {serverAccessIssue === 'forbidden' ? (
                <>
                  <p className="font-semibold text-amber-950">Refus côté serveur (403)</p>
                  <p className="leading-relaxed text-amber-900/90">
                    L’e-mail de ta session n’est pas dans{' '}
                    <code className="rounded bg-amber-100/80 px-1.5 py-0.5 text-xs">
                      FOUNDER_ADMIN_EMAILS
                    </code>{' '}
                    sur Supabase, ou ne correspond pas exactement (même compte que{' '}
                    <span className="font-mono text-amber-950">{user.email}</span>).
                  </p>
                  <p className="text-xs text-amber-800/90">
                    Vérifie aussi Google / magic link : l’e-mail doit être le même que dans le
                    secret.
                  </p>
                </>
              ) : null}
              <button
                type="button"
                onClick={() => void load()}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-amber-800 px-4 py-2 text-sm font-semibold text-white active:scale-[0.98]"
              >
                <RefreshCw className="w-4 h-4" />
                Réessayer
              </button>
            </div>
          ) : null}

          {loading && !data ? (
            <div className="flex justify-center py-24">
              <Loader2 className="w-10 h-10 animate-spin text-zinc-500" aria-label="Chargement" />
            </div>
          ) : null}

          {data && !serverAccessIssue ? (
            <>
              {sectionSlug ? (
                <div className="founder-admin-no-print space-y-4">
                  <div className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-600 shadow-sm">
                    <a
                      href="/admin"
                      className="font-medium text-zinc-800 underline-offset-2 hover:text-zinc-950 hover:underline"
                    >
                      ← Tableau de bord complet
                    </a>
                    <span className="text-zinc-500"> — toutes les sections sur une seule page</span>
                  </div>
                  <FounderAdminSectionExplainer slug={sectionSlug} />
                </div>
              ) : null}

              {/* Récap PDF (visible uniquement à l’impression) — toujours présent pour que PDF / Imprimer ne soit pas vide */}
              <div className="founder-print-only text-black space-y-3 pb-4 mb-4 border-b border-zinc-300">
                <h1 className="text-2xl font-bold font-display">InkFlow — rapport fondateur</h1>
                {sectionSlug && navMeta ? (
                  <p className="text-sm font-medium text-zinc-800">
                    Vue exportée : {navMeta.pageTitle}
                  </p>
                ) : null}
                <p className="text-sm text-zinc-600">
                  Généré :{' '}
                  {new Date(data.generatedAt).toLocaleString('fr-FR', { timeZone: 'Europe/Paris' })}{' '}
                  · Données agrégées, sans e-mails clients.
                </p>
                <ul className="list-inside list-disc space-y-1 text-sm">
                  <li>Comptes utilisateurs (auth) : {formatAuthUsers(data.kpis.totalAuthUsers)}</li>
                  <li>Studios inscrits : {data.kpis.totalStudios}</li>
                  <li>
                    Abonnements actifs / essai : {data.kpis.subscribedActive} /{' '}
                    {data.kpis.subscribedTrialing}
                  </li>
                  <li>
                    MRR InkFlow estimé :{' '}
                    {revealSensitive
                      ? `${data.kpis.mrrEstimatedEur} €`
                      : '•••• (activer « Afficher montants » avant impression)'}
                  </li>
                  <li>Fiches CRM (total) : {data.kpis.crmClientsTotal}</li>
                  <li>Paiements refusés en base (mois) : {data.health.paymentsFailedMonth}</li>
                  <li>Studios onboarding bloqué (&gt;7j) : {data.alerts.studiosStuckOnboarding}</li>
                </ul>
              </div>

              {showBlock('vue-ensemble') ? (
                <div
                  id="founder-overview"
                  className="founder-admin-light rounded-2xl p-4 sm:p-6"
                  style={{ backgroundColor: 'var(--admin-bg)' }}
                >
                  <FounderAdminOverview
                    data={data}
                    revealSensitive={revealSensitive}
                    period={adminPeriod}
                    onPeriodChange={setAdminPeriod}
                  />
                </div>
              ) : null}

              {/* Revenus SaaS InkFlow */}
              {showBlock('revenus-saas') ? (
                <section aria-labelledby="founder-saas" className="space-y-3">
                  <h2
                    id="founder-saas"
                    className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-zinc-700"
                  >
                    <Sparkles className="h-4 w-4 shrink-0 text-zinc-600" aria-hidden />
                    Tes revenus InkFlow (abonnements SaaS)
                  </h2>
                  <p className="max-w-3xl text-xs leading-relaxed text-zinc-600">
                    Montants basés sur les plans actifs en base (tarifs configurables via secrets
                    Edge). Ce n’est pas ce que les tatoueurs facturent à leurs clients.
                  </p>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
                    <FounderKpiCard
                      label="MRR estimé (SaaS)"
                      icon={<Wallet className="h-4 w-4 text-zinc-600" aria-hidden />}
                      sub="Somme des abonnements studio actifs + essai"
                      minHeightClass="min-h-[128px]"
                      valueIsZero={revealSensitive && data.kpis.mrrEstimatedEur === 0}
                      onExportCsv={() =>
                        downloadCsv(
                          'founder-kpi-mrr.csv',
                          ['metric', 'value'],
                          [['mrr_saas_eur', data.kpis.mrrEstimatedEur]]
                        )
                      }
                    >
                      {maskEuro(revealSensitive, data.kpis.mrrEstimatedEur)}
                    </FounderKpiCard>
                    <FounderKpiCard
                      label="ARR indicatif"
                      icon={<TrendingUp className="h-4 w-4 text-zinc-600" aria-hidden />}
                      sub="MRR × 12 (projection)"
                      minHeightClass="min-h-[128px]"
                      valueIsZero={revealSensitive && data.kpis.mrrEstimatedEur * 12 === 0}
                      onExportCsv={() =>
                        downloadCsv(
                          'founder-kpi-arr.csv',
                          ['metric', 'value'],
                          [['arr_indicatif_eur', data.kpis.mrrEstimatedEur * 12]]
                        )
                      }
                    >
                      {revealSensitive ? (
                        <span className="tabular-nums">
                          {new Intl.NumberFormat('fr-FR', {
                            maximumFractionDigits: 0,
                          }).format(data.kpis.mrrEstimatedEur * 12)}{' '}
                          €
                        </span>
                      ) : (
                        <span className="inline-block select-none blur-[6px] tabular-nums">
                          •••• €
                        </span>
                      )}
                    </FounderKpiCard>
                    <FounderKpiCard
                      label="Studios en abonnement actif"
                      icon={<CreditCard className="h-4 w-4 text-zinc-500" aria-hidden />}
                      sub="Stripe / statut active"
                      minHeightClass="min-h-[128px]"
                      valueIsZero={data.kpis.subscribedActive === 0}
                      onExportCsv={() =>
                        downloadCsv(
                          'founder-kpi-abo-actifs.csv',
                          ['metric', 'value'],
                          [['studios_abonnement_actif', data.kpis.subscribedActive]]
                        )
                      }
                    >
                      <span className="tabular-nums">{data.kpis.subscribedActive}</span>
                    </FounderKpiCard>
                    <FounderKpiCard
                      label="En période d’essai"
                      icon={<Activity className="h-4 w-4 text-zinc-500" aria-hidden />}
                      sub="Trialing"
                      minHeightClass="min-h-[128px]"
                      valueIsZero={data.kpis.subscribedTrialing === 0}
                      onExportCsv={() =>
                        downloadCsv(
                          'founder-kpi-trialing.csv',
                          ['metric', 'value'],
                          [['studios_trialing', data.kpis.subscribedTrialing]]
                        )
                      }
                    >
                      <span className="tabular-nums">{data.kpis.subscribedTrialing}</span>
                    </FounderKpiCard>
                  </div>
                </section>
              ) : null}

              {/* Base utilisateurs */}
              {showBlock('utilisateurs') ? (
                <section aria-labelledby="founder-users" className="space-y-3">
                  <h2
                    id="founder-users"
                    className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-zinc-700"
                  >
                    <Users className="h-4 w-4 shrink-0 text-zinc-600" aria-hidden />
                    Utilisateurs & base studio
                  </h2>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
                    <FounderKpiCard
                      label="Comptes (auth Supabase)"
                      sub={
                        data.kpis.totalAuthUsers < 0
                          ? 'Erreur listUsers — voir logs Edge'
                          : 'Inclut équipe + tatoueurs'
                      }
                      valueIsZero={data.kpis.totalAuthUsers === 0}
                      onExportCsv={() =>
                        downloadCsv(
                          'founder-kpi-auth-users.csv',
                          ['metric', 'value'],
                          [
                            [
                              'comptes_auth',
                              data.kpis.totalAuthUsers < 0 ? 'erreur' : data.kpis.totalAuthUsers,
                            ],
                          ]
                        )
                      }
                    >
                      <span className={data.kpis.totalAuthUsers < 0 ? 'text-amber-700' : undefined}>
                        {formatAuthUsers(data.kpis.totalAuthUsers)}
                      </span>
                    </FounderKpiCard>
                    <FounderKpiCard
                      label="Studios inscrits"
                      icon={<Building2 className="h-4 w-4 text-zinc-500" aria-hidden />}
                      sub="inkflow_studios"
                      valueIsZero={data.kpis.totalStudios === 0}
                      onExportCsv={() =>
                        downloadCsv(
                          'founder-kpi-studios-total.csv',
                          ['metric', 'value'],
                          [['studios_total', data.kpis.totalStudios]]
                        )
                      }
                    >
                      <span className="tabular-nums">{data.kpis.totalStudios}</span>
                    </FounderKpiCard>
                    <FounderKpiCard
                      label="Fiches CRM (total)"
                      sub="Clients enregistrés par les studios"
                      valueIsZero={data.kpis.crmClientsTotal === 0}
                      onExportCsv={() =>
                        downloadCsv(
                          'founder-kpi-crm-clients.csv',
                          ['metric', 'value'],
                          [['crm_clients_total', data.kpis.crmClientsTotal]]
                        )
                      }
                    >
                      <span className="tabular-nums">{data.kpis.crmClientsTotal}</span>
                    </FounderKpiCard>
                    <FounderKpiCard
                      label="Studios actifs (7j)"
                      sub="Bookings, RDV ou maj studio"
                      valueIsZero={data.kpis.studiosActive7d === 0}
                      onExportCsv={() =>
                        downloadCsv(
                          'founder-kpi-studios-actifs.csv',
                          ['metric', 'value'],
                          [['studios_actifs_7j', data.kpis.studiosActive7d]]
                        )
                      }
                    >
                      <span className="tabular-nums">{data.kpis.studiosActive7d}</span>
                    </FounderKpiCard>
                  </div>
                </section>
              ) : null}

              {/* Santé paiements */}
              {showBlock('sante-paiements') ? (
                <section aria-labelledby="founder-health" className="space-y-3">
                  <h2
                    id="founder-health"
                    className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-zinc-700"
                  >
                    <HeartPulse className="h-4 w-4 shrink-0 text-rose-600" aria-hidden />
                    Santé des paiements (base InkFlow)
                  </h2>
                  <p className="max-w-3xl text-xs leading-relaxed text-zinc-600">
                    Complète les alertes produit ci-dessous. Les erreurs Stripe / code sont surtout
                    dans les logs (Supabase Edge, Sentry, Stripe Dashboard).
                  </p>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <FounderKpiCard
                      label="Paiements échoués (mois)"
                      variant="rose"
                      valueIsZero={data.health.paymentsFailedMonth === 0}
                      onExportCsv={() =>
                        downloadCsv(
                          'founder-health-failed.csv',
                          ['metric', 'value'],
                          [['payments_failed_month', data.health.paymentsFailedMonth]]
                        )
                      }
                    >
                      <span className="tabular-nums">{data.health.paymentsFailedMonth}</span>
                    </FounderKpiCard>
                    <FounderKpiCard
                      label="Paiements « pending » > 7 jours"
                      variant="amber"
                      valueIsZero={data.health.paymentsPendingStale7d === 0}
                      onExportCsv={() =>
                        downloadCsv(
                          'founder-health-pending-stale.csv',
                          ['metric', 'value'],
                          [['payments_pending_stale_7d', data.health.paymentsPendingStale7d]]
                        )
                      }
                    >
                      <span className="tabular-nums">{data.health.paymentsPendingStale7d}</span>
                    </FounderKpiCard>
                  </div>
                </section>
              ) : null}

              {/* Volume plateforme */}
              {showBlock('volume') ? (
                <section aria-labelledby="founder-volume" className="space-y-3">
                  <h2
                    id="founder-volume"
                    className="text-sm font-semibold uppercase tracking-wide text-zinc-700"
                  >
                    Volume plateforme (usage)
                  </h2>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
                    <FounderKpiCard
                      label="Bookings créés (30 j)"
                      minHeightClass="min-h-[100px]"
                      valueIsZero={data.kpis.bookingsCreated30d === 0}
                      onExportCsv={() =>
                        downloadCsv(
                          'founder-kpi-bookings-30j.csv',
                          ['metric', 'value'],
                          [['bookings_30j', data.kpis.bookingsCreated30d]]
                        )
                      }
                    >
                      <span className="tabular-nums">{data.kpis.bookingsCreated30d}</span>
                    </FounderKpiCard>
                    <FounderKpiCard
                      label="Bookings créés aujourd’hui"
                      sub="(minuit → fin de jour, Paris)"
                      minHeightClass="min-h-[100px]"
                      valueIsZero={data.kpis.bookingsTodayParis === 0}
                      onExportCsv={() =>
                        downloadCsv(
                          'founder-kpi-bookings-jour.csv',
                          ['metric', 'value'],
                          [['bookings_aujourdhui_paris', data.kpis.bookingsTodayParis]]
                        )
                      }
                    >
                      <span className="tabular-nums">{data.kpis.bookingsTodayParis}</span>
                    </FounderKpiCard>
                  </div>
                </section>
              ) : null}

              {/* Écosystème : argent clients → studios (pas ton MRR) */}
              {showEcosystemOps ? (
                <>
                  <details className="group rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-5">
                    <summary className="flex min-h-[44px] cursor-pointer list-none items-center justify-between gap-2 text-sm font-medium text-zinc-800">
                      <span>Écosystème — acomptes clients (argent vers les studios)</span>
                      <span className="text-xs text-zinc-500 group-open:hidden">Afficher</span>
                      <span className="hidden text-xs text-zinc-500 group-open:inline">
                        Masquer
                      </span>
                    </summary>
                    <p className="mb-4 mt-2 max-w-2xl text-xs leading-relaxed text-zinc-600">
                      Volume d’acomptes encaissés ce mois via InkFlow. Ce n’est pas ton chiffre
                      d’affaires SaaS : c’est du cash qui transite vers les tatoueurs.
                    </p>
                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-zinc-50/80 p-4">
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-zinc-600">
                          Total acomptes (mois en cours)
                        </p>
                        <p
                          className={cn(
                            'mt-1 text-2xl font-bold tabular-nums',
                            revealSensitive &&
                              data.kpis.depositsMonthEur === 0 &&
                              'font-semibold text-zinc-400 [&_span]:text-zinc-400'
                          )}
                        >
                          {maskEuro(revealSensitive, data.kpis.depositsMonthEur)}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          downloadCsv(
                            'founder-kpi-acomptes-mois.csv',
                            ['metric', 'value'],
                            [['acomptes_mois_eur', data.kpis.depositsMonthEur]]
                          )
                        }
                        className="founder-admin-no-print inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-zinc-200 px-3 py-2 text-xs font-medium text-zinc-700 transition-all hover:bg-white active:scale-[0.98]"
                      >
                        <Download className="h-3.5 w-3.5" aria-hidden />
                        CSV
                      </button>
                    </div>
                  </details>

                  {/* Outils & logs (pas de données live ici) */}
                  <section
                    aria-labelledby="founder-ops"
                    className="space-y-3 rounded-2xl border border-zinc-200 bg-zinc-50/90 p-4 sm:p-5"
                  >
                    <h2
                      id="founder-ops"
                      className="flex items-center gap-2 text-sm font-semibold text-zinc-800"
                    >
                      <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" aria-hidden />
                      Erreurs code, Stripe, blocages — où regarder
                    </h2>
                    <ul className="space-y-2 text-sm leading-relaxed text-zinc-700">
                      <li>
                        <a
                          href="https://supabase.com/dashboard"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 font-medium text-amber-800 underline-offset-2 hover:underline"
                        >
                          Supabase Dashboard{' '}
                          <ExternalLink className="h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden />
                        </a>{' '}
                        → Logs Edge Functions (`stripe-webhook`, etc.), Auth, base.
                      </li>
                      <li>
                        <a
                          href="https://sentry.io"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 font-medium text-amber-800 underline-offset-2 hover:underline"
                        >
                          Sentry{' '}
                          <ExternalLink className="h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden />
                        </a>{' '}
                        — erreurs front (`ErrorBoundary`) et Edge (`stripe-webhook`) si DSN
                        configuré.
                      </li>
                      <li>
                        Dashboard Stripe — paiements Connect & abonnements SaaS (projet InkFlow).
                      </li>
                      <li className="text-xs text-zinc-600">{data.alerts.suspiciousAuthNote}</li>
                    </ul>
                  </section>
                </>
              ) : null}

              {/* ROW 2 — graphiques (masqués à l’impression) */}
              {showBlock('graphiques') ? (
                <div
                  id="founder-charts"
                  className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 founder-print-hide scroll-mt-24"
                >
                  <WidgetShell
                    title="Nouveaux inscrits — 30 derniers jours"
                    subtitle="Studios créés par jour (Europe/Paris)"
                    onExportCsv={() =>
                      downloadCsv(
                        'founder-signups-30j.csv',
                        ['date', 'count'],
                        data.activity.signupsByDay.map((r) => [r.date, r.count])
                      )
                    }
                  >
                    <div className="h-[220px] sm:h-[260px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data.activity.signupsByDay}>
                          <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID_STROKE} />
                          <XAxis
                            dataKey="date"
                            tick={{ fill: '#71717a', fontSize: 10 }}
                            interval={4}
                          />
                          <YAxis tick={{ fill: '#71717a', fontSize: 11 }} allowDecimals={false} />
                          <RechartsTooltip {...RECHARTS_TOOLTIP_LIGHT} />
                          <Line
                            type="monotone"
                            dataKey="count"
                            stroke={ACCENT}
                            strokeWidth={2}
                            dot={false}
                            name="Inscriptions"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </WidgetShell>

                  <WidgetShell
                    title="Activation onboarding"
                    subtitle="Studios ayant atteint l’étape ≥ 3 vs total studios (user_settings)"
                    onExportCsv={() =>
                      downloadCsv(
                        'founder-onboarding.csv',
                        ['segment', 'count'],
                        data.activity.onboardingStepDistribution.map((r) => [r.step, r.count])
                      )
                    }
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                      <div className="text-4xl font-bold tabular-nums" style={{ color: ACCENT }}>
                        {data.activity.onboardingActivationRate}%
                      </div>
                      <p className="flex-1 text-sm text-zinc-600">
                        Taux d’activation (étape 3+) calculé sur le total des studios. Détail par
                        segment ci-dessous (export CSV).
                      </p>
                    </div>
                    <div className="mt-4 h-[160px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data.activity.onboardingStepDistribution} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID_STROKE} />
                          <XAxis type="number" tick={{ fill: '#71717a' }} allowDecimals={false} />
                          <YAxis
                            type="category"
                            dataKey="step"
                            width={100}
                            tick={{ fill: '#71717a', fontSize: 11 }}
                          />
                          <RechartsTooltip {...RECHARTS_TOOLTIP_LIGHT} />
                          <Bar dataKey="count" fill={ACCENT} radius={[0, 6, 6, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </WidgetShell>

                  <WidgetShell
                    title="Demandes projets par statut"
                    onExportCsv={() =>
                      downloadCsv(
                        'founder-project-status.csv',
                        ['status', 'count'],
                        data.activity.projectRequestsByStatus.map((r) => [r.status, r.count])
                      )
                    }
                  >
                    <div className="h-[260px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={
                              data.activity.projectRequestsByStatus as {
                                status: string;
                                count: number;
                              }[]
                            }
                            dataKey="count"
                            nameKey="status"
                            innerRadius={48}
                            outerRadius={88}
                            paddingAngle={2}
                          >
                            {data.activity.projectRequestsByStatus.map((_, i) => (
                              <Cell key={String(i)} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                            ))}
                          </Pie>
                          <RechartsTooltip {...RECHARTS_TOOLTIP_LIGHT} />
                          <Legend wrapperStyle={{ fontSize: 11, color: '#52525b' }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </WidgetShell>

                  <WidgetShell
                    title="Taux d’acceptation projets"
                    subtitle="Acceptés ÷ (acceptés + refusés)"
                    onExportCsv={() =>
                      downloadCsv(
                        'founder-project-acceptance.csv',
                        ['metric', 'value'],
                        [['taux_acceptation_pct', data.activity.projectAcceptanceRate ?? '']]
                      )
                    }
                  >
                    <div className="flex flex-col justify-center min-h-[180px]">
                      <p className="text-5xl font-bold tabular-nums" style={{ color: ACCENT }}>
                        {data.activity.projectAcceptanceRate == null
                          ? '—'
                          : `${data.activity.projectAcceptanceRate}%`}
                      </p>
                      <p className="text-sm text-zinc-500 mt-3 flex items-start gap-2">
                        <TrendingUp className="w-4 h-4 shrink-0 mt-0.5 opacity-70" aria-hidden />
                        Généré à{' '}
                        {new Date(data.generatedAt).toLocaleString('fr-FR', {
                          timeZone: 'Europe/Paris',
                        })}{' '}
                        — agrégats uniquement.
                      </p>
                    </div>
                  </WidgetShell>
                </div>
              ) : null}

              {/* ROW 3 */}
              {showBlock('alertes') ? (
                <WidgetShell
                  id="founder-alerts"
                  title="Alertes"
                  subtitle="Comptages internes — pas d’emails ou noms clients affichés"
                  onExportCsv={() =>
                    downloadCsv(
                      'founder-alertes.csv',
                      ['alert', 'count_or_note'],
                      [
                        ['studios_bloques_onboarding', data.alerts.studiosStuckOnboarding],
                        ['acomptes_impayes_plus_48h', data.alerts.unpaidDepositsOver48h],
                        ['studios_inactifs_14j', data.alerts.studiosInactive14d],
                        ['studios_sans_flash_plus_48h', data.alerts.studiosNoFlashAfter48h],
                        ['studios_sans_stripe_plus_72h', data.alerts.studiosNoStripeAfter72h],
                        ['note_auth', data.alerts.suspiciousAuthNote],
                      ]
                    )
                  }
                >
                  <ul className="grid gap-3 text-sm sm:grid-cols-2">
                    <li className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50/90 px-4 py-3">
                      <AlertTriangle
                        className="mt-0.5 h-5 w-5 shrink-0 text-amber-600"
                        aria-hidden
                      />
                      <span className="text-zinc-700">
                        <strong className="font-semibold text-amber-900">Onboarding bloqué</strong>
                        <br />
                        <span
                          className={cn(
                            'tabular-nums text-lg font-semibold',
                            data.alerts.studiosStuckOnboarding === 0
                              ? 'text-zinc-400'
                              : 'text-zinc-900'
                          )}
                        >
                          {data.alerts.studiosStuckOnboarding}
                        </span>{' '}
                        studios inscrits depuis &gt; 7j sans étape 3
                      </span>
                    </li>
                    <li className="flex gap-3 rounded-xl border border-red-200 bg-red-50/90 px-4 py-3">
                      <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" aria-hidden />
                      <span className="text-zinc-700">
                        <strong className="font-semibold text-red-900">Acomptes &gt; 48h</strong>
                        <br />
                        <span
                          className={cn(
                            'tabular-nums text-lg font-semibold',
                            data.alerts.unpaidDepositsOver48h === 0
                              ? 'text-zinc-400'
                              : 'text-zinc-900'
                          )}
                        >
                          {data.alerts.unpaidDepositsOver48h}
                        </span>{' '}
                        RDV pending/confirmés, acompte non payé
                      </span>
                    </li>
                    <li className="flex gap-3 rounded-xl border border-amber-200 bg-white px-4 py-3">
                      <AlertTriangle
                        className="mt-0.5 h-5 w-5 shrink-0 text-amber-600"
                        aria-hidden
                      />
                      <span className="text-zinc-700">
                        <strong className="font-semibold text-zinc-900">Sans flash &gt; 48h</strong>{' '}
                        (cohorte 365j)
                        <br />
                        <span
                          className={cn(
                            'tabular-nums text-lg font-semibold',
                            data.alerts.studiosNoFlashAfter48h === 0
                              ? 'text-zinc-400'
                              : 'text-zinc-900'
                          )}
                        >
                          {data.alerts.studiosNoFlashAfter48h}
                        </span>{' '}
                        studios encore sans design publié
                      </span>
                    </li>
                    <li className="flex gap-3 rounded-xl border border-amber-200 bg-white px-4 py-3">
                      <AlertTriangle
                        className="mt-0.5 h-5 w-5 shrink-0 text-amber-600"
                        aria-hidden
                      />
                      <span className="text-zinc-700">
                        <strong className="font-semibold text-zinc-900">
                          Stripe pas prêt &gt; 72h
                        </strong>{' '}
                        (cohorte 365j)
                        <br />
                        <span
                          className={cn(
                            'tabular-nums text-lg font-semibold',
                            data.alerts.studiosNoStripeAfter72h === 0
                              ? 'text-zinc-400'
                              : 'text-zinc-900'
                          )}
                        >
                          {data.alerts.studiosNoStripeAfter72h}
                        </span>{' '}
                        compte ou charges inactives
                      </span>
                    </li>
                    <li className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 sm:col-span-2">
                      <p className="text-xs leading-relaxed text-zinc-600">
                        {data.alerts.suspiciousAuthNote}
                      </p>
                    </li>
                    <li className="flex gap-3 rounded-xl border border-zinc-200 bg-white px-4 py-3 sm:col-span-2">
                      <BarChart3 className="h-5 w-5 shrink-0 text-zinc-500" aria-hidden />
                      <span className="text-zinc-700">
                        <strong className="font-semibold text-zinc-900">
                          Studios inactifs 14j
                        </strong>{' '}
                        (updated_at){' '}
                        <span
                          className={cn(
                            'tabular-nums font-semibold',
                            data.alerts.studiosInactive14d === 0 ? 'text-zinc-400' : 'text-zinc-900'
                          )}
                        >
                          {data.alerts.studiosInactive14d}
                        </span>
                      </span>
                    </li>
                  </ul>
                </WidgetShell>
              ) : null}

              {/* ROW 4 — rangées relatif / cartes (masqué à l’impression) */}
              {showBlock('croissance') ? (
                <div
                  id="founder-growth"
                  className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 founder-print-hide scroll-mt-24"
                >
                  <WidgetShell
                    title="Churn (mois en cours)"
                    subtitle="Abonnements marqués annulés (maj ce mois)"
                    onExportCsv={() =>
                      downloadCsv(
                        'founder-churn.csv',
                        ['metric', 'value'],
                        [['churn_subscriptions_mois', data.growth.churnSubscriptionsMonth]]
                      )
                    }
                  >
                    <p
                      className={cn(
                        'text-3xl font-bold tabular-nums',
                        data.growth.churnSubscriptionsMonth === 0
                          ? 'font-semibold text-zinc-400'
                          : 'text-zinc-900'
                      )}
                    >
                      {data.growth.churnSubscriptionsMonth}
                    </p>
                  </WidgetShell>

                  <WidgetShell
                    title="Plans studio (snapshots plan_type)"
                    subtitle="Basic / Pro / Studio — répartition actuelle"
                    onExportCsv={() =>
                      downloadCsv(
                        'founder-plans.csv',
                        ['plan', 'studios'],
                        data.growth.planDistribution.map((r) => [r.plan, r.count])
                      )
                    }
                  >
                    <div className="h-[200px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data.growth.planDistribution}>
                          <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID_STROKE} />
                          <XAxis dataKey="plan" tick={{ fill: '#71717a', fontSize: 11 }} />
                          <YAxis tick={{ fill: '#71717a' }} allowDecimals={false} />
                          <RechartsTooltip {...RECHARTS_TOOLTIP_LIGHT} />
                          <Bar dataKey="count" fill="#52525b" radius={[6, 6, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </WidgetShell>

                  <WidgetShell
                    title="Top studios (bookings 30j)"
                    subtitle="Identifiants publics : slug uniquement"
                    onExportCsv={() =>
                      downloadCsv(
                        'founder-top-studios.csv',
                        ['studio_id', 'slug_public', 'bookings_30j'],
                        data.growth.topStudios.map((r) => [r.studioId, r.slug, r.bookings30d])
                      )
                    }
                  >
                    <ul className="max-h-[220px] space-y-2 overflow-y-auto pr-1 text-sm">
                      {data.growth.topStudios.map((r, i) => (
                        <li
                          key={r.studioId}
                          className="flex justify-between gap-2 border-b border-zinc-100 pb-2 last:border-0"
                        >
                          <span className="w-6 text-zinc-500">{i + 1}.</span>
                          <span className="truncate font-mono text-zinc-800">{r.slug}</span>
                          <span
                            className={cn(
                              'tabular-nums font-medium',
                              r.bookings30d === 0 ? 'text-zinc-400' : 'text-amber-700'
                            )}
                          >
                            {r.bookings30d}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </WidgetShell>

                  <WidgetShell
                    title="Géographie"
                    subtitle="Studios par ville — carte (positions moyennes par ville)"
                    onExportCsv={() =>
                      downloadCsv(
                        'founder-geo.csv',
                        ['city', 'studio_count', 'lat_agg', 'lng_agg'],
                        data.growth.geography.map((r) => [
                          r.city,
                          r.studioCount,
                          r.lat ?? '',
                          r.lng ?? '',
                        ])
                      )
                    }
                  >
                    <GeographyMap data={data.growth.geography} />
                  </WidgetShell>
                </div>
              ) : null}
            </>
          ) : null}
        </div>
      </AdminShell>
    </>
  );
};
