export type IconKey = 'sparkles' | 'award' | 'star' | 'camera' | 'shield' | 'heart' | 'users';

export interface VitrineOpeningHours {
  open: string;
  close: string;
  closed: boolean;
}

export interface VitrineService {
  name: string;
  price: string;
  duration: string;
  description: string;
  icon: IconKey;
  features: string[];
}

export interface VitrineArtist {
  name: string;
  role: string;
  specialties: string[];
  experience: string;
  avatar: string;
  bio: string;
  instagram: string;
  portfolio: number;
}

export interface VitrineTestimonial {
  name: string;
  rating: number;
  date: string;
  text: string;
  avatar: string;
  tattoo: string;
  verified: boolean;
}

export interface VitrinePortfolioItem {
  url: string;
  category: string;
  artist: string;
  likes: number;
  description: string;
}

export interface VitrineFlashDesign {
  id: string;
  title: string;
  imageUrl: string;
  price: number;
  duration: number;
  placement: string[];
  size: string;
  available: boolean;
  description: string;
  style: string;
}

export interface VitrineFaq {
  q: string;
  a: string;
}

export interface VitrineWhyChooseUs {
  icon: IconKey;
  title: string;
  description: string;
}

export interface VitrineData {
  name: string;
  slug: string;
  /** Thème de la vitrine : light, dark, vintage, neon */
  theme?: string;
  tagline: string;
  description: string;
  avatar: string;
  coverImage: string;
  address: string;
  phone: string;
  email: string;
  instagram: string;
  facebook: string;
  website: string;
  rating: number;
  reviewCount: number;
  yearsExperience: number;
  totalTattoos: number;
  satisfactionRate: number;
  repeatClients: number;
  /** Masquer la bannière statistiques sur la vitrine (Tatouages réalisés, Satisfaction, etc.) */
  showStatsBanner?: boolean;
  services: VitrineService[];
  openingHours: Record<string, VitrineOpeningHours>;
  artists: VitrineArtist[];
  testimonials: VitrineTestimonial[];
  portfolio: VitrinePortfolioItem[];
  flashDesigns: VitrineFlashDesign[];
  faqs: VitrineFaq[];
  whyChooseUs: VitrineWhyChooseUs[];
}
