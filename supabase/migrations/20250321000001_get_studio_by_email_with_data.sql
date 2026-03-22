-- InkFlow: RPC get_studio_by_email_with_data
-- Le corps de la fonction (avec plan_type, csv_import_slots_remaining) est défini dans
-- 20250320170000_studio_plan_type_csv_quota.sql. Ne pas réintroduire ici un CREATE OR REPLACE
-- avec une ancienne signature : PostgreSQL refuserait de changer le type de retour (42P13).

COMMENT ON FUNCTION public.get_studio_by_email_with_data(text) IS 'Retourne le studio avec le plus de clients/RDV pour cet email (plan_type, csv_import_slots_remaining ; évite studio vide si plusieurs studios)';
