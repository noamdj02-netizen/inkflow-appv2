-- Dernier envoi du lien de consentement (mail / SMS) — affichage dashboard + analytics légères

ALTER TABLE public.inkflow_consent_forms
  ADD COLUMN IF NOT EXISTS consent_outreach_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS consent_outreach_channel text;

COMMENT ON COLUMN public.inkflow_consent_forms.consent_outreach_sent_at IS 'Horodatage du dernier envoi du lien (Edge send-consent-request ou handoff SMS natif).';
COMMENT ON COLUMN public.inkflow_consent_forms.consent_outreach_channel IS 'Canal du dernier envoi : email | sms';
