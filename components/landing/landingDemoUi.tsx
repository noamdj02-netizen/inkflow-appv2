import React from 'react';
import { cn } from '@/lib/utils';

/** Typo Geist — preview dashboard landing (lisible une fois scalé). */
export const demoRoot =
  'font-sans antialiased text-white [font-feature-settings:"ss01","cv01"] [-webkit-font-smoothing:antialiased]';

export const demoPageTitle =
  'text-[14px] font-semibold leading-tight tracking-[-0.03em] text-white';

export const demoTitle = 'text-[13px] font-semibold leading-tight tracking-[-0.025em] text-white';

export const demoHeading = 'text-[12px] font-semibold leading-snug tracking-[-0.02em] text-white';

export const demoBody = 'text-[11px] font-normal leading-[1.45] text-white/75';

export const demoBodyMuted = 'text-[11px] font-normal leading-[1.45] text-white/52';

export const demoCaption = 'text-[10px] font-medium leading-snug tracking-[-0.01em] text-white/50';

export const demoMicro = 'text-[10px] font-semibold uppercase tracking-[0.12em] text-white/42';

export const demoStat =
  'font-mono text-[22px] font-semibold tabular-nums leading-none tracking-[-0.03em] text-white';

export const demoStatSm =
  'font-mono text-[15px] font-semibold tabular-nums leading-none tracking-[-0.02em] text-white';

export const demoLabel = 'text-[10px] font-medium leading-snug text-white/48';

export type LandingDemoAvatarSize = 'xs' | 'sm' | 'md' | 'lg';

const AVATAR_SIZE: Record<LandingDemoAvatarSize, string> = {
  xs: 'h-8 w-8',
  sm: 'h-9 w-9',
  md: 'h-11 w-11 sm:h-12 sm:w-12',
  lg: 'h-12 w-12 sm:h-14 sm:w-14',
};

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ''}${parts[parts.length - 1]![0] ?? ''}`.toUpperCase();
}

/**
 * Avatar photo — cercle plein via background-image (contourne img { height: auto } global).
 */
export function LandingDemoAvatar({
  src,
  alt,
  size = 'md',
  className,
}: {
  src: string;
  alt: string;
  size?: LandingDemoAvatarSize;
  className?: string;
}) {
  const [failed, setFailed] = React.useState(false);
  const initials = initialsFromName(alt);

  React.useEffect(() => {
    setFailed(false);
    const probe = new Image();
    probe.onload = () => setFailed(false);
    probe.onerror = () => setFailed(true);
    probe.src = src;
    return () => {
      probe.onload = null;
      probe.onerror = null;
    };
  }, [src]);

  return (
    <div
      role="img"
      aria-label={alt}
      className={cn(
        'relative shrink-0 overflow-hidden rounded-full bg-zinc-600 bg-cover bg-center ring-2 ring-[#333]',
        AVATAR_SIZE[size],
        className
      )}
      style={failed ? undefined : { backgroundImage: `url("${src}")` }}
    >
      {failed ? (
        <span className="flex h-full w-full items-center justify-center bg-zinc-600 text-[10px] font-semibold text-white">
          {initials}
        </span>
      ) : null}
    </div>
  );
}

/** Logo marque (Stripe…) — cercle plein fond blanc. */
export function LandingDemoBrandAvatar({
  src,
  alt,
  size = 'sm',
  className,
}: {
  src: string;
  alt: string;
  size?: LandingDemoAvatarSize;
  className?: string;
}) {
  return (
    <div
      role="img"
      aria-label={alt}
      className={cn(
        'relative shrink-0 overflow-hidden rounded-full bg-white bg-cover bg-center ring-2 ring-[#333]',
        AVATAR_SIZE[size],
        className
      )}
      style={{ backgroundImage: `url("${src}")` }}
    />
  );
}

/** Initiales — cercle plein zinc opaque. */
export function LandingDemoInitialsAvatar({
  initials,
  size = 'sm',
  className,
}: {
  initials: string;
  size?: LandingDemoAvatarSize;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full bg-zinc-600 font-semibold text-white ring-2 ring-[#333]',
        AVATAR_SIZE[size],
        size === 'xs' ? 'text-[9px]' : 'text-[10px]',
        className
      )}
    >
      {initials}
    </span>
  );
}

/** URLs avatars démo landing — PNG recadrés cercle. */
export const LANDING_DEMO_AVATARS = {
  lea: '/images/avatars/avatar-3.png',
  tom: '/images/avatars/avatar-2.png',
  amina: '/images/avatars/avatar-1.png',
} as const;
