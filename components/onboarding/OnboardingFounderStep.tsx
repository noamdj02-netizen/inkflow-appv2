/**
 * Onboarding Étape 1 — Note du Fondateur
 * Storytelling, UI émotionnelle
 */
import React from 'react';
import { Heart, ChevronRight } from 'lucide-react';

const FOUNDER_NOTE = `Bienvenue dans InkFlow.

J'ai créé cette app parce que, comme toi, j'ai passé des heures à gérer mes RDV sur des carnets, à oublier des acomptes, à chercher un design dans des centaines de photos.

InkFlow, c'est l'outil que j'aurais voulu avoir dès mon premier jour en tant que tatoueur.

Ici, tout est pensé pour toi : tes clients, tes flashs, tes finances, ta vitrine. Sans prise de tête.

Prêt à reprendre le contrôle ? C'est parti.`;

export interface OnboardingFounderStepProps {
  onNext: () => void;
}

export const OnboardingFounderStep: React.FC<OnboardingFounderStepProps> = ({ onNext }) => {
  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center px-6 py-8 bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 text-white overflow-y-auto"
      role="dialog"
      aria-labelledby="founder-title"
      aria-describedby="founder-note"
    >
      <div className="max-w-lg mx-auto text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-500/20 text-amber-400 mb-8 animate-in fade-in duration-500">
          <Heart className="w-8 h-8" strokeWidth={1.5} fill="currentColor" />
        </div>
        <h1 id="founder-title" className="text-2xl sm:text-3xl font-bold mb-6 font-display">
          Une note du fondateur
        </h1>
        <div
          id="founder-note"
          className="text-left text-zinc-300 text-base sm:text-lg leading-relaxed whitespace-pre-line mb-10 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-150"
        >
          {FOUNDER_NOTE}
        </div>
        <button
          type="button"
          onClick={onNext}
          className="min-h-[48px] px-8 py-3.5 rounded-full bg-amber-500 hover:bg-amber-400 text-zinc-900 font-semibold flex items-center justify-center gap-2 mx-auto transition-colors"
        >
          C&apos;est parti
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
