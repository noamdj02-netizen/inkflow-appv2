-- Photo de profil client au moment de la demande (affichage côté tatoueur)
ALTER TABLE inkflow_bookings ADD COLUMN IF NOT EXISTS client_avatar_url TEXT;

COMMENT ON COLUMN inkflow_bookings.client_avatar_url IS 'URL publique de la photo profil (espace client / OAuth) au moment de la demande.';
