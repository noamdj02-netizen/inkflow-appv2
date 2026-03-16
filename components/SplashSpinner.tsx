import React from 'react';

/** Loader centré, style du splash screen (fond noir, logo avec lumière). */
export const SplashSpinner: React.FC = () => (
  <div
    className="fixed inset-0 z-[9998] flex items-center justify-center bg-black"
    aria-busy="true"
    role="status"
    aria-label="Chargement"
  >
    <div className="text-center">
      <div className="relative w-[120px] h-[120px] mx-auto">
        {/* Glow effect */}
        <div 
          className="absolute -inset-10 rounded-full animate-pulse"
          style={{
            background: 'radial-gradient(circle, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0.15) 30%, rgba(255,255,255,0) 70%)'
          }}
        />
        <div 
          className="absolute -inset-5 rounded-full animate-pulse"
          style={{
            background: 'radial-gradient(circle, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0) 60%)',
            animationDelay: '0.3s'
          }}
        />
        {/* Logo */}
        <img 
          src="/logo-inkflow.png" 
          alt="InkFlow" 
          className="relative z-10 w-[120px] h-[120px] object-contain"
          style={{ animation: 'splash-logo-breathe 2.5s ease-in-out infinite' }}
        />
      </div>
      <div className="splash-loader mx-auto mt-8" />
    </div>
  </div>
);
