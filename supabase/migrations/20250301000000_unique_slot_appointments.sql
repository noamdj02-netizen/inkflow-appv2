-- Verrouillage créneau : un seul RDV par (studio_id, date, time) pour éviter les double-bookings.
-- Si deux utilisateurs tentent de réserver le même créneau, le second reçoit une erreur.

CREATE UNIQUE INDEX IF NOT EXISTS idx_appointments_slot_unique
  ON inkflow_appointments (studio_id, date, time);

-- Commentaire pour documentation
COMMENT ON INDEX idx_appointments_slot_unique IS 'Empêche les double-réservations sur un même créneau horaire';
