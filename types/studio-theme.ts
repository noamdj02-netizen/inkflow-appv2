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
    instagramHandle: string | null;
    bookingUrl: string | null;
    themeName: string;
  };
  flashItems: FlashItem[];
  portfolioItems: PortfolioItem[];
}
