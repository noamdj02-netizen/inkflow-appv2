import React, { type ComponentType } from 'react';
import { ClassicTheme } from './ClassicTheme';
import { SplitTheme } from './SplitTheme';
import { VintageTheme } from './VintageTheme';
import { SEO } from '../SEO';
import type { StudioThemeProps } from '../../types/studio-theme';
import type { VitrineData } from '../../types/vitrine';

/**
 * Map des thèmes structurels. Pour ajouter un nouveau thème (ex: BentoTheme, NeonTheme) :
 * 1. Créer le fichier dans components/studio-themes/ (ex: BentoTheme.tsx)
 * 2. L'exporter depuis components/studio-themes/index.ts
 * 3. L'ajouter ici dans themeMap avec sa clé (ex: bento, neon)
 */
const themeMap: Record<string, ComponentType<StudioThemeProps>> = {
  classic: ClassicTheme,
  split: SplitTheme,
  vintage: VintageTheme,
};

const STRUCTURAL_THEME_IDS = ['classic', 'split', 'vintage'] as const;

function isStructuralTheme(themeId: string | undefined): themeId is (typeof STRUCTURAL_THEME_IDS)[number] {
  return themeId != null && STRUCTURAL_THEME_IDS.includes(themeId as (typeof STRUCTURAL_THEME_IDS)[number]);
}

function vitrineToStudioThemeProps(data: VitrineData, baseUrl: string): StudioThemeProps {
  const bookingUrl = `${baseUrl}/book/${data.slug}`;
  const city = data.address?.split(',').pop()?.trim() ?? null;
  const instagramHandle = data.instagram?.replace(/^@/, '') ? `@${data.instagram.replace(/^@/, '')}` : null;

  return {
    studio: {
      name: data.name,
      slug: data.slug,
      bio: data.description || data.tagline || null,
      avatarUrl: data.avatar || null,
      city,
      instagramHandle,
      bookingUrl,
      themeName: data.theme ?? 'classic',
    },
    flashItems: data.flashDesigns.map((f) => ({
      id: f.id,
      imageUrl: f.imageUrl,
      title: f.title,
      price: f.price,
      isAvailable: f.available,
    })),
    portfolioItems: data.portfolio.map((p, i) => ({
      id: `p-${i}`,
      imageUrl: p.url,
      caption: p.description || p.category || undefined,
    })),
  };
}

interface StudioThemeRouterProps {
  data: VitrineData;
  /** Composant à rendre si le thème n'est pas structurel (light, dark, neon) */
  fallback: React.ReactNode;
}

/**
 * Routeur de thèmes structurels. Si le studio a un thème classic/split/vintage,
 * rend le composant correspondant. Sinon rend le fallback (PublicStudioPagePro).
 */
export const StudioThemeRouter: React.FC<StudioThemeRouterProps> = ({ data, fallback }) => {
  const themeId = data.theme ?? 'light';

  if (!isStructuralTheme(themeId)) {
    return <>{fallback}</>;
  }

  const ThemeComponent = themeMap[themeId] ?? themeMap.classic;
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const props = vitrineToStudioThemeProps(data, baseUrl);

  return (
    <div className="landing-scroll">
      <SEO
        title={`${data.name} | Tatoueur & Prise de RDV - InkFlow`}
        description={data.description || data.tagline || `Découvrez les flashs et prenez rendez-vous avec ${data.name}.`}
        canonical={`/studio/${data.slug}`}
        ogImage={data.avatar || data.coverImage}
      />
      <ThemeComponent {...props} />
    </div>
  );
};
