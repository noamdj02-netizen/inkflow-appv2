import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Calendar,
  Check,
  Clock,
  CreditCard,
  Download,
  Mail,
  MapPin,
  Sparkles,
  User,
} from 'lucide-react';
import { SEO } from '../../components/SEO';
import { LANDING_URL } from '../../lib/urls';
import { getVitrineDataBySlugAsync } from '../../lib/vitrineStorage';
import type { VitrineData } from '../../types/vitrine';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

interface PaymentSessionData {
  clientName: string;
  clientEmail: string;
  amount: number;
  type: string;
  serviceName: string | null;
  studioName: string;
  appointment: {
    date: string;
    time: string;
    service: string;
    location: string | null;
    duration: number;
  } | null;
}

function formatDateLong(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

function formatDateShort(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  return d
    .toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })
    .replace(/^./, (c) => c.toUpperCase())
    .replace('.', '');
}

function formatTime(time: string): string {
  return time.replace(':', 'h');
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h} h ${m} min` : `${h} h`;
}

function paymentTypeLabel(type: string): string {
  if (type === 'full_payment') return 'Paiement intégral';
  return 'Acompte';
}

function buildGoogleCalendarUrl(apt: {
  date: string;
  time: string;
  service: string;
  location: string | null;
  duration: number;
}): string {
  const [year, month, day] = apt.date.split('-').map(Number);
  const [hour, min] = (apt.time || '09:00').split(':').map(Number);
  const start = new Date(year, month - 1, day, hour, min, 0);
  const end = new Date(start.getTime() + (apt.duration || 60) * 60 * 1000);
  const fmt = (d: Date) => d.toISOString().replaceAll('-', '').replaceAll(':', '').split('.')[0] + 'Z';
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: apt.service,
    dates: `${fmt(start)}/${fmt(end)}`,
    details: `Rendez-vous tatouage - ${apt.service}`,
    location: apt.location || '',
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function buildIcsBlob(
  apt: { date: string; time: string; service: string; location: string | null; duration: number },
  studioName: string,
): Blob {
  const [year, month, day] = apt.date.split('-').map(Number);
  const [hour, min] = (apt.time || '09:00').split(':').map(Number);
  const start = new Date(year, month - 1, day, hour, min, 0);
  const end = new Date(start.getTime() + (apt.duration || 60) * 60 * 1000);
  const fmt = (d: Date) => d.toISOString().replaceAll('-', '').replaceAll(':', '').split('.')[0] + 'Z';
  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//InkFlow//Reservation//FR',
    'BEGIN:VEVENT',
    `DTSTART:${fmt(start)}`,
    `DTEND:${fmt(end)}`,
    `SUMMARY:${apt.service.replace(/\n/g, ' ')}`,
    `DESCRIPTION:Rendez-vous tatouage chez ${studioName}`,
    `LOCATION:${(apt.location || '').replace(/\n/g, ' ')}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
  return new Blob([ics], { type: 'text/calendar;charset=utf-8' });
}

export const ReservationSuccessPage: React.FC = () => {
  const [data, setData] = useState<PaymentSessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sessionIdShort, setSessionIdShort] = useState<string | null>(null);
  const [studioSlug, setStudioSlug] = useState<string | null>(null);
  const [vitrine, setVitrine] = useState<VitrineData | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const slug = params.get('studio')?.trim() || null;
    setStudioSlug(slug);
    const sessionId = params.get('session_id');
    if (sessionId && sessionId.length > 12) {
      setSessionIdShort(`…${sessionId.slice(-10)}`);
    }
    if (!sessionId) {
      setError('Session de paiement introuvable.');
      setLoading(false);
      return;
    }
    const fnUrl = `${supabaseUrl.replace(/\/$/, '')}/functions/v1/get-payment-session?session_id=${encodeURIComponent(sessionId)}`;
    fetch(fnUrl, {
      headers: supabaseKey
        ? {
            Authorization: `Bearer ${supabaseKey}`,
            apikey: supabaseKey,
          }
        : {},
    })
      .then(async (r) => {
        const res = (await r.json().catch(() => ({}))) as PaymentSessionData & { error?: string };
        if (!r.ok || res.error) {
          setError(
            res.error ||
              (r.status === 503
                ? 'Synchronisation en cours. Réessaie dans quelques secondes.'
                : 'Impossible de charger les détails.'),
          );
          return;
        }
        setData(res as PaymentSessionData);
      })
      .catch(() => setError('Impossible de charger les détails.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!studioSlug) return;
    getVitrineDataBySlugAsync(studioSlug).then(setVitrine).catch(() => setVitrine(null));
  }, [studioSlug]);

  const handleDownloadIcs = () => {
    if (!data?.appointment) return;
    const blob = buildIcsBlob(data.appointment, data.studioName);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rdv-${data.appointment.date}.ics`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const displayName = vitrine?.name?.trim() || data?.studioName || 'Le studio';
  const coverImage = vitrine?.coverImage?.trim() || '';
  const avatarUrl = vitrine?.avatar?.trim() || '';
  const addressLine = vitrine?.address?.trim() || '';
  const backToStudioHref = studioSlug ? `/studio/${studioSlug}` : LANDING_URL;
  const backLabel = studioSlug ? 'Retour au studio' : "Retour à l'accueil";

  const shell = (children: React.ReactNode, opts?: { ogImage?: string }) => (
    <div className="landing-scroll min-h-screen bg-zinc-50">
      <SEO
        title={error ? 'Confirmation | InkFlow' : 'RDV confirmé | InkFlow'}
        description={
          error
            ? 'Confirmation de réservation InkFlow.'
            : 'Votre acompte est enregistré et votre rendez-vous est confirmé.'
        }
        canonical="/reservation-succes"
        ogImage={opts?.ogImage || coverImage || avatarUrl || undefined}
        ogImageAlt={error ? 'InkFlow' : `Confirmation — ${displayName}`}
      />
      {coverImage ? (
        <div className="relative w-full h-40 sm:h-48 overflow-hidden bg-zinc-200">
          <img src={coverImage} alt="" className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-black/15 to-zinc-50" aria-hidden />
        </div>
      ) : null}

      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-zinc-100 safe-top">
        <div className="max-w-md mx-auto px-4 py-3">
          <a
            href={backToStudioHref}
            className="inline-flex items-center gap-2 text-zinc-600 hover:text-zinc-900 font-medium text-sm transition-colors active:scale-[0.98]"
          >
            <ArrowLeft className="w-5 h-5" strokeWidth={1.5} />
            {backLabel}
          </a>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 pb-28">{children}</main>
    </div>
  );

  if (loading) {
    return (
      <div className="landing-scroll min-h-screen bg-zinc-50 flex flex-col">
        <div className="h-36 sm:h-44 bg-zinc-200 animate-pulse" />
        <header className="border-b border-zinc-100 bg-white/95 px-4 py-3">
          <div className="max-w-md mx-auto h-5 w-32 bg-zinc-200 rounded animate-pulse" />
        </header>
        <div className="flex-1 flex items-center justify-center py-24">
          <div className="w-10 h-10 border-2 border-zinc-200 border-t-zinc-900 rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return shell(
      <>
        <section className="pt-10 pb-6 text-center">
          <div className="w-16 h-16 mx-auto rounded-full bg-red-100 flex items-center justify-center mb-4">
            <span className="text-red-600 text-2xl font-bold">!</span>
          </div>
          <h1 className="text-xl font-bold text-zinc-900 tracking-tight">Impossible d&apos;afficher la confirmation</h1>
          <p className="text-zinc-500 text-sm mt-2 max-w-sm mx-auto leading-relaxed">{error || 'Données introuvables.'}</p>
        </section>
        <a
          href={backToStudioHref}
          className="mt-6 flex w-full h-14 items-center justify-center rounded-xl bg-zinc-900 text-white font-semibold text-sm hover:bg-zinc-800 transition-colors active:scale-[0.98]"
        >
          {backLabel}
        </a>
      </>,
    );
  }

  const apt = data.appointment;
  const dateShort = apt ? formatDateShort(apt.date) : null;
  const dateLong = apt ? formatDateLong(apt.date) : null;
  const serviceLabel = apt?.service || data.serviceName || 'Prestation';
  const amountStr = `${data.amount % 1 === 0 ? data.amount : data.amount.toFixed(2)} €`;

  return shell(
    <>
      <section className={`text-center ${coverImage ? 'pt-4' : 'pt-8'} pb-6`}>
        <div className="w-24 h-24 mx-auto rounded-full overflow-hidden bg-zinc-200 border-2 border-white shadow-lg ring-2 ring-zinc-100 relative z-10">
          {avatarUrl ? (
            <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-zinc-100">
              <User className="w-11 h-11 text-zinc-400" strokeWidth={1.5} />
            </div>
          )}
        </div>
        <div className="mt-5 inline-flex items-center justify-center w-14 h-14 rounded-full bg-emerald-100 mb-3">
          <Check className="w-7 h-7 text-emerald-600" strokeWidth={2.5} />
        </div>
        <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Paiement confirmé</h1>
        <p className="text-zinc-500 text-sm mt-2 max-w-sm mx-auto leading-relaxed">
          {dateShort
            ? `Ton acompte pour le ${dateShort} est bien enregistré chez ${displayName}.`
            : `Ton paiement est bien enregistré chez ${displayName}.`}
        </p>
        <span className="inline-flex items-center gap-1.5 mt-4 px-3 py-1.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-100/80">
          <Sparkles className="w-3.5 h-3.5" strokeWidth={1.5} />
          Rappels automatiques J-1 et H-4
        </span>
      </section>

      {apt && dateLong && (
        <section className="mb-5 rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-zinc-700">
              <Clock className="w-5 h-5" strokeWidth={1.5} />
            </div>
            <div className="min-w-0 text-left">
              <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">Rendez-vous</p>
              <p className="text-base font-semibold text-zinc-900 capitalize mt-0.5">{dateLong}</p>
              <p className="text-sm text-zinc-600 mt-1">
                {formatTime(apt.time)} · {formatDuration(apt.duration || 60)}
              </p>
              {apt.location ? (
                <p className="text-sm text-zinc-500 mt-2 flex items-start gap-1.5">
                  <MapPin className="w-4 h-4 shrink-0 mt-0.5 text-zinc-400" strokeWidth={1.5} />
                  {apt.location}
                </p>
              ) : null}
            </div>
          </div>
        </section>
      )}

      <section className="rounded-2xl border border-zinc-100 bg-white shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-zinc-100 bg-zinc-50/80">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Récapitulatif</h2>
        </div>
        <ul className="divide-y divide-zinc-100">
          <li className="flex items-center justify-between gap-3 px-5 py-4">
            <span className="text-sm text-zinc-500">Studio</span>
            <span className="text-sm font-semibold text-zinc-900 text-right">{displayName}</span>
          </li>
          {addressLine ? (
            <li className="flex items-start justify-between gap-3 px-5 py-4">
              <span className="text-sm text-zinc-500 shrink-0">Adresse</span>
              <span className="text-sm text-zinc-800 text-right leading-snug">{addressLine}</span>
            </li>
          ) : null}
          <li className="flex items-center justify-between gap-3 px-5 py-4">
            <span className="text-sm text-zinc-500">Prestation</span>
            <span className="text-sm font-medium text-zinc-900 text-right">{serviceLabel}</span>
          </li>
          <li className="flex items-center justify-between gap-3 px-5 py-4">
            <span className="text-sm text-zinc-500 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-zinc-400" strokeWidth={1.5} />
              {paymentTypeLabel(data.type)}
            </span>
            <span className="text-sm font-semibold text-emerald-600 tabular-nums">{amountStr}</span>
          </li>
          <li className="flex items-center justify-between gap-3 px-5 py-4">
            <span className="text-sm text-zinc-500">Client</span>
            <span className="text-sm font-medium text-zinc-900 text-right">{data.clientName}</span>
          </li>
          <li className="flex items-start justify-between gap-3 px-5 py-4">
            <span className="text-sm text-zinc-500 flex items-center gap-2 shrink-0">
              <Mail className="w-4 h-4 text-zinc-400" strokeWidth={1.5} />
              E-mail
            </span>
            <span className="text-sm text-zinc-800 text-right break-all">{data.clientEmail}</span>
          </li>
          {sessionIdShort ? (
            <li className="flex items-center justify-between gap-3 px-5 py-3 bg-zinc-50/50">
              <span className="text-xs text-zinc-400">Réf. paiement</span>
              <span className="text-xs font-mono text-zinc-600">{sessionIdShort}</span>
            </li>
          ) : null}
        </ul>
      </section>

      {apt && (
        <div className="mt-5 flex gap-3">
          <a
            href={buildGoogleCalendarUrl(apt)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl text-sm font-semibold bg-white border border-zinc-200 text-zinc-900 hover:bg-zinc-50 transition-colors active:scale-[0.98]"
          >
            <Calendar className="w-4 h-4" strokeWidth={1.5} />
            Google Agenda
          </a>
          <button
            type="button"
            onClick={handleDownloadIcs}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl text-sm font-semibold bg-white border border-zinc-200 text-zinc-900 hover:bg-zinc-50 transition-colors active:scale-[0.98]"
          >
            <Download className="w-4 h-4" strokeWidth={1.5} />
            Apple / Outlook
          </button>
        </div>
      )}

      <a
        href={backToStudioHref}
        className="mt-5 flex w-full h-14 items-center justify-center rounded-xl bg-zinc-900 text-white font-semibold text-sm hover:bg-zinc-800 transition-colors active:scale-[0.98]"
      >
        {backLabel}
      </a>
    </>,
    { ogImage: coverImage || avatarUrl || undefined },
  );
};
