import React, { useEffect, useMemo, useState } from 'react';
import { Calendar, Loader2, CheckCircle, Clock, Mail, Info } from 'lucide-react';
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
      <div className="mx-auto w-full max-w-lg space-y-6 text-[var(--text-primary)]">
        {/* Client — carte légère, accent gauche */}
        <div className="rounded-2xl border border-zinc-200/90 border-l-4 border-l-emerald-500 bg-zinc-50/90 py-4 pl-4 pr-4 shadow-sm dark:border-zinc-800 dark:border-l-emerald-500 dark:bg-zinc-900/40">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-500">
            Client
          </p>
          <p className="mt-1.5 text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            {projectRequest.clientName}
          </p>
          <p className="mt-0.5 flex items-center gap-1.5 text-sm text-zinc-500 dark:text-zinc-400 truncate">
            <Mail className="w-3.5 h-3.5 shrink-0 opacity-70" aria-hidden />
            <span className="truncate">{projectRequest.clientEmail}</span>
          </p>
        </div>

        {/* Consignes — lisibilité WCAG-friendly */}
        <div className="rounded-2xl border border-zinc-200/80 bg-white/60 px-4 py-3.5 dark:border-zinc-800 dark:bg-zinc-950/30">
          <div className="flex gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-600 dark:bg-sky-950/50 dark:text-sky-400">
              <Info className="h-4 w-4" aria-hidden />
            </div>
            <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
              Choisis un créneau aligné sur ton agenda. Le client reçoit un <span className="font-medium text-zinc-800 dark:text-zinc-200">e-mail InkFlow</span> avec la date proposée et un message optionnel. La proposition expire{' '}
              <span className="inline-flex items-center rounded-md bg-amber-100 px-1.5 py-0.5 text-xs font-semibold text-amber-900 dark:bg-amber-950/60 dark:text-amber-200">
                72 h
              </span>{' '}
              après le créneau choisi.
            </p>
          </div>
        </div>

        {demoMode && (
          <p className="text-sm rounded-xl border border-amber-200/80 bg-amber-50 px-3.5 py-2.5 text-amber-950 dark:border-amber-500/35 dark:bg-amber-950/25 dark:text-amber-100">
            Compte démo : l’acceptation réelle est désactivée.
          </p>
        )}

        {loading && (
          <div className="flex items-center gap-2.5 text-sm text-zinc-500 dark:text-zinc-400">
            <Loader2 className="w-4 h-4 animate-spin text-sky-500 dark:text-sky-400" aria-hidden />
            Chargement de ton planning…
          </div>
        )}
        {planningHint && (
          <p className="text-sm rounded-xl border border-amber-200/60 bg-amber-50/80 px-3 py-2 text-amber-950 dark:border-amber-500/25 dark:bg-amber-950/20 dark:text-amber-100/95">
            {planningHint}
          </p>
        )}

        {!loading && availability && dateOptions.length === 0 && (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Aucune date libre dans la fenêtre actuelle. Élargis tes disponibilités dans les paramètres, puis réessaie.
          </p>
        )}

        {!loading && (dateOptions.length > 0 || availability) && (
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-500">
              Planification
            </p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <span id="accept-pr-date" className="flex items-center gap-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  <Calendar className="h-4 w-4 text-sky-600 dark:text-sky-400" aria-hidden />
                  Date
                </span>
                <select
                  aria-labelledby="accept-pr-date"
                  value={selectedYmd}
                  onChange={(e) => setSelectedYmd(e.target.value)}
                  className="w-full min-h-[44px] rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 shadow-sm transition-colors hover:border-zinc-300 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/25 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:hover:border-zinc-600 dark:focus:border-sky-500"
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
                <span id="accept-pr-slot" className="flex items-center gap-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  <Clock className="h-4 w-4 text-sky-600 dark:text-sky-400" aria-hidden />
                  Créneau
                </span>
                <select
                  aria-labelledby="accept-pr-slot"
                  value={selectedSlot}
                  onChange={(e) => setSelectedSlot(e.target.value)}
                  disabled={slotOptions.length === 0}
                  className="w-full min-h-[44px] rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 shadow-sm transition-colors hover:border-zinc-300 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/25 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:hover:border-zinc-600 dark:focus:border-sky-500"
                >
                  {slotOptions.map((s) => (
                    <option key={s} value={s}>
                      {formatSlotLabel(s)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <label htmlFor="accept-pr-message" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Message au client{' '}
            <span className="font-normal text-zinc-500 dark:text-zinc-500">(optionnel)</span>
          </label>
          <textarea
            id="accept-pr-message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            placeholder="Ex. : On affine le motif ensemble sur place…"
            className="w-full min-h-[100px] resize-y rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm leading-relaxed text-zinc-900 placeholder:text-zinc-400 shadow-sm transition-colors hover:border-zinc-300 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/25 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:hover:border-zinc-600 dark:focus:border-sky-500"
          />
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-zinc-200/80 pt-5 dark:border-zinc-800 sm:flex-row sm:justify-end sm:gap-3">
          <button
            type="button"
            onClick={onClose}
            className="w-full min-h-[44px] rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-800 shadow-sm transition-all hover:bg-zinc-50 active:scale-[0.98] dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800 sm:w-auto sm:min-w-[120px]"
          >
            Annuler
          </button>
          <button
            type="button"
            disabled={submitting || demoMode || !selectedYmd || !selectedSlot}
            onClick={() => void handleSubmit()}
            className="w-full min-h-[44px] inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:bg-emerald-700 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-zinc-900 sm:w-auto sm:min-w-[220px]"
          >
            {submitting ? (
              <Loader2 className="w-5 h-5 animate-spin" aria-hidden />
            ) : (
              <CheckCircle className="w-5 h-5 shrink-0" aria-hidden />
            )}
            {submitting ? 'Envoi…' : 'Accepter et notifier le client'}
          </button>
        </div>
      </div>
    </Modal>
  );
};
