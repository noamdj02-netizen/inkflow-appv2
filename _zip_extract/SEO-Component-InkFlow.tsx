// ============================================
// 🎯 COMPOSANT SEO RÉUTILISABLE - InkFlow
// components/SEO.tsx
// ============================================

import Head from 'next/head';

interface SEOProps {
  title?: string;
  description?: string;
  canonical?: string;
  ogImage?: string;
  ogType?: 'website' | 'article' | 'profile';
  noindex?: boolean;
  schema?: object;
}

export default function SEO({
  title = 'InkFlow - Logiciel de gestion pour tatoueurs',
  description = 'Gérez vos rendez-vous, clients et portfolio de tatouage en un seul endroit. La solution professionnelle pour les artistes tatoueurs.',
  canonical,
  ogImage = 'https://ink-flow.me/og-image.png',
  ogType = 'website',
  noindex = false,
  schema
}: SEOProps) {
  const fullTitle = title.includes('InkFlow') ? title : `${title} | InkFlow`;
  const siteUrl = 'https://ink-flow.me';
  const fullCanonical = canonical ? `${siteUrl}${canonical}` : siteUrl;

  return (
    <Head>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      {noindex && <meta name="robots" content="noindex, nofollow" />}

      {/* Canonical URL */}
      <link rel="canonical" href={fullCanonical} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={fullCanonical} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:site_name" content="InkFlow" />
      <meta property="og:locale" content="fr_FR" />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={fullCanonical} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />

      {/* Additional Meta */}
      <meta name="author" content="InkFlow" />
      <meta name="language" content="fr-FR" />
      <meta httpEquiv="content-language" content="fr" />

      {/* Schema.org JSON-LD */}
      {schema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      )}
    </Head>
  );
}


// ============================================
// 📋 EXEMPLES D'UTILISATION
// ============================================

// 1. Page d'accueil
/*
<SEO 
  title="InkFlow - Logiciel de gestion pour tatoueurs"
  description="Gérez vos rendez-vous, clients et portfolio de tatouage. Solution professionnelle pour artistes tatoueurs."
  canonical="/"
  schema={organizationSchema}
/>
*/

// 2. Page vitrine tatoueur
/*
<SEO 
  title={`${studioName} - Tatoueur professionnel`}
  description={`Découvrez le portfolio et prenez rendez-vous avec ${artistName}. ${specialty}.`}
  canonical={`/studio/${slug}`}
  ogImage={studioCoverImage}
  ogType="profile"
  schema={localBusinessSchema}
/>
*/

// 3. Page privée (dashboard)
/*
<SEO 
  title="Tableau de bord"
  noindex={true}
/>
*/


// ============================================
// 🏢 SCHEMAS JSON-LD PRÊTS À L'EMPLOI
// ============================================

// Schema Organisation (page d'accueil)
export const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "InkFlow",
  "url": "https://ink-flow.me",
  "logo": "https://ink-flow.me/logo.png",
  "description": "Logiciel de gestion pour tatoueurs professionnels",
  "sameAs": [
    "https://www.facebook.com/inkflow",
    "https://www.instagram.com/inkflow",
    "https://twitter.com/inkflow"
  ],
  "contactPoint": {
    "@type": "ContactPoint",
    "contactType": "Customer Service",
    "email": "contact@ink-flow.me"
  }
};

// Schema LocalBusiness (page tatoueur)
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
}) {
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": studio.name,
    "image": studio.image,
    "description": studio.description,
    "@id": `https://ink-flow.me/studio/${studio.name.toLowerCase()}`,
    "url": `https://ink-flow.me/studio/${studio.name.toLowerCase()}`,
    "telephone": studio.phone,
    "address": {
      "@type": "PostalAddress",
      "streetAddress": studio.address,
      "addressLocality": studio.city,
      "postalCode": studio.postalCode,
      "addressCountry": "FR"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": 0, // À remplir
      "longitude": 0  // À remplir
    },
    "openingHoursSpecification": {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday"
      ],
      "opens": "10:00",
      "closes": "19:00"
    },
    "aggregateRating": studio.rating ? {
      "@type": "AggregateRating",
      "ratingValue": studio.rating,
      "reviewCount": studio.reviewCount || 0
    } : undefined
  };
}

// Schema WebSite avec SearchAction
export const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "InkFlow",
  "url": "https://ink-flow.me",
  "potentialAction": {
    "@type": "SearchAction",
    "target": "https://ink-flow.me/search?q={search_term_string}",
    "query-input": "required name=search_term_string"
  }
};

// Schema Service (services de tatouage)
export function createTattooServiceSchema(service: {
  name: string;
  description: string;
  price?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    "serviceType": service.name,
    "description": service.description,
    "provider": {
      "@type": "LocalBusiness",
      "name": "InkFlow"
    },
    "areaServed": {
      "@type": "Country",
      "name": "France"
    },
    "offers": service.price ? {
      "@type": "Offer",
      "price": service.price,
      "priceCurrency": "EUR"
    } : undefined
  };
}


// ============================================
// 🎨 EXEMPLES COMPLETS PAR PAGE
// ============================================

// Page d'accueil
/*
import SEO, { organizationSchema, websiteSchema } from '@/components/SEO';

export default function HomePage() {
  return (
    <>
      <SEO
        title="InkFlow - Logiciel de gestion pour tatoueurs professionnels"
        description="Gérez vos rendez-vous, clients et portfolio de tatouage en un seul endroit. La solution professionnelle pour les artistes tatoueurs en France."
        canonical="/"
        ogImage="https://ink-flow.me/og-home.png"
        schema={[organizationSchema, websiteSchema]}
      />
      <main>...</main>
    </>
  );
}
*/

// Page vitrine tatoueur public
/*
import SEO, { createTattooStudioSchema } from '@/components/SEO';

export default function StudioPage({ studio }) {
  const schema = createTattooStudioSchema({
    name: studio.name,
    description: studio.bio,
    address: studio.address,
    city: studio.city,
    postalCode: studio.postalCode,
    phone: studio.phone,
    image: studio.coverImage,
    rating: studio.averageRating,
    reviewCount: studio.reviewCount
  });

  return (
    <>
      <SEO
        title={`${studio.name} - Tatoueur ${studio.city}`}
        description={`${studio.bio.substring(0, 150)}... Prenez rendez-vous facilement en ligne.`}
        canonical={`/studio/${studio.slug}`}
        ogImage={studio.coverImage}
        ogType="profile"
        schema={schema}
      />
      <main>...</main>
    </>
  );
}
*/

// Page de prise de rendez-vous
/*
<SEO
  title={`Prendre rendez-vous avec ${studioName}`}
  description={`Réservez votre séance de tatouage en ligne avec ${studioName}. Sélectionnez votre date et heure préférées.`}
  canonical={`/prendre-rdv/${studioSlug}`}
  ogImage={studioImage}
/>
*/

// Page dashboard (privée)
/*
<SEO
  title="Tableau de bord - InkFlow"
  description="Gérez votre activité de tatoueur"
  noindex={true}  // Pas d'indexation des pages privées
/>
*/
