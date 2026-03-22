import React from 'react';
import { MapPin, Phone, Mail, Globe, Instagram } from 'lucide-react';

function normalizeWebsiteHref(raw: string): string {
  const t = raw.trim();
  if (!t) return '';
  if (/^https?:\/\//i.test(t)) return t;
  return `https://${t}`;
}

export type StudioThemeContactTone = 'dark' | 'vintage';

interface StudioThemeContactBlockProps {
  tone: StudioThemeContactTone;
  address: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  instagramHandle: string | null;
  className?: string;
}

/**
 * Bloc coordonnées partagé par les thèmes vitrine structurels (classic, split, vintage).
 */
export const StudioThemeContactBlock: React.FC<StudioThemeContactBlockProps> = ({
  tone,
  address,
  phone,
  email,
  website,
  instagramHandle,
  className = '',
}) => {
  const instagramUrl = instagramHandle
    ? `https://instagram.com/${instagramHandle.replace(/^@/, '')}`
    : null;
  const websiteHref = website ? normalizeWebsiteHref(website) : '';

  const isDark = tone === 'dark';
  const textRowClass = isDark
    ? 'flex items-start gap-2 text-sm text-neutral-400'
    : 'flex items-start gap-2 text-sm text-stone-600';
  const linkRowClass = isDark
    ? 'flex items-start gap-2 text-sm text-neutral-400 hover:text-violet-300 transition-colors'
    : 'flex items-start gap-2 text-sm text-stone-600 hover:text-amber-950 transition-colors';
  const iconClass = isDark ? 'w-4 h-4 shrink-0 mt-0.5 text-neutral-500' : 'w-4 h-4 shrink-0 mt-0.5 text-stone-500';

  const hasAny = !!(address || phone || email || website || instagramUrl);
  if (!hasAny) return null;

  return (
    <div className={`space-y-2.5 ${className}`}>
      {address && (
        <p className={textRowClass}>
          <MapPin className={iconClass} aria-hidden />
          <span className="text-left whitespace-pre-line">{address}</span>
        </p>
      )}
      {phone && (
        <a href={`tel:${phone.replace(/\s/g, '')}`} className={`${linkRowClass} min-h-[44px] items-center`}>
          <Phone className={iconClass} aria-hidden />
          {phone}
        </a>
      )}
      {email && (
        <a href={`mailto:${email}`} className={`${linkRowClass} min-h-[44px] items-center break-all`}>
          <Mail className={iconClass} aria-hidden />
          {email}
        </a>
      )}
      {websiteHref && (
        <a
          href={websiteHref}
          target="_blank"
          rel="noopener noreferrer"
          className={`${linkRowClass} min-h-[44px] items-center break-all`}
        >
          <Globe className={iconClass} aria-hidden />
          {website.replace(/^https?:\/\//i, '')}
        </a>
      )}
      {instagramUrl && (
        <a
          href={instagramUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={`${linkRowClass} min-h-[44px] items-center`}
        >
          <Instagram className={iconClass} aria-hidden />
          {instagramHandle?.startsWith('@') ? instagramHandle : `@${instagramHandle}`}
        </a>
      )}
    </div>
  );
};
