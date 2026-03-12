import React, { useState, useEffect } from 'react';
import { CheckCircle, Calendar, MapPin, Clock, User, Download, Store } from 'lucide-react';
import { Logo } from '../../components/Logo';
import { LANDING_URL } from '../../lib/urls';
import { SEO } from '../../components/SEO';

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

function formatDateFr(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
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
        if (res.error) {
          setError(res.error);
          return;
        }
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
      <div className="min-h-screen bg-neutral-50 flex flex-col items-center justify-center p-6">
        <Logo size="lg" className="mb-6" />
        <div className="w-10 h-10 border-2 border-neutral-300 border-t-neutral-900 rounded-full animate-spin" />
        <p className="mt-4 text-neutral-600">Chargement…</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-neutral-50 flex flex-col items-center justify-center p-6">
        <SEO title="Erreur | InkFlow" canonical="/reservation-succes" />
        <Logo size="lg" className="mb-6" />
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          <p className="text-red-600 font-medium mb-4">{error || 'Données introuvables.'}</p>
          <a href={LANDING_URL} className="inline-flex items-center gap-2 bg-neutral-900 text-white px-6 py-3 rounded-xl font-semibold hover:bg-neutral-800">
            Retour à l&apos;accueil
          </a>
        </div>
      </div>
    );
  }

  const hasAppointment = !!data.appointment;

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col">
      <SEO
        title="Réservation confirmée | InkFlow"
        description="Votre acompte est payé et votre réservation est confirmée."
        canonical="/reservation-succes"
      />
      <header className="bg-white border-b border-neutral-200 py-4 px-6">
        <a href={LANDING_URL} className="inline-block">
          <Logo size="md" />
        </a>
      </header>

      <main className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-lg w-full bg-white rounded-2xl shadow-xl p-8 sm:p-10">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
          </div>

          <h1 className="text-2xl font-bold text-neutral-900 text-center mb-2">
            Merci {data.clientName} !
          </h1>
          <p className="text-neutral-600 text-center mb-8">
            {hasAppointment
              ? 'Votre acompte est payé et votre rendez-vous est confirmé.'
              : 'Votre acompte est payé. Le flash est réservé à votre nom. Le tatoueur vous contactera pour convenir d\'un créneau.'}
          </p>

          <div className="rounded-xl bg-neutral-50 border border-neutral-200 p-5 space-y-4 mb-8">
            <div className="flex items-start gap-3">
              <User className="w-5 h-5 text-neutral-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">Service</p>
                <p className="font-medium text-neutral-900">{data.serviceName}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Store className="w-5 h-5 text-neutral-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">Tatoueur / Studio</p>
                <p className="font-medium text-neutral-900">{data.studioName}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-green-700 font-semibold">
              <span>Acompte</span>
              <span>{data.amount.toFixed(2)} €</span>
            </div>

            {hasAppointment && data.appointment && (
              <>
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-neutral-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">Date</p>
                    <p className="font-medium text-neutral-900">{formatDateFr(data.appointment.date)}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-neutral-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">Heure</p>
                    <p className="font-medium text-neutral-900">{data.appointment.time}</p>
                  </div>
                </div>
                {data.appointment.location && (
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-neutral-500 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">Lieu</p>
                      <p className="font-medium text-neutral-900">{data.appointment.location}</p>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {hasAppointment && data.appointment && (
            <div className="space-y-3 mb-8">
              <p className="text-sm font-semibold text-neutral-700">Ajouter au calendrier</p>
              <div className="flex flex-col sm:flex-row gap-3">
                <a
                  href={buildGoogleCalendarUrl(data.appointment)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-4 py-3 bg-white border-2 border-neutral-200 rounded-xl font-semibold text-neutral-900 hover:bg-neutral-50 transition-colors"
                >
                  <Calendar className="w-5 h-5" />
                  Google Agenda
                </a>
                <button
                  type="button"
                  onClick={handleDownloadIcs}
                  className="inline-flex items-center justify-center gap-2 px-4 py-3 bg-white border-2 border-neutral-200 rounded-xl font-semibold text-neutral-900 hover:bg-neutral-50 transition-colors"
                >
                  <Download className="w-5 h-5" />
                  Apple / Outlook (.ics)
                </button>
              </div>
            </div>
          )}

          <a
            href={LANDING_URL}
            className="block w-full text-center py-3.5 bg-neutral-900 text-white rounded-xl font-semibold hover:bg-neutral-800 transition-colors"
          >
            Retour à l&apos;accueil
          </a>
        </div>
      </main>
    </div>
  );
};
