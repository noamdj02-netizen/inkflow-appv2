import React, { useId } from 'react';

interface LogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeToPx: Record<NonNullable<LogoProps['size']>, number> = {
  xs: 28,
  sm: 32,
  md: 40,
  lg: 48,
};

const sizeClasses = {
  xs: 'w-7 h-7 max-h-7 max-w-7',
  sm: 'w-8 h-8 max-h-8 max-w-8',
  md: 'w-10 h-10 max-h-10 max-w-10',
  lg: 'w-12 h-12 max-h-12 max-w-12',
};

/**
 * Marque monogramme InkFlow — SVG inline (pas de requête réseau sur `/icon.svg`) pour éviter
 * un logo manquant au rechargement (PWA / cache / timing LCP). Filtres `invert` hérités : inchangé.
 */
export const Logo: React.FC<LogoProps> = ({ size = 'md', className = '' }) => {
  const reactId = useId();
  const clipId = `inkflow-clip-${reactId.replace(/:/g, '')}`;
  const safe = size && size in sizeToPx ? size : 'md';
  const w = sizeToPx[safe as keyof typeof sizeToPx];

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 1500 1500"
      width={w}
      height={w}
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label="InkFlow"
      className={`flex-shrink-0 object-contain rounded-2xl ${sizeClasses[size as keyof typeof sizeClasses] ?? sizeClasses.md} ${className}`.trim()}
    >
      <defs>
        <clipPath id={clipId}>
          <rect x="0" y="0" width="978" height="998" />
        </clipPath>
      </defs>
      <rect x="-150" y="-150" width="1800" height="1800" fill="#0a0a0a" />
      <g transform="matrix(1, 0, 0, 1, 250, 246)">
        <g clipPath={`url(#${clipId})`}>
          <g fill="#ffffff">
            <g transform="translate(0.954406, 814.201253)">
              <path d="M 379.328125 -754.65625 L 260.234375 0 L 64.0625 0 L 183.15625 -754.65625 Z" />
            </g>
          </g>
          <g fill="#ffffff">
            <g transform="translate(219.124934, 814.201253)">
              <path d="M 616.53125 -754.65625 L 590.515625 -588.515625 L 353.3125 -588.515625 L 333.296875 -462.40625 L 548.484375 -462.40625 L 522.453125 -296.265625 L 307.265625 -296.265625 L 260.234375 0 L 64.0625 0 L 183.15625 -754.65625 Z" />
            </g>
          </g>
          <g fill="#ffffff">
            <g transform="translate(655.479647, 814.201253)">
              <path d="M 306.265625 -117.109375 C 306.265625 -80.398438 292.082031 -48.367188 263.71875 -21.015625 C 235.363281 6.335938 203.835938 20.015625 169.140625 20.015625 C 141.117188 20.015625 117.429688 10.675781 98.078125 -8 C 78.734375 -26.6875 69.0625 -50.707031 69.0625 -80.0625 C 69.0625 -116.101562 83.238281 -147.46875 111.59375 -174.15625 C 139.957031 -200.84375 171.488281 -214.1875 206.1875 -214.1875 C 234.875 -214.1875 258.722656 -205.007812 277.734375 -186.65625 C 296.753906 -168.3125 306.265625 -145.128906 306.265625 -117.109375 Z" />
            </g>
          </g>
        </g>
      </g>
    </svg>
  );
};
