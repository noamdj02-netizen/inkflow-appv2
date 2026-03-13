/**
 * /invite/:code — Redirige vers /signup?ref=code pour le parrainage
 * Permet d'utiliser des liens courts : inkflow.me/invite/ABC123
 */
import React, { useEffect } from 'react';

interface InviteRedirectPageProps {
  code: string;
}

export const InviteRedirectPage: React.FC<InviteRedirectPageProps> = ({ code }) => {
  useEffect(() => {
    const ref = code?.trim().toUpperCase() || '';
    const target = ref ? `/signup?ref=${encodeURIComponent(ref)}` : '/signup';
    window.location.replace(target);
  }, [code]);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <p className="text-zinc-500">Redirection…</p>
    </div>
  );
};
