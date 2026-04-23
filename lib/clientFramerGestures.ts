import { useReducedMotion } from 'framer-motion';

/**
 * Micro-gestes Framer Motion pour surfaces client (vitrine, /book, discover).
 * Tout est désactivé quand l’utilisateur préfère moins d’animation.
 */
export function useClientFramerGestures() {
  const reduced = useReducedMotion();

  return {
    reduced: !!reduced,
    /** Boutons, liens CTA, icônes d’action */
    tap: reduced ? undefined : { scale: 0.98 },
    /** CTA secondaires, cartes denses */
    tapSoft: reduced ? undefined : { scale: 0.97 },
    /** Grilles de cartes (flash, discover) */
    cardTap: reduced ? undefined : { scale: 0.99 },
    /** Survol discret (desktop) */
    cardHover: reduced ? undefined : { y: -1 },
  };
}
