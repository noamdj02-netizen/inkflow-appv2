-- Candidats pour rappel « créneau dépassé » (Europe/Paris) — utilisé par remind-slot-closeout-nudge
CREATE OR REPLACE FUNCTION public.inkflow_list_slot_end_nudges()
RETURNS TABLE(
  id text,
  studio_id text,
  client_id text,
  client_name text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    a.id,
    a.studio_id,
    a.client_id,
    a.client_name
  FROM inkflow_appointments a
  WHERE a.status IN ('confirmed', 'in_progress')
    AND a.post_slot_nudge_sent_at IS NULL
    AND (
      (
        (a.date + coalesce(nullif(trim(a.time), '')::time, time '09:00'))
        AT TIME ZONE 'Europe/Paris'
      )
      + make_interval(mins => greatest(coalesce(a.duration, 60), 1))
    ) < now();
$$;

COMMENT ON FUNCTION public.inkflow_list_slot_end_nudges() IS
  'RDV dont la fin (date+heure+duration, fuseau Paris) est passée, sans completed ni nudge déjà envoyé.';

GRANT EXECUTE ON FUNCTION public.inkflow_list_slot_end_nudges() TO service_role;
