/** Classes partagées — fond 100 % opaque (pas d’animation opacity sur le root). */
export const ONBOARDING_STEP_ROOT =
  'fixed inset-0 z-[200] flex flex-col lg:flex-row min-h-0 h-[100dvh] max-h-[100dvh] overflow-hidden bg-white dark:bg-zinc-950';

export const ONBOARDING_STEP_MAIN =
  'flex-1 flex flex-col min-h-0 max-h-full overflow-y-auto overscroll-y-contain touch-pan-y touch-scroll-ios bg-white dark:bg-zinc-950';

export const ONBOARDING_STEP_HERO_SIDE =
  'hidden lg:flex lg:w-[520px] xl:w-[600px] min-h-screen flex-shrink-0 relative overflow-hidden';
