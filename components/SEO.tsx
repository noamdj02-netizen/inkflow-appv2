/**
 * Composant SEO réutilisable (Vite / React SPA).
 * Met à jour title, meta et JSON-LD via le DOM (pas de next/head).
 */
import React, { useEffect } from 'react';

const SITE_URL = 'https://ink-flow.me';
const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.png`;

export interface SEOProps {
  title?: string;
  description?: string;
  canonical?: string;
  ogImage?: string;
  ogType?: 'website' | 'article' | 'profile';
  noindex?: boolean;
  /** Schema.org JSON-LD : objet unique ou tableau d'objets */
  schema?: object | object[];
}

function setMeta(name: string, content: string, attr: 'name' | 'property' = 'name') {
  let el = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function setLink(rel: string, href: string) {
  let el = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

export const SEO: React.FC<SEOProps> = ({
  title = 'InkFlow - Logiciel de gestion pour tatoueurs',
  description = 'Gérez vos rendez-vous, clients et portfolio de tatouage en un seul endroit. La solution professionnelle pour les artistes tatoueurs.',
  canonical,
  ogImage = DEFAULT_OG_IMAGE,
  ogType = 'website',
  noindex = false,
  schema,
}) => {
  const fullTitle = title.includes('InkFlow') ? title : `${title} | InkFlow`;
  const fullCanonical = canonical ? `${SITE_URL}${canonical}` : SITE_URL;
  const JSONLD_ID = 'inkflow-jsonld';

  useEffect(() => {
    document.title = fullTitle;

    setMeta('description', description);
    setMeta('robots', noindex ? 'noindex, nofollow' : 'index, follow');
    setMeta('og:type', ogType, 'property');
    setMeta('og:url', fullCanonical, 'property');
    setMeta('og:title', fullTitle, 'property');
    setMeta('og:description', description, 'property');
    setMeta('og:image', ogImage, 'property');
    setMeta('og:image:width', '1200', 'property');
    setMeta('og:image:height', '630', 'property');
    setMeta('og:site_name', 'InkFlow', 'property');
    setMeta('og:locale', 'fr_FR', 'property');
    setMeta('twitter:card', 'summary_large_image');
    setMeta('twitter:url', fullCanonical);
    setMeta('twitter:title', fullTitle);
    setMeta('twitter:description', description);
    setMeta('twitter:image', ogImage);
    setMeta('author', 'InkFlow');
    setMeta('language', 'fr-FR');

    setLink('canonical', fullCanonical);

    if (schema) {
      const existing = document.getElementById(JSONLD_ID);
      if (existing) existing.remove();
      const script = document.createElement('script');
      script.id = JSONLD_ID;
      script.type = 'application/ld+json';
      const data = Array.isArray(schema) ? schema : [schema];
      script.textContent = JSON.stringify(data.length === 1 ? data[0] : data);
      document.head.appendChild(script);
    }
  }, [fullTitle, description, fullCanonical, ogImage, ogType, noindex, schema]);

  useEffect(() => {
    return () => {
      const el = document.getElementById(JSONLD_ID);
      if (el) el.remove();
    };
  }, []);

  return null;
};

// --- Schemas JSON-LD exportés ---

export const organizationSchema: object = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'InkFlow',
  url: SITE_URL,
  logo: `${SITE_URL}/logo.png`,
  description: 'Logiciel de gestion pour tatoueurs professionnels',
  sameAs: [
    'https://www.facebook.com/inkflow',
    'https://www.instagram.com/inkflow',
    'https://twitter.com/inkflow',
  ],
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'Customer Service',
    email: 'contact@ink-flow.me',
  },
};

export const websiteSchema: object = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'InkFlow',
  url: SITE_URL,
  potentialAction: {
    '@type': 'SearchAction',
    target: `${SITE_URL}/search?q={search_term_string}`,
    'query-input': 'required name=search_term_string',
  },
};

export function createTattooStudioSchema(studio: {
  name: string;
  description: string;
  address: string;
  city: string;
  postalCode: string;
  phone?: string;
  image: string;
  rating?: number;
  reviewCount?: number;
  slug?: string;
}): object {
  const base = studio.slug ? `${SITE_URL}/studio/${studio.slug}` : `${SITE_URL}/studio/${studio.name.toLowerCase().replace(/\s+/g, '-')}`;
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: studio.name,
    image: studio.image,
    description: studio.description,
    '@id': base,
    url: base,
    telephone: studio.phone,
    address: {
      '@type': 'PostalAddress',
      streetAddress: studio.address,
      addressLocality: studio.city,
      postalCode: studio.postalCode,
      addressCountry: 'FR',
    },
    openingHoursSpecification: {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      opens: '10:00',
      closes: '19:00',
    },
    ...(studio.rating != null && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: studio.rating,
        reviewCount: studio.reviewCount ?? 0,
      },
    }),
  };
}

export function createTattooServiceSchema(service: {
  name: string;
  description: string;
  price?: string;
}): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    serviceType: service.name,
    description: service.description,
    provider: { '@type': 'LocalBusiness', name: 'InkFlow' },
    areaServed: { '@type': 'Country', name: 'France' },
    ...(service.price && {
      offers: { '@type': 'Offer', price: service.price, priceCurrency: 'EUR' },
    }),
  };
}
