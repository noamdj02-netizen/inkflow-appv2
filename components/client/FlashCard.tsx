import React, { useOptimistic, useTransition } from 'react';
import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';
import { CX } from './clientExperienceTypes';

interface FlashCardProps {
  flashId: string;
  flashSlug: string | null;
  imageUrl: string | null;
  title: string;
  artistName: string;
  artistSlug: string | null;
  studioName: string;
  distance?: string;
  price: number;
  isFavorited: boolean;
  onToggleFavorite: (flashId: string, newState: boolean) => Promise<void>;
  height?: number;
}

export const FlashCard: React.FC<FlashCardProps> = ({
  flashId,
  flashSlug,
  imageUrl,
  title,
  artistName,
  artistSlug,
  studioName,
  distance,
  price,
  isFavorited,
  onToggleFavorite,
  height = 180,
}) => {
  const [optimisticFav, setOptimisticFav] = useOptimistic(isFavorited);
  const [isPending, startTransition] = useTransition();

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const newState = !optimisticFav;
    startTransition(async () => {
      setOptimisticFav(newState);
      await onToggleFavorite(flashId, newState);
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      whileTap={{ scale: 0.98 }}
      className="rounded-3xl overflow-hidden border backdrop-blur-sm"
      style={{ borderColor: CX.border, background: CX.surface }}
    >
      <a href={flashSlug ? `/flash/${flashSlug}` : '#'} className="block">
        <div
          className="relative"
          style={{
            height,
            background: imageUrl
              ? `url(${imageUrl}) center/cover`
              : `linear-gradient(160deg, #1a1a1a, #2a1810)`,
          }}
        >
          <button
            type="button"
            onClick={handleFavoriteClick}
            disabled={isPending}
            className="absolute top-2 right-2 w-9 h-9 rounded-full flex items-center justify-center border backdrop-blur-md active:scale-95 transition-transform z-10"
            style={{ borderColor: CX.border, background: 'rgba(0,0,0,0.35)' }}
          >
            <Heart
              className="w-4 h-4"
              style={{
                color: optimisticFav ? '#fb7185' : '#fff',
                fill: optimisticFav ? '#fb7185' : 'none',
                transition: 'all 0.2s ease',
              }}
            />
          </button>
          <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent rounded-b-3xl">
            <p className="text-xs font-bold text-white">{title}</p>
            <p className="text-[10px] text-white/80 mt-0.5">
              <a
                href={artistSlug ? `/artist/${artistSlug}` : '#'}
                className="hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                {artistName}
              </a>
              {' @ '}
              {studioName}
              {distance && ` · ${distance}`}
            </p>
          </div>
        </div>
      </a>
      <div className="px-3 py-2 flex items-center justify-between">
        <span className="text-sm font-bold" style={{ color: CX.accent }}>
          {price}€
        </span>
      </div>
    </motion.div>
  );
};
