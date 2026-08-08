import React, { useCallback, useMemo, useState } from 'react';
import { Mail, MessageSquare } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { useToast } from '../../contexts/ToastContext';
import { supabase } from '../../lib/supabase';
import { sendConsentRequest } from '../../lib/sendConsentRequest';
import { sendMessageNotificationToClient } from '../../lib/sendNotification';
import type { ConsentFormPreset } from '../../lib/consentFormPresets';
import type { Appointment } from '../../types';

function isLikelyMobileUserAgent(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

function buildNativeSmsHref(e164: string, body: string): string {
  const encoded = encodeURIComponent(body);
  if (typeof navigator === 'undefined') return `sms:${e164}?body=${encoded}`;
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  return isIOS ? `sms:${e164}&body=${encoded}` : `sms:${e164}?body=${encoded}`;
}

export interface ConsentSenderProps {
  isOpen: boolean;
  onClose: () => void;
  studioId: string;
  studioName: string;
  artistName: string;
  appointment: Appointment;
  presets: ConsentFormPreset[];
  inkflowMessagingThreadId?: string | null;
  onSent?: () => void;
}

export const ConsentSender: React.FC<ConsentSenderProps> = ({
  isOpen,
  onClose,
  studioId,
  studioName,
  artistName,
  appointment,
  presets,
  inkflowMessagingThreadId = null,
  onSent,
}) => {
  const toast = useToast();
  const [busyChannel, setBusyChannel] = useState<'email' | 'sms' | null>(null);
  const [presetIdx, setPresetIdx] = useState(0);

  const safePresets = presets.length > 0 ? presets : [];
  const activePreset = safePresets[Math.min(presetIdx, Math.max(0, safePresets.length - 1))];

  const subtitle = useMemo(() => {
    const d = appointment.date;
    const t = appointment.time;
    if (!d) return '';
    try {
      const time = t?.length === 5 ? `${t}:00` : t || '00:00:00';
      const dt = new Date(`${d}T${time}`);
      if (Number.isNaN(dt.getTime())) return `${d} · ${t}`;
      return new Intl.DateTimeFormat('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        hour: '2-digit',
        minute: '2-digit',
      }).format(dt);
    } catch {
      return `${d}`;
    }
  }, [appointment.date, appointment.time]);

  const postThreadConsentMessage = useCallback(
    async (consentFormId: string, title: string) => {
      const tid = inkflowMessagingThreadId?.trim();
      if (!tid || !studioId) return;
      const email = (appointment.clientEmail || '').trim();
      const clientName = (appointment.clientName || 'Client').trim() || 'Client';
      const payload = JSON.stringify({
        kind: 'consent_form_request',
        consentFormId,
        title,
      });
      const { error: mErr } = await supabase.from('inkflow_messages').insert({
        id: `msg_${Date.now()}`,
        studio_id: studioId,
        thread_id: tid,
        sender_type: 'artist',
        sender_name: artistName,
        content: payload,
        read: false,
      });
      if (mErr) {
        console.warn('[ConsentSender] thread message', mErr);
        return;
      }
      if (email) {
        sendMessageNotificationToClient({
          clientEmail: email,
          clientName,
          studioName,
          senderName: artistName,
          messagePreview: `Formulaire « ${title} » — à remplir dans la conversation Inkflow`,
          threadId: tid,
        });
      }
    },
    [
      inkflowMessagingThreadId,
      studioId,
      appointment.clientEmail,
      appointment.clientName,
      artistName,
      studioName,
    ]
  );

  const handleEmail = async () => {
    if (!activePreset || !studioId) return;
    setBusyChannel('email');
    try {
      const { data, error } = await sendConsentRequest({
        studioId,
        appointmentId: appointment.id,
        channel: 'email',
        template: activePreset.content,
        title: activePreset.title,
        studioName,
      });
      if (error) {
        toast.error(error);
        return;
      }
      const row = data as { consentFormId?: string };
      if (row?.consentFormId) {
        await postThreadConsentMessage(row.consentFormId, activePreset.title);
      }
      toast.success('E-mail de consentement envoyé.');
      onSent?.();
      onClose();
    } finally {
      setBusyChannel(null);
    }
  };

  const handleSms = async () => {
    if (!activePreset || !studioId) return;
    setBusyChannel('sms');
    try {
      const mobile = isLikelyMobileUserAgent();
      const { data, error } = await sendConsentRequest({
        studioId,
        appointmentId: appointment.id,
        channel: 'sms',
        smsDelivery: mobile ? 'native' : 'twilio',
        template: activePreset.content,
        title: activePreset.title,
        studioName,
      });
      if (error) {
        toast.error(error);
        return;
      }
      const row = data as {
        consentFormId?: string;
        smsBody?: string;
        toE164?: string;
      };
      if (row?.consentFormId) {
        await postThreadConsentMessage(row.consentFormId, activePreset.title);
      }
      if (mobile && row?.toE164 && row.smsBody) {
        window.location.href = buildNativeSmsHref(row.toE164, row.smsBody);
        toast.success('Ouverture de Messages…');
      } else {
        toast.success('SMS envoyé au client.');
      }
      onSent?.();
      onClose();
    } finally {
      setBusyChannel(null);
    }
  };

  if (!activePreset) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Envoyer le consentement" size="md">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Aucun modèle de consentement disponible. Ajoute-en un dans les paramètres du dashboard.
        </p>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Envoyer le consentement" size="md">
      <div className="space-y-5">
        {subtitle ? <p className="text-sm text-zinc-500 dark:text-zinc-400">{subtitle}</p> : null}

        {safePresets.length > 1 ? (
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Modèle</p>
            <div className="flex gap-2 overflow-x-auto pb-1 [-webkit-overflow-scrolling:touch]">
              {safePresets.map((p, i) => (
                <button
                  key={`${p.title}-${i}`}
                  type="button"
                  onClick={() => setPresetIdx(i)}
                  className={`shrink-0 rounded-xl border px-3 py-2 text-left text-xs font-medium transition-all active:scale-[0.98] ${
                    i === presetIdx
                      ? 'border-zinc-900 bg-white shadow-sm dark:border-zinc-100 dark:bg-zinc-800'
                      : 'border-zinc-200 bg-zinc-50/80 dark:border-zinc-700 dark:bg-zinc-900/50'
                  }`}
                >
                  {p.title}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <button
            type="button"
            disabled={busyChannel !== null}
            onClick={() => void handleEmail()}
            className="flex min-h-[120px] flex-col items-start justify-center gap-3 rounded-2xl border border-zinc-200 bg-white p-6 text-left shadow-sm transition-all active:scale-[0.98] disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-900/50 dark:shadow-none"
          >
            <div className="flex size-12 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-zinc-800">
              <Mail className="size-6 text-zinc-800 dark:text-zinc-100" strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-base font-bold text-zinc-900 dark:text-white">Envoyer par Mail</p>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                Lien signable par e-mail (serveur InkFlow).
              </p>
            </div>
            {busyChannel === 'email' ? <span className="text-xs text-zinc-400">Envoi…</span> : null}
          </button>

          <button
            type="button"
            disabled={busyChannel !== null}
            onClick={() => void handleSms()}
            className="flex min-h-[120px] flex-col items-start justify-center gap-3 rounded-2xl border border-zinc-200 bg-white p-6 text-left shadow-sm transition-all active:scale-[0.98] disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-900/50 dark:shadow-none"
          >
            <div className="flex size-12 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-zinc-800">
              <MessageSquare
                className="size-6 text-zinc-800 dark:text-zinc-100"
                strokeWidth={1.5}
              />
            </div>
            <div>
              <p className="text-base font-bold text-zinc-900 dark:text-white">Envoyer par SMS</p>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                {isLikelyMobileUserAgent()
                  ? 'Ouvre l’app Messages avec le lien prérempli.'
                  : 'Envoi via notre service (Twilio) avec le lien.'}
              </p>
            </div>
            {busyChannel === 'sms' ? <span className="text-xs text-zinc-400">Envoi…</span> : null}
          </button>
        </div>
      </div>
    </Modal>
  );
};
