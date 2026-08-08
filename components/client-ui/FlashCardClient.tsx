/**
 * Carte flash découverte (Explorer / Accueil / Favoris).
 * Spec UX : image pleine largeur sans texte ni prix superposés — prix + badge sous la photo.
 * Typo : `font-client-app` (Inter) dans le corps.
 */
import React, { useState } from 'react';
import { Heart } from 'lucide-react';
import type { FlashPreview } from '../../lib/supabaseGeo';
import { CLIENT_DASHBOARD_THEME, buildClientDesignTokens } from '../../lib/clientDashboardTheme';
import { useToast } from '../../contexts/ToastContext';
import {
  isFavoriteFlashId,
  toggleFavoriteFlashId,
} from '../../lib/clientFavoritesLocal';
import { toggleFavoriteWithSupabaseSync } from '../../lib/clientFavoritesSync';
import { CLIENT_CARD_PALETTES } from './paletteRotation';
import { isStockPhoto } from './clientUiHelpers';

const D = buildClientDesignTokens(CLIENT_DASHBOARD_THEME);

export interface FlashCardClientProps {
  flash: FlashPreview;
  studioIdx: number;
  studioCity: string | null;
  onClick: () => void;
  onFavoritesDirty?: () => void;
  bookingActionsEnabled?: boolean;
  clientEmailForSync?: string | null;
}

export const FlashCardClient: React.FC<FlashCardClientProps> = ({
  flash,
  studioIdx,
  studioCity,
  onClick,
  onFavoritesDirty,
  bookingActionsEnabled: _bookingActionsEnabled = true,
  clientEmailForSync,
}) => {
  void _bookingActionsEnabled;
  const toast = useToast();
  const pal = CLIENT_CARD_PALETTES[studioIdx % CLIENT_CARD_PALETTES.length];
  const [broken, setBroken] = useState(false);
  const [heartBusy, setHeartBusy] = useState(false);
  const hasImg = flash.imageUrl && !broken && !isStockPhoto(flash.imageUrl);
  const fav = isFavoriteFlashId(flash.id);

  const openCard = () => {
    onClick();
  };

  const onHeart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (heartBusy) return;
    if (!clientEmailForSync?.trim()) {
      const now = toggleFavoriteFlashId(flash.id);
      onFavoritesDirty?.();
      toast.success(now ? 'Ajouté aux favoris' : 'Retiré des favoris');
      return;
    }
    setHeartBusy(true);
    try {
      const now = await toggleFavoriteWithSupabaseSync(flash.id, clientEmailForSync);
      onFavoritesDirty?.();
      toast.success(now ? 'Ajouté aux favoris' : 'Retiré des favoris');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Synchronisation impossible. Réessaie.');
    } finally {
      setHeartBusy(false);
    }
  };

  const mediaH = 'clamp(128px, 36vw, 168px)';

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={openCard}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openCard();
        }
      }}
      className="h-full min-h-0 min-w-0 flex flex-col font-client-app touch-manipulation"
      style={{
        background: D.card,
        border: `1px solid ${D.border}`,
        borderRadius: D.r.lg,
        overflow: 'hidden',
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'border-color 0.2s, box-shadow 0.2s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = `${CLIENT_DASHBOARD_THEME.accent}55`;
        e.currentTarget.style.boxShadow = D.shadowLg;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = D.border;
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      {/* Zone média : aucun texte ni prix — seulement visuel + favori */}
      <div className="relative w-full shrink-0 overflow-hidden" style={{ height: mediaH, background: pal.bg }}>
        {hasImg ? (
          <img
            src={flash.imageUrl}
            alt=""
            onError={() => setBroken(true)}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <svg width="48" height="48" viewBox="0 0 56 56" fill="none" className="opacity-80">
              <path
                d="M28 6L33 21H48L36 29L40 44L28 36L16 44L20 29L8 21H23Z"
                stroke={pal.dot}
                strokeWidth="1.5"
                fill="none"
              />
            </svg>
          </div>
        )}
        <button
          type="button"
          onClick={onHeart}
          disabled={heartBusy}
          className="absolute right-1.5 top-1.5 z-[2] flex min-h-[40px] min-w-[40px] items-center justify-center rounded-xl active:scale-95 transition-transform sm:min-h-[44px] sm:min-w-[44px] sm:right-2 sm:top-2 disabled:opacity-60"
          style={{
            background: D.contentCardBg,
            border: `1px solid ${D.border}`,
            color: fav ? D.gold : D.muted,
            boxShadow: D.shadow,
          }}
          aria-label={fav ? 'Retirer des favoris' : 'Ajouter aux favoris'}
        >
          <Heart className="h-[18px] w-[18px] sm:h-5 sm:w-5" fill={fav ? 'currentColor' : 'none'} strokeWidth={2} />
        </button>
      </div>

      <div className="flex min-h-0 flex-1 flex-col px-2.5 pb-2.5 pt-2.5 sm:px-3 sm:pb-3 sm:pt-3" style={{ gap: 8 }}>
        <div className="flex items-center justify-between gap-2">
          <span
            className="shrink-0 rounded-full px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-[0.08em]"
            style={{
              background: D.goldDim,
              color: D.gold,
              border: `1px solid ${D.gold}44`,
            }}
          >
            Flash
          </span>
          <span
            className="font-client-app font-client-app--price tabular-nums text-[clamp(13px,3.6vw,16px)] font-extrabold"
            style={{ color: D.text }}
          >
            {flash.price}€
          </span>
        </div>

        <div className="min-h-0 flex-1">
          <p
            className="line-clamp-2 break-words font-semibold leading-snug"
            style={{
              color: D.text,
              fontSize: 'clamp(12px, 3.4vw, 15px)',
              minHeight: '2.5em',
            }}
          >
            {flash.title}
          </p>
          <p
            className="mt-1 line-clamp-2 break-words leading-tight"
            style={{ color: D.muted, fontSize: 'clamp(9px, 2.8vw, 11px)' }}
          >
            {[flash.studioName, flash.style, studioCity].filter(Boolean).join(' · ')}
          </p>
        </div>

        <div
          className="mt-auto flex min-h-[44px] w-full shrink-0 items-center justify-center rounded-xl px-1.5 py-2 sm:px-2"
          style={{ background: D.gold, color: D.onAccent }}
        >
          <span
            className="text-center font-bold leading-tight"
            style={{
              fontSize: 'clamp(10.5px, 3.1vw, 13px)',
              letterSpacing: '-0.02em',
            }}
          >
            Réserver ce flash
          </span>
        </div>
      </div>
    </div>
  );
};
