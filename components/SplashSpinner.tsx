import React from 'react';

/** Loader centré, style du splash screen (fond noir, barre animée). */
export const SplashSpinner: React.FC = () => (
  <div
    className="fixed inset-0 z-[9998] flex items-center justify-center bg-black"
    aria-busy="true"
    role="status"
    aria-label="Chargement"
  >
    <div className="text-center">
      <div className="splash-loader mx-auto" />
    </div>
  </div>
);
