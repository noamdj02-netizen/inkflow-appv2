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
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import {
  downloadCsv,
  fetchFounderMetrics,
  isFounderAllowlistedEmail,
  isFounderClientAllowlistConfigured,
  type FounderMetricsPayload,
} from '../../lib/founderMetrics';

const BRAND_BG = '#0d0d0d';
const ACCENT = '#c9a96e';
const CHART_COLORS = ['#c9a96e', '#5eead4', '#818cf8', '#f472b6', '#34d399', '#fbbf24', '#94a3b8'];

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
}): React.ReactElement {
  return (
    <section
      className={`rounded-2xl border border-zinc-800/90 bg-zinc-900/40 backdrop-blur-sm p-4 sm:p-5 shadow-sm ${props.className ?? ''}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3 mb-3 sm:mb-4">
        <div>
          <h2 className="text-sm font-semibold text-zinc-100 tracking-tight">{props.title}</h2>
          {props.subtitle ? (
            <p className="text-xs text-zinc-500 mt-0.5 max-w-prose">{props.subtitle}</p>
          ) : null}
        </div>
        {props.onExportCsv ? (
          <button
            type="button"
            onClick={props.onExportCsv}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-400 hover:text-amber-200/90 px-2.5 py-1.5 rounded-lg border border-zinc-700/80 hover:bg-zinc-800/60 active:scale-[0.98] transition-all"
          >
            <Download className="w-3.5 h-3.5" aria-hidden />
            CSV
          </button>
        ) : null}
      </div>
      {props.children}
    </section>
  );
}

function maskSensitiveNumber(reveal: boolean, value: number, suffix = ''): React.ReactNode {
  if (!reveal) {
    return <span className="inline-block blur-[6px] select-none tabular-nums text-zinc-100">••••{suffix}</span>;
  }
  return (
    <span className="tabular-nums text-zinc-50">
      {value}
      {suffix}
    </span>
  );
}

function maskEuro(reveal: boolean, value: number): React.ReactNode {
  if (!reveal) {
    return <span className="inline-block blur-[6px] select-none tabular-nums text-zinc-100">•••• €</span>;
  }
  return (
    <span className="tabular-nums text-zinc-50">
      {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value)}
    </span>
  );
}

/** Carte : cercles proportionnels au nombre de studios (position = moyenne lat/lng par ville). */
function GeographyMap(props: { data: FounderMetricsPayload['growth']['geography'] }): React.ReactElement | null {
  const points = props.data.filter((d) => d.lat != null && d.lng != null).slice(0, 40);
  if (points.length === 0) {
    return (
      <p className="text-sm text-zinc-500">Pas assez de coordonnées agrégées — positions studio optionnelles en base.</p>
    );
  }
  return (
    <div className="h-[220px] sm:h-[280px] w-full rounded-xl overflow-hidden border border-zinc-800">
      <MapContainer center={[46.5, 2.5]} zoom={5.5} className="h-full w-full" scrollWheelZoom={false}>
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

export const FounderDashboardPage: React.FC = () => {
  const { user } = useAuth();
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
        () => void load(),
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'inkflow_studios' },
        () => void load(),
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(ch);
    };
  }, [allowed, data, load]);

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
      <div className="founder-admin-scroll-root flex items-center justify-center px-4 py-10" style={{ backgroundColor: BRAND_BG }}>
        <SEO title="Accès refusé" noindex canonical="/admin" />
        <div className="max-w-lg w-full space-y-4 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 sm:p-8">
          <LayoutDashboard className="w-10 h-10 text-zinc-600" aria-hidden />
          <h1 className="text-xl font-bold text-zinc-100 font-display">Espace fondateur — accès refusé</h1>
          <p className="text-sm text-zinc-400 leading-relaxed">
            Ton compte connecté doit être autorisé côté application. Variable{' '}
            <code className="text-xs text-amber-200/90 bg-zinc-950 px-1.5 py-0.5 rounded">VITE_FOUNDER_ADMIN_EMAILS</code>{' '}
            ({viteListConfigured ? 'déjà renseignée' : 'non renseignée en build'}).
          </p>
          <div className="rounded-xl border border-zinc-700/80 bg-black/30 px-4 py-3 text-left text-sm">
            <p className="text-zinc-500 text-xs uppercase tracking-wide mb-1">E-mail de session</p>
            <p className="font-mono text-zinc-100 break-all">{user.email ?? '—'}</p>
          </div>
          <ol className="list-decimal list-inside text-sm text-zinc-400 space-y-2 leading-relaxed">
            <li>
              Dans <code className="text-xs text-zinc-500">.env.local</code> (local) ou les variables Vercel (prod), ajoute{' '}
              <strong className="text-zinc-300">exactement</strong> l’e-mail ci-dessus :{' '}
              <code className="text-xs break-all text-amber-100/90">VITE_FOUNDER_ADMIN_EMAILS={user.email ?? 'toi@domaine.com'}</code>
            </li>
            <li>
              Sur Supabase → Edge Functions → Secrets, même liste dans{' '}
              <code className="text-xs text-zinc-500">FOUNDER_ADMIN_EMAILS</code> (séparés par des virgules si plusieurs).
            </li>
            <li>Redémarre le serveur de dev ou redéploie le front après changement des variables Vite.</li>
          </ol>
          <p className="text-xs text-zinc-600">
            Astuce : si tu ne mets pas <code className="text-zinc-500">VITE_FOUNDER_ADMIN_EMAILS</code>, l’app laisse passer la requête et
            c’est uniquement le secret Supabase qui autorise — pratique si le front n’a pas encore la variable en production.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="founder-admin-scroll-root text-zinc-100 pb-8 sm:pb-12" style={{ backgroundColor: BRAND_BG }}>
      <SEO title="Founder — monitoring" description="Tableau de bord interne InkFlow" noindex canonical="/admin" />
      <header className="border-b border-zinc-800/90 bg-black/30 sticky top-0 z-20 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: 'rgba(201,169,110,0.15)' }}
            >
              <Activity className="w-5 h-5" style={{ color: ACCENT }} aria-hidden />
            </div>
            <div className="min-w-0">
              <h1 className="font-display font-bold text-lg sm:text-xl tracking-tight truncate">Founder — InkFlow</h1>
              <p className="text-xs sm:text-sm text-zinc-500 truncate">
                Vue produit · MRR = tes abonnements SaaS · Pas les revenus tatoueurs · Paris · MAJ 5 min
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 founder-admin-no-print">
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium border border-amber-700/60 text-amber-100/95 hover:bg-amber-950/40 active:scale-[0.98] transition-all min-h-[44px]"
            >
              <FileText className="w-4 h-4" aria-hidden />
              PDF / Imprimer
            </button>
            <button
              type="button"
              onClick={() => setRevealSensitive((v) => !v)}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium border border-zinc-700 text-zinc-200 hover:bg-zinc-800/80 active:scale-[0.98] transition-all min-h-[44px]"
            >
              {revealSensitive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              {revealSensitive ? 'Masquer' : 'Afficher'} montants
            </button>
            <button
              type="button"
              onClick={() => void load()}
              disabled={loading}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold bg-zinc-100 text-zinc-900 hover:bg-white active:scale-[0.98] transition-all min-h-[44px] disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              Rafraîchir
            </button>
            <button
              type="button"
              onClick={() => {
                window.history.pushState({}, '', '/dashboard');
                window.dispatchEvent(new Event('inkflow-navigate'));
              }}
              className="text-sm text-zinc-500 hover:text-zinc-300 min-h-[44px] px-2"
            >
              Dashboard studio
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8">
        {error ? (
          <div className="rounded-xl border border-red-900/60 bg-red-950/30 px-4 py-3 text-sm text-red-200">{error}</div>
        ) : null}

        {!loading && serverAccessIssue ? (
          <div className="rounded-2xl border border-amber-900/50 bg-amber-950/25 px-4 sm:px-6 py-5 text-sm text-amber-50/95 space-y-3">
            {serverAccessIssue === 'server_env_missing' ? (
              <>
                <p className="font-semibold text-amber-100">Secret Supabase manquant</p>
                <p className="text-amber-100/85 leading-relaxed">
                  Définis <code className="text-xs bg-black/30 px-1.5 py-0.5 rounded">FOUNDER_ADMIN_EMAILS</code> sur le projet Supabase
                  (Edge Functions → Secrets), avec ton e-mail de connexion, puis redéploie ou réessaie.
                </p>
              </>
            ) : null}
            {serverAccessIssue === 'email_unverified' ? (
              <>
                <p className="font-semibold text-amber-100">E-mail non confirmé</p>
                <p className="text-amber-100/85 leading-relaxed">
                  Confirme ton adresse e-mail dans le message envoyé par Supabase, puis recharge cette page.
                </p>
              </>
            ) : null}
            {serverAccessIssue === 'forbidden' ? (
              <>
                <p className="font-semibold text-amber-100">Refus côté serveur (403)</p>
                <p className="text-amber-100/85 leading-relaxed">
                  L’e-mail de ta session n’est pas dans <code className="text-xs bg-black/30 px-1.5 py-0.5 rounded">FOUNDER_ADMIN_EMAILS</code>
                  {' '}sur Supabase, ou ne correspond pas exactement (même compte que{' '}
                  <span className="font-mono text-amber-50">{user.email}</span>).
                </p>
                <p className="text-amber-200/80 text-xs">
                  Vérifie aussi Google / magic link : l’e-mail doit être le même que dans le secret.
                </p>
              </>
            ) : null}
            <button
              type="button"
              onClick={() => void load()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-200 text-amber-950 font-semibold text-sm min-h-[44px] active:scale-[0.98]"
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
            {/* Récap PDF (visible uniquement à l’impression) */}
            <div className="founder-print-only text-black space-y-3 pb-4 mb-4 border-b border-zinc-300">
              <h1 className="text-2xl font-bold font-display">InkFlow — rapport fondateur</h1>
              <p className="text-sm text-zinc-600">
                Généré :{' '}
                {new Date(data.generatedAt).toLocaleString('fr-FR', { timeZone: 'Europe/Paris' })} · Données agrégées,
                sans e-mails clients.
              </p>
              <ul className="text-sm space-y-1 list-disc list-inside">
                <li>Comptes utilisateurs (auth) : {formatAuthUsers(data.kpis.totalAuthUsers)}</li>
                <li>Studios inscrits : {data.kpis.totalStudios}</li>
                <li>Abonnements actifs / essai : {data.kpis.subscribedActive} / {data.kpis.subscribedTrialing}</li>
                <li>MRR InkFlow estimé : {revealSensitive ? `${data.kpis.mrrEstimatedEur} €` : '•••• (activer « Afficher montants » avant impression)'}</li>
                <li>Fiches CRM (total) : {data.kpis.crmClientsTotal}</li>
                <li>Paiements refusés en base (mois) : {data.health.paymentsFailedMonth}</li>
                <li>Studios onboarding bloqué (&gt;7j) : {data.alerts.studiosStuckOnboarding}</li>
              </ul>
            </div>

            {/* Revenus SaaS InkFlow */}
            <section aria-labelledby="founder-saas" className="space-y-3">
              <h2 id="founder-saas" className="flex items-center gap-2 text-sm font-semibold text-zinc-400 uppercase tracking-wide">
                <Sparkles className="w-4 h-4 text-amber-400/90 shrink-0" aria-hidden />
                Tes revenus InkFlow (abonnements SaaS)
              </h2>
              <p className="text-xs text-zinc-500 max-w-3xl">
                Montants basés sur les plans actifs en base (tarifs configurables via secrets Edge). Ce n’est pas ce que les
                tatoueurs facturent à leurs clients.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
                {[
                  {
                    label: 'MRR estimé (SaaS)',
                    icon: <Wallet className="w-4 h-4 text-amber-400/90" aria-hidden />,
                    node: maskEuro(revealSensitive, data.kpis.mrrEstimatedEur),
                    sub: 'Somme des abonnements studio actifs + essai',
                    csv: () =>
                      downloadCsv('founder-kpi-mrr.csv', ['metric', 'value'], [['mrr_saas_eur', data.kpis.mrrEstimatedEur]]),
                  },
                  {
                    label: 'ARR indicatif',
                    icon: <TrendingUp className="w-4 h-4 text-emerald-400/80" aria-hidden />,
                    node: revealSensitive ? (
                      <span className="tabular-nums text-zinc-50">
                        {new Intl.NumberFormat('fr-FR', {
                          maximumFractionDigits: 0,
                        }).format(data.kpis.mrrEstimatedEur * 12)}{' '}
                        €
                      </span>
                    ) : (
                      <span className="inline-block blur-[6px] select-none tabular-nums">•••• €</span>
                    ),
                    sub: 'MRR × 12 (projection)',
                    csv: () =>
                      downloadCsv('founder-kpi-arr.csv', ['metric', 'value'], [['arr_indicatif_eur', data.kpis.mrrEstimatedEur * 12]]),
                  },
                  {
                    label: 'Studios en abonnement actif',
                    icon: <CreditCard className="w-4 h-4 text-zinc-400" aria-hidden />,
                    node: <span className="tabular-nums text-zinc-50">{data.kpis.subscribedActive}</span>,
                    sub: 'Stripe / statut active',
                    csv: () =>
                      downloadCsv('founder-kpi-abo-actifs.csv', ['metric', 'value'], [['studios_abonnement_actif', data.kpis.subscribedActive]]),
                  },
                  {
                    label: 'En période d’essai',
                    icon: <Activity className="w-4 h-4 text-zinc-400" aria-hidden />,
                    node: <span className="tabular-nums text-zinc-50">{data.kpis.subscribedTrialing}</span>,
                    sub: 'Trialing',
                    csv: () =>
                      downloadCsv('founder-kpi-trialing.csv', ['metric', 'value'], [['studios_trialing', data.kpis.subscribedTrialing]]),
                  },
                ].map((k) => (
                  <div
                    key={k.label}
                    className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4 sm:p-5 flex flex-col justify-between min-h-[128px] min-w-0"
                  >
                    <div className="flex justify-between gap-2 items-start">
                      <p className="text-[11px] uppercase tracking-wide text-zinc-500 font-medium flex items-center gap-2 min-w-0">
                        {k.icon}
                        <span className="leading-tight">{k.label}</span>
                      </p>
                      <button
                        type="button"
                        onClick={k.csv}
                        className="text-zinc-500 hover:text-amber-200/90 p-1 rounded-lg shrink-0 founder-admin-no-print"
                        title="Exporter CSV"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                    <div>
                      {k.sub ? <p className="text-[10px] text-zinc-600 mt-2">{k.sub}</p> : null}
                      <p className="text-2xl sm:text-3xl font-bold mt-1 tabular-nums break-all">{k.node}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Base utilisateurs */}
            <section aria-labelledby="founder-users" className="space-y-3">
              <h2 id="founder-users" className="flex items-center gap-2 text-sm font-semibold text-zinc-400 uppercase tracking-wide">
                <Users className="w-4 h-4 text-zinc-400 shrink-0" aria-hidden />
                Utilisateurs & base studio
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
                {[
                  {
                    label: 'Comptes (auth Supabase)',
                    node: formatAuthUsers(data.kpis.totalAuthUsers),
                    sub: data.kpis.totalAuthUsers < 0 ? 'Erreur listUsers — voir logs Edge' : 'Inclut équipe + tatoueurs',
                    csv: () =>
                      downloadCsv('founder-kpi-auth-users.csv', ['metric', 'value'], [
                        ['comptes_auth', data.kpis.totalAuthUsers < 0 ? 'erreur' : data.kpis.totalAuthUsers],
                      ]),
                  },
                  {
                    label: 'Studios inscrits',
                    icon: <Building2 className="w-4 h-4 text-zinc-500" />,
                    node: String(data.kpis.totalStudios),
                    sub: 'inkflow_studios',
                    csv: () =>
                      downloadCsv('founder-kpi-studios-total.csv', ['metric', 'value'], [['studios_total', data.kpis.totalStudios]]),
                  },
                  {
                    label: 'Fiches CRM (total)',
                    node: String(data.kpis.crmClientsTotal),
                    sub: 'Clients enregistrés par les studios',
                    csv: () =>
                      downloadCsv('founder-kpi-crm-clients.csv', ['metric', 'value'], [['crm_clients_total', data.kpis.crmClientsTotal]]),
                  },
                  {
                    label: 'Studios actifs (7j)',
                    node: String(data.kpis.studiosActive7d),
                    sub: 'Bookings, RDV ou maj studio',
                    csv: () =>
                      downloadCsv('founder-kpi-studios-actifs.csv', ['metric', 'value'], [
                        ['studios_actifs_7j', data.kpis.studiosActive7d],
                      ]),
                  },
                ].map((k) => (
                  <div
                    key={k.label}
                    className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4 sm:p-5 flex flex-col justify-between min-h-[120px]"
                  >
                    <div className="flex justify-end founder-admin-no-print">
                      <button
                        type="button"
                        onClick={k.csv}
                        className="text-zinc-500 hover:text-amber-200/90 p-1 rounded-lg"
                        title="Exporter CSV"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                    <div>
                      <p className="text-[11px] uppercase tracking-wide text-zinc-500 font-medium flex items-center gap-2">
                        {'icon' in k ? (k as { icon?: React.ReactNode }).icon : null}
                        {k.label}
                      </p>
                      {k.sub ? <p className="text-[10px] text-zinc-600 mt-1">{k.sub}</p> : null}
                      <p className="text-2xl sm:text-3xl font-bold mt-1 tabular-nums text-zinc-50">{k.node}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Santé paiements */}
            <section aria-labelledby="founder-health" className="rounded-2xl border border-zinc-800/90 bg-zinc-950/40 p-4 sm:p-5 space-y-3">
              <h2 id="founder-health" className="flex items-center gap-2 text-sm font-semibold text-zinc-300">
                <HeartPulse className="w-4 h-4 text-rose-400/90 shrink-0" aria-hidden />
                Santé des paiements (base InkFlow)
              </h2>
              <p className="text-xs text-zinc-500">
                Complète les alertes produit ci-dessous. Les erreurs Stripe / code sont surtout dans les logs (Supabase Edge,
                Sentry, Stripe Dashboard).
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="rounded-xl border border-rose-900/40 bg-rose-950/20 px-4 py-3">
                  <p className="text-xs text-rose-200/80 uppercase tracking-wide">Paiements échoués (mois)</p>
                  <p className="text-2xl font-bold tabular-nums text-zinc-100">{data.health.paymentsFailedMonth}</p>
                </div>
                <div className="rounded-xl border border-amber-900/35 bg-amber-950/15 px-4 py-3">
                  <p className="text-xs text-amber-200/80 uppercase tracking-wide">Paiements « pending » &gt; 7 jours</p>
                  <p className="text-2xl font-bold tabular-nums text-zinc-100">{data.health.paymentsPendingStale7d}</p>
                </div>
              </div>
            </section>

            {/* Volume plateforme */}
            <section aria-labelledby="founder-volume" className="space-y-3">
              <h2 id="founder-volume" className="text-sm font-semibold text-zinc-400 uppercase tracking-wide">
                Volume plateforme (usage)
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {[
                  {
                    label: 'Bookings créés (30 j)',
                    node: <span className="tabular-nums text-zinc-50">{data.kpis.bookingsCreated30d}</span>,
                    csv: () =>
                      downloadCsv('founder-kpi-bookings-30j.csv', ['metric', 'value'], [
                        ['bookings_30j', data.kpis.bookingsCreated30d],
                      ]),
                  },
                  {
                    label: 'Bookings créés aujourd’hui',
                    sub: '(minuit → fin de jour, Paris)',
                    node: <span className="tabular-nums text-zinc-50">{data.kpis.bookingsTodayParis}</span>,
                    csv: () =>
                      downloadCsv('founder-kpi-bookings-jour.csv', ['metric', 'value'], [
                        ['bookings_aujourdhui_paris', data.kpis.bookingsTodayParis],
                      ]),
                  },
                ].map((k) => (
                  <div
                    key={k.label}
                    className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4 sm:p-5 min-h-[100px] flex flex-col justify-between"
                  >
                    <div className="flex justify-end founder-admin-no-print">
                      <button
                        type="button"
                        onClick={k.csv}
                        className="text-zinc-500 hover:text-amber-200/90 p-1 rounded-lg"
                        title="Exporter CSV"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                    <div>
                      <p className="text-[11px] uppercase tracking-wide text-zinc-500 font-medium">{k.label}</p>
                      {'sub' in k && (k as { sub?: string }).sub ? (
                        <p className="text-[10px] text-zinc-600 mt-0.5">{(k as { sub?: string }).sub}</p>
                      ) : null}
                      <p className="text-2xl font-bold mt-1">{k.node}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Écosystème : argent clients → studios (pas ton MRR) */}
            <details className="rounded-2xl border border-zinc-800/80 bg-zinc-900/30 p-4 sm:p-5 group">
              <summary className="cursor-pointer text-sm font-medium text-zinc-300 list-none flex items-center justify-between gap-2 min-h-[44px]">
                <span>Écosystème — acomptes clients (argent vers les studios)</span>
                <span className="text-xs text-zinc-500 group-open:hidden">Afficher</span>
                <span className="text-xs text-zinc-500 hidden group-open:inline">Masquer</span>
              </summary>
              <p className="text-xs text-zinc-500 mt-2 mb-4 max-w-2xl">
                Volume d’acomptes encaissés ce mois via InkFlow. Ce n’est pas ton chiffre d’affaires SaaS : c’est du cash qui
                transite vers les tatoueurs.
              </p>
              <div className="rounded-xl border border-zinc-700/80 bg-black/20 p-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase text-zinc-500 tracking-wide">Total acomptes (mois en cours)</p>
                  <p className="text-2xl font-bold tabular-nums mt-1">{maskEuro(revealSensitive, data.kpis.depositsMonthEur)}</p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    downloadCsv('founder-kpi-acomptes-mois.csv', ['metric', 'value'], [
                      ['acomptes_mois_eur', data.kpis.depositsMonthEur],
                    ])
                  }
                  className="inline-flex items-center gap-2 text-xs font-medium text-zinc-400 hover:text-amber-200/90 px-3 py-2 rounded-xl border border-zinc-700 founder-admin-no-print min-h-[44px] active:scale-[0.98] transition-all"
                >
                  <Download className="w-3.5 h-3.5" />
                  CSV
                </button>
              </div>
            </details>

            {/* Outils & logs (pas de données live ici) */}
            <section aria-labelledby="founder-ops" className="rounded-2xl border border-zinc-800/90 p-4 sm:p-5 space-y-3 bg-black/25">
              <h2 id="founder-ops" className="text-sm font-semibold text-zinc-300 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500/90" aria-hidden />
                Erreurs code, Stripe, blocages — où regarder
              </h2>
              <ul className="text-sm text-zinc-400 space-y-2 leading-relaxed">
                <li>
                  <a
                    href="https://supabase.com/dashboard"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-amber-200/90 hover:underline"
                  >
                    Supabase Dashboard <ExternalLink className="w-3.5 h-3.5 shrink-0 opacity-70" aria-hidden />
                  </a>{' '}
                  → Logs Edge Functions (`stripe-webhook`, etc.), Auth, base.
                </li>
                <li>
                  <a
                    href="https://sentry.io"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-amber-200/90 hover:underline"
                  >
                    Sentry <ExternalLink className="w-3.5 h-3.5 shrink-0 opacity-70" aria-hidden />
                  </a>{' '}
                  — erreurs front (`ErrorBoundary`) et Edge (`stripe-webhook`) si DSN configuré.
                </li>
                <li>
                  Dashboard Stripe — paiements Connect & abonnements SaaS (projet InkFlow).
                </li>
                <li className="text-xs text-zinc-500">{data.alerts.suspiciousAuthNote}</li>
              </ul>
            </section>

            {/* ROW 2 — graphiques (masqués à l’impression) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 founder-print-hide">
              <WidgetShell
                title="Nouveaux inscrits — 30 derniers jours"
                subtitle="Studios créés par jour (Europe/Paris)"
                onExportCsv={() =>
                  downloadCsv(
                    'founder-signups-30j.csv',
                    ['date', 'count'],
                    data.activity.signupsByDay.map((r) => [r.date, r.count]),
                  )
                }
              >
                <div className="h-[220px] sm:h-[260px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data.activity.signupsByDay}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                      <XAxis dataKey="date" tick={{ fill: '#71717a', fontSize: 10 }} interval={4} />
                      <YAxis tick={{ fill: '#71717a', fontSize: 11 }} allowDecimals={false} />
                      <RechartsTooltip
                        contentStyle={{ background: '#18181b', border: '1px solid #3f3f46' }}
                        labelStyle={{ color: '#e4e4e7' }}
                      />
                      <Line type="monotone" dataKey="count" stroke={ACCENT} strokeWidth={2} dot={false} name="Inscriptions" />
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
                    data.activity.onboardingStepDistribution.map((r) => [r.step, r.count]),
                  )
                }
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="text-4xl font-bold tabular-nums" style={{ color: ACCENT }}>
                    {data.activity.onboardingActivationRate}%
                  </div>
                  <p className="text-sm text-zinc-400 flex-1">
                    Taux d’activation (étape 3+) calculé sur le total des studios. Détail par segment ci-dessous (export
                    CSV).
                  </p>
                </div>
                <div className="h-[160px] mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.activity.onboardingStepDistribution} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                      <XAxis type="number" tick={{ fill: '#71717a' }} allowDecimals={false} />
                      <YAxis type="category" dataKey="step" width={100} tick={{ fill: '#a1a1aa', fontSize: 11 }} />
                      <RechartsTooltip contentStyle={{ background: '#18181b', border: '1px solid #3f3f46' }} />
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
                    data.activity.projectRequestsByStatus.map((r) => [r.status, r.count]),
                  )
                }
              >
                <div className="h-[260px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data.activity.projectRequestsByStatus as { status: string; count: number }[]}
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
                      <RechartsTooltip contentStyle={{ background: '#18181b', border: '1px solid #3f3f46' }} />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </WidgetShell>

              <WidgetShell
                title="Taux d’acceptation projets"
                subtitle="Acceptés ÷ (acceptés + refusés)"
                onExportCsv={() =>
                  downloadCsv('founder-project-acceptance.csv', ['metric', 'value'], [
                    ['taux_acceptation_pct', data.activity.projectAcceptanceRate ?? ''],
                  ])
                }
              >
                <div className="flex flex-col justify-center min-h-[180px]">
                  <p className="text-5xl font-bold tabular-nums" style={{ color: ACCENT }}>
                    {data.activity.projectAcceptanceRate == null ? '—' : `${data.activity.projectAcceptanceRate}%`}
                  </p>
                  <p className="text-sm text-zinc-500 mt-3 flex items-start gap-2">
                    <TrendingUp className="w-4 h-4 shrink-0 mt-0.5 opacity-70" aria-hidden />
                    Généré à{' '}
                    {new Date(data.generatedAt).toLocaleString('fr-FR', { timeZone: 'Europe/Paris' })} — agrégats
                    uniquement.
                  </p>
                </div>
              </WidgetShell>
            </div>

            {/* ROW 3 */}
            <WidgetShell
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
                  ],
                )
              }
            >
              <ul className="grid sm:grid-cols-2 gap-3 text-sm">
                <li className="rounded-xl border border-amber-900/40 bg-amber-950/20 px-4 py-3 flex gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-zinc-200">Onboarding bloqué</strong>
                    <br />
                    <span className="tabular-nums text-lg font-semibold">{data.alerts.studiosStuckOnboarding}</span>{' '}
                    studios inscrits depuis &gt; 7j sans étape 3
                  </span>
                </li>
                <li className="rounded-xl border border-red-900/40 bg-red-950/20 px-4 py-3 flex gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-zinc-200">Acomptes &gt; 48h</strong>
                    <br />
                    <span className="tabular-nums text-lg font-semibold">{data.alerts.unpaidDepositsOver48h}</span> RDV
                    pending/confirmés, acompte non payé
                  </span>
                </li>
                <li className="rounded-xl border border-amber-900/35 bg-zinc-950/40 px-4 py-3 flex gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-500/90 shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-zinc-200">Sans flash &gt; 48h</strong> (cohorte 365j)
                    <br />
                    <span className="tabular-nums text-lg font-semibold">{data.alerts.studiosNoFlashAfter48h}</span>{' '}
                    studios encore sans design publié
                  </span>
                </li>
                <li className="rounded-xl border border-amber-900/35 bg-zinc-950/40 px-4 py-3 flex gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-500/90 shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-zinc-200">Stripe pas prêt &gt; 72h</strong> (cohorte 365j)
                    <br />
                    <span className="tabular-nums text-lg font-semibold">{data.alerts.studiosNoStripeAfter72h}</span>{' '}
                    compte ou charges inactives
                  </span>
                </li>
                <li className="rounded-xl border border-zinc-700/80 bg-zinc-950/40 px-4 py-3 sm:col-span-2">
                  <p className="text-zinc-300 text-xs leading-relaxed">{data.alerts.suspiciousAuthNote}</p>
                </li>
                <li className="rounded-xl border border-zinc-700/80 bg-zinc-900/30 px-4 py-3 flex gap-3 sm:col-span-2">
                  <BarChart3 className="w-5 h-5 text-zinc-500 shrink-0" />
                  <span>
                    <strong className="text-zinc-200">Studios inactifs 14j</strong> (updated_at){' '}
                    <span className="tabular-nums font-semibold">{data.alerts.studiosInactive14d}</span>
                  </span>
                </li>
              </ul>
            </WidgetShell>

            {/* ROW 4 — rangées relatif / cartes (masqué à l’impression) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 founder-print-hide">
              <WidgetShell
                title="Churn (mois en cours)"
                subtitle="Abonnements marqués annulés (maj ce mois)"
                onExportCsv={() =>
                  downloadCsv('founder-churn.csv', ['metric', 'value'], [['churn_subscriptions_mois', data.growth.churnSubscriptionsMonth]])
                }
              >
                <p className="text-3xl font-bold tabular-nums">{data.growth.churnSubscriptionsMonth}</p>
              </WidgetShell>

              <WidgetShell
                title="Plans studio (snapshots plan_type)"
                subtitle="Basic / Pro / Studio — répartition actuelle"
                onExportCsv={() =>
                  downloadCsv(
                    'founder-plans.csv',
                    ['plan', 'studios'],
                    data.growth.planDistribution.map((r) => [r.plan, r.count]),
                  )
                }
              >
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.growth.planDistribution}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                      <XAxis dataKey="plan" tick={{ fill: '#a1a1aa', fontSize: 11 }} />
                      <YAxis tick={{ fill: '#71717a' }} allowDecimals={false} />
                      <RechartsTooltip contentStyle={{ background: '#18181b', border: '1px solid #3f3f46' }} />
                      <Bar dataKey="count" fill="#6366f1" radius={[6, 6, 0, 0]} />
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
                    data.growth.topStudios.map((r) => [r.studioId, r.slug, r.bookings30d]),
                  )
                }
              >
                <ul className="space-y-2 text-sm max-h-[220px] overflow-y-auto pr-1">
                  {data.growth.topStudios.map((r, i) => (
                    <li key={r.studioId} className="flex justify-between gap-2 border-b border-zinc-800/80 pb-2">
                      <span className="text-zinc-400 w-6">{i + 1}.</span>
                      <span className="text-zinc-200 font-mono truncate">{r.slug}</span>
                      <span className="tabular-nums text-amber-200/90">{r.bookings30d}</span>
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
                    data.growth.geography.map((r) => [r.city, r.studioCount, r.lat ?? '', r.lng ?? '']),
                  )
                }
              >
                <GeographyMap data={data.growth.geography} />
              </WidgetShell>
            </div>
          </>
        ) : null}
      </main>
    </div>
  );
};
