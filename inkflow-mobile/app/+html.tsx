import { ScrollViewStyleReset } from 'expo-router/html';

// This file is web-only and used to configure the root HTML for every
// web page during static rendering.
// The contents of this function only run in Node.js environments and
// do not have access to the DOM or browser APIs.
const INKFLOW_PRO_OG_TITLE = 'Inkflow Pro — Application studio tatoueur | InkFlow';
const INKFLOW_PRO_OG_DESCRIPTION =
  'L’application InkFlow pour tatoueurs : agenda, réservations, clients CRM et tableau de bord studio. Paiements Stripe, notifications.';
const INKFLOW_PRO_CANONICAL_URL = 'https://app.ink-flow.me/dashboard';
const INKFLOW_PRO_OG_IMAGE = 'https://ink-flow.me/og-image.png';
const INKFLOW_PRO_OG_IMAGE_ALT = 'Inkflow Pro — gestion studio tatoueur';

export default function Root({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />

        <title>{INKFLOW_PRO_OG_TITLE}</title>
        <meta name="description" content={INKFLOW_PRO_OG_DESCRIPTION} />
        <link rel="canonical" href={INKFLOW_PRO_CANONICAL_URL} />

        <meta property="og:type" content="website" />
        <meta property="og:title" content={INKFLOW_PRO_OG_TITLE} />
        <meta property="og:description" content={INKFLOW_PRO_OG_DESCRIPTION} />
        <meta property="og:url" content={INKFLOW_PRO_CANONICAL_URL} />
        <meta property="og:site_name" content="InkFlow" />
        <meta property="og:locale" content="fr_FR" />
        <meta property="og:image" content={INKFLOW_PRO_OG_IMAGE} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content={INKFLOW_PRO_OG_IMAGE_ALT} />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={INKFLOW_PRO_OG_TITLE} />
        <meta name="twitter:description" content={INKFLOW_PRO_OG_DESCRIPTION} />
        <meta name="twitter:image" content={INKFLOW_PRO_OG_IMAGE} />
        <meta name="twitter:image:alt" content={INKFLOW_PRO_OG_IMAGE_ALT} />

        {/* 
          Disable body scrolling on web. This makes ScrollView components work closer to how they do on native. 
          However, body scrolling is often nice to have for mobile web. If you want to enable it, remove this line.
        */}
        <ScrollViewStyleReset />

        {/* Using raw CSS styles as an escape-hatch to ensure the background color never flickers in dark-mode. */}
        <style dangerouslySetInnerHTML={{ __html: responsiveBackground }} />
        {/* Add any additional <head> elements that you want globally available on web... */}
      </head>
      <body>{children}</body>
    </html>
  );
}

const responsiveBackground = `
body {
  background-color: #fff;
}
@media (prefers-color-scheme: dark) {
  body {
    background-color: #000;
  }
}`;
