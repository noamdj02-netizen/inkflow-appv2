import React from 'react';
import { X, MapPin, Ruler, Euro, Calendar, Mail, Sparkles, FileText, CheckCircle, XCircle, Clock } from 'lucide-react';
import type { ProjectRequest, Booking } from '../../types';

type RequestItem = (ProjectRequest & { _type: 'project' }) | (Booking & { _type: 'booking' });

interface RequestQuickViewSheetProps {
  isOpen: boolean;
  onClose: () => void;
  item: RequestItem | null;
  /** Image de référence principale (ou flash) */
  thumbnailUrl?: string | null;
  /** Type affiché : flash ou custom */
  requestType?: 'flash' | 'custom';
  /** Zone du corps (placement) */
  placement?: string | null;
  /** Taille (ex: 10x15cm) */
  size?: string | null;
  studioId: string | null;
  onAccept?: (item: RequestItem) => void;
  onAcceptAndDeposit?: (item: RequestItem) => void;
  onReject?: (item: RequestItem) => void;
  onProposeDate?: (item: RequestItem) => void;
}

const PLACEMENT_LABELS: Record<string, string> = {
  arm: 'Bras', leg: 'Jambe', back: 'Dos', chest: 'Poitrine',
  shoulder: 'Épaule', wrist: 'Poignet', ankle: 'Cheville',
  'avant-bras': 'Avant-bras', 'avant bras': 'Avant-bras',
};

function formatPlacement(p: string | undefined | null): string {
  if (!p) return '';
  const lower = p.toLowerCase().trim();
  return PLACEMENT_LABELS[lower] || p;
}

function formatTime(t: string | null | undefined): string {
  if (!t) return '';
  const s = String(t).toLowerCase();
  if (s === 'morning') return 'Matin';
  if (s === 'afternoon') return 'Après-midi';
  if (s === 'evening') return 'Soirée';
  if (/^\d{1,2}:\d{2}$/.test(t)) return t;
  return t;
}

export const RequestQuickViewSheet: React.FC<RequestQuickViewSheetProps> = ({
  isOpen,
  onClose,
  item,
  thumbnailUrl,
  requestType = 'custom',
  placement,
  size,
  studioId,
  onAccept,
  onAcceptAndDeposit,
  onReject,
  onProposeDate,
}) => {
  if (!item) return null;

  const isProject = item._type === 'project';
  const pr = isProject ? (item as ProjectRequest & { _type: 'project' }) : null;
  const bk = !isProject ? (item as Booking & { _type: 'booking' }) : null;

  const clientName = pr?.clientName ?? bk?.clientName ?? '';
  const clientEmail = pr?.clientEmail ?? bk?.clientEmail ?? '';
  const description = pr?.description ?? bk?.description ?? '';
  const displayPlacement = formatPlacement(placement ?? pr?.placement ?? '');
  const displaySize = size ?? pr?.size ?? '';
  const budget = pr?.budget ?? '';

  const refImages = (pr?.referenceImages ?? bk?.referenceImages ?? []) as string[];
  const mainImage = thumbnailUrl || refImages[0];

  const requestedDate = bk?.requestedDate;
  const requestedTime = bk?.requestedTime;

  return (
    <>
      <div
        onClick={onClose}
        className={`fixed z-[55] inset-0 transition-opacity duration-300 lg:left-[178px] ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
        aria-hidden="true"
      />
      <div
        className={`fixed z-[60] flex flex-col shadow-2xl border-l border-[var(--border)] right-0 inset-y-0 w-full sm:max-w-md max-h-[95dvh] rounded-t-2xl sm:rounded-none border-t sm:border-t-0 transition-transform duration-300 ease-out overflow-hidden ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{ backgroundColor: 'var(--bg-primary)' }}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)] shrink-0 bg-[var(--bg-secondary)]">
          <h2 className="font-bold text-lg text-[var(--text-primary)]">Aperçu rapide</h2>
          <button
            onClick={onClose}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl hover:bg-[var(--bg-hover)] transition-colors text-[var(--text-secondary)]"
            aria-label="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {/* Image de référence */}
          <div className="aspect-square w-full bg-neutral-100 dark:bg-neutral-800">
            {mainImage ? (
              <img src={mainImage} alt="Référence" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-neutral-400">
                <FileText className="w-16 h-16" />
              </div>
            )}
          </div>
          <div className="p-5 space-y-5">
            <div>
              <h3 className="font-semibold text-xl text-[var(--text-primary)]">{clientName}</h3>
              <div className="flex items-center gap-2 mt-1 text-sm text-[var(--text-secondary)]">
                <Mail className="w-4 h-4 shrink-0" />
                {clientEmail}
              </div>
              {pr?.clientInstagram && (
                <p className="text-sm text-[var(--text-tertiary)] mt-0.5">{pr.clientInstagram}</p>
              )}
            </div>

            {/* Badges */}
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                {requestType === 'flash' ? <Sparkles className="w-3.5 h-3.5" /> : <FileText className="w-3.5 h-3.5" />}
                {requestType === 'flash' ? 'Flash' : 'Custom'}
              </span>
              {displayPlacement && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">
                  <MapPin className="w-3.5 h-3.5" />
                  {displayPlacement}
                </span>
              )}
              {displaySize && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-300">
                  <Ruler className="w-3.5 h-3.5" />
                  {displaySize}
                </span>
              )}
              {budget && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
                  <Euro className="w-3.5 h-3.5" />
                  {budget}
                </span>
              )}
            </div>

            {/* Description */}
            <div>
              <h4 className="text-sm font-semibold text-[var(--text-secondary)] mb-2">Description du projet</h4>
              <p className="text-sm text-[var(--text-primary)] leading-relaxed whitespace-pre-wrap">{description}</p>
            </div>

            {/* Disponibilités client */}
            {(requestedDate || requestedTime) && (
              <div>
                <h4 className="text-sm font-semibold text-[var(--text-secondary)] mb-2">Disponibilités</h4>
                <div className="flex items-center gap-2 text-sm text-[var(--text-primary)]">
                  <Calendar className="w-4 h-4 shrink-0" />
                  {requestedDate && new Date(requestedDate).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                  {requestedTime && (
                    <span className="flex items-center gap-1.5 ml-2">
                      <Clock className="w-4 h-4" />
                      {formatTime(requestedTime)}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Galerie refs (si plusieurs) */}
            {refImages.length > 1 && (
              <div>
                <h4 className="text-sm font-semibold text-[var(--text-secondary)] mb-2">Autres références</h4>
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {refImages.slice(1, 5).map((url, i) => (
                    <img key={i} src={url} alt={`Ref ${i + 2}`} className="w-16 h-16 rounded-lg object-cover shrink-0" />
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="pt-4 border-t border-[var(--border)] space-y-2">
              <p className="text-xs font-semibold text-[var(--text-tertiary)] uppercase mb-3">Actions</p>
              <div className="flex flex-col gap-2">
                {studioId && onAcceptAndDeposit && (
                  <button
                    onClick={() => onAcceptAndDeposit(item)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 active:scale-[0.98] transition-all"
                  >
                    <CheckCircle className="w-5 h-5" />
                    Accepter (Fixer le prix)
                  </button>
                )}
                {onAccept && isProject && (
                  <button
                    onClick={() => onAccept(item)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400 font-semibold hover:bg-blue-200 dark:hover:bg-blue-500/30 active:scale-[0.98] transition-all"
                  >
                    <CheckCircle className="w-5 h-5" />
                    Accepter & Discuter
                  </button>
                )}
                {onProposeDate && (
                  <button
                    onClick={() => onProposeDate(item)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-[var(--border)] font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-hover)] active:scale-[0.98] transition-all"
                  >
                    <Calendar className="w-5 h-5" />
                    Proposer une autre date
                  </button>
                )}
                {onReject && (
                  <button
                    onClick={() => onReject(item)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-zinc-100 text-zinc-600 dark:bg-zinc-500/20 dark:text-zinc-400 font-semibold hover:bg-zinc-200 dark:hover:bg-zinc-500/30 active:scale-[0.98] transition-all"
                  >
                    <XCircle className="w-5 h-5" />
                    Refuser
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
