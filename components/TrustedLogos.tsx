import React from 'react';

const logos = [
  { name: 'Stripe', src: '/logos/stripe.png' },
  { name: 'Calendly', src: '/logos/calendly.png' },
  { name: 'Notion', src: '/logos/notion.png' },
  { name: 'Slack', src: '/logos/slack.png' },
  { name: 'Google', src: '/logos/google.png' },
  { name: 'Zapier', src: '/logos/zapier.png' },
];

export const TrustedLogos: React.FC = () => {
  const duplicatedLogos = [...logos, ...logos];

  return (
    <div className="trusted-logos-marquee overflow-hidden px-4 sm:px-6 lg:px-8">
      <div className="flex gap-12 sm:gap-16 animate-logos-scroll w-max flex-nowrap">
        {duplicatedLogos.map((logo, index) => (
          <div
            key={`${logo.name}-${index}`}
            className="flex-shrink-0 flex items-center justify-center opacity-70 hover:opacity-100 transition-opacity duration-300"
            title={logo.name}
          >
            <img
              src={logo.src}
              alt={logo.name}
              className="h-8 sm:h-10 w-auto object-contain max-w-[120px] sm:max-w-[140px] mix-blend-multiply"
              loading="lazy"
            />
          </div>
        ))}
      </div>
    </div>
  );
};
