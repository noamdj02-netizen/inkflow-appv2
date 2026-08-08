-- Collaborateurs : lien compte Auth + accès studio (RLS) + lecture studio pour les membres invités

-- 1) Lien optionnel vers auth.users (première connexion après invitation)
ALTER TABLE public.inkflow_artist_accounts
  ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_inkflow_artist_accounts_auth_user
  ON public.inkflow_artist_accounts(auth_user_id)
  WHERE auth_user_id IS NOT NULL;

COMMENT ON COLUMN public.inkflow_artist_accounts.auth_user_id IS
  'Rempli quand l’artiste a accepté l’invitation et s’est connecté avec cet email.';

-- 2) Politiques inkflow_artist_accounts — éviter la récursion avec inkflow_studio_ids_for_jwt()
DROP POLICY IF EXISTS "artist_accounts_owner" ON public.inkflow_artist_accounts;

CREATE POLICY "artist_accounts_select" ON public.inkflow_artist_accounts
  FOR SELECT
  USING (
    studio_id IN (
      SELECT s.id
      FROM public.inkflow_studios s
      WHERE lower(trim(COALESCE(s.email, ''))) = public.inkflow_jwt_email_norm()
    )
    OR auth_user_id = (SELECT auth.uid())
    OR (
      lower(trim(COALESCE(email, ''))) = public.inkflow_jwt_email_norm()
      AND auth_user_id IS NULL
    )
  );

CREATE POLICY "artist_accounts_insert_owner" ON public.inkflow_artist_accounts
  FOR INSERT
  WITH CHECK (
    studio_id IN (
      SELECT s.id
      FROM public.inkflow_studios s
      WHERE lower(trim(COALESCE(s.email, ''))) = public.inkflow_jwt_email_norm()
    )
  );

CREATE POLICY "artist_accounts_update_owner" ON public.inkflow_artist_accounts
  FOR UPDATE
  USING (
    studio_id IN (
      SELECT s.id
      FROM public.inkflow_studios s
      WHERE lower(trim(COALESCE(s.email, ''))) = public.inkflow_jwt_email_norm()
    )
  );

-- Premier lien : l’invité peut uniquement renseigner auth_user_id sur sa ligne (email pré-enregistré)
CREATE POLICY "artist_accounts_link_invitee" ON public.inkflow_artist_accounts
  FOR UPDATE
  USING (
    lower(trim(COALESCE(email, ''))) = public.inkflow_jwt_email_norm()
    AND auth_user_id IS NULL
  )
  WITH CHECK (
    auth_user_id = (SELECT auth.uid())
    AND lower(trim(COALESCE(email, ''))) = public.inkflow_jwt_email_norm()
  );

CREATE POLICY "artist_accounts_delete_owner" ON public.inkflow_artist_accounts
  FOR DELETE
  USING (
    studio_id IN (
      SELECT s.id
      FROM public.inkflow_studios s
      WHERE lower(trim(COALESCE(s.email, ''))) = public.inkflow_jwt_email_norm()
    )
  );

-- 3) Studios accessibles : propriétaire OU membre (ligne artiste avec même email ou auth_user_id)
CREATE OR REPLACE FUNCTION public.inkflow_studio_ids_for_jwt()
RETURNS SETOF text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT s.id
  FROM public.inkflow_studios s
  WHERE lower(trim(COALESCE(s.email, ''))) = lower(trim(COALESCE(auth.jwt()->>'email', '')))
  UNION
  SELECT a.studio_id
  FROM public.inkflow_artist_accounts a
  WHERE a.auth_user_id = (SELECT auth.uid())
     OR (
       lower(trim(COALESCE(a.email, ''))) = lower(trim(COALESCE(auth.jwt()->>'email', '')))
       AND (a.auth_user_id IS NULL OR a.auth_user_id = (SELECT auth.uid()))
     );
$$;

COMMENT ON FUNCTION public.inkflow_studio_ids_for_jwt() IS
  'Studios du propriétaire (email) + studios où l’utilisateur est artiste invité.';

-- 4) Lecture studio : alignée sur les IDs accessibles (inclut collaborateurs)
DROP POLICY IF EXISTS "studios_select_own" ON public.inkflow_studios;
CREATE POLICY "studios_select_own" ON public.inkflow_studios
  FOR SELECT
  USING (id IN (SELECT public.inkflow_studio_ids_for_jwt()));
