import { useCallback, useEffect, useState } from 'react';
import {
  Calendar,
  CheckCircle2,
  CreditCard,
  Loader2,
  MessageCircle,
  Sparkles,
  AlertCircle,
  User,
} from 'lucide-react';
import { SEO } from '../../components/SEO';
import { supabase } from '../../lib/supabase';
import { createCheckoutSession } from '../../lib/stripeClient';
import {
  DEFAULT_BOOKING_CONFIRM_DEPOSIT_EUR,
  inkflowPublicMessagesUrl,
} from '../../lib/bookingRecapUrls';
import { LANDING_URL, getClientAccountHubPath } from '../../lib/urls';

export interface PublicBookingRecapPageProps {
  recapToken: string;
}

interface BookingRecapPayload {
  studioName: string;
  studioSlug: string;
  studioId: string;
  clientName: string;
  clientEmail: string;
  requestedDate: string;
  requestedTime: string | null;
  description: string;
  threadId: string;
  appointmentId: string | null;
  depositAmountEur: number | null;
  depositPaid: boolean;
  priceEur: number | null;
}

function parseRecapRow(raw: unknown): BookingRecapPayload | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  const studioName = typeof o.studioName === 'string' ? o.studioName : '';
  const studioSlug = typeof o.studioSlug === 'string' ? o.studioSlug : '';
  const studioId = typeof o.studioId === 'string' ? o.studioId : '';
  const clientName = typeof o.clientName === 'string' ? o.clientName : '';
  const clientEmail = typeof o.clientEmail === 'string' ? o.clientEmail : '';
  const requestedDate = typeof o.requestedDate === 'string' ? o.requestedDate : '';
  const requestedTime = typeof o.requestedTime === 'string' ? o.requestedTime : null;
  const description = typeof o.description === 'string' ? o.description : '';
  const threadId = typeof o.threadId === 'string' ? o.threadId : '';
  const appointmentId = typeof o.appointmentId === 'string' ? o.appointmentId : null;
  const depositPaid = o.depositPaid === true;
  const depositAmountEur =
    typeof o.depositAmountEur === 'number' && !Number.isNaN(o.depositAmountEur)
      ? o.depositAmountEur
      : null;
  const priceEur =
    typeof o.priceEur === 'number' && !Number.isNaN(o.priceEur) ? o.priceEur : null;
  if (!studioName || !studioId || !requestedDate || !threadId || !clientEmail) return null;
  return {
    studioName,
    studioSlug,
    studioId,
    clientName,
    clientEmail,
    requestedDate,
    requestedTime,
    description,
    threadId,
    appointmentId,
    depositAmountEur,
    depositPaid,
    priceEur,
  };
}

function formatTimeLabel(t: string | null): string {
  if (!t) return '';
  if (t === 'morning') return 'Matin';
  if (t === 'afternoon') return 'Après-midi';
  if (t === 'evening') return 'Soirée';
  if (/^\d{1,2}:\d{2}$/.test(t)) return t.replace(':', 'h');
  return t;
}

function formatDateLong(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatMoneyEUR(n: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 2,
  }).format(n);
}

export function PublicBookingRecapPage({ recapToken }: PublicBookingRecapPageProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recap, setRecap] = useState<BookingRecapPayload | null>(null);
  const [payLoading, setPayLoading] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const token = recapToken?.trim();
    if (!token || token.length < 32) {
      setError('Lien incomplet ou invalide.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { data, error: rpcErr } = await supabase.rpc('get_booking_client_recap', {
        p_token: token,
      });
      if (rpcErr) {
        setError('Impossible de charger ce rendez-vous.');
        setRecap(null);
        return;
      }
      const parsed = parseRecapRow(data);
      if (!parsed || !parsed.appointmentId) {
        setError('Ce lien n’est plus valide ou le rendez-vous n’est pas disponible.');
        setRecap(null);
        return;
      }
      setRecap(parsed);
    } catch {
      setError('Une erreur est survenue.');
      setRecap(null);
    } finally {
      setLoading(false);
    }
  }, [recapToken]);

  useEffect(() => {
    void load();
  }, [load]);

  const handlePayDeposit = async () => {
    if (!recap?.appointmentId) return;
    const depositEur =
      recap.depositAmountEur != null && recap.depositAmountEur > 0
        ? recap.depositAmountEur
        : DEFAULT_BOOKING_CONFIRM_DEPOSIT_EUR;
    const serviceName =
      recap.description.length > 80 ? `${recap.description.slice(0, 77)}…` : recap.description;
    setPayLoading(true);
    setPayError(null);
    try {
      const result = await createCheckoutSession({
        studioId: recap.studioId,
        studioSlug: recap.studioSlug || undefined,
        appointmentId: recap.appointmentId,
        amount: depositEur,
        clientName: recap.clientName || 'Client',
        clientEmail: recap.clientEmail,
        serviceName: serviceName ? `RDV — ${serviceName}` : 'Acompte rendez-vous',
        type: 'deposit',
        threadId: recap.threadId,
      });
      if ('url' in result && result.url) {
        window.location.href = result.url;
        return;
      }
      setPayError(
        'error' in result && result.error ? result.error : 'Paiement indisponible pour le moment.',
      );
    } catch {
      setPayError('Impossible d’ouvrir la page de paiement.');
    } finally {
      setPayLoading(false);
    }
  };

  const messagesUrl = recap ? inkflowPublicMessagesUrl(recap.threadId) : '';
  const clientHubHref =
    recap?.studioSlug?.trim() ? getClientAccountHubPath({ studioSlug: recap.studioSlug }) : null;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      <SEO title="Votre rendez-vous — InkFlow" description="Récapitulatif et acompte sécurisé." noindex />
      <div className="mx-auto max-w-lg px-4 py-10 sm:py-14">
        <a
          href={LANDING_URL}
          className="inline-flex items-center gap-2 text-sm font-medium text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 mb-8 transition-colors"
        >
          <Sparkles className="w-4 h-4" aria-hidden />
          InkFlow
        </a>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-zinc-500">
            <Loader2 className="w-8 h-8 animate-spin" aria-hidden />
            <p className="text-sm">Chargement…</p>
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-6 shadow-sm">
            <div className="flex gap-3">
              <AlertCircle className="w-6 h-6 text-amber-500 shrink-0 mt-0.5" aria-hidden />
              <div>
                <h1 className="text-lg font-semibold tracking-tight">Lien invalide</h1>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-2">{error}</p>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-3">
                  Si vous venez d’un e-mail du studio, demandez un nouveau lien ou contactez-le
                  directement.
                </p>
              </div>
            </div>
          </div>
        ) : recap ? (
          <div className="space-y-6">
            <header className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
                Rendez-vous confirmé
              </p>
              <h1 className="text-2xl sm:text-3xl font-bold font-display tracking-tight">
                {recap.studioName}
              </h1>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Bonjour{recap.clientName ? ` ${recap.clientName.split(/\s+/)[0]}` : ''}, voici le
                récapitulatif de votre séance. Finalisez avec l’acompte pour bloquer définitivement
                le créneau.
              </p>
            </header>

            <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-5 sm:p-6 shadow-sm space-y-5 border-l-4 border-l-emerald-500">
              <div className="flex gap-3">
                <Calendar className="w-5 h-5 text-zinc-500 shrink-0 mt-0.5" aria-hidden />
                <div>
                  <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
                    Date
                  </p>
                  <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                    {formatDateLong(recap.requestedDate)}
                    {formatTimeLabel(recap.requestedTime)
                      ? ` — ${formatTimeLabel(recap.requestedTime)}`
                      : ''}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-1">
                  Projet
                </p>
                <p className="text-sm leading-relaxed text-zinc-800 dark:text-zinc-200 whitespace-pre-wrap">
                  {recap.description || '—'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                <div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">Prix (estim.)</p>
                  <p className="font-semibold">
                    {recap.priceEur != null && recap.priceEur > 0
                      ? formatMoneyEUR(recap.priceEur)
                      : 'À préciser'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">Acompte demandé</p>
                  <p className="font-semibold text-emerald-700 dark:text-emerald-400">
                    {formatMoneyEUR(
                      recap.depositAmountEur != null && recap.depositAmountEur > 0
                        ? recap.depositAmountEur
                        : DEFAULT_BOOKING_CONFIRM_DEPOSIT_EUR,
                    )}
                  </p>
                </div>
              </div>
            </div>

            {recap.depositPaid ? (
              <div className="rounded-2xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/80 dark:bg-emerald-950/30 p-5 flex gap-3">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" aria-hidden />
                <div>
                  <p className="font-semibold text-emerald-900 dark:text-emerald-100">
                    Acompte bien reçu
                  </p>
                  <p className="text-sm text-emerald-800/90 dark:text-emerald-200/90 mt-1">
                    Votre créneau est sécurisé. Vous pouvez échanger avec le studio ci-dessous.
                  </p>
                  <a
                    href={messagesUrl}
                    className="inline-flex items-center gap-2 mt-4 px-4 py-3 min-h-[44px] rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-sm font-semibold active:scale-[0.98] transition-all"
                  >
                    <MessageCircle className="w-4 h-4" aria-hidden />
                    Ouvrir la messagerie
                  </a>
                  {clientHubHref ? (
                    <a
                      href={clientHubHref}
                      className="inline-flex items-center gap-2 mt-3 px-4 py-3 min-h-[44px] rounded-xl border border-emerald-700/30 dark:border-emerald-400/40 text-emerald-950 dark:text-emerald-100 text-sm font-semibold hover:bg-emerald-100/50 dark:hover:bg-emerald-900/30 active:scale-[0.98] transition-all"
                    >
                      <User className="w-4 h-4" aria-hidden />
                      Compléter profil & questionnaire santé
                    </a>
                  ) : null}
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {payError ? (
                  <p className="text-sm text-red-600 dark:text-red-400">{payError}</p>
                ) : null}
                <button
                  type="button"
                  onClick={() => void handlePayDeposit()}
                  disabled={payLoading}
                  className="w-full flex items-center justify-center gap-2 min-h-[48px] rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-semibold text-sm active:scale-[0.98] transition-all disabled:opacity-60"
                >
                  {payLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" aria-hidden />
                  ) : (
                    <CreditCard className="w-5 h-5" aria-hidden />
                  )}
                  {payLoading ? 'Redirection…' : 'Payer mon acompte'}
                </button>
                <p className="text-xs text-center text-zinc-500 dark:text-zinc-400">
                  Paiement sécurisé par carte (Stripe). Après paiement, vous recevrez une confirmation
                  par e-mail ; un SMS peut suivre si vous l’avez accepté sur la vitrine.
                </p>
                {clientHubHref ? (
                  <p className="text-xs text-center text-zinc-600 dark:text-zinc-400 leading-relaxed px-1">
                    Vous préférez préparer votre dossier tout de suite ?{' '}
                    <a
                      href={clientHubHref}
                      className="font-semibold text-zinc-800 dark:text-zinc-200 underline-offset-2 hover:underline"
                    >
                      Ouvrir mon compte InkFlow (profil & santé)
                    </a>
                    .
                  </p>
                ) : null}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <a
                href={messagesUrl}
                className="flex-1 inline-flex items-center justify-center gap-2 min-h-[44px] rounded-xl border border-zinc-200 dark:border-zinc-700 font-medium text-sm active:scale-[0.98] transition-all hover:bg-zinc-100 dark:hover:bg-zinc-800/80"
              >
                <MessageCircle className="w-4 h-4" aria-hidden />
                Messagerie
              </a>
              {clientHubHref ? (
                <a
                  href={clientHubHref}
                  className="flex-1 inline-flex items-center justify-center gap-2 min-h-[44px] rounded-xl border border-zinc-200 dark:border-zinc-700 font-medium text-sm active:scale-[0.98] transition-all hover:bg-zinc-100 dark:hover:bg-zinc-800/80"
                >
                  <User className="w-4 h-4 shrink-0" aria-hidden />
                  Profil & santé
                </a>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
