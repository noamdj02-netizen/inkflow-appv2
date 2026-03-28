import React, { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';
import { CX } from '../../components/client/clientExperienceTypes';
import { FlashCard } from '../../components/client/FlashCard';
import { SkeletonFlashGrid } from '../../components/client/SkeletonCard';
import { getFavoritedFlashes, toggleFlashFavorite } from '../../lib/clientFavorites';
import { useToast } from '../../contexts/ToastContext';

interface FavoriteFlash {
  id: string;
  slug: string | null;
  title: string;
  imageUrl: string | null;
  price: number;
  artistName: string;
  artistSlug: string | null;
  studioName: string;
}

interface ClientFavoritesTabProps {
  sessionEmail: string;
}

export const ClientFavoritesTab: React.FC<ClientFavoritesTabProps> = ({ sessionEmail }) => {
  const toast = useToast();
  const [flashes, setFlashes] = useState<FavoriteFlash[]>([]);
  const [loading, setLoading] = useState(true);
  const [favSet, setFavSet] = useState<Set<string>>(new Set());

  useEffect(() => {
    (async () => {
      setLoading(true);
      const data = await getFavoritedFlashes(sessionEmail);
      setFlashes(data as FavoriteFlash[]);
      setFavSet(new Set(data.map((f) => f.id)));
      setLoading(false);
    })();
  }, [sessionEmail]);

  const handleToggleFavorite = useCallback(async (flashId: string, newState: boolean) => {
    try {
      await toggleFlashFavorite(flashId, newState);
      if (newState) {
        setFavSet((prev) => new Set([...prev, flashId]));
      } else {
        setFavSet((prev) => {
          const next = new Set(prev);
          next.delete(flashId);
          return next;
        });
        setFlashes((prev) => prev.filter((f) => f.id !== flashId));
        toast.success('Retiré des favoris');
      }
    } catch (err) {
      toast.error('Erreur lors de la mise à jour');
    }
  }, [toast]);

  if (loading) {
    return (
      <div className="px-4 pt-5 pb-4">
        <SkeletonFlashGrid />
      </div>
    );
  }

  if (flashes.length === 0) {
    return (
      <div className="px-4 pt-5 pb-4">
        <div
          className="rounded-3xl border p-10 text-center"
          style={{ borderColor: CX.border, background: CX.surface }}
        >
          <Heart className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm" style={{ color: CX.muted }}>
            Tu n'as pas encore de favoris
          </p>
          <p className="text-xs mt-2" style={{ color: CX.muted }}>
            Explore les flashs et ajoute-les à tes favoris avec le bouton cœur
          </p>
        </div>
      </div>
    );
  }

  const colA = flashes.filter((_, i) => i % 2 === 0);
  const colB = flashes.filter((_, i) => i % 2 !== 0);

  return (
    <div className="px-4 pt-5 pb-4">
      <h2 className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: CX.muted }}>
        Mes flashs favoris
      </h2>
      <div className="flex gap-3">
        <div className="flex-1 space-y-3">
          {colA.map((f) => (
            <FlashCard
              key={f.id}
              flashId={f.id}
              flashSlug={f.slug}
              imageUrl={f.imageUrl}
              title={f.title}
              artistName={f.artistName}
              artistSlug={f.artistSlug}
              studioName={f.studioName}
              price={f.price}
              isFavorited={favSet.has(f.id)}
              onToggleFavorite={handleToggleFavorite}
              height={180}
            />
          ))}
        </div>
        <div className="flex-1 space-y-3 pt-8">
          {colB.map((f) => (
            <FlashCard
              key={f.id}
              flashId={f.id}
              flashSlug={f.slug}
              imageUrl={f.imageUrl}
              title={f.title}
              artistName={f.artistName}
              artistSlug={f.artistSlug}
              studioName={f.studioName}
              price={f.price}
              isFavorited={favSet.has(f.id)}
              onToggleFavorite={handleToggleFavorite}
              height={200}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
