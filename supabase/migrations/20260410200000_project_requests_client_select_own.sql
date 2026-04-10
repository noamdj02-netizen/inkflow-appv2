-- Permet aux clients authentifiés de lire leurs propres demandes projet (même e-mail que sur la demande).
-- Nécessaire pour /messages/pr_* : vérifier l’identité sans exposer toutes les lignes au public.

DROP POLICY IF EXISTS "project_requests_client_self" ON inkflow_project_requests;
CREATE POLICY "project_requests_client_self" ON inkflow_project_requests
  FOR SELECT
  TO authenticated
  USING (
    auth.email() IS NOT NULL
    AND lower(trim(client_email)) = lower(trim(auth.email()))
  );
