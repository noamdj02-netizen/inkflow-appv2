import * as React from 'react';

import { EmailBase } from './EmailBase';
import { absoluteUrlForClientDashboardTab } from '../lib/clientDashboardRoutes';

interface RdvConfirmeEmailProps {
  clientName?: string;
  studioName?: string;
  date?: string;
  baseUrl?: string;
  conversationLink?: string;
  supportPhone?: string;
  supportAddress?: string;
}

export const RdvConfirmeEmail = ({
  clientName = 'Client',
  studioName = 'Mon studio',
  date = 'lundi 4 février 2030',
  baseUrl = 'https://ink-flow.me',
  conversationLink,
  supportPhone = '06 33 43 89 26',
  supportAddress = 'Paris, France',
}: RdvConfirmeEmailProps) => {
  const appOrigin = 'https://app.ink-flow.me';
  const ctaUrl = conversationLink || absoluteUrlForClientDashboardTab(appOrigin, 'rdv');

  const footerNote = [
    `Besoin d'aide ? Appelez-nous au ${supportPhone}, démarrez un chat dans l'application, ou consultez le centre d'assistance.`,
    `Préférences e-mail : ${baseUrl}/parametres`,
    supportAddress,
  ].join('\n\n');

  return (
    <EmailBase
      preview="Votre rendez-vous est confirmé !"
      title="Votre rendez-vous est confirmé."
      bodyText={`Bonjour ${clientName},\n\nNous sommes impatients de vous voir chez ${studioName}.`}
      recap={[{ label: 'Date', value: date }]}
      ctaLabel="Ouvrir mon espace client"
      ctaHref={ctaUrl}
      secondaryCtaLabel="Site ink-flow.me"
      secondaryCtaHref={baseUrl}
      footerNote={footerNote}
      appUrl={appOrigin}
    />
  );
};

export default RdvConfirmeEmail;
