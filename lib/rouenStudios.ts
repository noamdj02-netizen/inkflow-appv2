/**
 * rouenStudios — Données de démonstration avec de vrais tatoueurs Rouen
 * Utilisé comme fallback avant que la géolocalisation ne charge.
 */

import { CLIENT_DEMO_FLASH_IMAGES, CLIENT_DEMO_STUDIO_PORTFOLIOS } from './clientTattooDemoImages';

export interface DisplayFlash {
  id: string;
  name: string;
  artist: string;
  studio: string;
  studioSlug: string;
  dist: string;
  price: number;
  h: number;
  grad: [string, string];
  hot: boolean;
  imageUrl?: string;
  /** Timestamp ms d'expiration — si défini, affiche un countdown. */
  expiresAt?: number;
}

export interface SheetStudio {
  id: string;
  slug: string;
  name: string;
  artistLabel: string;
  styleLabel: string;
  rating: number;
  distLabel: string;
  grad: [string, string];
  /** Photo de profil studio / tatoueur (cartes découverte), pas une image portfolio. */
  avatarUrl?: string | null;
  portfolioImages: string[];
  city?: string;
  /** Distance en km (géoloc active) — filtres Inspiration « près de moi » */
  distanceKm?: number;
}

// ── Studios ─────────────────────────────────────────────────────────────────
export const ROUEN_STUDIOS: SheetStudio[] = [
  {
    id: 'rouen-1',
    slug: 'thomas-leblanc-blackwork',
    name: 'Atelier Leblanc',
    artistLabel: 'Thomas Leblanc',
    styleLabel: 'Blackwork',
    rating: 4.9,
    distLabel: '1.4 km',
    grad: ['#111111', '#2A2A2A'],
    city: 'Rouen',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
    portfolioImages: CLIENT_DEMO_STUDIO_PORTFOLIOS['thomas-leblanc-blackwork'],
  },
  {
    id: 'rouen-2',
    slug: 'lea-moreau-fineline',
    name: 'Vénus Ink Rouen',
    artistLabel: 'Léa Moreau',
    styleLabel: 'Fine line',
    rating: 5.0,
    distLabel: '0.9 km',
    grad: ['#1C1612', '#3A3028'],
    city: 'Rouen',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400',
    portfolioImages: CLIENT_DEMO_STUDIO_PORTFOLIOS['lea-moreau-fineline'],
  },
  {
    id: 'rouen-3',
    slug: 'hugo-martin-japonais',
    name: 'Irezumi Studio',
    artistLabel: 'Hugo Martin',
    styleLabel: 'Japonais',
    rating: 4.8,
    distLabel: '2.1 km',
    grad: ['#181612', '#2C2820'],
    city: 'Rouen',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400',
    portfolioImages: CLIENT_DEMO_STUDIO_PORTFOLIOS['hugo-martin-japonais'],
  },
  {
    id: 'rouen-4',
    slug: 'sarah-dupont-realiste',
    name: 'Noir & Réel',
    artistLabel: 'Sarah Dupont',
    styleLabel: 'Réaliste',
    rating: 4.7,
    distLabel: '3.3 km',
    grad: ['#0A1E0A', '#143514'],
    city: 'Rouen',
    avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400',
    portfolioImages: CLIENT_DEMO_STUDIO_PORTFOLIOS['sarah-dupont-realiste'],
  },
];

// ── Flashs ───────────────────────────────────────────────────────────────────
export const ROUEN_FLASH: DisplayFlash[] = [
  {
    id: 'rf1',
    name: 'Mandala géométrique',
    artist: 'Thomas Leblanc',
    studio: 'Atelier Leblanc',
    studioSlug: 'thomas-leblanc-blackwork',
    dist: '1.4km',
    price: 190,
    h: 210,
    grad: ['#111111', '#2A2A2A'],
    hot: true,
    imageUrl: CLIENT_DEMO_FLASH_IMAGES.rf1,
    expiresAt: new Date('2026-03-29T18:30:00+02:00').getTime(),
  },
  {
    id: 'rf2',
    name: 'Rose fine line',
    artist: 'Léa Moreau',
    studio: 'Vénus Ink Rouen',
    studioSlug: 'lea-moreau-fineline',
    dist: '0.9km',
    price: 120,
    h: 175,
    grad: ['#1C1612', '#3A3028'],
    hot: false,
    imageUrl: CLIENT_DEMO_FLASH_IMAGES.rf2,
  },
  {
    id: 'rf3',
    name: 'Dragon koi',
    artist: 'Hugo Martin',
    studio: 'Irezumi Studio',
    studioSlug: 'hugo-martin-japonais',
    dist: '2.1km',
    price: 380,
    h: 250,
    grad: ['#181612', '#2C2820'],
    hot: true,
    imageUrl: CLIENT_DEMO_FLASH_IMAGES.rf3,
    expiresAt: new Date('2026-03-29T22:00:00+02:00').getTime(),
  },
  {
    id: 'rf4',
    name: 'Portrait réaliste',
    artist: 'Sarah Dupont',
    studio: 'Noir & Réel',
    studioSlug: 'sarah-dupont-realiste',
    dist: '3.3km',
    price: 450,
    h: 230,
    grad: ['#0A1E0A', '#143514'],
    hot: false,
    imageUrl: CLIENT_DEMO_FLASH_IMAGES.rf4,
  },
  {
    id: 'rf5',
    name: 'Serpent minimaliste',
    artist: 'Thomas Leblanc',
    studio: 'Atelier Leblanc',
    studioSlug: 'thomas-leblanc-blackwork',
    dist: '1.4km',
    price: 160,
    h: 185,
    grad: ['#111111', '#2A2A2A'],
    hot: false,
    imageUrl: CLIENT_DEMO_FLASH_IMAGES.rf5,
  },
  {
    id: 'rf6',
    name: 'Lune & botaniques',
    artist: 'Léa Moreau',
    studio: 'Vénus Ink Rouen',
    studioSlug: 'lea-moreau-fineline',
    dist: '0.9km',
    price: 95,
    h: 160,
    grad: ['#1C1612', '#3A3028'],
    hot: true,
    imageUrl: CLIENT_DEMO_FLASH_IMAGES.rf6,
    expiresAt: new Date('2026-03-29T15:20:00+02:00').getTime(),
  },
];
