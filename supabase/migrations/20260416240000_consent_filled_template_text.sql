-- Texte du formulaire tel que complété par le client (zones soulignées remplies), archivé avec la signature.

ALTER TABLE public.inkflow_consent_forms
  ADD COLUMN IF NOT EXISTS filled_template_text TEXT;

COMMENT ON COLUMN public.inkflow_consent_forms.filled_template_text IS
  'Texte du modèle avec les champs soulignés remplis par le client au moment de la signature.';
