-- Empêche deux demandes (bookings) d'être confirmées pour le même créneau.
-- Si deux clients réservent le même créneau à la seconde près, seul le premier
-- pourra être confirmé ; le second recevra une erreur de contrainte.

CREATE UNIQUE INDEX IF NOT EXISTS idx_bookings_slot_unique_confirmed
  ON inkflow_bookings (studio_id, requested_date, COALESCE(requested_time, ''))
  WHERE status IN ('confirmed', 'accepted');

COMMENT ON INDEX idx_bookings_slot_unique_confirmed IS 'Empêche deux demandes confirmées pour le même créneau (studio, date, heure)';
