-- Migration: Mise à jour de inkflow_project_requests pour le MVP
-- Structure optimisée pour une prise de décision rapide par le tatoueur

-- 1. Ajouter la colonne project_type si elle n'existe pas
ALTER TABLE inkflow_project_requests 
ADD COLUMN IF NOT EXISTS project_type TEXT NOT NULL DEFAULT 'custom';

COMMENT ON COLUMN inkflow_project_requests.project_type IS 'Type de projet: flash ou custom';

-- 2. Renommer size en estimated_size pour plus de clarté (si la colonne existe)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'inkflow_project_requests' AND column_name = 'size'
  ) THEN
    ALTER TABLE inkflow_project_requests RENAME COLUMN size TO estimated_size;
  END IF;
END $$;

-- 3. Ajouter estimated_size si elle n'existe pas encore
ALTER TABLE inkflow_project_requests 
ADD COLUMN IF NOT EXISTS estimated_size TEXT;

COMMENT ON COLUMN inkflow_project_requests.estimated_size IS 'Taille estimée: "10cm", "Tout le bras", etc.';

-- 4. Ajouter reference_image_url (URL unique vers Storage) si elle n'existe pas
ALTER TABLE inkflow_project_requests 
ADD COLUMN IF NOT EXISTS reference_image_url TEXT;

COMMENT ON COLUMN inkflow_project_requests.reference_image_url IS 'URL vers l''image de référence dans Supabase Storage';

-- 5. Normaliser le statut en minuscules (pending, accepted, rejected)
UPDATE inkflow_project_requests 
SET status = LOWER(status)
WHERE status != LOWER(status);

-- 6. Mettre à jour la valeur par défaut du status
ALTER TABLE inkflow_project_requests 
ALTER COLUMN status SET DEFAULT 'pending';

-- 7. S'assurer que placement est NOT NULL avec une valeur par défaut
ALTER TABLE inkflow_project_requests 
ALTER COLUMN placement SET DEFAULT '';

-- 8. Ajouter des commentaires sur les colonnes pour la documentation
COMMENT ON TABLE inkflow_project_requests IS 'Demandes de projet de tatouage - MVP optimisé pour prise de décision rapide';
COMMENT ON COLUMN inkflow_project_requests.client_name IS 'Nom du client';
COMMENT ON COLUMN inkflow_project_requests.client_email IS 'Email du client pour les notifications';
COMMENT ON COLUMN inkflow_project_requests.description IS 'Description du projet ou nom du Flash';
COMMENT ON COLUMN inkflow_project_requests.placement IS 'Zone du corps: Avant-bras, Dos, Côtes, etc.';
COMMENT ON COLUMN inkflow_project_requests.status IS 'État: pending, accepted, rejected';

-- 9. Index supplémentaire pour les requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_project_requests_created_at 
ON inkflow_project_requests(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_project_requests_project_type 
ON inkflow_project_requests(project_type);
