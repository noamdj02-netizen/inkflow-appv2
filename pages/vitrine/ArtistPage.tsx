import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Star, Calendar, Heart, ArrowLeft, Share2, Instagram, ExternalLink, MessageCircle, Bell, Check, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { CX } from '../../components/client/clientExperienceTypes';

interface Artist {
  id: string;
  name: string;
  slug: string;
  bio: string | null;
  avatar_url: string | null;
  styles: string[];
  years_exp: number;
  rating: number;
  tattoos_count: number;
  studio_id: string;
  available_now: boolean;
  instagram_url: string | null;
  studio_name?: string;
  studio_slug?: string;
}

interface Flash {
  id: string;
  slug: string;
  title: string;
  image_url: string | null;
  price: number;
  available: boolean;
}

interface ArtistPageProps {
  artistSlug: string;
}

export const ArtistPage: React.FC<ArtistPageProps> = ({ artistSlug }) => {
  const [artist, setArtist] = useState<Artist | null>(null);
  const [flashes, setFlashes] = useState<Flash[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [following, setFollowing] = useState(false);
  const [sessionEmail, setSessionEmail] = useState<string | null>(null);
  const [waitlisted, setWaitlisted] = useState(false);
  const [waitlistDone, setWaitlistDone] = useState(false);
  const [avatarBroken, setAvatarBroken] = useState(false);

  useEffect(() => {
    setAvatarBroken(false);
  }, [artistSlug]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSessionEmail(data.session?.user?.email ?? null);
    });
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);

      const { data: artistData, error: artistErr } = await supabase
        .from('inkflow_artists')
        .select(`
          id, name, slug, bio, avatar_url, styles, years_exp, rating, tattoos_count, studio_id,
          available_now, instagram_url,
          inkflow_studios(studio_name, slug)
        `)
        .eq('slug', artistSlug)
        .eq('is_active', true)
        .maybeSingle();

      if (artistErr || !artistData) {
        setError('Artiste introuvable');
        setLoading(false);
        return;
      }

      const studioInfo = artistData.inkflow_studios as { studio_name?: string; slug?: string } | null;
      setArtist({
        ...artistData,
        available_now: Boolean(artistData.available_now),
        instagram_url: (artistData.instagram_url as string | null) ?? null,
        studio_name: studioInfo?.studio_name,
        studio_slug: studioInfo?.slug,
      });

      const { data: flashData } = await supabase
        .from('inkflow_flash_designs')
        .select('id, slug, title, image_url, price, available')
        .eq('artist_id', artistData.id)
        .eq('available', true)
        .order('created_at', { ascending: false })
        .limit(20);

      setFlashes(flashData ?? []);

      if (sessionEmail) {
        const { data: followData } = await supabase
          .from('inkflow_client_artist_follows')
          .select('id')
          .eq('client_email', sessionEmail)
          .eq('artist_id', artistData.id)
          .maybeSingle();
        setFollowing(!!followData);
      }

      setLoading(false);
    })();
  }, [artistSlug, sessionEmail]);

  const toggleFollow = async () => {
    if (!sessionEmail || !artist) return;
    const prev = following;
    setFollowing(!prev);

    if (prev) {
      await supabase
        .from('inkflow_client_artist_follows')
        .delete()
        .eq('client_email', sessionEmail)
        .eq('artist_id', artist.id);
    } else {
      await supabase
        .from('inkflow_client_artist_follows')
        .insert({ client_email: sessionEmail, artist_id: artist.id });
    }
  };

  const joinWaitlist = async () => {
    if (!sessionEmail || !artist) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('inkflow_waitlist').upsert({
      client_email: sessionEmail,
      artist_id: artist.id,
      studio_id: artist.studio_id,
      created_at: new Date().toISOString(),
    }, { onConflict: 'client_email,artist_id' });
    setWaitlisted(true);
    setWaitlistDone(true);
    setTimeout(() => setWaitlistDone(false), 4000);
  };

  const openChat = () => {
    if (!sessionEmail || !artist) { window.location.href = '/client'; return; }
    // Thread ID déterministe : client+artiste
    let h = 5381;
    const seed = `${sessionEmail}-${artist.id}`;
    for (let i = 0; i < seed.length; i++) h = ((h << 5) + h) + seed.charCodeAt(i);
    const threadId = `a-${Math.abs(h).toString(36)}`;
    window.location.href = `/c/${threadId}`;
  };

  const share = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: artist?.name ?? 'Artiste Inkflow',
          text: `Découvre ${artist?.name} sur Inkflow`,
          url: window.location.href,
        });
      } catch {}
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: CX.bg }}>
        <div className="w-10 h-10 rounded-full border-2 animate-spin" style={{ borderColor: CX.border, borderTopColor: CX.accent }} />
      </div>
    );
  }

  if (error || !artist) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6" style={{ background: CX.bg, color: CX.text }}>
        <p className="text-lg font-semibold mb-4">{error ?? 'Artiste introuvable'}</p>
        <a href="/client/dashboard" className="text-sm underline" style={{ color: CX.accent }}>
          Retour à l'exploration
        </a>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24" style={{ background: CX.bg, color: CX.text }}>
      {/* Header cover */}
      <div className="relative h-56" style={{ background: `linear-gradient(135deg, #1a1510 0%, #2d2418 100%)` }}>
        <button
          type="button"
          onClick={() => window.history.back()}
          aria-label="Retour"
          className="absolute top-4 left-4 min-h-[44px] min-w-[44px] rounded-full flex items-center justify-center backdrop-blur-md border z-10"
          style={{ background: 'rgba(0,0,0,0.4)', borderColor: CX.border }}
        >
          <ArrowLeft className="w-5 h-5" style={{ color: CX.text }} />
        </button>
        <button
          type="button"
          onClick={share}
          aria-label="Partager"
          className="absolute top-4 right-4 min-h-[44px] min-w-[44px] rounded-full flex items-center justify-center backdrop-blur-md border z-10"
          style={{ background: 'rgba(0,0,0,0.4)', borderColor: CX.border }}
        >
          <Share2 className="w-5 h-5" style={{ color: CX.text }} />
        </button>
      </div>

      {/* Avatar + Name */}
      <div className="px-4 -mt-14 relative z-10">
        <div className="flex items-end gap-4">
          <div
            className="w-28 h-28 rounded-3xl border-4 flex items-center justify-center text-3xl font-black shrink-0 overflow-hidden relative"
            style={{
              borderColor: CX.bg,
              background: CX.surface,
              color: CX.accent,
            }}
          >
            {artist.avatar_url && !avatarBroken ? (
              <img
                src={artist.avatar_url}
                alt=""
                decoding="async"
                className="absolute inset-0 w-full h-full object-cover"
                onError={() => setAvatarBroken(true)}
              />
            ) : (
              <span className="relative z-10">{artist.name.slice(0, 1)}</span>
            )}
          </div>
          <div className="flex-1 pb-2">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">{artist.name}</h1>
              {artist.available_now && (
                <span className="text-[10px] font-bold px-2 py-1 rounded-full" style={{ background: 'rgba(34,197,94,0.2)', color: '#4ade80' }}>
                  Disponible maintenant
                </span>
              )}
            </div>
            {artist.studio_name && (
              <a
                href={artist.studio_slug ? `/studio/${artist.studio_slug}` : '#'}
                className="text-sm flex items-center gap-1"
                style={{ color: CX.muted }}
              >
                <MapPin className="w-3.5 h-3.5" />
                {artist.studio_name}
              </a>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-6 mt-4">
          <div className="flex items-center gap-1.5">
            <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
            <span className="text-sm font-semibold">{artist.rating.toFixed(1)}</span>
          </div>
          <div className="text-sm" style={{ color: CX.muted }}>
            {artist.years_exp} ans d'exp
          </div>
          <div className="text-sm" style={{ color: CX.muted }}>
            {artist.tattoos_count} tattoos
          </div>
        </div>

        {/* Styles */}
        {artist.styles.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {artist.styles.map((s) => (
              <span
                key={s}
                className="text-xs font-medium px-3 py-1.5 rounded-full"
                style={{ background: CX.surface, color: CX.text, border: `1px solid ${CX.border}` }}
              >
                {s}
              </span>
            ))}
          </div>
        )}

        {/* Bio */}
        {artist.bio && (
          <p className="text-sm mt-4 leading-relaxed" style={{ color: CX.muted }}>
            {artist.bio}
          </p>
        )}

        {artist.instagram_url && (
          <a
            href={artist.instagram_url.startsWith('http') ? artist.instagram_url : `https://${artist.instagram_url}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 mt-4 text-sm font-medium transition-opacity hover:opacity-90"
            style={{ color: CX.accent }}
          >
            <Instagram className="w-4 h-4" />
            Instagram
            <ExternalLink className="w-3.5 h-3.5 opacity-60" />
          </a>
        )}

        {/* Action buttons */}
        <div className="space-y-3 mt-6">
          <div className="flex gap-3">
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={toggleFollow}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl border text-sm font-semibold transition-all"
              style={{
                background: following ? CX.accent : CX.surface,
                borderColor: following ? CX.accent : CX.border,
                color: following ? '#000' : CX.text,
              }}
            >
              <Heart className="w-4 h-4" style={{ fill: following ? '#000' : 'none' }} />
              {following ? 'Suivi' : 'Suivre'}
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={openChat}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl border text-sm font-semibold transition-all"
              style={{ background: CX.surface, borderColor: CX.border, color: CX.text }}
            >
              <MessageCircle className="w-4 h-4" style={{ color: CX.accent }} />
              Contacter
            </motion.button>
          </div>

          {artist.available_now ? (
            <a
              href={
                artist.studio_slug
                  ? `/book/${artist.studio_slug}?artist=${encodeURIComponent(artist.slug)}`
                  : '#'
              }
              className="flex w-full items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-semibold transition-all"
              style={{ background: CX.accent, color: '#000' }}
            >
              <Calendar className="w-4 h-4" />
              Réserver
            </a>
          ) : (
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={!waitlisted ? joinWaitlist : undefined}
              className="flex w-full items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-semibold border transition-all"
              style={{
                background: waitlisted ? 'rgba(34,197,94,0.1)' : CX.surface,
                borderColor: waitlisted ? 'rgba(34,197,94,0.5)' : CX.border,
                color: waitlisted ? '#4ade80' : CX.muted,
              }}
            >
              <AnimatePresence mode="wait">
                {waitlistDone ? (
                  <motion.span key="ok" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                    className="flex items-center gap-2">
                    <Check className="w-4 h-4" /> Sur liste d'attente !
                  </motion.span>
                ) : (
                  <motion.span key="w" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                    className="flex items-center gap-2">
                    <Bell className="w-4 h-4" />
                    {waitlisted ? 'Liste d\'attente ✓' : 'Rejoindre la liste d\'attente'}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          )}
        </div>
      </div>

      {/* Portfolio */}
      <section className="px-4 mt-8">
        <h2 className="text-sm font-bold uppercase tracking-widest mb-4" style={{ color: CX.muted }}>
          Flashs disponibles
        </h2>
        {flashes.length === 0 ? (
          <p className="text-sm" style={{ color: CX.muted }}>
            Aucun flash disponible pour le moment.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {flashes.map((f) => (
              <motion.a
                key={f.id}
                href={f.slug ? `/flash/${f.slug}` : '#'}
                whileTap={{ scale: 0.98 }}
                className="rounded-2xl overflow-hidden border"
                style={{ borderColor: CX.border, background: CX.surface }}
              >
                <div
                  className="aspect-square relative overflow-hidden"
                  style={{
                    background: 'linear-gradient(135deg, #1a1a1a, #2a1810)',
                  }}
                >
                  {f.image_url ? (
                    <img
                      src={f.image_url}
                      alt=""
                      loading="lazy"
                      decoding="async"
                      className="absolute inset-0 w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  ) : null}
                </div>
                <div className="p-3">
                  <p className="text-xs font-semibold truncate" style={{ color: CX.text }}>
                    {f.title}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: CX.accent }}>
                    {f.price}€
                  </p>
                </div>
              </motion.a>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
