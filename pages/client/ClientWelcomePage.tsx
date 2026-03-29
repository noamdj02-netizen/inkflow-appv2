/**
 * Ancienne page « prénom » — conservée uniquement pour les liens / bookmarks.
 * Redirection immédiate vers le dashboard client.
 */
import React, { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

export const ClientWelcomePage: React.FC = () => {
  useEffect(() => {
    window.location.replace('/client/dashboard');
  }, []);

  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-black" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
      <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#DFFF00' }} aria-hidden />
      <span className="sr-only">Redirection…</span>
    </div>
  );
};
