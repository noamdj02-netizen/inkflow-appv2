import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Star } from 'lucide-react';
import { getAvatarPlaceholder } from '../../lib/avatar-placeholders';
import { useLanguage } from '../../contexts/LanguageContext';

const testimonialsConfig = [
  { quoteKey: 'testimonials.quote1', name: 'Emma Dubois', studio: 'Artistic Tattoo', location: 'Marseille', avatarIdx: 0 },
  { quoteKey: 'testimonials.quote2', name: 'Thomas Leroy', studio: 'Urban Ink', location: 'Bordeaux', avatarIdx: 1 },
  { quoteKey: 'testimonials.quote3', name: 'Léa Petit', studio: 'Noir Tattoo', location: 'Lille', avatarIdx: 2 },
  { quoteKey: 'testimonials.quote4', name: 'Sophie Martin', studio: 'Ink & Soul', location: 'Paris', avatarIdx: 3 },
];

const glassStyle = {
  background: 'rgba(255, 255, 255, 0.6)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  border: '1px solid rgba(255, 255, 255, 0.4)',
  boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.07), 0 25px 50px -12px rgba(0, 0, 0, 0.08)',
};

export const EnhanceAITestimonials: React.FC = () => {
  const { t } = useLanguage();
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const isUserClick = useRef(false);
  const testimonials = testimonialsConfig.map((c) => ({
    ...c,
    quote: t(c.quoteKey),
    avatar: getAvatarPlaceholder(c.avatarIdx),
  }));

  const goNext = () => {
    isUserClick.current = true;
    setCurrentIndex((i) => (i + 1) % testimonials.length);
  };
  const goPrev = () => {
    isUserClick.current = true;
    setCurrentIndex((i) => (i - 1 + testimonials.length) % testimonials.length);
  };

  // Scroll vers la carte active au clic prev/next uniquement
  useEffect(() => {
    if (!scrollRef.current || !isUserClick.current) return;
    const card = scrollRef.current.children[currentIndex] as HTMLElement;
    card?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    isUserClick.current = false;
  }, [currentIndex]);

  // Mise à jour des indicateurs au scroll manuel (IntersectionObserver)
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const cards = Array.from(el.children) as HTMLElement[];
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !isUserClick.current) {
            const idx = cards.indexOf(entry.target as HTMLElement);
            if (idx >= 0) setCurrentIndex(idx);
          }
        });
      },
      { root: el, threshold: 0.5 }
    );
    cards.forEach((card) => observer.observe(card));
    return () => observer.disconnect();
  }, []);

  return (
    <section id="avis" className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-neutral-50/50 to-white">
      <div className="max-w-6xl mx-auto">
        {/* Badge + Titre + Sous-titre */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-neutral-100 border border-neutral-200/80 mb-4">
            <Star className="w-4 h-4 text-blue-500 fill-blue-500" />
            <span className="text-sm font-medium text-neutral-700">{t('testimonials.badge')}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-neutral-800 mb-3">
            {t('testimonials.title')}
          </h2>
          <p className="text-base sm:text-lg text-neutral-600 max-w-2xl mx-auto">
            {t('testimonials.subtitle')}
          </p>
        </motion.div>

        {/* Carrousel */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative"
        >
          {/* Conteneur scroll horizontal */}
          <div
            ref={scrollRef}
            className="flex gap-4 sm:gap-6 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-4 -mx-4 px-4 sm:mx-0 sm:px-0"
            style={{ scrollSnapType: 'x mandatory' }}
          >
            {testimonials.map((t, i) => (
              <div
                key={i}
                className="flex-shrink-0 w-[280px] sm:w-[320px] lg:w-[340px] snap-center"
                style={{ scrollSnapAlign: 'center' }}
              >
                <div
                  className="rounded-2xl p-6 sm:p-8 h-full flex flex-col"
                  style={glassStyle}
                >
                  {/* 5 étoiles */}
                  <div className="flex gap-0.5 mb-4">
                    {[1, 2, 3, 4, 5].map((j) => (
                      <Star key={j} className="w-5 h-5 text-amber-500 fill-amber-500" strokeWidth={0} />
                    ))}
                  </div>
                  {/* Citation */}
                  <blockquote className="flex-1">
                    <p className="text-neutral-700 leading-relaxed text-sm sm:text-base">&ldquo;{t.quote}&rdquo;</p>
                  </blockquote>
                  {/* Auteur */}
                  <div className="flex items-center gap-3 mt-6 pt-4 border-t border-neutral-200/60">
                    <img
                      src={t.avatar}
                      alt={t.name}
                      className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                    />
                    <div>
                      <p className="font-bold text-neutral-800">{t.name}</p>
                      <p className="text-sm text-neutral-500">
                        {t.studio} — {t.location}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Boutons navigation */}
          <div className="flex justify-center gap-3 mt-8">
            <button
              type="button"
              onClick={goPrev}
              className="w-12 h-12 rounded-full bg-neutral-900 text-white flex items-center justify-center hover:bg-neutral-800 transition-colors shadow-lg"
              aria-label={t('testimonials.prev')}
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              type="button"
              onClick={goNext}
              className="w-12 h-12 rounded-full bg-neutral-900 text-white flex items-center justify-center hover:bg-neutral-800 transition-colors shadow-lg"
              aria-label={t('testimonials.next')}
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>

          {/* Indicateurs */}
          <div className="flex justify-center gap-2 mt-4">
            {testimonials.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setCurrentIndex(i)}
                className={`w-2 h-2 rounded-full transition-colors ${
                  i === currentIndex ? 'bg-neutral-900' : 'bg-neutral-300 hover:bg-neutral-400'
                }`}
                aria-label={`${t('testimonials.goTo')} ${i + 1}`}
              />
            ))}
          </div>
        </motion.div>
      </div>

      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </section>
  );
};
