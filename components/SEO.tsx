/**
 * Composant SEO réutilisable (Vite / React SPA).
 * Met à jour title, meta et JSON-LD via le DOM (pas de next/head).
 * Landing (ink-flow.me) = Framer. App (dashboard, login, etc.) = Vercel.
 */
import React, { useEffect } from 'react';
import { LANDING_URL, APP_URL } from '../lib/urls';
import { toAbsoluteUrl } from '../lib/seoUtils';

const SITE_URL = LANDING_URL;
const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.png`;

export interface SEOProps {
  title?: string;
  description?: string;
  canonical?: string;
  ogImage?: string;
  /** Texte alternatif pour og:image (accessibilité + réseaux sociaux) */
  ogImageAlt?: string;
  ogType?: 'website' | 'article' | 'profile';
  noindex?: boolean;
  /** Meta keywords (usage secondaire, cohérence sémantique) */
  keywords?: string;
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
  description =
    'Logiciel de gestion pour tatoueurs et studios en France : agenda partagé, réservations en ligne, acomptes Stripe (EUR), CRM clients, vitrine et galerie flash. Essai gratuit 14 jours, sans carte.',
  canonical,
  ogImage = DEFAULT_OG_IMAGE,
  ogImageAlt = 'InkFlow — logiciel de gestion pour tatoueurs et studios',
  ogType = 'website',
  noindex = false,
  keywords,
  schema,
}) => {
  const fullTitle = title.includes('InkFlow') ? title : `${title} | InkFlow`;
  /** Landing (/) : canonical = SITE_URL (Framer) pour éviter doublon. Pages app : canonical = APP_URL. */
  const fullCanonical = !canonical || canonical === '/' ? SITE_URL : `${APP_URL.replace(/\/$/, '')}${canonical.startsWith('/') ? canonical : `/${canonical}`}`;
  const absoluteOgImage = toAbsoluteUrl(ogImage, DEFAULT_OG_IMAGE);
  const JSONLD_ID = 'inkflow-jsonld';

  useEffect(() => {
    document.title = fullTitle;

    setMeta('description', description);
    setMeta('robots', noindex ? 'noindex, nofollow' : 'index, follow');
    const kwEl = document.querySelector('meta[name="keywords"]') as HTMLMetaElement | null;
    if (keywords) {
      setMeta('keywords', keywords);
    } else if (kwEl) {
      kwEl.remove();
    }
    setMeta('og:type', ogType, 'property');
    setMeta('og:url', fullCanonical, 'property');
    setMeta('og:title', fullTitle, 'property');
    setMeta('og:description', description, 'property');
    setMeta('og:image', absoluteOgImage, 'property');
    setMeta('og:image:width', '1200', 'property');
    setMeta('og:image:height', '630', 'property');
    setMeta('og:image:alt', ogImageAlt, 'property');
    setMeta('og:site_name', 'InkFlow', 'property');
    setMeta('og:locale', 'fr_FR', 'property');
    setMeta('twitter:card', 'summary_large_image');
    setMeta('twitter:url', fullCanonical);
    setMeta('twitter:title', fullTitle);
    setMeta('twitter:description', description);
    setMeta('twitter:image', absoluteOgImage);
    setMeta('twitter:image:alt', ogImageAlt);
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
    } else {
      const existing = document.getElementById(JSONLD_ID);
      if (existing) existing.remove();
    }
  }, [fullTitle, description, fullCanonical, absoluteOgImage, ogImageAlt, ogType, noindex, keywords, schema]);

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
  logo: `${SITE_URL}/og-image.png`,
  description:
    'Logiciel SaaS de gestion, réservations en ligne et CRM pour tatoueurs et studios de tatouage en France (facturation en euros, conformité RGPD).',
  areaServed: { '@type': 'Country', name: 'France' },
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'customer support',
    email: 'contact@ink-flow.me',
    availableLanguage: ['French'],
  },
};

/** Pas de SearchAction fictif : évite les données structurées trompeuses pour Google. */
export const websiteSchema: object = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'InkFlow',
  url: SITE_URL,
  description:
    'Réservations en ligne, paiements Stripe (EUR), vitrine publique et agenda pour tatoueurs et studios de tatouage en France.',
  inLanguage: 'fr-FR',
  publisher: { '@type': 'Organization', name: 'InkFlow', url: SITE_URL },
};

/** Données honnêtes — ne pas inclure d’AggregateRating sans avis réels vérifiables. */
export const softwareApplicationSchema: object = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'InkFlow',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  browserRequirements: 'Requires JavaScript',
  availableLanguage: 'French',
  audience: {
    '@type': 'Audience',
    audienceType: 'Artistes tatoueurs et studios de tatouage',
    geographicArea: { '@type': 'Country', name: 'France' },
  },
  offers: {
    '@type': 'AggregateOffer',
    lowPrice: '29',
    highPrice: '99',
    priceCurrency: 'EUR',
    offerCount: '3',
    availability: 'https://schema.org/InStock',
  },
  description:
    'Agenda, réservations en ligne, acomptes Stripe en euros, galerie flash, CRM et vitrine pour tatoueurs en France.',
};

/** FAQ — type éligible aux « résultats enrichis » FAQ dans Google (contrairement à SoftwareApplication seul). */
export const faqPageSchemaFr: object = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: "Qu'est-ce que l'assistant IA Inkflow ?",
      acceptedAnswer: {
        '@type': 'Answer',
        text: "Il propose des brouillons et des créneaux quand une demande arrive. Vous relisez, vous envoyez. Rien ne part sans votre accord.",
      },
    },
    {
      '@type': 'Question',
      name: 'Comment fonctionnent les paiements Stripe ?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: "Inkflow s'intègre directement avec Stripe. Vos clients paient l'acompte en ligne lors de la réservation. Les fonds arrivent sur votre compte Stripe en quelques jours. Aucune configuration complexe.",
      },
    },
    {
      '@type': 'Question',
      name: 'Quelle est la différence entre le plan Solo et Studio ?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Le plan Solo est conçu pour les tatoueurs indépendants (1 artiste, 100 clients CRM). Le plan Studio inclut plusieurs artistes, des clients CRM illimités et des statistiques avancées par artiste.',
      },
    },
    {
      '@type': 'Question',
      name: 'Puis-je gérer mon propre portail client ?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: "Oui. Chaque client dispose d'un espace personnel pour voir ses rendez-vous, ses messages et l'historique de ses tatouages. Vous contrôlez les accès depuis votre dashboard.",
      },
    },
    {
      '@type': 'Question',
      name: 'Comment est gérée la galerie flash unique ?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: "Publiez vos flashs avec photos et prix. Une fois qu'un client paie l'acompte pour un flash, il est automatiquement bloqué et retiré de la galerie publique. Plus de double réservation.",
      },
    },
    {
      '@type': 'Question',
      name: 'InkFlow est-il adapté aux tatoueurs en France ?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: "Oui. InkFlow cible les professionnels du tatouage en France : interface en français, tarifs en euros, paiements via Stripe (cartes et acomptes), et données hébergées pour un usage conforme au RGPD. L'essai gratuit de 14 jours ne nécessite pas de carte bancaire.",
      },
    },
    {
      '@type': 'Question',
      name: 'Quel logiciel pour gérer les rendez-vous d’un salon de tatouage ?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: "InkFlow centralise l'agenda, les demandes clients, les acomptes en ligne et le suivi CRM dans une seule application web. Les clients peuvent réserver via votre page vitrine ou un lien de réservation ; vous gardez le contrôle des créneaux et des statuts de rendez-vous.",
      },
    },
  ],
};

export function createBreadcrumbSchema(items: { name: string; url: string }[]): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

/** FAQ par page (fonctionnalités, aide…) — extractible par Google / IA */
export function createFaqSchemaFromPairs(pairs: { question: string; answer: string }[]): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: pairs.map((p) => ({
      '@type': 'Question',
      name: p.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: p.answer,
      },
    })),
  };
}

export function createWebPageSchema(opts: {
  name: string;
  description: string;
  url: string;
  dateModified?: string;
}): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: opts.name,
    description: opts.description,
    url: opts.url,
    inLanguage: 'fr-FR',
    isPartOf: { '@type': 'WebSite', name: 'InkFlow', url: SITE_URL },
    ...(opts.dateModified ? { dateModified: opts.dateModified } : {}),
  };
}

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
  const appBase = APP_URL.replace(/\/$/, '');
  const base = studio.slug ? `${appBase}/studio/${studio.slug}` : `${appBase}/studio/${studio.name.toLowerCase().replace(/\s+/g, '-')}`;
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
