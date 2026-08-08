import { Instagram, Mail } from 'lucide-react';
import { cn } from '@/lib/utils';
import { INKFLOW_INSTAGRAM_URL } from '@/lib/urls';
import { supportMailto } from '@/lib/supportContact';

type SocialItem = {
  label: string;
  href: string;
  external?: boolean;
  icon: typeof Instagram;
};

const SOCIAL_ITEMS: SocialItem[] = [
  {
    label: 'Instagram InkFlow',
    href: INKFLOW_INSTAGRAM_URL,
    external: true,
    icon: Instagram,
  },
  {
    label: 'Contacter le support',
    href: supportMailto('Contact InkFlow'),
    icon: Mail,
  },
];

type SocialCloudProps = {
  className?: string;
};

/** Icônes sociales — nuage compact pour la carte bleue du footer landing. */
export function SocialCloud({ className }: SocialCloudProps) {
  return (
    <div className={cn('flex flex-wrap items-center', className)}>
      {SOCIAL_ITEMS.map(({ label, href, external, icon: Icon }) => (
        <a
          key={label}
          href={href}
          {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
          aria-label={label}
          className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/25 bg-white/10 text-white transition-all hover:bg-white/20 active:scale-[0.98]"
        >
          <Icon className="h-4 w-4" strokeWidth={2} aria-hidden />
        </a>
      ))}
    </div>
  );
}
