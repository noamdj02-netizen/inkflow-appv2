import React, { useEffect, useState, useOptimistic, useTransition } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Heart, Calendar, Share2, MapPin, Clock, Ruler, Instagram, ExternalLink } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { CX } from '../../components/client/clientExperienceTypes';
import { useToast } from '../../contexts/ToastContext';

interface FlashData {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  image_url: string | null;
  price: number;
  deposit_amount: number;
  size: string;
  estimated_duration: number;
  category: string | null;
  available: boolean;
  artist_id: string | null;
  studio_id: string;
  artist_name?: string;
  artist_slug?: string;
  artist_available_now?: boolean;
  artist_instagram_url?: string | null;
  studio_name?: string;
  studio_slug?: string;
}

interface FlashPageProps {
  flashSlug: string;
}

export const FlashPage: React.FC<FlashPageProps> = ({ flashSlug }) => {
  const toast = useToast();
  const [flash, setFlash] = useState<FlashData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sessionEmail, setSessionEmail] = useState<string | null>(null);
  const [isFavorited, setIsFavorited] = useState(false);
  const [optimisticFav, setOptimisticFav] = useOptimistic(isFavorited);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSessionEmail(data.session?.user?.email ?? null);
    });
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);

      const { data: flashData, error: flashErr } = await supabase
        .from('inkflow_flash_designs')
        .select(`
          id, slug, title, description, image_url, price, deposit_amount, size, 
          estimated_duration, category, available, artist_id, studio_id,
          inkflow_artists(name, slug, available_now, instagram_url),
          inkflow_studios(studio_name, slug)
        `)
        .eq('slug', flashSlug)
        .maybeSingle();

      if (flashErr || !flashData) {
        setError('Flash introuvable');
        setLoading(false);
        return;
      }

      const artistInfo = flashData.inkflow_artists as {
        name?: string;
        slug?: string;
        available_now?: boolean;
        instagram_url?: string | null;
      } | null;
      const studioInfo = flashData.inkflow_studios as { studio_name?: string; slug?: string } | null;

      setFlash({
        ...flashData,
        artist_name: artistInfo?.name,
        artist_slug: artistInfo?.slug,
        artist_available_now: Boolean(artistInfo?.available_now),
        artist_instagram_url: artistInfo?.instagram_url ?? null,
        studio_name: studioInfo?.studio_name,
        studio_slug: studioInfo?.slug,
      });

      if (sessionEmail) {
        const { data: favData } = await supabase
          .from('inkflow_client_favorites')
          .select('id')
          .eq('client_email', sessionEmail)
          .eq('flash_id', flashData.id)
          .maybeSingle();
        setIsFavorited(!!favData);
      }

      setLoading(false);
    })();
  }, [flashSlug, sessionEmail]);

  const toggleFavorite = async () => {
    if (!sessionEmail || !flash) {
      toast.error('Connecte-toi pour ajouter aux favoris');
      return;
    }

    const newState = !optimisticFav;
    startTransition(() => {
      setOptimisticFav(newState);
    });

    try {
      if (newState) {
        await supabase
          .from('inkflow_client_favorites')
          .insert({ client_email: sessionEmail, flash_id: flash.id });
        toast.success('Ajouté aux favoris');
      } else {
        await supabase
          .from('inkflow_client_favorites')
          .delete()
          .eq('client_email', sessionEmail)
          .eq('flash_id', flash.id);
        toast.success('Retiré des favoris');
      }
      setIsFavorited(newState);
    } catch {
      setOptimisticFav(!newState);
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const share = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: flash?.title ?? 'Flash Inkflow',
          text: `Découvre ce flash sur Inkflow`,
          url: window.location.href,
        });
      } catch {}
    }
  };

  const sizeLabels: Record<string, string> = {
    small: 'Petit (< 10cm)',
    medium: 'Moyen (10-20cm)',
    large: 'Grand (> 20cm)',
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: CX.bg }}>
        <div className="w-10 h-10 rounded-full border-2 animate-spin" style={{ borderColor: CX.border, borderTopColor: CX.accent }} />
      </div>
    );
  }

  if (error || !flash) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6" style={{ background: CX.bg, color: CX.text }}>
        <p className="text-lg font-semibold mb-4">{error ?? 'Flash introuvable'}</p>
        <a href="/client/dashboard" className="text-sm underline" style={{ color: CX.accent }}>
          Retour à l'exploration
        </a>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-32" style={{ background: CX.bg, color: CX.text }}>
      {/* Image */}
      <div className="relative aspect-square">
        <div
          className="absolute inset-0"
          style={{
            background: flash.image_url
              ? `url(${flash.image_url}) center/cover`
              : 'linear-gradient(135deg, #1a1a1a, #2a1810)',
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40" />
        <button
          type="button"
          onClick={() => window.history.back()}
          className="absolute top-4 left-4 w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-md border z-10"
          style={{ background: 'rgba(0,0,0,0.4)', borderColor: CX.border }}
        >
          <ArrowLeft className="w-5 h-5" style={{ color: CX.text }} />
        </button>
        <div className="absolute top-4 right-4 flex gap-2">
          <button
            type="button"
            onClick={toggleFavorite}
            disabled={isPending}
            className="w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-md border z-10 transition-all active:scale-95"
            style={{ background: 'rgba(0,0,0,0.4)', borderColor: CX.border }}
          >
            <Heart
              className="w-5 h-5"
              style={{
                color: optimisticFav ? '#fb7185' : CX.text,
                fill: optimisticFav ? '#fb7185' : 'none',
              }}
            />
          </button>
          <button
            type="button"
            onClick={share}
            className="w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-md border z-10"
            style={{ background: 'rgba(0,0,0,0.4)', borderColor: CX.border }}
          >
            <Share2 className="w-5 h-5" style={{ color: CX.text }} />
          </button>
        </div>
        {!flash.available && (
          <div className="absolute bottom-4 left-4 px-3 py-1.5 rounded-full text-xs font-bold bg-red-500/90 text-white">
            Réservé
          </div>
        )}
      </div>

      {/* Content */}
      <div className="px-4 pt-5 space-y-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{flash.title}</h1>
          <p className="text-2xl font-black mt-1" style={{ color: CX.accent }}>
            {flash.price}€
          </p>
        </div>

        {/* Artist & Studio */}
        <div className="flex items-center gap-3 py-3 border-y" style={{ borderColor: CX.border }}>
          {flash.artist_name && (
            <div className="flex flex-col gap-1 min-w-0">
              <a
                href={flash.artist_slug ? `/artist/${flash.artist_slug}` : '#'}
                className="flex items-center gap-2 text-sm font-medium min-w-0"
                style={{ color: CX.text }}
              >
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0" style={{ background: CX.surface, color: CX.accent }}>
                  {flash.artist_name.slice(0, 1)}
                </div>
                <span className="truncate">{flash.artist_name}</span>
                {flash.artist_available_now && (
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0" style={{ background: 'rgba(34,197,94,0.2)', color: '#4ade80' }}>
                    Dispo
                  </span>
                )}
              </a>
              {flash.artist_instagram_url && (
                <a
                  href={flash.artist_instagram_url.startsWith('http') ? flash.artist_instagram_url : `https://${flash.artist_instagram_url}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs pl-10"
                  style={{ color: CX.muted }}
                >
                  <Instagram className="w-3.5 h-3.5" style={{ color: CX.accent }} />
                  Instagram
                  <ExternalLink className="w-3 h-3 opacity-50" />
                </a>
              )}
            </div>
          )}
          {flash.studio_name && (
            <a
              href={flash.studio_slug ? `/studio/${flash.studio_slug}` : '#'}
              className="flex items-center gap-1.5 text-sm ml-auto"
              style={{ color: CX.muted }}
            >
              <MapPin className="w-3.5 h-3.5" />
              {flash.studio_name}
            </a>
          )}
        </div>

        {/* Details */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl p-4 border" style={{ borderColor: CX.border, background: CX.surface }}>
            <Ruler className="w-5 h-5 mb-2" style={{ color: CX.accent }} />
            <p className="text-xs" style={{ color: CX.muted }}>Taille</p>
            <p className="text-sm font-semibold">{sizeLabels[flash.size] ?? flash.size}</p>
          </div>
          <div className="rounded-2xl p-4 border" style={{ borderColor: CX.border, background: CX.surface }}>
            <Clock className="w-5 h-5 mb-2" style={{ color: CX.accent }} />
            <p className="text-xs" style={{ color: CX.muted }}>Durée estimée</p>
            <p className="text-sm font-semibold">{flash.estimated_duration} min</p>
          </div>
        </div>

        {flash.description && (
          <div>
            <h2 className="text-sm font-bold uppercase tracking-widest mb-2" style={{ color: CX.muted }}>
              Description
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: CX.text }}>
              {flash.description}
            </p>
          </div>
        )}

        {flash.deposit_amount > 0 && (
          <p className="text-xs" style={{ color: CX.muted }}>
            Acompte : {flash.deposit_amount}€ à la réservation
          </p>
        )}
      </div>

      {/* Fixed CTA */}
      <div
        className="fixed bottom-0 left-0 right-0 p-4 border-t backdrop-blur-xl z-20"
        style={{ background: 'rgba(0,0,0,0.92)', borderColor: CX.border, paddingBottom: 'max(16px, env(safe-area-inset-bottom))' }}
      >
        <div className="flex gap-3 max-w-lg mx-auto">
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={toggleFavorite}
            disabled={isPending}
            className="w-14 h-14 rounded-2xl border flex items-center justify-center transition-all"
            style={{
              borderColor: optimisticFav ? '#fb7185' : CX.border,
              background: optimisticFav ? 'rgba(251,113,133,0.15)' : CX.surface,
            }}
          >
            <Heart
              className="w-6 h-6"
              style={{
                color: optimisticFav ? '#fb7185' : CX.text,
                fill: optimisticFav ? '#fb7185' : 'none',
              }}
            />
          </motion.button>
          <a
            href={flash.studio_slug ? `/book/${flash.studio_slug}?flash=${flash.id}` : '#'}
            className="flex-1 flex items-center justify-center gap-2 h-14 rounded-2xl text-base font-bold transition-all active:scale-[0.98]"
            style={{ background: flash.available ? CX.accent : CX.muted, color: '#000' }}
          >
            <Calendar className="w-5 h-5" />
            {flash.available ? 'Réserver ce flash' : 'Indisponible'}
          </a>
        </div>
      </div>
    </div>
  );
};
