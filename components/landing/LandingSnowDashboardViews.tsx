import React from 'react';
import { motion } from 'framer-motion';
import {
  AlertCircle,
  Calendar,
  CalendarCheck,
  CheckCircle,
  Clock,
  CreditCard,
  FileText,
  Inbox,
  Mail,
  MapPin,
  MessageCircle,
  PenLine,
  Ruler,
  Sparkles,
  Star,
  TrendingUp,
  User,
  Wallet,
  XCircle,
  Zap,
} from 'lucide-react';
import type { LandingDemoSceneId } from '@/hooks/useLandingDashboardDemoPlayback';
import {
  demoBody,
  demoBodyMuted,
  demoCaption,
  demoHeading,
  demoLabel,
  demoMicro,
  demoStat,
  demoStatSm,
  demoTitle,
  LANDING_DEMO_AVATARS,
  LandingDemoAvatar,
  LandingDemoBrandAvatar,
} from './landingDemoUi';
import { LandingDemoOverviewTable } from './LandingDemoOverviewTable';

const AVATAR_LEA = LANDING_DEMO_AVATARS.lea;
const AVATAR_TOM = LANDING_DEMO_AVATARS.tom;
const AVATAR_AMINA = LANDING_DEMO_AVATARS.amina;
const STRIPE_LOGO = '/images/stripe-logo-circle.png';

/* ─── Shared motion & chrome (dark #333 landing preview) ─── */

const pageMotion = {
  initial: { opacity: 0, x: 28 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -24 },
  transition: { duration: 0.38, ease: [0.22, 1, 0.36, 1] as const },
};

function SectionTitle({ children, count }: { children: React.ReactNode; count?: number }) {
  return (
    <h4 className={`px-0.5 ${demoMicro}`}>
      {children}
      {count != null ? <span className="ml-1 tabular-nums text-white/28">({count})</span> : null}
    </h4>
  );
}

function Panel({ className = '', children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={`rounded-[20px] border border-white/[0.08] bg-white/[0.04] ${className}`}>
      {children}
    </div>
  );
}

function StatusPill({
  children,
  tone = 'pending',
}: {
  children: React.ReactNode;
  tone?: 'pending' | 'active' | 'danger' | 'neutral' | 'vip';
}) {
  const cls =
    tone === 'pending'
      ? 'bg-amber-500/15 text-amber-400'
      : tone === 'active'
        ? 'bg-[#3b82f6]/15 text-[#60a5fa]'
        : tone === 'danger'
          ? 'bg-red-500/15 text-red-400'
          : tone === 'vip'
            ? 'bg-[#3b82f6]/15 text-[#60a5fa]'
            : 'bg-white/[0.06] text-white/50';
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 ${demoCaption} font-semibold ${cls}`}
    >
      {children}
    </span>
  );
}

function TagChip({
  icon: Icon,
  children,
  tone = 'amber',
}: {
  icon?: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  children: React.ReactNode;
  tone?: 'amber' | 'blue' | 'violet';
}) {
  const cls =
    tone === 'amber'
      ? 'bg-amber-500/15 text-amber-300'
      : tone === 'violet'
        ? 'bg-violet-500/15 text-violet-300'
        : 'bg-[#3b82f6]/15 text-[#93c5fd]';
  return (
    <span
      className={`inline-flex items-center gap-0.5 rounded-lg px-1.5 py-0.5 ${demoCaption} font-semibold ${cls}`}
    >
      {Icon ? <Icon className="size-2.5 shrink-0" strokeWidth={2} /> : null}
      {children}
    </span>
  );
}

function StatTile({
  value,
  label,
  icon: Icon,
}: {
  value: number | string;
  label: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
}) {
  return (
    <div className="relative flex min-h-[72px] flex-col justify-end overflow-hidden rounded-[20px] border border-white/[0.08] bg-white/[0.04] p-3 text-left">
      <span className="absolute right-2.5 top-2.5 flex size-7 items-center justify-center rounded-full bg-white/[0.06] text-[#60a5fa]">
        <Icon className="size-3.5" strokeWidth={2} />
      </span>
      <span className={`mt-4 block ${demoStat}`}>{value}</span>
      <span className={`mt-1 block ${demoLabel}`}>{label}</span>
    </div>
  );
}

function QuickActionBtn({
  label,
  icon: Icon,
  variant = 'secondary',
}: {
  label: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  variant?: 'primary' | 'secondary' | 'danger';
}) {
  const cls =
    variant === 'primary'
      ? 'bg-[#3b82f6] text-white'
      : variant === 'danger'
        ? 'border border-red-500/30 bg-transparent text-red-400'
        : 'border border-white/10 bg-white/[0.04] text-white/80';
  return (
    <button
      type="button"
      className={`flex min-h-[32px] flex-1 items-center justify-center gap-1 rounded-xl px-2 py-1.5 ${demoCaption} font-semibold transition-all active:scale-[0.98] ${cls}`}
    >
      <Icon className="size-3 shrink-0" strokeWidth={1.75} />
      <span className="truncate">{label}</span>
    </button>
  );
}

/* ─── Overview — aligné BentoHero + BentoPilotageQuickRow ─── */

export function LandingDemoOverviewView() {
  return (
    <motion.div {...pageMotion} className="space-y-2.5">
      <LandingDemoOverviewTable />

      <div className="grid grid-cols-2 gap-2">
        <StatTile value={3} label="RDV aujourd'hui" icon={CalendarCheck} />
        <StatTile value={5} label="Actions à traiter" icon={Inbox} />
      </div>

      <div className="flex items-start gap-2 rounded-[20px] border border-amber-500/25 bg-amber-500/[0.08] px-3 py-2.5">
        <AlertCircle className="mt-0.5 size-3.5 shrink-0 text-amber-400" strokeWidth={2} />
        <div className="min-w-0 flex-1">
          <p className={`${demoBody} font-medium text-amber-100/92`}>
            2 demandes sans réponse depuis +24 h
          </p>
          <button
            type="button"
            className={`mt-1.5 rounded-lg bg-[#3b82f6] px-2.5 py-1 ${demoCaption} font-semibold text-white`}
          >
            Ouvrir Demandes
          </button>
        </div>
      </div>

      <Panel className="divide-y divide-white/[0.06]">
        <div className="flex items-center gap-2.5 px-3 py-2">
          <LandingDemoBrandAvatar src={STRIPE_LOGO} alt="Stripe" size="xs" />
          <div className="min-w-0 flex-1">
            <p className={`truncate ${demoHeading}`}>Acompte 120 € — Léa M.</p>
            <p className={demoCaption}>Stripe · il y a 12 min</p>
          </div>
          <span className={`${demoHeading} text-emerald-400`}>+120 €</span>
        </div>
        <div className="flex items-center gap-2.5 px-3 py-2">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-zinc-600 text-[#60a5fa] ring-2 ring-[#333]">
            <Inbox className="size-3.5" strokeWidth={2} />
          </span>
          <div className="min-w-0 flex-1">
            <p className={`truncate ${demoHeading}`}>Nouvelle demande — Alice M.</p>
            <p className={demoCaption}>Vitrine · Flash · il y a 58 min</p>
          </div>
          <StatusPill tone="pending">En attente</StatusPill>
        </div>
      </Panel>
    </motion.div>
  );
}

/* ─── Demandes — aligné InboxTreatNextBar + RequestsDashboard ─── */

const INBOX_BOOKINGS = [
  {
    id: '1',
    name: 'Alice Martin',
    email: 'alice.martin@gmail.com',
    avatar: AVATAR_AMINA,
    type: 'flash' as const,
    placement: 'Bras',
    size: 'M',
    description: 'Flash bras — motif floral, ref. photo jointe sur la vitrine.',
    date: '9 août 2026',
    time: '14:00',
    status: 'pending' as const,
    sla: 'Répondre sous 2 h',
    accent: 'border-l-blue-400',
  },
  {
    id: '2',
    name: 'Tom Rousseau',
    email: 'tom.rousseau@outlook.fr',
    avatar: AVATAR_TOM,
    type: 'custom' as const,
    placement: 'Avant-bras',
    size: 'L',
    description: 'Mandala géométrique — projet sur-mesure, budget ~800 €.',
    date: '12 août 2026',
    time: 'Après-midi',
    status: 'pending' as const,
    sla: '+24 h',
    accent: 'border-l-blue-500',
  },
];

const INBOX_BRIEF = {
  name: 'Léa Dupont',
  email: 'lea.dupont@icloud.com',
  avatar: AVATAR_LEA,
  description: 'Bras japonais — brief sans date, refs Instagram @lea.d.',
  placement: 'Bras complet',
  status: 'pending' as const,
};

function InboxBookingRow({
  row,
  index,
  featured,
}: {
  row: (typeof INBOX_BOOKINGS)[0];
  index: number;
  featured?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.32 }}
      className={`overflow-hidden rounded-[20px] border border-white/[0.08] bg-white/[0.03] border-l-4 ${row.accent}`}
    >
      <div className="flex gap-2.5 p-2.5 sm:p-3">
        <LandingDemoAvatar src={row.avatar} alt={row.name} size="lg" />
        <div className="min-w-0 flex-1">
          <p className={demoTitle}>{row.name}</p>
          <p className={`mt-0.5 flex items-center gap-1 ${demoCaption}`}>
            <Mail className="size-2.5 shrink-0" />
            <span className="truncate">{row.email}</span>
          </p>
          <div className="mt-1.5 flex flex-wrap gap-1">
            <TagChip icon={row.type === 'flash' ? Sparkles : FileText} tone="amber">
              {row.type === 'flash' ? 'Flash' : 'Sur-mesure'}
            </TagChip>
            <TagChip icon={MapPin} tone="blue">
              {row.placement}
            </TagChip>
            <TagChip icon={Ruler} tone="violet">
              {row.size}
            </TagChip>
          </div>
          <p className={`mt-1.5 line-clamp-2 ${demoBody}`}>{row.description}</p>
          <div className={`mt-1.5 flex flex-wrap gap-1 tabular-nums ${demoCaption}`}>
            <span className="rounded bg-white/[0.06] px-1.5 py-0.5">{row.date}</span>
            <span className="rounded bg-white/[0.06] px-1.5 py-0.5">{row.time}</span>
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-1">
            <StatusPill tone="pending">En attente</StatusPill>
            {row.sla ? (
              <span
                className={`inline-flex items-center gap-0.5 rounded-full bg-red-500/15 px-1.5 py-0.5 ${demoCaption} font-bold text-red-400`}
              >
                <Clock className="size-2.5" strokeWidth={2} />
                {row.sla}
              </span>
            ) : null}
          </div>
        </div>
        {featured ? (
          <button
            type="button"
            className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-white/[0.06] text-[#60a5fa]"
            aria-label="Fiche client"
          >
            <User className="size-4" strokeWidth={2} />
          </button>
        ) : null}
      </div>

      {featured ? (
        <div className="border-t border-white/[0.06] bg-white/[0.02] p-2.5">
          <p className={`mb-1.5 ${demoMicro} text-white/32`}>Actions pour cette demande vitrine</p>
          <div className="flex flex-wrap gap-1.5">
            <QuickActionBtn label="Confirmer" icon={CheckCircle} variant="primary" />
            <QuickActionBtn label="Acompte (Stripe)" icon={CreditCard} />
            <QuickActionBtn label="Refuser" icon={XCircle} variant="danger" />
            <QuickActionBtn label="Messagerie" icon={MessageCircle} />
          </div>
        </div>
      ) : null}
    </motion.div>
  );
}

export function LandingDemoRequestsView() {
  return (
    <motion.div {...pageMotion} className="space-y-2">
      {/* Onglets CapsuleTabs style */}
      <div className="flex gap-1 rounded-xl bg-white/[0.04] p-0.5">
        <span
          className={`flex-1 rounded-lg bg-[#3b82f6] px-2 py-1 text-center ${demoCaption} font-semibold text-white`}
        >
          À traiter
        </span>
        <span
          className={`flex-1 rounded-lg px-2 py-1 text-center ${demoCaption} font-medium text-white/42`}
        >
          Historique
        </span>
      </div>

      {/* InboxTreatNextBar */}
      <div className="rounded-[20px] border border-[#3b82f6]/30 bg-gradient-to-r from-[#3b82f6]/15 to-white/[0.03] p-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className={`${demoMicro} text-[#60a5fa]`}>Action immédiate</p>
            <p className={`truncate ${demoTitle}`}>Alice Martin</p>
            <p className={demoCaption}>Vitrine · Flash · 5 en attente</p>
          </div>
          <button
            type="button"
            className={`inline-flex shrink-0 items-center gap-1 rounded-xl bg-[#3b82f6] px-2.5 py-1.5 ${demoCaption} font-semibold text-white shadow-sm`}
          >
            <Zap className="size-3" strokeWidth={2} />
            Confirmer
          </button>
        </div>
      </div>

      <SectionTitle count={INBOX_BOOKINGS.length}>Page book</SectionTitle>
      <div className="space-y-2">
        <InboxBookingRow row={INBOX_BOOKINGS[0]!} index={0} featured />
        <InboxBookingRow row={INBOX_BOOKINGS[1]!} index={1} />
      </div>

      <SectionTitle count={1}>Brief sans date</SectionTitle>
      <div className="overflow-hidden rounded-[20px] border border-white/[0.08] border-l-4 border-l-blue-600 bg-white/[0.03] p-2.5">
        <div className="flex gap-2.5">
          <LandingDemoAvatar src={INBOX_BRIEF.avatar} alt={INBOX_BRIEF.name} size="lg" />
          <div className="min-w-0 flex-1">
            <p className={demoTitle}>{INBOX_BRIEF.name}</p>
            <p className={`mt-0.5 flex items-center gap-1 ${demoCaption}`}>
              <Mail className="size-2.5" />
              {INBOX_BRIEF.email}
            </p>
            <div className="mt-1.5 flex flex-wrap gap-1">
              <TagChip icon={FileText} tone="amber">
                Sur-mesure
              </TagChip>
              <TagChip icon={MapPin} tone="blue">
                {INBOX_BRIEF.placement}
              </TagChip>
            </div>
            <p className={`mt-1.5 line-clamp-1 ${demoBody}`}>{INBOX_BRIEF.description}</p>
            <div className="mt-1.5">
              <StatusPill tone="neutral">Nouvelle</StatusPill>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Planning — aligné AppointmentsView + AppointmentDayList ─── */

const WEEK_APPOINTMENTS = [
  {
    time: '10:00',
    client: 'Léa Martin',
    service: 'Consultation flash',
    status: 'Confirmé',
    tone: 'active' as const,
    avatar: AVATAR_LEA,
  },
  {
    time: '14:00',
    client: 'Tom Rousseau',
    service: 'Séance 2 h — mandala',
    status: 'Acompte OK',
    tone: 'active' as const,
    avatar: AVATAR_TOM,
  },
  {
    time: '17:30',
    client: 'Amina K.',
    service: 'Retouche avant-bras',
    status: 'En attente',
    tone: 'pending' as const,
    avatar: AVATAR_AMINA,
  },
];

export function LandingDemoAgendaView() {
  return (
    <motion.div {...pageMotion} className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        <span
          className={`rounded-xl border border-white/10 bg-white/[0.04] px-2.5 py-1 ${demoCaption} font-medium text-white/52`}
        >
          Aujourd&apos;hui
        </span>
        <span
          className={`rounded-xl bg-[#3b82f6] px-2.5 py-1 ${demoCaption} font-semibold text-white`}
        >
          Semaine
        </span>
        <span
          className={`rounded-xl border border-white/10 bg-white/[0.04] px-2.5 py-1 ${demoCaption} font-medium text-white/52`}
        >
          Mois
        </span>
      </div>

      <Panel className="px-3 py-2">
        <p className={demoBodyMuted}>
          <span className={`${demoHeading} text-white/85`}>3 RDV</span> cette semaine · 2 confirmés
          · 1 en attente d&apos;acompte
        </p>
      </Panel>

      <div className="divide-y divide-white/[0.06] rounded-[20px] border border-white/[0.08] bg-white/[0.03]">
        {WEEK_APPOINTMENTS.map((apt, i) => (
          <motion.div
            key={apt.time}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.08, duration: 0.3 }}
            className="group flex items-center gap-2.5 px-3 py-2.5"
          >
            <span className={`w-10 shrink-0 ${demoHeading} tabular-nums`}>{apt.time}</span>
            <LandingDemoAvatar src={apt.avatar} alt={apt.client} size="sm" />
            <div className="min-w-0 flex-1">
              <p className={`truncate ${demoHeading}`}>{apt.client}</p>
              <p className={`truncate ${demoCaption}`}>{apt.service}</p>
            </div>
            <StatusPill tone={apt.tone}>{apt.status}</StatusPill>
          </motion.div>
        ))}
      </div>

      <div className="flex items-center gap-2 rounded-[20px] border border-white/[0.08] bg-white/[0.03] px-3 py-2">
        <Calendar className="size-3.5 shrink-0 text-[#60a5fa]" strokeWidth={2} />
        <p className={demoCaption}>
          Prochain créneau libre :{' '}
          <span className={`${demoHeading} text-white/78`}>Jeudi 14:00</span>
        </p>
      </div>
    </motion.div>
  );
}

/* ─── Clients — aligné ClientList KPI + rows ─── */

const DEMO_CLIENTS = [
  {
    name: 'Léa Martin',
    email: 'lea.martin@gmail.com',
    visits: 4,
    spent: '1 240 €',
    status: 'vip' as const,
    avatar: AVATAR_LEA,
    lastVisit: '3 août',
  },
  {
    name: 'Tom Rousseau',
    email: 'tom.rousseau@outlook.fr',
    visits: 2,
    spent: '680 €',
    status: 'active' as const,
    avatar: AVATAR_TOM,
    lastVisit: '28 juil.',
  },
  {
    name: 'Amina K.',
    email: 'amina.k@yahoo.fr',
    visits: 1,
    spent: '120 €',
    status: 'new' as const,
    avatar: AVATAR_AMINA,
    lastVisit: '1er août',
  },
];

export function LandingDemoClientsView() {
  return (
    <motion.div {...pageMotion} className="space-y-2">
      <div className="grid grid-cols-3 gap-1.5">
        {[
          { label: 'Clients', value: '47', icon: User },
          { label: 'CA cumulé', value: '18,4 k€', icon: Wallet },
          { label: 'VIP', value: '6', icon: Star },
        ].map((kpi) => (
          <div
            key={kpi.label}
            className="rounded-[16px] border border-white/[0.08] bg-white/[0.04] p-2"
          >
            <kpi.icon className="size-3 text-[#60a5fa]" strokeWidth={2} />
            <p className={`mt-1 ${demoStatSm}`}>{kpi.value}</p>
            <p className={demoLabel}>{kpi.label}</p>
          </div>
        ))}
      </div>

      <div className="relative">
        <SearchBarPlaceholder />
      </div>

      <div className="divide-y divide-white/[0.06] rounded-[20px] border border-white/[0.08] bg-white/[0.03]">
        {DEMO_CLIENTS.map((c, i) => (
          <motion.div
            key={c.name}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07, duration: 0.28 }}
            className="flex items-center gap-2.5 px-3 py-2.5"
          >
            <LandingDemoAvatar src={c.avatar} alt={c.name} size="sm" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1">
                <p className={`truncate ${demoHeading}`}>{c.name}</p>
                {c.status === 'vip' ? (
                  <StatusPill tone="vip">
                    <Star className="mr-0.5 size-2 fill-current" />
                    VIP
                  </StatusPill>
                ) : c.status === 'new' ? (
                  <StatusPill tone="neutral">Nouveau</StatusPill>
                ) : null}
              </div>
              <p className={`truncate ${demoCaption}`}>{c.email}</p>
              <div className={`mt-1 flex flex-wrap gap-x-2 tabular-nums ${demoCaption}`}>
                <span className="text-white/58">{c.visits} RDV</span>
                <span className={`${demoHeading} text-emerald-400`}>{c.spent}</span>
                <span className="text-white/38">· {c.lastVisit}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

function SearchBarPlaceholder() {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-2.5 py-1.5">
      <span className={demoCaption}>Rechercher un client…</span>
    </div>
  );
}

/* ─── Finance — aligné FinanceSectionCards + FinanceRecentDepositsList ─── */

const FINANCE_KPIS = [
  { label: 'Total encaissé', value: '6 840 €', delta: '+18,2 %', hint: 'RDV terminés + espèces' },
  { label: 'Acomptes reçus', value: '4 280 €', delta: '+22,3 %', hint: 'Stripe · vitrine & book' },
  { label: 'Espèces', value: '980 €', delta: '+4,1 %', hint: 'Séances terminées' },
  { label: 'En attente', value: '230 €', delta: '2 liens', hint: 'Liens acompte ouverts' },
];

const RECENT_DEPOSITS = [
  {
    client: 'Léa Martin',
    kind: 'flash' as const,
    amount: '120 €',
    time: 'Aujourd’hui 09:42',
    stripe: true,
  },
  {
    client: 'Tom Rousseau',
    kind: 'projet' as const,
    amount: '80 €',
    time: 'Hier 16:20',
    stripe: true,
  },
  {
    client: 'Alice Martin',
    kind: 'book' as const,
    amount: '150 €',
    time: 'En attente',
    stripe: false,
  },
];

function DepositKindIcon({ kind }: { kind: 'flash' | 'projet' | 'book' }) {
  const Icon = kind === 'flash' ? Zap : kind === 'projet' ? PenLine : CreditCard;
  return (
    <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-zinc-600 text-white/75 ring-2 ring-[#333]">
      <Icon className="size-3.5" strokeWidth={2} />
    </span>
  );
}

export function LandingDemoFinanceView() {
  return (
    <motion.div {...pageMotion} className="space-y-2">
      <div className="grid grid-cols-2 gap-1.5">
        {FINANCE_KPIS.map((kpi, i) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, duration: 0.28 }}
            className="rounded-[16px] border border-white/[0.08] bg-gradient-to-t from-[#3b82f6]/10 to-white/[0.04] p-2.5"
          >
            <p className={demoLabel}>{kpi.label}</p>
            <div className="mt-0.5 flex items-start justify-between gap-1">
              <p className={demoStatSm}>{kpi.value}</p>
              <span
                className={`inline-flex items-center gap-0.5 rounded-md border border-white/10 px-1 py-0.5 ${demoCaption} text-emerald-400`}
              >
                <TrendingUp className="size-2.5" />
                {kpi.delta}
              </span>
            </div>
            <p className={demoCaption}>{kpi.hint}</p>
          </motion.div>
        ))}
      </div>

      <Panel>
        <div className="border-b border-white/[0.06] px-3 py-2">
          <p className={demoHeading}>Derniers acomptes</p>
          <p className={demoCaption}>Paiements Stripe encaissés sur la période</p>
        </div>
        <ul className="divide-y divide-white/[0.06]">
          {RECENT_DEPOSITS.map((d, i) => (
            <motion.li
              key={d.client}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08, duration: 0.28 }}
              className="flex items-center gap-2.5 px-3 py-2"
            >
              {d.stripe ? (
                <LandingDemoBrandAvatar src={STRIPE_LOGO} alt="Stripe" size="sm" />
              ) : (
                <DepositKindIcon kind={d.kind} />
              )}
              <div className="min-w-0 flex-1">
                <p className={`truncate ${demoHeading}`}>{d.client}</p>
                <p className={demoCaption}>{d.time}</p>
              </div>
              <div className="text-right">
                <p className={`${demoHeading} tabular-nums`}>{d.amount}</p>
                <p className={`${demoCaption} ${d.stripe ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {d.stripe ? 'Encaissé' : 'En attente'}
                </p>
              </div>
            </motion.li>
          ))}
        </ul>
      </Panel>
    </motion.div>
  );
}

export function LandingDemoMainView({ sceneId }: { sceneId: LandingDemoSceneId }) {
  switch (sceneId) {
    case 'requests':
      return <LandingDemoRequestsView />;
    case 'appointments':
      return <LandingDemoAgendaView />;
    case 'clients':
      return <LandingDemoClientsView />;
    case 'finance':
      return <LandingDemoFinanceView />;
    default:
      return <LandingDemoOverviewView />;
  }
}
