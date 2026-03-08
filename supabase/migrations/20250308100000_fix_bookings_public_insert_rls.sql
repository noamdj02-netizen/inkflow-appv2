-- Fix: "new row violates row-level security policy" on public booking form
-- The WITH CHECK (studio_id IN (SELECT id FROM inkflow_studios)) is evaluated as anon,
-- and anon may not see rows in inkflow_studios in some setups. Use a SECURITY DEFINER
-- function so the existence check runs with definer rights and always sees the table.

CREATE OR REPLACE FUNCTION public.studio_exists(sid text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (SELECT 1 FROM inkflow_studios WHERE id = sid);
$$;

-- Replace the public insert policy to use the function instead of a subquery
DROP POLICY IF EXISTS "bookings_public_insert" ON inkflow_bookings;
CREATE POLICY "bookings_public_insert" ON inkflow_bookings
  FOR INSERT
  WITH CHECK (
    studio_id IS NOT NULL
    AND public.studio_exists(studio_id)
  );

-- Same fix for project requests (demandes de projet depuis la vitrine)
DROP POLICY IF EXISTS "project_requests_public_insert" ON inkflow_project_requests;
CREATE POLICY "project_requests_public_insert" ON inkflow_project_requests
  FOR INSERT
  WITH CHECK (
    studio_id IS NOT NULL
    AND public.studio_exists(studio_id)
  );

-- Same fix for messages (premier message depuis la vitrine / conversation client)
DROP POLICY IF EXISTS "messages_public_insert" ON inkflow_messages;
CREATE POLICY "messages_public_insert" ON inkflow_messages
  FOR INSERT
  WITH CHECK (
    studio_id IS NOT NULL
    AND public.studio_exists(studio_id)
    AND thread_id IS NOT NULL
  );
