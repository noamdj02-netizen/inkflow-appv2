import React, { type ComponentType } from 'react';
import { ClassicTheme } from './ClassicTheme';
import { SplitTheme } from './SplitTheme';
import { VintageTheme } from './VintageTheme';
import { SEO } from '../SEO';
import type { StudioThemeProps } from '../../types/studio-theme';
import type { VitrineData } from '../../types/vitrine';
import type { GoogleReviewsPayload } from '../../types/googlePlaces';
import { safeExternalHttpUrl } from '../../lib/urls';

/**
 * Thèmes structurels = famille « Focus & conversion » (page courte). Les thèmes Full Studio
 * restent rendus par PublicStudioPagePro. Voir `productTier` dans `lib/themes.ts`.
 *
 * Pour ajouter un thème structurel :
 * 1. Créer le fichier dans components/studio-themes/
 * 2. L'exporter depuis components/studio-themes/index.ts
 * 3. L'ajouter ici dans themeMap et dans VITRINE_THEMES (productTier: 'focus')
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

/** Même logique que PublicStudioPagePro : fiche Google si renseignée, sinon recherche Maps sur l’adresse */
function resolvePublicGoogleMapsUrl(data: VitrineData): string | null {
  const custom = safeExternalHttpUrl(data.googleBusinessUrl ?? '');
  if (custom) return custom;
  const addr = (data.address ?? '').trim();
  if (!addr) return null;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addr)}`;
}

function vitrineToStudioThemeProps(data: VitrineData, baseUrl: string): StudioThemeProps {
  const bookingUrl = `${baseUrl}/book/${data.slug}`;
  const city = data.address?.split(',').pop()?.trim() ?? null;
  const instagramHandle = data.instagram?.replace(/^@/, '') ? `@${data.instagram.replace(/^@/, '')}` : null;

  const trimOrNull = (s: string | undefined): string | null => {
    const t = (s ?? '').trim();
    return t.length > 0 ? t : null;
  };

  return {
    studio: {
      name: data.name,
      slug: data.slug,
      bio: trimOrNull(data.description) ?? trimOrNull(data.tagline),
      avatarUrl: data.avatar || null,
      city,
      address: trimOrNull(data.address),
      phone: trimOrNull(data.phone),
      email: trimOrNull(data.email),
      website: trimOrNull(data.website),
      instagramHandle,
      bookingUrl,
      googleBusinessUrl: resolvePublicGoogleMapsUrl(data),
      themeName: data.theme ?? 'classic',
    },
    flashItems: data.flashDesigns.map((f) => ({
      id: f.id,
      imageUrl: f.imageUrl,
      title: f.title,
      price: f.price,
      isAvailable: f.available,
      duration: f.duration,
      style: f.style,
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
  googleReviews?: GoogleReviewsPayload | null;
}

/**
 * Routeur de thèmes structurels. Si le studio a un thème classic/split/vintage,
 * rend le composant correspondant. Sinon rend le fallback (PublicStudioPagePro).
 */
export const StudioThemeRouter: React.FC<StudioThemeRouterProps> = ({ data, fallback, googleReviews }) => {
  const themeId = data.theme ?? 'light';

  if (!isStructuralTheme(themeId)) {
    return <>{fallback}</>;
  }

  const ThemeComponent = themeMap[themeId] ?? themeMap.classic;
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const props: StudioThemeProps = { ...vitrineToStudioThemeProps(data, baseUrl), googleReviews: googleReviews ?? null };

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
