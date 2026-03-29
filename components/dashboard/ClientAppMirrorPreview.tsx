import React from 'react';
import { MapPin, Heart, Star } from 'lucide-react';

const ACCENT = '#60A5FA';
const BG = '#000000';
const SURFACE = '#111111';
const BORDER = 'rgba(255,255,255,0.1)';
const MUTED = '#737373';

export interface MirrorFlashPreview {
  id: string;
  title: string;
  imageUrl: string;
  price: number;
  featured: boolean;
  artistName: string;
}

interface ClientAppMirrorPreviewProps {
  studioName: string;
  flashes: MirrorFlashPreview[];
  /** Au moins un tatoueur « dispo maintenant » */
  availableNow: boolean;
  cityLabel?: string;
}

/** Simulateur téléphone — aperçu style app client (accents bleus demandés). */
export const ClientAppMirrorPreview: React.FC<ClientAppMirrorPreviewProps> = ({
  studioName,
  flashes,
  availableNow,
  cityLabel = 'Paris',
}) => {
  const featured = flashes.filter((f) => f.featured).slice(0, 4);
  const grid = flashes.slice(0, 4);

  return (
    <div className="flex flex-col items-center">
      <div
        className="relative rounded-[2.5rem] border-[10px] border-zinc-800 shadow-2xl overflow-hidden w-[280px] sm:w-[300px] max-w-full"
        style={{ background: BG }}
      >
        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-20 h-5 bg-black rounded-full z-10" />
        <div className="pt-10 pb-6 px-3 max-h-[520px] overflow-y-auto scrollbar-hide">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-[10px] uppercase tracking-wider" style={{ color: MUTED }}>
                Découvrir
              </p>
              <p className="text-lg font-bold text-white truncate max-w-[160px]">{studioName}</p>
            </div>
            {availableNow && (
              <span
                className="text-[9px] font-bold px-2 py-1 rounded-full whitespace-nowrap"
                style={{ background: 'rgba(34,197,94,0.2)', color: '#4ade80' }}
              >
                Dispo
              </span>
            )}
          </div>

          <div
            className="rounded-2xl px-3 py-2 mb-3 flex items-center gap-2 text-[11px]"
            style={{ background: SURFACE, border: `1px solid ${BORDER}`, color: MUTED }}
          >
            <MapPin className="w-3.5 h-3.5 shrink-0" style={{ color: ACCENT }} />
            Autour de moi · {cityLabel}
          </div>

          {featured.length > 0 && (
            <div className="mb-3">
              <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: MUTED }}>
                En vedette
              </p>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {featured.map((f) => (
                  <div
                    key={f.id}
                    className="flex-shrink-0 w-20 rounded-xl overflow-hidden border"
                    style={{ borderColor: BORDER }}
                  >
                    <div
                      className="h-16 bg-zinc-800 bg-cover bg-center"
                      style={{ backgroundImage: f.imageUrl ? `url(${f.imageUrl})` : undefined }}
                    />
                    <p className="text-[9px] text-white px-1 py-1 truncate">{f.title}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: MUTED }}>
            Flashs
          </p>
          <div className="grid grid-cols-2 gap-2">
            {grid.map((f) => (
              <div
                key={f.id}
                className="rounded-xl overflow-hidden border"
                style={{ borderColor: BORDER, background: SURFACE }}
              >
                <div
                  className="aspect-square bg-zinc-800 bg-cover bg-center relative"
                  style={{ backgroundImage: f.imageUrl ? `url(${f.imageUrl})` : undefined }}
                >
                  <button
                    type="button"
                    className="absolute top-1 right-1 w-7 h-7 rounded-full flex items-center justify-center border"
                    style={{ borderColor: BORDER, background: 'rgba(0,0,0,0.45)' }}
                  >
                    <Heart className="w-3.5 h-3.5 text-white" />
                  </button>
                </div>
                <div className="p-1.5">
                  <p className="text-[9px] font-semibold text-white truncate">{f.title}</p>
                  <p className="text-[8px] truncate" style={{ color: MUTED }}>
                    {f.artistName}
                  </p>
                  <p className="text-[10px] font-bold mt-0.5" style={{ color: ACCENT }}>
                    {f.price}€
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div
            className="mt-4 flex justify-around py-2 rounded-2xl border-t"
            style={{ borderColor: BORDER }}
          >
            <div className="flex flex-col items-center gap-0.5" style={{ color: ACCENT }}>
              <Star className="w-4 h-4 fill-current opacity-80" />
              <span className="text-[8px] font-semibold">Explorer</span>
            </div>
            <div className="flex flex-col items-center gap-0.5" style={{ color: MUTED }}>
              <span className="text-[8px]">RDV</span>
            </div>
            <div className="flex flex-col items-center gap-0.5" style={{ color: MUTED }}>
              <span className="text-[8px]">Wallet</span>
            </div>
          </div>
        </div>
      </div>
      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-3 text-center max-w-[280px]">
        Aperçu temps réel — ce que les clients voient dans l&apos;app
      </p>
    </div>
  );
};
