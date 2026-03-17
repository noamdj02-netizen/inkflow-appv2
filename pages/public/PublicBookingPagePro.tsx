import React, { useState, useEffect } from 'react';
import { ArrowLeft, Check, MapPin, Instagram, User, XCircle, AlertCircle } from 'lucide-react';
import { Logo } from '../../components/Logo';
import { VitrineBookingForm } from '../../components/booking/VitrineBookingForm';
import { getStudioIdBySlug } from '../../lib/supabaseDashboard';
import { getVitrineDataBySlugAsync } from '../../lib/vitrineStorage';
import { useToast } from '../../contexts/ToastContext';

const supabaseEnabled = !!(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY);

interface PublicBookingPageProProps {
  studioSlug: string;
}

export const PublicBookingPagePro: React.FC<PublicBookingPageProProps> = ({ studioSlug }) => {
  const toast = useToast();
  const [studioId, setStudioId] = useState<string | null | 'loading'>('loading');
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);

  const paymentStatus = (() => {
    if (typeof window === 'undefined') return null;
    const p = new URLSearchParams(window.location.search).get('payment');
    if (p === 'success') return 'success';
    if (p === 'cancelled') return 'cancelled';
    if (p === 'error') return 'error';
    return null;
  })();

  useEffect(() => {
    if (supabaseEnabled) {
      getStudioIdBySlug(studioSlug).then((id) => setStudioId(id ?? null));
    } else {
      setStudioId(null);
    }
  }, [studioSlug]);

  const [studioInfo, setStudioInfo] = useState<{ name: string; address: string; avatar: string; instagram: string; rating: number; reviewCount: number } | null>(null);

  useEffect(() => {
    getVitrineDataBySlugAsync(studioSlug)
      .then((data) => {
        if (data) {
          setStudioInfo({
            name: data.name,
            address: data.address || '',
            avatar: data.avatar || '',
            instagram: data.instagram || '',
            rating: 4.9,
            reviewCount: data.testimonials?.length || 0,
          });
        }
      })
      .catch(() => {
        toast.error('Impossible de charger les informations du studio');
      });
  }, [studioSlug]);

  const studio = studioInfo ?? { name: studioSlug, address: '', avatar: '', instagram: '', rating: 0, reviewCount: 0 };

  if (supabaseEnabled && studioId === 'loading') {
    return (
      <div className="landing-scroll bg-neutral-50 min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-neutral-200 border-t-neutral-900 rounded-full animate-spin" />
      </div>
    );
  }
  if (supabaseEnabled && studioId === null) {
    return (
      <div className="landing-scroll bg-neutral-50 min-h-screen flex items-center justify-center">
        <p className="text-neutral-600">Studio introuvable.</p>
      </div>
    );
  }

  if (supabaseEnabled && studioId && studioId !== 'loading' && paymentStatus === 'success') {
    return (
      <div className="landing-scroll min-h-screen" style={{ backgroundColor: '#09090b' }}>
        <header className="bg-zinc-900/95 border-b border-zinc-800 sticky top-0 z-40 safe-top backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
            <a href={`/studio/${studioSlug}`} className="flex items-center gap-2 text-zinc-300 hover:text-white font-medium transition-colors">
              <ArrowLeft className="w-5 h-5" />
              Retour au studio
            </a>
          </div>
        </header>
        <div className="max-w-xl mx-auto px-4 py-12 text-center">
          <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="w-10 h-10 text-emerald-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">Paiement réussi</h2>
          <p className="text-zinc-400 mb-8">
            Votre acompte a bien été enregistré. Le studio vous contactera pour confirmer votre rendez-vous.
          </p>
          <a href={`/studio/${studioSlug}`} className="inline-block px-8 py-4 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors">
            Retour au studio
          </a>
        </div>
      </div>
    );
  }

  if (supabaseEnabled && studioId && studioId !== 'loading' && paymentStatus === 'cancelled') {
    return (
      <div className="landing-scroll min-h-screen" style={{ backgroundColor: '#09090b' }}>
        <header className="bg-zinc-900/95 border-b border-zinc-800 sticky top-0 z-40 safe-top backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
            <a href={`/studio/${studioSlug}`} className="flex items-center gap-2 text-zinc-300 hover:text-white font-medium transition-colors">
              <ArrowLeft className="w-5 h-5" />
              Retour au studio
            </a>
          </div>
        </header>
        <div className="max-w-xl mx-auto px-4 py-12 text-center">
          <div className="w-20 h-20 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <XCircle className="w-10 h-10 text-amber-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">Paiement annulé</h2>
          <p className="text-zinc-400 mb-8">
            Vous avez annulé le paiement. Vous pouvez réessayer quand vous le souhaitez en retournant sur la page du studio.
          </p>
          <a href={`/studio/${studioSlug}`} className="inline-block px-8 py-4 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors">
            Retour au studio
          </a>
        </div>
      </div>
    );
  }

  if (supabaseEnabled && studioId && studioId !== 'loading' && paymentStatus === 'error') {
    return (
      <div className="landing-scroll min-h-screen" style={{ backgroundColor: '#09090b' }}>
        <header className="bg-zinc-900/95 border-b border-zinc-800 sticky top-0 z-40 safe-top backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
            <a href={`/studio/${studioSlug}`} className="flex items-center gap-2 text-zinc-300 hover:text-white font-medium transition-colors">
              <ArrowLeft className="w-5 h-5" />
              Retour au studio
            </a>
          </div>
        </header>
        <div className="max-w-xl mx-auto px-4 py-12 text-center">
          <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-10 h-10 text-red-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">Erreur de paiement</h2>
          <p className="text-zinc-400 mb-8">
            Une erreur s&apos;est produite lors du paiement. Vérifiez vos informations bancaires ou réessayez plus tard. En cas de problème, contactez directement le studio.
          </p>
          <a href={`/studio/${studioSlug}`} className="inline-block px-8 py-4 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors">
            Retour au studio
          </a>
        </div>
      </div>
    );
  }

  if (supabaseEnabled && studioId && studioId !== 'loading' && !bookingSuccess) {
    return (
      <div className="landing-scroll min-h-screen" style={{ backgroundColor: '#09090b' }}>
        <header className="bg-zinc-900/95 border-b border-zinc-800 sticky top-0 z-40 safe-top backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
            <div className="flex items-center justify-between">
              <a href={`/studio/${studioSlug}`} className="flex items-center gap-2 text-zinc-300 hover:text-white font-medium transition-colors">
                <ArrowLeft className="w-5 h-5" />
                <span className="hidden sm:inline">Retour au studio</span>
              </a>
              <Logo className="invert" />
            </div>
          </div>
        </header>
        <div className="max-w-2xl mx-auto px-4 py-8 sm:py-12">
          {/* En-tête artiste — avatar, nom, infos, bio */}
          <div className="mb-8 sm:mb-10">
            <div className="flex flex-col sm:flex-row sm:items-center gap-6">
              <div className="flex justify-center sm:justify-start">
                {studio.avatar ? (
                  <img src={studio.avatar} alt={studio.name} className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover border-2 border-zinc-700 shadow-lg" />
                ) : (
                  <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-zinc-800 border-2 border-zinc-700 flex items-center justify-center">
                    <User className="w-12 h-12 sm:w-14 sm:h-14 text-zinc-500" strokeWidth={1.5} />
                  </div>
                )}
              </div>
              <div className="flex-1 text-center sm:text-left">
                <h1 className="text-2xl sm:text-3xl font-bold text-white mb-3">{studio.name}</h1>
                <div className="flex flex-wrap gap-4 sm:gap-6 justify-center sm:justify-start text-sm text-zinc-400">
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 flex-shrink-0" strokeWidth={1.5} />
                    {studio.address || 'Ville, Pays'}
                  </span>
                  {studio.instagram && (
                    <span className="flex items-center gap-1.5">
                      <Instagram className="w-4 h-4 flex-shrink-0" strokeWidth={1.5} />
                      {(() => {
                        const raw = studio.instagram.trim();
                        if (raw.startsWith('@')) return raw;
                        const match = raw.match(/instagram\.com\/([^/?]+)/);
                        return match ? `@${match[1]}` : `@${raw}`;
                      })()}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <p className="mt-6 text-zinc-400 text-sm leading-relaxed max-w-2xl">
              Bienvenue sur mon espace de réservation. Décrivez votre projet avec un maximum de détails pour que je puisse l&apos;étudier.
            </p>
          </div>

          <div className="bg-zinc-900 rounded-2xl sm:rounded-3xl p-6 sm:p-8 border border-zinc-800 shadow-2xl">
            <VitrineBookingForm
              studioId={studioId}
              onSubmitSuccess={() => setBookingSuccess(true)}
              onError={setBookingError}
              submitLabel="Envoyer ma demande"
              submitError={bookingError}
              variant="dark"
            />
          </div>
        </div>
      </div>
    );
  }

  if (supabaseEnabled && studioId && studioId !== 'loading' && bookingSuccess) {
    return (
      <div className="landing-scroll min-h-screen" style={{ backgroundColor: '#09090b' }}>
        <header className="bg-zinc-900/95 border-b border-zinc-800 sticky top-0 z-40 safe-top backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
            <a href={`/studio/${studioSlug}`} className="flex items-center gap-2 text-zinc-300 hover:text-white font-medium transition-colors">
              <ArrowLeft className="w-5 h-5" />
              Retour au studio
            </a>
          </div>
        </header>
        <div className="max-w-xl mx-auto px-4 py-12 text-center">
          <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="w-10 h-10 text-emerald-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">Demande envoyée au tatoueur !</h2>
          <p className="text-zinc-400 mb-8">
            Le studio vous recontactera pour confirmer le créneau.
          </p>
          <a href={`/studio/${studioSlug}`} className="inline-block px-8 py-4 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors">
            Retour au studio
          </a>
        </div>
      </div>
    );
  }

  // Fallback: Supabase non configuré — la réservation requiert Supabase
  return (
    <div className="landing-scroll bg-neutral-50 min-h-screen flex items-center justify-center">
      <div className="text-center max-w-md px-4">
        <p className="text-neutral-600 mb-4">La réservation en ligne nécessite une configuration Supabase.</p>
        <a href={`/studio/${studioSlug}`} className="inline-block px-6 py-3 bg-neutral-900 text-white rounded-xl font-semibold hover:bg-neutral-800 transition-colors">
          Retour au studio
        </a>
      </div>
    </div>
  );
};
