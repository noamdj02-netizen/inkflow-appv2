import type { Metadata } from 'next';
import { InstagramCarousel } from '../../components/marketing/InstagramCarousel';

export const metadata: Metadata = {
  title: 'Carrousel Instagram — Inkflow',
  description:
    'Aperçu du carrousel 7 slides marketing, aligné sur le template Figma Social Set 14.',
};

export default function CarouselMarketingPage() {
  return (
    <main className="min-h-screen bg-[#f9fafb] px-4 py-10 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 text-center sm:text-left">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Marketing — export IG 4∶5
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-[#242424]">
            Carrousel Inkflow
          </h1>
          <p className="mt-2 max-w-xl text-muted-foreground">
            Dérivé du frame Figma « Template - Social - Set 14- 1 » (split contenu + visuel,
            cartes 32px, CTA pleine largeur).
          </p>
        </header>
        <InstagramCarousel />
      </div>
    </main>
  );
}
