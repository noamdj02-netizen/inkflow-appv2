import React, { useState, useEffect } from 'react';
import { Calendar, Download } from 'lucide-react';
import { SEO } from '../../components/SEO';
import { LANDING_URL } from '../../lib/urls';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

interface PaymentSessionData {
  clientName: string;
  clientEmail: string;
  amount: number;
  type: string;
  serviceName: string;
  studioName: string;
  appointment: {
    date: string;
    time: string;
    service: string;
    location: string | null;
    duration: number;
  } | null;
}

function formatDateShort(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })
    .replace(/^./, (c) => c.toUpperCase())
    .replace('.', '');
}

function formatTime(time: string): string {
  return time.replace(':', 'h');
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h${m}` : `${h}h`;
}

function buildGoogleCalendarUrl(apt: { date: string; time: string; service: string; location: string | null; duration: number }): string {
  const [year, month, day] = apt.date.split('-').map(Number);
  const [hour, min] = (apt.time || '09:00').split(':').map(Number);
  const start = new Date(year, month - 1, day, hour, min, 0);
  const end = new Date(start.getTime() + (apt.duration || 60) * 60 * 1000);
  const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: apt.service,
    dates: `${fmt(start)}/${fmt(end)}`,
    details: `Rendez-vous tatouage - ${apt.service}`,
    location: apt.location || '',
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function buildIcsBlob(apt: { date: string; time: string; service: string; location: string | null; duration: number }, studioName: string): Blob {
  const [year, month, day] = apt.date.split('-').map(Number);
  const [hour, min] = (apt.time || '09:00').split(':').map(Number);
  const start = new Date(year, month - 1, day, hour, min, 0);
  const end = new Date(start.getTime() + (apt.duration || 60) * 60 * 1000);
  const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
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

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get('session_id');
    if (!sessionId) {
      setError('Session de paiement introuvable.');
      setLoading(false);
      return;
    }
    const fnUrl = `${supabaseUrl.replace(/\/$/, '')}/functions/v1/get-payment-session?session_id=${encodeURIComponent(sessionId)}`;
    fetch(fnUrl, {
      headers: supabaseKey ? { Authorization: `Bearer ${supabaseKey}` } : {},
    })
      .then((r) => r.json())
      .then((res) => {
        if (res.error) { setError(res.error); return; }
        setData(res);
      })
      .catch(() => setError('Impossible de charger les détails.'))
      .finally(() => setLoading(false));
  }, []);

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0d0d0d' }}>
        <div className="w-8 h-8 border-2 rounded-full animate-spin" style={{ borderColor: '#2a2a2a', borderTopColor: '#c9a96e' }} />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6" style={{ background: '#0d0d0d' }}>
        <SEO title="Erreur | InkFlow" canonical="/reservation-succes" />
        <div className="max-w-sm w-full rounded-2xl p-8 text-center" style={{ background: '#161616', border: '1px solid #2a2a2a' }}>
          <p className="text-red-400 font-medium mb-6">{error || 'Données introuvables.'}</p>
          <a href={LANDING_URL} className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm" style={{ background: '#c9a96e', color: '#0d0d0d' }}>
            Retour à l&apos;accueil
          </a>
        </div>
      </div>
    );
  }

  const apt = data.appointment;
  const dateShort = apt ? formatDateShort(apt.date) : null;

  const rows = [
    { label: 'Artiste', value: data.studioName },
    { label: 'Flash', value: data.serviceName },
    ...(apt ? [{ label: 'Horaire', value: `${formatTime(apt.time)} · ${formatDuration(apt.duration || 60)}` }] : []),
    { label: 'Acompte', value: `${data.amount % 1 === 0 ? data.amount : data.amount.toFixed(2)}€`, success: true },
  ];

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-12"
      style={{ background: '#0d0d0d', paddingBottom: 'env(safe-area-inset-bottom, 48px)' }}
    >
      <SEO
        title="RDV Confirmé | InkFlow"
        description="Votre acompte est payé et votre rendez-vous est confirmé."
        canonical="/reservation-succes"
      />

      <div className="w-full max-w-sm">
        {/* Checkmark */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-16 h-16 rounded-full bg-green-500/15 flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h1 className="text-xl font-bold mt-1" style={{ color: '#e8e3dc' }}>RDV Confirmé !</h1>
          <p className="text-sm mt-1" style={{ color: '#6b6b6b' }}>
            {dateShort ? `Acompte reçu · ${dateShort}` : 'Acompte reçu'}
          </p>
        </div>

        {/* Info card */}
        <div className="rounded-2xl overflow-hidden" style={{ background: '#161616', border: '1px solid #2a2a2a' }}>
          {rows.map((row, i) => (
            <div
              key={row.label}
              className="flex items-center justify-between px-5 py-4"
              style={i < rows.length - 1 ? { borderBottom: '1px solid #2a2a2a' } : {}}
            >
              <span className="text-sm" style={{ color: '#6b6b6b' }}>{row.label}</span>
              <span className="font-semibold text-sm flex items-center gap-1.5" style={{ color: row.success ? '#4ade80' : '#e8e3dc' }}>
                {row.value}
                {row.success && (
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </span>
            </div>
          ))}

          {/* Reminder banner */}
          <div className="px-5 py-3" style={{ background: '#0d0d0d', borderTop: '1px solid #2a2a2a' }}>
            <p className="text-xs text-center" style={{ color: '#6b6b6b' }}>
              Rappel automatique J-1 et H-4
            </p>
          </div>
        </div>

        {/* Calendar buttons */}
        {apt && (
          <div className="mt-4 flex gap-3">
            <a
              href={buildGoogleCalendarUrl(apt)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-colors"
              style={{ background: '#161616', border: '1px solid #2a2a2a', color: '#e8e3dc' }}
            >
              <Calendar className="w-4 h-4" />
              Google Agenda
            </a>
            <button
              type="button"
              onClick={handleDownloadIcs}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-colors"
              style={{ background: '#161616', border: '1px solid #2a2a2a', color: '#e8e3dc' }}
            >
              <Download className="w-4 h-4" />
              Apple / Outlook
            </button>
          </div>
        )}

        <a
          href={LANDING_URL}
          className="mt-4 block w-full text-center py-3.5 rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity"
          style={{ background: '#c9a96e', color: '#0d0d0d' }}
        >
          Retour à l&apos;accueil
        </a>
      </div>
    </div>
  );
};
