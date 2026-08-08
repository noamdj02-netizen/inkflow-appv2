-- ============================================================
-- Nettoyage des données Mode Démo Marketing (seed-demo-marketing.mjs)
-- À exécuter dans Supabase Dashboard > SQL Editor
-- Supprime les lignes factices (préfixe demo_) du studio noamdj02@gmail.com :
-- clients, RDV, demandes vitrine — remet chiffres / listes à l’état « réel » vide si tout était seedé.
-- ============================================================

-- 1. RDV agenda (demo_apt_*)
DELETE FROM inkflow_appointments
WHERE studio_id IN (SELECT id FROM inkflow_studios WHERE lower(trim(email)) = 'noamdj02@gmail.com')
  AND id LIKE 'demo_%';

-- 2. Demandes réservation vitrine (demo_bk_*)
DELETE FROM inkflow_bookings
WHERE studio_id IN (SELECT id FROM inkflow_studios WHERE lower(trim(email)) = 'noamdj02@gmail.com')
  AND id LIKE 'demo_%';

-- 3. Fiches clients seed marketing (demo_cl_*)
DELETE FROM inkflow_clients
WHERE studio_id IN (SELECT id FROM inkflow_studios WHERE lower(trim(email)) = 'noamdj02@gmail.com')
  AND id LIKE 'demo_%';

-- Vérification (optionnel)
-- SELECT 'appointments', COUNT(*) FROM inkflow_appointments WHERE studio_id IN (SELECT id FROM inkflow_studios WHERE lower(trim(email)) = 'noamdj02@gmail.com')
-- UNION ALL SELECT 'bookings', COUNT(*) FROM inkflow_bookings WHERE studio_id IN (SELECT id FROM inkflow_studios WHERE lower(trim(email)) = 'noamdj02@gmail.com')
-- UNION ALL SELECT 'clients', COUNT(*) FROM inkflow_clients WHERE studio_id IN (SELECT id FROM inkflow_studios WHERE lower(trim(email)) = 'noamdj02@gmail.com');
