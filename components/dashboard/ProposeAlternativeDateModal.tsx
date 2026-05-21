import React, { useEffect, useState, useMemo } from 'react';
import { Mail, AtSign, Loader2, Copy, MessageCircle } from 'lucide-react';
import { Modal } from '../ui/Modal';
import type { Appointment, ProjectRequest, Booking } from '../../types';
import {
  fetchStudioAvailabilityMeta,
  getAvailableDates,
  getAvailableSlotsForDate,
  withMergedAppointmentBusySlots,
  type StudioAvailabilityResponse,
} from '../../lib/studioAvailability';
import { instagramMessageUrl } from '../../lib/instagramUtils';
import {
  buildInstagramAlternativeDateMessage,
  formatRequestedTimeLabel,
  formatSlotLabel,
} from '../../lib/alternativeDateProposal';
import { sendAlternativeDateProposal } from '../../lib/sendNotification';
import { useToast } from '../../contexts/ToastContext';

type SheetItem = (ProjectRequest & { _type: 'project' }) | (Booking & { _type: 'booking' });

interface ProposeAlternativeDateModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: SheetItem | null;
  studioId: string | null;
  /** RDV agenda — exclus des créneaux proposés */
  appointments?: Appointment[];
  studioName: string;
  /** Réponse aux e-mails (compte connecté) */
  replyToEmail: string | null | undefined;
  instagramHandle: string | null;
  /** Ouvre l’onglet Messagerie sur le fil (pr_… ou id booking) après copie du texte. */
  onOpenInkflowDiscussion?: (threadId: string) => void;
}

function previousContextFromItem(item: SheetItem): string | undefined {
  if (item._type === 'booking' && item.requestedDate) {
    const d = new Date(item.requestedDate + 'T12:00:00').toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    const tl = formatRequestedTimeLabel(item.requestedTime);
    return tl ? `${d}, ${tl}` : d;
  }
  return undefined;
}

export const ProposeAlternativeDateModal: React.FC<ProposeAlternativeDateModalProps> = ({
  isOpen,
  onClose,
  item,
  studioId,
  appointments = [],
  studioName,
  replyToEmail,
  instagramHandle,
  onOpenInkflowDiscussion,
}) => {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [availability, setAvailability] = useState<StudioAvailabilityResponse | null>(null);
  /** Message si l’Edge Function planning a échoué mais qu’on propose quand même des créneaux indicatifs */
  const [planningHint, setPlanningHint] = useState<string | null>(null);
  const [selectedYmd, setSelectedYmd] = useState<string>('');
  const [selectedSlot, setSelectedSlot] = useState<string>('');

  const clientName = item ? (item._type === 'project' ? item.clientName : item.clientName) : '';
  const clientEmail = item ? (item._type === 'project' ? item.clientEmail : item.clientEmail) : '';
  const previousContext = item ? previousContextFromItem(item) : undefined;

  useEffect(() => {
    if (!isOpen || !studioId) {
      setAvailability(null);
      setPlanningHint(null);
      setSelectedYmd('');
      setSelectedSlot('');
      return;
    }
    let cancelled = false;
    setLoading(true);
    setPlanningHint(null);
    fetchStudioAvailabilityMeta(studioId)
      .then(({ availability: data, usedFallback }) => {
        if (!cancelled) {
          const merged = withMergedAppointmentBusySlots(data, appointments);
          setAvailability(merged);
          setPlanningHint(
            usedFallback
              ? 'Synchronisation partielle : créneaux indicatifs (agenda local inclus). Tu peux quand même envoyer la proposition.'
              : null
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isOpen, studioId, appointments]);

  const dateOptions = useMemo(() => {
    if (!availability) return [];
    const dates = getAvailableDates(availability, new Date());
    return dates.map((d) => d.toISOString().split('T')[0]);
  }, [availability]);

  useEffect(() => {
    if (!selectedYmd && dateOptions.length > 0) {
      setSelectedYmd(dateOptions[0]);
    }
  }, [dateOptions, selectedYmd]);

  const slotOptions = useMemo(() => {
    if (!availability || !selectedYmd) return [];
    const d = new Date(selectedYmd + 'T12:00:00');
    return getAvailableSlotsForDate(d, availability);
  }, [availability, selectedYmd]);

  useEffect(() => {
    if (slotOptions.length > 0) {
      setSelectedSlot((prev) => (prev && slotOptions.includes(prev) ? prev : slotOptions[0]));
    } else {
      setSelectedSlot('');
    }
  }, [slotOptions]);

  const proposedDateObj = selectedYmd ? new Date(selectedYmd + 'T12:00:00') : null;
  const igMessage =
    proposedDateObj && selectedSlot
      ? buildInstagramAlternativeDateMessage({
          clientName: clientName || 'toi',
          studioName,
          proposedDate: proposedDateObj,
          proposedTimeLabel: formatSlotLabel(selectedSlot),
          previousContext,
        })
      : '';

  const handleSendEmail = async () => {
    if (!item || !selectedYmd || !selectedSlot) {
      toast.error('Choisis une date et un créneau dans ton planning.');
      return;
    }
    if (!clientEmail?.trim()) {
      toast.error(
        'Le client n’a pas d’e-mail sur cette demande — utilise Instagram ou la messagerie.'
      );
      return;
    }
    setSending(true);
    try {
      const result = await sendAlternativeDateProposal({
        clientEmail,
        clientName,
        studioName,
        proposedDate: selectedYmd,
        proposedTime: selectedSlot,
        previousContext,
        replyToEmail: replyToEmail ?? undefined,
      });
      if (!result.ok) {
        toast.error(
          result.error || "L'e-mail n'a pas pu être envoyé (Resend, JWT ou fonction non déployée)."
        );
        return;
      }
      toast.success(
        'E-mail de proposition envoyé au client (il peut répondre directement au studio).'
      );
      onClose();
    } finally {
      setSending(false);
    }
  };

  const threadIdForItem = item ? (item._type === 'project' ? `pr_${item.id}` : item.id) : '';

  const handleInstagram = async () => {
    if (!instagramHandle?.trim()) return;
    if (!igMessage) {
      toast.error('Choisis d’abord une date et un créneau.');
      return;
    }
    try {
      await navigator.clipboard.writeText(igMessage);
      toast.success('Message copié — ouverture d’Instagram…');
      window.open(instagramMessageUrl(instagramHandle.trim()), '_blank', 'noopener,noreferrer');
    } catch {
      toast.error('Impossible de copier le message.');
    }
  };

  const handleMessagerieInkFlow = async () => {
    if (!onOpenInkflowDiscussion || !threadIdForItem) return;
    if (!igMessage) {
      toast.error('Choisis d’abord une date et un créneau.');
      return;
    }
    try {
      await navigator.clipboard.writeText(igMessage);
      toast.success('Texte copié — ouvre la conversation ; colle le message (⌘V / Ctrl+V).');
      onOpenInkflowDiscussion(threadIdForItem);
      onClose();
    } catch {
      toast.error('Impossible de copier le message.');
    }
  };

  if (!item) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Proposer une autre date" size="lg">
      <div className="space-y-5 text-[var(--text-primary)]">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-secondary)] p-4 space-y-2">
          <p className="text-sm font-semibold text-[var(--text-primary)]">
            Gestion des reports simplifiée
          </p>
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
            Choisis un créneau aligné sur ton planning, puis envoie l’e-mail InkFlow, ou copie le
            même texte vers Instagram ou la messagerie intégrée.
          </p>
          <ul className="text-xs text-[var(--text-tertiary)] space-y-1 list-disc list-inside">
            <li>
              <strong className="text-[var(--text-secondary)]">E-mail</strong> — envoi automatique
              (Resend) avec réponse au studio.
            </li>
            <li>
              <strong className="text-[var(--text-secondary)]">Instagram / Messagerie</strong> — le
              texte est copié, puis ouverture du DM ou du fil InkFlow pour coller.
            </li>
          </ul>
        </div>

        {loading && (
          <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
            <Loader2 className="w-4 h-4 animate-spin" /> Chargement de ton planning…
          </div>
        )}
        {planningHint && (
          <p className="text-sm text-amber-700 dark:text-amber-300">{planningHint}</p>
        )}

        {!loading && availability && dateOptions.length === 0 && (
          <p className="text-sm text-[var(--text-secondary)]">
            Aucune date libre dans la fenêtre actuelle. Ajuste tes dispos dans Paramètres ou envoie
            quand même un e-mail en expliquant la situation au client.
          </p>
        )}

        {!loading && (dateOptions.length > 0 || availability) && (
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2">Date</label>
              <select
                value={selectedYmd}
                onChange={(e) => setSelectedYmd(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)]"
              >
                {dateOptions.map((ymd) => (
                  <option key={ymd} value={ymd}>
                    {new Date(ymd + 'T12:00:00').toLocaleDateString('fr-FR', {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">Créneau</label>
              <select
                value={selectedSlot}
                onChange={(e) => setSelectedSlot(e.target.value)}
                disabled={slotOptions.length === 0}
                className="w-full px-3 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)] disabled:opacity-50"
              >
                {slotOptions.map((s) => (
                  <option key={s} value={s}>
                    {formatSlotLabel(s)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {igMessage && (
          <div>
            <p className="text-xs font-semibold text-[var(--text-tertiary)] uppercase mb-2">
              Aperçu message (Instagram)
            </p>
            <pre className="text-xs whitespace-pre-wrap rounded-xl border border-[var(--border)] bg-zinc-50 dark:bg-zinc-900/50 p-3 max-h-36 overflow-y-auto text-[var(--text-secondary)]">
              {igMessage}
            </pre>
          </div>
        )}

        <div className="space-y-2 pt-2">
          <button
            type="button"
            disabled={sending || !selectedYmd || !selectedSlot || !clientEmail?.trim()}
            onClick={() => void handleSendEmail()}
            className="w-full min-h-[44px] inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 text-white dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-400 font-semibold px-4 py-2.5 active:scale-[0.98] transition-all disabled:opacity-50"
          >
            <Mail className="w-4 h-4 shrink-0" />
            {sending ? 'Envoi…' : 'Envoyer l’e-mail au client'}
          </button>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {onOpenInkflowDiscussion && (
              <button
                type="button"
                disabled={!selectedSlot}
                onClick={() => void handleMessagerieInkFlow()}
                className="min-h-[44px] inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 text-white dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-400 font-semibold px-4 py-2.5 shadow-sm active:scale-[0.98] transition-all disabled:opacity-50"
              >
                <MessageCircle className="w-4 h-4 shrink-0" />
                Messagerie InkFlow
              </button>
            )}
            {instagramHandle?.trim() ? (
              <button
                type="button"
                disabled={!selectedSlot}
                onClick={() => void handleInstagram()}
                className="min-h-[44px] inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r border border-zinc-100 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 border border-pink-200/80 dark:border-pink-500/30 text-pink-800 dark:text-pink-200 font-semibold px-4 py-2.5 active:scale-[0.98] transition-all disabled:opacity-50"
              >
                <Copy className="w-4 h-4 shrink-0" />
                <AtSign className="w-4 h-4 shrink-0" />
                Copier + Instagram
              </button>
            ) : onOpenInkflowDiscussion ? null : (
              <p className="text-xs text-[var(--text-tertiary)] sm:col-span-2">
                Aucun Instagram détecté sur la demande — ajoute @ dans le brief client ou utilise la
                messagerie.
              </p>
            )}
          </div>
        </div>
        <p className="text-xs text-[var(--text-tertiary)]">
          L’e-mail part d’InkFlow ; le client répond à{' '}
          {replyToEmail ? (
            <span className="font-medium text-[var(--text-secondary)]">{replyToEmail}</span>
          ) : (
            <span className="text-amber-700 dark:text-amber-300">
              connecte une boîte pro dans ton compte pour activer « Répondre au tatoueur »
            </span>
          )}
          .
        </p>
      </div>
    </Modal>
  );
};
