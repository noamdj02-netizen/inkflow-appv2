import React from 'react';
import { Star } from 'lucide-react';

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
  },
  {
    name: 'Thomas Leroy',
    studio: 'Urban Ink - Bordeaux',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=96&h=96&fit=crop',
    text: 'Le CRM intégré me fait gagner un temps fou. J\'ai tout l\'historique de mes clients sous la main.',
    rating: 5
  },
  {
    name: 'Léa Petit',
    studio: 'Noir Tattoo - Lille',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=96&h=96&fit=crop',
    text: 'Enfin une solution pensée pour les tatoueurs. Simple, efficace, et le support répond en moins d\'une heure.',
    rating: 5
  }
];

const TestimonialCard: React.FC<{ testimonial: typeof testimonials[0] }> = ({ testimonial }) => (
  <div className="flex-shrink-0 min-w-[280px] w-[85vw] sm:w-[340px] sm:min-w-[340px] md:w-[380px] bg-neutral-50/80 rounded-2xl sm:rounded-3xl p-6 sm:p-8 border border-neutral-200/60 hover:border-neutral-200 hover:shadow-lg hover:shadow-neutral-900/5 transition-all duration-300">
    <div className="flex gap-1 mb-4">
      {[...Array(testimonial.rating)].map((_, i) => (
        <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
      ))}
    </div>
    <p className="text-neutral-700 mb-6 leading-relaxed">
      "{testimonial.text}"
    </p>
    <div className="flex items-center gap-4">
      <img
        src={testimonial.avatar}
        alt={testimonial.name}
        loading="lazy"
        className="w-12 h-12 rounded-full object-cover ring-2 ring-white shadow-md"
      />
      <div>
        <div className="font-semibold text-neutral-900">{testimonial.name}</div>
        <div className="text-sm text-neutral-500">{testimonial.studio}</div>
      </div>
    </div>
  </div>
);

export const SocialProof: React.FC = () => {
  const duplicatedTestimonials = [...testimonials, ...testimonials];

  return (
    <section className="py-20 sm:py-24 px-4 sm:px-6 lg:px-8 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 bg-neutral-50 px-4 py-2.5 rounded-full border border-neutral-200/80 mb-6">
            <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
            <span className="text-sm font-semibold text-neutral-700">4.9/5 sur 200+ avis</span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 px-2 tracking-tight">
            Ils nous font confiance
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-neutral-600 px-2 max-w-2xl mx-auto">
            Rejoignez des centaines de tatoueurs qui ont repris le contrôle de leur temps
          </p>
        </div>

        {/* Marquee - avis qui défilent */}
        <div className="marquee-container relative -mx-4 sm:-mx-6 lg:-mx-8 overflow-hidden">
          <div className="flex gap-6 animate-marquee flex-nowrap w-max">
            {duplicatedTestimonials.map((testimonial, index) => (
              <TestimonialCard key={index} testimonial={testimonial} />
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 mt-16 sm:mt-24 pt-12 sm:pt-16 border-t border-neutral-200/80">
          {[
            { value: '500+', label: 'Tatoueurs actifs' },
            { value: '10k+', label: 'RDV gérés/mois' },
            { value: '€250k+', label: 'Acomptes traités' },
            { value: '4.9/5', label: 'Satisfaction' }
          ].map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-3xl sm:text-4xl font-bold text-neutral-900 mb-1 tracking-tight">{stat.value}</div>
              <div className="text-sm sm:text-base text-neutral-500 font-medium">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
