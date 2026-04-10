import type { GoogleReviewsPayload } from './googlePlaces';

/**
 * Contrat TypeScript partagé pour les thèmes structurels de la vitrine studio.
 * Tous les thèmes (ClassicTheme, SplitTheme, VintageTheme, etc.) acceptent cette interface.
 */
export interface FlashItem {
  id: string;
  imageUrl: string;
  title?: string;
  price?: number;
  isAvailable: boolean;
  /** Durée indicative (minutes), depuis la fiche flash */
  duration?: number;
  /** Style / catégorie court */
  style?: string;
}

export interface PortfolioItem {
  id: string;
  imageUrl: string;
  caption?: string;
}

export interface StudioThemeProps {
  studio: {
    name: string;
    slug: string;
    bio: string | null;
    avatarUrl: string | null;
    city: string | null;
    /** Adresse complète (vitrine) */
    address: string | null;
    phone: string | null;
    email: string | null;
    website: string | null;
    instagramHandle: string | null;
    bookingUrl: string | null;
    /** Lien fiche Google (Maps / avis), déjà validé http(s) ou null */
    googleBusinessUrl: string | null;
    themeName: string;
  };
  flashItems: FlashItem[];
  portfolioItems: PortfolioItem[];
  /** Avis Google (chargés côté page publique via Edge Function) */
  googleReviews?: GoogleReviewsPayload | null;
}
