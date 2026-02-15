import React, { useState } from 'react';
import {
  MapPin, Phone, Mail, Clock, Instagram, ChevronRight, CheckCircle, Star
} from 'lucide-react';
import { Logo } from '../../components/Logo';
import { FlashDesign } from '../../types';

interface PublicStudioPageProps {
  studioSlug: string;
}

export const PublicStudioPage: React.FC<PublicStudioPageProps> = ({ studioSlug }) => {
  const [selectedFlash, setSelectedFlash] = useState<FlashDesign | null>(null);

  const studio = {
    name: "Ink & Art Studio",
    slug: "ink-art-paris",
    description: "Studio de tatouage professionnel à Paris. Spécialisé en Neo-Traditional et Blackwork.",
    avatar: "https://images.unsplash.com/photo-1598371839696-5c5bb00bdc28?w=400",
    coverImage: "https://images.unsplash.com/photo-1590246814883-57c511e76917?w=1200&h=400&fit=crop",
    address: "42 Rue Oberkampf, 75011 Paris",
    phone: "+33 1 23 45 67 89",
    email: "contact@ink-art.fr",
    instagram: "@ink.art.paris",
    rating: 4.9,
    reviewCount: 127,
    openingHours: {
      monday: "10:00 - 19:00",
      tuesday: "10:00 - 19:00",
      wednesday: "10:00 - 19:00",
      thursday: "10:00 - 19:00",
      friday: "10:00 - 20:00",
      saturday: "11:00 - 20:00",
      sunday: "Fermé"
    },
    artists: [
      { name: "Alex Martin", specialties: ["Neo-Traditional", "Couleur"], avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=Alex" },
      { name: "Sophie Dubois", specialties: ["Blackwork", "Dotwork"], avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=Sophie" }
    ],
    portfolio: [
      "https://images.unsplash.com/photo-1598371839696-5c5bb00bdc28?w=400",
      "https://images.unsplash.com/photo-1590246814883-57c511e76917?w=400",
      "https://images.unsplash.com/photo-1611501275019-9b5cda994e8d?w=400",
      "https://images.unsplash.com/photo-1565058379802-bbe93b2f703f?w=400"
    ],
    flashDesigns: [
      { id: 'f1', title: 'Dragon Minimaliste', imageUrl: 'https://images.unsplash.com/photo-1611501275019-9b5cda994e8d?w=400', price: 120, available: true },
      { id: 'f2', title: 'Rose Traditional', imageUrl: 'https://images.unsplash.com/photo-1590246814883-57c511e76917?w=400', price: 180, available: true },
      { id: 'f3', title: 'Lune Géométrique', imageUrl: 'https://images.unsplash.com/photo-1598371839696-5c5bb00bdc28?w=400', price: 150, available: false }
    ]
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="bg-white border-b border-neutral-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Logo />
              <span className="text-lg font-bold">InkFlow</span>
            </div>
            <a href={`/book/${studioSlug}`} className="bg-neutral-900 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-neutral-800 transition-colors">
              Réserver
            </a>
          </div>
        </div>
      </header>

      <div className="relative h-64 md:h-96 overflow-hidden">
        <img src={studio.coverImage} alt={studio.name} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-end gap-4 sm:gap-6">
              <img src={studio.avatar} alt={studio.name} className="w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 rounded-xl sm:rounded-2xl border-2 sm:border-4 border-white shadow-xl object-cover flex-shrink-0" />
              <div className="flex-1 text-white pb-2 min-w-0">
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 truncate">{studio.name}</h1>
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-semibold">{studio.rating}</span>
                    <span className="opacity-90">({studio.reviewCount} avis)</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    <span>Paris 11e</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
          <div className="lg:col-span-2 space-y-8">
            <section className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-neutral-200">
              <h2 className="text-2xl font-bold mb-4">À propos</h2>
              <p className="text-neutral-700 leading-relaxed">{studio.description}</p>
            </section>

            <section className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-neutral-200">
              <h2 className="text-2xl font-bold mb-6">Nos artistes</h2>
              <div className="grid sm:grid-cols-2 gap-6">
                {studio.artists.map((artist, idx) => (
                  <div key={idx} className="flex items-start gap-4 p-4 rounded-xl bg-neutral-50">
                    <img src={artist.avatar} alt={artist.name} className="w-16 h-16 rounded-full bg-neutral-200" />
                    <div>
                      <h3 className="font-bold text-lg">{artist.name}</h3>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {artist.specialties.map((spec, i) => (
                          <span key={i} className="text-xs bg-neutral-200 px-2 py-1 rounded">{spec}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-neutral-200">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Flash disponibles</h2>
                <a href="#flash" className="text-sm font-semibold text-neutral-600 hover:text-neutral-900 flex items-center gap-1">
                  Voir tout <ChevronRight className="w-4 h-4" />
                </a>
              </div>
              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
                {studio.flashDesigns.map((flash) => (
                  <div key={flash.id} className="group relative aspect-square rounded-xl overflow-hidden cursor-pointer" onClick={() => setSelectedFlash(flash as FlashDesign)}>
                    <img src={flash.imageUrl} alt={flash.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                        <h3 className="font-bold">{flash.title}</h3>
                        <p className="text-sm">{flash.price}€</p>
                      </div>
                    </div>
                    {!flash.available && (
                      <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full font-semibold">Réservé</div>
                    )}
                  </div>
                ))}
              </div>
            </section>

            <section className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-neutral-200">
              <h2 className="text-2xl font-bold mb-6">Portfolio</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {studio.portfolio.map((img, idx) => (
                  <div key={idx} className="aspect-square rounded-xl overflow-hidden">
                    <img src={img} alt={`Portfolio ${idx + 1}`} className="w-full h-full object-cover hover:scale-110 transition-transform duration-300" />
                  </div>
                ))}
              </div>
            </section>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-200 lg:sticky lg:top-24">
              <h3 className="text-xl font-bold mb-4">Prendre rendez-vous</h3>
              <a href={`/book/${studioSlug}`} className="block w-full bg-neutral-900 text-white text-center py-4 rounded-xl font-semibold hover:bg-neutral-800 transition-colors mb-4">
                Réserver maintenant
              </a>
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-3 text-neutral-600">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <span>Confirmation instantanée</span>
                </div>
                <div className="flex items-center gap-3 text-neutral-600">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <span>Paiement sécurisé</span>
                </div>
                <div className="flex items-center gap-3 text-neutral-600">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <span>Rappels automatiques</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-200">
              <h3 className="text-xl font-bold mb-4">Coordonnées</h3>
              <div className="space-y-4 text-sm">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-neutral-400 flex-shrink-0 mt-0.5" />
                  <span className="text-neutral-700">{studio.address}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-neutral-400 flex-shrink-0" />
                  <a href={`tel:${studio.phone}`} className="text-neutral-700 hover:text-neutral-900">{studio.phone}</a>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-neutral-400 flex-shrink-0" />
                  <a href={`mailto:${studio.email}`} className="text-neutral-700 hover:text-neutral-900">{studio.email}</a>
                </div>
                <div className="flex items-center gap-3">
                  <Instagram className="w-5 h-5 text-neutral-400 flex-shrink-0" />
                  <a href="#" className="text-neutral-700 hover:text-neutral-900">{studio.instagram}</a>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-200">
              <h3 className="text-xl font-bold mb-4">Horaires</h3>
              <div className="space-y-2 text-sm">
                {Object.entries(studio.openingHours).map(([day, hours]) => (
                  <div key={day} className="flex justify-between">
                    <span className="text-neutral-600 capitalize">{day}</span>
                    <span className="font-semibold text-neutral-900">{hours}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <footer className="bg-white border-t border-neutral-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-sm text-neutral-500">
            <p>Propulsé par <span className="font-semibold text-neutral-900">InkFlow</span></p>
          </div>
        </div>
      </footer>
    </div>
  );
};
