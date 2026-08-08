/**
 * Thèmes de la page vitrine — gratuit et premium.
 * Les thèmes premium nécessitent un abonnement Pro ou supérieur.
 *
 * **Positionnement produit** (tarifs / marketing) :
 * - `focus` — thèmes « Focus & conversion » : page courte (flashs, contact, réservation). Idéal Instagram / lien en bio.
 * - `full` — thèmes « Full Studio » : vitrine longue (SEO, services, artistes, FAQ, etc.). Idéal gros studios.
 * On ne vise pas l’équivalence fonctionnelle entre les deux familles : c’est une hiérarchie d’offre.
 */
export interface VitrineTheme {
  id: string;
  name: string;
  premium: boolean;
  /** Famille produit : conversion courte vs vitrine complète */
  productTier: 'focus' | 'full';
  description: string;
  /** Classes Tailwind pour le conteneur principal (bg, text) */
  containerClasses: string;
  /** Couleur accent (CTA, liens actifs) */
  accentColor: string;
  /** Mini-aperçu : couleurs pour simuler la page dans le sélecteur */
  preview: {
    bg: string;
    card: string;
    text: string;
    accent: string;
  };
}

export const VITRINE_THEMES: VitrineTheme[] = [
  {
    id: 'classic',
    name: 'Classic Linktree',
    premium: false,
    productTier: 'focus',
    description: 'Une colonne centrée, style épuré',
    containerClasses: 'bg-[#0a0a0b] text-neutral-100',
    accentColor: '#7c3aed',
    preview: {
      bg: 'bg-[#0a0a0b]',
      card: 'bg-neutral-900',
      text: 'text-neutral-100',
      accent: 'bg-violet-500',
    },
  },
  {
    id: 'split',
    name: 'Split Layout',
    premium: false,
    productTier: 'focus',
    description: '2 colonnes : profil fixe + contenu',
    containerClasses: 'bg-neutral-950 text-neutral-100',
    accentColor: '#7c3aed',
    preview: {
      bg: 'bg-neutral-950',
      card: 'bg-neutral-900',
      text: 'text-neutral-100',
      accent: 'bg-violet-500',
    },
  },
  {
    id: 'light',
    name: 'Minimalist Light',
    premium: false,
    productTier: 'full',
    description: 'Blanc épuré, style éditorial (type Pinterest)',
    containerClasses: 'bg-[#f7f7f5] text-neutral-900',
    accentColor: '#171717',
    preview: {
      bg: 'bg-[#f7f7f5]',
      card: 'bg-white',
      text: 'text-neutral-900',
      accent: 'bg-neutral-900',
    },
  },
  {
    id: 'dark',
    name: 'Dark Ink',
    premium: false,
    productTier: 'full',
    description: 'Noir profond, style tatouage',
    containerClasses: 'bg-neutral-950 text-white',
    accentColor: '#a78bfa',
    preview: {
      bg: 'bg-neutral-950',
      card: 'bg-neutral-900',
      text: 'text-white',
      accent: 'bg-violet-400',
    },
  },
  {
    id: 'vintage',
    name: 'Vintage Flash',
    premium: true,
    productTier: 'focus',
    description: 'Papier texturé beige, rétro',
    containerClasses: 'bg-[#F5F5DC] text-amber-950 font-serif',
    accentColor: '#b45309',
    preview: {
      bg: 'bg-[#F5F5DC]',
      card: 'bg-amber-50',
      text: 'text-amber-950',
      accent: 'bg-amber-600',
    },
  },
  {
    id: 'neon',
    name: 'Cyber Neon',
    premium: true,
    productTier: 'full',
    description: 'Sombre avec accents violets et verts',
    containerClasses: 'bg-slate-900 text-purple-400',
    accentColor: '#22d3ee',
    preview: {
      bg: 'bg-slate-900',
      card: 'bg-slate-800',
      text: 'text-purple-400',
      accent: 'bg-cyan-400',
    },
  },
];

export const DEFAULT_VITRINE_THEME_ID = 'light';

/**
 * Thèmes listés dans Paramètres → vitrine (tous les ids connus ;
 * les thèmes premium peuvent être verrouillés selon l’abo).
 */
export const VITRINE_THEMES_SELECTOR: readonly VitrineTheme[] = VITRINE_THEMES;

export function getVitrineTheme(id: string): VitrineTheme | undefined {
  return VITRINE_THEMES.find((t) => t.id === id);
}
