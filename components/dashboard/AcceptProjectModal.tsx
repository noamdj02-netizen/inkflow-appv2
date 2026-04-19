import React, { useEffect, useMemo, useState } from 'react';
import { Calendar, Loader2, CheckCircle } from 'lucide-react';
import { Modal } from '../ui/Modal';
import type { ProjectRequest } from '../../types';
import {
  fetchStudioAvailabilityMeta,
  getAvailableDates,
  getAvailableSlotsForDate,
  type StudioAvailabilityResponse,
} from '../../lib/studioAvailability';
import { formatSlotLabel } from '../../lib/alternativeDateProposal';
import { buildProjectAcceptTimestamps } from '../../lib/projectRequestSlot';
import { acceptProjectRequest } from '../../lib/projectRequestActions';
import { useToast } from '../../contexts/ToastContext';

export interface AcceptProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectRequest: ProjectRequest | null;
  studioId: string | null;
  /** Compte démo : pas d’appel API réel */
  demoMode?: boolean;
  onSuccess?: () => void;
}

export const AcceptProjectModal: React.FC<AcceptProjectModalProps> = ({
  isOpen,
  onClose,
  projectRequest,
  studioId,
  demoMode = false,
  onSuccess,
}) => {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [availability, setAvailability] = useState<StudioAvailabilityResponse | null>(null);
  const [planningHint, setPlanningHint] = useState<string | null>(null);
  const [selectedYmd, setSelectedYmd] = useState('');
  const [selectedSlot, setSelectedSlot] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!isOpen || !studioId) {
      setAvailability(null);
      setPlanningHint(null);
      setSelectedYmd('');
      setSelectedSlot('');
      setMessage('');
      return;
    }
    let cancelled = false;
    setLoading(true);
    setPlanningHint(null);
    fetchStudioAvailabilityMeta(studioId)
      .then(({ availability: data, usedFallback }) => {
        if (!cancelled) {
          setAvailability(data);
          setPlanningHint(
            usedFallback
              ? 'Planning partiel : créneaux indicatifs. Tu peux quand même envoyer la proposition au client.'
              : null,
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isOpen, studioId]);

  const dateOptions = useMemo(() => {
    if (!availability) return [];
    return getAvailableDates(availability, new Date()).map((d) => d.toISOString().split('T')[0]);
  }, [availability]);

  useEffect(() => {
    if (!selectedYmd && dateOptions.length > 0) {
      setSelectedYmd(dateOptions[0]);
    }
  }, [dateOptions, selectedYmd]);

  const slotOptions = useMemo(() => {
    if (!availability || !selectedYmd) return [];
    return getAvailableSlotsForDate(new Date(`${selectedYmd}T12:00:00`), availability);
  }, [availability, selectedYmd]);

  useEffect(() => {
    if (slotOptions.length > 0) {
      setSelectedSlot((prev) => (prev && slotOptions.includes(prev) ? prev : slotOptions[0]));
    } else {
      setSelectedSlot('');
    }
  }, [slotOptions]);

  const handleSubmit = async () => {
    if (!projectRequest || !selectedYmd || !selectedSlot) {
      toast.error('Choisis une date et un créneau.');
      return;
    }
    if (demoMode) {
      toast.info('Mode démo — acceptation désactivée.');
      return;
    }
    const { proposed_slot, slot_expires_at } = buildProjectAcceptTimestamps(selectedYmd, selectedSlot);
    setSubmitting(true);
    try {
      const result = await acceptProjectRequest(projectRequest.id, {
        proposed_slot,
        slot_expires_at,
        artist_message: message.trim() || null,
      });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      if (result.warning) {
        toast.success('Projet accepté — e-mail envoyé au client.');
        toast.warning(result.warning);
      } else {
        toast.success('Projet accepté — e-mail envoyé au client.');
      }
      onSuccess?.();
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  if (!projectRequest) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Accepter un projet" size="md">
      <div className="mx-auto w-full max-w-[375px] sm:max-w-none space-y-5 text-[var(--text-primary)]">
        <div className="rounded-2xl border border-[#2a2a2a] bg-[#161616] p-4 space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#6b6b6b] font-[family-name:var(--font-mono)]">
            Client
          </p>
          <p className="text-base font-semibold text-[#e8e3dc]">{projectRequest.clientName}</p>
          <p className="text-sm text-[#6b6b6b] truncate">{projectRequest.clientEmail}</p>
        </div>

        <p className="text-sm text-[#e8e3dc]/90 leading-relaxed">
          Choisis un créneau aligné sur ton agenda. Le client reçoit un e-mail InkFlow avec la date proposée et un message
          optionnel. La proposition expire <strong className="text-[#C9A84C]">72 h</strong> après le créneau choisi.
        </p>

        {demoMode && (
          <p className="text-sm rounded-xl border border-amber-500/40 bg-amber-500/10 text-amber-200 px-3 py-2">
            Compte démo : l’acceptation réelle est désactivée.
          </p>
        )}

        {loading && (
          <div className="flex items-center gap-2 text-sm text-[#6b6b6b]">
            <Loader2 className="w-4 h-4 animate-spin text-[#00D4FF]" aria-hidden />
            Chargement de ton planning…
          </div>
        )}
        {planningHint && <p className="text-sm text-[#C9A84C]">{planningHint}</p>}

        {!loading && availability && dateOptions.length === 0 && (
          <p className="text-sm text-[#6b6b6b]">
            Aucune date libre dans la fenêtre actuelle. Élargis tes disponibilités dans les paramètres, puis réessaie.
          </p>
        )}

        {!loading && (dateOptions.length > 0 || availability) && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <span id="accept-pr-date" className="block text-sm font-semibold text-[#e8e3dc]">
                <Calendar className="inline w-4 h-4 mr-1.5 -mt-0.5 text-[#00D4FF]" aria-hidden />
                Date
              </span>
              <select
                aria-labelledby="accept-pr-date"
                value={selectedYmd}
                onChange={(e) => setSelectedYmd(e.target.value)}
                className="w-full min-h-[44px] rounded-xl border border-[#2a2a2a] bg-[#0d0d0d] px-3 py-2.5 text-[#e8e3dc] focus:outline-none focus:ring-2 focus:ring-[#00D4FF]/50"
              >
                {dateOptions.map((ymd) => (
                  <option key={ymd} value={ymd}>
                    {new Date(`${ymd}T12:00:00`).toLocaleDateString('fr-FR', {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <span id="accept-pr-slot" className="block text-sm font-semibold text-[#e8e3dc]">
                Créneau
              </span>
              <select
                aria-labelledby="accept-pr-slot"
                value={selectedSlot}
                onChange={(e) => setSelectedSlot(e.target.value)}
                disabled={slotOptions.length === 0}
                className="w-full min-h-[44px] rounded-xl border border-[#2a2a2a] bg-[#0d0d0d] px-3 py-2.5 text-[#e8e3dc] focus:outline-none focus:ring-2 focus:ring-[#00D4FF]/50 disabled:opacity-50"
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

        <div className="space-y-2">
          <label htmlFor="accept-pr-message" className="block text-sm font-semibold text-[#e8e3dc]">
            Message au client <span className="text-[#6b6b6b] font-normal">(optionnel)</span>
          </label>
          <textarea
            id="accept-pr-message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
            placeholder="Ex. : On affine le motif ensemble sur place…"
            className="w-full resize-y rounded-xl border border-[#2a2a2a] bg-[#0d0d0d] px-3 py-2.5 text-sm text-[#e8e3dc] placeholder:text-[#6b6b6b] focus:outline-none focus:ring-2 focus:ring-[#00D4FF]/50 min-h-[88px]"
          />
        </div>

        <div className="flex flex-col gap-3 pt-1">
          <button
            type="button"
            disabled={submitting || demoMode || !selectedYmd || !selectedSlot}
            onClick={() => void handleSubmit()}
            className="w-full min-h-[44px] inline-flex items-center justify-center gap-2 rounded-xl bg-[#00D4FF] text-[#0d0d0d] font-semibold px-4 py-3 active:scale-[0.98] transition-all disabled:opacity-45 disabled:pointer-events-none"
          >
            {submitting ? (
              <Loader2 className="w-5 h-5 animate-spin" aria-hidden />
            ) : (
              <CheckCircle className="w-5 h-5 shrink-0" aria-hidden />
            )}
            {submitting ? 'Envoi…' : 'Accepter et notifier le client'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="w-full min-h-[44px] rounded-xl border border-[#2a2a2a] bg-transparent text-[#e8e3dc] font-medium active:scale-[0.98] transition-all hover:bg-[#161616]"
          >
            Annuler
          </button>
        </div>
      </div>
    </Modal>
  );
};
