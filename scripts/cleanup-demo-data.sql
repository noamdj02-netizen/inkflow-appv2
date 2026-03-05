-- ============================================================
-- Nettoyage des données Mode Démo Marketing
-- À exécuter dans Supabase Dashboard > SQL Editor
-- Supprime toutes les fausses données (préfixe demo_) du studio noamdj02@gmail.com
-- ============================================================

-- 1. Supprimer les appointments demo
DELETE FROM inkflow_appointments
WHERE studio_id IN (SELECT id FROM inkflow_studios WHERE email = 'noamdj02@gmail.com')
  AND id LIKE 'demo_%';

-- 2. Supprimer les bookings demo
DELETE FROM inkflow_bookings
WHERE studio_id IN (SELECT id FROM inkflow_studios WHERE email = 'noamdj02@gmail.com')
  AND id LIKE 'demo_%';

-- Vérification (optionnel) : compter les lignes restantes
-- SELECT COUNT(*) FROM inkflow_appointments WHERE studio_id IN (SELECT id FROM inkflow_studios WHERE email = 'noamdj02@gmail.com');
-- SELECT COUNT(*) FROM inkflow_bookings WHERE studio_id IN (SELECT id FROM inkflow_studios WHERE email = 'noamdj02@gmail.com');
