-- InkFlow: Diagnostic des studios et données pour un email
-- À exécuter dans Supabase Dashboard > SQL Editor (avec le rôle service_role ou postgres)
-- Remplacez 'noamdj02@gmail.com' par l'email à diagnostiquer

-- Liste des studios pour cet email avec le nombre de clients et RDV
SELECT
  s.id AS studio_id,
  s.studio_name,
  s.slug,
  s.subscription_status,
  s.trial_ends_at,
  s.updated_at,
  (SELECT COUNT(*) FROM inkflow_clients c WHERE c.studio_id = s.id) AS nb_clients,
  (SELECT COUNT(*) FROM inkflow_appointments a WHERE a.studio_id = s.id) AS nb_rdv,
  (SELECT COUNT(*) FROM inkflow_flash_designs f WHERE f.studio_id = s.id) AS nb_flash
FROM inkflow_studios s
WHERE s.email = 'noamdj02@gmail.com'
ORDER BY nb_clients DESC, nb_rdv DESC, s.updated_at DESC;
