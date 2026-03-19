import React, { useEffect, useState } from 'react';
import { ArrowLeft, Mail, Check, Calendar, DollarSign, Clock, Star } from 'lucide-react';
import { Logo } from '../components/Logo';
import { LoginForm } from '../components/auth/LoginForm';
import { LANDING_URL } from '../lib/urls';

/* ── Floating notification cards data ── */
const NOTIFICATIONS = [
  {
    id: 1,
    type: 'accepted',
    client: 'Sophie D.',
    avatar: 'SD',
    color: 'from-violet-500 to-purple-600',
    bg: 'bg-white dark:bg-zinc-900',
    icon: <Check className="w-3.5 h-3.5 text-emerald-600" />,
    iconBg: 'bg-emerald-100',
    label: 'RDV confirmé',
    detail: 'Demain · 14h00 · Bras',
    time: 'Il y a 2 min',
  },
  {
    id: 2,
    type: 'new',
    client: 'Marc L.',
    avatar: 'ML',
    color: 'from-blue-500 to-indigo-600',
    bg: 'bg-white dark:bg-zinc-900',
    icon: <Calendar className="w-3.5 h-3.5 text-blue-600" />,
    iconBg: 'bg-blue-100',
    label: 'Nouvelle demande',
    detail: '22 mars · 16h30 · Dos',
    time: 'Il y a 8 min',
  },
  {
    id: 3,
    type: 'deposit',
    client: 'Jade T.',
    avatar: 'JT',
    color: 'from-amber-400 to-orange-500',
    bg: 'bg-white dark:bg-zinc-900',
    icon: <DollarSign className="w-3.5 h-3.5 text-amber-600" />,
    iconBg: 'bg-amber-100',
    label: 'Acompte reçu',
    detail: '80€ · Projet japonais',
    time: 'Il y a 15 min',
  },
  {
    id: 4,
    type: 'reminder',
    client: 'Lucas M.',
    avatar: 'LM',
    color: 'from-emerald-400 to-teal-500',
    bg: 'bg-white dark:bg-zinc-900',
    icon: <Clock className="w-3.5 h-3.5 text-emerald-600" />,
    iconBg: 'bg-emerald-100',
    label: 'RDV dans 1h',
    detail: 'Aujourd\'hui · 15h00',
    time: 'Il y a 1h',
  },
];

const CLIENTS = [
  { initials: 'SD', color: 'from-violet-500 to-purple-600', name: 'Sophie', rating: 5 },
  { initials: 'ML', color: 'from-blue-500 to-indigo-600', name: 'Marc', rating: 5 },
  { initials: 'JT', color: 'from-amber-400 to-orange-500', name: 'Jade', rating: 4 },
];

export const LoginPage: React.FC = () => {
  const [checkEmailMessage, setCheckEmailMessage] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('message') === 'check-email') {
      setCheckEmailMessage(true);
      window.history.replaceState({}, '', '/login');
    }
  }, []);

  return (
    <div className="min-h-screen flex bg-white dark:bg-black">

      {/* ── LEFT — Login Form ── */}
      <div className="flex-1 flex flex-col min-h-screen">
        <header className="p-4 sm:p-6 safe-top flex-shrink-0">
          <a
            href={LANDING_URL}
            className="inline-flex items-center gap-2 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
            target="_blank"
            rel="noopener noreferrer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Retour</span>
          </a>
        </header>

        <div className="flex-1 flex items-center justify-center px-6 sm:px-10 py-8 safe-bottom">
          <div className="w-full max-w-sm">
            {/* Logo + Title */}
            <div className="mb-8">
              <div className="inline-flex items-center gap-2 mb-6">
                <Logo className="dark:invert" />
                <span className="text-xl font-bold text-zinc-900 dark:text-white">InkFlow</span>
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white mb-1.5">
                Bon retour !
              </h1>
              <p className="text-zinc-500 dark:text-zinc-400 text-sm">
                Connectez-vous à votre compte
              </p>
            </div>

            {/* Email confirmation message */}
            {checkEmailMessage && (
              <div className="flex items-start gap-3 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 mb-5">
                <Mail className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-emerald-800 dark:text-emerald-200">
                    Compte créé ! Vérifiez votre boîte mail.
                  </p>
                  <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-0.5">
                    Cliquez sur le lien dans l&apos;email pour activer votre compte.
                  </p>
                </div>
              </div>
            )}

            <LoginForm />

            <p className="text-center mt-6 text-sm text-zinc-500 dark:text-zinc-400">
              Pas encore de compte ?{' '}
              <a
                href="/signup"
                className="font-semibold text-zinc-900 dark:text-white hover:text-zinc-700 dark:hover:text-zinc-200 underline underline-offset-2"
              >
                Créer un compte
              </a>
            </p>
          </div>
        </div>
      </div>

      {/* ── RIGHT — Decorative Panel (desktop only) ── */}
      <div className="hidden lg:flex lg:w-[520px] xl:w-[600px] bg-zinc-950 relative overflow-hidden flex-col">

        {/* Background subtle grid */}
        <div className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)',
            backgroundSize: '32px 32px'
          }}
        />

        {/* Background glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/4 w-[400px] h-[400px] bg-violet-600/20 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-blue-600/15 rounded-full blur-[80px] pointer-events-none" />

        {/* Content */}
        <div className="relative z-10 flex flex-col h-full p-10 justify-between">

          {/* Top label */}
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-medium text-zinc-400 uppercase tracking-widest">InkFlow · Live</span>
          </div>

          {/* Center — Clients + Notifications */}
          <div className="flex-1 flex items-center justify-center py-10">
            <div className="relative w-full max-w-[360px] mx-auto" style={{ height: '420px' }}>

              {/* ── Clients avatars ── */}
              {/* Avatar principal — centré */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                <div className={`w-24 h-24 rounded-3xl bg-gradient-to-br ${CLIENTS[0].color} flex items-center justify-center shadow-2xl shadow-violet-500/30 ring-4 ring-zinc-950`}>
                  <span className="text-3xl font-bold text-white">{CLIENTS[0].initials}</span>
                </div>
                <div className="mt-2 text-center">
                  <p className="text-white text-sm font-semibold">{CLIENTS[0].name}</p>
                  <div className="flex justify-center gap-0.5 mt-0.5">
                    {Array.from({ length: CLIENTS[0].rating }).map((_, i) => (
                      <Star key={i} className="w-3 h-3 text-amber-400 fill-amber-400" />
                    ))}
                  </div>
                </div>
              </div>

              {/* Avatar top-left */}
              <div className="absolute top-[60px] left-[30px]">
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${CLIENTS[1].color} flex items-center justify-center shadow-xl ring-4 ring-zinc-950`}>
                  <span className="text-xl font-bold text-white">{CLIENTS[1].initials}</span>
                </div>
                <p className="text-zinc-400 text-xs text-center mt-1.5 font-medium">{CLIENTS[1].name}</p>
              </div>

              {/* Avatar bottom-right */}
              <div className="absolute bottom-[60px] right-[20px]">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${CLIENTS[2].color} flex items-center justify-center shadow-xl ring-4 ring-zinc-950`}>
                  <span className="text-lg font-bold text-white">{CLIENTS[2].initials}</span>
                </div>
                <p className="text-zinc-400 text-xs text-center mt-1.5 font-medium">{CLIENTS[2].name}</p>
              </div>

              {/* ── Notification cards ── */}

              {/* Notif 1 — top right */}
              <div className="absolute top-[10px] right-[-10px] w-[210px] animate-float-slow">
                <NotifCard notif={NOTIFICATIONS[0]} />
              </div>

              {/* Notif 2 — middle left */}
              <div className="absolute top-[160px] left-[-20px] w-[200px] animate-float-medium">
                <NotifCard notif={NOTIFICATIONS[1]} />
              </div>

              {/* Notif 3 — bottom left */}
              <div className="absolute bottom-[30px] left-[10px] w-[195px] animate-float-slow2">
                <NotifCard notif={NOTIFICATIONS[2]} />
              </div>

              {/* Notif 4 — bottom right */}
              <div className="absolute bottom-[80px] right-[-5px] w-[185px] animate-float-medium2">
                <NotifCard notif={NOTIFICATIONS[3]} />
              </div>

            </div>
          </div>

          {/* Bottom tagline */}
          <div>
            <h2 className="text-white text-2xl font-bold leading-snug mb-2">
              Gérez vos RDV<br />
              <span className="text-zinc-400">sans effort.</span>
            </h2>
            <p className="text-zinc-500 text-sm">
              Notifications en temps réel · Paiements sécurisés · Vitrine intégrée
            </p>
          </div>
        </div>
      </div>

      {/* Float animations */}
      <style>{`
        @keyframes floatSlow {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        @keyframes floatMedium {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-6px); }
        }
        @keyframes floatSlow2 {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        @keyframes floatMedium2 {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-12px); }
        }
        .animate-float-slow { animation: floatSlow 4s ease-in-out infinite; }
        .animate-float-medium { animation: floatMedium 3.2s ease-in-out infinite 0.8s; }
        .animate-float-slow2 { animation: floatSlow2 4.5s ease-in-out infinite 1.5s; }
        .animate-float-medium2 { animation: floatMedium2 3.8s ease-in-out infinite 0.4s; }
      `}</style>
    </div>
  );
};

/* ── Notification card component ── */
function NotifCard({ notif }: { notif: typeof NOTIFICATIONS[0] }) {
  return (
    <div className="bg-zinc-900/90 backdrop-blur-md border border-zinc-700/60 rounded-2xl p-3 shadow-2xl">
      <div className="flex items-start gap-2.5">
        {/* Avatar */}
        <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${notif.color} flex items-center justify-center flex-shrink-0 shadow-lg`}>
          <span className="text-[10px] font-bold text-white">{notif.avatar}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className={`p-0.5 rounded-md ${notif.iconBg}`}>
              {notif.icon}
            </span>
            <span className="text-[11px] font-semibold text-white truncate">{notif.label}</span>
          </div>
          <p className="text-[10px] text-zinc-300 font-medium truncate">{notif.client} · {notif.detail}</p>
          <p className="text-[9px] text-zinc-500 mt-1">{notif.time}</p>
        </div>
      </div>
    </div>
  );
}
