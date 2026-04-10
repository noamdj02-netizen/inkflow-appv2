import React from 'react';
import { X, MapPin, Ruler, Euro, Calendar, Mail, Sparkles, FileText, CheckCircle, XCircle, Clock, AtSign } from 'lucide-react';
import type { ProjectRequest, Booking } from '../../types';
import { instagramMessageUrl } from '../../lib/instagramUtils';
import { buildMailtoHref, handleMailtoClick } from '../../lib/mailto';
import { useToast } from '../../contexts/ToastContext';

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
  /** Pseudo Instagram résolu (champ ou extrait de la description) */
  instagramHandle?: string | null;
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
  instagramHandle,
  onAcceptAndDeposit,
  onReject,
  onProposeDate,
}) => {
  const toast = useToast();
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
  const ig = instagramHandle?.trim() || null;

  const requestedDate = bk?.requestedDate;
  const requestedTime = bk?.requestedTime;

  const mailtoHref = buildMailtoHref(clientEmail, `Votre demande — ${clientName}`.trim());

  return (
    <>
      {/* Fond : plein écran sur mobile / tablette ; à partir de lg, laisse la sidebar visible */}
      <div
        onClick={onClose}
        className={`fixed z-[55] inset-0 transition-opacity duration-300 lg:left-[178px] ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
        aria-hidden="true"
      />
      <div
        className={`fixed z-[60] flex min-h-0 flex-col shadow-2xl border-[var(--border)] w-full sm:max-w-md max-w-[100vw] overflow-hidden transition-transform duration-300 ease-out bg-[var(--bg-primary)]
          pb-[max(12px,env(safe-area-inset-bottom,0px))] lg:pb-0
          max-lg:bottom-0 max-lg:left-0 max-lg:right-0 max-lg:top-auto max-lg:max-h-[min(92dvh,calc(100dvh-env(safe-area-inset-bottom)))] max-lg:rounded-t-2xl max-lg:border max-lg:border-b-0
          lg:right-0 lg:top-0 lg:bottom-0 lg:h-[100dvh] lg:max-h-[100dvh] lg:rounded-none lg:border-l lg:border-t-0
          ${isOpen ? 'max-lg:translate-y-0 lg:translate-x-0' : 'max-lg:translate-y-full lg:translate-x-full'}`}
      >
        <div
          className="flex items-center justify-between px-4 sm:px-5 pt-[max(12px,env(safe-area-inset-top,0px))] pb-3 sm:pb-4 border-b border-[var(--border)] shrink-0 bg-[var(--bg-secondary)]"
        >
          <h2 className="font-bold text-base sm:text-lg text-[var(--text-primary)] pr-2">Aperçu rapide</h2>
          <button
            onClick={onClose}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl hover:bg-[var(--bg-hover)] transition-colors text-[var(--text-secondary)]"
            aria-label="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div
          className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden overscroll-y-contain touch-pan-y"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {/* Image principale : hauteur plafonnée sur mobile ; carré sur lg+ */}
          <div className="relative w-full shrink-0 overflow-hidden bg-neutral-100 dark:bg-neutral-800 h-[min(40vh,260px)] lg:h-auto lg:aspect-square">
            {mainImage ? (
              <img
                src={mainImage}
                alt="Référence"
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full min-h-[140px] items-center justify-center text-neutral-400">
                <FileText className="w-12 h-12 sm:w-16 sm:h-16" />
              </div>
            )}
          </div>
          <div className="p-4 sm:p-5 space-y-4 sm:space-y-5">
            <div className="min-w-0">
              <h3 className="font-semibold text-lg sm:text-xl text-[var(--text-primary)] break-words">{clientName}</h3>
              <div className="flex items-start gap-2 mt-1 text-sm text-[var(--text-secondary)] min-w-0">
                <Mail className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="break-all sm:break-words min-w-0">{clientEmail}</span>
              </div>
            </div>

            {/* Contacter le client (hors acompte) */}
            <div className="flex flex-col sm:flex-row flex-wrap gap-2">
              {ig && (
                <a
                  href={instagramMessageUrl(ig)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-3 py-2.5 min-h-[44px] rounded-xl text-sm font-semibold bg-gradient-to-r from-pink-500/15 to-purple-500/15 border border-pink-200/80 dark:border-pink-500/30 text-pink-700 dark:text-pink-300 hover:opacity-90 active:scale-[0.98] transition-all w-full sm:w-auto"
                >
                  <AtSign className="w-4 h-4 shrink-0" /> Instagram
                </a>
              )}
              <a
                href={mailtoHref ?? '#'}
                className="inline-flex items-center justify-center gap-2 px-3 py-2.5 min-h-[44px] rounded-xl text-sm font-semibold border border-[var(--border)] text-[var(--text-primary)] hover:bg-[var(--bg-hover)] active:scale-[0.98] transition-all w-full sm:w-auto touch-manipulation"
                aria-disabled={!mailtoHref}
                onClick={(e) => {
                  if (!mailtoHref) {
                    e.preventDefault();
                    e.stopPropagation();
                    toast.error('Adresse e-mail du client invalide ou manquante.');
                    return;
                  }
                  handleMailtoClick(e, mailtoHref);
                }}
              >
                <Mail className="w-4 h-4 shrink-0" /> Email
              </a>
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

            {/* Synthèse rapide */}
            <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] p-4 space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">Synthèse</h4>
              <ul className="text-sm text-[var(--text-primary)] space-y-1.5 list-disc list-inside">
                <li>Type : {requestType === 'flash' ? 'Flash / prédessiné' : 'Projet sur mesure'}</li>
                {displayPlacement && <li>Emplacement : {displayPlacement}</li>}
                {displaySize && <li>Taille indiquée : {displaySize}</li>}
                {budget && <li>Budget annoncé : {budget}</li>}
                <li>{refImages.length} visuel{refImages.length > 1 ? 's' : ''} de référence</li>
                <li>Texte projet : ~{description.replace(/\s+/g, ' ').trim().split(' ').filter(Boolean).length} mots</li>
              </ul>
            </div>

            {/* Description */}
            <div>
              <h4 className="text-sm font-semibold text-[var(--text-secondary)] mb-2">Description complète</h4>
              <p className="text-sm text-[var(--text-primary)] leading-relaxed whitespace-pre-wrap">{description}</p>
            </div>

            {/* Disponibilités client */}
            {(requestedDate || requestedTime) && (
              <div>
                <h4 className="text-sm font-semibold text-[var(--text-secondary)] mb-2">Disponibilités</h4>
                <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-2 text-sm text-[var(--text-primary)]">
                  <span className="flex items-start gap-2 min-w-0">
                    <Calendar className="w-4 h-4 shrink-0 mt-0.5" />
                    {requestedDate && (
                      <span className="break-words">
                        {new Date(requestedDate).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                      </span>
                    )}
                  </span>
                  {requestedTime && (
                    <span className="flex items-center gap-1.5 sm:ml-0 pl-6 sm:pl-0">
                      <Clock className="w-4 h-4 shrink-0" />
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
                    className="w-full min-h-[44px] flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 active:scale-[0.98] transition-all"
                  >
                    <CheckCircle className="w-5 h-5" />
                    Envoyer le lien d&apos;acompte (Stripe)
                  </button>
                )}
                {onProposeDate && (
                  <button
                    onClick={() => onProposeDate(item)}
                    className="w-full min-h-[44px] flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-[var(--border)] font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-hover)] active:scale-[0.98] transition-all"
                  >
                    <Calendar className="w-5 h-5" />
                    Proposer une autre date
                  </button>
                )}
                {onReject && (
                  <button
                    onClick={() => onReject(item)}
                    className="w-full min-h-[44px] flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-zinc-100 text-zinc-600 dark:bg-zinc-500/20 dark:text-zinc-400 font-semibold hover:bg-zinc-200 dark:hover:bg-zinc-500/30 active:scale-[0.98] transition-all"
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
