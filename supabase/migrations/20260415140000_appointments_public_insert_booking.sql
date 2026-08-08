-- Réservation publique /book : les clients ne sont pas authentifiés en tant que studio.
-- La politique appointments_insert_own (JWT = e-mail studio) bloque l’INSERT anon ;
-- on réintroduit un chemin public aligné sur inkflow_bookings / project_requests (studio_exists).

DROP POLICY IF EXISTS "appointments_public_insert_booking" ON inkflow_appointments;

CREATE POLICY "appointments_public_insert_booking" ON inkflow_appointments
  FOR INSERT
  WITH CHECK (
    studio_id IS NOT NULL
    AND public.studio_exists(studio_id)
    AND coalesce(status, 'pending') = 'pending'
    AND coalesce(deposit_paid, false) = false
  );

COMMENT ON POLICY "appointments_public_insert_booking" ON inkflow_appointments IS
  'Permet aux visiteurs (anon) de créer un RDV « pending » depuis /book avant redirection Stripe.';
