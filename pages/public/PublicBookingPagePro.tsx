import React, { useState, useEffect } from 'react';
import {
  ArrowLeft, Calendar, Check, Shield, Info,
  ChevronRight, Star, MapPin, Instagram, User
} from 'lucide-react';
import { Logo } from '../../components/Logo';
import { VitrineBookingForm } from '../../components/booking/VitrineBookingForm';
import { getStudioIdBySlug } from '../../lib/supabaseDashboard';
import { getVitrineDataBySlugAsync } from '../../lib/vitrineStorage';

const supabaseEnabled = !!(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY);

interface PublicBookingPageProProps {
  studioSlug: string;
}

export const PublicBookingPagePro: React.FC<PublicBookingPageProProps> = ({ studioSlug }) => {
  const [studioId, setStudioId] = useState<string | null | 'loading'>('loading');
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);

  useEffect(() => {
    if (supabaseEnabled) {
      getStudioIdBySlug(studioSlug).then((id) => setStudioId(id ?? null));
    } else {
      setStudioId(null);
    }
  }, [studioSlug]);

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    serviceType: '',
    flashId: '',
    artistId: '',
    date: '',
    time: '',
    name: '',
    email: '',
    phone: '',
    message: ''
  });

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
      .catch(() => {});
  }, [studioSlug]);

  const studio = studioInfo ?? { name: studioSlug, address: '', avatar: '', instagram: '', rating: 0, reviewCount: 0 };

  const serviceTypes = [
    { id: 'custom', name: 'Tatouage personnalisé', description: 'Design unique créé pour vous', price: 'À partir de 150€', duration: '2-4h', icon: '🎨' },
    { id: 'flash', name: 'Flash tattoo', description: 'Designs pré-dessinés', price: '80-200€', duration: '1-2h', icon: '⚡' },
    { id: 'consultation', name: 'Consultation gratuite', description: 'Discutez de votre projet', price: 'Gratuit', duration: '30min', icon: '💬' }
  ];

  const artists = [
    { id: 'alex', name: 'Alex Martin', specialties: ['Neo-Traditional', 'Couleur', 'Portrait'], avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Alex', rating: 4.9, experience: '12 ans' },
    { id: 'sophie', name: 'Sophie Dubois', specialties: ['Blackwork', 'Dotwork', 'Géométrique'], avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Sophie', rating: 4.9, experience: '8 ans' }
  ];

  const flashDesigns = [
    { id: 'f1', name: 'Dragon Minimaliste', price: 120, image: 'https://images.unsplash.com/photo-1611501275019-9b5cda994e8d?w=200' },
    { id: 'f2', name: 'Rose Traditional', price: 180, image: 'https://images.unsplash.com/photo-1590246814883-57c511e76917?w=200' },
    { id: 'f3', name: 'Serpent Blackwork', price: 200, image: 'https://images.unsplash.com/photo-1565058379802-bbe93b2f703f?w=200' }
  ];

  const getAvailableSlots = () => {
    const slots = [];
    for (let hour = 10; hour <= 18; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`);
      if (hour < 18) slots.push(`${hour.toString().padStart(2, '0')}:30`);
    }
    return slots;
  };

  const getAvailableDates = () => {
    const dates = [];
    const today = new Date();
    for (let i = 1; i <= 30; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      if (date.getDay() !== 0) {
        dates.push(date.toISOString().split('T')[0]);
      }
    }
    return dates.slice(0, 20);
  };

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const nextStep = () => { if (step < 4) setStep(step + 1); };
  const prevStep = () => { if (step > 1) setStep(step - 1); };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStep(5);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

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

  if (supabaseEnabled && studioId && studioId !== 'loading' && !bookingSuccess) {
    return (
      <div className="landing-scroll bg-zinc-950 min-h-screen">
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
      <div className="landing-scroll bg-zinc-950 min-h-screen">
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

  return (
    <div className="landing-scroll bg-neutral-50">
      <header className="bg-white border-b border-neutral-200 sticky top-0 z-40 safe-top">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <a href={`/studio/${studioSlug}`} className="flex items-center gap-2 text-neutral-700 hover:text-neutral-900 font-medium transition-colors">
              <ArrowLeft className="w-5 h-5" />
              <span className="hidden sm:inline">Retour au studio</span>
            </a>
            <div className="flex items-center gap-3">
              <Logo className="invert" />
              <div className="hidden sm:block">
                <div className="font-bold">{studio.name}</div>
                <div className="text-xs text-neutral-500">Réservation en ligne</div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Shield className="w-5 h-5 text-green-600" />
              <span className="hidden sm:inline text-neutral-600">Paiement sécurisé</span>
            </div>
          </div>
        </div>
      </header>

      <div className="bg-white border-b border-neutral-200">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex justify-between relative">
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className="flex-1 flex items-center">
                <div className="relative z-10">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg transition-all ${step >= s ? 'bg-neutral-900 text-white shadow-lg' : 'bg-neutral-200 text-neutral-400'}`}>
                    {step > s ? <Check className="w-6 h-6" /> : s}
                  </div>
                  <div className={`mt-2 text-xs font-medium text-center ${step >= s ? 'text-neutral-900' : 'text-neutral-400'}`}>
                    {s === 1 ? 'Service' : s === 2 ? 'Artiste' : s === 3 ? 'Date' : 'Infos'}
                  </div>
                </div>
                {s < 4 && <div className="flex-1 h-1 mx-2"><div className={`h-full rounded transition-colors ${step > s ? 'bg-neutral-900' : 'bg-neutral-200'}`} /></div>}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12 safe-bottom">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit}>
              {step === 1 && (
                <div className="bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-xl border border-neutral-200 space-y-6">
                  <div>
                    <h2 className="text-2xl sm:text-3xl font-bold mb-2">Choisissez votre service</h2>
                    <p className="text-neutral-600">Sélectionnez le type de tatouage souhaité</p>
                  </div>
                  <div className="grid gap-4">
                    {serviceTypes.map((service) => (
                      <button key={service.id} type="button" onClick={() => {
                        updateFormData('serviceType', service.id);
                        if (service.id !== 'flash') nextStep();
                      }}
                        className={`group p-6 rounded-2xl border-2 transition-all text-left hover:border-neutral-900 hover:shadow-lg ${formData.serviceType === service.id ? 'border-neutral-900 bg-neutral-50' : 'border-neutral-200'}`}>
                        <div className="flex items-start gap-4">
                          <div className="text-5xl">{service.icon}</div>
                          <div className="flex-1">
                            <h3 className="text-xl font-bold mb-2">{service.name}</h3>
                            <p className="text-neutral-600 mb-4">{service.description}</p>
                            <div className="flex items-center gap-4 text-sm">
                              <span className="font-semibold text-neutral-900">{service.price}</span>
                              <span className="text-neutral-500">• {service.duration}</span>
                            </div>
                          </div>
                          <ChevronRight className="w-6 h-6 text-neutral-400 group-hover:text-neutral-900 transition-colors" />
                        </div>
                      </button>
                    ))}
                  </div>
                  {formData.serviceType === 'flash' && (
                    <div className="pt-6 border-t border-neutral-200">
                      <h3 className="font-bold text-lg mb-4">Sélectionnez un flash</h3>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                        {flashDesigns.map((flash) => (
                          <button key={flash.id} type="button" onClick={() => { updateFormData('flashId', flash.id); nextStep(); }}
                            className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all ${formData.flashId === flash.id ? 'border-neutral-900 ring-4 ring-neutral-900/20' : 'border-neutral-200 hover:border-neutral-400'}`}>
                            <img src={flash.image} alt={flash.name} loading="lazy" className="w-full h-full object-cover" />
                            {formData.flashId === flash.id && (
                              <div className="absolute top-2 right-2 w-8 h-8 bg-neutral-900 rounded-full flex items-center justify-center">
                                <Check className="w-5 h-5 text-white" />
                              </div>
                            )}
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                              <div className="text-white text-sm font-bold">{flash.price}€</div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {step === 2 && (
                <div className="bg-white rounded-3xl p-8 shadow-xl border border-neutral-200 space-y-6">
                  <div>
                    <h2 className="text-3xl font-bold mb-2">Choisissez votre artiste</h2>
                    <p className="text-neutral-600">Sélectionnez l'artiste qui réalisera votre tatouage</p>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-6">
                    {artists.map((artist) => (
                      <button key={artist.id} type="button" onClick={() => { updateFormData('artistId', artist.id); nextStep(); }}
                        className={`group p-6 rounded-2xl border-2 transition-all text-left hover:border-neutral-900 hover:shadow-lg ${formData.artistId === artist.id ? 'border-neutral-900 bg-neutral-50' : 'border-neutral-200'}`}>
                        <img src={artist.avatar} alt={artist.name} loading="lazy" className="w-20 h-20 rounded-2xl mb-4" />
                        <h3 className="text-xl font-bold mb-2">{artist.name}</h3>
                        <p className="text-sm text-neutral-600 mb-3">{artist.experience} d'expérience</p>
                        <div className="flex items-center gap-2 mb-4">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm font-semibold">{artist.rating}</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {artist.specialties.map((spec) => (
                            <span key={spec} className="px-2 py-1 bg-neutral-900 text-white text-xs rounded-full">{spec}</span>
                          ))}
                        </div>
                      </button>
                    ))}
                  </div>
                  <button type="button" onClick={prevStep} className="w-full py-3 border-2 border-neutral-200 rounded-xl font-semibold hover:bg-neutral-900 hover:text-white hover:border-neutral-900 transition-colors">
                    Retour
                  </button>
                </div>
              )}

              {step === 3 && (
                <div className="bg-white rounded-3xl p-8 shadow-xl border border-neutral-200 space-y-6">
                  <div>
                    <h2 className="text-3xl font-bold mb-2">Choisissez la date et l'heure</h2>
                    <p className="text-neutral-600">Sélectionnez un créneau disponible</p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-3">Date</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {getAvailableDates().slice(0, 8).map((date) => (
                        <button key={date} type="button" onClick={() => updateFormData('date', date)}
                          className={`p-4 rounded-xl border-2 transition-all text-center ${formData.date === date ? 'border-neutral-900 bg-neutral-900 text-white' : 'border-neutral-200 hover:border-neutral-400'}`}>
                          <div className="text-sm font-semibold mb-1">{new Date(date).toLocaleDateString('fr-FR', { weekday: 'short' })}</div>
                          <div className="text-lg font-bold">{new Date(date).getDate()}</div>
                          <div className="text-xs opacity-75">{new Date(date).toLocaleDateString('fr-FR', { month: 'short' })}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                  {formData.date && (
                    <div>
                      <label className="block text-sm font-semibold mb-3">Horaire</label>
                      <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                        {getAvailableSlots().map((time) => (
                          <button key={time} type="button" onClick={() => { updateFormData('time', time); nextStep(); }}
                            className={`py-3 rounded-xl border-2 transition-all font-semibold ${formData.time === time ? 'border-neutral-900 bg-neutral-900 text-white' : 'border-neutral-200 hover:border-neutral-400'}`}>
                            {time}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  <button type="button" onClick={prevStep} className="w-full py-3 border-2 border-neutral-200 rounded-xl font-semibold hover:bg-neutral-900 hover:text-white hover:border-neutral-900 transition-colors">
                    Retour
                  </button>
                </div>
              )}

              {step === 4 && (
                <div className="bg-white rounded-3xl p-8 shadow-xl border border-neutral-200 space-y-6">
                  <div>
                    <h2 className="text-3xl font-bold mb-2">Vos informations</h2>
                    <p className="text-neutral-600">Pour finaliser votre réservation</p>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold mb-2">Nom complet *</label>
                      <input type="text" required value={formData.name} onChange={(e) => updateFormData('name', e.target.value)}
                        className="w-full px-4 py-3 border-2 border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent" placeholder="Jean Dupont" />
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold mb-2">Email *</label>
                        <input type="email" required value={formData.email} onChange={(e) => updateFormData('email', e.target.value)}
                          className="w-full px-4 py-3 border-2 border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent" placeholder="jean@exemple.com" />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold mb-2">Téléphone *</label>
                        <input type="tel" required value={formData.phone} onChange={(e) => updateFormData('phone', e.target.value)}
                          className="w-full px-4 py-3 border-2 border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent" placeholder="+33 6 12 34 56 78" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2">Message (optionnel)</label>
                      <textarea value={formData.message} onChange={(e) => updateFormData('message', e.target.value)} rows={4}
                        className="w-full px-4 py-3 border-2 border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent resize-none"
                        placeholder="Décrivez votre projet, vos idées, ou posez vos questions..." />
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <button type="button" onClick={prevStep} className="flex-1 py-4 border-2 border-neutral-200 rounded-xl font-semibold hover:bg-neutral-900 hover:text-white hover:border-neutral-900 transition-colors">
                      Retour
                    </button>
                    <button type="submit" className="flex-1 py-4 bg-neutral-900 text-white rounded-xl font-semibold hover:bg-neutral-800 flex items-center justify-center gap-2">
                      Confirmer
                      <Check className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}

              {step === 5 && (
                <div className="bg-white rounded-3xl p-12 shadow-xl border border-neutral-200 text-center">
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Check className="w-10 h-10 text-green-600" />
                  </div>
                  <h2 className="text-3xl font-bold mb-4">Réservation confirmée !</h2>
                  <p className="text-neutral-600 mb-8">
                    Nous avons bien reçu votre demande de réservation. Un email de confirmation vous a été envoyé.
                  </p>
                  <div className="bg-neutral-50 rounded-2xl p-6 mb-8 text-left">
                    <h3 className="font-bold mb-4">Récapitulatif</h3>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between"><span className="text-neutral-600">Date</span><span className="font-semibold">{formatDate(formData.date)}</span></div>
                      <div className="flex justify-between"><span className="text-neutral-600">Heure</span><span className="font-semibold">{formData.time}</span></div>
                      <div className="flex justify-between"><span className="text-neutral-600">Artiste</span><span className="font-semibold">{artists.find(a => a.id === formData.artistId)?.name}</span></div>
                    </div>
                  </div>
                  <a href={`/studio/${studioSlug}`} className="inline-block px-8 py-4 bg-neutral-900 text-white rounded-xl font-semibold hover:bg-neutral-800 transition-colors">
                    Retour au studio
                  </a>
                </div>
              )}
            </form>
          </div>

          {step < 5 && (
            <div className="lg:sticky lg:top-32 h-fit">
              <div className="bg-white rounded-3xl p-8 shadow-xl border border-neutral-200">
                <h3 className="text-xl font-bold mb-6">Récapitulatif</h3>
                <div className="space-y-4 mb-6">
                  {formData.serviceType && (
                    <div className="flex justify-between text-sm">
                      <span className="text-neutral-600">Service</span>
                      <span className="font-semibold">{serviceTypes.find(s => s.id === formData.serviceType)?.name}</span>
                    </div>
                  )}
                  {formData.artistId && (
                    <div className="flex justify-between text-sm">
                      <span className="text-neutral-600">Artiste</span>
                      <span className="font-semibold">{artists.find(a => a.id === formData.artistId)?.name}</span>
                    </div>
                  )}
                  {formData.date && (
                    <div className="flex justify-between text-sm">
                      <span className="text-neutral-600">Date</span>
                      <span className="font-semibold">{new Date(formData.date).toLocaleDateString('fr-FR')}</span>
                    </div>
                  )}
                  {formData.time && (
                    <div className="flex justify-between text-sm">
                      <span className="text-neutral-600">Heure</span>
                      <span className="font-semibold">{formData.time}</span>
                    </div>
                  )}
                </div>
                <div className="pt-6 border-t border-neutral-200 space-y-3">
                  <div className="flex items-center gap-3 text-sm text-neutral-700"><Shield className="w-5 h-5 text-green-600" />Paiement sécurisé</div>
                  <div className="flex items-center gap-3 text-sm text-neutral-700"><Info className="w-5 h-5 text-blue-600" />Confirmation par email</div>
                  <div className="flex items-center gap-3 text-sm text-neutral-700"><Calendar className="w-5 h-5 text-purple-600" />Rappel automatique</div>
                </div>
              </div>
              <div className="mt-6 bg-neutral-100 rounded-2xl p-6">
                <h4 className="font-bold mb-3 flex items-center gap-2"><MapPin className="w-5 h-5" />{studio.name}</h4>
                <p className="text-sm text-neutral-700 mb-4">{studio.address}</p>
                <div className="flex items-center gap-2 text-sm">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-semibold">{studio.rating}</span>
                  <span className="text-neutral-600">({studio.reviewCount} avis)</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
