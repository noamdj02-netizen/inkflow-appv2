import React from 'react';

/** Mascotte machine à tatouer (style 3D doux) - image de marque InkFlow */
export const InkDropMascot: React.FC<{ className?: string; size?: number }> = ({ className = '', size = 80 }) => {
  const id = React.useId().replace(/:/g, '');
  const grad = `inkGrad-${id}`;
  const highlight = `inkHighlight-${id}`;
  return (
    <div className={`flex-shrink-0 ${className}`} style={{ width: size, height: size }} aria-hidden>
      <svg viewBox="0 0 120 120" fill="none" className="w-full h-full drop-shadow-md">
        <defs>
          <linearGradient id={grad} x1="0%" y1="0%" x2="50%" y2="100%">
            <stop offset="0%" stopColor="#2d2d2d" />
            <stop offset="100%" stopColor="#1a1a1a" />
          </linearGradient>
          <linearGradient id={highlight} x1="30%" y1="10%" x2="70%" y2="60%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.2)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </linearGradient>
        </defs>
        {/* Ombre */}
        <ellipse cx="60" cy="110" rx="24" ry="6" fill="rgba(0,0,0,0.1)" />
        {/* Corps de la machine (grip) - forme arrondie type poignée */}
        <path
          d="M52 28 L52 85 Q52 95 60 98 Q68 95 68 85 L68 28 Q68 18 60 15 Q52 18 52 28 Z"
          fill={`url(#${grad})`}
        />
        <path
          d="M52 28 L52 85 Q52 95 60 98 Q68 95 68 85 L68 28 Q68 18 60 15 Q52 18 52 28 Z"
          fill={`url(#${highlight})`}
        />
        {/* "Barrel" / tube au-dessus du grip */}
        <rect x="56" y="12" width="8" height="18" rx="2" fill="#1a1a1a" />
        <rect x="57" y="14" width="6" height="14" rx="1" fill="#333" />
        {/* Aiguille (tige fine) */}
        <line x1="60" y1="30" x2="60" y2="48" stroke="#555" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="60" cy="50" r="2" fill="#ff8c00" />
        {/* Visage sur le grip : yeux */}
        <ellipse cx="52" cy="48" rx="4" ry="5" fill="#fff" />
        <ellipse cx="68" cy="48" rx="4" ry="5" fill="#fff" />
        <circle cx="53" cy="49" r="2" fill="#1a1a1a" />
        <circle cx="69" cy="49" r="2" fill="#1a1a1a" />
        {/* Sourrire */}
        <path d="M50 58 Q60 66 70 58" stroke="#fff" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.9" />
        {/* Détail vis / écrou (accent métal) */}
        <circle cx="60" cy="72" r="4" fill="#444" stroke="#555" strokeWidth="1" />
      </svg>
    </div>
  );
};

/** Mascotte flacon d'encre de tatouage avec visage (style 3D doux) */
export const ArtistMascot: React.FC<{ className?: string; size?: number }> = ({ className = '', size = 72 }) => {
  const id = React.useId().replace(/:/g, '');
  const bodyGrad = `bodyGrad-${id}`;
  const accentGrad = `accentGrad-${id}`;
  return (
    <div className={`flex-shrink-0 ${className}`} style={{ width: size, height: size }} aria-hidden>
      <svg viewBox="0 0 100 100" fill="none" className="w-full h-full drop-shadow-md">
        <defs>
          <linearGradient id={bodyGrad} x1="0%" y1="0%" x2="40%" y2="100%">
            <stop offset="0%" stopColor="#1a1a1a" />
            <stop offset="100%" stopColor="#0a0a0a" />
          </linearGradient>
          <linearGradient id={accentGrad} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ff8c00" />
            <stop offset="100%" stopColor="#e67300" />
          </linearGradient>
        </defs>
        {/* Ombre */}
        <ellipse cx="50" cy="94" rx="20" ry="5" fill="rgba(0,0,0,0.12)" />
        {/* Corps du flacon (forme bouteille d'encre) */}
        <path
          d="M35 28 L35 78 Q35 88 50 88 Q65 88 65 78 L65 28 Q65 18 50 12 Q35 18 35 28 Z"
          fill={`url(#${bodyGrad})`}
        />
        <path d="M38 26 L38 76 Q38 84 50 84 Q62 84 62 76 L62 26 Q62 20 50 16 Q38 20 38 26 Z" fill="rgba(255,255,255,0.06)" />
        {/* Bouchon / pipette (accent orange) */}
        <rect x="44" y="8" width="12" height="14" rx="2" fill={`url(#${accentGrad})`} />
        <rect x="46" y="10" width="8" height="10" rx="1" fill="rgba(255,255,255,0.2)" />
        {/* Goutte d'encre qui pend (effet tatouage) */}
        <path
          d="M50 88 Q55 98 50 100 Q45 98 50 88 Z"
          fill="#1a1a1a"
        />
        <path d="M48 90 Q50 95 52 90 Z" fill="rgba(255,255,255,0.08)" />
        {/* Visage sur le flacon : yeux */}
        <ellipse cx="43" cy="48" rx="5" ry="6" fill="#fff" />
        <ellipse cx="57" cy="48" rx="5" ry="6" fill="#fff" />
        <circle cx="44" cy="49" r="2.5" fill="#1a1a1a" />
        <circle cx="58" cy="49" r="2.5" fill="#1a1a1a" />
        {/* Sourrire content */}
        <path d="M40 60 Q50 70 60 60" stroke="#fff" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.9" />
        {/* Étiquette "INK" stylisée */}
        <rect x="42" y="68" width="16" height="8" rx="1" fill="#333" opacity="0.8" />
        <text x="50" y="74" textAnchor="middle" fill="#fff" fontSize="5" fontFamily="system-ui" fontWeight="bold">INK</text>
      </svg>
    </div>
  );
};
