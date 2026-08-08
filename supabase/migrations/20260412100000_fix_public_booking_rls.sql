-- Fix: "new row violates row-level security policy" on public vitrine booking/request form
-- Re-applies the SECURITY DEFINER approach so anon users can insert into bookings
-- and project_requests when the studio exists.
-- This idempotently overwrites whatever state these policies are currently in.

-- SECURITY DEFINER helper: runs with postgres rights so anon can check studio existence
CREATE OR REPLACE FUNCTION public.studio_exists(sid text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (SELECT 1 FROM inkflow_studios WHERE id::text = sid);
$$;

GRANT EXECUTE ON FUNCTION public.studio_exists(text) TO anon, authenticated;

-- ── inkflow_bookings ───────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "bookings_public_insert" ON inkflow_bookings;
CREATE POLICY "bookings_public_insert" ON inkflow_bookings
  FOR INSERT
  WITH CHECK (
    studio_id IS NOT NULL
    AND public.studio_exists(studio_id)
  );

-- ── inkflow_project_requests ───────────────────────────────────────────────────
DROP POLICY IF EXISTS "project_requests_public_insert" ON inkflow_project_requests;
CREATE POLICY "project_requests_public_insert" ON inkflow_project_requests
  FOR INSERT
  WITH CHECK (
    studio_id IS NOT NULL
    AND public.studio_exists(studio_id)
  );

-- ── inkflow_messages (premier message depuis vitrine) ──────────────────────────
DROP POLICY IF EXISTS "messages_public_insert" ON inkflow_messages;
CREATE POLICY "messages_public_insert" ON inkflow_messages
  FOR INSERT
  WITH CHECK (
    studio_id IS NOT NULL
    AND public.studio_exists(studio_id)
    AND thread_id IS NOT NULL
  );
