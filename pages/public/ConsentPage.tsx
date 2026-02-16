import React, { useState, useEffect } from 'react';
import { ConsentFormSign } from '../../components/consent/ConsentFormSign';
import { supabase } from '../../lib/supabase';
import { Logo } from '../../components/Logo';

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

  const handleSign = async (signatureData: string) => {
    await supabase
      .from('inkflow_consent_forms')
      .update({ signature_data: signatureData, signed_at: new Date().toISOString() })
      .eq('id', consentId);
  };

  if (loading) {
    return (
      <div className="landing-scroll bg-neutral-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-neutral-200 border-t-neutral-900 rounded-full animate-spin" />
      </div>
    );
  }

  if (alreadySigned) {
    return (
      <div className="landing-scroll bg-neutral-50 flex items-center justify-center px-4">
        <div className="text-center">
          <Logo />
          <h1 className="text-2xl font-bold mt-4 mb-2">Deja signe</h1>
          <p className="text-neutral-600">Ce formulaire de consentement a deja ete signe. Merci !</p>
        </div>
      </div>
    );
  }

  if (!consent) {
    return (
      <div className="landing-scroll bg-neutral-50 flex items-center justify-center px-4">
        <div className="text-center">
          <Logo />
          <h1 className="text-2xl font-bold mt-4 mb-2">Formulaire introuvable</h1>
          <p className="text-neutral-600">Ce lien n'est plus valide.</p>
        </div>
      </div>
    );
  }

  return (
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
  );
};
