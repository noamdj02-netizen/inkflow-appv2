/**
 * Section témoignages — "Ils ont dit adieu à Excel"
 * Carrousel avec photos de tatoueurs, avis variés. Avatars alignés avec le genre du prénom (M/F).
 */
import React, { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Check, Star, ChevronLeft, ChevronRight } from 'lucide-react';
import { AVATAR_M, AVATAR_F } from '../../lib/demoSandboxData';

interface Testimonial {
  name: string;
  studio: string;
  avatar: string;
  avatarFallback: string;
  avatarBg: string;
  rating: number;
  text: string;
  metric: string;
  plan: string;
}

const TESTIMONIALS: Testimonial[] = [
  {
    name: 'Maxime R.',
    studio: 'Black Serpent Tattoo, Lyon',
    avatar: AVATAR_M[0],
    avatarFallback: 'M',
    avatarBg: 'bg-zinc-800',
    rating: 5,
    text: "Avant Inkflow, je perdais 1h par jour à gérer les DMs Instagram et les acomptes par virement. Maintenant tout est automatique. J'ai récupéré 5h par semaine.",
    metric: '5h/semaine économisées',
    plan: 'Pro',
  },
  {
    name: 'Sarah K.',
    studio: 'Encre Sacrée, Paris 11e',
    avatar: AVATAR_F[0],
    avatarFallback: 'S',
    avatarBg: 'bg-blue-700',
    rating: 5,
    text: "Les no-shows avaient diminué de 80% depuis que je demande les acomptes via Inkflow. Le lien de paiement Stripe s'envoie automatiquement, mes clients adorent.",
    metric: '−80% de no-shows',
    plan: 'Business',
  },
  {
    name: 'Thomas B.',
    studio: 'Freelance, Bordeaux',
    avatar: AVATAR_M[1],
    avatarFallback: 'T',
    avatarBg: 'bg-emerald-700',
    rating: 5,
    text: "Je travaille seul et je n'ai pas de temps pour l'admin. Inkflow c'est comme avoir une assistante qui gère tout ça pour 29€. Le ROI est immédiat.",
    metric: 'ROI dès le 1er mois',
    plan: 'Pro',
  },
  {
    name: 'Léa M.',
    studio: 'Ink District, Marseille',
    avatar: AVATAR_F[1],
    avatarFallback: 'L',
    avatarBg: 'bg-violet-600',
    rating: 5,
    text: "La messagerie centralisée a changé ma vie. Plus besoin de jongler entre Instagram et mon agenda. Les demandes arrivent qualifiées, je réponds en un clic.",
    metric: 'Réponses 2x plus rapides',
    plan: 'Pro',
  },
  {
    name: 'Kevin D.',
    studio: 'Tattoo Factory, Toulouse',
    avatar: AVATAR_M[2],
    avatarFallback: 'K',
    avatarBg: 'bg-amber-600',
    rating: 5,
    text: "Mes clients paient l'acompte en ligne avant le RDV. Fini les créneaux perdus. La galerie flash sur la vitrine me génère des résas sans que je bouge le petit doigt.",
    metric: '+40% de résas flash',
    plan: 'Business',
  },
  {
    name: 'Camille L.',
    studio: 'Studio 34, Nantes',
    avatar: AVATAR_F[2],
    avatarFallback: 'C',
    avatarBg: 'bg-rose-600',
    rating: 5,
    text: "Enfin une app pensée pour les tatoueurs. La page vitrine, les RDV, les acomptes : tout est au même endroit. Je recommande à tous les collègues.",
    metric: 'Tout-en-un qui tient la route',
    plan: 'Pro',
  },
];

const CARD_WIDTH = 360;
const GAP = 24;
const AUTO_SCROLL_INTERVAL = 5000;

export const TestimonialsSection: React.FC = () => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [isPaused, setIsPaused] = useState(false);

  const updateScrollState = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 1);
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener('scroll', updateScrollState);
    const ro = new ResizeObserver(updateScrollState);
    ro.observe(el);
    return () => {
      el.removeEventListener('scroll', updateScrollState);
      ro.disconnect();
    };
  }, []);

  useEffect(() => {
    if (isPaused) return;
    const el = scrollRef.current;
    if (!el) return;
    const step = CARD_WIDTH + GAP;
    const id = setInterval(() => {
      const maxScroll = el.scrollWidth - el.clientWidth;
      if (maxScroll <= 0) return;
      const next = el.scrollLeft + step;
      if (next >= maxScroll) {
        el.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        el.scrollBy({ left: step, behavior: 'smooth' });
      }
      setTimeout(updateScrollState, 350);
    }, AUTO_SCROLL_INTERVAL);
    return () => clearInterval(id);
  }, [isPaused]);

  const scroll = (direction: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    const step = (CARD_WIDTH + GAP) * (direction === 'left' ? -1 : 1);
    el.scrollBy({ left: step, behavior: 'smooth' });
    setTimeout(updateScrollState, 350);
  };

  return (
    <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-zinc-50 dark:bg-zinc-950 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-10 sm:mb-14">
          <h2 className="text-2xl sm:text-4xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight mb-3">
            Ils ont dit adieu à Excel
          </h2>
          <p className="text-base sm:text-lg text-zinc-600 dark:text-zinc-400 max-w-xl mx-auto">
            Plus de 200 tatoueurs nous font confiance en France
          </p>
        </div>

        <div className="relative md:px-12">
          {/* Boutons carrousel — desktop */}
          <div className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 z-10">
            <button
              type="button"
              onClick={() => scroll('left')}
              disabled={!canScrollLeft}
              className="w-12 h-12 rounded-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shadow-lg flex items-center justify-center text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              aria-label="Avis précédent"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          </div>
          <div className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 z-10">
            <button
              type="button"
              onClick={() => scroll('right')}
              disabled={!canScrollRight}
              className="w-12 h-12 rounded-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shadow-lg flex items-center justify-center text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              aria-label="Avis suivant"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>

          <div
            ref={scrollRef}
            className="testimonials-carousel flex gap-6 overflow-x-auto overflow-y-visible snap-x snap-mandatory scroll-smooth pb-2 -mx-4 px-4 sm:mx-0 sm:px-0"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
            onFocus={() => setIsPaused(true)}
            onBlur={() => setIsPaused(false)}
          >
            <style>{`
              .testimonials-carousel::-webkit-scrollbar { display: none; }
            `}</style>
            {TESTIMONIALS.map((t, idx) => (
              <motion.article
                key={`${t.name}-${idx}`}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-20px' }}
                transition={{ duration: 0.35, delay: idx * 0.05 }}
                className="flex-shrink-0 w-[min(100%,340px)] sm:w-[320px] md:w-[360px] snap-center snap-always"
              >
                <div
                  className="relative rounded-2xl p-6 sm:p-8 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-lg hover:border-zinc-300 dark:hover:border-zinc-700 transition-all duration-300 h-full flex flex-col min-h-[320px]"
                  onTouchStart={() => setIsPaused(true)}
                  onTouchEnd={() => setTimeout(() => setIsPaused(false), 3000)}
                >
                  <div className="absolute top-5 right-5 sm:top-6 sm:right-6 text-5xl sm:text-6xl text-blue-100 dark:text-blue-500/20 font-serif leading-none select-none pointer-events-none" aria-hidden>
                    &ldquo;
                  </div>
                  <p className="relative text-zinc-700 dark:text-zinc-300 italic text-[15px] sm:text-base leading-relaxed mb-5 flex-1 pr-2">
                    {t.text}
                  </p>
                  <div className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-sm font-medium mb-6 w-fit">
                    <Check className="w-4 h-4 shrink-0" strokeWidth={2.5} />
                    {t.metric}
                  </div>
                  <div className="flex items-center gap-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                    <div className="relative w-12 h-12 rounded-full overflow-hidden flex-shrink-0 bg-zinc-200 dark:bg-zinc-700 ring-2 ring-white dark:ring-zinc-800 shadow-md">
                      <img
                        src={t.avatar}
                        alt=""
                        className="absolute inset-0 w-full h-full min-w-full min-h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const fallback = target.nextElementSibling as HTMLElement;
                          if (fallback) fallback.classList.remove('hidden');
                        }}
                      />
                      <span className={`absolute inset-0 hidden flex items-center justify-center text-white font-bold text-base ${t.avatarBg}`}>
                        {t.avatarFallback}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm sm:text-base">{t.name}</p>
                      <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 truncate mt-0.5">{t.studio}</p>
                    </div>
                    <div className="flex items-center gap-0.5 shrink-0" aria-label={`${t.rating} étoiles`}>
                      {Array.from({ length: t.rating }).map((_, i) => (
                        <Star key={i} className="w-4 h-4 sm:w-5 sm:h-5 fill-amber-400 text-amber-400 drop-shadow-sm" aria-hidden />
                      ))}
                    </div>
                    <span className="text-[10px] font-semibold px-2.5 py-1 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 uppercase tracking-wide shrink-0 hidden sm:inline-block">
                      {t.plan}
                    </span>
                  </div>
                </div>
              </motion.article>
            ))}
          </div>

          {/* Indicateurs de défilement — mobile */}
          <div className="flex justify-center gap-2 mt-6 md:hidden">
            {TESTIMONIALS.map((_, i) => (
              <span
                key={i}
                className="w-2 h-2 rounded-full bg-zinc-300 dark:bg-zinc-600"
                aria-hidden
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
