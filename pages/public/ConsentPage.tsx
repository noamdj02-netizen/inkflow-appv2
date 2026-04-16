import React, { useState, useEffect } from 'react';
import { ConsentFormSign } from '../../components/consent/ConsentFormSign';
import { supabase } from '../../lib/supabase';
import { Logo } from '../../components/Logo';
import { SEO } from '../../components/SEO';

interface ConsentPageProps {
  consentId: string;
}

export const ConsentPage: React.FC<ConsentPageProps> = ({ consentId }) => {
  const [loading, setLoading] = useState(true);
  const [consent, setConsent] = useState<{ template: string; clientName: string; clientEmail: string; appointmentId?: string } | null>(null);
  const [alreadySigned, setAlreadySigned] = useState(false);

  useEffect(() => {
    supabase
      .from('inkflow_consent_forms')
      .select('*')
      .eq('id', consentId)
      .single()
      .then(({ data, error }) => {
        if (error || !data) {
          setConsent(null);
        } else if (data.signed_at) {
          setAlreadySigned(true);
        } else {
          setConsent({
            template: data.template,
            clientName: data.client_name,
            clientEmail: data.client_email,
            appointmentId: data.appointment_id,
          });
        }
        setLoading(false);
      });
  }, [consentId]);

  const handleSign = async (payload: { signatureData: string; filledTemplateText: string }) => {
    await supabase
      .from('inkflow_consent_forms')
      .update({
        signature_data: payload.signatureData,
        signed_at: new Date().toISOString(),
        filled_template_text: payload.filledTemplateText,
      })
      .eq('id', consentId);
  };

  const consentSeo = (
    <SEO
      title="Formulaire de consentement"
      description="Signature du consentement éclairé pour votre séance de tatouage (lien personnel, non indexé)."
      canonical={`/consent/${consentId}`}
      noindex
      ogImageAlt="Consentement tatouage InkFlow"
    />
  );

  if (loading) {
    return (
      <>
        {consentSeo}
        <div className="landing-scroll bg-neutral-50 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-neutral-200 border-t-neutral-900 rounded-full animate-spin" />
        </div>
      </>
    );
  }

  if (alreadySigned) {
    return (
      <>
        {consentSeo}
        <div className="landing-scroll bg-neutral-50 flex items-center justify-center px-4">
          <div className="text-center">
            <Logo />
            <h1 className="text-2xl font-bold mt-4 mb-2">Déjà signé</h1>
            <p className="text-neutral-600">Ce formulaire de consentement a déjà été signé. Merci !</p>
          </div>
        </div>
      </>
    );
  }

  if (!consent) {
    return (
      <>
        {consentSeo}
        <div className="landing-scroll bg-neutral-50 flex items-center justify-center px-4">
          <div className="text-center">
            <Logo />
            <h1 className="text-2xl font-bold mt-4 mb-2">Formulaire introuvable</h1>
            <p className="text-neutral-600">Ce lien n'est plus valide.</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      {consentSeo}
    <div className="landing-scroll bg-neutral-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <Logo />
        </div>
        <ConsentFormSign
          template={consent.template}
          clientName={consent.clientName}
          onSign={handleSign}
        />
      </div>
    </div>
    </>
  );
};
