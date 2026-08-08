import React from 'react';
import { SEO } from '@/components/SEO';
import { DashboardInteractiveSandbox } from '@/components/demo/DashboardInteractiveSandbox';

/** Page démo publique — dashboard InkFlow Pro interactif (données fictives, sans compte). */
export const DashboardDemoPage: React.FC = () => {
  return (
    <>
      <SEO
        title="Démo interactive du tableau de bord"
        description="Explorez le dashboard InkFlow Pro : agenda, demandes, clients, acomptes Stripe — mode démo sans inscription."
        canonical="/dashboard-demo"
        keywords="démo InkFlow, essai logiciel tatouage, tableau de bord tattoo"
        ogImageAlt="Démo InkFlow — tableau de bord tatoueur"
      />
      <DashboardInteractiveSandbox />
    </>
  );
};

export default DashboardDemoPage;
