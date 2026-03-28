/**
 * rouenStudios — Données de démonstration avec de vrais tatoueurs Rouen
 * Utilisé comme fallback avant que la géolocalisation ne charge.
 */

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
  portfolioImages: string[];
  city?: string;
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
    portfolioImages: [
      'https://images.unsplash.com/photo-1562962230-14de672e03e1?w=400&q=80',
      'https://images.unsplash.com/photo-1611501275019-9b5cda994e8d?w=400&q=80',
      'https://images.unsplash.com/photo-1595475038784-bbe439ff41e6?w=400&q=80',
    ],
  },
  {
    id: 'rouen-2',
    slug: 'lea-moreau-fineline',
    name: 'Vénus Ink Rouen',
    artistLabel: 'Léa Moreau',
    styleLabel: 'Fine line',
    rating: 5.0,
    distLabel: '0.9 km',
    grad: ['#1A0A2E', '#3D1A6B'],
    city: 'Rouen',
    portfolioImages: [
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80',
      'https://images.unsplash.com/photo-1604076913837-52ab5629fde9?w=400&q=80',
      'https://images.unsplash.com/photo-1563396983906-b3795482a59a?w=400&q=80',
    ],
  },
  {
    id: 'rouen-3',
    slug: 'hugo-martin-japonais',
    name: 'Irezumi Studio',
    artistLabel: 'Hugo Martin',
    styleLabel: 'Japonais',
    rating: 4.8,
    distLabel: '2.1 km',
    grad: ['#0A1A2E', '#0F3A5A'],
    city: 'Rouen',
    portfolioImages: [
      'https://images.unsplash.com/photo-1609501676725-7186f017a4b7?w=400&q=80',
      'https://images.unsplash.com/photo-1536766820879-059fec98ec0a?w=400&q=80',
      'https://images.unsplash.com/photo-1580618864180-b0b3c8f23a33?w=400&q=80',
    ],
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
    portfolioImages: [
      'https://images.unsplash.com/photo-1564861257520-6eb0adb6a32b?w=400&q=80',
      'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400&q=80',
      'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=400&q=80',
    ],
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
    imageUrl: 'https://images.unsplash.com/photo-1562962230-14de672e03e1?w=400&q=80',
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
    grad: ['#1A0A2E', '#3D1A6B'],
    hot: false,
    imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80',
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
    grad: ['#0A1A2E', '#0F3A5A'],
    hot: true,
    imageUrl: 'https://images.unsplash.com/photo-1609501676725-7186f017a4b7?w=400&q=80',
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
    imageUrl: 'https://images.unsplash.com/photo-1564861257520-6eb0adb6a32b?w=400&q=80',
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
    imageUrl: 'https://images.unsplash.com/photo-1611501275019-9b5cda994e8d?w=400&q=80',
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
    grad: ['#1A0A2E', '#3D1A6B'],
    hot: true,
    imageUrl: 'https://images.unsplash.com/photo-1604076913837-52ab5629fde9?w=400&q=80',
  },
];
