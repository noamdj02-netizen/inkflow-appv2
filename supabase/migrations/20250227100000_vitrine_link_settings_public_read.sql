-- Permet à la page publique /studio/:slug de lire la couleur primaire et les réglages lien (non sensibles)
CREATE POLICY "vitrine_link_public_select" ON inkflow_vitrine_link_settings
  FOR SELECT USING (true);
