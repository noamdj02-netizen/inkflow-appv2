import React from 'react';

interface PublicBookingPageProps {
  studioSlug: string;
}

export const PublicBookingPage: React.FC<PublicBookingPageProps> = ({ studioSlug }) => {
  return (
    <div className="min-h-screen bg-neutral-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-2xl shadow-lg border border-neutral-200 p-8">
          <h1 className="text-3xl font-bold mb-2">Réserver un rendez-vous</h1>
          <p className="text-neutral-600 mb-8">Studio: {studioSlug}</p>
          <div className="text-center py-12">
            <p className="text-neutral-500">Formulaire de réservation à implémenter</p>
            <a href={`/studio/${studioSlug}`} className="inline-block mt-4 text-neutral-900 font-semibold hover:underline">
              ← Retour à la page studio
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
