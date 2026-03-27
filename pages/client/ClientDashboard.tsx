/**
 * ClientDashboard — Portail "My Inkflow" pour les clients tatoueurs
 *
 * 3 onglets : Accueil | Portfolio | Parrainage
 *
 * Authentification : magic link Supabase → session par email
 * Données : inkflow_appointments + inkflow_bookings + inkflow_client_wallets + inkflow_client_codes
 */

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  Home,
  Image,
  Gift,
  LogOut,
  Wallet,
  Calendar,
  Copy,
  Share2,
  CheckCircle,
  ChevronRight,
  Sparkles,
  Clock,
  MapPin,
  Check,
  AlertCircle,
  Droplets,
  Sun,
  Shield,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

// ── Types ────────────────────────────────────────────────────────────────────

interface ClientAppointment {
  id: string;
  date: string;
  time?: string;
  service: string;
  status: string;
  price: number;
  studio_name?: string;
  studio_slug?: string;
  notes?: string;
}

interface ClientBooking {
  id: string;
  created_at: string;
  service_type?: string;
  style?: string;
  placement?: string;
  status: string;
  studio_name?: string;
}

type Tab = 'home' | 'portfolio' | 'parrainage';

const STATUS_LABELS: Record<string, string> = {
  pending: 'En attente',
  confirmed: 'Confirmé',
  completed: 'Terminé',
  cancelled: 'Annulé',
  in_progress: 'En cours',
  no_show: 'Absent',
};

const STATUS_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  pending:    { bg: 'rgba(251,191,36,0.1)',  text: '#fbbf24', border: 'rgba(251,191,36,0.2)' },
  confirmed:  { bg: 'rgba(52,211,153,0.1)',  text: '#34d399', border: 'rgba(52,211,153,0.2)' },
  completed:  { bg: 'rgba(107,114,128,0.1)', text: '#9ca3af', border: 'rgba(107,114,128,0.2)' },
  cancelled:  { bg: 'rgba(248,113,113,0.1)', text: '#f87171', border: 'rgba(248,113,113,0.2)' },
  in_progress:{ bg: 'rgba(96,165,250,0.1)',  text: '#60a5fa', border: 'rgba(96,165,250,0.2)' },
  no_show:    { bg: 'rgba(248,113,113,0.1)', text: '#f87171', border: 'rgba(248,113,113,0.2)' },
};

// ── Helpers ─────────────────────────────────────────────────────────────────

function generateCode(email: string): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let hash = 0;
  for (let i = 0; i < email.length; i++) hash = (hash * 31 + email.charCodeAt(i)) | 0;
  let code = '';
  for (let i = 0; i < 6; i++) {
    hash = (hash * 1103515245 + 12345) | 0;
    code += chars[Math.abs(hash) % chars.length];
  }
  return code;
}

function daysSince(dateStr: string): number {
  const [y, m, d] = dateStr.split('-').map(Number);
  const diff = Date.now() - new Date(y, m - 1, d).getTime();
  return Math.floor(diff / 86400000);
}

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

// ── Cicatrisation timeline ───────────────────────────────────────────────────

const HEALING_STEPS = [
  { day: 1,  icon: Droplets, label: 'Film retiré',        tip: 'Lave doucement au savon surgras (2×/jour).' },
  { day: 3,  icon: Shield,   label: 'Premier pelage',      tip: 'Normal si ça pèle — ne gratte pas !' },
  { day: 10, icon: Sun,      label: '90% cicatrisé',       tip: 'Évite encore piscine, bain, soleil direct.' },
  { day: 30, icon: Check,    label: 'Cicatrisation totale', tip: 'Ton tatouage est terminé — protège-le au SPF 50+.' },
];

const HealingTimeline: React.FC<{ lastTattooDate: string; service: string }> = ({ lastTattooDate, service }) => {
  const days = daysSince(lastTattooDate);
  if (days > 40) return null;

  const pct = Math.min((days / 30) * 100, 100);

  return (
    <div className="rounded-2xl border p-5" style={{ background: '#161616', borderColor: '#2a2a2a' }}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#c9a96e' }}>
            Cicatrisation en cours
          </p>
          <h3 className="text-base font-bold mt-1" style={{ color: '#e8e3dc' }}>{service}</h3>
        </div>
        <span className="text-2xl font-bold tabular-nums" style={{ color: '#c9a96e' }}>J+{days}</span>
      </div>

      {/* Progress bar */}
      <div className="relative h-1.5 rounded-full mb-5" style={{ background: '#2a2a2a' }}>
        <div
          className="absolute left-0 top-0 h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #c9a96e, #e8d5a3)' }}
        />
        {HEALING_STEPS.map((step) => (
          <div
            key={step.day}
            className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full border-2"
            style={{
              left: `${(step.day / 30) * 100}%`,
              transform: 'translate(-50%, -50%)',
              background: days >= step.day ? '#c9a96e' : '#2a2a2a',
              borderColor: days >= step.day ? '#c9a96e' : '#3a3a3a',
            }}
          />
        ))}
      </div>

      {/* Steps */}
      <div className="space-y-2.5">
        {HEALING_STEPS.map((step) => {
          const done = days >= step.day;
          const current = !done && (step.day === HEALING_STEPS.find((s) => days < s.day)?.day);
          const Icon = step.icon;
          return (
            <div key={step.day} className="flex items-start gap-3">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                style={{
                  background: done ? 'rgba(201,169,110,0.15)' : current ? 'rgba(201,169,110,0.08)' : 'rgba(42,42,42,0.5)',
                }}
              >
                <Icon
                  className="w-3.5 h-3.5"
                  style={{ color: done ? '#c9a96e' : current ? '#a0998f' : '#3a3a3a' }}
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className="text-xs font-semibold"
                    style={{ color: done ? '#c9a96e' : current ? '#a0998f' : '#3a3a3a' }}
                  >
                    J+{step.day} — {step.label}
                  </span>
                  {done && <Check className="w-3 h-3" style={{ color: '#c9a96e' }} />}
                  {current && <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold" style={{ background: 'rgba(201,169,110,0.15)', color: '#c9a96e' }}>Maintenant</span>}
                </div>
                {(done || current) && (
                  <p className="text-xs mt-0.5" style={{ color: '#6b6b6b' }}>{step.tip}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ── Wallet card ───────────────────────────────────────────────────────────────

const WalletCard: React.FC<{ balanceCents: number; onParrainage: () => void }> = ({ balanceCents, onParrainage }) => (
  <div
    className="rounded-2xl p-5 relative overflow-hidden"
    style={{ background: 'linear-gradient(135deg, #1e1a14 0%, #2a2215 100%)', border: '1px solid rgba(201,169,110,0.2)' }}
  >
    {/* Decorative circle */}
    <div
      className="absolute -right-8 -top-8 w-32 h-32 rounded-full opacity-10"
      style={{ background: '#c9a96e' }}
    />
    <div className="relative">
      <div className="flex items-center gap-2 mb-3">
        <Wallet className="w-4 h-4" style={{ color: '#c9a96e' }} />
        <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#c9a96e' }}>
          Mon Wallet
        </span>
      </div>
      <div className="text-3xl font-bold mb-1" style={{ color: '#e8e3dc' }}>
        {(balanceCents / 100).toFixed(0)}€
        <span className="text-base font-normal ml-1" style={{ color: '#6b6b6b' }}>de crédit</span>
      </div>
      <p className="text-xs mb-4" style={{ color: '#6b6b6b' }}>
        Utilisable chez n'importe quel tatoueur du réseau Inkflow
      </p>
      <button
        onClick={onParrainage}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-[0.97]"
        style={{ background: '#c9a96e', color: '#0d0d0d' }}
      >
        <Gift className="w-4 h-4" />
        Gagner des crédits
      </button>
    </div>
  </div>
);

// ── Appointment card ──────────────────────────────────────────────────────────

const AppointmentCard: React.FC<{ apt: ClientAppointment }> = ({ apt }) => {
  const sc = STATUS_COLORS[apt.status] || STATUS_COLORS.completed;
  const isPast = apt.status === 'completed' || apt.status === 'cancelled' || apt.status === 'no_show';
  return (
    <div
      className="rounded-2xl border p-4 flex items-start gap-4"
      style={{ background: '#161616', borderColor: '#2a2a2a' }}
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: isPast ? 'rgba(107,114,128,0.12)' : 'rgba(201,169,110,0.12)' }}
      >
        <Calendar
          className="w-5 h-5"
          style={{ color: isPast ? '#6b6b6b' : '#c9a96e' }}
        />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <span className="font-semibold text-sm truncate" style={{ color: '#e8e3dc' }}>
            {apt.service}
          </span>
          <span
            className="text-xs font-semibold px-2 py-0.5 rounded-full border shrink-0"
            style={{ background: sc.bg, color: sc.text, borderColor: sc.border }}
          >
            {STATUS_LABELS[apt.status] ?? apt.status}
          </span>
        </div>
        <div className="flex items-center gap-3 text-xs" style={{ color: '#6b6b6b' }}>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formatDate(apt.date)}{apt.time ? ` à ${apt.time}` : ''}
          </span>
        </div>
        {apt.studio_name && (
          <div className="flex items-center gap-1 mt-1 text-xs" style={{ color: '#6b6b6b' }}>
            <MapPin className="w-3 h-3" />
            {apt.studio_name}
          </div>
        )}
        {apt.price > 0 && (
          <div className="mt-1 text-xs font-bold" style={{ color: '#c9a96e' }}>{apt.price}€</div>
        )}
      </div>
    </div>
  );
};

// ── Parrainage tab ────────────────────────────────────────────────────────────

interface ParrainageTabProps {
  email: string;
  referralCode: string;
  balanceCents: number;
  referrals: Array<{ referee_email: string; status: string; created_at: string }>;
}

const ParrainageTab: React.FC<ParrainageTabProps> = ({ email, referralCode, balanceCents, referrals }) => {
  const [copied, setCopied] = useState(false);
  const shareUrl = `${window.location.origin}/book?ref=${referralCode}`;

  const copyCode = async () => {
    await navigator.clipboard.writeText(shareUrl).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const share = async () => {
    if (navigator.share) {
      await navigator.share({
        title: 'Mon code Inkflow',
        text: `Réserve via Inkflow avec mon code et obtiens -10€ sur ta séance 🎨`,
        url: shareUrl,
      }).catch(() => {});
    } else {
      copyCode();
    }
  };

  const completedCount = referrals.filter((r) => r.status === 'completed').length;
  const pendingCount = referrals.filter((r) => r.status === 'pending').length;

  return (
    <div className="space-y-5 px-4 pb-24">
      {/* Wallet recap */}
      <div
        className="rounded-2xl p-5 text-center"
        style={{ background: 'linear-gradient(135deg, #1e1a14 0%, #2a2215 100%)', border: '1px solid rgba(201,169,110,0.2)' }}
      >
        <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: '#c9a96e' }}>Ma cagnotte</p>
        <div className="text-4xl font-bold" style={{ color: '#e8e3dc' }}>
          {(balanceCents / 100).toFixed(0)}€
        </div>
        <p className="text-xs mt-1" style={{ color: '#6b6b6b' }}>
          {completedCount} parrainage{completedCount !== 1 ? 's' : ''} validé{completedCount !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Code + share */}
      <div className="rounded-2xl border p-5 space-y-4" style={{ background: '#161616', borderColor: '#2a2a2a' }}>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#6b6b6b' }}>
            Mon code
          </p>
          <div
            className="flex items-center justify-between px-4 py-3 rounded-xl border"
            style={{ background: '#0d0d0d', borderColor: '#2a2a2a' }}
          >
            <span className="text-2xl font-bold tracking-widest" style={{ color: '#c9a96e' }}>
              {referralCode}
            </span>
            <button
              onClick={copyCode}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
              style={{ background: 'rgba(201,169,110,0.12)', color: '#c9a96e' }}
            >
              {copied ? <CheckCircle className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copié !' : 'Copier'}
            </button>
          </div>
        </div>
        <button
          onClick={share}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all active:scale-[0.98]"
          style={{ background: '#c9a96e', color: '#0d0d0d' }}
        >
          <Share2 className="w-4 h-4" />
          Partager mon lien
        </button>
      </div>

      {/* Comment ça marche */}
      <div className="rounded-2xl border p-5 space-y-3" style={{ background: '#161616', borderColor: '#2a2a2a' }}>
        <p className="text-sm font-bold" style={{ color: '#e8e3dc' }}>Comment ça marche ?</p>
        {[
          { icon: Share2,      step: '1', text: 'Partage ton lien ou code à un ami' },
          { icon: Calendar,    step: '2', text: 'Il réserve une séance chez n\'importe quel tatoueur Inkflow → -10€ pour lui' },
          { icon: CheckCircle, step: '3', text: 'Une fois sa séance terminée → +10€ dans ton wallet' },
        ].map(({ icon: Icon, step, text }) => (
          <div key={step} className="flex items-start gap-3">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold"
              style={{ background: 'rgba(201,169,110,0.12)', color: '#c9a96e' }}
            >
              {step}
            </div>
            <p className="text-sm pt-0.5" style={{ color: '#a0998f' }}>{text}</p>
          </div>
        ))}
        <p className="text-xs pt-1" style={{ color: '#6b6b6b' }}>
          Les crédits sont cumulables et utilisables chez tous les studios Inkflow.
        </p>
      </div>

      {/* Historique */}
      {referrals.length > 0 && (
        <div className="rounded-2xl border overflow-hidden" style={{ background: '#161616', borderColor: '#2a2a2a' }}>
          <div className="px-5 py-3 border-b" style={{ borderColor: '#2a2a2a' }}>
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#6b6b6b' }}>
              Historique ({referrals.length})
            </p>
          </div>
          {referrals.slice(0, 10).map((r, i) => (
            <div
              key={i}
              className="flex items-center justify-between px-5 py-3 border-b last:border-0"
              style={{ borderColor: '#2a2a2a' }}
            >
              <div>
                <p className="text-sm" style={{ color: '#e8e3dc' }}>
                  {r.referee_email.replace(/(.{3}).+(@.+)/, '$1…$2')}
                </p>
                <p className="text-xs" style={{ color: '#6b6b6b' }}>
                  {new Date(r.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                </p>
              </div>
              <span
                className="text-xs font-semibold px-2 py-1 rounded-full"
                style={r.status === 'completed'
                  ? { background: 'rgba(52,211,153,0.1)', color: '#34d399' }
                  : { background: 'rgba(251,191,36,0.1)', color: '#fbbf24' }}
              >
                {r.status === 'completed' ? '+10€' : 'En attente'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ── Main component ────────────────────────────────────────────────────────────

export const ClientDashboard: React.FC = () => {
  const [tab, setTab] = useState<Tab>('home');
  const [sessionEmail, setSessionEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [appointments, setAppointments] = useState<ClientAppointment[]>([]);
  const [balanceCents, setBalanceCents] = useState(0);
  const [referralCode, setReferralCode] = useState('');
  const [referrals, setReferrals] = useState<Array<{ referee_email: string; status: string; created_at: string }>>([]);

  // ── Auth guard ──────────────────────────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session?.user?.email) {
        window.location.href = '/client';
        return;
      }
      setSessionEmail(session.user.email);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user?.email) window.location.href = '/client';
      else setSessionEmail(session.user.email);
    });
    return () => subscription.unsubscribe();
  }, []);

  // ── Load data ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!sessionEmail) return;
    loadData(sessionEmail);
  }, [sessionEmail]);

  const loadData = async (email: string) => {
    setLoading(true);
    try {
      // Appointments (joined with studios for name)
      const { data: apts } = await supabase
        .from('inkflow_appointments')
        .select('id, date, time, service, status, price, notes, studio_id, inkflow_studios(studio_name, slug)')
        .eq('client_email', email)
        .order('date', { ascending: false })
        .limit(50);

      setAppointments(
        (apts ?? []).map((a: any) => ({
          id: a.id,
          date: a.date,
          time: a.time,
          service: a.service,
          status: a.status,
          price: a.price ?? 0,
          notes: a.notes,
          studio_name: a.inkflow_studios?.studio_name,
          studio_slug: a.inkflow_studios?.slug,
        }))
      );

      // Wallet
      const { data: walletData } = await supabase
        .from('inkflow_client_wallets')
        .select('balance_cents')
        .eq('email', email)
        .maybeSingle();
      setBalanceCents(walletData?.balance_cents ?? 0);

      // Referral code — create if not exists
      let { data: codeData } = await supabase
        .from('inkflow_client_codes')
        .select('code')
        .eq('email', email)
        .maybeSingle();

      if (!codeData) {
        const code = generateCode(email);
        await supabase.from('inkflow_client_codes').insert({ email, code });
        setReferralCode(code);
      } else {
        setReferralCode(codeData.code);
      }

      // Referrals
      const { data: refData } = await supabase
        .from('inkflow_client_referrals')
        .select('referee_email, status, created_at')
        .eq('referrer_email', email)
        .order('created_at', { ascending: false });
      setReferrals(refData ?? []);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/client';
  };

  // ── Derived data ────────────────────────────────────────────────────────────
  const upcoming = useMemo(
    () => appointments.filter((a) => ['pending', 'confirmed', 'in_progress'].includes(a.status)),
    [appointments]
  );

  const completed = useMemo(
    () => appointments.filter((a) => a.status === 'completed'),
    [appointments]
  );

  const lastTattoo = completed[0] ?? null;
  const firstName = sessionEmail?.split('@')[0] ?? 'toi';

  // ── Loading state ────────────────────────────────────────────────────────────
  if (loading || !sessionEmail) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0d0d0d' }}>
        <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: '#2a2a2a', borderTopColor: '#c9a96e' }} />
      </div>
    );
  }

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen" style={{ background: '#0d0d0d', color: '#e8e3dc' }}>

      {/* Header */}
      <header
        className="sticky top-0 z-10 flex items-center justify-between px-4 py-4 border-b"
        style={{ background: 'rgba(13,13,13,0.95)', backdropFilter: 'blur(12px)', borderColor: '#2a2a2a' }}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: '#c9a96e' }}>
            <Sparkles className="w-4 h-4" style={{ color: '#0d0d0d' }} />
          </div>
          <span className="font-bold text-sm" style={{ color: '#e8e3dc' }}>My Inkflow</span>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl transition-all"
          style={{ color: '#6b6b6b', background: 'rgba(42,42,42,0.5)' }}
        >
          <LogOut className="w-3.5 h-3.5" />
          Déconnexion
        </button>
      </header>

      {/* Content */}
      <main className="max-w-lg mx-auto">

        {/* ── HOME TAB ─────────────────────────────────────────────────────── */}
        {tab === 'home' && (
          <div className="space-y-5 px-4 pt-5 pb-24">
            {/* Greeting */}
            <div>
              <h1 className="text-xl font-bold" style={{ color: '#e8e3dc' }}>
                Bonjour {firstName.charAt(0).toUpperCase() + firstName.slice(1)} 👋
              </h1>
              <p className="text-sm mt-0.5" style={{ color: '#6b6b6b' }}>
                {sessionEmail}
              </p>
            </div>

            {/* Wallet */}
            <WalletCard balanceCents={balanceCents} onParrainage={() => setTab('parrainage')} />

            {/* Cicatrisation timeline */}
            {lastTattoo && <HealingTimeline lastTattooDate={lastTattoo.date} service={lastTattoo.service} />}

            {/* Prochains RDV */}
            <section>
              <h2 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: '#6b6b6b' }}>
                <Calendar className="w-4 h-4" />
                Prochains rendez-vous
              </h2>
              {upcoming.length === 0 ? (
                <div
                  className="rounded-2xl border p-6 text-center"
                  style={{ background: '#161616', borderColor: '#2a2a2a' }}
                >
                  <Calendar className="w-8 h-8 mx-auto mb-2" style={{ color: '#2a2a2a' }} />
                  <p className="text-sm" style={{ color: '#6b6b6b' }}>
                    Aucun RDV prévu
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {upcoming.map((apt) => <AppointmentCard key={apt.id} apt={apt} />)}
                </div>
              )}
            </section>

            {/* Derniers tatouages (aperçu) */}
            {completed.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-semibold flex items-center gap-2" style={{ color: '#6b6b6b' }}>
                    <Image className="w-4 h-4" />
                    Mes tatouages
                  </h2>
                  <button
                    onClick={() => setTab('portfolio')}
                    className="flex items-center gap-1 text-xs font-medium"
                    style={{ color: '#c9a96e' }}
                  >
                    Voir tout <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="space-y-2">
                  {completed.slice(0, 2).map((apt) => <AppointmentCard key={apt.id} apt={apt} />)}
                </div>
              </section>
            )}
          </div>
        )}

        {/* ── PORTFOLIO TAB ────────────────────────────────────────────────── */}
        {tab === 'portfolio' && (
          <div className="space-y-4 px-4 pt-5 pb-24">
            <h2 className="text-xl font-bold" style={{ color: '#e8e3dc' }}>
              Mon Portfolio
              <span className="text-sm font-normal ml-2" style={{ color: '#6b6b6b' }}>
                {appointments.length} séance{appointments.length !== 1 ? 's' : ''}
              </span>
            </h2>

            {appointments.length === 0 ? (
              <div
                className="rounded-2xl border p-10 text-center"
                style={{ background: '#161616', borderColor: '#2a2a2a' }}
              >
                <Image className="w-10 h-10 mx-auto mb-3" style={{ color: '#2a2a2a' }} />
                <p className="text-sm" style={{ color: '#6b6b6b' }}>
                  Ton historique de tatouages apparaîtra ici
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {appointments.map((apt) => <AppointmentCard key={apt.id} apt={apt} />)}
              </div>
            )}
          </div>
        )}

        {/* ── PARRAINAGE TAB ───────────────────────────────────────────────── */}
        {tab === 'parrainage' && (
          <div className="pt-5">
            <div className="px-4 mb-5">
              <h2 className="text-xl font-bold" style={{ color: '#e8e3dc' }}>Parrainage</h2>
              <p className="text-sm mt-0.5" style={{ color: '#6b6b6b' }}>
                Invite tes amis — gagnez tous les deux
              </p>
            </div>
            <ParrainageTab
              email={sessionEmail}
              referralCode={referralCode}
              balanceCents={balanceCents}
              referrals={referrals}
            />
          </div>
        )}
      </main>

      {/* Bottom nav */}
      <nav
        className="fixed bottom-0 left-0 right-0 flex items-center border-t"
        style={{
          background: 'rgba(13,13,13,0.97)',
          backdropFilter: 'blur(12px)',
          borderColor: '#2a2a2a',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
      >
        {(
          [
            { id: 'home' as Tab,      icon: Home,  label: 'Accueil'    },
            { id: 'portfolio' as Tab, icon: Image, label: 'Portfolio'  },
            { id: 'parrainage' as Tab,icon: Gift,  label: 'Parrainage' },
          ] as const
        ).map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className="flex-1 flex flex-col items-center gap-1 py-3 transition-all"
            style={{ color: tab === id ? '#c9a96e' : '#6b6b6b' }}
          >
            <Icon className="w-5 h-5" strokeWidth={tab === id ? 2.2 : 1.6} />
            <span className="text-[10px] font-semibold tracking-wide">{label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
};
