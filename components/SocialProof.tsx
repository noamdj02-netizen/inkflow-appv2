import React from 'react';
import { Star } from 'lucide-react';

export const SocialProof: React.FC = () => {
  const testimonials = [
    {
      name: 'Sophie Martin',
      studio: 'Ink & Soul - Paris',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=96&h=96&fit=crop',
      text: 'InkFlow a transformé mon quotidien. Je gagne facilement 6h par semaine en automatisant les réservations.',
      rating: 5
    },
    {
      name: 'Lucas Bernard',
      studio: 'Dark Art Studio - Lyon',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=96&h=96&fit=crop',
      text: 'Les paiements automatiques via Stripe sont un game-changer. Plus de relances pour les acomptes !',
      rating: 5
    },
    {
      name: 'Emma Dubois',
      studio: 'Electric Tattoo - Marseille',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=96&h=96&fit=crop',
      text: 'La galerie Flash a boosté mes ventes spontanées de 40%. Mes clients adorent !',
      rating: 5
    }
  ];

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-neutral-50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-neutral-200 mb-6">
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            <span className="text-sm font-semibold">4.9/5 sur 200+ avis</span>
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold mb-4">
            Ils nous font confiance
          </h2>
          <p className="text-xl text-neutral-600">
            Rejoignez des centaines de tatoueurs qui ont repris le contrôle de leur temps
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl p-8 shadow-sm border border-neutral-100 hover:shadow-lg transition-shadow"
            >
              <div className="flex gap-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>

              <p className="text-neutral-700 mb-6 leading-relaxed">
                "{testimonial.text}"
              </p>

              <div className="flex items-center gap-4">
                <img
                  src={testimonial.avatar}
                  alt={testimonial.name}
                  className="w-12 h-12 rounded-full object-cover ring-2 ring-white shadow-md"
                />
                <div>
                  <div className="font-semibold text-neutral-900">{testimonial.name}</div>
                  <div className="text-sm text-neutral-500">{testimonial.studio}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid md:grid-cols-4 gap-8 mt-20 pt-12 border-t border-neutral-200">
          {[
            { value: '500+', label: 'Tatoueurs actifs' },
            { value: '10k+', label: 'RDV gérés/mois' },
            { value: '€250k+', label: 'Acomptes traités' },
            { value: '4.9/5', label: 'Satisfaction' }
          ].map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-4xl font-bold text-neutral-900 mb-2">{stat.value}</div>
              <div className="text-neutral-600">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
