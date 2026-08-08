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
      .rpc('get_consent_form_for_public_portal', { p_id: consentId })
      .then(({ data, error }) => {
        const raw = Array.isArray(data) ? data[0] : data;
        if (error || !raw || typeof raw !== 'object') {
          setConsent(null);
        } else {
          const row = raw as {
            signed_at?: string | null;
            template?: string | null;
            client_name?: string | null;
            client_email?: string | null;
            appointment_id?: string | null;
          };
          if (row.signed_at) {
            setAlreadySigned(true);
          } else if (!row.template?.trim()) {
            setConsent(null);
          } else {
            setConsent({
              template: row.template,
              clientName: row.client_name || 'Client',
              clientEmail: row.client_email || '',
              appointmentId: row.appointment_id || undefined,
            });
          }
        }
        setLoading(false);
      });
  }, [consentId]);

  const handleSign = async (payload: { signatureData: string; filledTemplateText: string }) => {
    const { data: ok, error } = await supabase.rpc('submit_consent_form_signature', {
      p_id: consentId,
      p_signature_data: payload.signatureData,
      p_filled_template_text: payload.filledTemplateText,
    });
    if (error) throw new Error(error.message);
    if (ok !== true) throw new Error('Signature refusée ou formulaire déjà signé.');
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
