/**
 * useClientManifest
 * Swaps the PWA manifest + iOS meta tags when the user is on /client routes.
 * Must be called once at the app root (App.tsx).
 */
import { useEffect } from 'react';

export function useClientManifest(isClientRoute: boolean) {
  useEffect(() => {
    const MANIFEST_PRO    = '/manifest.json';
    const MANIFEST_CLIENT = '/manifest-client.json';
    const TITLE_PRO       = 'InkFlow';
    const TITLE_CLIENT    = 'My Inkflow';
    const THEME_PRO       = '#0a0a0a';
    const THEME_CLIENT    = '#FFFFFF';

    /* ── manifest link ── */
    let link = document.querySelector<HTMLLinkElement>('link[rel="manifest"]');
    if (!link) {
      link = document.createElement('link');
      link.rel = 'manifest';
      document.head.appendChild(link);
    }

    /* ── apple-mobile-web-app-title ── */
    let appleTitleMeta = document.querySelector<HTMLMetaElement>(
      'meta[name="apple-mobile-web-app-title"]'
    );
    if (!appleTitleMeta) {
      appleTitleMeta = document.createElement('meta');
      appleTitleMeta.name = 'apple-mobile-web-app-title';
      document.head.appendChild(appleTitleMeta);
    }

    /* ── theme-color (primary, no media query) ── */
    let themeColorMeta = document.querySelector<HTMLMetaElement>(
      'meta[name="theme-color"]:not([media])'
    );
    if (!themeColorMeta) {
      themeColorMeta = document.createElement('meta');
      themeColorMeta.name = 'theme-color';
      document.head.appendChild(themeColorMeta);
    }

    if (isClientRoute) {
      link.href              = MANIFEST_CLIENT;
      appleTitleMeta.content = TITLE_CLIENT;
      themeColorMeta.content = THEME_CLIENT;
    } else {
      link.href              = MANIFEST_PRO;
      appleTitleMeta.content = TITLE_PRO;
      themeColorMeta.content = THEME_PRO;
    }
  }, [isClientRoute]);
}
