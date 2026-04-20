/**
 * Carte artiste horizontale (carrousel Accueil, listes).
 * Image avatar sans texte dessus ; infos en dessous (Inter).
 */
import React, { useState } from 'react';
import { Heart, MapPin } from 'lucide-react';
import type { NearbyStudio } from '../../lib/supabaseGeo';
import { CLIENT_DASHBOARD_THEME, buildClientDesignTokens } from '../../lib/clientDashboardTheme';
import { useToast } from '../../contexts/ToastContext';
import {
  isFavoriteStudioId,
  toggleFavoriteStudioId,
} from '../../lib/clientFavoritesLocal';
import { toggleStudioFavoriteWithSupabaseSync } from '../../lib/clientFavoritesSync';
import { distLabel, discoveryLocationLine } from '../../lib/clientDiscoveryFormat';
import { CLIENT_CARD_PALETTES } from './paletteRotation';
import { initials, isStockPhoto } from './clientUiHelpers';

const D = buildClientDesignTokens(CLIENT_DASHBOARD_THEME);

export interface ArtistCardClientProps {
  studio: NearbyStudio;
  index: number;
  onClick: () => void;
  clientEmailForSync?: string | null;
  onFavoritesDirty?: () => void;
}

export const ArtistCardClient: React.FC<ArtistCardClientProps> = ({
  studio,
  index,
  onClick,
  clientEmailForSync,
  onFavoritesDirty,
}) => {
  const toast = useToast();
  const pal = CLIENT_CARD_PALETTES[index % CLIENT_CARD_PALETTES.length];
  const [broken, setBroken] = useState(false);
  const [heartBusy, setHeartBusy] = useState(false);
  const dist = distLabel(studio.distance_km);
  const locLine = [discoveryLocationLine(studio), dist].filter(Boolean).join(' · ');
  const ariaLabel = locLine
    ? `Voir un flash de ${studio.studio_name}, ${locLine}`
    : `Voir un flash de ${studio.studio_name}`;
  const studioFav = isFavoriteStudioId(studio.id);

  const onHeart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (heartBusy) return;
    if (!clientEmailForSync?.trim()) {
      const now = toggleFavoriteStudioId(studio.id);
      onFavoritesDirty?.();
      toast.success(now ? 'Artiste ajouté aux favoris' : 'Retiré des favoris');
      return;
    }
    setHeartBusy(true);
    try {
      const now = await toggleStudioFavoriteWithSupabaseSync(studio.id, clientEmailForSync);
      onFavoritesDirty?.();
      toast.success(now ? 'Artiste ajouté aux favoris' : 'Retiré des favoris');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Synchronisation impossible. Réessaie.');
    } finally {
      setHeartBusy(false);
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      aria-label={ariaLabel}
      className="group flex w-[158px] shrink-0 cursor-pointer flex-col font-client-app touch-manipulation overflow-hidden rounded-[14px] border text-left transition-all duration-200 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30 focus-visible:ring-offset-2 focus-visible:ring-offset-white active:scale-[0.98] motion-reduce:active:scale-100 sm:w-[168px] sm:hover:-translate-y-px sm:motion-reduce:hover:translate-y-0 sm:hover:shadow-[0_8px_24px_rgba(15,23,42,0.06)]"
      style={{
        background: D.contentCardBg,
        borderColor: D.borderMid,
        padding: 0,
        boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)',
      }}
    >
      <div
        className="relative flex w-full shrink-0 items-center justify-center overflow-hidden"
        style={{
          height: 108,
          background: pal.bg,
        }}
      >
        {studio.avatar_url && !broken && !isStockPhoto(studio.avatar_url) ? (
          <img
            src={studio.avatar_url}
            alt=""
            loading="lazy"
            decoding="async"
            onError={() => setBroken(true)}
            className="h-full w-full min-h-[108px] object-cover object-center transition-transform duration-300 group-hover:scale-[1.03] motion-reduce:group-hover:scale-100"
          />
        ) : (
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: D.r.full,
              background: `${pal.dot}18`,
              border: `1px solid ${pal.dot}40`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 15,
              fontWeight: 700,
              color: pal.dot,
              letterSpacing: '-0.02em',
            }}
          >
            {initials(studio.studio_name)}
          </div>
        )}
        <button
          type="button"
          onClick={onHeart}
          disabled={heartBusy}
          className="absolute right-1.5 top-1.5 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-white/25 bg-black/35 text-white shadow-sm backdrop-blur-sm transition-all active:scale-95 disabled:opacity-50"
          aria-label={studioFav ? 'Retirer des favoris' : 'Ajouter aux favoris'}
        >
          <Heart className="h-[18px] w-[18px]" fill={studioFav ? 'currentColor' : 'none'} strokeWidth={2} />
        </button>
      </div>
      <div className="flex min-h-0 flex-1 flex-col gap-2 px-3 pb-3 pt-2.5">
        <p
          className="line-clamp-2 text-[13px] font-semibold leading-[1.25] tracking-[-0.02em]"
          style={{ color: D.text }}
          title={studio.studio_name}
        >
          {studio.studio_name}
        </p>
        <div className="flex min-w-0 items-start gap-1.5">
          <MapPin className="mt-px h-3.5 w-3.5 shrink-0 opacity-80" style={{ color: D.muted }} strokeWidth={2} aria-hidden />
          <span className="line-clamp-2 text-[11px] leading-snug" style={{ color: D.muted }}>
            {locLine || '—'}
          </span>
        </div>
        <div className="mt-auto flex items-center justify-between gap-2 border-t pt-2" style={{ borderColor: `${D.border}` }}>
          <span className="text-[11px] tabular-nums" style={{ color: D.muted }}>
            {(studio.flash?.length ?? 0)} flash{(studio.flash?.length ?? 0) !== 1 ? 's' : ''}
          </span>
          <span className="text-[11px] font-medium tabular-nums" style={{ color: D.textSub }}>
            {dist ?? '—'}
          </span>
        </div>
      </div>
    </div>
  );
};
