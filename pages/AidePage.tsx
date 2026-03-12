import React, { useEffect } from 'react';
import { ArrowLeft, CreditCard, HelpCircle, Bell } from 'lucide-react';
import { Logo } from '../components/Logo';
import { LANDING_URL } from '../lib/urls';

export const AidePage: React.FC = () => {
  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (hash) {
      const el = document.getElementById(hash);
      el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  return (
    <div className="landing-scroll bg-neutral-50 min-h-screen flex flex-col">
      <header className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-neutral-200/80 safe-top">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <a href={LANDING_URL} className="inline-flex items-center gap-2 text-neutral-600 hover:text-neutral-900 transition-colors">
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Retour</span>
          </a>
          <div className="flex items-center gap-2">
            <Logo size="sm" />
            <span className="font-bold text-neutral-900">InkFlow</span>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <h1 className="text-3xl sm:text-4xl font-bold text-neutral-900 mb-2 flex items-center gap-3">
          <HelpCircle className="w-10 h-10 text-indigo-600" />
          Aide
        </h1>
        <p className="text-neutral-500 text-sm mb-10">
          Solutions aux problèmes courants.
        </p>

        <section id="paiement" className="scroll-mt-24">
          <h2 className="text-xl font-semibold text-neutral-900 mb-3 flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-indigo-600" />
            Lien de paiement (acompte) indisponible
          </h2>
          <p className="text-neutral-700 mb-4">
            Si vous voyez un message d&apos;erreur lors de la génération d&apos;un lien de paiement Stripe (depuis la vitrine ou le dashboard), vérifiez les points suivants.
          </p>
          <ul className="list-disc pl-6 space-y-2 text-neutral-700 mb-4">
            <li><strong>Projet Supabase en pause</strong> : sur le <a href="https://app.supabase.com" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">Dashboard Supabase</a>, si une bannière indique que le projet est en pause, cliquez sur « Restore project » et attendez la fin de la restauration.</li>
            <li><strong>Fonction non déployée</strong> : l&apos;Edge Function <code className="bg-neutral-200 px-1.5 py-0.5 rounded text-sm">create-checkout-session</code> doit être déployée. À la racine du projet, exécutez : <code className="block mt-2 bg-neutral-800 text-neutral-100 p-3 rounded-lg text-sm overflow-x-auto">npx supabase login</code> puis <code className="block mt-1 bg-neutral-800 text-neutral-100 p-3 rounded-lg text-sm overflow-x-auto">npx supabase link --project-ref VOTRE_REF</code> et <code className="block mt-1 bg-neutral-800 text-neutral-100 p-3 rounded-lg text-sm overflow-x-auto">npx supabase functions deploy create-checkout-session</code>.</li>
            <li><strong>Secrets Stripe manquants</strong> : dans Supabase → Edge Functions → Secrets, définissez <code className="bg-neutral-200 px-1.5 py-0.5 rounded text-sm">STRIPE_SECRET_KEY</code> (clé secrète Stripe) et <code className="bg-neutral-200 px-1.5 py-0.5 rounded text-sm">SITE_URL</code> (URL de votre site, ex. https://votredomaine.com). Redéployez la fonction après avoir ajouté les secrets.</li>
            <li><strong>Erreur Stripe (clé invalide, etc.)</strong> : le message d&apos;erreur affiché dans la modale provient de Stripe ou de Supabase. Consultez les logs dans Supabase → Edge Functions → create-checkout-session pour plus de détails.</li>
          </ul>
          <p className="text-neutral-600 text-sm">
            Pour une procédure détaillée, reportez-vous à la documentation du projet (déploiement de l&apos;Edge Function create-checkout-session).
          </p>
        </section>

        <section id="push" className="scroll-mt-24 mt-12">
          <h2 className="text-xl font-semibold text-neutral-900 mb-3 flex items-center gap-2">
            <Bell className="w-6 h-6 text-indigo-600" />
            Notifications push
          </h2>
          <p className="text-neutral-700 mb-4">
            Les notifications push nécessitent une PWA installée (mode app) ou la clé VAPID configurée.
          </p>
          <ul className="list-disc pl-6 space-y-2 text-neutral-700 mb-4">
            <li><strong>Sur mobile</strong> : « Ajouter à l&apos;écran d&apos;accueil » depuis le navigateur, puis ouvrir InkFlow depuis l&apos;icône. Les push ne fonctionnent qu&apos;en mode app installée (sans barre d&apos;adresse).</li>
            <li><strong>Clé VAPID</strong> : génère les clés avec <code className="bg-neutral-200 px-1.5 py-0.5 rounded text-sm">npm run vapid:generate</code>. Mets la clé publique dans <code className="bg-neutral-200 px-1.5 py-0.5 rounded text-sm">VITE_VAPID_PUBLIC_KEY</code> (Vercel) et les deux clés dans Supabase Edge Function Secrets.</li>
            <li><strong>Voir la doc</strong> : <code className="bg-neutral-200 px-1.5 py-0.5 rounded text-sm">docs/WEB-PUSH.md</code></li>
          </ul>
        </section>
      </main>
    </div>
  );
};
